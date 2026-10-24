import { Injectable, Logger } from '@nestjs/common';
import { AiProviderService } from './ai-provider.service';
import { EducationalRagService, CurriculumContext } from './educational-rag.service';
import { PrismaService } from '../../../core/database/prisma.service';

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
    private readonly prisma: PrismaService,
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
   * Supports curriculum auto-linking, multiple pedagogical archetypes (APC, Drill, Quiz, Remediation, Project),
   * granular difficulty tiers, and precise fractional scoring rubrics.
   */
  async assistAssignment(dto: {
    title?: string;
    subject?: string;
    existingDescription?: string;
    type?: string;
    maxScore?: number;
    cohortId?: string;
    lessonId?: string;
    style?: 'standard_practice' | 'apc_integration' | 'quick_quiz' | 'remediation' | 'research_project';
    difficulty?: 'average' | 'remedial' | 'advanced';
    actionPrompt?: 'full_build' | 'refine_draft' | 'add_rubric' | 'apc_convert';
  }): Promise<{
    suggestedTitle: string;
    suggestedSubject: string;
    suggestedType: string;
    suggestedMaxScore: number;
    style: string;
    difficulty: string;
    lessonTitle?: string;
    unitTitle?: string;
    gradeLevel?: string;
    branch?: string;
    instructions: string;
    questionsText: string;
    rubricText: string;
    criteriaText: string;
    hintsText: string;
    suggestedDescription: string;
    explanation: string;
    provider: string;
    model: string;
  }> {
    const rawTitle = (dto.title || '').trim();
    const rawDesc = (dto.existingDescription || '').trim();
    const selectedStyle = dto.style || (
      dto.type === 'quiz' ? 'quick_quiz' :
      dto.type === 'project' ? 'research_project' :
      'standard_practice'
    );
    const selectedDifficulty = dto.difficulty || 'average';
    const maxScore = Number(dto.maxScore) || (selectedStyle === 'quick_quiz' ? 10 : 20);
    const targetType = dto.type || (selectedStyle === 'quick_quiz' ? 'quiz' : selectedStyle === 'research_project' ? 'project' : 'assignment');

    // 1. Resolve Curriculum Context (from lessonId or cohortId)
    let curriculumContext: CurriculumContext | null = null;
    let cohortInfo: any = null;

    const isUuid = (id?: string | null) => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

    if (dto.lessonId && isUuid(dto.lessonId)) {
      try {
        curriculumContext = await this.rag.getCurriculumContext(dto.lessonId);
      } catch (err: any) {
        this.logger.warn(`Could not load lesson context for ${dto.lessonId}: ${err.message}`);
      }
    }

    if (!curriculumContext && dto.cohortId && isUuid(dto.cohortId)) {
      try {
        const cohort = await this.prisma.cohort.findUnique({
          where: { id: dto.cohortId },
        });
        if (cohort) {
          const course = await this.prisma.course.findUnique({
            where: { id: cohort.courseId },
            include: {
              subject: true,
              versions: {
                where: { id: cohort.curriculumVersionId || undefined },
                take: 1,
                include: {
                  units: {
                    orderBy: { orderIndex: 'asc' },
                    include: {
                      lessons: {
                        orderBy: { orderIndex: 'asc' },
                        take: 6,
                      },
                    },
                  },
                },
              },
            },
          });
          if (course) {
            cohortInfo = { cohort, course };
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not load cohort context for ${dto.cohortId}: ${err.message}`);
      }
    }

    // 2. Resolve Subject, Lesson, Unit, Grade & Branch Names
    let subjectName = (dto.subject || '').trim();
    let lessonTitle = '';
    let unitTitle = '';
    let gradeLevel = '';
    let branch = '';

    if (curriculumContext) {
      subjectName = curriculumContext.subject.nameAr || subjectName;
      lessonTitle = curriculumContext.lesson.title;
      unitTitle = curriculumContext.unit.title;
      gradeLevel = this.formatGradeLevel(curriculumContext.course.gradeLevel);
      branch = this.formatBranch(curriculumContext.course.academicBranch);
    } else if (cohortInfo) {
      subjectName = cohortInfo.course.subject?.nameAr || subjectName;
      gradeLevel = this.formatGradeLevel(cohortInfo.course.gradeLevel);
      branch = this.formatBranch(cohortInfo.course.academicBranch);
      const firstUnit = cohortInfo.course.versions?.[0]?.units?.[0];
      if (firstUnit) {
        unitTitle = firstUnit.title;
        lessonTitle = firstUnit.lessons?.[0]?.title || '';
      }
    }

    if (!subjectName) {
      const probe = (rawTitle + ' ' + rawDesc).toLowerCase();
      if (probe.includes('رياضيات') || probe.includes('دوال') || probe.includes('هندسة') || probe.includes('تكامل') || probe.includes('متتاليات') || probe.includes('احتمال')) {
        subjectName = 'الرياضيات';
      } else if (probe.includes('فيزياء') || probe.includes('كيمياء') || probe.includes('نيوتن') || probe.includes('دارة') || probe.includes('أكسدة') || probe.includes('ميكانيك')) {
        subjectName = 'العلوم الفيزيائية والتكنولوجيا';
      } else if (probe.includes('أحياء') || probe.includes('طبيعة') || probe.includes('حياة') || probe.includes('بروتين') || probe.includes('مناعة') || probe.includes('خلية')) {
        subjectName = 'علوم الطبيعة والحياة';
      } else if (probe.includes('عربية') || probe.includes('لغة') || probe.includes('نحو') || probe.includes('بلاغة') || probe.includes('إعراب') || probe.includes('شعر')) {
        subjectName = 'اللغة العربية وآدابها';
      } else if (probe.includes('إسلام') || probe.includes('شريعة') || probe.includes('قرآن') || probe.includes('حديث') || probe.includes('فقه')) {
        subjectName = 'التربية الإسلامية';
      } else if (probe.includes('تاريخ') || probe.includes('جغرافيا') || probe.includes('اجتماعيات') || probe.includes('خرائط')) {
        subjectName = 'التاريخ والجغرافيا';
      } else if (probe.includes('إنجليز') || probe.includes('english')) {
        subjectName = 'اللغة الإنجليزية';
      } else {
        subjectName = 'المقرر العام';
      }
    }

    const styleLabels: Record<string, string> = {
      standard_practice: 'واجب تطبيقي تدريبي متدرج',
      apc_integration: 'وضعية إدماجية مركبة (المقاربة بالكفاءات APC)',
      quick_quiz: 'فحص فهم واختبار قصير تكويني (Quiz)',
      remediation: 'واجب علاجي وتدارك فاقد تعليمي',
      research_project: 'مشروع وبحث تطبيقي استكشافي',
    };

    const diffLabels: Record<string, string> = {
      remedial: 'ميسر / دعم وعلاج (تفكيك الصعوبات وتدرج بسيط)',
      average: 'متوسط / قياسي (مطابق للمنهاج الرسمي وللامتحانات)',
      advanced: 'متقدم / تحدي واستدلال فكري مع تعليل عميق',
    };

    // 3. If AI provider is configured, call LLM with our enriched pedagogical prompt
    if (this.aiProvider.isConfigured()) {
      try {
        const systemPrompt = `أنت خبير تربوي ومفتش بيداغوجي أول متخصص في بناء وتصميم التقييمات والواجبات المدرسية بالمقاربة بالكفاءات (APC) والمنهاج التربوي المعتمد.
مهمتك: مساعدة الأستاذ في منصة باقون في صياغة وتوليد واجب دراسي احترافي، متكامل، رفيع المستوى، يثير دافعية الطلاب ويحقق أهداف المنهاج بدقة متناهية.

نمط الواجب المطلوب: ${styleLabels[selectedStyle] || selectedStyle}
مستوى الصعوبة: ${diffLabels[selectedDifficulty] || selectedDifficulty}
الدرجة القصوى: ${maxScore} درجة
المبحث الدراسي: ${subjectName}
المرحلة والشعبة: ${gradeLevel || 'التعليم الثانوي / الأساسي'} — ${branch || 'العام'}
الدرس / الموضوع المستهدف: ${lessonTitle || rawTitle || 'موضوع الدرس المقرر'}
الوحدة التعليمية: ${unitTitle || 'الوحدة المقررة'}

القواعد البيداغوجية الصارمة:
1. التدرج الدقيق وفق مستويات بلوم (تذكر، فهم، تطبيق، تحليل، تركيب، تقويم).
2. صياغة تعليمات إنجاز واضحة ومنهجية موجهة للطلبة.
3. تفكيك وتوزيع الدرجات بدقة متناهية لكل سؤال وجزئياته (مثلاً: 0.5 ن، 1.0 ن، 1.5 ن) بحيث يكون المجموع الإجمالي مساوياً تماماً لـ ${maxScore} درجة دون أي زيادة أو نقصان.
4. إدراج سلّم تنقيط نموذجي مفصل يوضح معايير الإجابة المقبولة وتوزيع النقاط على الخطوات.
5. في نمط الوضعية الإدماجية (APC): تضمين سياق واقعي ذي دلالة، وسندات معتمدة (سند 1، سند 2)، وتعليمات إجرائية بأفعال أداء صريحة، مع شبكة تقويم بمعايير الكفاءة (م1: الوجاهة، م2: الاستعمال السليم لأدوات المادة، م3: الانسجام، م4: الإتقان).
6. في نمط الدعم والمعالجة: تشخيص الخلل، وتقديم محطات متدرجة (تذكير بالقاعدة، تصحيح خطأ شائع، إعادة استثمار مستقل).
7. في نمط الاختبار القصير (Quiz): أسئلة فحص فهم، اختيار من متعدد مبرر، وصحيح/خطأ مع تعليل، محددة بـ 20 دقيقة.
8. إضافة تلميحات إرشادية وتنبيهات لتفادي الأخطاء الشائعة لدى الطلبة.

أعد المخرجات حصراً بصيغة JSON نظيفة وصحيحة على الشكل الآتي:
{
  "suggestedTitle": "عنوان بيداغوجي دقيق وجذاب للواجب",
  "suggestedSubject": "${subjectName}",
  "suggestedType": "${targetType}",
  "suggestedMaxScore": ${maxScore},
  "instructions": "نص تعليمات الإنجاز وإرشادات التسليم",
  "questionsText": "نص الأسئلة والتمارين كاملة مع درجات كل سؤال وجزئياته",
  "rubricText": "سلّم التنقيط النموذجي المفصل وتوزيع الدرجات على الخطوات",
  "criteriaText": "شبكة معايير التقييم البيداغوجي (معايير ومؤشرات APC)",
  "hintsText": "تلميحات وإرشادات للطلبة لتفادي الأخطاء الشائعة",
  "suggestedDescription": "المحتوى الكامل والمنسق بماركداون احترافي يشمل التعليمات، الأسئلة، سلّم التنقيط، والشبكة",
  "explanation": "شرح تربوي للأستاذ يوضح فلسفة بناء هذا الواجب وكيف يحقق الأهداف المنشودة"
}`;

        const userPrompt = `معطيات الأستاذ:
- العنوان المدخل: ${rawTitle || 'غير محدد بعد (اقترح عنواناً تربوياً مناسباً)'}
- المبحث المدخل: ${subjectName}
- نوع التكليف: ${targetType}
- الدرجة المحددة: ${maxScore}
- مسودة الأستاذ / الملاحظات الحالية:
${rawDesc || 'لا توجد ملاحظات سابقة، قم ببناء الواجب بالكامل وفق المنهاج.'}

قم بإعداد التكليف باحترافية بيداغوجية فائقة.`;

        const res = await this.aiProvider.generateCompletion([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);

        const jsonMatch = res.content.match(/```json\s*([\s\S]*?)```/i) || res.content.match(/\{[\s\S]*"suggestedTitle"[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          const fullDesc = parsed.suggestedDescription || [
            `### 📌 تعليمات وإرشادات الإنجاز:\n${parsed.instructions || ''}`,
            `---\n\n### ❓ أسئلة التكليف:\n${parsed.questionsText || ''}`,
            `---\n\n### ⚖️ سلّم التنقيط المفصل:\n${parsed.rubricText || ''}`,
            parsed.criteriaText ? `---\n\n### 📊 شبكة معايير التقييم البيداغوجي:\n${parsed.criteriaText}` : '',
            parsed.hintsText ? `---\n\n### 💡 إرشادات وتوجيهات للطلبة:\n${parsed.hintsText}` : '',
          ].filter(Boolean).join('\n\n');

          return {
            suggestedTitle: parsed.suggestedTitle || rawTitle || `${styleLabels[selectedStyle] || 'واجب'} في ${subjectName}`,
            suggestedSubject: parsed.suggestedSubject || subjectName,
            suggestedType: parsed.suggestedType || targetType,
            suggestedMaxScore: Number(parsed.suggestedMaxScore) || maxScore,
            style: selectedStyle,
            difficulty: selectedDifficulty,
            lessonTitle,
            unitTitle,
            gradeLevel,
            branch,
            instructions: parsed.instructions || '',
            questionsText: parsed.questionsText || '',
            rubricText: parsed.rubricText || '',
            criteriaText: parsed.criteriaText || '',
            hintsText: parsed.hintsText || '',
            suggestedDescription: fullDesc,
            explanation: parsed.explanation || 'تم توليد وصياغة هذا التكليف بالذكاء الاصطناعي وفق المقاربة بالكفاءات ومنهاج المادة.',
            provider: res.provider,
            model: res.model,
          };
        }
      } catch (err: any) {
        this.logger.warn(`AI assistAssignment error: ${err.message} — using enriched pedagogical synthesizer`);
      }
    }

    // 4. High-Yield Pedagogical Synthesis Fallback (Authentic, Curricular, and Multi-Subject)
    return this.synthesizeAssignmentAssistance({
      rawTitle,
      rawDesc,
      subjectName,
      lessonTitle,
      unitTitle,
      gradeLevel,
      branch,
      selectedStyle,
      selectedDifficulty,
      maxScore,
      targetType,
    });
  }

  /**
   * Deep Multi-Subject Pedagogical Synthesizer for Assignment Co-Pilot
   */
  private synthesizeAssignmentAssistance(p: {
    rawTitle: string;
    rawDesc: string;
    subjectName: string;
    lessonTitle: string;
    unitTitle: string;
    gradeLevel: string;
    branch: string;
    selectedStyle: 'standard_practice' | 'apc_integration' | 'quick_quiz' | 'remediation' | 'research_project';
    selectedDifficulty: 'average' | 'remedial' | 'advanced';
    maxScore: number;
    targetType: string;
  }) {
    const s = p.subjectName.toLowerCase();

    if (s.includes('رياضيات') || s.includes('حساب') || s.includes('math')) {
      return this.synthesizeMathAssignment(p);
    }
    if (s.includes('فيزياء') || s.includes('كيمياء') || s.includes('physic')) {
      return this.synthesizePhysicsChemistryAssignment(p);
    }
    if (s.includes('أحياء') || s.includes('طبيعة') || s.includes('حياة') || s.includes('bio')) {
      return this.synthesizeLifeSciencesAssignment(p);
    }
    if (s.includes('عرب') || s.includes('لغة') || s.includes('أدب')) {
      return this.synthesizeArabicAssignment(p);
    }
    if (s.includes('إسلام') || s.includes('تاريخ') || s.includes('جغرافيا') || s.includes('شريعة')) {
      return this.synthesizeSocialIslamicAssignment(p);
    }

    return this.synthesizeGeneralAssignment(p);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Subject 1: Mathematics (الرياضيات)
  // ══════════════════════════════════════════════════════════════════════════════
  private synthesizeMathAssignment(p: any) {
    const { rawTitle, rawDesc, lessonTitle, unitTitle, selectedStyle, selectedDifficulty, maxScore, targetType } = p;
    const topic = lessonTitle || rawTitle || 'دراسة الدوال العددية وحساب النهايات';
    const finalTitle = rawTitle || (
      selectedStyle === 'apc_integration' ? `وضعية إدماجية: نمذجة وتحسين مسألة في الرياضيات (${topic})` :
      selectedStyle === 'quick_quiz' ? `اختبار قصير: فحص الفهم في الرياضيات (${topic})` :
      selectedStyle === 'remediation' ? `دعم وتدارك: معالجة صعوبات ${topic}` :
      selectedStyle === 'research_project' ? `مشروع استكشافي: التطبيقات العملية لموضوع ${topic}` :
      `واجب تطبيقي متدرج: ${topic}`
    );

    const q1Score = Math.max(1, Math.round(maxScore * 0.25));
    const q2Score = Math.max(1, Math.round(maxScore * 0.45));
    const q3Score = Math.max(1, maxScore - q1Score - q2Score);

    let instructions = `### 📌 تعليمات وإرشادات الإنجاز:
- يُطلب من جميع الطلبة قراءة المسائل بعناية وتدوين الحل في ورقة منظمة مع ترقيم الأسئلة بوضوح.
- يجب تبرير كل خطوة حسابية أو برهان رياضي بذكر القاعدة، النظرية، أو المبرهنة المستعملة.
- تُحسب النتائج العددية بدقة مع كتابة القيم المضبوطة قبل التقريب إن وجد.
${rawDesc ? `\n### 📝 ملاحظات ومسودة الأستاذ:\n${rawDesc}` : ''}`;

    let questionsText = '';
    let rubricText = '';
    let criteriaText = '';
    let hintsText = '';

    if (selectedStyle === 'apc_integration') {
      const p1 = Math.round(maxScore * 0.2);
      const p2 = Math.round(maxScore * 0.4);
      const p3 = maxScore - p1 - p2;

      questionsText = `#### 📖 السياق الواقعي (Le Contexte):
ترغب مؤسسة ناشئة في تصميم حاوية شحن معدنية على شكل متوازي مستطيلات ذي قاعدة مربعة طول ضلعها $x$ متر وارتفاعها $h$ متر، بحيث يكون حجمها الإجمالي ثابتاً ويساوي $V = 16\\text{ m}^3$. تسعى المؤسسة لتقليص تكلفة المعدن المستعمل إلى أدنى حد ممكن عن طريق تصغير المساحة الكلية للحاوية.

#### 📊 السندات المعتمدة:
- **السند (1):** صيغة حجم متوازي المستطيلات: $V = x^2 \\cdot h$.
- **السند (2):** صيغة المساحة الكلية للمعدن: $S(x) = 2x^2 + 4xh = 2x^2 + \\frac{64}{x}$ لكل $x > 0$.
- **السند (3):** جدول يوضح تكلفة المتر المربع من المعدن (1200 دج/م²).

#### ✍️ التعليمات الإجرائية (Les Consignes):
1. **التعليمة الأولى (${p1} درجات):** بيّن رياضياً انطلاقاً من السندات أن المساحة الكلية $S(x)$ تُعطى بالعبارة $S(x) = \\frac{2x^3 + 64}{x}$، وحدّد مجموعة التعريف الملائمة للمسألة.
2. **التعليمة الثانية (${p2} درجات):** احسب المشتقة $S'(x)$ وادرس إشارتها على المجال $]0; +\\infty[$، ثم استنتج جدول تغيرات الدالة $S$ وعيّن قيمة $x$ التي تجعل المساحة أصغر ما يمكن.
3. **التعليمة الثالثة (${p3} درجات):** احسب في هذه الحالة أبعاد الحاوية ($x$ و$h$)، وقدّم تقديراً مبرراً لأقل تكلفة ممكنة لصنع الحاوية، مبيناً الفائدة العملية للنمذجة الرياضية.`;

      rubricText = `#### ⚖️ سلّم التنقيط المفصل (${maxScore} درجة):
- **التعليمة 1 (${p1} ن):** التعبير عن $h$ بدلالة $x$ ($1.0$ ن) + إثبات عبارة $S(x)$ وتحديد المجال ($1.0$ ن) + سلامة الرموز الرياضية ($0.5$ ن).
- **التعليمة 2 (${p2} ن):** حساب المشتقة $S'(x) = 4x - 64/x^2 = \\frac{4(x^3 - 16)}{x^2}$ ($2.5$ ن) + حل المعادلة $S'(x) = 0$ واستخراج $x = \\sqrt[3]{16} \\approx 2.52$ ($2.0$ ن) + جدول التغيرات واستنتاج القيمة الحدية الصغرى ($1.5$ ن).
- **التعليمة 3 (${p3} ن):** حساب الارتفاع $h$ والمساحة الصغرى ($2.0$ ن) + حساب التكلفة الإجمالية بالدينار ($1.5$ ن) + الخلاصة المنهجية ($1.5$ ن).`;

      criteriaText = `| معيار التقويم (APC) | المؤشرات الإجرائية | العلامة المخصصة |
| :--- | :--- | :---: |
| **م1: وجاهة المنتوج (Pertinence)** | فهم المشكلة، احترام التعليمات، واستغلال سندات المسألة | **${Math.round(maxScore * 0.25)} ن** |
| **م2: الاستعمال السليم لأدوات المادة** | التطبيق الصحيح للاشتقاق، حل المعادلات، وجدول التغيرات | **${Math.round(maxScore * 0.40)} ن** |
| **م3: انسجام وتناسق المنتوج** | تسلسل منطقي للبرهان واستنتاج سليم للأبعاد والتكلفة | **${Math.round(maxScore * 0.25)} ن** |
| **م4: الإتقان والتميز** | نظافة الورقة، دقة الحسابات، وتنظيم ورقة الإجابة | **${maxScore - Math.round(maxScore * 0.25) - Math.round(maxScore * 0.40) - Math.round(maxScore * 0.25)} ن** |`;

      hintsText = `💡 **إرشادات للطلبة:** انتبه لعدم نسيان تربيع المقام عند اشتقاق الكسر، وتأكد من التحقق من أن المشتقة تنعدم وتغير إشارتها من السالب إلى الموجب لضمان أنها قيمة حدية صغرى وليست عظمى.`;
    } else if (selectedStyle === 'quick_quiz') {
      questionsText = `#### ⏱️ المدة الزمنية: 20 دقيقة | مجموع الدرجات: ${maxScore} درجة

#### الجزء الأول: أسئلة الاختيار من متعدد مع التعليل (${q1Score + 1} درجات)
1. إذا كانت $f$ دالة معرفة على $\\mathbb{R}$ بـ $f(x) = \\frac{2x - 1}{x^2 + 1}$، فإن مشتقتها $f'(x)$ تساوي:
   - **(أ)** $\\frac{2}{2x}$
   - **(ب)** $\\frac{-2x^2 + 2x + 2}{(x^2 + 1)^2}$
   - **(ج)** $\\frac{2(1 - x^2)}{(x^2 + 1)^2}$
   *(علل اختيارك بحساب رياضي مقتضب في سطرين)*.

2. نهاية الدالة $g(x) = \\sqrt{x^2 + 3} - x$ لما يؤول $x$ إلى $+\\infty$ هي:
   - **(أ)** $+\\infty$
   - **(ب)** $0$
   - **(ج)** $3$
   *(بيّن طريقة إزالة حالة عدم التعيين)*.

#### الجزء الثاني: صحيح أو خطأ مع تصحيح الخطأ (${q2Score - 1} درجات)
1. "إذا كانت مشتقة دالة موجبة تماماً على مجال $I$ فإن الدالة متزايدة تماماً على هذا المجال." **(صحيح / خطأ مع التعليل)**
2. "المستقيم ذو المعادلة $x = 2$ هو مقارب أفقي للمنحنى $C_f$ عند اللانهاية." **(صحيح / خطأ مع التعليل)**

#### الجزء الثالث: مسألة مصغرة وسريعة (${q3Score} درجات)
- عيّن إشارة العبارة $P(x) = 2x^2 - 5x + 2$ على $\\mathbb{R}$ بعد حساب المميز $\\Delta$، واستنتج حلول المتراجحة $P(x) \\le 0$.`;

      rubricText = `#### ⚖️ سلّم التنقيط السريع (${maxScore} ن):
- السؤال 1 (QCM): اختيار صحيح ($1.0$ ن) + تعليل الحساب ($1.5$ ن).
- السؤال 2 (QCM): اختيار صحيح ($1.0$ ن) + إزالة حالة عدم التعيين بالضرب في المرافق ($1.5$ ن).
- الجزء الثاني (ص/خ): العبارة 1 ($1.5$ ن) + العبارة 2 وتصحيحها ($1.5$ ن).
- المسألة المصغرة: حساب $\\Delta = 9$ وتحديد الجذرين $x_1 = 1/2, x_2 = 2$ ($2.0$ ن) + جدول الإشارة ومجموعة الحلول ($1.5$ ن).`;

      criteriaText = `فحص سريع للمكتسبات: التركيز على السرعة، سلامة القواعد الأساسية، والقدرة على التبرير السريع.`;
      hintsText = `💡 **تنبيه:** في إزالة حالات عدم التعيين من شكل $\\infty - \\infty$ للجذور التربيعية، استعمال المرافق هو المفتاح الأسرع.`;
    } else if (selectedStyle === 'remediation') {
      questionsText = `#### 🩺 تشخيص الهدف: تدارك الخلط في دراسة الإشارة وتطبيق مبرهنة القيم المتوسطة

#### المحطة الأولى: تذكير وتطبيق مسعف خطوة بخطوة (${q1Score} درجات)
- لتكن الدالة $h(x) = x^3 - 3x + 1$ معرفة على $[0; 2]$.
  1. احسب المشتقة $h'(x)$ وضعها في جداء عوامل.
  2. بمساعدتك بالجدول المرفق، املأ إشارة $h'(x)$ على المجال المعطى.

#### المحطة الثانية: تفكيك وتحليل خطأ شائع (${q2Score} درجات)
- كتب زميلك في ورقة إجابته: *"بما أن $h(0) = 1$ و$h(2) = 3$ فإن المعادلة $h(x) = 0$ لا تقبل أي حل في $[0; 2]$ لأن جداءهما موجب"*!
  1. أين يكمن الخطأ المنهجي في استنتاج زميلك؟ (تلميح: هل الدالة رتيبة على المجال بالكامل؟)
  2. احسب $h(1)$ وأعد صياغة البرهان الصحيح لتطبيق مبرهنة القيم المتوسطة على المجال $[0; 1]$ أو $[1; 2]$.

#### المحطة الثالثة: إعادة استثمار مستقل ومحفز (${q3Score} درجات)
- طبّق ما تعلمته لإثبات أن المعادلة $x^3 + 2x - 5 = 0$ تقبل حلاً وحيداً $\\alpha$ في المجال $[1; 2]$، مع تحديد حصر له سعته $0.1$.`;

      rubricText = `#### ⚖️ سلّم التنقيط التشجيعي (${maxScore} ن):
- المحطة 1: حساب المشتقة والتحليل ($1.5$ ن) + جدول الإشارة الصحيح ($1.5$ ن).
- المحطة 2: اكتشاف موضع الخلل وتفسيره ($2.0$ ن) + صياغة شروط المبرهنة (الاستمرار والرتابة) ($2.0$ ن).
- المحطة 3: إثبات الاستمرار والرتابة ($1.5$ ن) + إثبات اختلاف الإشارة وحساب الحصر ($1.5$ ن).`;

      criteriaText = `معايير العلاج: الجرأة على تشخيص الخطأ، استيعاب شروط النظريات بدقة، وتطبيقها دون تسرع.`;
      hintsText = `💡 **قاعدة ذهبية:** لا يمكن تطبيق مبرهنة القيم المتوسطة إلا بعد التأكد من شرطين معاً: الاستمرارية والرتابة التامة على المجال المستهدف.`;
    } else if (selectedStyle === 'research_project') {
      questionsText = `#### 🔬 مشروع بحث واستكشاف رياضي تطبيقي (${maxScore} درجة)
**عنوان المشروع:** «النمذجة الرياضية بالدوال والمتتاليات في التنبؤ بانتشار الأوبئة وتدبير الموارد الاقتصادية»

#### محاور التكليف والمهام المطلوبة:
1. **المحور الأول (التأصيل النظري):** ابحث في كيفية تحويل ظاهرة تزايد أعداد المصابين أو نمو رؤوس الأموال إلى متتالية هندسية أو دالة لوجستية أسية (نموذج مالتوس ونموذج فيرهولست).
2. **المحور الثاني (المعالجة الحسابية):** اختر مجموعة بيانات واقعية افتراضية (مثلاً تطور عدد مستخدمي تطبيق رقمي خلال 12 شهراً)، وأنشئ جدولاً بيانياً، ثم استخرج معادلة الانحدار أو الدالة الرياضية المقاربة.
3. **المحور الثالث (الاستنتاج والتوصيات):** أعد تقريراً من صفحتين يتضمن:
   - مقدمة حول نشأة النمذجة الرياضية.
   - التمثيل البياني بواسطة برنامج جيوجبرا (GeoGebra) أو إكسل (Excel).
   - قراءة نقدية لحدود النموذج الرياضي في التنبؤات طويلة الأجل.`;

      rubricText = `#### ⚖️ سلّم تقييم المشروع البحثي (${maxScore} ن):
- جودة التوثيق العلمي وصحة العلاقات الرياضية المستخدمة: 7 درجات.
- سلامة الحسابات والتمثيل البياني بالبرمجيات: 6 درجات.
- التنسيق والتنظيم ودقة المصطلحات والخلاصة النقدية: 5 درجات.
- الالتزام بموعد التسليم وشروط العرض: درجتان.`;

      criteriaText = `معايير تقييم المشروع: الأصالة العلمية، التوظيف العملي للبرمجيات، والقدرة على الربط بين الرياضيات والواقع المعاش.`;
      hintsText = `💡 **نصيحة:** استعن بموقع GeoGebra المجاني لتمثيل المنحنيات وإدراج الصور التوضيحية داخل التقرير لرفع درجة تميز عملك.`;
    } else {
      // Standard Practice
      questionsText = `#### ❓ المسألة الأولى (${q1Score} درجات): استرجاع وتنظيم المفاهيم
1. عرّف بدقة مفهوم قابلية اشتقاق دالة عند نقطة $x_0$، وما هو التفسير الهندسي للعدد المشتق $f'(x_0)$؟
2. اكتب معادلة مماس منحنى الدالة عند النقطة ذات الفاصلة $x_0$.
3. اذكر شرطين كافيين لتكون النقطة $A(x_0, f(x_0))$ نقطة انعطاف لمنحنى دالة.

#### ❓ المسألة الثانية (${q2Score} درجات): دراسة وتطبيق إجرائي لدالة عددية
نعتبر الدالة $f$ المعرفة على $D = \\mathbb{R} \\setminus \\{1\\}$ بـ: $f(x) = \\frac{x^2 - 3x + 6}{x - 1}$. وليكن $(C_f)$ تمثيلها البياني في معلم متعامد ومتجانس.
1. عيّن الأعداد الحقيقية $a$ و$b$ و$c$ بحيث يكون من أجل كل $x \\in D$: $f(x) = ax + b + \\frac{c}{x - 1}$.
2. احسب نهايات الدالة $f$ عند أطراف مجالات التعريف، واستنتج معادلات المستقيمات المقاربة الموازية للمحاور.
3. بيّن أن المستقيم $(\\Delta)$ ذو المعادلة $y = x - 2$ مقارب مائل للمنحنى $(C_f)$ عند $\\pm \\infty$.
4. احسب المشتقة $f'(x)$ وأثبت أنها تنعدم عند قيمتين يُطلب تعيينهما، ثم شكّل جدول تغيرات الدالة $f$.

#### ❓ المسألة الثالثة (${q3Score} درجات): إدماج واستنتاج بياني
1. ادرس الوضع النسبي للمنحنى $(C_f)$ والمستقيم المقارب المائل $(\\Delta)$.
2. أثبت أن النقطة $\\Omega(1, -1)$ هي مركز تناظر للمنحنى $(C_f)$.
3. ارسم المستقيمات المقاربة والمنحنى $(C_f)$ بدقة مع إبراز الذروات ومراكز التناظر.`;

      rubricText = `#### ⚖️ سلّم توزيع الدرجات (${maxScore} درجة):
- **المسألة الأولى (${q1Score} ن):** تعريف قابلية الاشتقاق والتفسير الهندسي ($1.5$ ن) + معادلة المماس ($1.0$ ن) + شروط نقطة الانعطاف ($1.5$ ن).
- **المسألة الثانية (${q2Score} ن):** المطابقة واستخراج $a=1, b=-2, c=4$ ($1.5$ ن) + حساب النهايات الأربعة ($2.0$ ن) + برهان المقارب المائل ($1.5$ ن) + حساب $f'(x) = \\frac{x^2-2x-3}{(x-1)^2}$ وجدول التغيرات ($2.5$ ن).
- **المسألة الثالثة (${q3Score} ن):** دراسة إشارة الفرق $f(x)-y$ وتحديد الوضع النسبي ($1.5$ ن) + إثبات مركز التناظر بالقانون $f(2a-x)+f(x)=2b$ ($2.0$ ن) + دقة الرسم الهندسي ($1.5$ ن).`;

      criteriaText = `| المعيار | المؤشر الإجرائي | النسبة |
| :--- | :--- | :---: |
| **دقة القواعد الرياضية** | تطبيق قوانين النهايات والاشتقاق دون أخطاء حسابية | **40%** |
| **سلامة البرهان المنطقي** | التدرج في الاستنتاج وتبرير كل خطوة بالقوانين الرياضية | **35%** |
| **الدقة والتمثيل البياني** | رسم المنحنى واحترام المقاربات والذروات | **25%** |`;

      hintsText = `💡 **توجيهات للحل:** عند حساب النهايات عند القيمة الممنوعة $1$، ادرس إشارة المقام $(x - 1)$ بدقة لتمييز بقيم كبرى عن بقيم صغرى.`;
    }

    const fullDesc = [
      instructions,
      `---\n\n${questionsText}`,
      `---\n\n${rubricText}`,
      criteriaText ? `---\n\n### 📊 معايير وشبكة التقييم:\n${criteriaText}` : '',
      hintsText ? `---\n\n${hintsText}` : '',
    ].filter(Boolean).join('\n\n');

    return {
      suggestedTitle: finalTitle,
      suggestedSubject: 'الرياضيات',
      suggestedType: targetType,
      suggestedMaxScore: maxScore,
      style: selectedStyle,
      difficulty: selectedDifficulty,
      lessonTitle: topic,
      unitTitle: unitTitle || 'الوحدة المقررة',
      instructions,
      questionsText,
      rubricText,
      criteriaText,
      hintsText,
      suggestedDescription: fullDesc,
      explanation: `قام المساعد التربوي بصياغة هذا التكليف المتكامل في مادة الرياضيات بأسلوب «${selectedStyle}» ومستوى «${selectedDifficulty}»، شاملاً السندات والأسئلة وسلم التنقيط الدقيق (${maxScore} ن) استناداً إلى المنهاج المعتمد.`,
      provider: 'pedagogical_synthesizer',
      model: 'math_curriculum_v2',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Subject 2: Physics & Chemistry (العلوم الفيزيائية والتكنولوجيا)
  // ══════════════════════════════════════════════════════════════════════════════
  private synthesizePhysicsChemistryAssignment(p: any) {
    const { rawTitle, rawDesc, lessonTitle, unitTitle, selectedStyle, selectedDifficulty, maxScore, targetType } = p;
    const topic = lessonTitle || rawTitle || 'الميكانيكا وقوانين نيوتن / التحولات الكيميائية';
    const finalTitle = rawTitle || (
      selectedStyle === 'apc_integration' ? `وضعية إدماجية: دراسة فيزيائية تطبيقية (${topic})` :
      selectedStyle === 'quick_quiz' ? `اختبار قصير: التحقق من المفاهيم الفيزيائية (${topic})` :
      selectedStyle === 'remediation' ? `دعم وعلاج: معالجة صعوبات التحويلات والقوانين في (${topic})` :
      selectedStyle === 'research_project' ? `مشروع استكشافي: التطبيقات الطاقوية والتكنولوجية (${topic})` :
      `واجب تطبيقي متدرج: ${topic}`
    );

    const q1Score = Math.max(1, Math.round(maxScore * 0.3));
    const q2Score = Math.max(1, Math.round(maxScore * 0.45));
    const q3Score = Math.max(1, maxScore - q1Score - q2Score);

    let instructions = `### 📌 تعليمات وإرشادات الإنجاز:
- تدوين الحل بخط واضح ومنظم مع ذكر رقم كل تمرين وفرعه.
- كتابة القوانين الحرفية أولاً قبل إجراء أي تطبيق عددي.
- إلزامية كتابة وحدات القياس الدولية (SI) بجانب كل نتيجة عددية (يُخصم نصف نقطة على كل وحدة مفقودة).
- إبراز شروط تطبيق القوانين وتحديد المرجع العطالي المناسب في كل مسألة ميكانيكية.
${rawDesc ? `\n### 📝 ملاحظات ومسودة الأستاذ:\n${rawDesc}` : ''}`;

    let questionsText = '';
    let rubricText = '';
    let criteriaText = '';
    let hintsText = '';

    if (selectedStyle === 'apc_integration') {
      questionsText = `#### 🎯 الكفاءة المستهدفة: توظيف قوانين الحركة والتحولات الكيميائية لحل مشكلة سلامة تقنية

#### 📖 السياق الواقعي (Le Contexte):
أثناء الفحص الدوري لسيارة سياحية، لاحظ مهندس الصيانة تآكل وسائد الفرامل ووجود ترسبات في دارة سائل التبريد. لإعداد تقرير تقني دقيق حول مسافة التوقف المطلوبة في الحالات الطارئة ومستوى حموضة سائل التبريد، طُلب منك كخبير فيزيائي دراسة الحركية وإجراء معايرة مخبرية.

#### 📊 السندات المعتمدة:
- **السند (1):** كتلة السيارة بركابها $M = 1200\\text{ kg}$، وتتحرك بسرعة ابتدائية $v_0 = 90\\text{ km/h} = 25\\text{ m/s}$ على طريق أفقي مستقيم.
- **السند (2):** قوة الاحتكاك المكافحة الناتجة عن الكبح نعتبرها ثابتة وتساوي $f = 6000\\text{ N}$، وقوة الجاذبية $g = 9.8\\text{ m/s}^2$.
- **السند (3):** منحنى تغيرات السرعة بدلالة الزمن $v(t)$، ومعادلة تفاعل المعايرة لسائل التبريد مع هيدروكسيد الصوديوم.

#### ✍️ التعليمات الإجرائية (Les Consignes):
1. **التعليمة الأولى (${q1Score} ن):** حدّد الجملة المدروسة والمرجع العطالي الملائم، ومثّل القوى الخارجية المؤثرة على السيارة أثناء الكبح على مخطط واضح.
2. **التعليمة الثانية (${q2Score} ن):** بتطبيق القانون الثاني لنيوتن، أوجد العبارة الحرفية للتسارع $a$، ثم احسب قيمته العددية مبيناً طبيعة الحركة. استنتج زمن التوقف $t_s$ ومسافة التوقف $d_s$.
3. **التعليمة الثالثة (${q3Score} ن):** قارن مسافة التوقف المحسوبة مع المسافة الأمنية الموصى بها في قانون المرور ($50\\text{ m}$)، وقدّم نصيحتين بيداغوجيتين للسائقين مدعمتين بالتفسير الفيزيائي.`;

      rubricText = `#### ⚖️ سلّم التنقيط المفصل (${maxScore} ن):
- التعليمة 1: تحديد الجملة والمرجع بدقة ($1.5$ ن) + تمثيل القوى (الثقل، رد الفعل، قوة الاحتكاك) بأسهم صحيحة ($2.5$ ن).
- التعليمة 2: نص القانون الثاني لنيوتن $\\sum \\vec{F} = M \\vec{a}$ والإسقاط على محور الحركة ($2.5$ ن) + حساب التسارع $a = -f/M = -5\\text{ m/s}^2$ وطبيعة الحركة ($2.0$ ن) + حساب زمن التوقف $t_s = 5\\text{ s}$ ومسافة التوقف $d_s = 62.5\\text{ m}$ مع الوحدات ($2.5$ ن).
- التعليمة 3: المقارنة الموضوعية ($62.5 > 50\\text{ m}$) وتشخيص الخطر ($2.5$ ن) + تقديم نصائح مبررة فيزيائياً (تخفيض السرعة ومراعاة حالة الطريق) ($2.5$ ن).`;

      criteriaText = `| معيار التقويم APC | المؤشرات | العلامة |
| :--- | :--- | :---: |
| **م1: الوجاهة وملاءمة المنتوج** | استثمار معطيات المسألة واحترام مراحل حل المشكلة | **25%** |
| **م2: الاستعمال السليم لأدوات المادة** | التطبيق الصحيح لقوانين نيوتن، العلاقات الحركية، والوحدات | **45%** |
| **م3: الانسجام والتناسق** | التسلسل المنطقي من المخطط إلى المعادلة ثم التطبيق العددي | **20%** |
| **م4: الإتقان والدقة** | تنظيم ورقة الإجابة ووضوح الرسم البياني | **10%** |`;

      hintsText = `💡 **تنبيه:** تذكر دائماً تحويل السرعة من $\\text{km/h}$ إلى $\\text{m/s}$ بالقسمة على $3.6$ قبل التعويض في معادلات الحركة.`;
    } else if (selectedStyle === 'quick_quiz') {
      questionsText = `#### ⏱️ اختبار قصير وسريع (20 دقيقة) | الدرجة: ${maxScore} ن

#### الجزء الأول: الاختيار من متعدد مع التبرير (${q1Score} ن)
1. وحدة قياس ثابت الزمن $\\tau$ لدارة $RC$ في النظام الدولي للوحدات هي:
   - **(أ)** الفولت (V)
   - **(ب)** الثانية (s)
   - **(ج)** الأوم ($\\Omega$)
   *(علل إجابتك بالتحليل البعدي في سطرين)*.

2. عند اللحظة $t = 5\\tau$ في عملية شحن المكثفة، تبلغ شحنتها $q(t)$ نسبة:
   - **(أ)** 63% من شحنتها الأعظمية
   - **(ب)** 99% من شحنتها الأعظمية
   - **(ج)** 50% من شحنتها الأعظمية

#### الجزء الثاني: صح أو خطأ مع تصحيح الخطأ (${q2Score} ن)
1. "القانون الأول لنيوتن يطبق في أي مرجع دون اشتراط كونه عطالياً." **(صحيح / خطأ مع التعليل)**
2. "السرعة الحجمية للتفاعل الكيميائي تتناقص بمرور الزمن نتيجة تناقص تراكيز المتفاعلات." **(صحيح / خطأ مع التعليل)**

#### الجزء الثالث: مسألة مصغرة وسريعة (${q3Score} ن)
- ينطلق جسم كتلته $m = 200\\text{ g}$ من السكون تحت تأثير قوة جر أفقية ثابتة $F = 1.2\\text{ N}$. باهمال الاحتكاكات، احسب تسارع الجسم وسرعته بعد قطع مسافة $4\\text{ m}$.`;

      rubricText = `#### ⚖️ سلّم التنقيط السريع (${maxScore} ن):
- التحليل البعدي لثابت الزمن: $[\\tau] = [R] \\times [C] = [T]$ (الثانية) ($2.5$ ن).
- شحن المكثفة عند $5\\tau$: اختيار 99% ($1.5$ ن).
- الجزء الثاني: العبارة 1 خطأ وبيان شرط المرجع العطالي ($2.0$ ن) + العبارة 2 صحيح مع التفسير المجهري ($2.0$ ن).
- المسألة السريعة: تحويل الكتلة إلى $0.2\\text{ kg}$ وحساب $a = F/m = 6\\text{ m/s}^2$ ($2.5$ ن) + حساب السرعة $v = \\sqrt{2ad} = 6.93\\text{ m/s}$ ($2.5$ ن).`;

      criteriaText = `الفحص التكويني: التركيز على الاستحضار الفوري للمفاهيم الفيزيائية والتحليل البعدي السليم.`;
      hintsText = `💡 **نصيحة:** التحليل البعدي هو الأداة الأكثر موثوقية للتأكد من صحة القوانين الفيزيائية واشتقاق الوحدات.`;
    } else {
      // Standard Practice / Drill
      questionsText = `#### ❓ التمرين الأول (${q1Score} درجات): استرجاع القوانين والمفاهيم
1. اذكر نص القانون الثاني لنيوتن وبيّن الفرق الجوهري بين الكتلة والوزن.
2. ما هو المرجع الهيليومركزي (مرجع كوبرنيك) وما هو مجال تطبيقه؟
3. عرّف الحركة الدائرية المنتظمة واذكر عبارتي التسارع المماسي والتسارع الناظمي في معلم فريني.

#### ❓ التمرين الثاني (${q2Score} درجات): دراسة حركة قمر اصطناعي حول الأرض
يدور قمر اصطناعي كتلته $m_s = 850\\text{ kg}$ حول الأرض في مسار دائري نصف قطره $r = R_T + h$ على ارتفاع $h = 600\\text{ km}$ من سطح الأرض.
- معطيات: نصف قطر الأرض $R_T = 6400\\text{ km}$، كتلة الأرض $M_T = 5.97 \\times 10^{24}\\text{ kg}$، ثابت الجذب العام $G = 6.67 \\times 10^{-11}\\text{ SI}$.
1. مثّل الأرض والقمر الاصطناعي وشعاع القوة التي تطبقها الأرض على القمر $\\vec{F}_{T/s}$.
2. بتطبيق القانون الثاني لنيوتن في المرجع الجيو مركزي، أثبت أن حركة القمر الاصطناعي دائرية منتظمة، واستخرج عبارة سرعته المدارية $v$.
3. احسب القيمة العددية للسرعة $v$ بوحدة $\\text{m/s}$ ثم بوحدة $\\text{km/h}$.
4. أوجد عبارة الدور المداري $T$ للقمر واحسب قيمته بالساعات والدقائق.

#### ❓ التمرين الثالث (${q3Score} درجات): قانون كبلر الثالث والاستنتاج
1. بيّن أن النسبة $\\frac{T^2}{r^3}$ ثابتة لا تتعلق بالقمر الاصطناعي، واستنتج نص القانون الثالث لكبلر.
2. هل يمكن اعتبار هذا القمر قمراً مستقراً بالنسبة للأرض (Géostationnaire)؟ برّر إجابتك بحساب الارتفاع والشروط الواجب توفرها.`;

      rubricText = `#### ⚖️ سلّم توزيع الدرجات (${maxScore} درجة):
- **التمرين 1 (${q1Score} ن):** نص قانون نيوتن ($1.5$ ن) + المرجع الهيليومركزي ($1.5$ ن) + مركبات التسارع في معلم فريني $a_t = 0, a_n = v^2/r$ ($2.0$ ن).
- **التمرين 2 (${q2Score} ن):** التمثيل الهندسي للقوة الموجهة نحو مركز الأرض ($1.5$ ن) + تطبيق القانون الثاني لنيوتن وإثبات الحركة المنتظمة ($2.5$ ن) + حساب السرعة $v = \\sqrt{G M_T / r} \\approx 7560\\text{ m/s}$ ($2.0$ ن) + حساب الدور $T = 2\\pi r / v \\approx 5815\\text{ s} \\approx 1.61\\text{ h}$ ($2.0$ ن).
- **التمرين 3 (${q3Score} ن):** إثبات القانون الثالث لكبلر $\\frac{T^2}{r^3} = \\frac{4\\pi^2}{G M_T}$ ($2.5$ ن) + مناقشة شروط القمر المستقر جغرافياً وعدم تحققها هنا لأن دوره لا يساوي 24 ساعة ($2.5$ ن).`;

      criteriaText = `| المعيار | المؤشرات | الوزن |
| :--- | :--- | :---: |
| **الاستدلال الفيزيائي السليم** | اختيار المرجع، كتابة القوانين، والإسقاط الصحيح | **40%** |
| **الدقة في الحساب والوحدات** | التحويل للكيلوغرام والمتر والثانية وكتابة الوحدات | **35%** |
| **التحليل والاستنتاج** | المقارنة مع المعطيات الواقعية وقوانين كبلر | **25%** |`;

      hintsText = `💡 **تنبيه هام:** لا تنس جمع نصف قطر الأرض $R_T$ مع الارتفاع $h$ وتحويل الكل إلى المتر (الضرب في $10^3$) قبل التعويض في عبارة السرعة والدور.`;
    }

    const fullDesc = [
      instructions,
      `---\n\n${questionsText}`,
      `---\n\n${rubricText}`,
      criteriaText ? `---\n\n### 📊 معايير وشبكة التقييم:\n${criteriaText}` : '',
      hintsText ? `---\n\n${hintsText}` : '',
    ].filter(Boolean).join('\n\n');

    return {
      suggestedTitle: finalTitle,
      suggestedSubject: 'العلوم الفيزيائية والتكنولوجيا',
      suggestedType: targetType,
      suggestedMaxScore: maxScore,
      style: selectedStyle,
      difficulty: selectedDifficulty,
      lessonTitle: topic,
      unitTitle: unitTitle || 'الوحدة المقررة',
      instructions,
      questionsText,
      rubricText,
      criteriaText,
      hintsText,
      suggestedDescription: fullDesc,
      explanation: `تم إعداد هذا الواجب الفيزيائي التخصصي بنمط «${selectedStyle}» ومستوى «${selectedDifficulty}»، شاملاً السندات وقوانين الحركة والمعايرة وسلم التنقيط المجزأ بدقة (${maxScore} ن).`,
      provider: 'pedagogical_synthesizer',
      model: 'physics_curriculum_v2',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Subject 3: Life Sciences (علوم الطبيعة والحياة)
  // ══════════════════════════════════════════════════════════════════════════════
  private synthesizeLifeSciencesAssignment(p: any) {
    const { rawTitle, rawDesc, lessonTitle, unitTitle, selectedStyle, selectedDifficulty, maxScore, targetType } = p;
    const topic = lessonTitle || rawTitle || 'آليات تركيب البروتين / الاستجابة المناعية';
    const finalTitle = rawTitle || `واجب تطبيقي في علوم الطبيعة والحياة: ${topic}`;

    const q1Score = Math.max(1, Math.round(maxScore * 0.35));
    const q2Score = Math.max(1, Math.round(maxScore * 0.45));
    const q3Score = Math.max(1, maxScore - q1Score - q2Score);

    const instructions = `### 📌 تعليمات وإرشادات الإنجاز:
- استثمار الوثائق العلمية استثماراً منهجياً: (تقديم الوثيقة، استخراج المعلومات ذات الدلالة، التفسير، والاستنتاج).
- استخدام المصطلحات العلمية الدقيقة (مثل: الاستنساخ، الترجمة، الشفرة الوراثية، مجمع التوافق النسيجي HLA، الخلايا اللمفاوية).
- الحرص على إنجاز الرسومات التخطيطية الوظيفية بقلم الرصاص مع وضع العنوان والبيانات الكاملة وإحاطتها بإطار.
${rawDesc ? `\n### 📝 مسودة وملاحظات الأستاذ:\n${rawDesc}` : ''}`;

    const questionsText = `#### ❓ التمرين الأول (${q1Score} درجات): استرجاع منظم للمعارف
1. حدّد مقر وآليات مرحلتي التعبير المورثي (الاستنساخ والترجمة) في الخلية حقيقية النواة، مبرزاً الشروط الجزيئية الضرورية لكل مرحلة.
2. أنجز رسماً تخطيطياً وظيفياً متقناً يوضح بنية وتعدد مواقع المعقد الريبوزومي الوظيفي أثناء مرحلة الاستطالة مع كامل البيانات.

#### ❓ التمرين الثاني (${q2Score} درجات): الاستدلال العلمي وحل المشكلات
تمثل الوثيقة المرفقة نتائج تجريبية لدراسة تأثير مضاد حيوي (ألفا أمانيتين) على نشاط إنزيم ARN بوليميراز في خلايا ورمية.
1. حلّل معطيات المنحنى البياني الممثل لتغيرات النسبة المئوية لتركيب البروتين بدلالة تركيز المضاد الحيوي، واستنتج طريقة تأثيره.
2. اشرح كيف يمكن استغلال هذه الخاصية في تطوير علاجات مستهدفة للأورام السرطانية دون الإضرار بالخلايا السليمة بشكل حاد.

#### ❓ التمرين الثالث (${q3Score} درجات): التركيب والخلاصة التركيبية
- انطلاقاً من المكتسبات ومعطيات التكليف، لخّص في فقرة علمية متناسقة من 8 أسطر كيف تترجم المعلومة الوراثية المحمولة على ADN إلى نمط ظاهري مرئي على المستوى الجزيئي والخلوي والعياني.`;

    const rubricText = `#### ⚖️ سلّم توزيع الدرجات (${maxScore} درجة):
- **التمرين 1 (${q1Score} ن):** تحديد المقر والشروط الجزيئية ($2.5$ ن) + الرسم التخطيطي الوظيفي للريبوزوم مع العنوان والبيانات ($3.0$ ن).
- **التمرين 2 (${q2Score} ن):** التحليل المنهجي للمنحنى (التقديم + التفكيك + الاستنتاج) ($3.5$ ن) + الشرح العلمي للتطبيق العلاجي المقترح ($3.5$ ن).
- **التمرين 3 (${q3Score} ن):** سلامة المفاهيم العلمية للفقرة التركيبية ($2.0$ ن) + تسلسل المستويات (جزيئي -> خلوي -> عياني) ($2.0$ ن) + جودة اللغة العلمية والربط ($1.5$ ن).`;

    const criteriaText = `شبكة تقييم الاستدلال العلمي: التحكم في المنهجية (التحليل، التفسير، الاستنتاج، والتركيب)، وتوظيف المصطلحات البيولوجية السليمة.`;
    const hintsText = `💡 **توجيه منهجي:** في التحليل، لا تكتف بقراءة الأرقام بل قسّم المنحنى إلى فترات واضحة واستخرج العلاقة السببية قبل كتابة الاستنتاج.`;

    const fullDesc = [instructions, `---\n\n${questionsText}`, `---\n\n${rubricText}`, `---\n\n### 📊 شبكة التقييم:\n${criteriaText}`, `---\n\n${hintsText}`].join('\n\n');

    return {
      suggestedTitle: finalTitle,
      suggestedSubject: 'علوم الطبيعة والحياة',
      suggestedType: targetType,
      suggestedMaxScore: maxScore,
      style: selectedStyle,
      difficulty: selectedDifficulty,
      lessonTitle: topic,
      unitTitle: unitTitle || 'الوحدة المقررة',
      instructions,
      questionsText,
      rubricText,
      criteriaText,
      hintsText,
      suggestedDescription: fullDesc,
      explanation: `تمت صياغة واجب علوم الطبيعة والحياة وفق أحدث الممارسات المنهجية الرسمية (الاسترجاع المنظم، الاستدلال العلمي، والتركيب) بسلم تنقيط مفصل ومطابق لـ ${maxScore} درجة.`,
      provider: 'pedagogical_synthesizer',
      model: 'biology_curriculum_v2',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Subject 4: Arabic Language & Literature (اللغة العربية وآدابها)
  // ══════════════════════════════════════════════════════════════════════════════
  private synthesizeArabicAssignment(p: any) {
    const { rawTitle, rawDesc, lessonTitle, unitTitle, selectedStyle, selectedDifficulty, maxScore, targetType } = p;
    const topic = lessonTitle || rawTitle || 'دراسة سند أدبي وقواعد اللغة العربية';
    const finalTitle = rawTitle || `واجب في اللغة العربية وآدابها: ${topic}`;

    const q1Score = Math.max(1, Math.round(maxScore * 0.4));
    const q2Score = Math.max(1, Math.round(maxScore * 0.35));
    const q3Score = Math.max(1, maxScore - q1Score - q2Score);

    const instructions = `### 📌 تعليمات وإرشادات الإنجاز:
- قراءة السند الأدبي بتأنٍ وتذوق فني قبل الشروع في الإجابة عن الأسئلة.
- الإجابة في جمل تامة ومفيدة مع الالتزام بقواعد اللغة والإملاء وعلامات الترقيم.
- التعليل الدقيق عند استخراج الصور البيانية والمحسنات وتوضيح سر بلاغتها وأثرها في المعنى.
${rawDesc ? `\n### 📝 ملاحظات ومسودة الأستاذ:\n${rawDesc}` : ''}`;

    const questionsText = `#### أولاً: البناء الفكري (${q1Score} درجات)
1. ما القضية المركزية التي يعالجها النص؟ وما الهدف الذي يسعى الكاتب أو الشاعر إلى تحقيقه لدى القارئ؟
2. حدّد الفكرة العامة للنص، ثم قسّمه إلى وحداته الفكرية الأساسية مع وضع عنوان مناسب لكل وحدة.
3. ما النزعة الغالبة على الكاتب؟ استدل عليها بعبارتين دالتين من صلب السند.
4. لخّص مضمون النص بأسلوبك الخاص في حدود أربعة أسطر مراعياً تقنيات التلخيص السليم.

#### ثانياً: البناء اللغوي (${q2Score} درجات)
1. أعرب ما تحته خط في النص إعراب مفردات، وبيّن المحل الإعرابي للجمل الواقعة بين قوسين.
2. استخرج من الفقرة الثانية محسناً بديعياً مبيناً نوعه وأثره في المعنى، وصورة بيانية واشرحها مبيناً سر بلاغتها.
3. ما النمط النصي الغالب على السند؟ اذكر مؤشرين اثنين له مع التمثيل من النص.
4. دلّ على مظاهر الاتساق والانسجام البارزة في النص (أدوات الربط، الضمائر وعائدها).

#### ثالثاً: الوضعية الإدماجية / التقويم النقدي (${q3Score} درجات)
- اكتب فقرة نقدية حجاجية في حدود عشرة أسطر تناقش فيها مسؤولية الأديب والمثقف في عصر التحديات التكنولوجية نحو قضايا أمته، موظفاً جملة شرطية واستعارة مكنية مع وضع سطر تحت كل منهما.`;

    const rubricText = `#### ⚖️ سلّم التنقيط المفصل (${maxScore} درجة):
- **البناء الفكري (${q1Score} ن):** القضية المركزية والهدف ($2.0$ ن) + الفكرة العامة والتقسيم الفكري ($2.0$ ن) + تحديد النزعة والتمثيل ($1.5$ ن) + التلخيص (حجم النص وسلامة الأسلوب) ($2.5$ ن).
- **البناء اللغوي (${q2Score} ن):** الإعراب المفردي والجمل ($2.5$ ن) + الصورة البيانية والمحسن البديعي ($2.0$ ن) + النمط ومؤشراته ($1.5$ ن) + وسائل الاتساق والانسجام ($1.0$ ن).
- **الوضعية الإدماجية (${q3Score} ن):** الوجاهة والانسجام وملاءمة الأفكار ($2.0$ ن) + سلامة اللغة والخلو من الأخطاء ($1.5$ ن) + التوظيف السليم للمطلوب والإتقان ($1.5$ ن).`;

    const criteriaText = `معايير التقويم: ملاءمة المنتوج، الاستعمال السليم لآليات اللغة العربية، انسجام الأفكار، وجودة العرض والإبداع.`;
    const hintsText = `💡 **تنبيه:** في التلخيص، تجنب النسخ الحرفي لجمل النص، وتجنب استعمال عبارات مثل "يقول الكاتب"؛ بل صغ الأفكار بأسلوبك المركّز.`;

    const fullDesc = [instructions, `---\n\n${questionsText}`, `---\n\n${rubricText}`, `---\n\n### 📊 معايير التقويم:\n${criteriaText}`, `---\n\n${hintsText}`].join('\n\n');

    return {
      suggestedTitle: finalTitle,
      suggestedSubject: 'اللغة العربية وآدابها',
      suggestedType: targetType,
      suggestedMaxScore: maxScore,
      style: selectedStyle,
      difficulty: selectedDifficulty,
      lessonTitle: topic,
      unitTitle: unitTitle || 'الوحدة المقررة',
      instructions,
      questionsText,
      rubricText,
      criteriaText,
      hintsText,
      suggestedDescription: fullDesc,
      explanation: `صياغة أدبية وتربوية متكاملة للغة العربية تشمل محاور البناء الفكري، البناء اللغوي، والوضعية الإنتاجية النقدية مع شبكة تقييم دقيقة.`,
      provider: 'pedagogical_synthesizer',
      model: 'arabic_curriculum_v2',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Subject 5: Islamic & Social Studies (التربية الإسلامية والتاريخ والجغرافيا)
  // ══════════════════════════════════════════════════════════════════════════════
  private synthesizeSocialIslamicAssignment(p: any) {
    const { rawTitle, rawDesc, lessonTitle, unitTitle, selectedStyle, selectedDifficulty, maxScore, targetType } = p;
    const topic = lessonTitle || rawTitle || 'القيم والمقاصد الشرعية / التطورات التاريخية والجغرافية';
    const finalTitle = rawTitle || `واجب تطبيقي في ${p.subjectName}: ${topic}`;

    const q1Score = Math.max(1, Math.round(maxScore * 0.35));
    const q2Score = Math.max(1, Math.round(maxScore * 0.35));
    const q3Score = Math.max(1, maxScore - q1Score - q2Score);

    const instructions = `### 📌 تعليمات وإرشادات الإنجاز:
- استحضار الأدلة الشرعية المعتمدة أو الوثائق التاريخية والجغرافية بدقة.
- الاستدلال السليم وتحديد المفاهيم والمصطلحات بدقة علمية ومنهجية.
${rawDesc ? `\n### 📝 ملاحظات ومسودة الأستاذ:\n${rawDesc}` : ''}`;

    const questionsText = `#### الجزء الأول: استرجاع وتحديد المفاهيم (${q1Score} درجات)
1. عرّف المفاهيم والمصطلحات الأساسية المرتبطة بموضوع «${topic}».
2. استخرج حكمين وفائدتين رئيسيتين انطلاقاً من السند أو الوثيقة المقررة مع التعليل.

#### الجزء الثاني: التحليل والمقارنة المنهجية (${q2Score} درجات)
1. حلّل أسباب وتداعيات الظاهرة المدروسة مبرزاً الأبعاد الفكرية والمجتمعية المرتبطة بها.
2. أجرِ مقارنة منظمة في جدول يبرز أوجه الشبه والاختلاف بين العناصر المدروسة.

#### الجزء الثالث: الوضعية الإدماجية والحلول المقترحة (${q3Score} درجات)
- انطلاقاً من معطيات الدرس والواقع المعاش، قدّم رؤية تحليلية نقدية من 10 أسطر تقترح فيها حلولاً عملية لمعالجة التحديات المطروحة في هذا المجال.`;

    const rubricText = `#### ⚖️ سلّم التنقيط (${maxScore} ن):
- الجزء الأول: دقة المفاهيم ($3.0$ ن) + استخراج الأحكام والفوائد والتعليل ($3.0$ ن).
- الجزء الثاني: التحليل المنهجي ($3.5$ ن) + جدول المقارنة ($2.5$ ن).
- الجزء الثالث: الوجاهة والحلول المقترحة ($4.0$ ن) + سلامة العرض واللغة ($2.0$ ن).`;

    const criteriaText = `معايير التقويم: الفهم السليم للمفاهيم، دقة الاستدلال، والقدرة على الربط بين النظري والتطبيقي.`;
    const hintsText = `💡 **تنبيه:** فرّق بدقة بين "الحكم الشرعي" (واجب، مستحب، محرم...) و"الفائدة" (حكمة، قيمة أخلاقية).`;

    const fullDesc = [instructions, `---\n\n${questionsText}`, `---\n\n${rubricText}`, `---\n\n### 📊 معايير التقويم:\n${criteriaText}`, `---\n\n${hintsText}`].join('\n\n');

    return {
      suggestedTitle: finalTitle,
      suggestedSubject: p.subjectName,
      suggestedType: targetType,
      suggestedMaxScore: maxScore,
      style: selectedStyle,
      difficulty: selectedDifficulty,
      lessonTitle: topic,
      unitTitle: unitTitle || 'الوحدة المقررة',
      instructions,
      questionsText,
      rubricText,
      criteriaText,
      hintsText,
      suggestedDescription: fullDesc,
      explanation: `تم إعداد الواجب وفق الأطر المرجعية المعتمدة لمادة ${p.subjectName} مع التدرج في مستويات التحليل والتقويم.`,
      provider: 'pedagogical_synthesizer',
      model: 'social_curriculum_v2',
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Subject 6: General / Other Curricula (المقرر العام)
  // ══════════════════════════════════════════════════════════════════════════════
  private synthesizeGeneralAssignment(p: any) {
    const { rawTitle, rawDesc, subjectName, lessonTitle, unitTitle, selectedStyle, selectedDifficulty, maxScore, targetType } = p;
    const topic = lessonTitle || rawTitle || 'موضوع التكليف والواجب الدراسي';
    const finalTitle = rawTitle || `واجب تطبيقي في ${subjectName}: ${topic}`;

    const q1Score = Math.max(1, Math.round(maxScore * 0.3));
    const q2Score = Math.max(1, Math.round(maxScore * 0.45));
    const q3Score = Math.max(1, maxScore - q1Score - q2Score);

    const instructions = `### 📌 تعليمات وإرشادات الإنجاز:
- يُطلب من جميع الطلبة الإجابة بأسلوب منهجي منظم مع مراعاة دقة المصطلحات العلمية.
- تبرير كل نتيجة بخطوات تحليلية واضحة ومنطقية.
${rawDesc ? `\n### 📝 ملاحظات ومسودة الأستاذ المعتمدة:\n${rawDesc}` : ''}`;

    const questionsText = `#### ❓ السؤال الأول (${q1Score} درجات): استرجاع وتنظيم المفاهيم الأساسية
- اشرح المفاهيم الجوهرية المرتبطة بموضوع **«${topic}»** مع تقديم مثالين تطبيقيين يوضحان أهميتها في هذا المبحث.

#### ❓ السؤال الثاني (${q2Score} درجات): تطبيق إجرائي وحل مسألة
- طبّق القواعد والمنهجية المدروسة لمعالجة الإشكالية التطبيقية التالية:
  1. تحديد المعطيات الأساسية والمفاهيم المفتاحية.
  2. استعراض خطوات المعالجة والتحليل خطوة بخطوة مع التعليل المنطقي.
  3. استخراج النتائج الدقيقة ومناقشة مدلولها العلمي.

#### ❓ السؤال الثالث (${q3Score} درجات): استنتاج ووضعية إدماجية
- قدّم خلاصة تحليلية في 5 أسطر تُبرز كيف تساهم هذه المعارف في حل مشكلات واقعية ملموسة مرتبطة بمادة ${subjectName}.`;

    const rubricText = `#### ⚖️ سلّم توزيع الدرجات (${maxScore} درجة):
- **السؤال الأول (${q1Score} ن):** دقة التعريف واستحضار المصطلحات ($1.5$ ن) + سلامة الأمثلة التوضيحية ($1.5$ ن).
- **السؤال الثاني (${q2Score} ن):** تحديد المعطيات والقواعد ($2.0$ ن) + سلامة خطوات الحل والتعليل ($2.5$ ن) + دقة النتيجة ومناقشتها ($1.5$ ن).
- **السؤال الثالث (${q3Score} ن):** عمق التحليل والربط بالواقع ($2.0$ ن) + جودة الصياغة والانسجام ($1.5$ ن).
- ملاحظة: يُخصم نصف نقطة عند عدم العناية بتنظيم الخط ونظافة الورقة.`;

    const criteriaText = `| المعيار | المؤشرات | العلامة |
| :--- | :--- | :---: |
| **الوجاهة** | الإجابة في صلب الموضوع ومطابقة التعليمات | **30%** |
| **استعمال أدوات المادة** | التوظيف السليم للمفاهيم والقواعد المنهجية | **45%** |
| **الانسجام والإتقان** | التسلسل المنطقي وجودة العرض والتنظيم | **25%** |`;

    const hintsText = `💡 **إرشادات للطلبة:** اقرأ نص كل سؤال مرتين لضمان الإحاطة بجميع المطالب والجزئيات المطلوبة قبل البدء في التحرير.`;

    const fullDesc = [instructions, `---\n\n${questionsText}`, `---\n\n${rubricText}`, `---\n\n### 📊 شبكة التقييم:\n${criteriaText}`, `---\n\n${hintsText}`].join('\n\n');

    return {
      suggestedTitle: finalTitle,
      suggestedSubject: subjectName,
      suggestedType: targetType,
      suggestedMaxScore: maxScore,
      style: selectedStyle,
      difficulty: selectedDifficulty,
      lessonTitle: topic,
      unitTitle: unitTitle || 'الوحدة المقررة',
      instructions,
      questionsText,
      rubricText,
      criteriaText,
      hintsText,
      suggestedDescription: fullDesc,
      explanation: `قام المساعد التربوي الذكي بصياغة واجب دراسي متكامل ومتدرج مع تعليمات وسلم تنقيط تفصيلي (${maxScore} ن) استناداً إلى فكرتك ومنهاج المادة.`,
      provider: 'pedagogical_synthesizer',
      model: 'general_curriculum_v2',
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
