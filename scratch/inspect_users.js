const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const supervisors = await prisma.user.findMany({
    where: { 
      OR: [
        { primaryRole: 'subject_supervisor' }, 
        { roles: { some: { role: 'subject_supervisor' } } }
      ] 
    },
    select: { 
      id: true, 
      firstName: true, 
      lastName: true, 
      email: true, 
      supervisedSubjectId: true, 
      supervisedSubject: { select: { id: true, nameAr: true, code: true } } 
    }
  });
  console.log('=== SUPERVISORS ===');
  console.log(JSON.stringify(supervisors, null, 2));

  const teachers = await prisma.user.findMany({
    where: { 
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
      supervisedSubjectId: true, 
      supervisedSubject: { select: { id: true, nameAr: true, code: true } } 
    }
  });
  console.log('=== TEACHERS ===');
  console.log(JSON.stringify(teachers, null, 2));

  try {
    const multiSubjects = await prisma.$queryRawUnsafe(`
      SELECT ss.user_id, u."firstName", u."lastName", s."nameAr" as subject_name
      FROM users.supervisor_subjects ss
      JOIN users.users u ON u.id = ss.user_id
      JOIN curriculum.subjects s ON s.id = ss.subject_id
    `);
    console.log('=== MULTI-SUBJECT ASSIGNMENTS ===');
    console.log(JSON.stringify(multiSubjects, null, 2));
  } catch (e) {
    console.log('No supervisor_subjects or error:', e.message);
  }

  const subjects = await prisma.subject.findMany({
    select: { id: true, nameAr: true, code: true }
  });
  console.log('=== ALL SUBJECTS ===');
  console.log(JSON.stringify(subjects, null, 2));
}

run().then(() => prisma.$disconnect());
