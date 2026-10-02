const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMissing() {
  const tree = await prisma.subject.findMany({
    include: {
      courses: {
        include: { versions: { include: { units: true } } }
      }
    }
  });

  for (const subject of tree) {
    if (subject.courses.length === 0) continue;
    
    const version = subject.courses[0].versions[0];
    if (!version) continue;
    
    if (version.units.length === 0) {
      console.log(`Seeding units for ${subject.nameAr}...`);
      
      // Create Unit 1
      const u1 = await prisma.curriculumUnit.create({
        data: {
          curriculumVersionId: version.id,
          title: `الوحدة الأولى: مدخل إلى ${subject.nameAr}`,
          orderIndex: 1
        }
      });
      await prisma.curriculumLesson.create({
        data: {
          unitId: u1.id,
          title: `الدرس الأول: أساسيات ${subject.nameAr}`,
          orderIndex: 1,
          learningSequence: { stage: "مقدمة", activities: "نقاش وعصف ذهني" },
          learningObjectives: ["فهم المفاهيم الأساسية", "تطبيق القواعد العامة"]
        }
      });
      await prisma.curriculumLesson.create({
        data: {
          unitId: u1.id,
          title: `الدرس الثاني: تطبيقات عملية`,
          orderIndex: 2,
          learningSequence: { stage: "تطبيق", activities: "حل تدريبات" },
          learningObjectives: ["اكتساب مهارات التطبيق"]
        }
      });
      
      // Create Unit 2
      const u2 = await prisma.curriculumUnit.create({
        data: {
          curriculumVersionId: version.id,
          title: `الوحدة الثانية: مفاهيم متقدمة`,
          orderIndex: 2
        }
      });
      await prisma.curriculumLesson.create({
        data: {
          unitId: u2.id,
          title: `الدرس الأول: تحليل ونقد`,
          orderIndex: 1,
          learningSequence: { stage: "تحليل", activities: "دراسة حالة" },
          learningObjectives: ["القدرة على التحليل النقدي"]
        }
      });
    }
  }
  console.log("Missing curriculum seeded!");
}
seedMissing().finally(() => prisma.$disconnect());
