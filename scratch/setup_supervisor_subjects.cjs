const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');
  
  // 1. Create table users.supervisor_subjects
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS users.supervisor_subjects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
      subject_id UUID NOT NULL REFERENCES curriculum.subjects(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
      UNIQUE(user_id, subject_id)
    );
  `);
  console.log('✓ Table users.supervisor_subjects verified/created.');

  // 2. Populate users.supervisor_subjects with existing single-subject assignments
  await prisma.$executeRawUnsafe(`
    INSERT INTO users.supervisor_subjects (user_id, subject_id)
    SELECT id, "supervisedSubjectId" 
    FROM users.users 
    WHERE "supervisedSubjectId" IS NOT NULL
    ON CONFLICT (user_id, subject_id) DO NOTHING;
  `);
  console.log('✓ Synced existing supervisedSubjectId values into supervisor_subjects.');

  // 3. Specifically assign supervisor "مرح عبد الكريم" (eb33ad62-9e80-4ab7-95a5-93b3fc057175) to Geography (52c51d98-3a7d-4301-9869-0708232d99d9)
  const userId = 'eb33ad62-9e80-4ab7-95a5-93b3fc057175';
  const geographySubjectId = '52c51d98-3a7d-4301-9869-0708232d99d9';
  const historySubjectId = 'a0dda824-47f7-486b-8868-c8b15b8d97f0';

  // Ensure History is linked
  await prisma.$executeRawUnsafe(`
    INSERT INTO users.supervisor_subjects (user_id, subject_id)
    VALUES ('${userId}', '${historySubjectId}')
    ON CONFLICT (user_id, subject_id) DO NOTHING;
  `);

  // Link Geography as well!
  await prisma.$executeRawUnsafe(`
    INSERT INTO users.supervisor_subjects (user_id, subject_id)
    VALUES ('${userId}', '${geographySubjectId}')
    ON CONFLICT (user_id, subject_id) DO NOTHING;
  `);

  // Ensure subject_supervisor role exists in user_roles
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId, role: 'subject_supervisor' } },
    update: {},
    create: { userId, role: 'subject_supervisor' }
  });

  console.log('✓ Assigned supervisor مرح عبد الكريم to BOTH History and Geography!');

  // Check the assignments
  const assignments = await prisma.$queryRawUnsafe(`
    SELECT ss.id, u."firstName", u."lastName", u.email, s."nameAr" as subject_name
    FROM users.supervisor_subjects ss
    JOIN users.users u ON u.id = ss.user_id
    JOIN curriculum.subjects s ON s.id = ss.subject_id
    WHERE u.id = '${userId}';
  `);
  console.log('Current subject assignments for مرح عبد الكريم:', assignments);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
