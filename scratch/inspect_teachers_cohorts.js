const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const teachersWithoutSubject = await prisma.user.findMany({
    where: { 
      supervisedSubjectId: null,
      OR: [
        { primaryRole: 'teacher' }, 
        { roles: { some: { role: 'teacher' } } }
      ] 
    },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      email: true, 
      createdAt: true
    }
  });

  console.log('=== TEACHERS WITHOUT SUBJECT & THEIR COHORTS ===');
  for (const t of teachersWithoutSubject) {
    const cohortInstructors = await prisma.cohortInstructor.findMany({
      where: { teacherId: t.id }
    });
    let cohortsInfo = [];
    for (const ci of cohortInstructors) {
      const cohort = await prisma.cohort.findUnique({
        where: { id: ci.cohortId },
        select: { id: true, name: true, code: true, courseId: true }
      });
      if (cohort && cohort.courseId) {
        const course = await prisma.course.findUnique({
          where: { id: cohort.courseId },
          select: { title: true, subjectId: true, subject: { select: { nameAr: true } } }
        });
        cohortsInfo.push({ cohortName: cohort.name, subject: course?.subject?.nameAr });
      } else {
        cohortsInfo.push({ cohortName: cohort?.name, subject: 'none' });
      }
    }
    console.log(`- ${t.firstName} ${t.lastName} (created: ${t.createdAt.toISOString()})`);
    console.log(`  Assigned cohorts count: ${cohortInstructors.length}`);
    if (cohortsInfo.length > 0) {
      console.log(`  Cohorts: ${JSON.stringify(cohortsInfo)}`);
    }
  }

  // Also check if any activity log shows subject updates
  const logs = await prisma.activityLog.findMany({
    where: {
      action: { in: ['UPDATE_PROFILE', 'USER_DETAILS_UPDATE', 'ASSIGN_SUBJECT'] }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  });
  console.log('\n=== RECENT RELEVANT ACTIVITY LOGS ===');
  console.log(JSON.stringify(logs, null, 2));
}

run().then(() => prisma.$disconnect());
