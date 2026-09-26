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
    <div className="min-h-screen flex items-center justify-center p-4 bg-baaqoon-50 dark:bg-baaqoon-950">
      {/* Top Flag Strip */}
      <div className="flag-strip w-full fixed top-0 left-0 right-0 z-50" />
      
      {/* Theme and Lang controls at the top */}
      <div className="absolute top-10 right-4 left-4 flex items-center justify-between pointer-events-none">
        <Link to="/" className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white dark:bg-baaqoon-900/80 dark:bg-baaqoon-900/80 backdrop-blur-sm border border-baaqoon-200 dark:border-baaqoon-800 rounded-lg text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 transition-colors shadow-sm">
          <Home className="w-4 h-4" />
          العودة للرئيسية
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto bg-white dark:bg-baaqoon-900/80 dark:bg-baaqoon-900/80 backdrop-blur-sm p-1 rounded-lg border border-baaqoon-200 dark:border-baaqoon-800 shadow-sm">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="glass-panel w-full max-w-md p-8 space-y-6 animate-fade-in-up mt-8 mb-8">
        
        <div className="text-center space-y-2">
          <img src={logo} alt="باقون" className="w-16 h-16 mx-auto mix-blend-multiply dark:mix-blend-normal object-contain" />
          <h2 className="text-2xl font-bold text-baaqoon-900 dark:text-white">{t('common.login')}</h2>
          <p className="text-baaqoon-500 dark:text-baaqoon-400">{t('auth.welcome_back')}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">البريد الإلكتروني أو رقم الهاتف</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left dir-ltr"
              placeholder="user@example.com أو 059..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">{t('common.password')}</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left dir-ltr"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
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
        <div className="border-t border-baaqoon-100 dark:border-baaqoon-800 pt-6 space-y-3">
          <p className="text-center text-xs text-baaqoon-400 flex items-center justify-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5" />
            دخول تجريبي سريع (باك-إند حقيقي)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin('super_admin')}
              className="py-2 px-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded-lg border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              👑 مدير عام
            </button>
            <button
              onClick={() => handleDemoLogin('supervisor')}
              className="py-2 px-2 bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-lg border border-amber-200 dark:border-amber-800 transition-colors"
            >
              👁️ مشرف / منسق
            </button>
            <button
              onClick={() => handleDemoLogin('teacher')}
              className="py-2 px-2 bg-baaqoon-100 dark:bg-baaqoon-800 hover:bg-baaqoon-200 dark:hover:bg-baaqoon-700 text-baaqoon-accentDark dark:text-baaqoon-300 text-xs font-medium rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 transition-colors"
            >
              👨‍🏫 أستاذ
            </button>
            <button
              onClick={() => handleDemoLogin('student')}
              className="py-2 px-2 bg-baaqoon-100 dark:bg-baaqoon-800 hover:bg-baaqoon-200 dark:hover:bg-baaqoon-700 text-baaqoon-accentDark dark:text-baaqoon-300 text-xs font-medium rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 transition-colors"
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
