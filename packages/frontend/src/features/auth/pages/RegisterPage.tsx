import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, UserPlus, Loader2, AlertCircle, Shield, Home } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import logo from '../../../assets/logo.jpg';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import LangToggle from '../../../components/shared/LangToggle';

const BRANCHES = [
  { value: 'scientific', label: 'العلمي' },
  { value: 'literary', label: 'الأدبي' },
  { value: 'entrepreneurship', label: 'الريادة والأعمال' },
  { value: 'industrial', label: 'الصناعي' },
  { value: 'sharia', label: 'الشرعي' },
];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+970',
    password: '',
    primaryRole: 'student',
    branch: 'scientific',
    curriculumType: 'governmental',
    supervisedSubjectId: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects');
      return res.data;
    }
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!captchaToken) {
      setError('يرجى تأكيد أنك لست روبوتاً');
      return;
    }

    setIsLoading(true);

    try {
      if (!formData.email && !formData.phone) {
        setError('يجب إدخال البريد الإلكتروني أو رقم الهاتف');
        setIsLoading(false);
        return;
      }

      const formattedPhone = formData.phone ? `${formData.countryCode}${formData.phone}` : '';
      
      const payload = { 
        ...formData, 
        phone: formattedPhone,
        recaptchaToken: captchaToken 
      };
      
      const response = await api.post('/auth/register', payload);
      const { user, accessToken } = response.data;
      setAuth(user, accessToken);

      if (user.primaryRole === 'student') {
        navigate('/student/dashboard', { state: { justRegistered: true } });
      } else if (user.primaryRole === 'subject_supervisor') {
        navigate('/supervisor/dashboard', { state: { justRegistered: true } });
      } else {
        navigate('/teacher/dashboard', { state: { justRegistered: true } });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isStudent = formData.primaryRole === 'student';

  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-baaqoon-50 dark:bg-baaqoon-950 py-12">
      {/* Top Flag Strip */}
      <div className="flag-strip w-full fixed top-0 left-0 right-0 z-50" />
      
      {/* Theme and Lang controls at the top */}
      <div className="absolute top-10 right-4 left-4 flex items-center justify-between pointer-events-none z-40">
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
          <h2 className="text-2xl font-bold text-baaqoon-900 dark:text-white">{t('common.register')}</h2>
          <p className="text-baaqoon-500 dark:text-baaqoon-400">{t('auth.join_us')}</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">{t('auth.first_name')}</label>
              <input 
                type="text" 
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">{t('auth.last_name')}</label>
              <input 
                type="text" 
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">نوع الحساب</label>
            <select 
              name="primaryRole"
              value={formData.primaryRole}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
            >
              <option value="student" className="dark:bg-baaqoon-800">طالب / طالبة (توجيهي)</option>
              <option value="teacher" className="dark:bg-baaqoon-800">أستاذ / أستاذة</option>
              <option value="subject_supervisor" className="dark:bg-baaqoon-800">مشرف / موجه تربوي</option>
            </select>
          </div>

          {/* Supervised Subject - shown only for subject_supervisor */}
          {(formData.primaryRole === 'subject_supervisor' || formData.primaryRole === 'teacher') && (
            <div className="space-y-1.5 animate-fade-in-up">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">مادة التنسيق (اختر مادة واحدة فقط)</label>
              <select 
                name="supervisedSubjectId"
                value={formData.supervisedSubjectId}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                required={(formData.primaryRole === 'subject_supervisor' || formData.primaryRole === 'teacher')}
              >
                <option value="" className="dark:bg-baaqoon-800">-- اختر مادة التنسيق --</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id} className="dark:bg-baaqoon-800">{s.nameAr}</option>
                ))}
              </select>
            </div>
          )}

          {/* Branch & Curriculum selection - shown only for students */}
          {isStudent && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">الفرع الدراسي</label>
                <select 
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                >
                  {BRANCHES.map(b => (
                    <option key={b.value} value={b.value} className="dark:bg-baaqoon-800">{b.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">المنهج (نوع المدرسة)</label>
                <select 
                  name="curriculumType"
                  value={formData.curriculumType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                >
                  <option value="governmental" className="dark:bg-baaqoon-800">منهج حكومي</option>
                  <option value="azhari" className="dark:bg-baaqoon-800">منهج أزهري</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">{t('common.email')} (اختياري إذا أدخلت الهاتف)</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left dir-ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">رقم الهاتف (اختياري إذا أدخلت البريد)</label>
            <div className="flex flex-row-reverse gap-2">
              <input 
                type="tel" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="591234567"
                className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left dir-ltr"
              />
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="px-2 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left dir-ltr w-24 shrink-0"
              >
                <option value="+970" className="dark:bg-baaqoon-800">🇵🇸 +970</option>
                <option value="+972" className="dark:bg-baaqoon-800">🇵🇸 +972</option>
                <option value="+213" className="dark:bg-baaqoon-800">🇩🇿 +213</option>
                <option value="+20" className="dark:bg-baaqoon-800">🇪🇬 +20</option>
                <option value="+962" className="dark:bg-baaqoon-800">🇯🇴 +962</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">{t('common.password')}</label>
            <input 
              type="password" 
              name="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left dir-ltr"
            />
          </div>

          <div className="flex items-start gap-2 bg-baaqoon-50 dark:bg-baaqoon-800/30 p-3 rounded-lg border border-baaqoon-100 dark:border-baaqoon-800">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 flex-shrink-0 w-4 h-4 text-baaqoon-accent border-gray-300 rounded focus:ring-baaqoon-accent"
            />
            <label htmlFor="terms" className="text-xs text-baaqoon-700 dark:text-baaqoon-300 leading-relaxed">
              أتعهد بالاحترام المتبادل والمحافظة على بيئة تعليمية آمنة. نتفهم ظروف الحرب الصعبة، ونسعى لتوفير هذه البيئة الداعمة لجميع الطلبة.
            </label>
          </div>

          <div className="flex justify-center my-4 dir-ltr">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
              onChange={(token) => setCaptchaToken(token)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !captchaToken || !agreeToTerms}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors mt-4"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            {isLoading ? 'جاري الإنشاء...' : 'إنشاء حساب'}
          </button>
        </form>

        <p className="text-center text-sm text-baaqoon-500 dark:text-baaqoon-400">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-baaqoon-accent hover:underline font-medium">
            سجل دخولك
          </Link>
        </p>

      </div>
      {/* Bottom Flag Strip */}
      <div className="flag-strip w-full fixed bottom-0 left-0 right-0 z-50" />
    </div>
  );
}
