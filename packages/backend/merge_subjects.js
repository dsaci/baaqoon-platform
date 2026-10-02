require('dotenv').config({ path: 'packages/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mergers = [
  { targetName: "اللغة العربية وآدابها", match: ["المطالعة والأدب", "قواعد اللغة", "القراءة الإضافية"] },
  { targetName: "الرياضيات", match: ["الرياضيات"] },
  { targetName: "التربية الإسلامية", match: ["التربية الإسلامية"] },
  { targetName: "التكنولوجيا والبرمجة", match: ["تكنولوجيا", "التكنولوجيا"] },
  { targetName: "اللغة الإنجليزية", match: ["اللغة الإنجليزية"] },
  { targetName: "العلوم الحياتية (الأحياء)", match: ["العلوم الحياتية"] },
  { targetName: "الفيزياء", match: ["الفيزياء"] },
  { targetName: "الكيمياء", match: ["الكيمياء"] },
  { targetName: "التاريخ", match: ["التاريخ"] },
  { targetName: "الجغرافيا", match: ["الجغرافيا"] },
  { targetName: "الثقافة العلمية", match: ["الثقافة العلمية"] }
];

async function mergeSubjects() {
  console.log("جارِ دمج المواد الأساسية لإزالة التكرار...");
  
  for (const m of mergers) {
    // 1. Find all subjects that match any of the strings
    const allSubjects = await prisma.subject.findMany();
    const matchingSubjects = allSubjects.filter(s => 
      m.match.some(matchStr => s.nameAr.includes(matchStr))
    );

    if (matchingSubjects.length === 0) continue;

    console.log(`\n--- دمج: ${m.targetName} ---`);
    console.log(`وجدت ${matchingSubjects.length} مواد مطابقة.`);

    // 2. Check if target exists. If not, pick the first one and rename it.
    let target = matchingSubjects.find(s => s.nameAr === m.targetName);
    if (!target) {
      target = matchingSubjects[0];
      await prisma.subject.update({
        where: { id: target.id },
        data: { nameAr: m.targetName }
      });
      console.log(`تم إعادة تسمية المادة لتكون: ${m.targetName}`);
    }

    // 3. Move everything from the other subjects to the target
    const others = matchingSubjects.filter(s => s.id !== target.id);
    
    for (const other of others) {
      // Move Courses
      await prisma.course.updateMany({
        where: { subjectId: other.id },
        data: { subjectId: target.id }
      });
      
      // Move CohortRequests
      await prisma.cohortRequest.updateMany({
        where: { subjectId: other.id },
        data: { subjectId: target.id }
      });

      // Move Supervisors
      await prisma.user.updateMany({
        where: { supervisedSubjectId: other.id },
        data: { supervisedSubjectId: target.id }
      });

      // Delete the other subject
      try {
        await prisma.subject.delete({ where: { id: other.id } });
        console.log(`تم نقل البيانات وحذف المادة المكررة: ${other.nameAr}`);
      } catch (e) {
        console.log(`خطأ في حذف: ${other.nameAr} - ${e.message}`);
      }
    }
  }
  
  console.log("\nتم الانتهاء من عملية الدمج والتنظيف!");
}

mergeSubjects().catch(console.error).finally(() => prisma.$disconnect());
