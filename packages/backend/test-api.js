const axios = require('axios');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'supervisor@baaqoon.ps' } });
  if (!user) {
    console.log('User not found');
    return;
  }
  const token = jwt.sign(
    { sub: user.id, email: user.email, primaryRole: user.primaryRole },
    process.env.JWT_SECRET || 'baaqoon_super_secret_jwt_key_2024_secure',
    { expiresIn: '1h' }
  );

  try {
    const res = await axios.get('http://localhost:4000/api/v1/groups/supervisor/progress', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
