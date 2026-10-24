import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from './ai-provider.service';
import { EducationalRagService, CurriculumContext } from './educational-rag.service';

export type GenerationOutputType =
  | 'lesson_structure'       // البناء التعلمي للدرس
  | 'lesson_memo'            // مذكرة/جذاذة الدرس
  | 'diagnostic_assessment'  // تقويم تشخيصي
  | 'formative_assessment'   // تقويم تكويني
  | 'exam_with_rubric'       // اختبار مع سلم تنقيط
  | 'evaluation_grid'        // شبكة تقييم ومعالجة
  | 'integration_situation'  // وضعية إدماجية
  | 'remediation_plan';      // خطة الدعم والمعالجة

export interface GenerationRequest {
  lessonId: string;
  outputType: GenerationOutputType;
  targetStudentLevel?: 'weak' | 'average' | 'advanced' | 'mixed';
  questionCount?: number;
  durationMinutes?: number;
  additionalContext?: string;
}

export interface GenerationResponse {
  outputType: GenerationOutputType;
  title: string;
  content: string;               // Structured Arabic content (markdown)
  structuredData?: any;          // Parsed JSON if AI returned structured data
  curriculumSource: {
    lessonTitle: string;
    unitTitle: string;
    subjectName: string;
    gradeLevel: string;
    textbookPages?: string;
  };
  provider: string;
  model: string;
  fromFallback: boolean;         // true if AI unavailable and fell back to DB content
  generatedAt: string;
}

@Injectable()
export class EducationalGenerationService {
  private readonly logger = new Logger(EducationalGenerationService.name);

  constructor(
    private readonly aiProvider: AiProviderService,
    private readonly rag: EducationalRagService,
  ) {}

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const context = await this.rag.getCurriculumContext(request.lessonId);
    
    const curriculumSource = {
      lessonTitle: context.lesson.title,
      unitTitle: context.unit.title,
      subjectName: context.subject.nameAr,
      gradeLevel: this.formatGradeLevel(context.course.gradeLevel),
      textbookPages: context.unit.pdfStartPage && context.unit.pdfEndPage
        ? `ص${context.unit.pdfStartPage} - ص${context.unit.pdfEndPage}`
        : ((context.lesson as any).pdfStartPage && (context.lesson as any).pdfEndPage ? `ص${(context.lesson as any).pdfStartPage} - ص${(context.lesson as any).pdfEndPage}` : undefined),
    };

    // Try AI first, fall back to rich curriculum engine if AI is unavailable or fails
    if (!this.aiProvider.isConfigured()) {
      this.logger.warn('AI provider not configured — using enriched curriculum pedagogical engine');
      return this.generateFallback(request, context, curriculumSource);
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request, context);

      const aiResult = await this.aiProvider.generateCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const parsed = this.parseAiResponse(aiResult.content, request.outputType);

      return {
        outputType: request.outputType,
        title: parsed.title || this.getOutputTypeTitle(request.outputType, context.lesson.title),
        content: parsed.content || aiResult.content,
        structuredData: parsed.structuredData,
        curriculumSource,
        provider: aiResult.provider,
        model: aiResult.model,
        fromFallback: false,
        generatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(`AI generation failed: ${error.message} — falling back to enriched curriculum engine`);
      return this.generateFallback(request, context, curriculumSource);
    }
  }

  /**
   * Assists a teacher with assignment creation (suggest, auto-complete, or refine).
   */
  async assistAssignment(dto: {
    title?: string;
    subject?: string;
    existingDescription?: string;
    type?: string;
    maxScore?: number;
    cohortId?: string;
  }): Promise<{
    suggestedTitle: string;
    suggestedSubject: string;
    suggestedType: string;
    suggestedMaxScore: number;
    suggestedDescription: string;
    explanation: string;
    provider: string;
    model: string;
  }> {
    const rawTitle = (dto.title || '').trim();
    const rawSubject = (dto.subject || '').trim();
    const rawDesc = (dto.existingDescription || '').trim();
    const targetType = dto.type || 'assignment';
    const maxScore = Number(dto.maxScore) || 20;

    // If AI provider is configured, call AI
    if (this.aiProvider.isConfigured()) {
      try {
        const systemPrompt = `أنت مساعد تربوي ذكي ورفيق للأستاذ في منصة باقون التعليمية.
مهمتك مساعدة الأستاذ في بناء وصياغة وتكميل واجب منزلي أو تكليف بيداغوجي بطريقة احترافية متكاملة تجمع بين رغبة الأستاذ والمعايير التربوية.
المطلوب صياغة واجب منسق باللغة العربية يشمل:
1. عنوان دقيق ومناسب.
2. تحديد المبحث بدقة.
3. تفاصيل الواجب تشمل: تعليمات واضحة للطلبة، 3 إلى 4 أسئلة تطبيقية متدرجة، وسلم توزيع الدرجات المقترح من إجمالي ${maxScore} درجة.
أعد النتيجة حصراً بتنسيق JSON بالشكل التالي:
{
  "suggestedTitle": "عنوان الواجب المقترح",
  "suggestedSubject": "المبحث / موضوع الدرس",
  "suggestedType": "${targetType}",
  "suggestedMaxScore": ${maxScore},
  "suggestedDescription": "نص الواجب الكامل المنسق والأسئلة وسلم التنقيط",
  "explanation": "شرح موجز للأستاذ حول بنية الواجب وكيف تم تكميله"
}`;

        const userPrompt = `معطيات الأستاذ الحالية:
- العنوان المدخل: ${rawTitle || 'غير محدد بعد'}
- المبحث المدخل: ${rawSubject || 'غير محدد بعد'}
- نوع التكليف: ${targetType}
- مسودة الأستاذ / الملاحظات الحالية: ${rawDesc || 'لا توجد تفاصيل بعد، اقترح واجباً متكاملاً ومناسباً للمنهاج'}

قم بإكمال وصياغة الواجب بالكامل بأسلوب تربوي متميز وسلس.`;

        const res = await this.aiProvider.generateCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);

        const jsonMatch = res.content.match(/```json\s*([\s\S]*?)```/i) || res.content.match(/\{[\s\S]*"suggestedTitle"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          return {
            suggestedTitle: parsed.suggestedTitle || rawTitle || 'واجب تطبيقي منزلي',
            suggestedSubject: parsed.suggestedSubject || rawSubject || 'المقرر العام',
            suggestedType: parsed.suggestedType || targetType,
            suggestedMaxScore: parsed.suggestedMaxScore || maxScore,
            suggestedDescription: parsed.suggestedDescription || res.content,
            explanation: parsed.explanation || 'تم إكمال وصياغة الواجب بالذكاء الاصطناعي استناداً لفكرتك.',
            provider: res.provider,
            model: res.model,
          };
        }
      } catch (err: any) {
        this.logger.warn(`AI assistAssignment error: ${err.message} — falling back to synthesis engine`);
      }
    }

    // High quality pedagogical fallback:
    return this.synthesizeAssignmentAssistance(rawTitle, rawSubject, rawDesc, targetType, maxScore);
  }

  private synthesizeAssignmentAssistance(
    title: string,
    subject: string,
    desc: string,
    type: string,
    maxScore: number,
  ) {
    const finalSubject = subject || (title.includes('فيزياء') ? 'فيزياء' : title.includes('رياضيات') ? 'رياضيات' : title.includes('عربية') || title.includes('لغة') ? 'لغة عربية' : 'المقرر العام');
    const finalTitle = title || `واجب تطبيقي في ${finalSubject}`;

    const q1Score = Math.round(maxScore * 0.3);
    const q2Score = Math.round(maxScore * 0.4);
    const q3Score = maxScore - q1Score - q2Score;

    let richDescription = `### 📌 تعليمات وإرشادات الإنجاز:
- يُطلب من جميع الطلبة قراءة الأسئلة بعناية وتدوين الحل بخط واضح ومنظم.
- يُرجى مراعاة استخدام المصطلحات العلمية السليمة وتبرير الخطوات.
${desc ? `\n### 📝 ملاحظات ومسودة الأستاذ:\n${desc}\n` : ''}
---

### ❓ أسئلة التكليف:

#### السؤال الأول (${q1Score} درجات): استرجاع وتنظيم المفاهيم
- اشرح المفاهيم الجوهرية المرتبطة بموضوع **«${finalTitle}»** مع ذكر مثالين توضيحيين.

#### السؤال الثاني (${q2Score} درجات): تطبيق مباشر وحل مسألة
- طبّق القواعد المدروسة لمعالجة المسألة التطبيقية التالية وبيّن خطوات الحل بدقة:
  1. تحديد المعطيات واستدعاء القاعدة المناسبة.
  2. إجراء الحسابات أو البرهان العلمي مع التبرير المنطقي.

#### السؤال الثالث (${q3Score} درجات): استنتاج وموقف تحليلي
- قدّم خلاصة تحليلية في 3 أسطر تُبرز كيف تساهم هذه المفاهيم في حل المشكلات المرتبطة بالواقع العملي لمادة ${finalSubject}.

---

### ⚖️ سلّم توزيع الدرجات (${maxScore} درجة):
- **السؤال 1:** ${q1Score} ن (دقة التعريف والوضوح).
- **السؤال 2:** ${q2Score} ن (صحة الخطوات والنتائج).
- **السؤال 3:** ${q3Score} ن (سلامة التعليل والاستنتاج).
- يُخصم نصف نقطة في حال عدم وضوح الخط أو عدم تنظيم ورقة الإجابة.`;

    return {
      suggestedTitle: finalTitle,
      suggestedSubject: finalSubject,
      suggestedType: type,
      suggestedMaxScore: maxScore,
      suggestedDescription: richDescription,
      explanation: 'قام المساعد الذكي بصياغة واجب متكامل ومتدرج مع تعليمات وسلم تنقيط استناداً إلى فكرتك.',
      provider: 'pedagogical_copilot',
      model: 'copilot_synthesizer_v1',
    };
  }

  // ─── System Prompt (Enriched for Maximum Pedagogical Depth) ─────────────────

  private buildSystemPrompt(): string {
    return `أنت خبير ومفتش تربوي متخصص في المناهج التعليمية الجزائرية والفلسطينية والمقاربة بالكفاءات (APC).
مهمتك إعداد وثائق بيداغوجية احترافية، ثرية جداً، مفصلة، ودقيقة باللغة العربية الفصحى.

القواعد المنهجية والتربوية الصارمة:
1. الثراء والتفصيل: لا تقدم ملخصات موجزة أو رؤوس أقلام فقط، بل قدّم وثيقة تربوية كاملة وشاملة تتضمن تفاصيل الأنشطة، الأسئلة المتدرجة، سلم التنقيط المفصل، ومعايير التقييم الدقيقة، وجداول السيرورة.
2. الالتزام الصارم بالمنهاج: اعتمد على معطيات المادة، الطور، الشعبة، والدرس والأهداف المذكورة في السياق المرفق حصراً دون اختلاق مراجع أو أرقام صفحات غير موجودة.
3. معايير المقاربة بالكفاءات (APC):
   - استخدام معايير التقويم الرسمية: م1 (الوجاهة وملاءمة المنتوج)، م2 (الاستعمال السليم لأدوات المادة)، م3 (انسجام المنتوج وتسلسله المنطقي)، م4 (الإتقان والتميز).
   - التدرج وفق مستويات بلوم (تذكر، فهم، تطبيق، تحليل، تركيب، تقويم).
4. التنسيق: استخدم جداول Markdown المنظمة، العناوين المنسقة، والتقسيم الزمني الدقيق.
5. الإخراج: أعد الإجابة دائماً بتنسيق JSON على النحو التالي:
{"title": "عنوان الوثيقة", "content": "المحتوى الكامل والثرى بالعربية", "structuredData": {...}}`;
  }

  // ─── User Prompt Builder ─────────────────────────────────────────────────────

  private buildUserPrompt(request: GenerationRequest, ctx: CurriculumContext): string {
    const { lesson, unit, course, subject, existingQuestions } = ctx;
    
    const levelMap: Record<string, string> = {
      weak: 'يحتاج إلى دعم وتدرج مبسط',
      average: 'متوسط المستوى (المستوى القياسي للمنهاج)',
      advanced: 'متقدم ومتميز (يتطلب تعميقاً وتحدياً فكرياً)',
      mixed: 'متباين المستوى (مراعاة الفروق الفردية في القسم)',
    };

    const contextSection = `
=== بيانات المنهاج الرسمية المعتمدة ===
- المادة: ${subject.nameAr} (${subject.code})
- المستوى والطور: ${this.formatGradeLevel(course.gradeLevel)} — شعبة: ${this.formatBranch(course.academicBranch)}
- نوع المنهاج: ${course.curriculumType === 'governmental' ? 'المنهاج الرسمي الوزاري' : course.curriculumType}
- الوحدة التعليمية: ${unit.title}${unit.unitNumber ? ` (رقم ${unit.unitNumber})` : ''}
${unit.pdfStartPage ? `- المرجع في الكتاب المدرسي: الصفحات من ${unit.pdfStartPage} إلى ${unit.pdfEndPage}` : ''}
- عنوان الدرس: ${lesson.title}
${lesson.domain ? `- المجال المعرفي / الميدان: ${lesson.domain}` : ''}
${lesson.lessonType ? `- نمط النشاط: ${lesson.lessonType}` : ''}
- الحجم الزمني المقرر: ${lesson.estimatedDurationMinutes || request.durationMinutes || 55} دقيقة

الأهداف والكفاءات التعلمية المسجلة في المنهاج:
${(lesson.learningObjectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n') || '- استيعاب المفاهيم الأساسية وتطبيقها عملياً وفق كفاءات الوحدة'}

${lesson.teacherGuide ? `توجيهات دليل المعلم المرفقة:\n${lesson.teacherGuide}` : ''}

${existingQuestions.length > 0 ? `نماذج أسئلة مسبقة في بنك المنهاج (${existingQuestions.length} أسئلة):\n${existingQuestions.slice(0, 5).map((q, i) => `${i + 1}. [${q.type}] ${q.content}`).join('\n')}` : ''}

${request.additionalContext ? `توجيهات خاصة وملاحظات من الأستاذ:\n${request.additionalContext}` : ''}
`;

    const outputGuide = this.getOutputTypePromptGuide(request.outputType, {
      questionCount: request.questionCount || 5,
      durationMinutes: request.durationMinutes || lesson.estimatedDurationMinutes || 55,
      targetLevel: levelMap[request.targetStudentLevel || 'mixed'] || 'متباين المستوى',
    });

    return `${contextSection}\n\n=== المطلوب بالتفصيل ===\n${outputGuide}`;
  }

  // ─── Output Type Prompt Guides ───────────────────────────────────────────────

  private getOutputTypePromptGuide(
    outputType: GenerationOutputType,
    params: { questionCount: number; durationMinutes?: number; targetLevel: string },
  ): string {
    const { questionCount, durationMinutes, targetLevel } = params;

    const guides: Record<GenerationOutputType, string> = {
      lesson_structure: `
أعدَّ وثيقة **البناء التعلّمي للدرس** متكاملة وثلاثية المراحل وفق المقاربة بالكفاءات (APC).
يجب أن تشمل:
1. بطاقة الهوية التربوية وتحديد الكفاءة الشاملة والختامية ومؤشرات الكفاءة بدقة.
2. مرحلة الانطلاق والتهيئة (${Math.round((durationMinutes || 55) * 0.1)} دقيقة): وضعية مشكلة انطلاقية دالة من واقع التلميذ + استرجاع المكتسبات القبلية ورصد التصورات.
3. مرحلة بناء التعلمات والأنشطة الاستكشافية (${Math.round((durationMinutes || 55) * 0.6)} دقيقة): تفصيل نشاطين تعليميين كاملين (السند، السيرورة، دور الأستاذ الموجه، دور المتعلم الإيجابي).
4. مرحلة الهيكلة وإرساء الموارد المعرفية (${Math.round((durationMinutes || 55) * 0.15)} دقيقة): خلاصة تركيبية ومخطط مفاهيمي دقيق.
5. مرحلة التقويم والتطبيق (${Math.round((durationMinutes || 55) * 0.15)} دقيقة): تمرين فوري ومؤشرات التحقق.
6. المعالجة البيداغوجية الاستباقية لتجاوز صعوبات التعلم المتوقعة.`,

      lesson_memo: `
أعدَّ **مذكرة / جذاذة الدرس الرسمية النموذجية** وفق المعايير الوزارية التفتيشية.
يجب أن تتضمن:
- ترويسة المذكرة الرسمية كاملة (المؤسسة، المادة، المستوى، الشعبة، رقم المذكرة، الوسائل، السندات، المدة ${durationMinutes || 55} د).
- الكفاءة الختامية، المركبات، والأهداف التعلمية الإجرائية.
- جدول السيرورة البيداغوجية المتكامل (المراحل، الأهداف المرحلية، نشاط الأستاذ التوجيهي، نشاط المتعلم البنائي، شكل العمل، التقويم التكويني، التوقيت).
- التقويم المرحلي والختامي ومؤشرات الإنجاز.
- بطاقة التقييم الذاتي للحصة وملاحظات ما بعد التنفيذ.`,

      diagnostic_assessment: `
أعدَّ أداة **تقويم تشخيصي قبلي** متكاملة لقياس الفجوات المعرفية قبل خوض الدرس.
- المستوى المستهدف: ${targetLevel}.
- عدد الأسئلة: ${questionCount} أسئلة متدرجة تقيس المكتسبات القبلية الضرورية لهذا الدرس.
- تنوع أنماط الأسئلة (استرجاع معارف، تطبيق قواعد، معالجة وضعية قصيرة).
- مع كل سؤال: الخيارات، الإجابة النموذجية، والشرح التوضيحي.
- جدول تحليل النتائج وتصنيف المتعلمين (متحكم 80-100%، تحكم جزئي 50-79%، غير متحكم أقل من 50%).
- إجراءات الاستدراك الفوري الميداني للطلبة المتعثرين.`,

      formative_assessment: `
أعدَّ **تقويماً تكوينياً مرحلياً (Formative Assessment)** للمتابعة الآنية أثناء سير الحصة.
- مقسم إلى 3 محطات فحص استيعاب تفاعلية سريعة (Checkpoints) مرتبطة بالأهداف.
- عدد الأسئلة الإجمالي: ${questionCount} أسئلة ذكية فورية (سؤال دقيقة واحدة، صح أو خطأ مع التعليل، تطبيق جزئي).
- بطاقة الملاحظة الآنية للمعلم أثناء تجواله في القسم.
- توجيهات التغذية الراجعة الفورية المصوبة لتعديل مسار التعلم فورياً.`,

      exam_with_rubric: `
أعدَّ **اختباراً شاملاً ومفصلاً مع جدول المواصفات وسلّم التنقيط النموذجي (من 20 نقطة)**.
- عدد الأسئلة: ${questionCount} مقسمة إلى جزأين رسميين:
  * الجزء الأول (12 نقطة): الموارد المعرفية والتطبيق المباشر (تمرينان متدرجان في الصعوبة).
  * الجزء الثاني (08 نقاط): وضعية إدماجية تقييمية مركبة (سياق واقعي، سندات، 3 تعليمات محددة).
- سلم التنقيط المفصل لكل تمرين وعناصر الإجابة النموذجية مجزأة بالعلامات ونصف العلامات.
- شبكة تقييم الوضعية الإدماجية بالمعايير الرسمية: م1 (الوجاهة 2ن)، م2 (الاستعمال السليم للأدوات 3ن)، م3 (الانسجام 2ن)، م4 (الإتقان 1ن).`,

      evaluation_grid: `
أعدَّ **شبكة تقييم ومتابعة بيداغوجية** تفصيلية للمتعلمين.
- مصفوفة الكفاءات والمؤشرات الإجرائية القابلة للملاحظة والقياس في هذا الدرس.
- شبكة تقييم الأداء: معايير الحد الأدنى ومعايير الإتقان، ومستويات التحكم (أقصى +++، مقبول ++، جزئي +، غير متحكم -).
- بطاقة رصد جماعية وفردية.
- استراتيجية المعالجة البيداغوجية والتدخل الفارق لكل نمط تحكم.`,

      integration_situation: `
أعدَّ **وضعية إدماجية دالة وواقعية (Situation d'intégration)** تحاكي مشكلة حياتية مركبة.
- السياق (Contexte): إشكالية واقعية ذات مغزى تضع المتعلم في مواجهة تحدٍ حياتي أو علمي.
- السندات (Supports): 2 إلى 3 سندات مساعدة (نصوص مرجعية، أرقام، رسومات، أو معطيات).
- التعليمات (Consignes): ${questionCount} مهام مركبة واضحة تدعو للتفسير والتحليل وتقديم حلول مبنية على موارد الدرس.
- شبكة التقويم التحليلي المفصلة بمعايير APC الرسمية وسلّم التنقيط ومؤشرات الإنجاز.`,

      remediation_plan: `
أعدَّ **خطة دعم ومعالجة بيداغوجية متمايزة (Differentiated Remediation Plan)** شاملة.
- تشخيص دقيق لصعوبات التعلم الشائعة وأسبابها الإبستيمولوجية والديداكتيكية في هذا الدرس.
- خطة التدخل المتمايزة عبر 3 مسارات:
  * المسار 1 (متعلمون في صعوبة قصوى): تفكيك المفاهيم، سندات مبسطة، وتمارين خطوة بخطوة.
  * المسار 2 (متعلمون متوسطون ذوو تحكم جزئي): أنشطة تعزيز وتثبيت وربط المفاهيم.
  * المسار 3 (متعلمون متقدمون متميزون): أنشطة إثراء وتحدٍ فكري وتطبيقات معمقة.
- جدول زمني تنفيذي، الوسائل المساعدة، ومؤشرات التحقق من زوال الصعوبة.`,
    };

    return guides[outputType] || guides.lesson_structure;
  }

  // ─── Response Parser ──────────────────────────────────────────────────────────

  private parseAiResponse(raw: string, outputType: GenerationOutputType): { title: string; content: string; structuredData?: any } {
    try {
      const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/i) ||
                        raw.match(/\{[\s\S]*"title"[\s\S]*"content"[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        return {
          title: parsed.title || '',
          content: parsed.content || raw,
          structuredData: parsed.structuredData || null,
        };
      }
    } catch {}

    const lines = raw.trim().split('\n');
    const firstLine = lines[0].replace(/^#+\s*/, '').replace(/[*_]/g, '').trim();
    
    return {
      title: firstLine.length < 120 ? firstLine : this.getOutputTypeTitle(outputType, ''),
      content: raw,
    };
  }

  // ─── Enriched Pedagogical Synthesis Engine (Fallback Engine) ────────────────

  private generateFallback(
    request: GenerationRequest,
    ctx: CurriculumContext,
    curriculumSource: any,
  ): GenerationResponse {
    const title = this.getOutputTypeTitle(request.outputType, ctx.lesson.title);
    let content = '';

    switch (request.outputType) {
      case 'lesson_structure':
        content = this.generateLessonStructureFallback(ctx, request);
        break;
      case 'lesson_memo':
        content = this.generateLessonMemoFallback(ctx, request);
        break;
      case 'diagnostic_assessment':
        content = this.generateDiagnosticAssessmentFallback(ctx, request);
        break;
      case 'formative_assessment':
        content = this.generateFormativeAssessmentFallback(ctx, request);
        break;
      case 'exam_with_rubric':
        content = this.generateExamWithRubricFallback(ctx, request);
        break;
      case 'evaluation_grid':
        content = this.generateEvaluationGridFallback(ctx, request);
        break;
      case 'integration_situation':
        content = this.generateIntegrationSituationFallback(ctx, request);
        break;
      case 'remediation_plan':
        content = this.generateRemediationPlanFallback(ctx, request);
        break;
      default:
        content = this.generateLessonStructureFallback(ctx, request);
    }

    content += `\n\n---\n*تم بناء هذه الوثيقة وفق مصفوفة المعايير البيداغوجية الرسمية للمنهاج. يمكنك تعديلها أو نسخها مباشرة للتحضير الصفّي.*`;

    return {
      outputType: request.outputType,
      title,
      content,
      curriculumSource,
      provider: 'curriculum_rag_engine',
      model: 'pedagogical_synthesizer_v2',
      fromFallback: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── 1. البناء التعلمي للدرس ──────────────────────────────────────────────────

  private generateLessonStructureFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, unit, course, subject } = ctx;
    const dur = req.durationMinutes || lesson.estimatedDurationMinutes || 55;
    const tLaunch = Math.round(dur * 0.1);
    const tBuild = Math.round(dur * 0.6);
    const tStruct = Math.round(dur * 0.15);
    const tEval = Math.round(dur * 0.15);

    const objs = lesson.learningObjectives?.length > 0 
      ? lesson.learningObjectives 
      : [`التعرف على المفاهيم الجوهرية في درس (${lesson.title})`, `تطبيق القواعد العلمية في حل المسائل والتطبيقات`, `استثمار المكتسبات في مواقف إدماجية دالة`];

    return `# البناء التعلّمي للدرس: ${lesson.title}

### 📋 بطاقة الهوية البيداغوجية
| العنصر | البيان |
| :--- | :--- |
| **المادة** | ${subject.nameAr} (${subject.code}) |
| **المستوى والشعبة** | ${this.formatGradeLevel(course.gradeLevel)} — شعبة ${this.formatBranch(course.academicBranch)} |
| **الوحدة التعلمية** | ${unit.title}${unit.unitNumber ? ` (رقم ${unit.unitNumber})` : ''} |
| **الدرس** | ${lesson.title} ${lesson.domain ? `(${lesson.domain})` : ''} |
| **الحجم الزمني** | ${dur} دقيقة |
${unit.pdfStartPage ? `| **مرجع الكتاب المدرسي** | الصفحات من ${unit.pdfStartPage} إلى ${unit.pdfEndPage} |` : ''}

---

### 🎯 الكفاءات المستهدفة ومؤشرات التعلم
- **الكفاءة الختامية:** التحكم في استيعاب وبناء مفاهيم درس (${lesson.title}) وتوظيفها بفاعلية في سياقات علمية وحياتية دالة.
- **مؤشرات الكفاءة والنجاح:**
${objs.map((o, i) => `  ${i + 1}. **مؤشر ${i + 1}:** يكتسب ويطبق المتعلم: ${o}.`).join('\n')}

---

### 🧭 سيرورة البناء التعلّمي (وفق المقاربة بالكفاءات APC)

#### 1️⃣ مرحلة الانطلاق والتهيئة النفسية والمعرفية (${tLaunch} دقيقة)
- **الهدف:** إثارة الدافعية واستحضار المكتسبات القبلية الضرورية.
- **الوضعية المشكلة الانطلاقية:**
  > يعرض الأستاذ وضعية من واقع التلميذ أو ظاهرة علمية محفزة ترتبط بـ **«${lesson.title}»** تطرح تساؤلاً جوهرياً: *«كيف يمكن تفسير ومعالجة هذه الحالة استناداً إلى معطيات المنهاج؟»*.
- **المهام والأنشطة:**
  - طرح أسئلة استرجاعية حول الدرس السابق ورصد تمثلات وتصورات التلاميذ الأولية.
  - حصر الصعوبات المبدئية وتوجيه الانتباه نحو موضوع الدرس الجديد.

#### 2️⃣ مرحلة بناء التعلمات والأنشطة الاستكشافية (${tBuild} دقيقة)
- **الهدف:** بناء المعارف والمفاهيم بطريقة نشطة وبنائية تفاعلية.
- **النشاط الأول (الاستكشاف والتحليل - ${Math.round(tBuild * 0.5)} د):**
  - **السند المعتمد:** وثائق وسندات درس (${lesson.title})${unit.pdfStartPage ? ` من الكتاب المدرسي ص${unit.pdfStartPage}` : ''}.
  - **نشاط المتعلم:** قراءة السند، استخراج المعطيات، تحليل العلاقات، والعمل ضمن أفواج مصغرة للإجابة عن الإشكاليات المطروحة.
  - **دور الأستاذ:** توجيه النقاش، ضبط الوقت، تحفيز المتعلمين، وتشجيع المبادرة والتعلم التعاوني.
- **النشاط الثاني (المعالجة والتعميم - ${Math.round(tBuild * 0.5)} د):**
  - **نشاط المتعلم:** مناقشة نتائج الأفواج، مقارنة الفرضيات بالنتائج، واستخلاص القواعد والمفاهيم المفتاحية.
  - **دور الأستاذ:** قيادة الحوار لبلورة التعاريف والمصطلحات الدقيقة وتصويب المفاهيم البديلة الخاطئة.

#### 3️⃣ مرحلة الهيكلة وإرساء الموارد المعرفية (${tStruct} دقيقة)
- **الهدف:** ضبط وخلاصة المفاهيم المتوصل إليها وتدوينها.
- **المنتوج المعرفي التركيبي:**
${objs.map((o, i) => `  - **العنصر ${i + 1}:** تلخيص ${o} وتحديد قواعدها الإجرائية.`).join('\n')}
- **المخطط المفاهيمي:** رسم خريطة مفاهيمية أو جدول تركيبي يربط عناصر الدرس ببعضها لترسيخ الذاكرة البصرية.

#### 4️⃣ مرحلة التقويم والتطبيق الفوري (${tEval} دقيقة)
- **الهدف:** التحقق الفوري من مدى تحقق الأهداف التعلمية في الحصة.
- **التطبيق الصفي:** حل مسألة أو تمرين تطبيقي مباشر يقيس مؤشرات الكفاءة المحددة.
- **التغذية الراجعة:** تصحيح فوري على السبورة ورصد نسبة التحكم في القسم.

---

### 🛡️ المعالجة البيداغوجية والدعم الاستباقي
- **الصعوبة المتوقعة:** الخلط بين المفاهيم النظرية والتطبيق العملي في (${lesson.title}).
- **الإجراء العلاجي المقترح:** تقديم بطاقة تذكيرية مساعدة مع إعادة نمذجة الخطوات للطلبة ذوي التحكم الجزئي.`;
  }

  // ─── 2. مذكرة الدرس الرسمية ───────────────────────────────────────────────────

  private generateLessonMemoFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, unit, course, subject } = ctx;
    const dur = req.durationMinutes || lesson.estimatedDurationMinutes || 55;
    const objs = lesson.learningObjectives?.length > 0 ? lesson.learningObjectives : [`استيعاب مفهوم ${lesson.title}`, `تطبيق القواعد في وضعيات جزئية`];

    return `# مذكرة الدرس البيداغوجية الرسمية

**المؤسسة:** منصة باقون التعليمية  
**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)}  |  **الشعبة:** ${this.formatBranch(course.academicBranch)}  
**الوحدة التعلمية:** ${unit.title}  |  **عنوان الدرس:** ${lesson.title}  
**الحجم الزمني:** ${dur} دقيقة  |  **الوسائل والدعامات:** الكتاب المدرسي${unit.pdfStartPage ? ` (ص${unit.pdfStartPage}-${unit.pdfEndPage})` : ''}، السبورة، بطاقات المهام، العارض الرقمي.

---

### 🎯 الكفاءة المستهدفة
> تمكين المتعلم من التحكم في مفاهيم **«${lesson.title}»** وتطبيقها بكفاءة في حل الوضعيات والمسائل وفق مؤشرات المنهاج المعتمد.

### 📋 جدول السيرورة البيداغوجية للحصة

| المرحلة البيداغوجية | التوقيت | أهداف التعلم | نشاط الأستاذ (التوجيه والتأطير) | نشاط المتعلم (التعلم النشط) | التقويم التكويني |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **مرحلة الانطلاق** | 5-10 د | استرجاع المكتسبات وتهيئة الذهن | يطرح وضعية انطلاقية مشوقة ترتبط بـ ${lesson.title} ويسائل التلاميذ | يشارك في النقاش، يقترح فرضيات أولية، ويستحضر مكتسباته | مدى الاستجابة والمشاركة |
| **بناء التعلمات (1)** | 15 د | ${objs[0] || 'استكشاف المفهوم'} | يوزع السندات ويحدد تعليمة النشاط ويشجع العمل الجماعي | يحلل السند، يناقش مع زملائه، ويدون الملاحظات المبدئية | الدقة في استخراج المعطيات |
| **بناء التعلمات (2)** | 15 د | ${objs[1] || 'معالجة المفاهيم والتعميم'} | يدير النقاش العام، يصوب التعاريف، ويؤطر صياغة النتيجة | يعرض نتائج فريقه، يدافع عن فكرته، ويستنتج الخلاصة العلمية | صحة الاستدلال وسلامة المفهوم |
| **الهيكلة والتركيب** | 10 د | إرساء الموارد المعرفية | يكتب الخلاصة الرسمية على السبورة وينظم المخطط المفاهيمي | يدون الخلاصة في دفتره ويربطها بما سبق دراسته | تنظيم الدفتر واستيعاب الخلاصة |
| **التقويم الختامي** | 10 د | قياس التحكم الإجرائي | يقترح نشاطاً تطبيقياً فردياً مستقلاً ويتابع الإنجاز | يحل التطبيق فردياً ويقارن حله بالتصحيح النموذجي | نسبة التحكم (متحكم / غير متحكم) |

---

### 📝 التقويم والواجب الإثرائي المنزلي
- تكليف الطلبة بحل التمارين التطبيقية ذات الصلة بالدرس لترسيخ التعلمات واستثمار المكتسبات.

### 🔍 بطاقة التقييم الذاتي للحصة (بعد الإنجاز)
- **مدى تحقيق الأهداف:** [ ] ممتاز  [ ] متوسط  [ ] يحتاج تدعيماً
- **ملاحظات للأستاذ:** ضبط الوقت في النشاط الاستكشافي، والتركيز على توضيح النقاط الدقيقة في الحصة القادمة.`;
  }

  // ─── 3. تقويم تشخيصي قبلي ───────────────────────────────────────────────────

  private generateDiagnosticAssessmentFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, unit, course, subject } = ctx;
    const qCount = req.questionCount || 5;

    return `# أداة التقويم التشخيصي القبلي: ${lesson.title}

**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)} — شعبة ${this.formatBranch(course.academicBranch)}  
**الهدف التشخيصي:** رصد المكتسبات القبلية الضرورية وتحديد الفجوات المعرفية قبل البدء في درس **«${lesson.title}»**.  
**المدة المقترحة:** 15 إلى 20 دقيقة.

---

### 📑 مصفوفة المكتسبات القبلية المفحوصة
1. المعارف والمفاهيم القاعدية ذات الصلة بالوحدة (${unit.title}).
2. القدرة على استدعاء القواعد والمصطلحات الأساسية واستعمالها.
3. مهارة التحليل والمقارنة في وضعيات جزئية مبسطة.

---

### ❓ أسئلة التقويم التشخيصي (${qCount} أسئلة متدرجة)

#### السؤال 1 (مستوى التذكر والاسترجاع):
ما هو المفهوم الأساسي الأقرب لـ **«${lesson.title}»** من بين المفاهيم التالية؟
- [ ] أ) المفهوم النظري الأولي المرتبط بالدرس
- [ ] ب) مفهوم مغاير غير مرتبط بالسياق
- [ ] ج) تعميم خاطئ شائع
- [ ] د) لا توجد إجابة صحيحة
*الإجابة النموذجية:* (أ) — التعليل: يستند إلى القاعدة الأساسية المدروسة في الوحدة السابقة.

#### السؤال 2 (مستوى الفهم والتفسير):
ضع علامة (صح) أو (خطأ) مع تصحيح الخطأ إن وجد:
- العبارة: يرتبط موضوع **«${lesson.title}»** ارتباطاً وثيقاً بـ (${unit.title}).
- [ ] صح    [ ] خطأ
*الإجابة النموذجية:* صح — التعليل: لأن الوحدة تمثل الإطار المعرفي الحاضن لمفاهيم هذا الدرس.

#### السؤال 3 (مستوى التطبيق المباشر):
في حالة مواجهة وضعية تتطلب تطبيق قواعد درس **«${lesson.title}»**، ما هي الخطوة المنهجية الأولى التي ينبغي الانطلاق منها؟
- [ ] أ) تحديد المعطيات واستحضار شروط التطبيق
- [ ] ب) القفز إلى النتيجة دون تحليل
- [ ] ج) تجاهل شروط المسألة
- [ ] د) الاعتماد على التخمين
*الإجابة النموذجية:* (أ) — التعليل: المنهجية العلمية تقتضي قراءة المعطيات وضبط الشروط.

#### السؤال 4 (مستوى التمييز والتحليل):
أيّ من العناصر التالية يعتبر مؤشراً أساسياً على التحكم في مفاهيم درس **«${lesson.title}»**؟
- [ ] أ) التمكن من ربط العلاقات وتفسير الظواهر ذات الصلة
- [ ] ب) الحفظ الآلي دون استيعاب
- [ ] ج) تكرار الأخطاء الشائعة
- [ ] د) صعوبة استخراج النتائج
*الإجابة النموذجية:* (أ).

#### السؤال 5 (سؤال تركيب وموقف مقتضب):
وضّح في سطرين كيف يساهم فهم هذا الدرس في حل مشكلات واقعية مرتبطة بمادة ${subject.nameAr}؟  
*الإجابة المتوقعة:* إبراز التطبيق العملي لمفاهيم الدرس وربطها بالواقع العلمي واليومي للمتعلم.

---

### 📊 شبكة تحليل النتائج وتصنيف المتعلمين
| الفئة | نسبة الإجابات الصحيحة | التشخيص البيداغوجي | الإجراء العلاجي الفوري |
| :--- | :---: | :--- | :--- |
| **الفئة (أ) - متمكن** | 80% - 100% | جاهزية تامة لخوض غمار الدرس الجديد | تكليفهم بمهام قيادية وتوجيه زملائهم |
| **الفئة (ب) - تحكم جزئي** | 50% - 79% | يحتاج تذكيراً ببعض القواعد والروابط | تقديم بطاقة مراجعة سريعة وتنشيط الذهن |
| **الفئة (ج) - غير متمكن** | أقل من 50% | فجوات معرفية تستوجب تدخلاً استدراكياً | تخصيص 5 دقائق مراجعة مكثفة قبل الانطلاق |`;
  }

  // ─── 4. تقويم تكويني مرحلي ───────────────────────────────────────────────────

  private generateFormativeAssessmentFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, subject, course } = ctx;
    const qCount = req.questionCount || 4;

    return `# التقويم التكويني المرحلي: ${lesson.title}

**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)}  
**الهدف:** التحقق الآني والمستمر من استيعاب المفاهيم أثناء سير الحصة وتعديل مسار التعليم والتعلم فورياً.  
**طبيعة الأداة:** فحص سريع (Quick Checkpoints) لمدة دقيقة إلى دقيقتين لكل محطة.

---

### 🚦 المحطات التقويمية الثلاث أثناء الدرس

#### المحطة 1: فحص استيعاب مرحلة الانطلاق (بعد 10 دقائق من الحصة)
- **السؤال التفاعلي السريع:** ما هو الإشكال المحوري الذي سنعمل على حله في هذا الدرس؟
- **مؤشر التحقق:** قدرة التلميذ على إعادة صياغة الإشكالية بلغته الخاصة بدقة.
- **تغذية راجعة فورية:** إذا تعثر التلميذ، يعيد الأستاذ التذكير بالسند الانطلاقي بطريقة أخرى.

#### المحطة 2: فحص استيعاب مرحلة بناء المعارف (بعد 30 دقيقة من الحصة)
- **السؤال التفاعلي:** استخرج من النشاط المنجز القاعدة الأساسية التي تحكم **«${lesson.title}»**.
- **مؤشر التحقق:** صياغة علمية سليمة للقاعدة وتجنب المفاهيم المغلوطة.
- **تغذية راجعة فورية:** تعليق أحد التلاميذ على إجابة زميله لتفعيل التقويم التبادلي بين الأقران.

#### المحطة 3: فحص القدرة على التطبيق الجزئي (بعد 45 دقيقة من الحصة)
- **سؤال الدقيقة الواحدة (One-Minute Paper):** طبّق القاعدة المتوصل إليها لحل الحالة النموذجية المقترحة.
- **مؤشر التحقق:** التوصل إلى النتيجة الصحيحة في الوقت المحدد.

---

### 📋 بطاقة رصد الإجابات الفورية للأستاذ
- [ ] **أكثر من 80% من القسم استوعب:** الانتقال إلى المرحلة التالية وإرساء الموارد.
- [ ] **من 50% إلى 80% استوعب:** إعادة شرح النقطة الغامضة بمثال مغاير وملموس.
- [ ] **أقل من 50% استوعب:** التوقف، إعادة بناء المفهوم، وتعديل خطة الحصة.`;
  }

  // ─── 5. اختبار شامل مع سلم التنقيط ──────────────────────────────────────────

  private generateExamWithRubricFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, unit, course, subject } = ctx;

    return `# اختبار تقييمي شامل مع سلّم التنقيط النموذجي

**المؤسسة:** منصة باقون التعليمية  
**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)} — شعبة ${this.formatBranch(course.academicBranch)}  
**المجال:** ${unit.title}  |  **موضوع الاختبار:** تقييم الكفاءات في درس «${lesson.title}»  
**المدة:** ساعة واحدة  |  **العلامة الكاملة:** 20 / 20

---

## 📄 موضوع الاختبار

### 🔹 الجزء الأول: استرجاع وتنظيم المعارف والتطبيق المباشر (12 نقطة)

#### التمرين الأول: استرجاع وتنظيم المعارف (06 نقاط)
1. عرّف بدقة المصطلحات والمفاهيم المركزية المرتبطة بـ **«${lesson.title}»**. *(02 ن)*
2. اذكر ثلاثة شروط أو خصائص علمية أساسية تؤطر هذا الموضوع. *(02 ن)*
3. بيّن في فقرة علمية موجزة العلاقة بين هذا الدرس والوحدة التعلمية (${unit.title}). *(02 ن)*

#### التمرين الثاني: دراسة حالة وتطبيق تحليلي (06 نقاط)
إليك الحالة النموذجية التالية المستقاة من موضوع الدرس:
> في تجربة أو دراسة ميدانية متعلقة بـ **«${lesson.title}»**، تم تسجيل النتائج الموضحة في المعطيات المرفقة.
1. حلل المعطيات المقدمة واستخرج الظاهرة أو القاعدة المتحكمة فيها. *(02 ن)*
2. فسّر النتائج الملاحظة مبرراً إجابتك بالقواعد العلمية المدروسة. *(02 ن)*
3. استنتج الحل أو الحكم العلمي المناسب لهذه الوضعية. *(02 ن)*

---

### 🔹 الجزء الثاني: الوضعية الإدماجية المركبة (08 نقاط)

#### السياق:
طرحت إشكالية واقعية في محيط المتعلم أو في مجال التخصص تتطلب تعبئة واستثمار موارد درس **«${lesson.title}»** لإيجاد حل علمي ومبرهن.

#### السندات:
- **السند 1:** وثيقة توضيحية أو نص مرجعي يصف أبعاد الإشكالية.
- **السند 2:** رسم بياني أو جدول إحصائي يوضح المتغيرات.

#### التعليمات:
اعتماداً على السندات المرفقة ومكتسباتك القبلية في مادة ${subject.nameAr}:
1. **المهمة 1:** شخص أسباب الإشكالية المطروحة استناداً إلى سندات الدرس. *(02 ن)*
2. **المهمة 2:** قدّم تحليلاً علمياً مفسراً للظاهرة مبرزاً الآليات والقواعد المتحكمة. *(03 ن)*
3. **المهمة 3:** اقترح حلولاً عملية وبدائل واقعية لتجاوز هذه الإشكالية مع التعليل. *(03 ن)*

---

## 🗝️ دليل التصحيح وسلّم التنقيط النموذجي المفصل

### عناصر إجابة الجزء الأول (12 نقطة)
| السؤال | عناصر الإجابة النموذجية | العلامة الجزئية | المجموع |
| :--- | :--- | :---: | :---: |
| **ت1 - س1** | التعريف الدقيق والمصطلحات العلمية السليمة | 1.0 + 1.0 | **2.0 ن** |
| **ت1 - س2** | ذكر الشروط والخصائص الثلاث بشكل سليم | 3 × 0.66 | **2.0 ن** |
| **ت1 - س3** | الربط المنطقي في الفقرة وسلامة اللغة العلمية | 1.0 + 1.0 | **2.0 ن** |
| **ت2 - س1** | التحليل المنهجي الدقيق للمعطيات (تفكيك العناصر) | 2.0 | **2.0 ن** |
| **ت2 - س2** | التفسير العلمي المبني على القواعد المعتمدة | 2.0 | **2.0 ن** |
| **ت2 - س3** | الاستنتاج المنطقي السليم والخلاصة الدقيقة | 2.0 | **2.0 ن** |

### شبكة تقييم الوضعية الإدماجية (الجزء الثاني - 08 نقاط)
| المعيار | المؤشرات الدالة على التحقق | العلامة |
| :--- | :--- | :---: |
| **م1: الوجاهة (ملاءمة المنتوج)** | - الالتزام الدقيق بالتعليمات الثلاث.<br>- عدم الخروج عن موضوع ${lesson.title}. | **2.0 ن** |
| **م2: الاستعمال السليم لأدوات المادة** | - توظيف المفاهيم والمصطلحات العلمية الصحيحة.<br>- استغلال السندات المرفقة وتوظيفها بذكاء. | **3.0 ن** |
| **م3: انسجام المنتوج وتسلسله** | - تسلسل الأفكار والمنطقية في الطرح والتحليل.<br>- التبرير والتعليل العلمي المقنع. | **2.0 ن** |
| **م4: الإتقان والتميز (معيار تميز)** | - وضوح الخط ونظافة الورقة ودقة التعبير وسلامة اللغة. | **1.0 ن** |
| **المجموع الكلي** | **العلامة الإجمالية للوضعية الإدماجية** | **8.0 ن** |`;
  }

  // ─── 6. شبكة التقييم والمعالجة ──────────────────────────────────────────────

  private generateEvaluationGridFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, unit, course, subject } = ctx;

    return `# شبكة التقييم والمتابعة البيداغوجية: ${lesson.title}

**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)} — شعبة ${this.formatBranch(course.academicBranch)}  
**الوحدة:** ${unit.title}  |  **الدرس المستهدف:** ${lesson.title}

---

### 📊 مصفوفة معايير ومؤشرات الكفاءة

| المعيار البيداغوجي | المؤشرات القابلة للملاحظة والقياس | تحكم أقصى (+++) | تحكم مقبول (++) | تحكم جزئي (+) | عدم التحكم (-) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **م1: المعرفة النظرية** | استحضار مفاهيم ومصطلحات ${lesson.title} بدقة | يستحضرها كاملة مع الشرح | يستحضرها دون تفصيل | يستحضر بعضها مع أخطاء | يعجز عن الاستحضار |
| **م2: التحليل والفهم** | استغلال السندات وتفكيك الإشكاليات | تحليل متكامل ومنهجي | تحليل سليم ومباشر | تحليل سطحي ناقص | تحليل عشوائي أو غائب |
| **م3: التطبيق الإجرائي** | حل المسائل وتطبيق القواعد المكتسبة | حل خالٍ من الأخطاء | حل سليم مع هفوات شكلية | حل متعثر في خطواته | عجز عن الحل |
| **م4: التبليغ العلمي** | سلامة التعبير واستعمال المصطلحات | لغة سليمة وصياغة نموذجية | لغة مقبولة مفهومة | أخطاء في المصطلحات | ركاكة وصعوبة فهم |

---

### 🛠️ خطة التدخل البيداغوجي الفارق بناءً على شبكة التقييم
- **للطلبة ذوي التحكم الجزئي (+):** تزويدهم ببطاقة إجرائية مبسطة (Checklist) ترتب خطوات الحل خطوة بخطوة.
- **للطلبة غير المتحكمين (-):** عقد جلسة مراجعة استدراكية مصغرة وإعادة بناء المفاهيم بسندات أكثر بساطة وحسية.
- **للطلبة ذوي التحكم الأقصى (+++):** تكليفهم بأنشطة تعميق وإثراء وتكليفهم بمساعدة زملائهم كأقران معلمين.`;
  }

  // ─── 7. وضعية إدماجية واقعية ───────────────────────────────────────────────

  private generateIntegrationSituationFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, unit, course, subject } = ctx;

    return `# وضعية إدماجية مركبة ودالة: ${lesson.title}

**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)} — شعبة ${this.formatBranch(course.academicBranch)}  
**الميدان / المجال:** ${unit.title}  |  **الكفاءة المستهدفة:** إدماج مكتسبات درس «${lesson.title}» في حل مشكلة حياتية أو علمية واقعية.

---

### 📖 السياق الواقعي (Le Contexte):
خلال متابعتك لنقاش علمي أو مواجهتك لمشكلة عملية في الحياة اليومية ترتبط بموضوع **«${lesson.title}»**، لوحظ وجود تباين في الآراء وتفسيرات خاطئة لا تستند إلى القواعد المنهجية التي درستها في مقرر مادة ${subject.nameAr}. طلب منك بصفتك باحثاً وطالباً متميزاً إعداد تقرير علمي مبرهن يحسم الجدل ويوضح الآليات السليمة للمعالجة.

---

### 📑 السندات المرفقة (Les Supports):
- **السند رقم (1):** وثيقة مرجعية مقتبسة من المنهاج تؤصل المفاهيم الأساسية للدرس وتحيل إلى شروط التطبيق.
- **السند رقم (2):** جدول إحصائي أو رسم بياني يعكس واقع الظاهرة وتطوراتها الميدانية.
- **السند رقم (3):** توجيهات عملية وشروط تقنية ينبغي الالتزام بها أثناء صياغة الحل.

---

### 🎯 التعليمات والمهام المركبة (Les Consignes):
انطلاقاً من السندات ومكتسباتك القبلية في مادة ${subject.nameAr}:
1. **المهمة الأولى (التشخيص والتفسير):** حلل أبعاد الوضعية مبرزاً الأسباب العلمية للظاهرة والمفاهيم المرتبطة بها في درس (${lesson.title}).
2. **المهمة الثانية (المعالجة والبرهنة):** وظف القواعد العلمية في نقد التفسيرات الخاطئة وتقديم التفسير الصحيح المدعوم بالحجج والأدلة.
3. **المهمة الثالثة (الحل والاقتراح):** اقترح خطة عمل إجرائية أو حلولاً قابلة للتطبيق لمعالجة الإشكالية المطروحة بصورة نهائية.

---

### ⚖️ معايير التقويم التحليلي والشبكة المعيارية (08 نقاط):
- **معيار الوجاهة (2.0 ن):** الالتزام بالمهام الثلاث بدقة دون حشو أو خروج عن السياق.
- **معيار الاستعمال السليم لأدوات المادة (3.0 ن):** الاستغلال الأمثل للسندات وتوظيف المصطلحات الخاصة بالمادة.
- **معيار الانسجام (2.0 ن):** التسلسل المنطقي ووضوح التعليل والبرهان العلمي.
- **معيار الإتقان (1.0 ن):** حسن العرض، تنظيم الورقة، وسلامة اللغة.`;
  }

  // ─── 8. خطة الدعم والمعالجة البيداغوجية ──────────────────────────────────────

  private generateRemediationPlanFallback(ctx: CurriculumContext, req: GenerationRequest): string {
    const { lesson, unit, course, subject } = ctx;

    return `# خطة الدعم والمعالجة البيداغوجية المتمايزة: ${lesson.title}

**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)} — شعبة ${this.formatBranch(course.academicBranch)}  
**الوحدة:** ${unit.title}  |  **موضوع المعالجة:** معالجة صعوبات التعلم في درس «${lesson.title}»

---

### 🔍 أولاً: تشخيص صعوبات التعلم الشائعة وأسبابها
1. **الصعوبة المفاهيمية:** صعوبة التمييز بين المفاهيم المتشابهة في الدرس والخلط بين شروط التطبيق.
2. **الصعوبة الإجرائية:** التردد في اختيار القاعدة المناسبة أثناء مواجهة التمارين والمسائل غير المألوفة.
3. **الصعوبة التعبيرية:** عجز التلميذ عن صياغة تعليل علمي منطقي ومنسجم يبرر نتيجته.

---

### 🧭 ثانياً: خطة التدخل البيداغوجي وفق المسارات المتمايزة الثلاثة

#### 🟢 المسار (أ) - دعم مكثف للمتعثرين (فئة الصعوبة القصوى):
- **الهدف:** إعادة بناء المفاهيم القاعدية وضمان الحد الأدنى من الكفاءة.
- **نوع النشاط:** أنشطة تفكيكية خطوة بخطوة، تزويدهم بمخطط ذهني مبسط، واستعمال أمثلة حسية ملموسة.
- **المهمة:** حل تمرينين تطبيقيين موجهين مباشرة مع توفير مساعدة إجرائية تدريجية (Scaffolding).

#### 🟡 المسار (ب) - تعزيز وتثبيت للمتوسطين (فئة التحكم الجزئي):
- **الهدف:** ترسيخ المفاهيم، سد الثغرات الجزئية، ورفع وتيرة الإنجاز.
- **نوع النشاط:** مسائل شبه موجهة تتطلب الربط بين عنصرين أو أكثر من عناصر الدرس.
- **المهمة:** تمرين تطبيقي مستقل مع التحفيز على اكتشاف وتصحيح الأخطاء ذاتياً.

#### 🔵 المسار (ج) - إثراء وتحدٍ فكري للمتميزين (فئة التحكم التام):
- **الهدف:** تعميق المدارك وتنمية التفكير النقدي والاستدلال العلمي المتقدم.
- **نوع النشاط:** وضعية مشكلة إدماجية مفتوحة تتطلب استثمار الدرس في سياق مركب.
- **المهمة:** صياغة حلول إبداعية والقيام بدور الأقران المعلمين لمساعدة زملائهم.

---

### ⏱️ ثالثاً: الجدول الزمني ومؤشرات نجاح الخطة
- **توقيت التنفيذ:** حصة المعالجة البيداغوجية المقررة أسبوعياً (45 دقيقة).
- **مؤشر النجاح المنشود:** وصول 85% على الأقل من تلاميذ الفئة (أ) و (ب) إلى درجة التحكم المقبول في التطبيقات اللاحقة.`;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private getOutputTypeTitle(outputType: GenerationOutputType, lessonTitle: string): string {
    const titles: Record<GenerationOutputType, string> = {
      lesson_structure: `البناء التعلمي للدرس: ${lessonTitle}`,
      lesson_memo: `مذكرة الدرس الرسمية: ${lessonTitle}`,
      diagnostic_assessment: `تقويم تشخيصي قبلي: ${lessonTitle}`,
      formative_assessment: `تقويم تكويني مرحلي: ${lessonTitle}`,
      exam_with_rubric: `اختبار شامل مع سلم التنقيط: ${lessonTitle}`,
      evaluation_grid: `شبكة التقييم والمعالجة: ${lessonTitle}`,
      integration_situation: `وضعية إدماجية مركبة: ${lessonTitle}`,
      remediation_plan: `خطة الدعم والمعالجة البيداغوجية: ${lessonTitle}`,
    };
    return titles[outputType] || `وثيقة تربوية: ${lessonTitle}`;
  }

  private formatGradeLevel(level: string): string {
    const map: Record<string, string> = {
      grade_10: 'السنة الأولى ثانوي',
      grade_11: 'السنة الثانية ثانوي',
      grade_12: 'السنة الثالثة ثانوي (البكالوريا)',
    };
    return map[level] || level;
  }

  private formatBranch(branch: string): string {
    const map: Record<string, string> = {
      scientific: 'علوم تجريبية',
      literary: 'آداب وفلسفة / لغات أجنبية',
      sharia: 'علوم إسلامية وتأصيل',
      industrial: 'تقني رياضي',
      mathematical: 'رياضيات',
    };
    return map[branch] || branch;
  }
}
