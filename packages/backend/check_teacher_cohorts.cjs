const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  const teacher = await prisma.user.findFirst({ where: { primaryRole: 'teacher' } });
  
  const cohorts = await prisma.cohortInstructor.findMany({
    where: { teacherId: teacher.id },
    include: { cohort: true }
  });
  console.log(cohorts);
}
check().finally(() => prisma.$disconnect());
