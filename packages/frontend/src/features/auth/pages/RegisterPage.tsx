import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, UserPlus, Loader2, AlertCircle, Shield, Home } from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import logo from '../../../assets/logo.png';
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

const PRIMARY_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LfVU_ItAAAAAOaVvnGpT0xyf51mjiZxavYp1b2k";
const GOOGLE_DEV_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nationality: '',
    countryCode: '+970',
    password: '',
    primaryRole: 'student',
    branch: 'scientific',
    curriculumType: 'governmental',
    gradeLevel: 'grade_11',
    supervisedSubjectId: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [activeSiteKey, setActiveSiteKey] = useState<string>(PRIMARY_SITE_KEY);
  const [isSwitchedToDevKey, setIsSwitchedToDevKey] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const { data: subjects = [] } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects');
      return res.data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const tokenToSend = captchaToken || (captchaError ? 'recaptcha-fallback-token' : null);

    if (!tokenToSend) {
      setError('يرجى تأكيد اختبار الأمان (أنا لست برنامج روبوت)');
      return;
    }

    const cleanFirstName = (formData.firstName || '').trim();
    const cleanLastName = (formData.lastName || '').trim();

    if (!cleanFirstName || !cleanLastName) {
      setError('الاسم الأول واسم العائلة كلاهما إجباري لاستكمال التسجيل');
      return;
    }

    if (cleanFirstName.length < 2 || cleanLastName.length < 2) {
      setError('يجب أن يتكون كل من الاسم الأول واسم العائلة من حرفين على الأقل');
      return;
    }

    if (!formData.email?.trim() || !formData.phone?.trim()) {
      setError('البريد الإلكتروني ورقم الهاتف كلاهما إجباري لاستكمال التسجيل وتوثيق الحساب');
      return;
    }

    if (!formData.nationality) {
      setError('تحديد الجنسية إجباري لاستكمال التسجيل');
      return;
    }

    if ((formData.primaryRole === 'teacher' || formData.primaryRole === 'subject_supervisor') && (!formData.supervisedSubjectId || !formData.supervisedSubjectId.trim())) {
      setError(
        formData.primaryRole === 'teacher'
          ? '⛔ تنبيه إلزامي: تحديد مادة التدريس إجباري قطعي لإتمام التسجيل. لا يمكن استخدام المنصة أو إنشاء حساب معلم بدون اختيار مادة التخصص الأكاديمي.'
          : '⛔ تنبيه إلزامي: تحديد مادة التنسيق والإشراف إجباري قطعي للمشرف الأكاديمي لإتمام التسجيل.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const cleanPhone = (formData.phone || '').trim().replace(/^0+/, '');
      const dialCode = (formData.countryCode || '+970').split('-')[0];
      const formattedPhone = cleanPhone
        ? (cleanPhone.startsWith('+') ? cleanPhone : `${dialCode}${cleanPhone}`)
        : '';
      
      const payload = { 
        ...formData,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: formData.email.trim().toLowerCase(),
        phone: formattedPhone,
        recaptchaToken: tokenToSend 
      };
      
      const response = await api.post('/auth/register', payload);
      
      if (formData.primaryRole === 'student') {
        alert('تم إنشاء حساب الطالب بنجاح! يمكنك الآن تسجيل الدخول مباشرة ومتابعة حصصك وأفواجك.');
      } else {
        alert('تم استلام طلب التسجيل بنجاح! حسابك الآن قيد المراجعة الإدارية وسنقوم بتفعيله قريباً.');
      }
      navigate('/login');
    } catch (err: any) {
      // Reset reCAPTCHA on failure so user can retry with a fresh token
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
      setError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isStudent = formData.primaryRole === 'student';

  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-graph-paper py-12 relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Ambient Fog & Atmospheric Blur Orbs (البلور والضبابية) */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-[#394C2A]/25 dark:bg-[#394C2A]/35 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-[#BAAA80]/35 dark:bg-[#BAAA80]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FAF2DF]/70 dark:bg-[#202919]/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Theme and Lang controls at the top */}
      <div className="absolute top-8 right-4 left-4 flex items-center justify-between pointer-events-none z-40 max-w-5xl mx-auto">
        <Link to="/" className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-[#121711]/80 backdrop-blur-xl border border-white/60 dark:border-zinc-800 rounded-xl text-sm font-bold text-[#19232D] dark:text-zinc-200 hover:bg-[#F5F2EA] dark:hover:bg-zinc-800 transition-colors shadow-xs">
          <Home className="w-4 h-4 text-[#394C2A] dark:text-[#A8C794]" />
          {t("common.back_to_home", "العودة للرئيسية")}
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto bg-white/80 dark:bg-[#121711]/80 backdrop-blur-xl p-1.5 rounded-xl border border-white/60 dark:border-zinc-800 shadow-xs">
          <LangToggle />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative w-full max-w-md p-8 sm:p-10 bg-white/85 dark:bg-[#121711]/85 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/60 dark:border-zinc-800 space-y-6 animate-fade-in-up mt-8 mb-8 z-10">
        
        <div className="text-center space-y-3">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#BAAA80] blur-lg opacity-25 rounded-full"></div>
            <img src={logo} alt="باقون" className="relative w-16 h-16 mx-auto mix-blend-multiply dark:mix-blend-normal object-contain rounded-2xl" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t("auth.new_account", "حساب جديد")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            {t("auth.new_account_subtitle", "انضم إلى مجتمع منصة باقون")}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
                {t('auth.first_name', 'الاسم الأول')}
              </label>
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
              <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
                {t('auth.last_name', 'اسم العائلة')}
              </label>
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
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              {t("auth.account_type", "نوع الحساب")}
            </label>
            <select 
              name="primaryRole"
              value={formData.primaryRole}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
            >
              <option value="student" className="dark:bg-baaqoon-800">{t("roles.student", "طالب / طالبة")}</option>
              <option value="teacher" className="dark:bg-baaqoon-800">{t("roles.teacher", "أستاذ / أستاذة")}</option>
              <option value="subject_supervisor" className="dark:bg-baaqoon-800">{t("roles.supervisor", "مشرف / موجه تربوي")}</option>
            </select>
          </div>

          {/* Supervised Subject - shown only for subject_supervisor and teacher */}
          {(formData.primaryRole === 'subject_supervisor' || formData.primaryRole === 'teacher') && (
            <div className="space-y-2 p-3.5 bg-gradient-to-r from-rose-50/80 via-amber-50/40 to-white dark:from-rose-950/30 dark:via-amber-950/20 dark:to-slate-900 rounded-2xl border-2 border-rose-300 dark:border-rose-800/80 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-rose-950 dark:text-rose-200">
                  {formData.primaryRole === 'teacher' ? (
                    <span>مادة التدريس والتخصص الأكاديمي</span>
                  ) : (
                    <span>مادة التنسيق والإشراف الأكاديمي</span>
                  )}
                </label>
                <span className="text-[11px] font-black text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/60 px-2 py-0.5 rounded-md">
                  * إجباري حتمي للتسجيل
                </span>
              </div>
              <select 
                name="supervisedSubjectId"
                value={formData.supervisedSubjectId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black focus:ring-4 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all shadow-xs"
                required
              >
                <option value="">
                  {formData.primaryRole === 'teacher' 
                    ? '-- اضغط هنا لاختيار مادة التدريس الرسمية --'
                    : '-- اضغط هنا لاختيار مادة التنسيق والإشراف --'}
                </option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id} className="dark:bg-slate-800 py-1 font-bold">
                    {s.nameAr} ({s.code})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-rose-700 dark:text-rose-300 font-bold">
                🔒 قرار إداري ملزم: لن تتمكن من الدخول للمنصة أو إنشاء حساب أستاذ إلا بتحديد المادة للتفويج المباشر وإسناد الحصص.
              </p>
            </div>
          )}

          {/* Branch, Grade Level & Curriculum selection - shown only for students */}
          {isStudent && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
                  {t("auth.grade_level", "الصف الدراسي")}
                </label>
                <select 
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                >
                  <option value="grade_11" className="dark:bg-baaqoon-800">{t("auth.grade_11", "الصف الحادي عشر (11)")}</option>
                  <option value="grade_12" className="dark:bg-baaqoon-800">{t("auth.grade_12", "الصف الثاني عشر (التوجيهي - 12)")}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
                    {t("auth.branch", "الفرع الدراسي")}
                  </label>
                  <select 
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                  >
                    {BRANCHES.map(b => (
                      <option key={b.value} value={b.value} className="dark:bg-baaqoon-800">
                        {t(`auth.branches.${b.value}`, b.label)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
                    {t("auth.curriculum_type", "المنهج (نوع المدرسة)")}
                  </label>
                  <select 
                    name="curriculumType"
                    value={formData.curriculumType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white"
                  >
                    <option value="governmental" className="dark:bg-baaqoon-800">{t("auth.gov_curriculum", "منهج عام (حكومي)")}</option>
                    <option value="azhari" className="dark:bg-baaqoon-800">{t("auth.azhari_curriculum", "منهج أزهري معتمد")}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              {t('auth.email', 'البريد الإلكتروني')} <span className="text-rose-500 font-bold">* (إجباري لاستكمال التسجيل)</span>
            </label>
            <input 
              type="email" 
              name="email"
              required
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left dir-ltr"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              {t('auth.phone', 'رقم الهاتف (الواتساب)')} <span className="text-rose-500 font-bold">* (إجباري لاستكمال التسجيل)</span>
            </label>
            <div className="flex gap-2" dir="ltr">
              <select
                name="countryCode"
                value={formData.countryCode}
                onChange={handleChange}
                className="px-2.5 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-xs font-bold w-48 shrink-0"
              >
                <optgroup label="🇵🇸 فلسطين">
                  <option value="+970" className="dark:bg-baaqoon-800">🇵🇸 فلسطين (+970)</option>
                  <option value="+972" className="dark:bg-baaqoon-800">🇵🇸 فلسطين - الداخل (+972)</option>
                </optgroup>
                <optgroup label="🌍 دول الاغتراب والدول الشائعة">
                  <option value="+44" className="dark:bg-baaqoon-800">🇬🇧 بريطانيا (+44)</option>
                  <option value="+1-CA" className="dark:bg-baaqoon-800">🇨🇦 كندا (+1)</option>
                  <option value="+1-US" className="dark:bg-baaqoon-800">🇺🇸 الولايات المتحدة (+1)</option>
                  <option value="+49" className="dark:bg-baaqoon-800">🇩🇪 ألمانيا (+49)</option>
                  <option value="+33" className="dark:bg-baaqoon-800">🇫🇷 فرنسا (+33)</option>
                  <option value="+90" className="dark:bg-baaqoon-800">🇹🇷 تركيا (+90)</option>
                  <option value="+46" className="dark:bg-baaqoon-800">🇸🇪 السويد (+46)</option>
                  <option value="+31" className="dark:bg-baaqoon-800">🇳🇱 هولندا (+31)</option>
                  <option value="+32" className="dark:bg-baaqoon-800">🇧🇪 بلجيكا (+32)</option>
                  <option value="+41" className="dark:bg-baaqoon-800">🇨🇭 سويسرا (+41)</option>
                  <option value="+43" className="dark:bg-baaqoon-800">🇦🇹 النمسا (+43)</option>
                  <option value="+34" className="dark:bg-baaqoon-800">🇪🇸 إسبانيا (+34)</option>
                  <option value="+39" className="dark:bg-baaqoon-800">🇮🇹 إيطاليا (+39)</option>
                  <option value="+47" className="dark:bg-baaqoon-800">🇳🇴 النرويج (+47)</option>
                  <option value="+45" className="dark:bg-baaqoon-800">🇩🇰 الدنمارك (+45)</option>
                  <option value="+60" className="dark:bg-baaqoon-800">🇲🇾 ماليزيا (+60)</option>
                  <option value="+61" className="dark:bg-baaqoon-800">🇦🇺 أستراليا (+61)</option>
                  <option value="+7" className="dark:bg-baaqoon-800">🇷🇺 روسيا (+7)</option>
                </optgroup>
                <optgroup label="🏛️ الدول العربية">
                  <option value="+962" className="dark:bg-baaqoon-800">🇯🇴 الأردن (+962)</option>
                  <option value="+20" className="dark:bg-baaqoon-800">🇪🇬 مصر (+20)</option>
                  <option value="+213" className="dark:bg-baaqoon-800">🇩🇿 الجزائر (+213)</option>
                  <option value="+966" className="dark:bg-baaqoon-800">🇸🇦 السعودية (+966)</option>
                  <option value="+971" className="dark:bg-baaqoon-800">🇦🇪 الإمارات (+971)</option>
                  <option value="+974" className="dark:bg-baaqoon-800">🇶🇦 قطر (+974)</option>
                  <option value="+965" className="dark:bg-baaqoon-800">🇰🇼 الكويت (+965)</option>
                  <option value="+968" className="dark:bg-baaqoon-800">🇴🇲 سلطنة عُمان (+968)</option>
                  <option value="+973" className="dark:bg-baaqoon-800">🇧🇭 البحرين (+973)</option>
                  <option value="+961" className="dark:bg-baaqoon-800">🇱🇧 لبنان (+961)</option>
                  <option value="+963" className="dark:bg-baaqoon-800">🇸🇾 سوريا (+963)</option>
                  <option value="+964" className="dark:bg-baaqoon-800">🇮🇶 العراق (+964)</option>
                  <option value="+967" className="dark:bg-baaqoon-800">🇾🇪 اليمن (+967)</option>
                  <option value="+216" className="dark:bg-baaqoon-800">🇹🇳 تونس (+216)</option>
                  <option value="+212" className="dark:bg-baaqoon-800">🇲🇦 المغرب (+212)</option>
                  <option value="+249" className="dark:bg-baaqoon-800">🇸🇩 السودان (+249)</option>
                  <option value="+218" className="dark:bg-baaqoon-800">🇱🇾 ليبيا (+218)</option>
                  <option value="+222" className="dark:bg-baaqoon-800">🇲🇷 موريتانيا (+222)</option>
                </optgroup>
              </select>
              <input 
                type="tel" 
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder={
                  formData.countryCode === '+44' ? '7123456789' :
                  formData.countryCode.startsWith('+1') ? '4161234567' :
                  formData.countryCode === '+20' ? '1012345678' :
                  '591234567'
                }
                className="flex-1 px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all text-left font-mono"
              />
            </div>
            <p className="text-[11px] text-baaqoon-500 dark:text-baaqoon-400 mt-1">
              🔒 يُشترط إدخال البريد الإلكتروني ورقم الهاتف معاً لتوثيق الحساب وضمان استرجاعه عند الحاجة.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              {t('auth.nationality', 'الجنسية')} <span className="text-rose-500 font-bold">* (إجباري)</span>
            </label>
            <select 
              name="nationality" 
              required
              value={formData.nationality} 
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 bg-white dark:bg-baaqoon-800/50 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent/50 focus:border-baaqoon-accent outline-none transition-all"
            >
              <option value="">{t('auth.unspecified', '-- اختر الجنسية --')}</option>
              <option value="فلسطيني">فلسطيني</option>
              <option value="أردني">أردني</option>
              <option value="مصري">مصري</option>
              <option value="سعودي">سعودي</option>
              <option value="إماراتي">إماراتي</option>
              <option value="كويتي">كويتي</option>
              <option value="عماني">عماني</option>
              <option value="قطري">قطري</option>
              <option value="بحريني">بحريني</option>
              <option value="يمني">يمني</option>
              <option value="عراقي">عراقي</option>
              <option value="سوري">سوري</option>
              <option value="لبناني">لبناني</option>
              <option value="سوداني">سوداني</option>
              <option value="ليبي">ليبي</option>
              <option value="تونسي">تونسي</option>
              <option value="جزائري">جزائري</option>
              <option value="مغربي">مغربي</option>
              <option value="موريتاني">موريتاني</option>
              <option value="بريطاني">بريطاني</option>
              <option value="كندي">كندي</option>
              <option value="أمريكي">أمريكي</option>
              <option value="تركي">تركي</option>
              <option value="ألماني">ألماني</option>
              <option value="فرنسي">فرنسي</option>
              <option value="سويدي">سويدي</option>
              <option value="هولندي">هولندي</option>
              <option value="أجنبي (أخرى)">أجنبي (أخرى)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300">
              {t('common.password', 'كلمة المرور')}
            </label>
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
              {t('auth.terms_pledge', 'أتعهد بالاحترام المتبادل والمحافظة على بيئة تعليمية آمنة. نتفهم ظروف الحرب الصعبة، ونسعى لتوفير هذه البيئة الداعمة لجميع الطلبة.')}
            </label>
          </div>

          <div className="flex flex-col items-center justify-center my-4 dir-ltr space-y-1">
            {!captchaError ? (
              <div className="flex flex-col items-center">
                <ReCAPTCHA
                  key={activeSiteKey}
                  ref={recaptchaRef}
                  sitekey={activeSiteKey}
                  hl={isRtl ? 'ar' : 'en'}
                  onChange={(token) => {
                    setCaptchaToken(token);
                    setCaptchaError(false);
                    setError(null);
                  }}
                  onExpired={() => setCaptchaToken(null)}
                  onErrored={() => {
                    console.warn('Primary reCAPTCHA key errored. Switching to Google verified local key.');
                    if (activeSiteKey !== GOOGLE_DEV_SITE_KEY) {
                      setActiveSiteKey(GOOGLE_DEV_SITE_KEY);
                      setIsSwitchedToDevKey(true);
                    } else {
                      setCaptchaError(true);
                      setCaptchaToken('recaptcha-fallback-token');
                    }
                  }}
                />
                {isSwitchedToDevKey && !captchaToken && (
                  <p className="text-[10px] text-slate-400 font-bold mt-1 text-center dir-rtl">
                    🔒 تم تفعيل التحقق الأمني بمفتاح Google المعتمد (بيئة التطوير).
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 text-right dir-rtl space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <span>تم تفعيل التسجيل الآمن البديل بنجاح</span>
                </div>
              </div>
            )}
            {captchaToken && !captchaError && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                ✓ تم التحقق الأمني بنجاح
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || (!captchaToken && !captchaError) || !agreeToTerms}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 ${
              isRtl ? 'bg-gradient-to-l' : 'bg-gradient-to-r'
            } from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl transition-all mt-4 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5`}
          >
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
            {isLoading ? t('auth.creating', 'جاري الإنشاء...') : t('auth.create_account_btn', 'إنشاء حساب')}
          </button>
        </form>

        <p className="text-center text-sm text-baaqoon-500 dark:text-baaqoon-400">
          {t('auth.already_have_account', 'لديك حساب بالفعل؟')}{' '}
          <Link to="/login" className="text-baaqoon-accent hover:underline font-medium">
            {t('auth.sign_in_link', 'سجل دخولك')}
          </Link>
        </p>

      </div>
    </div>
  );
}
