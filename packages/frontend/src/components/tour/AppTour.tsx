import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useAuthStore } from '../../store/useAuthStore';
import { HelpCircle } from 'lucide-react';

const JoyrideComponent = Joyride as any;

export default function AppTour() {
  const { user } = useAuthStore();
  const [run, setRun] = useState(false);
  
  // Check if tour was already completed
  useEffect(() => {
    if (user) {
      const tourCompleted = localStorage.getItem(`tour_completed_${user.id}`);
      if (!tourCompleted) {
        // slight delay to ensure UI is rendered
        const timer = setTimeout(() => setRun(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  if (!user) return null;

  let steps: any[] = [];

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

  if (user.primaryRole === 'teacher') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'أهلاً بك في منصة باقون! دعنا نأخذك في جولة سريعة للتعرف على أدواتك كأستاذ.',
        title: 'مرحباً بك أستاذنا الفاضل 👨‍🏫'
      },
      {
        target: 'a[href="/teacher/dashboard"]',
        content: 'هذه هي لوحة القيادة الرئيسية حيث تجد ملخصاً سريعاً لحصصك وتقدمك في المنهاج.',
        title: 'لوحة القيادة',
      },
      {
        target: 'a[href="/teacher/cohorts"]',
        content: 'من هنا يمكنك متابعة أفواجك الطلابية المخصصة لك ومعرفة طلابك.',
        title: 'إدارة الأفواج',
      },
      {
        target: 'a[href="/teacher/schedule"]',
        content: 'هنا يمكنك بناء حصصك المباشرة وبدء البث المباشر مع الطلاب بنقرة واحدة.',
        title: 'جدول الحصص والبث المباشر',
      },
      {
        target: 'a[href="/teacher/assessments"]',
        content: 'قم بتوليد امتحانات ذكية وتصحيحها وإدارتها من هذا القسم.',
        title: 'التقييمات الذكية',
      },
      {
        target: 'a[href="/teacher/textbooks"]',
        content: 'تصفح الكتب المدرسية والمناهج المعتمدة بصيغة رقمية.',
        title: 'المكتبة الرقمية',
      },
      {
        target: 'a[href="/teacher/chat"]',
        content: 'تواصل مع طلابك وزملائك بسهولة عبر نظام المحادثات الفورية.',
        title: 'المحادثات',
      }
    ];
  } else if (user.primaryRole === 'student') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'أهلاً بك يا بطل في منصة باقون! جولة سريعة لمعرفة أدواتك.',
        title: 'مرحباً بك 🎓'
      },
      {
        target: 'a[href="/student/dashboard"]',
        content: 'لوحتك الرئيسية لمعرفة حصصك القادمة ومتابعة تقدمك.',
        title: 'الرئيسية',
      },
      {
        target: 'a[href="/student/schedule"]',
        content: 'من هنا يمكنك الدخول إلى الحصص المباشرة وقت انعقادها.',
        title: 'الحصص المباشرة',
      },
      {
        target: 'a[href="/student/assessments"]',
        content: 'تجد هنا الامتحانات والواجبات المطلوبة منك.',
        title: 'الامتحانات',
      }
    ];
  } else if (user.primaryRole === 'admin' || user.primaryRole === 'super_admin') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'أهلاً بك في لوحة الإدارة العامة لمنصة باقون.',
        title: 'الإدارة 👑'
      },
      {
        target: 'a[href="/admin/dashboard"]',
        content: 'من هنا تقوم بـ "التفويج" (إنشاء الأفواج) وإسناد الأساتذة لكل فوج.',
        title: 'التفويج والإسناد',
      },
      {
        target: 'a[href="/admin/database"]',
        content: 'لإدارة كافة مستخدمي المنصة (أساتذة، طلاب، مشرفين).',
        title: 'قاعدة البيانات',
      }
    ];
  } else if (user.primaryRole === 'supervisor' || user.primaryRole === 'subject_supervisor') {
    steps = [
      {
        target: 'body',
        placement: 'center',
        content: 'أهلاً بك مشرفنا التربوي. لنتعرف على أدوات المتابعة.',
        title: 'الإشراف التربوي 📋'
      },
      {
        target: 'a[href="/supervisor/dashboard"]',
        content: 'نظرة عامة على أداء الأساتذة والمناهج ضمن تخصصك.',
        title: 'لوحة المشرف',
      },
      {
        target: 'a[href="/supervisor/teachers"]',
        content: 'متابعة الأساتذة الذين يدرسون المادة التي تشرف عليها.',
        title: 'متابعة الأساتذة',
      }
    ];
  }

  const handleJoyrideCallback = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`tour_completed_${user.id}`, 'true');
    }
  };

  const restartTour = () => {
    localStorage.removeItem(`tour_completed_${user.id}`);
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
          last: 'إنهاء الجولة',
          next: 'التالي',
          skip: 'تخطي'
        }}
        styles={commonStyles}
        callback={handleJoyrideCallback}
        floaterProps={{
          disableAnimation: true
        }}
      />
      
      {/* Floating help button to restart tour */}
      <button 
        onClick={restartTour}
        className="fixed bottom-6 left-6 z-50 bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 p-3 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all border border-violet-100 dark:border-slate-700 group flex items-center gap-2"
        title="دليل استخدام المنصة"
      >
        <HelpCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-300">
          دليل الاستخدام
        </span>
      </button>
    </>
  );
}
