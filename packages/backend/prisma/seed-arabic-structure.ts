import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARABIC_STRUCTURE = {
  units: [
    {
      orderIndex: 1,
      title: 'الوحدة الأولى',
      lessons: [
        {
          orderIndex: 1,
          title: 'فرجي',
          lessonType: 'مطالعة ونصوص – نص شعري',
          domain: 'فهم النص وتحليله وتذوقه',
          sourceText: 'النص الشعري «فرجي»',
          learningObjectives: [
            'قراءة النص قراءة صحيحة معبرة.',
            'فهم معاني المفردات والتراكيب الجديدة.',
            'تحديد الفكرة العامة والأفكار الرئيسة.',
            'تحليل مضمون النص وعناصره.',
            'استخراج الصور الفنية والأساليب والمحسنات البديعية.',
            'استنتاج العواطف والقيم الواردة في النص.',
            'توظيف المكتسبات في التعبير والتحليل.'
          ],
          learningSequence: [
            { stage: 'الانطلاق', activities: ['التهيئة لموضوع النص.', 'استحضار الرصيد السابق المرتبط بموضوع النص.', 'قراءة النص والتعرف إلى مضمونه العام.'] },
            { stage: 'الفهم والاستيعاب', activities: ['شرح المفردات والتراكيب.', 'تحديد الفكرة العامة.', 'استخراج الأفكار الرئيسة.', 'الإجابة عن أسئلة الفهم المباشر والاستنتاجي.'] },
            { stage: 'المناقشة والتحليل', activities: ['تحليل مضمون النص.', 'تحديد العواطف والمواقف.', 'الكشف عن القيم المتضمنة.', 'تحليل بعض الأساليب والصور الفنية.', 'استخراج المحسنات البديعية عند ورودها.'] },
            { stage: 'التذوق الأدبي', activities: ['بيان أثر الصور الفنية.', 'استنتاج خصائص الأسلوب.', 'ربط التعبير الأدبي بالمعنى الذي يؤديه.'] },
            { stage: 'التوظيف', activities: ['توظيف المفردات والتراكيب.', 'إنتاج إجابات وتحليلات جديدة انطلاقًا من النص.'] },
            { stage: 'التقويم', activities: ['أسئلة الفهم والتحليل.', 'أسئلة استخراج الظواهر الفنية واللغوية.', 'قياس قدرة المتعلم على التعبير عن أفكاره اعتمادًا على النص.'] }
          ]
        },
        {
          orderIndex: 2,
          title: 'اشتدي أزمة',
          lessonType: 'مطالعة ونصوص – نص شعري',
          domain: 'الفهم والتحليل والتذوق الأدبي',
          sourceText: 'النص الشعري «اشتدي أزمة»',
          learningObjectives: [
            'فهم مضمون النص.',
            'استخراج الأفكار الرئيسة.',
            'تحليل المواقف والعواطف.',
            'فهم المفردات والتراكيب.',
            'تحليل الصور الفنية والأساليب.',
            'استنتاج القيم والمواقف الواردة في النص.',
            'توظيف المكتسبات في التحليل والتعبير.'
          ],
          learningSequence: [
            { stage: 'انطلاق', activities: ['قراءة النص'] },
            { stage: 'فهم واستيعاب', activities: ['فهم المفردات', 'تحديد الأفكار'] },
            { stage: 'مناقشة وتحليل', activities: ['مناقشة المضمون', 'تحليل الأساليب والصور', 'استنتاج القيم'] },
            { stage: 'توظيف وتقويم', activities: ['توظيف المكتسبات', 'تقويم الفهم'] }
          ]
        },
        {
          orderIndex: 3,
          title: 'الممنوع من الصرف (1)',
          lessonType: 'قواعد لغوية',
          domain: 'النحو والصرف',
          sourceText: 'أمثلة لغوية متنوعة تتضمن أسماء ممنوعة من الصرف',
          learningObjectives: [
            'التعرف إلى الممنوع من الصرف.',
            'تمييزه في السياق.',
            'معرفة أسباب منعه من الصرف في الحالات المدروسة.',
            'معرفة علاماته الإعرابية.',
            'إعرابه في سياقات مختلفة.',
            'توظيفه في جمل جديدة.'
          ],
          learningSequence: [
            { stage: 'الملاحظة', activities: ['عرض أمثلة تتضمن أسماء مثل: يونس، إلياس، ربّاب، عبيدة...'] },
            { stage: 'الاستكشاف', activities: ['ملاحظة خصائص الأسماء الواردة ومقارنة حالاتها الإعرابية.'] },
            { stage: 'التحليل', activities: ['تصنيف الأسماء حسب سبب المنع من الصرف.'] },
            { stage: 'الاستنتاج', activities: ['التوصل إلى مفهوم الممنوع من الصرف وأحكامه.'] },
            { stage: 'تثبيت القاعدة', activities: ['دراسة أسباب المنع الواردة في هذا الجزء من الدرس.', 'تثبيت علامات الإعراب'] },
            { stage: 'التطبيق', activities: ['تحديد الممنوع من الصرف في جمل.', 'بيان سبب المنع.', 'الإعراب.'] },
            { stage: 'التقويم', activities: ['استخراج.', 'تصنيف.', 'تعليل.', 'إنتاج جمل جديدة.'] }
          ]
        },
        {
          orderIndex: 4,
          title: 'البحر الوافر',
          lessonType: 'عروض',
          domain: 'العروض والقافية',
          sourceText: 'أبيات شعرية من البحر الوافر',
          learningObjectives: [
            'التعرف إلى البحر الوافر.',
            'التعرف إلى تفعيلاته.',
            'تقطيع أبيات شعرية.',
            'تحديد التفعيلات.',
            'تطبيق الوزن على أبيات جديدة.'
          ],
          learningSequence: [
            { stage: 'الانطلاق', activities: ['قراءة البيت الشعري'] },
            { stage: 'الملاحظة', activities: ['ملاحظة الإيقاع'] },
            { stage: 'التحليل', activities: ['التقطيع العروضي', 'اكتشاف التفعيلات'] },
            { stage: 'الاستنتاج', activities: ['تحديد البحر'] },
            { stage: 'التدريب والتطبيق', activities: ['تقطيع أبيات جديدة'] }
          ]
        }
      ]
    },
    {
      orderIndex: 2,
      title: 'الوحدة الثانية',
      lessons: [
        { orderIndex: 1, title: 'مسيرة غروب الأمة', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 2, title: 'رسالة إلى صديق قديم', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 3, title: 'الممنوع من الصرف (2)', lessonType: 'قواعد لغوية', domain: 'النحو والصرف' }
      ]
    },
    {
      orderIndex: 3,
      title: 'الوحدة الثالثة',
      lessons: [
        { orderIndex: 1, title: 'القدس بوصلة ومجد', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 2, title: 'أنا وليلى', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 3, title: 'المعاني النحوية للواو والفاء', lessonType: 'قواعد لغوية', domain: 'النحو والصرف', learningSequence: [{stage: 'أمثلة سياقية', activities:[]}, {stage: 'ملاحظة اختلاف المعنى', activities:[]}, {stage: 'استنتاج القاعدة', activities:[]}] },
        { orderIndex: 4, title: 'التعبير', lessonType: 'تعبير', domain: 'الإنتاج الكتابي' }
      ]
    },
    {
      orderIndex: 4,
      title: 'الوحدة الرابعة',
      lessons: [
        { orderIndex: 1, title: 'أمرني خليلي', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 2, title: 'المعاني النحوية لـ«ما» و«من»', lessonType: 'قواعد لغوية', domain: 'النحو والصرف' }
      ]
    },
    {
      orderIndex: 5,
      title: 'الوحدة الخامسة',
      lessons: [
        { orderIndex: 1, title: 'مرافعات أمام ضمير غائب', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 2, title: 'وصية لاجئ', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 3, title: 'المعاني النحوية لـ«لا» واللام', lessonType: 'قواعد لغوية', domain: 'النحو والصرف' }
      ]
    },
    {
      orderIndex: 6,
      title: 'الوحدة السادسة',
      lessons: [
        { orderIndex: 1, title: 'البومة في غرفة بعيدة', lessonType: 'مطالعة ونصوص', domain: 'الفهم والتحليل' },
        { orderIndex: 2, title: 'البحر البسيط', lessonType: 'عروض', domain: 'العروض والقافية' },
        { orderIndex: 3, title: 'التعبير', lessonType: 'تعبير', domain: 'الإنتاج الكتابي' }
      ]
    }
  ]
};

async function main() {
  console.log('📖 جلب مادة اللغة العربية...');
  
  const subjects = await prisma.subject.findMany({ where: { nameAr: 'اللغة العربية' } });
  
  for (const subject of subjects) {
    const courses = await prisma.course.findMany({ where: { subjectId: subject.id } });
    
    for (const course of courses) {
      console.log(`📌 تحديث منهاج اللغة العربية فرع: ${course.academicBranch}`);
      const version = await prisma.curriculumVersion.findFirst({ where: { courseId: course.id } });
      if (!version) continue;

      // حذف الوحدات القديمة للغة العربية لإنشائها من جديد بالشكل المتكامل
      await prisma.curriculumUnit.deleteMany({ where: { curriculumVersionId: version.id } });

      for (const unitData of ARABIC_STRUCTURE.units) {
        const unit = await prisma.curriculumUnit.create({
          data: {
            curriculumVersionId: version.id,
            orderIndex: unitData.orderIndex,
            title: unitData.title
          }
        });

        for (const lessonData of unitData.lessons) {
          const lesson = await prisma.curriculumLesson.create({
            data: {
              unitId: unit.id,
              orderIndex: lessonData.orderIndex,
              title: lessonData.title,
              lessonType: lessonData.lessonType,
              domain: lessonData.domain,
              sourceText: (lessonData as any).sourceText || null,
              learningObjectives: (lessonData as any).learningObjectives || [],
              learningSequence: (lessonData as any).learningSequence || []
            }
          });

          // إضافة أسئلة تجريبية عامة للدروس لتفعيل زر التوليد
          await prisma.questionTemplate.create({
            data: {
              curriculumLessonId: lesson.id,
              type: 'multiple_choice',
              content: `سؤال تجريبي من بناء التعلم الخاص بدرس ${lessonData.title}`,
              options: ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4'],
              correctAnswer: 'خيار 1',
              difficulty: 1
            }
          });
        }
      }
    }
  }

  console.log('✅ تم دمج البناء التعلمي لكتاب اللغة العربية في قاعدة البيانات بنجاح!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
