const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const tree = await prisma.subject.findMany({
    include: {
      courses: {
        include: {
          versions: {
            where: { status: 'published' },
            include: {
              units: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  lessons: {
                    orderBy: { orderIndex: 'asc' }
                  }
                }
              }
            }
          }
        }
      }
    }
  });
  console.log(`Subjects: ${tree.length}`);
  for (const s of tree) {
    console.log(`- ${s.nameAr}: ${s.courses.length} courses`);
    if (s.courses.length > 0) {
      console.log(`  - Versions: ${s.courses[0].versions.length}`);
      if (s.courses[0].versions.length > 0) {
        console.log(`    - Units: ${s.courses[0].versions[0].units.length}`);
      }
    }
  }
}
check().finally(() => prisma.$disconnect());
