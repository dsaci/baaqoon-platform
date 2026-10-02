const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const courses = await prisma.course.findMany({ include: { subject: true } });
  courses.forEach(c => console.log(c.subject.nameAr + ' | ' + c.title + ' | ' + c.id));
}
main().finally(() => prisma.$disconnect());
