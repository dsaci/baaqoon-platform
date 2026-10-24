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
  content: string;               // Structured Arabic content (markdown-like)
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
        : undefined,
    };

    // Try AI first, fall back to DB-only content if AI is unavailable
    if (!this.aiProvider.isConfigured()) {
      this.logger.warn('AI provider not configured — using curriculum fallback engine');
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
      this.logger.error(`AI generation failed: ${error.message} — falling back to curriculum engine`);
      return this.generateFallback(request, context, curriculumSource);
    }
  }

  // ─── System Prompt ──────────────────────────────────────────────────────────

  private buildSystemPrompt(): string {
    return `أنت مساعد تربوي متخصص في المناهج الجزائرية والفلسطينية. مهمتك مساعدة الأساتذة في إعداد الوثائق البيداغوجية باللغة العربية الفصحى.

القواعد الصارمة التي يجب الالتزام بها:
1. استخدم فقط المعلومات المقدمة من سياق المنهج — لا تخترع أي محتوى أو مراجع أو أرقام صفحات من تلقاء نفسك.
2. إذا لم تكن المعلومات متاحة، اكتب "يُحدَّد لاحقاً" بدلاً من الاختراع.
3. الردود باللغة العربية الفصحى فقط.
4. التنسيق: استخدم عناوين واضحة وجداول ونقاط منظمة.
5. احرص على توافق المحتوى مع المقاربة بالكفاءات (APC) المعتمدة في الجزائر.
6. أعد الإجابة دائماً بتنسيق JSON منظم على النحو التالي:
{"title": "عنوان الوثيقة", "content": "المحتوى الكامل بالعربية", "structuredData": {...}}`;
  }

  // ─── User Prompt Builder ─────────────────────────────────────────────────────

  private buildUserPrompt(request: GenerationRequest, ctx: CurriculumContext): string {
    const { lesson, unit, course, subject, existingQuestions } = ctx;
    
    const levelMap: Record<string, string> = {
      weak: 'ضعيف المستوى',
      average: 'متوسط المستوى',
      advanced: 'متقدم',
      mixed: 'متباين المستوى',
    };

    const contextSection = `
=== معلومات المنهج (مصدر وحيد — لا تتجاوزه) ===
المادة: ${subject.nameAr} (رمز: ${subject.code})
المستوى: ${this.formatGradeLevel(course.gradeLevel)} — شعبة ${this.formatBranch(course.academicBranch)}
الوحدة: ${unit.title}${unit.unitNumber ? ` (وحدة رقم ${unit.unitNumber})` : ''}
${unit.pdfStartPage ? `صفحات الكتاب: ${unit.pdfStartPage} إلى ${unit.pdfEndPage}` : ''}
الدرس: ${lesson.title}
${lesson.domain ? `المجال: ${lesson.domain}` : ''}
${lesson.lessonType ? `نوع الدرس: ${lesson.lessonType}` : ''}
${lesson.estimatedDurationMinutes ? `المدة المقدرة: ${lesson.estimatedDurationMinutes} دقيقة` : ''}

الأهداف التعليمية:
${(lesson.learningObjectives || []).map((o, i) => `${i + 1}. ${o}`).join('\n') || '(غير محددة في المنهج)'}

${lesson.teacherGuide ? `دليل المعلم:\n${lesson.teacherGuide}` : ''}

${existingQuestions.length > 0 ? `أسئلة موجودة في بنك الأسئلة (${existingQuestions.length} سؤال):\n${existingQuestions.slice(0, 5).map((q, i) => `${i + 1}. [${q.type}] ${q.content}`).join('\n')}` : '(لا توجد أسئلة مسبقة في البنك)'}

${request.additionalContext ? `ملاحظات إضافية من الأستاذ:\n${request.additionalContext}` : ''}
`;

    const outputGuide = this.getOutputTypePromptGuide(request.outputType, {
      questionCount: request.questionCount || 5,
      durationMinutes: request.durationMinutes,
      targetLevel: levelMap[request.targetStudentLevel || 'average'] || 'متوسط المستوى',
    });

    return `${contextSection}\n\n=== المطلوب ===\n${outputGuide}`;
  }

  // ─── Output Type Prompt Guides ───────────────────────────────────────────────

  private getOutputTypePromptGuide(
    outputType: GenerationOutputType,
    params: { questionCount: number; durationMinutes?: number; targetLevel: string },
  ): string {
    const { questionCount, durationMinutes, targetLevel } = params;

    const guides: Record<GenerationOutputType, string> = {
      lesson_structure: `
أعِدَّ البناء التعلمي للدرس المذكور وفق المقاربة بالكفاءات (APC). يجب أن يتضمن:
1. الكفاءة المستهدفة والمؤشرات
2. الوضعية الانطلاقية (وضعية استكشافية)
3. النشاط الأول (مرحلة بناء المعارف)
4. النشاط الثاني (مرحلة الهيكلة)
5. مرحلة التطبيق والتقويم
6. دعم ومعالجة
المدة الإجمالية: ${durationMinutes || 55} دقيقة.`,

      lesson_memo: `
أعِدَّ مذكرة الدرس (جذاذة) وفق النموذج الرسمي الجزائري. يجب أن تتضمن:
- معلومات الدرس (المادة، المستوى، الوحدة، الدرس، التاريخ)
- الكفاءة المستهدفة والأهداف التعليمية
- الوسائل والمراجع
- سير الدرس بثلاثة مراحل: التمهيد — بناء التعلمات — الختام
- التقويم المرحلي والختامي
المدة: ${durationMinutes || 55} دقيقة.`,

      diagnostic_assessment: `
أعِدَّ أداة تقويم تشخيصي (قبلي) لهذا الدرس بهدف قياس المعارف السابقة للمتعلمين.
- عدد الأسئلة: ${questionCount}
- المستوى المستهدف: ${targetLevel}
- تنوع الأسئلة: اختيار متعدد، صح/خطأ، إعادة ترتيب
- لا تذكر أرقام صفحات إلا إذا وردت في السياق أعلاه.`,

      formative_assessment: `
أعِدَّ تقويماً تكوينياً (أثناء الدرس) لمتابعة مكتسبات المتعلمين.
- عدد الأسئلة: ${questionCount}
- يكون قصيراً وفورياً (5-10 دقائق)
- ربط واضح بالأهداف التعليمية المذكورة أعلاه.`,

      exam_with_rubric: `
أعِدَّ اختباراً شاملاً مع سلم التنقيط ومفتاح الإجابات.
- عدد الأسئلة: ${questionCount}
- المستوى: ${targetLevel}
- يشمل: جزء الكفاءات الأساسية (60%) + جزء الإدماج (40%)
- سلم التنقيط: موزع بشكل واضح على كل سؤال
- مفتاح الإجابات مفصل.`,

      evaluation_grid: `
أعِدَّ شبكة تقييم ومعالجة للمتعلمين تتضمن:
- مؤشرات الكفاءة (عمود: المؤشر — التقييم: متحكم/في طور التحكم/غير متحكم)
- أنشطة المعالجة لكل مستوى
- المراجع والموارد اللازمة للدعم.`,

      integration_situation: `
أعِدَّ وضعية إدماجية (situation d'intégration) مرتبطة بحياة المتعلم اليومية.
- السياق: وضعية واقعية ذات مغزى
- المعلومات المقدمة (supports)
- المهام المطلوبة (${questionCount} مهمة)
- معايير النجاح وسلم التقييم.`,

      remediation_plan: `
أعِدَّ خطة دعم ومعالجة بيداغوجية لهذا الدرس تتضمن:
- تحليل أسباب صعوبات التعلم الشائعة
- مجموعة 1: متعلمون في صعوبة — أنشطة التدعيم
- مجموعة 2: متعلمون متوسطون — أنشطة التعزيز
- مجموعة 3: متعلمون متقدمون — أنشطة الإثراء
- وسائل المعالجة وجدول زمني.`,
    };

    return guides[outputType] || guides.lesson_structure;
  }

  // ─── Response Parser ──────────────────────────────────────────────────────────

  private parseAiResponse(raw: string, outputType: GenerationOutputType): { title: string; content: string; structuredData?: any } {
    // Try to parse JSON from the response
    try {
      // Look for JSON block in the response
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
    } catch {
      // Fall through — return as plain content
    }

    // If not JSON, extract title from first line and use the rest as content
    const lines = raw.trim().split('\n');
    const firstLine = lines[0].replace(/^#+\s*/, '').replace(/[*_]/g, '').trim();
    
    return {
      title: firstLine.length < 100 ? firstLine : this.getOutputTypeTitle(outputType, ''),
      content: raw,
    };
  }

  // ─── Curriculum Fallback Engine ───────────────────────────────────────────────

  private generateFallback(
    request: GenerationRequest,
    ctx: CurriculumContext,
    curriculumSource: any,
  ): GenerationResponse {
    const { lesson, unit, course, subject, existingQuestions } = ctx;
    const title = this.getOutputTypeTitle(request.outputType, lesson.title);
    
    let content = `# ${title}\n\n`;
    content += `**المادة:** ${subject.nameAr}  |  **المستوى:** ${this.formatGradeLevel(course.gradeLevel)}  |  **الشعبة:** ${this.formatBranch(course.academicBranch)}\n\n`;
    content += `**الوحدة:** ${unit.title}\n`;
    content += `**الدرس:** ${lesson.title}\n`;
    if (unit.pdfStartPage) content += `**المرجع:** الكتاب المدرسي ص${unit.pdfStartPage}–${unit.pdfEndPage}\n`;
    content += '\n---\n\n';

    if (lesson.learningObjectives?.length > 0) {
      content += `## الأهداف التعليمية\n`;
      lesson.learningObjectives.forEach((obj, i) => {
        content += `${i + 1}. ${obj}\n`;
      });
      content += '\n';
    }

    if (existingQuestions.length > 0 && ['diagnostic_assessment', 'formative_assessment', 'exam_with_rubric'].includes(request.outputType)) {
      content += `## الأسئلة (مستخرجة من بنك الأسئلة)\n\n`;
      const questions = existingQuestions.slice(0, request.questionCount || 5);
      questions.forEach((q, i) => {
        content += `**س${i + 1}:** ${q.content}\n`;
        if (q.options) {
          const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
          if (Array.isArray(opts)) {
            opts.forEach((opt: string, j: number) => {
              content += `   ${String.fromCharCode(0x0623 + j)}. ${opt}\n`;
            });
          }
        }
        content += '\n';
      });
    } else if (request.outputType === 'lesson_structure') {
      content += `## البناء التعلمي\n\n`;
      content += `### 1. التمهيد (${Math.round((lesson.estimatedDurationMinutes || 55) * 0.1)} دقيقة)\n`;
      content += `- طرح إشكالية مرتبطة بمحيط المتعلم\n`;
      content += `- استحضار المكتسبات القبلية\n\n`;
      content += `### 2. بناء التعلمات (${Math.round((lesson.estimatedDurationMinutes || 55) * 0.6)} دقيقة)\n`;
      if (lesson.teacherGuide) {
        content += `${lesson.teacherGuide}\n\n`;
      } else {
        content += `- شرح المفاهيم الأساسية للدرس\n`;
        content += `- نشاط استكشافي جماعي\n\n`;
      }
      content += `### 3. التقويم الختامي (${Math.round((lesson.estimatedDurationMinutes || 55) * 0.3)} دقيقة)\n`;
      content += `- تطبيق مباشر\n- تلخيص مكتسبات الدرس\n`;
    }

    content += `\n---\n*⚠️ هذا المحتوى مُولَّد من بيانات المنهج مباشرة. لتوليد محتوى بالذكاء الاصطناعي، يرجى إعداد مفتاح AI_API_KEY في إعدادات المنصة.*\n`;

    return {
      outputType: request.outputType,
      title,
      content,
      curriculumSource,
      provider: 'curriculum_fallback',
      model: 'db_rag_v1',
      fromFallback: true,
      generatedAt: new Date().toISOString(),
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private getOutputTypeTitle(outputType: GenerationOutputType, lessonTitle: string): string {
    const titles: Record<GenerationOutputType, string> = {
      lesson_structure: `البناء التعلمي — ${lessonTitle}`,
      lesson_memo: `مذكرة الدرس — ${lessonTitle}`,
      diagnostic_assessment: `تقويم تشخيصي — ${lessonTitle}`,
      formative_assessment: `تقويم تكويني — ${lessonTitle}`,
      exam_with_rubric: `اختبار مع سلم التنقيط — ${lessonTitle}`,
      evaluation_grid: `شبكة التقييم والمعالجة — ${lessonTitle}`,
      integration_situation: `وضعية إدماجية — ${lessonTitle}`,
      remediation_plan: `خطة الدعم والمعالجة — ${lessonTitle}`,
    };
    return titles[outputType] || lessonTitle;
  }

  private formatGradeLevel(level: string): string {
    const map: Record<string, string> = {
      grade_10: 'السنة الأولى ثانوي',
      grade_11: 'السنة الثانية ثانوي',
      grade_12: 'السنة الثالثة ثانوي',
    };
    return map[level] || level;
  }

  private formatBranch(branch: string): string {
    const map: Record<string, string> = {
      scientific: 'علمي',
      literary: 'أدبي',
      sharia: 'تعليم أصيل',
      industrial: 'تقني رياضي',
      mathematical: 'رياضيات',
    };
    return map[branch] || branch;
  }
}
