const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function mergeCoursesToSubjects() {
  console.log('Starting migration: Merging scattered courses into a single Master Course per Subject...');
  
  // Clean up any failed masters
  await prisma.course.deleteMany({ where: { code: { startsWith: 'MASTER-' } } });
  
  const subjects = await prisma.subject.findMany();
  
  for (const subject of subjects) {
    const courses = await prisma.course.findMany({
      where: { subjectId: subject.id },
      include: { versions: { include: { units: true } } }
    });
    
    if (courses.length === 0) continue;
    if (courses.length === 1 && courses[0].title === subject.nameAr) {
      console.log(`Skipping Subject: ${subject.nameAr} (already merged)`);
      continue;
    }
    
    console.log(`\nProcessing Subject: ${subject.nameAr} (${courses.length} courses found)`);
    
    // 1. Create a Master Course
    const randStr = crypto.randomBytes(4).toString('hex');
    const masterCourse = await prisma.course.create({
      data: {
        subjectId: subject.id,
        code: `MASTER-${subject.id.substring(0, 8)}-${randStr}`,
        title: subject.nameAr,
        slug: `master-${subject.id.substring(0, 8)}-${randStr}`,
        curriculumType: courses[0].curriculumType,
        academicBranch: courses[0].academicBranch,
        gradeLevel: courses[0].gradeLevel,
        academicYear: courses[0].academicYear,
        description: `المنهاج الشامل لمادة ${subject.nameAr}`,
        isActive: true
      }
    });
    
    // 2. Create a Master Curriculum Version
    const masterVersion = await prisma.curriculumVersion.create({
      data: {
        courseId: masterCourse.id,
        versionTag: '2025/2026',
        status: 'published',
        publishedAt: new Date()
      }
    });
    
    let unitOrderIndex = 1;
    
    // 3. Move everything to the Master Course/Version
    for (const course of courses) {
      console.log(`  - Moving contents from course: ${course.title}`);
      
      // Move Cohorts
      await prisma.cohort.updateMany({
        where: { courseId: course.id },
        data: { courseId: masterCourse.id, curriculumVersionId: masterVersion.id }
      });
      
      // Move Textbooks
      await prisma.textbook.updateMany({
        where: { courseId: course.id },
        data: { courseId: masterCourse.id }
      });
      
      // Move Units
      for (const version of course.versions) {
        for (const unit of version.units) {
          const prefix = (course.title.includes(subject.nameAr) || course.title.includes("شامل")) ? "" : `${course.title} - `;
          const newUnitTitle = `${prefix}${unit.title}`;
          
          await prisma.curriculumUnit.update({
            where: { id: unit.id },
            data: { 
              curriculumVersionId: masterVersion.id,
              orderIndex: unitOrderIndex++,
              title: newUnitTitle
            }
          });
        }
        
        // Delete old version
        await prisma.curriculumVersion.delete({ where: { id: version.id } });
      }
      
      // Delete old course
      await prisma.course.delete({ where: { id: course.id } });
    }
    
    console.log(`Successfully merged ${subject.nameAr}!`);
  }
  
  console.log('\nAll courses merged successfully!');
}

mergeCoursesToSubjects().catch(console.error).finally(() => prisma.$disconnect());
