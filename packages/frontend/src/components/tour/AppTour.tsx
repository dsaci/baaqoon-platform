import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuthStore } from '../../store/useAuthStore';
import { HelpCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const JoyrideComponent = Joyride as any;

export default function AppTour() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [run, setRun] = useState(false);
  
  const currentPath = location.pathname;

  // Check if tour was already completed for THIS specific page
  useEffect(() => {
    if (user) {
      // Create a unique key for user + path. For dynamic routes, we can just use the base path
      const pathKey = currentPath.split('/')[2] || 'dashboard'; 
      const tourKey = `tour_completed_${user.id}_${pathKey}`;
      
      const tourCompleted = localStorage.getItem(tourKey);
      
      if (!tourCompleted) {
        // slight delay to ensure UI is rendered
        const timer = setTimeout(() => setRun(true), 800);
        return () => clearTimeout(timer);
      } else {
        setRun(false); // Stop if it was running on previous page
      }
    }
  }, [user, currentPath]);

  if (!user) return null;

  let steps: any[] = [];
  const pathKey = currentPath.split('/')[2] || 'dashboard';

  const commonStyles = {
    options: {
      primaryColor: '#8b5cf6',
      zIndex: 10000,
      fontFamily: 'Tajawal, sans-serif'
    },
    tooltipTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#1e293b'
    },
    tooltipContent: {
      fontSize: '14px',
      color: '#475569',
      padding: '10px 0'
    },
    buttonNext: {
      backgroundColor: '#8b5cf6',
      fontWeight: 'bold',
      borderRadius: '8px'
    },
    buttonBack: {
      marginRight: '10px',
      color: '#64748b'
    },
    buttonSkip: {
      color: '#ef4444',
      fontWeight: 'bold'
    }
  };

  // ----------------------------------------------------
  // ROUTE-SPECIFIC STEPS
  // ----------------------------------------------------
  
  if (pathKey === 'dashboard') {
    if (user.primaryRole === 'teacher') {
      steps = [
        {
          target: 'body',
          placement: 'center',
          content: 'أهلاً بك في منصة باقون! هنا لوحة التحكم الرئيسية الخاصة بك حيث تتابع إنجازاتك اليومية.',
          title: 'مرحباً بك أستاذنا القدير'
        },
        {
          target: 'a[href="/teacher/dashboard"]',
          content: 'هذا هو زر اللوحة الرئيسية، يعيدك دائماً إلى هنا.',
          title: 'اللوحة الرئيسية',
        },
        {
          target: 'a[href="/teacher/cohorts"]',
          content: 'من هنا يمكنك إدارة الأفواج وإضافة الطلاب ومتابعة تقدمهم.',
          title: 'إدارة الأفواج',
        },
        {
          target: 'a[href="/teacher/schedule"]',
          content: 'بناء وتخطيط الحصص المباشرة يتم من خلال هذه النافذة.',
          title: 'بناء الحصص الذكية',
        }
      ];
    } else if (user.primaryRole === 'student') {
      steps = [
        {
          target: 'body',
          placement: 'center',
          content: 'مرحباً بك يا بطل! هذه شاشتك الرئيسية لمتابعة دروسك وواجباتك.',
          title: 'أهلاً بك في باقون'
        }
      ];
    } else if (user.primaryRole === 'admin' || user.primaryRole === 'super_admin') {
      steps = [
        {
          target: 'body',
          placement: 'center',
          content: 'مرحباً بك في لوحة تحكم الإدارة العليا. من هنا تسيطر على كل المنصة.',
          title: 'إدارة باقون'
        }
      ];
    } else if (user.primaryRole === 'supervisor' || user.primaryRole === 'subject_supervisor') {
      steps = [
        {
          target: 'body',
          placement: 'center',
          content: 'مرحباً بك في منصة باقون. بصفتك مشرفاً، ستقوم هنا بمتابعة الجودة.',
          title: 'لوحة المشرف'
        }
      ];
    }
  } 
  else if (pathKey === 'cohorts') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'في هذه الصفحة تظهر جميع الأفواج الدراسية المسندة إليك.',
        title: 'إدارة الأفواج'
      },
      {
        target: 'button:has(svg.lucide-plus)',
        content: 'يمكنك من هنا تقديم طلب للإدارة العليا لفتح فوج جديد إذا دعت الحاجة.',
        title: 'طلب فتح فوج'
      }
    ];
  }
  else if (pathKey === 'schedule') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'هذه الصفحة مخصصة لبناء الحصص المباشرة وجدولتها.',
        title: 'بناء الحصص'
      },
      {
        target: 'button:has(svg.lucide-calendar)',
        content: 'اضغط هنا لفتح المولد الذكي الذي يقرأ المنهاج ويساعدك في جدولة الدرس.',
        title: 'المولد الذكي'
      }
    ];
  }
  else if (pathKey === 'chat') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'هنا يمكنك التواصل بشكل مباشر مع طلابك وأفواجك.',
        title: 'نظام المحادثات'
      },
      {
        target: 'input[placeholder="ابحث في المحادثات..."]',
        content: 'استخدم شريط البحث للوصول السريع إلى محادثة معينة.',
        title: 'البحث السريع'
      }
    ];
  }
  else if (pathKey === 'timetable') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'جدولك الأسبوعي يعرض جميع الحصص المباشرة المنظمة حسب الأيام والساعات.',
        title: 'الجدول الأسبوعي'
      }
    ];
  }
  else if (pathKey === 'assessments') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'هنا يمكنك تصميم اختبارات ذكية ومتابعة درجات الطلاب.',
        title: 'التقييمات والاختبارات'
      },
      {
        target: 'button:has(svg.lucide-plus)',
        content: 'استخدم هذا الزر لبناء اختبار جديد باستخدام الذكاء الاصطناعي أو بنك الأسئلة.',
        title: 'توليد اختبار'
      }
    ];
  }

  // If there are no specific steps for this page, don't run the tour
  if (steps.length === 0) {
    return null;
  }

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      const tourKey = `tour_completed_${user.id}_${pathKey}`;
      localStorage.setItem(tourKey, 'true');
    }
  };

  const restartTour = () => {
    const tourKey = `tour_completed_${user.id}_${pathKey}`;
    localStorage.removeItem(tourKey);
    setRun(true);
  };

  return (
    <>
      <JoyrideComponent
        steps={steps}
        run={run}
        continuous={true}
        showSkipButton={true}
        disableOverlayClose={true}
        locale={{
          back: 'السابق',
          close: 'إغلاق',
          last: 'إنهاء الدليل',
          next: 'التالي',
          skip: 'تخطي'
        }}
        styles={commonStyles}
        callback={handleJoyrideCallback}
        floaterProps={{
          disableAnimation: true
        }}
      />
      
      {/* Floating help button to restart tour for current page */}
      <button 
        onClick={restartTour}
        className="fixed bottom-6 left-6 z-50 bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 p-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-violet-100 dark:border-slate-700 group flex items-center gap-2"
        title="دليل استخدام الصفحة"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-300">
          دليل الاستخدام
        </span>
      </button>
    </>
  );
}
