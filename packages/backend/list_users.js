const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.crlypihigrhqxjhrargt:0QAibMm9gZO0SCXO@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=1"
    }
  }
});

async function run() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      firstName: true,
      lastName: true,
      primaryRole: true,
      status: true,
      mustChangePassword: true,
      supervisedSubjectId: true,
    },
    orderBy: [
      { primaryRole: 'asc' },
      { firstName: 'asc' }
    ]
  });

  const instructors = await prisma.cohortInstructor.findMany({
    include: { cohort: { select: { name: true } } }
  });

  const enrollments = await prisma.cohortEnrollment.findMany({
    include: { cohort: { select: { name: true } } }
  });

  const instructorMap = new Map();
  instructors.forEach(i => {
    if (!instructorMap.has(i.teacherId)) instructorMap.set(i.teacherId, []);
    instructorMap.get(i.teacherId).push(i.cohort?.name);
  });

  const studentMap = new Map();
  enrollments.forEach(e => {
    if (!studentMap.has(e.studentId)) studentMap.set(e.studentId, []);
    studentMap.get(e.studentId).push(e.cohort?.name);
  });

  console.log(`TOTAL USERS: ${users.length}\n`);

  for (const u of users) {
    const tCohorts = instructorMap.get(u.id) || [];
    const sCohorts = studentMap.get(u.id) || [];
    const cohorts = [
      ...tCohorts.map(c => `[تدريس: ${c}]`),
      ...sCohorts.map(c => `[دراسة: ${c}]`)
    ].join(', ');

    console.log(`ROLE: ${u.primaryRole.padEnd(19)} | NAME: ${(u.firstName + ' ' + u.lastName).padEnd(25)} | EMAIL: ${(u.email || 'لا يوجد').padEnd(30)} | PHONE: ${(u.phone || 'لا يوجد').padEnd(16)} | COHORTS: ${cohorts || 'بدون فوج'}`);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
