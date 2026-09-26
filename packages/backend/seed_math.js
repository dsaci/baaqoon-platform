const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mathematics (الرياضيات - العلمي)...');
  
  // Cleanup previous attempts
  const existingSubject = await prisma.subject.findUnique({ where: { code: 'MATH-12-SC' } });
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
    console.log('Cleaned up existing MATH-12-SC subject.');
  }

  // 1. Create Subject
  const subject = await prisma.subject.create({
    data: {
      code: 'MATH-12-SC',
      nameAr: 'الرياضيات',
      nameEn: 'Mathematics',
      description: 'Mathematics for Grade 12 - Scientific Branch',
      
      iconUrl: 'http://mohe.pna.ps/books/math12.pdf'
    }
  });
  console.log('Created Subject:', subject.nameAr);

  // 2. Create Course
  const course = await prisma.course.create({
    data: {
      code: 'MATH-12-SC-CR',
      slug: 'math-12-sc',
      subjectId: subject.id,
      title: 'الرياضيات - الفرع العلمي والصناعي',
      academicBranch: 'scientific',
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
      title: 'الوحدة الأولى: حساب التفاضل',
      description: 'Differentiation',
      orderIndex: 1,
      lessons: [
        { title: 'متوسط التغير', orderIndex: 1 },
        { title: 'قواعد الاشتقاق', orderIndex: 2 },
        { title: 'مشتقات الاقترانات المثلثية', orderIndex: 3 },
        { title: 'قاعدة لوبيتال ومشتقة الاقتران الأسي واللوغاريتمي', orderIndex: 4 },
        { title: 'تطبيقات هندسية وفيزيائية', orderIndex: 5 },
        { title: 'قاعدة السلسلة', orderIndex: 6 },
        { title: 'الاشتقاق الضمني', orderIndex: 7 }
      ]
    },
    {
      title: 'الوحدة الثانية: تطبيقات التفاضل',
      description: 'Differentiation Applications',
      orderIndex: 2,
      lessons: [
        { title: 'الاقترانات المتزايدة والمتناقصة', orderIndex: 1 },
        { title: 'القيم القصوى', orderIndex: 2 },
        { title: 'التقعر ونقط الانعطاف', orderIndex: 3 },
        { title: 'تطبيقات عملية على القيم القصوى', orderIndex: 4 }
      ]
    },
    {
      title: 'الوحدة الثالثة: المصفوفات والمحددات',
      description: 'Matrices and Determinants',
      orderIndex: 3,
      lessons: [
        { title: 'المصفوفة', orderIndex: 1 },
        { title: 'العمليات على المصفوفات', orderIndex: 2 },
        { title: 'المحددات', orderIndex: 3 },
        { title: 'النظير الضربي للمصفوفة المربعة', orderIndex: 4 },
        { title: 'حل أنظمة المعادلات الخطية باستخدام المصفوفات', orderIndex: 5 }
      ]
    },
    {
      title: 'الوحدة الرابعة: التكامل غير المحدود وتطبيقاته',
      description: 'Indefinite Integral and its Applications',
      orderIndex: 4,
      lessons: [
        { title: 'التكامل غير المحدود', orderIndex: 1 },
        { title: 'قواعد التكامل غير المحدود', orderIndex: 2 },
        { title: 'تطبيقات التكامل غير المحدود', orderIndex: 3 },
        { title: 'طرق التكامل (التعويض، الأجزاء، الكسور الجزئية)', orderIndex: 4 }
      ]
    },
    {
      title: 'الوحدة الخامسة: التكامل المحدود وتطبيقاته',
      description: 'Definite Integration and its Applications',
      orderIndex: 5,
      lessons: [
        { title: 'التجزئة ومجموع ريمان', orderIndex: 1 },
        { title: 'التكامل المحدود', orderIndex: 2 },
        { title: 'العلاقة بين التفاضل والتكامل', orderIndex: 3 },
        { title: 'خصائص التكامل المحدود', orderIndex: 4 },
        { title: 'تطبيقات التكامل المحدود (المساحة، الحجم)', orderIndex: 5 }
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

  // Generate Sample Question Templates
  const allLessons = await prisma.curriculumLesson.findMany({
    where: { unit: { curriculumVersionId: curriculumVersion.id } }
  });

  const questionTemplates = [];
  const matrixLesson = allLessons.find(l => l.title === 'المصفوفة');
  const integrationLesson = allLessons.find(l => l.title === 'التكامل غير المحدود');
  
  if (matrixLesson) {
    questionTemplates.push({
      curriculumLessonId: matrixLesson.id,
      type: 'multiple_choice',
      content: 'إذا كانت المصفوفة أ تتكون من 3 صفوف وعمودين فهي من الرتبة:',
      options: ['2 × 3', '3 × 2', '3 × 3', '2 × 2'],
      correctAnswer: '3 × 2'
    });
  }

  if (integrationLesson) {
    questionTemplates.push({
      curriculumLessonId: integrationLesson.id,
      type: 'multiple_choice',
      content: 'تكامل الثابت ك يعطى بالقاعدة:',
      options: ['ك س + جـ', 'ك + جـ', 'س + جـ', 'ك س'],
      correctAnswer: 'ك س + جـ'
    });
  }

  for (const q of questionTemplates) {
    await prisma.questionTemplate.create({ data: q });
  }

  console.log('Math Seed Completed Successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
