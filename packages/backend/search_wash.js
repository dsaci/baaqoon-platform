const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.crlypihigrhqxjhrargt:0QAibMm9gZO0SCXO@aws-1-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=1"
    }
  }
});

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'wash', mode: 'insensitive' } }
  });
  console.log('USER:', user);

  const allEmails = await prisma.user.findMany({
    select: { email: true, firstName: true, lastName: true }
  });
  const matching = allEmails.filter(u => u.email && u.email.toLowerCase().includes('wash'));
  console.log('MATCHING:', matching);
}

main().catch(console.error).finally(() => prisma.$disconnect());
