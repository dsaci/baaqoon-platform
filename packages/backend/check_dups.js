require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const subjects = await prisma.subject.findMany({ include: { courses: true } });
  subjects.forEach(s => {
    console.log(`\nSubject: ${s.name} (${s.branch})`);
    s.courses.forEach(c => console.log(`  - Course: ${c.name}`));
  });
}
main().finally(() => prisma.$disconnect());
