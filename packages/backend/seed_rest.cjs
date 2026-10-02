const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const curriculums = {
  'الفيزياء': [
    {
      title: 'الوحدة الأولى: الميكانيكا',
      lessons: ['الزخم الخطي والدفع', 'التصادمات', 'الحركة الدورانية']
    },
    {
      title: 'الوحدة الثانية: الكهرباء المتحركة',
      lessons: ['التيار الكهربائي والمقاومة', 'القوة الدافعة الكهربائية', 'الدارات الكهربائية وتطبيقاتها']
    },
    {
      title: 'الوحدة الثالثة: الكهرومغناطيسية',
      lessons: ['المجال المغناطيسي', 'القوة المغناطيسية', 'الحث الكهرومغناطيسي']
    },
    {
      title: 'الوحدة الرابعة: الفيزياء الحديثة',
      lessons: ['نظرية الكم والظاهرة الكهروضوئية', 'الفيزياء النووية', 'تطبيقات الفيزياء الحديثة']
    }
  ],
  'التربية الإسلامية': [
    {
      title: 'الوحدة الأولى: القرآن الكريم',
      lessons: ['سورة النور (1)', 'سورة النور (2)', 'أحكام التلاوة والتجويد']
    },
    {
      title: 'الوحدة الثانية: العقيدة الإسلامية',
      lessons: ['الإيمان باليوم الآخر', 'الجنة والنار', 'آثار الإيمان في حياة المسلم']
    },
    {
      title: 'الوحدة الثالثة: الحديث الشريف',
      lessons: ['مكانة السنة النبوية', 'أحاديث مختارة (1)', 'أحاديث مختارة (2)']
    },
    {
      title: 'الوحدة الرابعة: الفقه الإسلامي',
      lessons: ['فقه الأسرة', 'الطلاق وأحكامه', 'البيوع في الإسلام']
    }
  ],
  'الجغرافيا': [
    {
      title: 'الوحدة الأولى: المناخ والموارد الطبيعية',
      lessons: ['الغلاف الجوي والمناخ', 'الموارد المائية', 'الأقاليم المناخية']
    },
    {
      title: 'الوحدة الثانية: الجغرافيا البشرية',
      lessons: ['النمو السكاني والتركيب', 'الهجرة وتداعياتها', 'التحضر والمدن']
    },
    {
      title: 'الوحدة الثالثة: الجغرافيا الاقتصادية',
      lessons: ['الزراعة والأمن الغذائي', 'الصناعة ومقوماتها', 'السياحة والتجارة العالمية']
    },
    {
      title: 'الوحدة الرابعة: جغرافية فلسطين',
      lessons: ['الموقع والأهمية الجيوسياسية', 'التضاريس والمناخ في فلسطين', 'الواقع السكاني والاقتصادي']
    }
  ]
};

async function seedSubjects() {
  for (const [subjectName, units] of Object.entries(curriculums)) {
    console.log(`Processing ${subjectName}...`);
    const subject = await prisma.subject.findFirst({
      where: { nameAr: subjectName },
      include: { courses: { include: { versions: true } } }
    });

    if (!subject || subject.courses.length === 0 || subject.courses[0].versions.length === 0) {
      console.log(`Skipping ${subjectName}, no master version found.`);
      continue;
    }

    const version = subject.courses[0].versions[0];

    // Delete dummy units
    await prisma.curriculumUnit.deleteMany({
      where: { curriculumVersionId: version.id }
    });

    // Insert real units
    for (let i = 0; i < units.length; i++) {
      const u = await prisma.curriculumUnit.create({
        data: {
          curriculumVersionId: version.id,
          title: units[i].title,
          orderIndex: i + 1
        }
      });

      for (let j = 0; j < units[i].lessons.length; j++) {
        await prisma.curriculumLesson.create({
          data: {
            unitId: u.id,
            title: `الدرس ${j+1}: ${units[i].lessons[j]}`,
            orderIndex: j + 1,
            learningSequence: { stage: "الشرح والتطبيق", activities: "استعراض المفاهيم، حل الأسئلة، تقييم" },
            learningObjectives: ["فهم وتطبيق المفاهيم الأساسية للدرس", "حل التدريبات المرفقة", "ربط الموضوع بالحياة العملية"]
          }
        });
      }
    }
    console.log(`${subjectName} seeded successfully!`);
  }
}

seedSubjects().catch(console.error).finally(() => prisma.$disconnect());
