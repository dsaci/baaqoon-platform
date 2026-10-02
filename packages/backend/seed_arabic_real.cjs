const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedArabic() {
  console.log('Finding Arabic Subject...');
  const subject = await prisma.subject.findFirst({
    where: { nameAr: 'اللغة العربية وآدابها' },
    include: { courses: { include: { versions: true } } }
  });

  if (!subject) {
    console.log('Subject not found.');
    return;
  }

  const course = subject.courses[0];
  if (!course) {
    console.log('Course not found.');
    return;
  }

  const version = course.versions[0];
  if (!version) {
    console.log('Version not found.');
    return;
  }

  console.log('Deleting dummy Arabic units...');
  await prisma.curriculumUnit.deleteMany({
    where: { curriculumVersionId: version.id }
  });

  console.log('Creating REAL Arabic curriculum...');

  // Book 1: المطالعة والأدب والنقد
  const book1 = await prisma.curriculumUnit.create({
    data: {
      curriculumVersionId: version.id,
      title: 'كتاب: المطالعة والأدب والنقد',
      orderIndex: 1
    }
  });

  const b1_lessons = [
    'الدرس الأول: سورة يوسف (من هدي القرآن الكريم)',
    'الدرس الثاني: القدس بوصلة المجد',
    'الدرس الثالث: رسالة إلى صديق قديم',
    'الدرس الرابع: غروب الأندلس',
    'الدرس الخامس: مرافعات أمام الضمير الحي'
  ];

  for (let i = 0; i < b1_lessons.length; i++) {
    await prisma.curriculumLesson.create({
      data: {
        unitId: book1.id,
        title: b1_lessons[i],
        orderIndex: i + 1,
        learningSequence: { 
          stage: "التهيئة والقراءة", 
          activities: "قراءة جهرية، تحليل النص، مناقشة الأفكار الرئيسة" 
        },
        learningObjectives: ["قراءة النص قراءة سليمة", "استخراج الأفكار الرئيسة", "توضيح الصور الفنية والجمالية"]
      }
    });
  }

  // Book 2: قواعد اللغة العربية
  const book2 = await prisma.curriculumUnit.create({
    data: {
      curriculumVersionId: version.id,
      title: 'كتاب: قواعد اللغة العربية',
      orderIndex: 2
    }
  });

  const b2_lessons = [
    'الدرس الأول: الممنوع من الصرف',
    'الدرس الثاني: الإعلال',
    'الدرس الثالث: الإبدال',
    'الدرس الرابع: المعاني النحوية لـ (الواو، الفاء)',
    'الدرس الخامس: المعاني النحوية لـ (اللام، لا)'
  ];

  for (let i = 0; i < b2_lessons.length; i++) {
    await prisma.curriculumLesson.create({
      data: {
        unitId: book2.id,
        title: b2_lessons[i],
        orderIndex: i + 1,
        learningSequence: { 
          stage: "الاستنتاج والتطبيق", 
          activities: "استنتاج القاعدة النحوية من الأمثلة، وحل التدريبات" 
        },
        learningObjectives: ["فهم القاعدة النحوية", "إعراب الأمثلة إعراباً تاما", "تطبيق القاعدة في جمل مفيدة"]
      }
    });
  }

  // Book 3: القراءة الإضافية (العروض والتعبير)
  const book3 = await prisma.curriculumUnit.create({
    data: {
      curriculumVersionId: version.id,
      title: 'كتاب: العروض والتعبير (القراءة الإضافية)',
      orderIndex: 3
    }
  });

  const b3_lessons = [
    'الدرس الأول: بحر الوافر',
    'الدرس الثاني: بحر المتقارب',
    'الدرس الثالث: كتابة المقالة',
    'الدرس الرابع: كتابة القصة القصيرة'
  ];

  for (let i = 0; i < b3_lessons.length; i++) {
    await prisma.curriculumLesson.create({
      data: {
        unitId: book3.id,
        title: b3_lessons[i],
        orderIndex: i + 1,
        learningSequence: { 
          stage: "التذوق الأدبي", 
          activities: "تقطيع الأبيات شعريا، وكتابة موضوع تعبير" 
        },
        learningObjectives: ["معرفة تفعيلات البحر الشعري", "التقطيع العروضي السليم", "تنمية مهارات التعبير الكتابي"]
      }
    });
  }

  console.log('Real Arabic curriculum successfully seeded!');
}

seedArabic().catch(console.error).finally(() => prisma.$disconnect());
