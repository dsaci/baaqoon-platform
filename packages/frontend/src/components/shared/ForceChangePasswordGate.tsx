import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertTriangle, LogOut, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface ForceChangePasswordGateProps {
  onPasswordChanged?: () => void;
}

export default function ForceChangePasswordGate({ onPasswordChanged }: ForceChangePasswordGateProps) {
  const { user, initialize, logout } = useAuthStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password validation rules
  const isLengthValid = newPassword.length >= 8;
  const hasNumber = /\d/.test(newPassword);
  const isNotDefault = newPassword.trim() !== 'Baaqoon2024!';
  const isMatching = newPassword === confirmPassword && newPassword.length > 0;
  const isFormValid = isLengthValid && hasNumber && isNotDefault && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLengthValid) {
      setError('كلمة المرور الجديدة يجب أن تتكون من 8 خانات على الأقل.');
      return;
    }

    if (!hasNumber) {
      setError('كلمة المرور الجديدة يجب أن تحتوي على رقم واحد على الأقل.');
      return;
    }

    if (!isNotDefault) {
      setError('لا يمكن استخدام كلمة المرور الأولية المؤقتة (Baaqoon2024!). يرجى اختيار كلمة مرور جديدة خاصة بك.');
      return;
    }

    if (!isMatching) {
      setError('كلمتا المرور غير متطابقتين. يرجى التأكد من كتابتها بشكل صحيح.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/users/me/change-password', {
        currentPassword: currentPassword.trim() || undefined,
        newPassword: newPassword.trim(),
      });

      setSuccess(true);

      // Refresh store with updated user
      if (user) {
        initialize({
          ...user,
          mustChangePassword: false,
        });
      }

      setTimeout(() => {
        if (onPasswordChanged) {
          onPasswordChanged();
        }
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        'حدث خطأ أثناء تغيير كلمة المرور. يرجى التأكد من صحة البيانات والمحاولة مجدداً.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-4 text-right animate-fade-in select-none font-sans"
      dir="rtl"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-amber-500/30 dark:border-amber-500/20 overflow-hidden flex flex-col my-auto">
        {/* Top Flag / Accent Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600" />

        {/* Header Section */}
        <div className="p-6 pb-4 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent text-center border-b border-slate-100 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-amber-500/25 mb-4 ring-8 ring-amber-500/10 animate-bounce-subtle">
            <KeyRound className="w-8 h-8" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            خطوة أمنية إجبارية للمتابعة
          </span>

          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
            تأمين حسابك: تعيين كلمة مرور جديدة
          </h2>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed mt-2 max-w-sm mx-auto">
            أهلاً بك <span className="text-amber-600 dark:text-amber-400 font-black">{user?.firstName} {user?.lastName}</span> في منصة باقون التعليمية. نظراً لدخولك بكلمة المرور الأولية المؤقتة، ولحماية خصوصيتك وسرية حسابك، <strong className="text-rose-600 dark:text-rose-400">يلزم تعيين كلمة مرور جديدة خاصة بك لمواصلة استخدام المنصة</strong>.
          </p>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-2xl text-xs font-black border border-rose-200 dark:border-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-spin" />
              <span>تم تحديث وتأمين كلمة المرور بنجاح! جاري نقلك إلى لوحة التحكم فوراً...</span>
            </div>
          )}

          {/* Field 1: Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                كلمة المرور الأولية الحالية
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                (المؤقتة: Baaqoon2024!)
              </span>
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                dir="ltr"
                className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 2: New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                كلمة المرور الجديدة الخاصة بك
              </span>
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
                * إجباري
              </span>
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة مرور قوية (8 أحرف وأرقام على الأقل)"
                dir="ltr"
                required
                className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Field 3: Confirm New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                تأكيد كلمة المرور الجديدة
              </span>
              {confirmPassword && (
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isMatching
                    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800'
                    : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isMatching ? '✓ متطابقة' : '✗ غير متطابقة'}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة للتأكيد"
                dir="ltr"
                required
                className="w-full px-4 py-2.5 pl-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Validation Checklist */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-[11px] font-bold">
            <div className="flex items-center gap-2">
              <span className={isLengthValid ? 'text-emerald-600' : 'text-slate-400'}>
                {isLengthValid ? '✓' : '○'}
              </span>
              <span className={isLengthValid ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}>
                8 خانات أو حروف على الأقل
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={hasNumber ? 'text-emerald-600' : 'text-slate-400'}>
                {hasNumber ? '✓' : '○'}
              </span>
              <span className={hasNumber ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}>
                تحتوي على أرقام
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={isNotDefault ? 'text-emerald-600' : 'text-slate-400'}>
                {isNotDefault ? '✓' : '○'}
              </span>
              <span className={isNotDefault ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}>
                تختلف عن كلمة المرور المؤقتة
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || !isFormValid || success}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري حفظ كلمة المرور وتأمين الحساب...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  حفظ كلمة المرور الجديدة وتفعيل المنصة فوراً ✓
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              تسجيل الخروج والعودة لاحقاً
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
