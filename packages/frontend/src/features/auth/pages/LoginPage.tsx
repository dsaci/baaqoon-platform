import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, LogIn, Loader2, AlertCircle, FlaskConical, Home } from 'lucide-react';
import logo from '../../../assets/logo.jpg';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import LangToggle from '../../../components/shared/LangToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // ── Demo login (real backend) ───────────────────────────────────────
  const handleDemoLogin = async (role: 'teacher' | 'student' | 'super_admin' | 'supervisor') => {
    setIsLoading(true);
    setError(null);
    const emails: Record<string, string> = {
      super_admin: 'admin@baaqoon.ps',
      supervisor: 'supervisor@baaqoon.ps',
      teacher: 'demo@baaqoon.ps',
      student: 'student1@baaqoon.ps',
    };
    try {
      const response = await api.post('/auth/login', { email: emails[role], password: 'Baaqoon2024!' });
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
      if (user.primaryRole === 'student') navigate('/student/dashboard');
      else if (user.primaryRole === 'teacher') navigate('/teacher/dashboard');
      else if (user.primaryRole === 'subject_supervisor' || user.primaryRole === 'supervisor') navigate('/supervisor/dashboard');
      else navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'فشل الدخول التجريبي. تأكد من تشغيل الخادم.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
      if (user.primaryRole === 'student') navigate('/student/dashboard');
      else if (user.primaryRole === 'teacher') navigate('/teacher/dashboard');
      else if (user.primaryRole === 'subject_supervisor' || user.primaryRole === 'supervisor') navigate('/supervisor/dashboard');
      else navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  const { t } = useTranslation();

  // ... inside component handleDemoLogin and handleLogin ...

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Top Flag Strip */}
      <div className="flag-strip w-full fixed top-0 left-0 right-0 z-50 shadow-md" />
      
      {/* Theme and Lang controls at the top */}
      <div className="absolute top-10 right-4 left-4 flex items-center justify-between pointer-events-none z-40">
        <Link to="/" className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-emerald-100 dark:border-emerald-800/30 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
          <Home className="w-4 h-4 text-emerald-500" />
          العودة للرئيسية
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative w-full max-w-md p-8 sm:p-10 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/60 dark:border-slate-700/50 space-y-8 animate-fade-in-up mt-8 mb-8 z-10">
        
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-emerald-400 blur-lg opacity-20 rounded-full"></div>
            <img src={logo} alt="باقون" className="relative w-20 h-20 mx-auto mix-blend-multiply dark:mix-blend-normal object-contain rounded-2xl" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">تسجيل الدخول</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">مرحباً بعودتك إلى منصة باقون 👋</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">البريد الإلكتروني أو رقم الهاتف</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-left dir-ltr shadow-sm"
              placeholder="user@example.com أو 059..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t('common.password')}</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all text-left dir-ltr shadow-sm"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl transition-all mt-4 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <LogIn className="w-6 h-6" />}
            {isLoading ? t('common.loading') : t('common.login')}
          </button>
        </form>

        <p className="text-center text-sm text-baaqoon-500 dark:text-baaqoon-400">
          {t('auth.no_account')}{' '}
          <Link to="/register" className="text-baaqoon-accent hover:text-baaqoon-accentDark font-medium">
            {t('common.register')}
          </Link>
        </p>

        {/* Demo Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-3">
          <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1.5 font-bold">
            <FlaskConical className="w-3.5 h-3.5" />
            دخول تجريبي سريع
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin('super_admin')}
              className="py-2.5 px-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all hover:-translate-y-0.5"
            >
              👑 مدير عام
            </button>
            <button
              onClick={() => handleDemoLogin('supervisor')}
              className="py-2.5 px-2 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition-all hover:-translate-y-0.5"
            >
              👁️ مشرف / منسق
            </button>
            <button
              onClick={() => handleDemoLogin('teacher')}
              className="py-2.5 px-2 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all hover:-translate-y-0.5"
            >
              👨‍🏫 أستاذ
            </button>
            <button
              onClick={() => handleDemoLogin('student')}
              className="py-2.5 px-2 bg-cyan-50 dark:bg-cyan-900/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-400 text-xs font-bold rounded-xl border border-cyan-200 dark:border-cyan-800 transition-all hover:-translate-y-0.5"
            >
              👩‍🎓 طالب
            </button>
          </div>
        </div>
      </div>
      {/* Bottom Flag Strip */}
      <div className="flag-strip w-full fixed bottom-0 left-0 right-0 z-50" />
    </div>
  );
}
