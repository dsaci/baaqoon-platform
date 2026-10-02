require('dotenv').config({ path: 'packages/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const subjects = await prisma.subject.findMany();
  console.log(subjects[0]);
}
main().finally(() => prisma.$disconnect());
