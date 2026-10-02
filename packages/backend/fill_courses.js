require('dotenv').config({ path: 'packages/backend/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fillMissingCourses() {
  console.log("جارِ إنشاء المقررات الدراسية لباقي المواد...");
  
  // Find all subjects
  const subjects = await prisma.subject.findMany({
    include: { courses: true }
  });

  let createdCount = 0;

  for (const subject of subjects) {
    if (subject.courses.length === 0) {
      // Create a default course for this subject
      const shortCode = subject.code ? subject.code.substring(0, 5) : 'CRS';
      const uniqueCode = `${shortCode}-12-${Date.now().toString().substring(7)}-${createdCount}`;
      
      // Determine branch from subject or fallback to scientific
      const branchStr = subject.branch ? subject.branch : 'scientific';
      let branchEnum = 'scientific';
      if (branchStr.includes('الأدبي')) branchEnum = 'literary';
      if (branchStr.includes('الشرعي')) branchEnum = 'sharia';
      if (branchStr.includes('الريادة')) branchEnum = 'entrepreneurship';
      if (branchStr.includes('الصناعي')) branchEnum = 'industrial';
      if (branchStr.includes('الزراعي')) branchEnum = 'agricultural';
      
      await prisma.course.create({
        data: {
          subjectId: subject.id,
          title: `${subject.nameAr} - شامل`,
          code: uniqueCode,
          slug: uniqueCode,
          gradeLevel: 'grade_12',
          academicYear: '2024-2025',
          description: `المقرر الشامل لمادة ${subject.nameAr}`,
          curriculumType: "governmental",
          academicBranch: branchEnum
        }
      });
      createdCount++;
      console.log(`تم إنشاء مقرر لمادة: ${subject.nameAr}`);
    }
  }

  console.log(`\nتم إنشاء ${createdCount} مقررات جديدة بنجاح!`);
}

fillMissingCourses().catch(console.error).finally(() => prisma.$disconnect());
