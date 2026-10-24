import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  BookOpen, 
  ShieldAlert, 
  HelpCircle, 
  ArrowRight, 
  Compass, 
  Play, 
  Clock,
  GraduationCap,
  UserCheck,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocation } from 'react-router-dom';
import VisualGuidesViewer, { type GuideRole } from './VisualGuidesViewer';

interface FirstTimeOnboardingGuideModalProps {
  onStartLiveTour?: () => void;
}

export default function FirstTimeOnboardingGuideModal({ onStartLiveTour }: FirstTimeOnboardingGuideModalProps) {
  const { user } = useAuthStore();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);

  // Determine user role
  const getUserGuideRole = (): GuideRole => {
    if (!user) return 'student';
    if (user.primaryRole === 'teacher') return 'teacher';
    if (user.primaryRole === 'subject_supervisor' || user.primaryRole === 'supervisor') return 'supervisor';
    return 'student';
  };

  useEffect(() => {
    if (!user?.id) return;

    const permanentKey = `baaqoon_onboarding_guide_dismissed_${user.id}`;
    const sessionKey = `baaqoon_onboarding_session_postponed_${user.id}`;

    const isPermanentlyDismissed = localStorage.getItem(permanentKey) === 'true';
    const isSessionPostponed = sessionStorage.getItem(sessionKey) === 'true';
    const isJustRegistered = Boolean(location.state?.justRegistered);

    // If just registered or never permanently acknowledged (and not postponed in this tab session), show modal
    if (isJustRegistered || (!isPermanentlyDismissed && !isSessionPostponed)) {
      setIsOpen(true);
    }
  }, [user?.id, location.state]);

  if (!isOpen || !user) return null;

  const role = getUserGuideRole();

  const handlePermanentComplete = () => {
    if (user?.id) {
      localStorage.setItem(`baaqoon_onboarding_guide_dismissed_${user.id}`, 'true');
    }
    setIsOpen(false);
  };

  const handlePostponeSession = () => {
    if (user?.id) {
      sessionStorage.setItem(`baaqoon_onboarding_session_postponed_${user.id}`, 'true');
    }
    setIsOpen(false);
  };

  return (
    <div 
      className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fade-in text-right"
      dir="rtl"
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        
        {/* Top Accent Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-[#c9b48a] to-indigo-600 shrink-0" />

        {/* Modal Header */}
        <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1F2A18] to-[#394C2A] text-[#c9b48a] border border-[#c9b48a]/30 flex items-center justify-center shadow-md shrink-0">
              {role === 'student' ? (
                <GraduationCap className="w-6 h-6 text-[#c9b48a]" />
              ) : role === 'teacher' ? (
                <UserCheck className="w-6 h-6 text-[#c9b48a]" />
              ) : (
                <Shield className="w-6 h-6 text-[#c9b48a]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40">
                  <Sparkles className="w-3 h-3 inline ml-1" />
                  دليل الاستخدام الإرشادي الإلزامي
                </span>
                <span className="text-xs font-bold text-slate-400">
                  عرض تعريفي أولي
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                أهلاً بك يا {user.firstName}! استكشف دليلك البصري لاستخدام منصة باقون
              </h2>
            </div>
          </div>

          <button
            onClick={handlePostponeSession}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer self-end sm:self-center"
            title="إغلاق وتذكيري لاحقاً"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 px-5 sm:px-7 py-3 flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>خطوة هامة:</strong> حرصاً على إتقانك لكافة وظائف المنصة والأزرار اليومية، يرجى تصفح الدليل البصري أدناه. يمكنك دائماً العودة إليه عبر الزر البنفسجي العائم أسفل الشاشة.
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          <VisualGuidesViewer 
            initialRole={role} 
            onNavigateToTour={() => {
              setIsOpen(false);
              if (onStartLiveTour) onStartLiveTour();
            }}
          />
        </div>

        {/* Modal Sticky Footer with Strict Acknowledgment */}
        <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={hasAcknowledged}
              onChange={(e) => setHasAcknowledged(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <span>أقر بأنني اطلعت واستوعبت دليل استخدام المنصة وكيفية عمل الأزرار</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePostponeSession}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              تذكيري لاحقاً
            </button>

            <button
              type="button"
              disabled={!hasAcknowledged}
              onClick={handlePermanentComplete}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1F2A18] via-[#394C2A] to-[#24331b] hover:from-[#141b10] hover:to-[#1c2715] text-[#fbf8f2] border border-[#c9b48a]/40 text-xs font-black shadow-lg shadow-black/10 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>تأكيد الاستيعاب وإنهاء الدليل (عدم الإظهار مجدداً)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
