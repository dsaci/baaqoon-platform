const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.subject.findMany({ take: 3 })
  .then(res => {
    console.log('Connected! Subjects:', res.map(s => s.code));
    return p.$disconnect();
  })
  .catch(e => {
    console.error('Err:', e.message);
    return p.$disconnect();
  });
