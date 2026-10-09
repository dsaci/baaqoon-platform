const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const supervisor = await prisma.user.findFirst({
    where: { primaryRole: 'subject_supervisor' }
  });
  console.log(supervisor);
  await prisma.$disconnect();
}
main();
