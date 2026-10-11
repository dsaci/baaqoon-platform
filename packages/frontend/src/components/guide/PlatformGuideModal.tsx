import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  Search, 
  GraduationCap, 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Play, 
  HelpCircle, 
  Calendar, 
  Video, 
  FileText, 
  Layers, 
  Clock, 
  Users, 
  Bell, 
  Key, 
  BarChart3, 
  Activity,
  Download, 
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface PlatformGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLiveTour?: () => void;
}

type RoleTab = 'student' | 'teacher' | 'supervisor' | 'admin';

interface GuideStep {
  stepNumber: number;
  title: string;
  badge: string;
  icon: any;
  summary: string;
  buttonsAndActions: {
    name: string;
    actionDescription: string;
    expectedResult: string;
    tip?: string;
  }[];
  proTips: string[];
}

export default function PlatformGuideModal({ isOpen, onClose, onStartLiveTour }: PlatformGuideModalProps) {
  const { user } = useAuthStore();
  
  // Set default tab based on user's primary role
  const getDefaultRole = (): RoleTab => {
    if (!user) return 'student';
    if (user.primaryRole === 'teacher') return 'teacher';
    if (user.primaryRole === 'subject_supervisor' || user.primaryRole === 'supervisor') return 'supervisor';
    if (user.primaryRole === 'admin' || user.primaryRole === 'super_admin') return 'admin';
    return 'student';
  };

  const [activeRole, setActiveRole] = useState<RoleTab>(getDefaultRole());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStep, setExpandedStep] = useState<number | null>(1);

  if (!isOpen) return null;

  const guideData: Record<RoleTab, { roleTitle: string; subtitle: string; icon: any; steps: GuideStep[] }> = {
    // ══════════════════════════════════════════════════════════════════════════
    // حساب الأستاذ
    // ══════════════════════════════════════════════════════════════════════════
    teacher: {
      roleTitle: 'دليل استخدام حساب الأستاذ والمعلم',
      subtitle: 'دليلك المتكامل لتحضير الحصص الذكية، إدارة الأفواج، والالتزام بالخطة السنوية والتقييم',
      icon: UserCheck,
      steps: [
        {
          stepNumber: 1,
          title: 'لوحة التحكم ومتابعة الالتزام بالخطة السنوية',
          badge: 'الواجهة الرئيسية',
          icon: BarChart3,
          summary: 'تمنحك لوحة التحكم نظرة شاملة على أفواجك، حصص اليوم، ومؤشر الالتزام بالخطة الدراسية.',
          buttonsAndActions: [
            {
              name: 'مؤشر وتيرة التقدم والمساءلة الذكية',
              actionDescription: 'يظهر في أعلى لوحة التحكم ليوضح الأسبوع الدراسي الحالي وعدد الحصص المتوقع تقديمها مقارنة بالمنجز الفعلي.',
              expectedResult: 'إذا كان مؤشرك أخضر فأنت متقدم أو ملتزم، وإذا تحول للأصفر أو الأحمر ستصلك نصائح وتنبيهات مباشرة لتدارك التأخير.',
              tip: 'احرص على إنهاء حصصك في مواعيدها للحفاظ على تقييم أدائك الأكاديمي ممتازاً.'
            },
            {
              name: 'بطاقات الإحصائيات السريعة',
              actionDescription: 'تعرض عدد الأفواج المسندة إليك، حصص اليوم المجدولة، الحصص المنجزة، وإجمالي الطلاب.',
              expectedResult: 'معرفة فورية بجدول عملك اليومي بمجرد فتح المنصة.'
            },
            {
              name: 'بطاقة الأفواج التي أُدرسها',
              actionDescription: 'اضغط على أي فوج لاستعراض قائمته وقائمة طلابه وإحصائيات الحضور الخاصة به.',
              expectedResult: 'فتح صفحة تفاصيل الفوج مع إمكانية متابعة تقدم الطلاب.'
            }
          ],
          proTips: [
            'المنصة مصممة وفق الفصلين الدراسيين الفلسطينيين (4 أشهر لكل فصل).',
            'التنبيهات المباشرة تساعدك على إنهاء وحدات المنهج قبل موعد الامتحانات الموحدة.'
          ]
        },
        {
          stepNumber: 2,
          title: 'بناء وتوليد الحصص الذكية بالذكاء الاصطناعي',
          badge: 'التحضير الرقمي',
          icon: Sparkles,
          summary: 'أداة فورية تمكنك من تحضير درس تفاعلي بالكامل بالاعتماد على المنهاج المعتمد.',
          buttonsAndActions: [
            {
              name: 'زر "بناء حصة ذكية" / التوجه إلى "المناهج والحصص"',
              actionDescription: 'انقر عليه من لوحة التحكم أو من القائمة الجانبية (شعار الكتاب/المناهج).',
              expectedResult: 'فتح شجرة المنهج الفلسطيني الشامل مع الوحدات والدروس المعتمدة.'
            },
            {
              name: 'اختيار الدرس من شجرة المنهاج',
              actionDescription: 'تصفح الوحدة الدراسية واضغط على الدرس المطلوب.',
              expectedResult: 'عرض تفاصيل الدرس، مخرجات التعلم، ونقاط التلخيص.'
            },
            {
              name: 'زر "توليد الحصة الذكية بالذكاء الاصطناعي"',
              actionDescription: 'انقر لتوليد محتوى الدرس، خطة سير الحصة، الشرائح، والأنشطة الإثرائية.',
              expectedResult: 'تجهيز مادة العرض كاملة وجاهزة للبث المباشر للطلاب دون إضاعة ساعات في التحضير اليدوي.'
            }
          ],
          proTips: [
            'المناهج شاملة وغير مجزأة (مثلاً اللغة العربية تشمل النحو والبلاغة والمطالعة في مساق واحد).',
            'يمكنك تصدير الشرائح أو استخدامها مباشرة في الفصل الافتراضي.'
          ]
        },
        {
          stepNumber: 3,
          title: 'إدارة الفصول الافتراضية والحصص المباشرة',
          badge: 'البث التفاعلي',
          icon: Video,
          summary: 'غرفة الصف الافتراضي لبث الدروس، مشاركة الشاشة والسبورة، وضبط الحضور.',
          buttonsAndActions: [
            {
              name: 'زر "بدء الحصة" / جدول الحصص',
              actionDescription: 'اضغط على الحصة المجدولة في جدولك عند حلول وقتها.',
              expectedResult: 'فتح قاعة الصف الافتراضي في وضع الشاشة الكاملة.'
            },
            {
              name: 'أدوات التفاعل (المايكروفون والسبورة ومشاركة الشاشة)',
              actionDescription: 'تفعيل المايك والكاميرا ومشاركة السبورة الذكية لعرض حل المسائل والشروحات.',
              expectedResult: 'مشاهدة الطلاب للشرح وسماعهم لصوتك بوضوح وبث فوري منخفض الاستهلاك للبيانات.'
            },
            {
              name: 'زر "رصد الحضور والغياب" الآلي',
              actionDescription: 'تضغط على أيقونة الحضور لتسجيل الطلاب الحاضرين والمتأخرين والغائبين.',
              expectedResult: 'تخزين سجل الحضور آلياً وإتاحته للمشرف والإدارة وأولياء الأمور.'
            }
          ],
          proTips: [
            'في حال تأخرت عن موعد الحصة سيتلقى حسابك تنبيهاً مباشراً من المشرف التربوي.',
            'احرص على إنهاء الحصة بالضغط على "إنهاء الجلسة" لتسجيل وقت إنجازها بدقة.'
          ]
        },
        {
          stepNumber: 4,
          title: 'توليد وتصحيح الاختبارات والواجبات',
          badge: 'التقييم المستمر',
          icon: FileText,
          summary: 'إنشاء اختبارات محوسبة ورصد درجات الطلاب وملاحظات التحسين.',
          buttonsAndActions: [
            {
              name: 'زر "توليد اختبار ذكي" / "إنشاء اختبار"',
              actionDescription: 'حدد الفوج الدراسي، المادة، ونوع الأسئلة (اختيار من متعدد، صح وخطأ، أو مقالي).',
              expectedResult: 'سحب الأسئلة المطابقة من بنك الأسئلة أو اقتراح أسئلة جديدة بالذكاء الاصطناعي.'
            },
            {
              name: 'زر "نشر التقييم"',
              actionDescription: 'تحديد وقت البدء ووقت التسليم النهائي والنقر على نشر.',
              expectedResult: 'ظهور الاختبار فوراً في لوحة تحكم جميع طلاب الفوج مع إشعار تنبيه.'
            },
            {
              name: 'زر "تصحيح الواجبات ورصد الدرجة"',
              actionDescription: 'الدخول على تسليم الطالب، كتابة الدرجة والملاحظة والضغط على "حفظ الدرجة".',
              expectedResult: 'حفظ الدرجة فوراً في قاعدة البيانات وإشعار الطالب بنتيجته وتوجيهاتك.'
            }
          ],
          proTips: [
            'الأسئلة الموضوعية تُصحح آلياً لتوفير وقت المعلم.',
            'يمكنك إعادة التقييم للطلاب الذين واجهوا صعوبات أو انقطاع في الكهرباء والإنترنت.'
          ]
        },
        {
          stepNumber: 5,
          title: 'المكتبة الرقمية والتوزيع السنوي',
          badge: 'المصادر والخطط',
          icon: BookOpen,
          summary: 'الوصول إلى كتب المنهاج الرسمي (الحكومي والأزهري) والخطط الأسبوعية.',
          buttonsAndActions: [
            {
              name: 'زر "المكتبة والكتب المدرسية"',
              actionDescription: 'تصفح الكتب مع إمكانية الفلترة حسب الصف (الصف 11 أو التوجيهي) ونوع المنهاج.',
              expectedResult: 'تحميل كتب وزارة التربية والتعليم العالي بصيغة PDF بنقرة واحدة.'
            },
            {
              name: 'زر "التوزيع السنوي والشهري للمنهاج"',
              actionDescription: 'استعراض خطة الفصلين الأول والثاني مفصلة أسبوعاً بأسبوع وشهراً بشهر.',
              expectedResult: 'رؤية الموضوعات الواجب تدريسها في كل شهر وفترات المراجعة والامتحانات.'
            }
          ],
          proTips: [
            'تحميل الكتاب بصيغة PDF يتيح لك الرجوع إليه وتصفحه حتى بدون اتصال دائم بالإنترنت.'
          ]
        }
      ]
    },

    // ══════════════════════════════════════════════════════════════════════════
    // حساب الطالب
    // ══════════════════════════════════════════════════════════════════════════
    student: {
      roleTitle: 'دليل استخدام حساب الطالب / الطالبة',
      subtitle: 'دليلك السهل لحضور الحصص المباشرة، حل الواجبات، ومتابعة درجاتك وتفوقك',
      icon: GraduationCap,
      steps: [
        {
          stepNumber: 1,
          title: 'الواجهة الرئيسية ومتابعة التعلم',
          badge: 'لوحة الطالب',
          icon: Sparkles,
          summary: 'مكانك اليومي لمعرفة جدولك، واجباتك المطلوبة، وشارة صفك ومنهاجك.',
          buttonsAndActions: [
            {
              name: 'شارة الصف الدراسي والمنهاج',
              actionDescription: 'تظهر في أعلى بطاقة الترحيب لتؤكد لك صفك (الصف 11 أو التوجيهي 12) ومنهاجك (حكومي أو أزهري).',
              expectedResult: 'التأكد من أن جميع المقررات والاختبارات المخصصة لك مطابقة لمرحلتك تماماً.'
            },
            {
              name: 'بطاقة الحصص القادمة',
              actionDescription: 'تعرض الحصص المجدولة لليوم والأيام القادمة مع توقيتها واسم الأستاذ.',
              expectedResult: 'الاستعداد المسبق للحصة قبل بدئها.'
            },
            {
              name: 'بطاقة الواجبات والمهام',
              actionDescription: 'توضح عدد الواجبات المنجزة والواجبات المتبقية التي تنتظر حلك.',
              expectedResult: 'عدم تفويت أي موعد تسليم لضمان درجات كاملة.'
            }
          ],
          proTips: [
            'تأكد من شحن جهازك وتثبيت المتصفح الحديث للدخول السلس للقاعات الافتراضية.'
          ]
        },
        {
          stepNumber: 2,
          title: 'جدول الحصص ودخول القاعة الافتراضية',
          badge: 'الصف المباشر',
          icon: Video,
          summary: 'كيفية حضور دروسك والتفاعل مع معلمك وزملائك.',
          buttonsAndActions: [
            {
              name: 'زر "جدول الحصص والتوقيت" من القائمة',
              actionDescription: 'استعراض جدول الأسبوع من الأحد إلى السبت موزعة حسب الساعات.',
              expectedResult: 'رؤية مواعيد كافة المواد لصفك وفوجك الدراسي.'
            },
            {
              name: 'زر "الانضمام للحصة المباشرة"',
              actionDescription: 'يظهر باللون الأخضر عند بدء الحصة. اضغط عليه للدخول فوراً للقاعة.',
              expectedResult: 'فتح الفصل الافتراضي وبث المعلم والشاشة التفاعلية.'
            },
            {
              name: 'أدوات التفاعل (المحادثة، رفع اليد، التحدث)',
              actionDescription: 'اضغط على زر رفع اليد للاستئذان بطرح سؤال، أو استخدم الشات للكتابة للمعلم.',
              expectedResult: 'مشاركة فعالة ورصد اسمك كحاضر في سجل الحصة.'
            }
          ],
          proTips: [
            'حضورك في الوقت المحدد يمنحك نقاط التزام إيجابية في تقريرك الفصلي.'
          ]
        },
        {
          stepNumber: 3,
          title: 'حل الواجبات والاختبارات ومراجعة النتائج',
          badge: 'التقييم والدرجات',
          icon: FileText,
          summary: 'أداء الاختبارات المحوسبة والاطلاع على تصحيح المعلم.',
          buttonsAndActions: [
            {
              name: 'زر "واجباتي واختباراتي"',
              actionDescription: 'الدخول لقائمة الاختبارات النشطة والواجبات المحددة لفوجك.',
              expectedResult: 'استعراض الاختبارات مع بيان وقت التسليم المتبقي ودرجة كل اختبار.'
            },
            {
              name: 'زر "بدء حل الاختبار"',
              actionDescription: 'انقر للإجابة على الأسئلة اختيار من متعدد أو كتابة الإجابات.',
              expectedResult: 'فتح نافذة الاختبار مع عداد زمني إن وجد.'
            },
            {
              name: 'زر "تسليم الإجابات"',
              actionDescription: 'بعد الانتهاء من الإجابة على كافة الأسئلة، اضغط "تسليم".',
              expectedResult: 'وصول إجابتك فوراً للأستاذ مع ظهور إشعار نجاح التسليم.'
            },
            {
              name: 'عرض النتيجة والملاحظات',
              actionDescription: 'بمجرد تصحيح الأستاذ ستظهر درجتك مع ملاحظاته التوجيهية لتصحيح الأخطاء.',
              expectedResult: 'الاستفادة من التغذية الراجعة للتفوق في الامتحانات الوزارية.'
            }
          ],
          proTips: [
            'احرص دائماً على الضغط على زر التسليم النهائي قبل انتهاء الوقت المحدد.'
          ]
        },
        {
          stepNumber: 4,
          title: 'تحميل الكتب وتعديل الملف الشخصي',
          badge: 'المكتبة والحساب',
          icon: BookOpen,
          summary: 'الحصول على المناهج بصيغة PDF وتحديث بياناتك الشخصية.',
          buttonsAndActions: [
            {
              name: 'زر "المكتبة الرقمية"',
              actionDescription: 'تصفح كتب المنهاج الفلسطيني (الصف 11 والتوجيهي) مع الفلترة والبحث السريع.',
              expectedResult: 'زر تحميل PDF مباشر لكل كتاب.'
            },
            {
              name: 'زر "الملف الشخصي" (أعلى الشاشة)',
              actionDescription: 'النقر على اسمك أعلى الشاشة > "تعديل الملف الشخصي".',
              expectedResult: 'إمكانية تحديث رقم هاتفك، جنسيتك، أو صفك الدراسي وحفظ التعديلات بأمان.'
            }
          ],
          proTips: [
            'الكتب الرقمية متوافقة تماماً مع أحدث طبعات وزارة التربية والتعليم للعام الدراسي الحالي.'
          ]
        }
      ]
    },

    // ══════════════════════════════════════════════════════════════════════════
    // حساب المشرف التربوي
    // ══════════════════════════════════════════════════════════════════════════
    supervisor: {
      roleTitle: 'دليل استخدام حساب المشرف والموجه التربوي',
      subtitle: 'الرقابة المباشرة، متابعة التزام المعلمين، الإشراف على التوزيع السنوي، والتقارير الحية',
      icon: Shield,
      steps: [
        {
          stepNumber: 1,
          title: 'المراقبة المباشرة الحالية لحصص المادة',
          badge: 'المتابعة الآنية',
          icon: Activity,
          summary: 'رصد فوري لجميع الحصص المباشرة الجارية الآن في مادة تخصصك وتدخل مباشر عند التأخر.',
          buttonsAndActions: [
            {
              name: 'بطاقة "المراقبة المباشرة الحالية"',
              actionDescription: 'تعرض الحصص التي تبث في هذه اللحظة، اسم المادة والفوج، واسم الأستاذ، وحالة الحصة.',
              expectedResult: 'معرفة فورية بما يجري في جميع الأفواج دون الحاجة للدخول الفردي.'
            },
            {
              name: 'زر "إرسال تنبيه للأستاذ" (Nudge)',
              actionDescription: 'عند رصد تأخر الأستاذ عن بدء الحصة في موعدها، اضغط على زر التنبيه الفوري.',
              expectedResult: 'إرسال إشعار فوري صوتي ومرئي لحساب الأستاذ ينبهه للالتحاق بالحصة والبدء فوراً.'
            },
            {
              name: 'جدول تقارير الغياب والالتزام (الجلسات السابقة)',
              actionDescription: 'مراجعة التزام الأساتذة بمواعيد الحصص السابقة (حضر بالموعد / تأخر 10 دقائق)، ونسب غياب الطلاب.',
              expectedResult: 'اتخاذ الإجراءات البيداغوجية اللازمة مثل زر "تنبيه الغائبين" أو "مراسلة الأستاذ".'
            }
          ],
          proTips: [
            'البيانات حقيقية ومحدثة من خوادم البث المباشر وقاعدة البيانات وليست صورية.'
          ]
        },
        {
          stepNumber: 2,
          title: 'نظام المساءلة ومتابعة وتيرة الخطة السنوية والشهرية',
          badge: 'المساءلة الأكاديمية',
          icon: Clock,
          summary: 'مراقبة التزام الأساتذة بالتوزيع المعتمد ومقارنة المنجز الفعلي بالمتوقع شهراً بشهر.',
          buttonsAndActions: [
            {
              name: 'بطاقة محاسبة البرنامج السنوي والشهري',
              actionDescription: 'تُظهر تقدم المعلمين في مادتك وحساب نسبة الإنجاز المتوقعة للأسبوع الحالي.',
              expectedResult: 'كشف فوري لأي أستاذ متأخر عن المنهاج مع إظهار عدد الحصص المطلوبة لتعويض التأخير.'
            },
            {
              name: 'زر "إرسال توجيه بيداغوجي"',
              actionDescription: 'مراسلة الأستاذ بتوصيات تنظيمية وحصص تعويضية مقترحة للالتزام بالخطة المعتمدة.',
              expectedResult: 'توجيه المعلم للتركيز على الدروس الأساسية وضمان جاهزية الطلاب للامتحانات الفصلية.'
            }
          ],
          proTips: [
            'المنهاج الفلسطيني مبني على فصلين دراسيين مدة كل فصل 4 أشهر مع عطلة بينية وشهر راحة.'
          ]
        },
        {
          stepNumber: 3,
          title: 'إدارة وتفقد الأفواج المسندة للمادة',
          badge: 'الأفواج والدورات',
          icon: Layers,
          summary: 'مراجعة توزيع المعلمين والطلبة على الأفواج التابعة لمادة إشرافك.',
          buttonsAndActions: [
            {
              name: 'تبويب "الأفواج"',
              actionDescription: 'استعراض جميع الأفواج التي تدرس مادتك، عدد الطلاب المسجلين بكل فوج، والمعلم المسؤول.',
              expectedResult: 'التأكد من التغطية الشاملة وتوزيع النصاب التدريسي بعدالة.'
            },
            {
              name: 'زر تفاصيل الفوج ومتابعة الدرجات',
              actionDescription: 'الدخول لأي فوج للاطلاع على نتائج اختباراتهم ومتوسط الدرجات.',
              expectedResult: 'تقييم فاعلية التدريس وجودة الاختبارات الموضوعة.'
            }
          ],
          proTips: [
            'المشرف مسؤول عن مادة واحدة شاملة بكافة فروعها دون تجزئة.'
          ]
        },
        {
          stepNumber: 4,
          title: 'صفحة الإحصائيات والتقارير المتقدمة المحدثة ساعياً',
          badge: 'التحليل الاستراتيجي',
          icon: BarChart3,
          summary: 'مؤشرات الأداء الشاملة الخاصة بالمادة ومقارنات المناهج والجنسيات.',
          buttonsAndActions: [
            {
              name: 'زر "التقارير والإحصائيات" من القائمة الجانبية',
              actionDescription: 'الدخول للصفحة المخصصة للإدارة والمشرفين فقط (`/supervisor/reports`).',
              expectedResult: 'عرض نسب التسجيل، توزيع المنهج الحكومي مقابل الأزهري، ونسب جنسيات الطلاب.'
            },
            {
              name: 'زر "تحديث فوري"',
              actionDescription: 'إعادة احتساب الأرقام والمؤشرات فورياً من قاعدة البيانات.',
              expectedResult: 'تحديث النسب المئوية وبيان آخر توقيت تحيين.'
            },
            {
              name: 'صندوق التوجيهات البيداغوجية والإدارية الذكية',
              actionDescription: 'قراءة التوصيات الذكية المولدة آلياً بناءً على مؤشرات الامتلاء وتأخر المعلمين.',
              expectedResult: 'خطة عمل استباقية لمعالجة أي خلل قبل تفاقمه.'
            }
          ],
          proTips: [
            'الصفحة تتحدث تلقائياً كل 60 دقيقة في الخلفية لتزويدك بأدق المعطيات.'
          ]
        }
      ]
    },

    // ══════════════════════════════════════════════════════════════════════════
    // حساب المدير والإدارة
    // ══════════════════════════════════════════════════════════════════════════
    admin: {
      roleTitle: 'دليل استخدام حساب الإدارة والمدير العام',
      subtitle: 'التحكم المركزي بالمنصة، تشكيل الأفواج، الإسناد الأكاديمي، الموارد البشرية، والتقارير',
      icon: ShieldAlert,
      steps: [
        {
          stepNumber: 1,
          title: 'غرفة القيادة المركزية وإدارة الأفواج',
          badge: 'لوحة الإدارة',
          icon: BarChart3,
          summary: 'إشراف كلي على سير المنصة ومؤشرات الطاقة الاستيعابية وتشكيل المجموعات.',
          buttonsAndActions: [
            {
              name: 'زر "إنشاء فوج جديد"',
              actionDescription: 'إدخال اسم الفوج وكوده، واختيار المادة والصف الدراسي والمنهج.',
              expectedResult: 'تقوم المنصة آلياً بفلترة المعلمين المتخصصين فقط والطلاب المتوافقين مع الصف والمنهج والفرع لتسهيل التحديد بضغطة زر.'
            },
            {
              name: 'زر "تعديل الفوج" / "حذف الفوج"',
              actionDescription: 'إمكانية تغيير معلم الفوج، إضافة أو إزالة طلاب، أو أرشفة الفوج عند الحاجة.',
              expectedResult: 'تحديث بيانات الفوج فورياً لدى المعلم والطلاب المعنيين.'
            },
            {
              name: 'مؤشرات الطاقة الاستيعابية',
              actionDescription: 'متابعة نسبة إشغال الأفواج (المعدل الموصى به 12 طالب لكل فوج).',
              expectedResult: 'معرفة الأفواج التي بها شواغر لضم طلبة جدد دون الحاجة لفتح أفواج إضافية.'
            }
          ],
          proTips: [
            'المنصة تدعم طلبة الصف 11 وطلبة التوجيهي 12، كما تدعم المنهج الحكومي والمنهج الأزهري المعتمد.'
          ]
        },
        {
          stepNumber: 2,
          title: 'الإسناد الأكاديمي الشامل للمشرفين والمعلمين',
          badge: 'الإسناد غير المجزأ',
          icon: Layers,
          summary: 'ربط المشرفين بالمواد الرئيسية دون تشتيت أو تجزئة لمقررات المادة.',
          buttonsAndActions: [
            {
              name: 'صفحة "الإسناد الأكاديمي" (`/admin/distribution`)',
              actionDescription: 'استعراض بطاقات المواد الأساسية الشاملة (لغة عربية، فيزياء، تربية إسلامية...).',
              expectedResult: 'ظهور اسم المشرف المعين حالياً على كل مادة أو خيار "بدون مشرف".'
            },
            {
              name: 'زر "تعيين مشرف" / "تغيير المشرف"',
              actionDescription: 'اختيار المشرف المتخصص من القائمة المنسدلة والضغط على حفظ.',
              expectedResult: 'إسناد المادة كاملة للمشرف مع منحه الصلاحيات التلقائية لمراقبة معلميها وطلابها وأفواجها.'
            }
          ],
          proTips: [
            'تم تصميم النظام ليكون شاملاً يمنع تجزئة فروع المادة الواحدة لحماية بنك الأسئلة والمكتبة من الخلط.'
          ]
        },
        {
          stepNumber: 3,
          title: 'إدارة الموارد البشرية وتفعيل الحسابات',
          badge: 'المستخدمون والتفعيل',
          icon: Users,
          summary: 'قبول طلبات التسجيل، إنشاء حسابات جديدة، وتعيين الجنسيات والصفوف.',
          buttonsAndActions: [
            {
              name: 'قائمة الحسابات المعلقة (Pending Accounts)',
              actionDescription: 'مراجعة المسجلين الجدد والنقر على زر "تفعيل" باللون الأخضر.',
              expectedResult: 'تحويل الحساب إلى "نشط" فوراً وتمكين المستخدم من تسجيل الدخول.'
            },
            {
              name: 'زر "إضافة مستخدم جديد"',
              actionDescription: 'إنشاء حساب لأستاذ أو طالب أو مشرف وتحديد بياناته وجنسيته وصفه الدراسي.',
              expectedResult: 'إنشاء وتفعيل الحساب في ثوانٍ مع كلمة مرور افتراضية.'
            },
            {
              name: 'زر الإشعارات لطلبات كلمات المرور (Key Bell)',
              actionDescription: 'يظهر في أعلى لوحة HR بعداد أحمر نابض عند وجود مستخدم نسي كلمة مروره.',
              expectedResult: 'النقر على زر المفتاح لفتح نافذة الموافقة الفورية وتأكيد كلمة المرور الجديدة.'
            }
          ],
          proTips: [
            'يمكنك تصفية المستخدمين بحسب الدور (معلم، طالب، مشرف، إدارة) أو البحث بالاسم ورقم الهاتف.'
          ]
        },
        {
          stepNumber: 4,
          title: 'صفحة الإحصائيات والتقارير المتقدمة الساعية',
          badge: 'التحليل والمؤشرات',
          icon: BarChart3,
          summary: 'رؤية استراتيجية محدثة كل ساعة للمدير والمشرفين فقط.',
          buttonsAndActions: [
            {
              name: 'صفحة التقارير (`/admin/reports`)',
              actionDescription: 'الدخول لاستعراض التحليل الدقيق لمجتمع المنصة.',
              expectedResult: 'عرض نسب المناهج: نسبة المنهاج الحكومي كم؟ والمنهاج الأزهري كم؟ ونسب الجنسيات بدقة.'
            },
            {
              name: 'كرت توزيع الصفوف الدراسية',
              actionDescription: 'يوضح نسبة وأعداد طلبة الصف 11 مقارنة بطلبة التوجيهي 12.',
              expectedResult: 'متابعة توزيع الموارد التعليمية وتخصيص الحصص المتوازنة بين الصفين.'
            },
            {
              name: 'توجيهات المتابعة والتنسيق الإدارية والبيداغوجية',
              actionDescription: 'قراءة التنبيهات المباشرة مثل وجود أفواج بدون معلم أو مواد بحاجة لمشرف.',
              expectedResult: 'معالجة الثغرات الإدارية بسرعة وكفاءة تامة.'
            }
          ],
          proTips: [
            'التقرير متاح للمدير والمشرفين ويقدم ملخصاً تنفيذياً جاهزاً لرفعه لإدارة الجمعية أو الوزارة.'
          ]
        },
        {
          stepNumber: 5,
          title: 'قاعدة البيانات الرقمية وتصدير السجلات',
          badge: 'الأرشيف والسجلات',
          icon: Key,
          summary: 'فحص الجداول المركزية ومراجعة كافة العمليات.',
          buttonsAndActions: [
            {
              name: 'صفحة "قاعدة البيانات" (`/admin/database`)',
              actionDescription: 'استعراض تبويبات المستخدمين، الأفواج، المقررات، والمواد الأساسية.',
              expectedResult: 'سجل شفاف لكل مدخل ومعدل مع كود كل مقرر ونوع المنهاج والصف الدراسي.'
            }
          ],
          proTips: [
            'قاعدة البيانات محمية بضوابط تحقق أمان عالية لمنع أي تداخل في الصلاحيات.'
          ]
        }
      ]
    }
  };

  const currentRoleData = guideData[activeRole];

  // Filter steps by search query
  const filteredSteps = currentRoleData.steps.filter(step => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = step.title.toLowerCase().includes(query);
    const matchesSummary = step.summary.toLowerCase().includes(query);
    const matchesButtons = step.buttonsAndActions.some(
      b => b.name.toLowerCase().includes(query) || b.actionDescription.toLowerCase().includes(query) || b.expectedResult.toLowerCase().includes(query)
    );
    return matchesTitle || matchesSummary || matchesButtons;
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in font-sans" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] max-h-[850px] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* ══════════════════════ Modal Header ══════════════════════ */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-indigo-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black bg-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/40">
                  دليل الاستخدام الشامل خطوة بخطوة
                </span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> الإصدار التفاعلي 2026
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                دليل منصة باقون التعليمية لجميع الحسابات
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto relative z-10">
            {onStartLiveTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartLiveTour();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                title="بدء جولة تفاعلية على شاشتك الحالية"
              >
                <Play className="w-4 h-4" />
                جولة تفاعلية حية للشاشة
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
              title="إغلاق الدليل"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ══════════════════════ Role Selector Tabs ══════════════════════ */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 sm:px-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-1">اختر الحساب:</span>
            
            <button
              onClick={() => { setActiveRole('teacher'); setExpandedStep(1); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 ${
                activeRole === 'teacher'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              حساب الأستاذ
            </button>

            <button
              onClick={() => { setActiveRole('student'); setExpandedStep(1); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 ${
                activeRole === 'student'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              حساب الطالب
            </button>

            <button
              onClick={() => { setActiveRole('supervisor'); setExpandedStep(1); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 ${
                activeRole === 'supervisor'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              حساب المشرف
            </button>

            <button
              onClick={() => { setActiveRole('admin'); setExpandedStep(1); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 ${
                activeRole === 'admin'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              حساب المدير والإدارة
            </button>
          </div>

          {/* Quick Search inside Guide */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث عن زر أو وظيفة..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
            />
          </div>
        </div>

        {/* ══════════════════════ Guide Content Area ══════════════════════ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* Section Banner */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <currentRoleData.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentRoleData.roleTitle}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  {currentRoleData.subtitle}
                </p>
              </div>
            </div>

            <div className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
              يحتوي على {currentRoleData.steps.length} خطوات أساسية
            </div>
          </div>

          {/* Steps List */}
          {filteredSteps.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-800">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-black text-base">لا توجد نتائج مطابقة لبحثك</p>
              <p className="text-slate-400 text-xs mt-1">جرب البحث بكلمات أخرى مثل: "حصة", "اختبار", "تنبيه", "توزيع", "حضور".</p>
            </div>
          ) : (
            filteredSteps.map((step) => {
              const StepIcon = step.icon;
              const isExpanded = expandedStep === step.stepNumber;

              return (
                <div 
                  key={step.stepNumber}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Step Header Toggle */}
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.stepNumber)}
                    className="w-full text-right p-5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
                        {step.stepNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                            {step.badge}
                          </span>
                        </div>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                          {step.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold text-slate-400 hidden sm:inline">
                        {step.buttonsAndActions.length} أزرار وإجراءات
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </button>

                  {/* Step Details (When Expanded) */}
                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-5 animate-fade-in">
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                        💡 {step.summary}
                      </p>

                      {/* Actions & Buttons breakdown */}
                      <div className="space-y-3">
                        <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                          الأزرار والوظائف خطوة بخطوة:
                        </h5>

                        <div className="grid grid-cols-1 gap-3">
                          {step.buttonsAndActions.map((action, aIdx) => (
                            <div 
                              key={aIdx} 
                              className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors shadow-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                <span className="text-sm font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                  {action.name}
                                </span>
                              </div>

                              <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 pr-4">
                                <span className="text-slate-400 ml-1">كيف أستخدمه؟:</span>
                                {action.actionDescription}
                              </p>

                              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40 pr-3">
                                <span className="font-black text-emerald-800 dark:text-emerald-300 ml-1">النتيجة التلقائية:</span>
                                {action.expectedResult}
                              </p>

                              {action.tip && (
                                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-1 rounded-md">
                                  ⭐ ملاحظة هامة: {action.tip}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pro Tips Box */}
                      {step.proTips && step.proTips.length > 0 && (
                        <div className="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3.5 space-y-1.5 text-xs text-indigo-900 dark:text-indigo-200">
                          <span className="font-black flex items-center gap-1.5 text-indigo-800 dark:text-indigo-300">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                            نصائح إضافية لضمان أفضل أداء:
                          </span>
                          <ul className="list-disc list-inside space-y-1 font-medium pr-1">
                            {step.proTips.map((tip, tIdx) => (
                              <li key={tIdx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>

        {/* ══════════════════════ Modal Footer ══════════════════════ */}
        <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-500 flex items-center gap-2 text-center sm:text-right">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
            <span>يمكنك فتح هذا الدليل في أي وقت بالنقر على زر المساعدة في أعلى الشاشة أو الزر العائم في الأسفل.</span>
          </div>

          <div className="flex items-center gap-3">
            {onStartLiveTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartLiveTour();
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <Play className="w-4 h-4" />
                تشغيل الجولة الإرشادية للشاشة
              </button>
            )}

            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm rounded-xl transition-colors"
            >
              فهمت، إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
