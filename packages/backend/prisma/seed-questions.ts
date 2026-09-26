import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding dummy question templates...');
  
  let lesson = await prisma.curriculumLesson.findFirst();
  
  if (!lesson) {
    console.log('No lessons found. Creating dummy subject, course, unit, and lesson...');
    const subject = await prisma.subject.findFirst() || await prisma.subject.create({
      data: { code: 'DUMMY_SUB', nameAr: 'مادة تجريبية', curriculumType: 'governmental' }
    });
    const course = await prisma.course.create({
      data: {
        subjectId: subject.id, code: 'C_DUMMY', title: 'دورة تجريبية', slug: 'c-dummy',
        curriculumType: 'governmental', academicBranch: 'scientific', gradeLevel: 'grade_12', academicYear: '2025'
      }
    });
    const version = await prisma.curriculumVersion.create({
      data: { courseId: course.id, versionTag: 'v1' }
    });
    const unit = await prisma.curriculumUnit.create({
      data: { curriculumVersionId: version.id, orderIndex: 1, title: 'الوحدة الأولى' }
    });
    lesson = await prisma.curriculumLesson.create({
      data: { unitId: unit.id, orderIndex: 1, title: 'الدرس الأول: فلسطين' }
    });
  }

  const questions = [
    { content: 'ما هي عاصمة فلسطين؟', options: ['القدس', 'عمان', 'القاهرة', 'دمشق'], correctAnswer: 'القدس' },
    { content: 'في أي عام وقعت النكبة؟', options: ['1948', '1967', '1936', '1917'], correctAnswer: '1948' },
    { content: 'من هو الشاعر الفلسطيني الملقب بشاعر المقاومة؟', options: ['محمود درويش', 'إبراهيم طوقان', 'سميح القاسم', 'توفيق زياد'], correctAnswer: 'محمود درويش' },
    { content: 'كم يبلغ عدد القرى والمدن المهجرة؟', options: ['418', '500', '100', '250'], correctAnswer: '418' },
    { content: 'ما هو البحر الذي تطل عليه مدينة يافا؟', options: ['البحر المتوسط', 'البحر الميت', 'البحر الأحمر', 'بحر الجليل'], correctAnswer: 'البحر المتوسط' },
    { content: 'ما هي أعلى قمة جبلية في فلسطين؟', options: ['جبل الجرمق', 'جبل عيبال', 'جبل الطور', 'جبل الكرمل'], correctAnswer: 'جبل الجرمق' }
  ];

  for (const q of questions) {
    await prisma.questionTemplate.create({
      data: {
        curriculumLessonId: lesson.id,
        type: 'multiple_choice',
        content: q.content,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: 1
      }
    });
  }

  console.log('✅ Added question templates.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
