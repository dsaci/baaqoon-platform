const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ orderBy: { createdAt: 'desc' }, take: 30, select: { email: true, phone: true, status: true, primaryRole: true, createdAt: true } })
  .then(u => console.table(u)).finally(() => p.$disconnect());
