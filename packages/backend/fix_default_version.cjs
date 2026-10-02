const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function fix() {
  const result = await prisma.curriculumVersion.updateMany({
    data: { isDefault: true }
  });
  console.log('Updated ' + result.count + ' versions to be default.');
}
fix().finally(() => prisma.$disconnect());
