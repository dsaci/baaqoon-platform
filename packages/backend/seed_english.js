const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding English (اللغة الإنجليزية)...');
  
  // Cleanup previous attempts
  const existingSubject = await prisma.subject.findUnique({ where: { code: 'ENG-12' } });
  if (existingSubject) {
    const existingCourses = await prisma.course.findMany({ where: { subjectId: existingSubject.id } });
    for (const c of existingCourses) {
      const versions = await prisma.curriculumVersion.findMany({ where: { courseId: c.id } });
      for (const v of versions) {
        const units = await prisma.curriculumUnit.findMany({ where: { curriculumVersionId: v.id } });
        for (const u of units) {
          await prisma.curriculumLesson.deleteMany({ where: { unitId: u.id } });
        }
        await prisma.curriculumUnit.deleteMany({ where: { curriculumVersionId: v.id } });
      }
      await prisma.curriculumVersion.deleteMany({ where: { courseId: c.id } });
    }
    await prisma.course.deleteMany({ where: { subjectId: existingSubject.id } });
    await prisma.subject.delete({ where: { id: existingSubject.id } });
    console.log('Cleaned up existing ENG-12 subject.');
  }

  // 1. Create Subject
  const subject = await prisma.subject.create({
    data: {
      code: 'ENG-12',
      nameAr: 'اللغة الإنجليزية',
      nameEn: 'English Language',
      description: 'English for Palestine - Grade 12',
      
      iconUrl: 'http://mohe.pna.ps/books/english12.pdf'
    }
  });
  console.log('Created Subject:', subject.nameAr);

  // 2. Create Course
  const course = await prisma.course.create({
    data: {
      code: 'ENG-12-ALL',
      slug: 'english-12-all',
      subjectId: subject.id,
      title: 'اللغة الإنجليزية (English for Palestine)',
      academicBranch: 'scientific', // Actually all branches, but using scientific as default
      curriculumType: 'governmental',
      gradeLevel: 'grade_12',
      academicYear: '2025/2026',
    }
  });
  console.log('Created Course:', course.title);

  // 3. Create Curriculum Version
  const curriculumVersion = await prisma.curriculumVersion.create({
    data: {
      courseId: course.id,
      versionTag: '2025-v1',
      status: 'published',
      publishedAt: new Date(),
      isDefault: true,
    }
  });

  // 4. Units and Lessons Data
  const curriculumData = [
    {
      title: 'Unit 1: A new start',
      description: 'Present simple / perfect, Present continuous, Stative verbs',
      orderIndex: 1,
      lessons: [
        { title: 'Reading: Stepping outside the comfort zone', orderIndex: 1 },
        { title: 'Language: Present Tenses & Stative verbs', orderIndex: 2 },
        { title: 'Integrated skills: University application form', orderIndex: 3 }
      ]
    },
    {
      title: 'Unit 2: Under pressure',
      description: 'Infinitives and -ing forms, Compound noun phrases',
      orderIndex: 2,
      lessons: [
        { title: 'Reading: Time Management', orderIndex: 1 },
        { title: 'Reading: What young Australians worry most about', orderIndex: 2 },
        { title: 'Language: Infinitives and -ing forms', orderIndex: 3 },
        { title: 'Writing: Personal statement', orderIndex: 4 }
      ]
    },
    {
      title: 'Unit 3: A funny thing happened',
      description: 'Past tenses, Prefixes co- and mis-, Time phrases',
      orderIndex: 3,
      lessons: [
        { title: 'Reading: Funny stories & Coincidences', orderIndex: 1 },
        { title: 'Language: Past Tenses', orderIndex: 2 },
        { title: 'Writing: Story of a strange coincidence', orderIndex: 3 }
      ]
    },
    {
      title: 'Unit 4: The shrinking world',
      description: 'Modal verbs of probability and possibility, Future statements',
      orderIndex: 4,
      lessons: [
        { title: 'Reading: Communication today', orderIndex: 1 },
        { title: 'Language: Future statements using will, going to', orderIndex: 2 },
        { title: 'Integrated skills: Planning a questionnaire', orderIndex: 3 }
      ]
    },
    {
      title: 'Unit 5: The world of work',
      description: 'Direct and indirect questions, Question tags',
      orderIndex: 5,
      lessons: [
        { title: 'Reading: Dream Jobs', orderIndex: 1 },
        { title: 'Language: Direct and Indirect Questions', orderIndex: 2 },
        { title: 'Writing: Formal letters and business letters', orderIndex: 3 }
      ]
    },
    {
      title: 'Unit 6: In business',
      description: 'Reporting advice and orders, Causative structures',
      orderIndex: 6,
      lessons: [
        { title: 'Reading: Business Start-ups', orderIndex: 1 },
        { title: 'Language: Causative structures', orderIndex: 2 },
        { title: 'Integrated skills: Letters of Enquiry', orderIndex: 3 }
      ]
    },
    {
      title: 'Unit 7: Only a game?',
      description: 'Past wishes and regrets',
      orderIndex: 7,
      lessons: [
        { title: 'Reading: Are sports stars overpaid?', orderIndex: 1 },
        { title: 'Reading: Olympic Games inclusion criteria', orderIndex: 2 },
        { title: 'Language: Past wishes and regrets', orderIndex: 3 }
      ]
    },
    {
      title: 'Unit 8: Different places, different ways',
      description: 'Verbs and prepositions, Past forms of modal verbs',
      orderIndex: 8,
      lessons: [
        { title: 'Reading: Clinging to culture', orderIndex: 1 },
        { title: 'Language: Verbs and prepositions', orderIndex: 2 },
        { title: 'Writing: A memorable experience', orderIndex: 3 }
      ]
    }
  ];

  // Insert Units & Lessons
  for (const unit of curriculumData) {
    const createdUnit = await prisma.curriculumUnit.create({
      data: {
        curriculumVersionId: curriculumVersion.id,
        title: unit.title,
        description: unit.description,
        orderIndex: unit.orderIndex,
      }
    });

    for (const lesson of unit.lessons) {
      await prisma.curriculumLesson.create({
        data: {
          unitId: createdUnit.id,
          title: lesson.title,
          orderIndex: lesson.orderIndex,
          estimatedDurationMinutes: 45
        }
      });
    }
  }

  console.log('English Seed Completed Successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
