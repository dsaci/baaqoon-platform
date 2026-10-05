const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const versions = await prisma.curriculumVersion.findMany({
    include: { course: true, _count: { select: { units: true } } }
  });
  console.log(versions.map(v => `Course: ${v.course.title}, Version: ${v.versionTag}, Status: ${v.status}, Units: ${v._count.units}`));
  
  const units = await prisma.curriculumUnit.findMany({
    include: { _count: { select: { lessons: true } } }
  });
  console.log(units.map(u => `Unit: ${u.title}, Lessons: ${u._count.lessons}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
