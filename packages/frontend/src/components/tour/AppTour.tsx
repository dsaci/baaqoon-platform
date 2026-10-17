import React, { useState, useEffect, useRef } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step, TooltipRenderProps } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { HelpCircle, X, ChevronRight, ChevronLeft, Play, BookOpen } from 'lucide-react';

export default function AppTour() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dontShowAgainRef = useRef(dontShowAgain);

  useEffect(() => {
    const isGlobal = localStorage.getItem('tour_opt_out_global') === 'true';
    const isUser = user?.id ? localStorage.getItem(`tour_opt_out_all_${user.id}`) === 'true' : false;
    if (isGlobal || isUser) {
      setDontShowAgain(true);
      dontShowAgainRef.current = true;
    }
  }, [user?.id]);

  useEffect(() => {
    dontShowAgainRef.current = dontShowAgain;
  }, [dontShowAgain]);

  // Extract the main path key (e.g., 'dashboard', 'schedule')
  const pathParts = location.pathname.split('/').filter(Boolean);
  const pathKey = pathParts.length > 1 ? pathParts[1] : (pathParts[0] || 'home');

  useEffect(() => {
    // 1. If globally opted out, never run automatically
    if (localStorage.getItem('tour_opt_out_global') === 'true') {
      setRun(false);
      return;
    }

    if (!user) return;

    // 2. If user-specific opted out, never run automatically
    if (localStorage.getItem(`tour_opt_out_all_${user.id}`) === 'true') {
      setRun(false);
      return;
    }

    const tourKey = `tour_completed_${user.id}_${pathKey}`;
    const anyKey = `tour_completed_any_${pathKey}`;
    if (!localStorage.getItem(tourKey) && !localStorage.getItem(anyKey)) {
      // Small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        const recheckGlobal = localStorage.getItem('tour_opt_out_global') === 'true';
        const recheckUser = user?.id ? localStorage.getItem(`tour_opt_out_all_${user.id}`) === 'true' : false;
        if (!recheckGlobal && !recheckUser) {
          setRun(true);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user, pathKey]);

  useEffect(() => {
    if (!user) return;
    let newSteps: Step[] = [];

    if (pathKey === 'dashboard') {
      if (user.primaryRole === 'teacher') {
        newSteps = [
          {
            target: 'body',
            placement: 'center',
            content: 'أهلاً بك أستاذنا الفاضل في لوحة التحكم! هنا يمكنك إدارة أفواجك، حصصك الذكية، واختباراتك بسهولة واحترافية عالية مع الالتزام التام بالخطة السنوية.',
            title: 'مرحباً بك في منصة باقون 🚀',
          },
          {
            target: 'a[href="/teacher/curriculum"]',
            content: 'من هنا يمكنك الدخول إلى "بناء الحصص الذكية". اختر المادة، حدد الوحدة والدرس، وستقوم المنصة باستخدام الذكاء الاصطناعي بتوليد محتوى تفاعلي، شرائح، وتمارين جاهزة لطلابك في ثوانٍ!',
            title: 'بناء الحصص الذكية 🧠',
          },
          {
            target: 'a[href="/teacher/assessments"]',
            content: 'انقر هنا لتوليد اختبار أو واجب. يمكنك اختيار أسئلة من بنك الأسئلة أو ترك الذكاء الاصطناعي يقترح عليك أسئلة تناسب مستوى طلابك بناءً على الدروس التي تم إنجازها.',
            title: 'الاختبارات والتقييم المستمر 📝',
          },
          {
            target: 'a[href="/teacher/cohorts"]',
            content: 'في قسم "إدارة الأفواج"، يمكنك متابعة مجموعاتك الدراسية، أداء الطلاب، ونسبة تقدمهم في المنهاج، وتوليد تقارير شاملة عن كل طالب.',
            title: 'إدارة الطلاب والأفواج 👥',
          },
          {
            target: 'a[href="/teacher/distribution"]',
            content: 'التوزيع السنوي والشهري ونظام المرافقة التربوية الذكية: استعرض جدول تقدمك الأسبوعي وحصصك المنجزة مقارنة بالخطة الفلسطينية المعتمدة.',
            title: 'التوزيع الدراسي والمرافقة التربوية ⏱️',
          },
          {
            target: 'a[href="/teacher/textbooks"]',
            content: 'المكتبة والكتب المدرسية: وصول فوري لكافة كتب الوزارة والمقررات المعتمدة للفصلين الدراسيين بصيغة PDF.',
            title: 'المكتبة الرقمية 📚',
          }
        ];
      } else if (user.primaryRole === 'student') {
        newSteps = [
          {
            target: 'body',
            placement: 'center',
            content: 'أهلاً بك يا بطل في منصتك التعليمية! نحن هنا لدعمك في رحلتك نحو التفوق والنجاح خطوة بخطوة.',
            title: 'مرحباً بك في باقون 🎓',
          },
          {
            target: 'a[href="/student/schedule"]',
            content: 'هنا جدولك الأسبوعي وحصص البث المباشر. يمكنك معرفة مواعيد الدروس القادمة والانضمام مباشرة لحصتك الافتراضية مع الأستاذ بنقرة زر واحدة!',
            title: 'الجدول الأسبوعي والبث المباشر 🎥',
          },
          {
            target: 'a[href="/student/assessments"]',
            content: 'هنا ستجد الواجبات والاختبارات التي يرسلها أستاذك. عند الدخول، اقرأ الأسئلة بعناية، أجب عليها، ثم اضغط "تسليم". ستتلقى تصحيحاً وملاحظات فورية من أستاذك لتطوير مستواك!',
            title: 'الواجبات والاختبارات 📚',
          },
          {
            target: 'a[href="/student/textbooks"]',
            content: 'المكتبة المدرسية: تصفح وحمل جميع كتب المنهاج الفلسطيني المعتمدة للفصلين الأول والثاني وقراءتها في أي وقت.',
            title: 'الكتب والمقررات الدراسية 📖',
          },
          {
            target: 'a[href="/student/chat"]',
            content: 'غرفة المحادثة والتواصل: تواصل المباشر مع أساتذتك وزملائك في الفوج لمناقشة الدروس وطرح الأسئلة.',
            title: 'المحادثة والتواصل الفوري 💬',
          }
        ];
      } else if (user.primaryRole === 'admin' || user.primaryRole === 'super_admin') {
        newSteps = [
          {
            target: 'body',
            placement: 'center',
            content: 'أهلاً بك في غرفة القيادة والتحكم للمدير العام! من هنا تدير المنظومة التعليمية، الكوادر البشرية، والاعتمادات الرسمية بدقة متناهية.',
            title: 'لوحة إدارة المنصة والتحكم المركزي 👑'
          },
          {
            target: 'a[href="/admin/dashboard"]',
            content: 'إدارة الكوادر والمستخدمين: اعتماد حسابات الأساتذة والطلاب الجدد، مراجعة طلبات استعادة كلمة المرور المضيئة، وإنشاء الأفواج الدراسية.',
            title: 'إدارة الكوادر والمستخدمين 👥'
          },
          {
            target: 'a[href="/admin/reports"]',
            content: 'شاشة الإحصائيات والتقارير: بيانات محينة كل ساعة تضم نسب المسارات (حكومي/أزهري) والجنسيات مع نصائح توجيهية وإدارية فورية.',
            title: 'الإحصائيات والتقارير المحينة 📊'
          },
          {
            target: 'a[href="/admin/distribution"]',
            content: 'الإسناد الأكاديمي الموحد: توزيع المواد والأفواج للأساتذة والمشرفين ككتلة واحدة شاملة دون أي تجزئة للمقررات.',
            title: 'الإسناد الأكاديمي الشامل 📅'
          },
          {
            target: 'a[href="/admin/database"]',
            content: 'السجل الأكاديمي الرقمي: قاعدة بيانات تفاعلية كاملة لجميع المنتسبين مع إمكانيات البحث والتصفية والتصدير.',
            title: 'السجل الرقمي المركزي 🗄️'
          }
        ];
      } else if (user.primaryRole === 'supervisor' || user.primaryRole === 'subject_supervisor') {
        newSteps = [
          {
            target: 'body',
            placement: 'center',
            content: 'أهلاً بك مشرفنا وموجهنا التربوي الكريم! المنصة تضع بين يديك أدوات فائقة لمتابعة جودة التدريس ونظام المرافقة التربوية التلقائي.',
            title: 'لوحة الإشراف والتوجيه التربوي 🛡️'
          },
          {
            target: 'a[href="/supervisor/dashboard"]',
            content: 'مراقبة الفصول الافتراضية الحية: انضم لأي حصة تجري الآن للمراقبة البيداغوجية، مع إمكانية إرسال تنبيه مباشر للأستاذ (Nudge).',
            title: 'المراقبة الميدانية للحصص 🎥'
          },
          {
            target: 'a[href="/supervisor/reports"]',
            content: 'تقارير المؤشرات والنسب: نسب حضور الطلاب، التزام الكوادر بالجدول، والتقارير المحينة دورياً كل ساعة مع توصيات بيداغوجية.',
            title: 'التقارير والمؤشرات البيداغوجية 📈'
          },
          {
            target: 'a[href="/supervisor/distribution"]',
            content: 'نظام المرافقة التربوية ومتابعة وتيرة الإنجاز: مقارنة فورية بين المنجز الفعلي والتوزيع السنوي والشهري المعتمد، ومرافقة الأستاذ لضمان سير الخطة.',
            title: 'متابعة الخطة السنوية والمرافقة التربوية ⏱️'
          },
          {
            target: 'a[href="/supervisor/schedule"]',
            content: 'الجدول الأسبوعي الموحد: معاينة مواعيد جميع الحصص المباشرة للأساتذة تحت إشرافك والمتابعة الفورية.',
            title: 'الجدول الأسبوعي العام 🗓️'
          }
        ];
      }
    } 
    else if (pathKey === 'curriculum') {
      newSteps = [
        {
          target: 'body',
          placement: 'center',
          content: 'أهلاً بك في قسم المناهج وبناء الحصص. هذه الأداة مصممة لتوفير وقتك وجهدك في التحضير!',
          title: 'توليد حصة تفاعلية ⚡'
        },
        {
          target: '.curriculum-tree', // assuming this class exists or will exist, gracefully falls back to center if not found
          content: 'أولاً: تصفح شجرة المنهج، افتح الوحدة ثم اختر الدرس الذي ترغب في تحضيره.',
          title: 'اختيار الدرس 📖'
        },
        {
          target: 'button:has(svg.lucide-bot)',
          content: 'ثانياً: انقر على زر "توليد حصة بالذكاء الاصطناعي". ستقوم المنصة بقراءة أهداف الدرس من كتاب الوزارة وتلخيصه لك وإعداد شرائح جاهزة لعرضها للطلاب!',
          title: 'الذكاء الاصطناعي بالخدمة 🤖'
        }
      ];
    }
    else if (pathKey === 'assessments') {
      if (user.primaryRole === 'teacher') {
        newSteps = [
          {
            target: 'body',
            placement: 'center',
            content: 'هنا يمكنك بناء الواجبات والاختبارات بسرعة فائقة. يمكنك بناء تقييم موضوعي (اختيار من متعدد) أو مقالي.',
            title: 'إدارة التقييمات 📝'
          },
          {
            target: 'button:has(svg.lucide-plus)',
            content: 'اضغط هنا لإنشاء اختبار جديد. اختر الفوج، ثم حدد الدروس، واسمح للذكاء الاصطناعي بتوليد أسئلة تناسب مستوى طلابك بدقة، أو اختر الأسئلة بنفسك من البنك.',
            title: 'إنشاء اختبار ذكي 🎯'
          }
        ];
      } else if (user.primaryRole === 'student') {
        newSteps = [
          {
            target: 'body',
            placement: 'center',
            content: 'هنا قائمة بجميع المهام المطلوبة منك. ركز على التواريخ لتسليم واجباتك في الوقت المحدد!',
            title: 'قائمة الواجبات 📋'
          }
        ];
      }
    }

    setSteps(newSteps);
  }, [user, pathKey]);

  // Listen for custom event to trigger or close tour programmatically
  useEffect(() => {
    const handleStartTour = () => {
      restartTour();
    };
    const handleCloseTour = () => {
      setRun(false);
    };
    window.addEventListener('baaqoon:start_tour', handleStartTour);
    window.addEventListener('baaqoon:close_tour', handleCloseTour);
    return () => {
      window.removeEventListener('baaqoon:start_tour', handleStartTour);
      window.removeEventListener('baaqoon:close_tour', handleCloseTour);
    };
  }, [user, pathKey]);

  const handleJoyrideCallback = (data: any) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status) || action === 'close' || action === 'skip' || action === 'stop') {
      setRun(false);
      
      try {
        if (user?.id) {
          localStorage.setItem(`tour_completed_${user.id}_${pathKey}`, 'true');
        }
        localStorage.setItem(`tour_completed_any_${pathKey}`, 'true');

        if (dontShowAgainRef.current) {
          if (user?.id) {
            localStorage.setItem(`tour_opt_out_all_${user.id}`, 'true');
          }
          localStorage.setItem('tour_opt_out_global', 'true');
        }
      } catch (_) {}
    }
  };

  const restartTour = () => {
    if (steps.length === 0) {
      return;
    }
    try {
      if (user?.id) {
        localStorage.removeItem(`tour_completed_${user.id}_${pathKey}`);
        localStorage.removeItem(`tour_opt_out_all_${user.id}`);
      }
      localStorage.removeItem('tour_opt_out_global');
      localStorage.removeItem(`tour_completed_any_${pathKey}`);
    } catch (_) {}
    setDontShowAgain(false);
    dontShowAgainRef.current = false;
    setRun(true);
  };

  // Custom Tooltip Component for stable rendering and instant responsiveness
  const CustomTooltip = React.useCallback(
    ({
      index,
      step,
      backProps,
      closeProps,
      primaryProps,
      tooltipProps,
      isLastStep,
    }: TooltipRenderProps) => {
      const handleDisablePermanently = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (user?.id) {
            localStorage.setItem(`tour_opt_out_all_${user.id}`, 'true');
            localStorage.setItem(`tour_completed_${user.id}_${pathKey}`, 'true');
          }
          localStorage.setItem('tour_opt_out_global', 'true');
          localStorage.setItem(`tour_completed_any_${pathKey}`, 'true');
        } catch (_) {}

        setDontShowAgain(true);
        dontShowAgainRef.current = true;
        setRun(false);

        if (closeProps?.onClick) {
          try {
            closeProps.onClick(e);
          } catch (_) {}
        }
        window.dispatchEvent(new CustomEvent('baaqoon:close_tour'));
      };

      const handleCloseCurrentTour = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          if (user?.id) {
            localStorage.setItem(`tour_completed_${user.id}_${pathKey}`, 'true');
          }
          localStorage.setItem(`tour_completed_any_${pathKey}`, 'true');
        } catch (_) {}

        setRun(false);
        if (closeProps?.onClick) {
          try {
            closeProps.onClick(e);
          } catch (_) {}
        }
      };

      return (
        <div 
          {...tooltipProps} 
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[360px] max-w-[92vw] overflow-hidden border border-slate-200 dark:border-slate-800 animate-fade-in font-sans" 
          dir="rtl"
        >
          {/* Header */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center text-xs sm:text-sm font-bold shrink-0">
                {index + 1}
              </div>
              <span className="truncate">{step.title}</span>
            </h3>
            <button 
              type="button"
              onClick={handleCloseCurrentTour}
              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="إغلاق الدليل"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 text-slate-600 dark:text-slate-300 text-sm font-bold leading-relaxed">
            {step.content}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            
            {/* Direct 1-Click Permanent Opt-Out Button */}
            <button
              type="button"
              onClick={handleDisablePermanently}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/60 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
              title="إغلاق هذا الدليل فوراً ومنعه من الظهور التلقائي في أي شاشة"
            >
              <span className="text-sm">🚫</span>
              <span>تعطيل وعدم ظهور الدليل مرة أخرى في أي صفحة</span>
            </button>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-1">
              <div>
                {index > 0 ? (
                  <button 
                    type="button"
                    {...backProps} 
                    className="text-slate-600 dark:text-slate-400 font-bold text-sm px-3 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" /> السابق
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={handleCloseCurrentTour}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-xs px-2 py-1.5 transition-colors cursor-pointer"
                  >
                    تخطي هذه الصفحة
                  </button>
                )}
              </div>
              <button 
                type="button"
                {...primaryProps} 
                onClick={(e) => {
                  if (isLastStep) {
                    try {
                      if (user?.id) {
                        localStorage.setItem(`tour_completed_${user.id}_${pathKey}`, 'true');
                      }
                      localStorage.setItem(`tour_completed_any_${pathKey}`, 'true');
                    } catch (_) {}
                    setRun(false);
                  }
                  if (primaryProps?.onClick) {
                    primaryProps.onClick(e);
                  }
                }}
                className="bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-black text-sm px-5 py-2 rounded-xl transition-all shadow-md shadow-violet-500/20 flex items-center gap-1 cursor-pointer"
              >
                {isLastStep ? 'إنهاء الدليل' : 'التالي'} {!isLastStep && <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      );
    },
    [user?.id, pathKey]
  );

  if (!user) return null;

  return (
    <>
      {steps.length > 0 && (
        <Joyride
          steps={steps}
          run={run}
          continuous={true}
          tooltipComponent={CustomTooltip}
          onEvent={handleJoyrideCallback}
          options={{
            overlayClickAction: 'close',
            showProgress: false,
          }}
        />
      )}
      
      {/* Floating help buttons: Comprehensive Guide + Interactive Page Tour */}
      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('baaqoon:open_guide'))}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white px-4 py-3 rounded-full shadow-xl shadow-indigo-500/25 hover:-translate-y-0.5 transition-all flex items-center gap-2 font-black text-xs sm:text-sm border border-indigo-400/30 group"
          title="دليل استخدام المنصة وشرح الأزرار خطوة بخطوة"
        >
          <HelpCircle className="w-5 h-5 text-indigo-100 group-hover:rotate-12 transition-transform shrink-0" />
          <span className="hidden sm:inline">دليل الاستخدام والأزرار</span>
          <span className="sm:hidden">الدليل</span>
        </button>

        <button 
          onClick={restartTour}
          className="bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 p-3 rounded-full shadow-lg shadow-black/10 hover:-translate-y-0.5 transition-all border border-slate-200 dark:border-slate-700 font-bold flex items-center gap-1.5 text-xs"
          title="تشغيل الجولة الإرشادية التفاعلية للشاشة الحالية"
        >
          <Play className="w-4 h-4 fill-emerald-600 text-emerald-600 dark:fill-emerald-400 dark:text-emerald-400" />
          <span className="hidden md:inline font-bold">جولة الشاشة</span>
        </button>
      </div>
    </>
  );
}
