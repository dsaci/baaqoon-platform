require('dotenv').config({ path: 'packages/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const subjects = await prisma.subject.findMany({ select: { id: true, nameAr: true } });
  subjects.forEach(s => console.log(s.nameAr));
}
main().finally(() => prisma.$disconnect());
