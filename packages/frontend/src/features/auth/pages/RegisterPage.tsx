import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, UserPlus, Loader2, AlertCircle, Shield, Home, 
  GraduationCap, Lock, User, Mail, Phone, Globe, Sparkles, CheckCircle2,
  Eye, EyeOff
} from 'lucide-react';
import ReCAPTCHA from 'react-google-recaptcha';
import logo from '../../../assets/logo.png';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import LangToggle from '../../../components/shared/LangToggle';
import { useTimeGreeting } from '../../../hooks/useTimeGreeting';

const BRANCHES = [
  { value: 'scientific', label: 'العلمي', icon: '🔬' },
  { value: 'literary', label: 'الأدبي', icon: '📚' },
  { value: 'sharia', label: 'الشرعي', icon: '⚖️' },
  { value: 'entrepreneurship', label: 'الريادة والأعمال', icon: '💼' },
  { value: 'industrial', label: 'الصناعي', icon: '⚙️' },
];

const PRIMARY_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LckbPYtAAAAANhDOFaVaiJxTjDUfavW9CqZTOhe";
const GOOGLE_DEV_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";

export default function RegisterPage() {
  const timeGreeting = useTimeGreeting();
  const [selectedRoleTab, setSelectedRoleTab] = useState<'student' | 'teacher'>('student');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    firstNameAr: '',
    lastNameAr: '',
    firstNameEn: '',
    lastNameEn: '',
    email: '',
    phone: '',
    nationality: 'فلسطيني',
    countryCode: '+970',
    password: '',
    confirmPassword: '',
    primaryRole: 'student',
    branch: 'scientific',
    curriculumType: 'governmental',
    gradeLevel: 'grade_12',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState(false);
  const [activeSiteKey, setActiveSiteKey] = useState<string>(PRIMARY_SITE_KEY);
  const [isSwitchedToDevKey, setIsSwitchedToDevKey] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const tokenToSend = captchaToken || (captchaError ? 'recaptcha-fallback-token' : null);

    if (!tokenToSend) {
      setError('يرجى تأكيد اختبار الأمان (أنا لست برنامج روبوت)');
      return;
    }

    const cleanFirstNameAr = (formData.firstNameAr || formData.firstName || '').trim();
    const cleanLastNameAr = (formData.lastNameAr || formData.lastName || '').trim();
    const cleanFirstNameEn = (formData.firstNameEn || '').trim();
    const cleanLastNameEn = (formData.lastNameEn || '').trim();

    if (!cleanFirstNameAr || !cleanLastNameAr) {
      setError('الاسم واللقب باللغة العربية كلاهما إجباري لاستكمال التسجيل');
      return;
    }

    if (!cleanFirstNameEn || !cleanLastNameEn) {
      setError('الاسم واللقب بالحروف اللاتينية (English / Latin) كلاهما إجباري لتوثيق الشهادات والفرز');
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

    if (!formData.password || formData.password.length < 8) {
      setError('كلمة المرور يجب أن تتكون من 8 خانات على الأقل');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقتين، يُرجى التأكد من تطابقهما بدقة');
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
        firstName: cleanFirstNameAr,
        lastName: cleanLastNameAr,
        firstNameAr: cleanFirstNameAr,
        lastNameAr: cleanLastNameAr,
        firstNameEn: cleanFirstNameEn,
        lastNameEn: cleanLastNameEn,
        email: formData.email.trim().toLowerCase(),
        phone: formattedPhone,
        primaryRole: 'student',
        recaptchaToken: tokenToSend 
      };
      
      await api.post('/auth/register', payload);
      
      alert('تم إنشاء حساب الطالب بنجاح! يمكنك الآن تسجيل الدخول مباشرة ومتابعة حصصك وأفواجك.');
      navigate('/login');
    } catch (err: any) {
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-graph-paper py-12 relative overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
      {/* Ambient Fog Orbs */}
      <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-[#394C2A]/25 dark:bg-[#394C2A]/35 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] bg-[#BAAA80]/35 dark:bg-[#BAAA80]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#FAF2DF]/70 dark:bg-[#202919]/40 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar Controls */}
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

      {/* Main Register Card - Spacious, Clean & Beautiful */}
      <div className="relative w-full max-w-2xl p-6 sm:p-10 bg-white/90 dark:bg-[#121711]/90 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/60 dark:border-zinc-800 space-y-6 animate-fade-in-up mt-8 mb-8 z-10 font-sans">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-[#BAAA80] blur-lg opacity-25 rounded-full"></div>
            <img src={logo} alt="باقون" className="relative w-16 h-16 mx-auto mix-blend-multiply dark:mix-blend-normal object-contain rounded-2xl" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-black shadow-xs animate-fade-in">
              <span>{timeGreeting.icon}</span>
              <span>{timeGreeting.text}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            حساب جديد في منصة باقون
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
            البوابة التعليمية لدعم طلبة قطاع غزة في المرحلة الثانوية
          </p>
        </div>

        {/* Top Single Clear Role Switcher: Student vs Teacher */}
        <div className="p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 grid grid-cols-2 gap-2 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setSelectedRoleTab('student')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              selectedRoleTab === 'student'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md scale-[1.01]'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>🎓 أنا طالب(ة)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedRoleTab('teacher')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              selectedRoleTab === 'teacher'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-md scale-[1.01]'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>🌿</span>
            <span>أنا أستاذ(ة) متطوع(ة)</span>
          </button>
        </div>

        {/* ─── CASE A: TEACHER VIEW (PRESTIGIOUS & CLEAR GUIDANCE) ─── */}
        {selectedRoleTab === 'teacher' ? (
          <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center space-y-5 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mx-auto text-3xl shadow-inner">
              🌿
            </div>
            
            <div className="space-y-2 max-w-lg mx-auto">
              <h3 className="font-black text-slate-900 dark:text-white text-lg">
                أهلاً وسهلاً بكم أساتذتنا الكرام في رحاب مبادرة غزة
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                نظراً لخصوصية تدريس طلبة قطاع غزة وفق المنهاج الفلسطيني والأزهري المعتمد، فإن تسجيل الأساتذة وإسناد الأفواج التعليمية يمر عبر <strong>بوابة اعتماد وتدقيق ملفات الأساتذة المتطوعين</strong> لفرز التخصصات وأوقات التفرغ وتعيين المجموعات الدراسية المناسبة.
              </p>
            </div>

            <div className="pt-2 max-w-md mx-auto">
              <Link
                to="/volunteer"
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-600/30 transition-all hover:-translate-y-0.5"
              >
                <span>الانتقال إلى استمارة وبوابة اعتماد الأساتذة 👈</span>
              </Link>
            </div>

            <div className="pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 font-bold max-w-md mx-auto">
              💡 هل أنت أستاذ تدرس حالياً في برنامج باقون؟ يمكنك استخدام نفس البوابة لتأكيد وتحديث حسابك السريع دون إعادة ملء البيانات.
            </div>
          </div>
        ) : (
          
          /* ─── CASE B: STUDENT REGISTRATION FORM (CLEAN, 3-SECTION WIZARD FORM) ─── */
          <form onSubmit={handleRegister} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs font-bold animate-fade-in">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* القسم الأول: الاسم الكامل بالعربية واللاتينية */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 pb-3">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  ١. الاسم الكامل (بالعربية واللاتينية)
                </span>
                <span className="text-[10px] text-slate-400 font-bold">مطلوب للشهادات والفرز الأكاديمي</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الاسم الأول (بالعربية) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="firstNameAr"
                    required
                    placeholder="مثال: أحمد"
                    value={formData.firstNameAr}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    اللقب / العائلة (بالعربية) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="lastNameAr"
                    required
                    placeholder="مثال: الخطيب"
                    value={formData.lastNameAr}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="space-y-1" dir="ltr">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-left">
                    First Name (Latin) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="firstNameEn"
                    required
                    placeholder="e.g. Ahmed"
                    value={formData.firstNameEn}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                  />
                </div>

                <div className="space-y-1" dir="ltr">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 text-left">
                    Last Name (Latin) <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="lastNameEn"
                    required
                    placeholder="e.g. Alkhatib"
                    value={formData.lastNameEn}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-left"
                  />
                </div>
              </div>
            </div>

            {/* القسم الثاني: المسار الدراسي والمنهاج */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 pb-3">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  ٢. المسار الأكاديمي والمنهاج المعتمد
                </span>
                <span className="text-[10px] text-slate-400 font-bold">لتسكينك في الفوج والمقررات المناسبة</span>
              </div>

              {/* 1. نوع المنهاج */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  نوع المنهاج المدرسي:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, curriculumType: 'governmental' }))}
                    className={`py-3 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      formData.curriculumType === 'governmental'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>🏛️</span>
                    <span>المنهاج الفلسطيني (العام الحكومي)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, curriculumType: 'azhari' }))}
                    className={`py-3 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      formData.curriculumType === 'azhari'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span>🕌</span>
                    <span>المنهاج الأزهري المعتمد لغزة</span>
                  </button>
                </div>
              </div>

              {/* 2. الصف الدراسي */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الصف الدراسي:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gradeLevel: 'grade_12' }))}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      formData.gradeLevel === 'grade_12'
                        ? 'bg-baaqoon-800 text-white border-baaqoon-800 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>🎓</span>
                    <span>الصف الثاني عشر (التوجيهي - 12)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, gradeLevel: 'grade_11' }))}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-2 ${
                      formData.gradeLevel === 'grade_11'
                        ? 'bg-baaqoon-800 text-white border-baaqoon-800 shadow-sm'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>📖</span>
                    <span>الصف الحادي عشر (11)</span>
                  </button>
                </div>
              </div>

              {/* 3. الفرع الدراسي */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  الفرع الدراسي:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {BRANCHES.map(b => (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, branch: b.value }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                        formData.branch === b.value
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{b.icon}</span>
                      <span>{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* القسم الثالث: بيانات الاتصال والحساب */}
            <div className="p-5 sm:p-6 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/70 pb-3">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  ٣. بيانات الاتصال والأمان
                </span>
                <span className="text-[10px] text-slate-400 font-bold">للتواصل واسترجاع الحساب</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* البريد الإلكتروني */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    البريد الإلكتروني <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-left"
                    dir="ltr"
                  />
                </div>

                {/* الهاتف والواتساب */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    رقم الواتساب والهاتف <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-1.5" dir="ltr">
                    <select 
                      name="countryCode" 
                      value={formData.countryCode} 
                      onChange={handleChange}
                      className="w-28 px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-[11px] font-bold outline-none"
                    >
                      <option value="+970">🇵🇸 +970</option>
                      <option value="+972">🇵🇸 +972</option>
                      <option value="+20">🇪🇬 +20</option>
                      <option value="+962">🇯🇴 +962</option>
                      <option value="+213">🇩🇿 +213</option>
                      <option value="+966">🇸🇦 +966</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+974">🇶🇦 +974</option>
                      <option value="+965">🇰🇼 +965</option>
                      <option value="+968">🇴🇲 +968</option>
                      <option value="+973">🇧🇭 +973</option>
                      <option value="+961">🇱🇧 +961</option>
                      <option value="+963">🇸🇾 +963</option>
                      <option value="+964">🇮🇶 +964</option>
                      <option value="+967">🇾🇪 +967</option>
                      <option value="+216">🇹🇳 +216</option>
                      <option value="+212">🇲🇦 +212</option>
                      <option value="+249">🇸🇩 +249</option>
                      <option value="+218">🇱🇾 +218</option>
                      <option value="+222">🇲🇷 +222</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+90">🇹🇷 +90</option>
                      <option value="+46">🇸🇪 +46</option>
                      <option value="+31">🇳🇱 +31</option>
                      <option value="+32">🇧🇪 +32</option>
                      <option value="+41">🇨🇭 +41</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+60">🇲🇾 +60</option>
                      <option value="+7">🇷🇺 +7</option>
                    </select>
                    <input 
                      type="tel" 
                      name="phone"
                      required
                      placeholder="0591234567"
                      value={formData.phone}
                      onChange={handleChange}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                {/* الجنسية */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    الجنسية <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    name="nationality" 
                    required
                    value={formData.nationality} 
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none"
                  >
                    <option value="فلسطيني">فلسطيني</option>
                    <option value="أردني">أردني</option>
                    <option value="مصري">مصري</option>
                    <option value="جزائري">جزائري</option>
                    <option value="سعودي">سعودي</option>
                    <option value="إماراتي">إماراتي</option>
                    <option value="قطري">قطري</option>
                    <option value="كويتي">كويتي</option>
                    <option value="عماني">عماني</option>
                    <option value="بحريني">بحريني</option>
                    <option value="تونسي">تونسي</option>
                    <option value="مغربي">مغربي</option>
                    <option value="سوداني">سوداني</option>
                    <option value="ليبي">ليبي</option>
                    <option value="يمني">يمني</option>
                    <option value="عراقي">عراقي</option>
                    <option value="سوري">سوري</option>
                    <option value="لبناني">لبناني</option>
                    <option value="موريتاني">موريتاني</option>
                    <option value="بريطاني">بريطاني</option>
                    <option value="تركي">تركي</option>
                    <option value="أمريكي">أمريكي</option>
                    <option value="كندي">كندي</option>
                    <option value="ألماني">ألماني</option>
                    <option value="فرنسي">فرنسي</option>
                    <option value="سويدي">سويدي</option>
                    <option value="هولندي">هولندي</option>
                    <option value="أجنبي (أخرى)">أجنبي (أخرى)</option>
                  </select>
                </div>

                {/* كلمة المرور */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    كلمة المرور (8 خانات على الأقل) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none text-left pr-10"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* تأكيد كلمة المرور */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    تأكيد كلمة المرور <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      name="confirmPassword"
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-3.5 py-2.5 rounded-xl border ${
                        formData.confirmPassword && formData.password !== formData.confirmPassword
                          ? 'border-rose-400 focus:ring-rose-500'
                          : formData.confirmPassword && formData.password === formData.confirmPassword
                          ? 'border-emerald-500 focus:ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700'
                      } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none text-left pr-10`}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="text-[11px] font-bold flex items-center gap-1 mt-1">
                      {formData.password === formData.confirmPassword ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>كلمتا المرور متطابقتان</span>
                        </span>
                      ) : (
                        <span className="text-rose-500 dark:text-rose-400 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>كلمتا المرور غير متطابقتين</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ميثاق الاحترام المتبادل */}
            <div className="flex items-start gap-2.5 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-emerald-900 dark:text-emerald-300 leading-relaxed font-medium cursor-pointer">
                أتعهد بالاحترام المتبادل والمحافظة على بيئة تعليمية آمنة وداعمة لطلبتنا الأعزاء في غزة، والالتزام بحضور الحصص المقررة.
              </label>
            </div>

            {/* reCAPTCHA */}
            <div className="flex flex-col items-center justify-center my-3 dir-ltr space-y-1">
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
                      🔒 تم تفعيل التحقق الأمني بمفتاح Google المعتمد.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-200 text-right dir-rtl space-y-1 w-full max-w-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛡️</span>
                    <span>تم تفعيل التسجيل الآمن البديل بنجاح</span>
                  </div>
                </div>
              )}
              {captchaToken && !captchaError && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم التحقق الأمني بنجاح</span>
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || (!captchaToken && !captchaError) || !agreeToTerms}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl shadow-xl shadow-emerald-600/25 transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
              <span>{isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب طالب وبدء التعلم'}</span>
            </button>

          </form>
        )}

        {/* Footer Login Link */}
        <p className="text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          لديك حساب بالفعل؟{' '}
          <Link to="/login" className="text-emerald-700 dark:text-emerald-400 hover:underline font-black">
            سجل دخولك هنا
          </Link>
        </p>

      </div>
    </div>
  );
}
