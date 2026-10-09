const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('12345678', 12);
  
  await prisma.user.update({
    where: { email: 'arabia904@baaqoon.ps' },
    data: { passwordHash: hash }
  });
  console.log("Password updated successfully!");
  
  await prisma.$disconnect();
}
main();
