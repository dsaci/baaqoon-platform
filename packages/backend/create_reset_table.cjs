const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  await p.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS users.password_reset_requests (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      new_password_hash varchar(255) NOT NULL,
      status varchar(20) NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now(),
      resolved_at timestamptz
    )`);
  console.log('table ready');
})().catch(console.error).finally(() => p.$disconnect());
