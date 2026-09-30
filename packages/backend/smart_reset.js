require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 تنظيف البيانات الوهمية (تصفير ذكي)...');
  
  // 1. Delete all operational data
  await prisma.assessmentSubmission.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.cohortEnrollment.deleteMany({});
  await prisma.cohortInstructor.deleteMany({});
  await prisma.cohort.deleteMany({});
  
  // 2. Delete all users
  await prisma.user.deleteMany({});

  console.log('✅ تم مسح جميع الأفواج، الجلسات، والاختبارات والمستخدمين الوهميين بنجاح.');

  // 3. Create Nasreddine Drissi Admin
  const hashedPassword = await bcrypt.hash('Baaqoon2024!', 12);
  const admin = await prisma.user.create({
    data: {
      firstName: 'نصر الدين',
      lastName: 'دريسي',
      email: 'drissi@baaqoon.ps',
      passwordHash: hashedPassword,
      primaryRole: 'super_admin',
      status: 'active'
    }
  });

  console.log('✅ تم إنشاء حساب المدير العام:');
  console.log(`الاسم: ${admin.firstName} ${admin.lastName}`);
  console.log(`البريد: ${admin.email}`);
  console.log(`كلمة المرور: Baaqoon2024!`);
  console.log('🎉 المنصة الآن نظيفة وجاهزة تماماً للعمل الرسمي!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
