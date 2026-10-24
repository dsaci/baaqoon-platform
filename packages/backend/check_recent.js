const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RECENT ACTIVITY LOGS ---');
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log(JSON.stringify(logs, null, 2));

  console.log('\n--- RECENT NOTIFICATIONS ---');
  const notifs = await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { email: true, firstName: true, lastName: true, primaryRole: true } } }
  });
  console.log(JSON.stringify(notifs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
