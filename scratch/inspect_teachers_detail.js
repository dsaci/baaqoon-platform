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
  for (const s of supervisors) {
    const multi = await prisma.$queryRawUnsafe(
      'SELECT s."nameAr" FROM users.supervisor_subjects ss JOIN curriculum.subjects s ON s.id = ss.subject_id WHERE ss.user_id = $1::uuid',
      s.id
    );
    console.log(`- ${s.firstName} ${s.lastName} (${s.email})`);
    console.log(`  primary supervisedSubject: ${s.supervisedSubject?.nameAr || 'none'}`);
    console.log(`  all assigned subjects: ${multi.map(m => m.nameAr).join(', ')}`);
  }

  const allTeachers = await prisma.user.findMany({
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
  console.log('\n=== TEACHERS SUMMARY ===');
  console.log(`Total teachers: ${allTeachers.length}`);
  const withSubject = allTeachers.filter(t => t.supervisedSubjectId);
  const withoutSubject = allTeachers.filter(t => !t.supervisedSubjectId);
  console.log(`Teachers WITH subject: ${withSubject.length}`);
  console.log(`Teachers WITHOUT subject: ${withoutSubject.length}`);

  console.log('\nTeachers WITH subject:');
  for (const t of withSubject) {
    console.log(`- ${t.firstName} ${t.lastName} (${t.email}) -> ${t.supervisedSubject?.nameAr}`);
  }

  console.log('\nTeachers WITHOUT subject:');
  for (const t of withoutSubject) {
    console.log(`- ${t.firstName} ${t.lastName} (${t.email})`);
  }
}

run().then(() => prisma.$disconnect());
