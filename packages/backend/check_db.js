require('dotenv').config({ path: 'packages/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const subjects = await prisma.subject.findMany({ include: { courses: true } });
  console.log(`Total subjects: ${subjects.length}`);
  subjects.forEach(s => console.log(`${s.title} (${s.branch}) - Courses: ${s.courses.length}`));
}
main().finally(() => prisma.$disconnect());
