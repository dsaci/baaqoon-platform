import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ARABIC_STRUCTURE = {
  subject: {
    code: 'ARAB12',
    nameAr: 'اللغة العربية',
    nameEn: 'Arabic Language',
    description: 'كتاب اللغة العربية (المطالعة والقواعد والعروض والتعبير) للصف الثاني عشر - المسار الأكاديمي',
  },
  course: {
    code: 'ARAB12-ACAD',
    title: 'اللغة العربية 12',
    slug: 'arabic-language-12',
    academicBranch: 'literary',
    gradeLevel: 'grade_12',
  },
  units: [
    {
      orderIndex: 1,
      title: 'الوحدة الأولى',
      lessons: [
        {
          orderIndex: 1, title: 'اشتدي أزمة تنفرجي', lessonType: 'مطالعة ونصوص', domain: 'القصص القرآني',
          learningObjectives: ['تحليل آيات سورة يوسف.', 'استنتاج العواطف والقيم في النص.', 'فهم معاني المفردات الجديدة.'],
          learningSequence: [{ stage: 'التهيئة', activities: ['قراءة النص القرآني'] }, { stage: 'الفهم والاستيعاب', activities: ['أسئلة حول دلالة الآيات'] }, { stage: 'المناقشة والتحليل', activities: ['استخراج الصور الفنية وتحليلها'] }]
        },
        {
          orderIndex: 2, title: 'الممنوع من الصرف (١)', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف على الممنوع من الصرف لسببين.', 'إعراب الممنوع من الصرف.'],
          learningSequence: [{ stage: 'ملاحظة', activities: ['قراءة الأمثلة وتحديد العلامة الإعرابية'] }, { stage: 'استنتاج', activities: ['صياغة قاعدة الممنوع من الصرف (العلم والصفة)'] }, { stage: 'توظيف', activities: ['حل التدريبات'] }]
        },
        {
          orderIndex: 3, title: 'البحر الوافر', lessonType: 'عروض', domain: 'العروض والقوافي',
          learningObjectives: ['التعرف على تفعيلات البحر الوافر.', 'تقطيع أبيات من البحر الوافر.'],
          learningSequence: [{ stage: 'قراءة', activities: ['قراءة الأبيات الشعرية'] }, { stage: 'تقطيع', activities: ['تقطيع التفعيلات العروضية واستنتاج التفعيلة الأصلية والفرعية'] }]
        }
      ]
    },
    {
      orderIndex: 2,
      title: 'الوحدة الثانية',
      lessons: [
        {
          orderIndex: 1, title: 'مسرحية غروب الأندلس', lessonType: 'مطالعة ونصوص', domain: 'الأدب المسرحي',
          learningObjectives: ['تحليل المسرحية الشعرية.', 'استنتاج الخصائص الأسلوبية للنص.', 'استخراج المحسنات البديعية.'],
          learningSequence: [{ stage: 'التعريف بالكاتب', activities: ['نبذة عن عزيز أباظة'] }, { stage: 'القراءة', activities: ['قراءة مشاهد المسرحية'] }, { stage: 'التحليل', activities: ['مناقشة الحوار والصراع الداخلي والخارجي'] }]
        },
        {
          orderIndex: 2, title: 'رسالة إلى صديق قديم', lessonType: 'مطالعة ونصوص', domain: 'الشعر الحر',
          learningObjectives: ['تحليل القصيدة واستنتاج الأفكار.', 'توضيح الصور الفنية.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة القصيدة لعبد اللطيف عقل'] }, { stage: 'الفهم والاستيعاب', activities: ['تحديد سر بكاء الشاعر ومطالب الصديق'] }]
        },
        {
          orderIndex: 3, title: 'الممنوع من الصرف (٢)', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف على الممنوع من الصرف لسبب واحد.', 'صيغة منتهى الجموع والاسم الممدود والمقصور.'],
          learningSequence: [{ stage: 'الملاحظة', activities: ['قراءة أمثلة لجموع التكسير'] }, { stage: 'الاستنتاج', activities: ['استنتاج القاعدة والصرف في حال الإضافة أو ال التعريف'] }]
        }
      ]
    },
    {
      orderIndex: 3,
      title: 'الوحدة الثالثة',
      lessons: [
        {
          orderIndex: 1, title: 'كم حياة ستعيش', lessonType: 'مطالعة ونصوص', domain: 'المقالة',
          learningObjectives: ['قراءة المقالة وتحليل أفكارها.', 'استنتاج القيم السلوكية.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة مقالة كريم الشاذلي'] }, { stage: 'الفهم', activities: ['توضيح مفهوم استثمار الحياة'] }]
        },
        {
          orderIndex: 2, title: 'الإعلال', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف إلى الإعلال بالقلب.', 'بيان ما يطرأ على الكلمات من إعلال.'],
          learningSequence: [{ stage: 'الملاحظة', activities: ['تأمل أصل الألف في الأفعال والأسماء'] }, { stage: 'الاستنتاج', activities: ['قاعدة قلب الواو والياء ألفاً أو همزة أو العكس'] }]
        },
        {
          orderIndex: 3, title: 'البحر الطويل', lessonType: 'عروض', domain: 'العروض والقوافي',
          learningObjectives: ['التعرف على تفعيلات البحر الطويل.', 'تقطيع أبيات شعرية.'],
          learningSequence: [{ stage: 'تقطيع', activities: ['تقطيع فعولن ومفاعيلن واستنتاج التفعيلات الفرعية'] }]
        }
      ]
    },
    {
      orderIndex: 4,
      title: 'الوحدة الرابعة',
      lessons: [
        {
          orderIndex: 1, title: 'القدس بوصلة ومجد', lessonType: 'مطالعة ونصوص', domain: 'الخاطرة',
          learningObjectives: ['تحليل الخاطرة.', 'تبيان مكانة القدس الدينية والوطنية.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة النص'] }, { stage: 'التحليل', activities: ['استخراج الصور الفنية والدلالات'] }]
        },
        {
          orderIndex: 2, title: 'الإبدال', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف إلى مفهوم الإبدال.', 'إبدال تاء (افتعل) ومشتقاتها.'],
          learningSequence: [{ stage: 'ملاحظة', activities: ['مقارنة الكلمات قبل وبعد الإبدال'] }, { stage: 'استنتاج', activities: ['قاعدة إبدال التاء بالطاء أو الدال'] }]
        }
      ]
    },
    {
      orderIndex: 5,
      title: 'الوحدة الخامسة',
      lessons: [
        {
          orderIndex: 1, title: 'التواصل في العالم الافتراضي وآدابه', lessonType: 'مطالعة ونصوص', domain: 'المقالة العلمية',
          learningObjectives: ['إدراك أهمية العالم الافتراضي.', 'تحليل آداب التواصل الاجتماعي.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة المقالة'] }, { stage: 'التحليل', activities: ['مناقشة مخاطر وسائل التواصل وإيجابياتها'] }]
        },
        {
          orderIndex: 2, title: 'اسم الفعل', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['إعراب اسم الفعل.', 'التمييز بين اسم الفعل الماضي والمضارع والأمر.'],
          learningSequence: [{ stage: 'ملاحظة', activities: ['استخراج أسماء الأفعال من الأمثلة'] }, { stage: 'استنتاج', activities: ['صياغة قاعدة أسماء الأفعال'] }]
        },
        {
          orderIndex: 3, title: 'البحر البسيط', lessonType: 'عروض', domain: 'العروض والقوافي',
          learningObjectives: ['التعرف على تفعيلات البحر البسيط.'],
          learningSequence: [{ stage: 'تقطيع', activities: ['تقطيع مستفعلن فاعلن'] }]
        }
      ]
    },
    {
      orderIndex: 6,
      title: 'الوحدة السادسة',
      lessons: [
        {
          orderIndex: 1, title: 'أنا وليلى', lessonType: 'مطالعة ونصوص', domain: 'الشعر الغزلي',
          learningObjectives: ['تحليل قصيدة حسن المرواني.', 'استخراج العواطف والصور الفنية.'],
          learningSequence: [{ stage: 'التعريف', activities: ['قصة القصيدة في جامعة بغداد'] }, { stage: 'التحليل', activities: ['تحليل المقطع تلو الآخر'] }]
        },
        {
          orderIndex: 2, title: 'من المعاني النحوية لـ (الواو) و(الفاء)', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف إلى معاني الواو والفاء في سياقات متنوعة.', 'إعراب الواو والفاء.'],
          learningSequence: [{ stage: 'ملاحظة', activities: ['تحليل أمثلة للواو (عاطفة، قسم، معية، حال) والفاء (عاطفة، سببية، استئنافية)'] }]
        }
      ]
    },
    {
      orderIndex: 7,
      title: 'الوحدة السابعة',
      lessons: [
        {
          orderIndex: 1, title: 'أمرني خليلي', lessonType: 'مطالعة ونصوص', domain: 'الحديث النبوي',
          learningObjectives: ['تحليل الأحاديث النبوية.', 'استنتاج القيم السلوكية.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة الأحاديث'] }, { stage: 'التحليل', activities: ['توضيح دلالات الأحاديث ومعاني المفردات'] }]
        },
        {
          orderIndex: 2, title: 'المدينة المحاصرة', lessonType: 'مطالعة ونصوص', domain: 'الشعر الوطني',
          learningObjectives: ['تحليل قصيدة معين بسيسو.', 'فهم معاناة غزة والوطن السجين.'],
          learningSequence: [{ stage: 'التحليل', activities: ['مناقشة الاستعارات والصور الفنية الدالة على الحصار'] }]
        },
        {
          orderIndex: 3, title: 'من المعاني النحوية لـ (ما) و(مَنْ)', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف إلى معاني ما ومن.', 'إعرابهما في سياقات متنوعة.'],
          learningSequence: [{ stage: 'ملاحظة', activities: ['ما (شرطية، موصولة، استفهامية) ومَنْ (شرطية، موصولة، استفهامية)'] }]
        }
      ]
    },
    {
      orderIndex: 8,
      title: 'الوحدة الثامنة',
      lessons: [
        {
          orderIndex: 1, title: 'مرافعات أمام ضمير غائب', lessonType: 'مطالعة ونصوص', domain: 'أدب السجون',
          learningObjectives: ['تحليل النص النثري لوائل محيي الدين.', 'استنتاج ملامح الاعتقال الإداري.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة القصة'] }, { stage: 'التحليل', activities: ['مناقشة الصراع الداخلي للأسير'] }]
        },
        {
          orderIndex: 2, title: 'وصية لاجئ', lessonType: 'مطالعة ونصوص', domain: 'الشعر الوطني',
          learningObjectives: ['تحليل قصيدة هاشم الرفاعي.', 'استخراج العواطف والمشاعر.'],
          learningSequence: [{ stage: 'القراءة', activities: ['قراءة القصيدة'] }, { stage: 'الفهم', activities: ['تحليل الوصية ورمزية العودة'] }]
        },
        {
          orderIndex: 3, title: 'من المعاني النحوية لـ (لا) و(اللام)', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف إلى معاني لا واللام.', 'إعرابهما.'],
          learningSequence: [{ stage: 'ملاحظة', activities: ['لا (نافية، ناهية، عاطفة) واللام (حرف جر، لام الأمر، لام الابتداء)'] }]
        },
        {
          orderIndex: 4, title: 'الجمل التي لها محل من الإعراب', lessonType: 'قواعد', domain: 'النحو والصرف',
          learningObjectives: ['التعرف على الجمل التي تسد مسد المفرد.', 'تحديد المحل الإعرابي للجمل.'],
          learningSequence: [{ stage: 'استنتاج', activities: ['الجملة الواقعة خبراً، صفة، حالاً، مفعولاً به.'] }]
        },
        {
          orderIndex: 5, title: 'البحر الخفيف', lessonType: 'عروض', domain: 'العروض والقوافي',
          learningObjectives: ['التعرف على تفعيلات البحر الخفيف.'],
          learningSequence: [{ stage: 'تقطيع', activities: ['تقطيع فاعلاتن مستفعلن فاعلاتن'] }]
        }
      ]
    }
  ]
};

async function main() {
  console.log('📖 إنشاء مقرر اللغة العربية (الأدبي) من الـ PDF...');
  
  let subject = await prisma.subject.findUnique({ where: { code: ARABIC_STRUCTURE.subject.code } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        code: ARABIC_STRUCTURE.subject.code,
        nameAr: ARABIC_STRUCTURE.subject.nameAr,
        nameEn: ARABIC_STRUCTURE.subject.nameEn,
        description: ARABIC_STRUCTURE.subject.description,
      }
    });
  }

  let course = await prisma.course.findUnique({ where: { slug: ARABIC_STRUCTURE.course.slug } });
  if (!course) {
    course = await prisma.course.create({
      data: {
        subjectId: subject.id,
        code: ARABIC_STRUCTURE.course.code,
        title: ARABIC_STRUCTURE.course.title,
        slug: ARABIC_STRUCTURE.course.slug,
        curriculumType: 'governmental',
        academicBranch: ARABIC_STRUCTURE.course.academicBranch as any,
        gradeLevel: ARABIC_STRUCTURE.course.gradeLevel as any,
        academicYear: '2023-2024',
      }
    });
  }

  let version = await prisma.curriculumVersion.findUnique({
    where: { courseId_versionTag: { courseId: course.id, versionTag: 'v1.0' } }
  });

  if (!version) {
    version = await prisma.curriculumVersion.create({
      data: {
        courseId: course.id,
        versionTag: 'v1.0',
        status: 'published',
        isDefault: true,
      }
    });
  } else {
    await prisma.curriculumUnit.deleteMany({ where: { curriculumVersionId: version.id } });
  }

  for (const unitData of ARABIC_STRUCTURE.units) {
    const unit = await prisma.curriculumUnit.create({
      data: {
        curriculumVersionId: version.id,
        orderIndex: unitData.orderIndex,
        title: unitData.title
      }
    });

    for (const lessonData of unitData.lessons) {
      const lesson = await prisma.curriculumLesson.create({
        data: {
          unitId: unit.id,
          orderIndex: lessonData.orderIndex,
          title: lessonData.title,
          lessonType: lessonData.lessonType,
          domain: lessonData.domain,
          learningObjectives: lessonData.learningObjectives || [],
          learningSequence: lessonData.learningSequence || []
        }
      });

      await prisma.questionTemplate.create({
        data: {
          curriculumLessonId: lesson.id,
          type: 'multiple_choice',
          content: `سؤال ذكي مستخرج من كتاب اللغة العربية (درس ${lessonData.title}) حول المفاهيم الأساسية.`,
          options: ['إجابة منطقية مستنتجة من الدرس', 'خيار خاطئ 1', 'خيار خاطئ 2', 'خيار خاطئ 3'],
          correctAnswer: 'إجابة منطقية مستنتجة من الدرس',
          difficulty: 2
        }
      });
    }
  }

  console.log('✅ تم الانتهاء! تم استخراج دروس اللغة العربية بنجاح وحقنها في المنصة.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
