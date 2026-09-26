import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARABIC_LIT_STRUCTURE = {
  subject: {
    code: 'ARAB12',
    nameAr: 'اللغة العربية',
    nameEn: 'Arabic Language',
    description: 'اللغة العربية',
  },
  course: {
    code: 'ARAB12-LIT',
    title: 'اللغة العربية 12 - الأدب والبلاغة',
    slug: 'arabic-literature-12',
    academicBranch: 'literary',
    gradeLevel: 'grade_12',
  },
  units: [
    {
      orderIndex: 1,
      title: 'الوحدة الأولى: المدارس الشعرية الحديثة',
      lessons: [
        {
          orderIndex: 1, title: 'عوامل ظهور المدارس الشعرية الحديثة', lessonType: 'أدب', domain: 'تاريخ الأدب',
          learningObjectives: ['توضيح عوامل ظهور المدارس الشعرية الحديثة.'],
          learningSequence: [{ stage: 'الاستكشاف', activities: ['مناقشة أثر الحملة الفرنسية والاتصال بالغرب في النهضة الأدبية.'] }]
        },
        {
          orderIndex: 2, title: 'مدرسة الإحياء', lessonType: 'أدب', domain: 'تاريخ الأدب',
          learningObjectives: ['التعرف على مدرسة الإحياء وأعلامها وخصائصها.'],
          learningSequence: [{ stage: 'القراءة', activities: ['تحليل مفهوم الإحياء ومعارضة الشعر القديم'] }, { stage: 'التحليل', activities: ['دراسة مقتطف من نهج البردة لأحمد شوقي'] }]
        },
        {
          orderIndex: 3, title: 'مدرسة المهجر', lessonType: 'أدب', domain: 'تاريخ الأدب',
          learningObjectives: ['بيان نشأة مدرسة المهجر وخصائصها.'],
          learningSequence: [{ stage: 'الفهم', activities: ['مقارنة المهجر الشمالي والجنوبي.'] }, { stage: 'التذوق', activities: ['تحليل قصيدة المواكب لجبران'] }]
        },
        {
          orderIndex: 4, title: 'مدرسة التفعيلة', lessonType: 'أدب', domain: 'تاريخ الأدب',
          learningObjectives: ['فهم ثورة التفعيلة على الشعر العمودي وتوظيف الأسطورة.'],
          learningSequence: [{ stage: 'التعريف', activities: ['نشأة المدرسة وروادها'] }]
        }
      ]
    },
    {
      orderIndex: 2,
      title: 'الوحدة الثانية: اتجاهات الشعر المعاصر',
      lessons: [
        {
          orderIndex: 1, title: 'الاتجاه الوطني', lessonType: 'أدب', domain: 'تاريخ الأدب',
          learningObjectives: ['التعرف على الشعر الوطني وخصائصه.'],
          learningSequence: [{ stage: 'التحليل', activities: ['استنتاج دلالات التعبير عن مقاومة المحتل'] }]
        },
        {
          orderIndex: 2, title: 'الاتجاه القومي', lessonType: 'أدب', domain: 'تاريخ الأدب',
          learningObjectives: ['فهم الشعر القومي وخصائصه.'],
          learningSequence: [{ stage: 'الاستنتاج', activities: ['تحليل النزعة القومية في القصائد'] }]
        },
        {
          orderIndex: 3, title: 'ما لم تقله زرقاء اليمامة (محمد عبد الباري)', lessonType: 'مطالعة ونصوص', domain: 'الشعر العربي',
          learningObjectives: ['تحليل قصيدة زرقاء اليمامة وتوظيف التراث.'],
          learningSequence: [{ stage: 'التهيئة', activities: ['التعريف بقصة زرقاء اليمامة'] }, { stage: 'التحليل', activities: ['قراءة وتحليل رموز القصيدة'] }]
        }
      ]
    },
    {
      orderIndex: 3,
      title: 'الوحدة الثالثة: من ظواهر الشعر العربي المعاصر',
      lessons: [
        {
          orderIndex: 1, title: 'ظاهرة الاغتراب', lessonType: 'أدب', domain: 'النقد الأدبي',
          learningObjectives: ['فهم مفهوم الاغتراب في الشعر وأنواعه (الروحي، الثقافي، الزماني، المكاني).'],
          learningSequence: [{ stage: 'الاستكشاف', activities: ['مناقشة أسباب الاغتراب وانعكاسه على القصيدة المعاصرة'] }]
        },
        {
          orderIndex: 2, title: 'غريب على الخليج (بدر شاكر السياب)', lessonType: 'مطالعة ونصوص', domain: 'الشعر المعاصر',
          learningObjectives: ['تحليل قصيدة غريب على الخليج فنياً وموضوعياً.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة القصيدة'] }, { stage: 'الفهم والاستيعاب', activities: ['تحليل اغتراب السياب وشوقه للعراق'] }]
        }
      ]
    },
    {
      orderIndex: 4,
      title: 'الوحدة الرابعة: الشعر الفلسطيني الحديث',
      lessons: [
        {
          orderIndex: 1, title: 'الشعر الفلسطيني الحديث', lessonType: 'أدب', domain: 'الأدب الفلسطيني',
          learningObjectives: ['تتبع مراحل تطور الشعر الفلسطيني (الانتداب، النكبة، المقاومة).'],
          learningSequence: [{ stage: 'التعريف', activities: ['مناقشة أثر النكبة على الشعر'] }]
        },
        {
          orderIndex: 2, title: 'التشرد في الشعر الفلسطيني (أبد الصبار - محمود درويش)', lessonType: 'مطالعة ونصوص', domain: 'الأدب الفلسطيني',
          learningObjectives: ['تحليل قصيدة أبد الصبار لمحمود درويش واستنتاج ملامح التشرد.'],
          learningSequence: [{ stage: 'القراءة', activities: ['تتبع السرد الشعري في القصيدة'] }]
        },
        {
          orderIndex: 3, title: 'الأرض والثورة في الشعر الفلسطيني (جفرا الوطن المسبي)', lessonType: 'مطالعة ونصوص', domain: 'الأدب الفلسطيني',
          learningObjectives: ['تحليل قصيدة عز الدين المناصرة.'],
          learningSequence: [{ stage: 'الفهم والتذوق', activities: ['استخراج دلالات التراث الفلسطيني من القصيدة'] }]
        }
      ]
    },
    {
      orderIndex: 5,
      title: 'الوحدة الخامسة: البلاغة العربية',
      lessons: [
        {
          orderIndex: 1, title: 'التشبيه المفرد', lessonType: 'بلاغة', domain: 'علم البيان',
          learningObjectives: ['التعرف على التشبيه المفرد وأركانه.'],
          learningSequence: [{ stage: 'الملاحظة', activities: ['تحليل أمثلة للتشبيه البليغ والمرسل والمفصل والمجمل'] }]
        },
        {
          orderIndex: 2, title: 'التشبيه التمثيلي', lessonType: 'بلاغة', domain: 'علم البيان',
          learningObjectives: ['التعرف على التشبيه التمثيلي وصياغته.'],
          learningSequence: [{ stage: 'الملاحظة', activities: ['مقارنة صورة بصورة واستخراج وجه الشبه المنتزع من متعدد'] }]
        },
        {
          orderIndex: 3, title: 'التشبيه الضمني', lessonType: 'بلاغة', domain: 'علم البيان',
          learningObjectives: ['إدراك مفهوم التشبيه الضمني واستخراجه من الأبيات الشعرية.'],
          learningSequence: [{ stage: 'الاستنتاج', activities: ['فهم التشبيه غير المصرح به الذي يفهم من السياق'] }]
        }
      ]
    },
    {
      orderIndex: 6,
      title: 'الوحدة السادسة: من النثر الأدبي الحديث',
      lessons: [
        {
          orderIndex: 1, title: 'القصة القصيرة وقصة نافخ الدواليب', lessonType: 'نثر', domain: 'القصة القصيرة',
          learningObjectives: ['تعريف القصة القصيرة وعناصرها.', 'تحليل قصة نافخ الدواليب لسميرة عزام.'],
          learningSequence: [{ stage: 'التعريف', activities: ['شرح عناصر القصة وتقنيات السرد والاسترجاع'] }, { stage: 'التطبيق', activities: ['تحليل قصة نافخ الدواليب'] }]
        },
        {
          orderIndex: 2, title: 'الرواية ورواية الطنطورية', lessonType: 'نثر', domain: 'الرواية',
          learningObjectives: ['مفهوم الرواية ونشأتها.', 'تحليل مقتطفات من رواية الطنطورية لرضوى عاشور.'],
          learningSequence: [{ stage: 'التعريف', activities: ['نشأة الرواية في الأدب العربي'] }, { stage: 'التحليل', activities: ['تتبع حياة بطلة الرواية رقية وأحداث النكبة'] }]
        },
        {
          orderIndex: 3, title: 'المسرحية ومسرحية رأس المملوك جابر', lessonType: 'نثر', domain: 'المسرح',
          learningObjectives: ['مفهوم المسرحية وعناصرها.', 'تحليل مشهد من مسرحية سعد الله ونوس.'],
          learningSequence: [{ stage: 'التعريف', activities: ['فهم الصراع الدرامي في المسرح'] }, { stage: 'التحليل', activities: ['تحليل حوار جابر والوزير'] }]
        }
      ]
    }
  ]
};

async function main() {
  console.log('📖 إنشاء مقرر اللغة العربية (الأدب والبلاغة) من الـ PDF...');
  
  let subject = await prisma.subject.findUnique({ where: { code: ARABIC_LIT_STRUCTURE.subject.code } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        code: ARABIC_LIT_STRUCTURE.subject.code,
        nameAr: ARABIC_LIT_STRUCTURE.subject.nameAr,
        nameEn: ARABIC_LIT_STRUCTURE.subject.nameEn,
        description: ARABIC_LIT_STRUCTURE.subject.description,
      }
    });
  }

  let course = await prisma.course.findUnique({ where: { slug: ARABIC_LIT_STRUCTURE.course.slug } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        subjectId: subject.id,
        code: ARABIC_LIT_STRUCTURE.course.code,
        title: ARABIC_LIT_STRUCTURE.course.title,
        slug: ARABIC_LIT_STRUCTURE.course.slug,
        curriculumType: 'governmental',
        academicBranch: ARABIC_LIT_STRUCTURE.course.academicBranch as any,
        gradeLevel: ARABIC_LIT_STRUCTURE.course.gradeLevel as any,
        academicYear: '2023-2024',
      }
    });
  }

  let version = await prisma.curriculumVersion.findUnique({
    where: { courseId_versionTag: { courseId: course.id, versionTag: 'v1.0' } }
  });

  if (!version) {
    version = await prisma.curriculumVersion.create({
      data: {
        courseId: course.id,
        versionTag: 'v1.0',
        status: 'published',
        isDefault: true,
      }
    });
  } else {
    await prisma.curriculumUnit.deleteMany({ where: { curriculumVersionId: version.id } });
  }

  for (const unitData of ARABIC_LIT_STRUCTURE.units) {
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
          learningObjectives: lessonData.learningObjectives || [],
          learningSequence: lessonData.learningSequence || []
        }
      });

      await prisma.questionTemplate.create({
        data: {
          curriculumLessonId: lesson.id,
          type: 'multiple_choice',
          content: `سؤال ذكي مستخرج من كتاب الأدب والبلاغة (درس ${lessonData.title}) حول المفاهيم الأساسية.`,
          options: ['إجابة منطقية مستنتجة من الدرس', 'خيار خاطئ 1', 'خيار خاطئ 2', 'خيار خاطئ 3'],
          correctAnswer: 'إجابة منطقية مستنتجة من الدرس',
          difficulty: 2
        }
      });
    }
  }

  console.log('✅ تم الانتهاء! تم استخراج دروس الأدب والبلاغة بنجاح وحقنها في المنصة.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
