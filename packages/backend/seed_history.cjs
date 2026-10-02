const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHistory() {
  console.log('Finding History Subject...');
  const subject = await prisma.subject.findFirst({
    where: { nameAr: 'التاريخ' },
    include: { courses: { include: { versions: true } } }
  });

  if (!subject || subject.courses.length === 0 || subject.courses[0].versions.length === 0) {
    console.log('Subject/Course/Version not found.');
    return;
  }

  const version = subject.courses[0].versions[0];

  console.log('Deleting dummy History units...');
  await prisma.curriculumUnit.deleteMany({
    where: { curriculumVersionId: version.id }
  });

  console.log('Creating REAL History curriculum...');

  // Unit 1
  const u1 = await prisma.curriculumUnit.create({
    data: { curriculumVersionId: version.id, title: 'الوحدة الأولى: فتوحات وحروب عابرة للقارات', orderIndex: 1 }
  });

  const u1_lessons = [
    'الدرس الأول: الحروب: دوافعها وأنواعها',
    'الدرس الثاني: الفتوحات الإسلامية',
    'الدرس الثالث: الحروب الفرنجية 1095-1291م',
    'الدرس الرابع: الحرب العالمية الأولى 1914-1918م',
    'الدرس الخامس: الحرب العالمية الثانية 1939-1945م'
  ];

  for (let i = 0; i < u1_lessons.length; i++) {
    await prisma.curriculumLesson.create({
      data: {
        unitId: u1.id,
        title: u1_lessons[i],
        orderIndex: i + 1,
        learningSequence: { stage: "مناقشة وتحليل", activities: "دراسة خرائط، تحليل أحداث تاريخية" },
        learningObjectives: ["فهم الدوافع", "تحليل النتائج", "استخلاص العبر"]
      }
    });
  }

  // Unit 2
  const u2 = await prisma.curriculumUnit.create({
    data: { curriculumVersionId: version.id, title: 'الوحدة الثانية: ثورات شعبية', orderIndex: 2 }
  });

  const u2_lessons = [
    'الدرس الأول: الثورة',
    'الدرس الثاني: الثورة الجزائرية (1954-1962م)',
    'الدرس الثالث: الانتفاضة الفلسطينية (1987-1993م)',
    'الدرس الرابع: الحراك العربي 2010م (الربيع العربي)'
  ];

  for (let i = 0; i < u2_lessons.length; i++) {
    await prisma.curriculumLesson.create({
      data: {
        unitId: u2.id,
        title: u2_lessons[i],
        orderIndex: i + 1,
        learningSequence: { stage: "دراسة حالة", activities: "استعراض أسباب الثورات ومآلاتها" },
        learningObjectives: ["توضيح دوافع الشعوب", "تقييم نجاح الثورات", "فهم السياق التاريخي"]
      }
    });
  }

  // Unit 3
  const u3 = await prisma.curriculumUnit.create({
    data: { curriculumVersionId: version.id, title: 'الوحدة الثالثة: إمبراطوريات عابرة للقوميات', orderIndex: 3 }
  });

  const u3_lessons = [
    'الدرس الأول: النظام الإمبراطوري',
    'الدرس الثاني: الإمبراطورية البيزنطية',
    'الدرس الثالث: الإمبراطورية العثمانية',
    'الدرس الرابع: الإمبراطورية البريطانية',
    'الدرس الخامس: الهيمنة العالمية (الولايات المتحدة الأمريكية مثالا)'
  ];

  for (let i = 0; i < u3_lessons.length; i++) {
    await prisma.curriculumLesson.create({
      data: {
        unitId: u3.id,
        title: u3_lessons[i],
        orderIndex: i + 1,
        learningSequence: { stage: "بحث ومقارنة", activities: "مقارنة بين الإمبراطوريات القديمة والحديثة" },
        learningObjectives: ["تحليل أسباب الصعود والهبوط", "فهم الهيمنة والاستعمار"]
      }
    });
  }

  console.log('Real History curriculum successfully seeded!');
}

seedHistory().catch(console.error).finally(() => prisma.$disconnect());
