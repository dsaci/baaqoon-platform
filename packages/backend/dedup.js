require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeDuplicates() {
  console.log("جارِ فحص وإزالة التكرار في المقررات...");
  const allCourses = await prisma.course.findMany();
  
  // Group by title and subjectId
  const seen = {};
  let deletedCount = 0;
  
  for (const course of allCourses) {
    const key = `${course.name}-${course.subjectId}`;
    if (seen[key]) {
      // It's a duplicate, delete it
      await prisma.course.delete({ where: { id: course.id } });
      deletedCount++;
    } else {
      seen[key] = true;
    }
  }
  
  console.log(`تم مسح ${deletedCount} مقررات مكررة بنجاح!`);
}

removeDuplicates().catch(console.error).finally(() => prisma.$disconnect());
