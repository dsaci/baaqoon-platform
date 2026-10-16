import React, { useState, useEffect } from 'react';
import { ShieldAlert, BookOpen, CheckCircle2, Loader2, LogOut, Sparkles, HelpCircle } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';

interface MandatorySubjectGateProps {
  onSubjectAssigned?: () => void;
}

export default function MandatorySubjectGate({ onSubjectAssigned }: MandatorySubjectGateProps) {
  const { user, initialize, logout } = useAuthStore();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(user?.supervisedSubjectId || '');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.get('/curriculum/subjects')
      .then((res) => {
        if (isMounted && res.data) {
          setSubjects(res.data);
        }
      })
      .catch(() => {
        if (isMounted) setError('تعذر تحميل قائمة المواد الدراسية، يرجى التحقق من الاتصال بالإنترنت.');
      })
      .finally(() => {
        if (isMounted) setIsLoadingSubjects(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedSubjectId || !selectedSubjectId.trim()) {
      setError('يرجى اختيار مادة التدريس من القائمة المنسدلة لمواصلة استخدام المنصة.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Update subject in user profile
      await api.patch('/users/me/profile', {
        supervisedSubjectId: selectedSubjectId.trim()
      });

      // 2. Fetch fresh user data and sync with local store
      const meRes = await api.get('/auth/me');
      if (meRes?.data) {
        initialize(meRes.data);
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSubjectAssigned) onSubjectAssigned();
      }, 800);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء حفظ مادة التدريس، يرجى المحاولة ثانية.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const teacherName = user ? `${user.firstName} ${user.lastName}` : 'أستاذنا الفاضل';

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 select-none"
    >
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border-2 border-rose-500/30 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Glow Header */}
        <div className="p-8 bg-gradient-to-br from-rose-600 via-rose-700 to-indigo-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-rose-100 text-xs font-black">
              <ShieldAlert className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>إجراء أمني وإداري ملزم (تعليق مؤقت للاستخدام)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              تحديد مادة التدريس إجباري لمواصلة استخدام المنصة
            </h1>

            <p className="text-rose-100 text-sm leading-relaxed">
              أهلاً بك يا أستاذ(ة) <span className="font-black text-white underline decoration-amber-400 underline-offset-4">{teacherName}</span>. 
              وفقاً للنظام الأكاديمي لمنصة باقون، لا يمكن الدخول إلى الحصص أو الأفواج أو استخدام أي من أدوات المنصة دون تحديد مادة تدريسك الرسمية.
            </p>
          </div>
        </div>

        {/* Informative Checklist */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-right space-y-1">
              <span className="text-xs font-black text-rose-900 dark:text-rose-200 block">1. التفويج المباشر</span>
              <p className="text-[11px] text-rose-700 dark:text-rose-400 font-bold leading-normal">
                ربط حسابك آلياً بالأفواج والطلبة المسجلين في مادتك.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-right space-y-1">
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 block">2. إسناد الحصص</span>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-400 font-bold leading-normal">
                تمكينك من جدولة الحصص وبناء الدروس التفاعلية.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-right space-y-1">
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 block">3. بنك الاختبارات</span>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold leading-normal">
                توليد الامتحانات والواجبات المنهجية الخاصة بك.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 rounded-2xl text-xs font-black text-rose-800 dark:text-rose-200 flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xs font-black text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>تم تثبيت مادة التدريس بنجاح! جاري فتح المنصة...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-800 dark:text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span>اختر مادة التدريس الرسمية الخاصة بك:</span>
                </span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-black">* حقل إجباري قطعي</span>
              </label>

              {isLoadingSubjects ? (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  <span>جاري تحميل المواد المعتمدة...</span>
                </div>
              ) : (
                <div className="relative">
                  <select
                    required
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-black focus:outline-none focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
                  >
                    <option value="">-- اضغط هنا لاختيار مادة تدريسك الرسمية --</option>
                    {subjects.map((sub: any) => (
                      <option key={sub.id} value={sub.id} className="py-1">
                        {sub.nameAr} ({sub.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                ⚠️ تنبيه: سيتم اعتماد هذه المادة لتفويجك وإدراجك في كادر الإسناد الأكاديمي، ولن تتمكن من تعديلها إلا عبر إدارة المنصة.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>تسجيل الخروج والعودة لاحقاً</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !selectedSubjectId || isLoadingSubjects}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-sm font-black shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التثبيت والتفعيل...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-yellow-300" />
                    <span>تثبيت مادة التدريس وتفعيل المنصة فوراً ✓</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
