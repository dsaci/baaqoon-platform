const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicateCourses() {
  const courses = await prisma.course.findMany({ include: { subject: true } });
  
  // Group by title and subjectId
  const grouped = {};
  for (const c of courses) {
    const key = `${c.subjectId}_${c.title}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  }

  // For each group, keep the first one and delete the rest
  for (const key in grouped) {
    const group = grouped[key];
    if (group.length > 1) {
      console.log(`\nFound ${group.length} duplicates for: ${group[0].subject.nameAr} | ${group[0].title}`);
      const keep = group[0];
      const toDelete = group.slice(1);
      
      for (const del of toDelete) {
        // Move cohorts, textbooks, curriculums, etc if any (there shouldn't be much data yet)
        await prisma.cohort.updateMany({ where: { courseId: del.id }, data: { courseId: keep.id } });
        await prisma.textbook.updateMany({ where: { courseId: del.id }, data: { courseId: keep.id } });
        await prisma.curriculumVersion.updateMany({ where: { courseId: del.id }, data: { courseId: keep.id } });
        
        await prisma.course.delete({ where: { id: del.id } });
        console.log(`Deleted duplicate course: ${del.id}`);
      }
    }
  }
  console.log('Done cleaning courses!');
}

cleanDuplicateCourses().catch(console.error).finally(() => prisma.$disconnect());
