const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const subjects = await prisma.subject.findMany({
    include: {
      courses: {
        where: { isActive: true },
        include: {
          versions: {
            where: { isDefault: true, status: 'published' },
            include: {
              units: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  lessons: { orderBy: { orderIndex: 'asc' } }
                }
              }
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(subjects, null, 2));
}
check().finally(() => prisma.$disconnect());
