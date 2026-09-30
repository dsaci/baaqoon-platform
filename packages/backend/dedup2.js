require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log("جارِ فحص وإزالة التكرار في المواد (Subjects)...");
  const allSubjects = await prisma.subject.findMany();
  
  // Group by title and branch
  const seenSubj = {};
  let deletedSubj = 0;
  
  for (const subj of allSubjects) {
    const key = `${subj.title}-${subj.branch}`;
    if (seenSubj[key]) {
      try {
        await prisma.subject.delete({ where: { id: subj.id } });
        deletedSubj++;
      } catch (e) {
        // Might fail due to foreign keys, ignore for now
      }
    } else {
      seenSubj[key] = true;
    }
  }
  
  console.log(`تم مسح ${deletedSubj} مواد مكررة بنجاح!`);
}

removeDuplicates().catch(console.error).finally(() => prisma.$disconnect());
