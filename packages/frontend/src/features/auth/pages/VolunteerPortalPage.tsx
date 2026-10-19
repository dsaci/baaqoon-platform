import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, BookOpen, UserCheck, ShieldCheck, CheckCircle2, 
  ArrowLeft, ArrowRight, Send, AlertCircle, Sparkles, MessageSquare, 
  Phone, Mail, GraduationCap, Clock, Calendar, Laptop, Wifi, HelpCircle,
  Users, ChevronDown, Check, Globe
} from 'lucide-react';
import logo from '../../../assets/logo.png';
import { api } from '../../../lib/axios';
import ThemeToggle from '../../../components/shared/ThemeToggle';
import LangToggle from '../../../components/shared/LangToggle';

const AVAILABLE_SUBJECTS = [
  { id: 'math', label: 'الرياضيات · Mathematics' },
  { id: 'physics', label: 'الفيزياء · Physics' },
  { id: 'chem', label: 'الكيمياء · Chemistry' },
  { id: 'bio', label: 'الأحياء والعلوم الحياتية · Biology' },
  { id: 'arabic', label: 'اللغة العربية وآدابها · Arabic Language' },
  { id: 'english', label: 'اللغة الإنجليزية · English Language' },
  { id: 'history', label: 'التاريخ · History' },
  { id: 'geography', label: 'الجغرافيا · Geography' },
  { id: 'islamic', label: 'التربية الإسلامية والشريعة · Islamic Education' },
  { id: 'tech', label: 'التكنولوجيا والبرمجة · Technology' },
  { id: 'sciences', label: 'العلوم العامة · Sciences' },
];

const DAYS_OF_WEEK = [
  { id: 'sunday', label: 'الأحد - Sunday' },
  { id: 'monday', label: 'الاثنين - Monday' },
  { id: 'tuesday', label: 'الثلاثاء - Tuesday' },
  { id: 'wednesday', label: 'الأربعاء - Wednesday' },
  { id: 'thursday', label: 'الخميس - Thursday' },
  { id: 'friday', label: 'الجمعة - Friday' },
  { id: 'saturday', label: 'السبت - Saturday' },
];

const TIME_SLOTS = [
  { id: 'morning', label: 'الصباح (8:00 ص – 12:00 م بتوقيت غزة)' },
  { id: 'afternoon', label: 'الظهر (12:00 م – 4:00 م بتوقيت غزة)' },
  { id: 'evening', label: 'المساء (4:00 م – 8:00 م بتوقيت غزة)' },
  { id: 'flexible', label: 'مرن / أي وقت متاح' },
];

const DEVICE_TYPES = [
  { id: 'laptop', label: 'كمبيوتر محمول / لابتوب' },
  { id: 'smartphone', label: 'هاتف ذكي' },
  { id: 'tablet', label: 'جهاز لوحي / تابلت' },
  { id: 'shared', label: 'جهاز مشترك' },
];

export default function VolunteerPortalPage() {
  const navigate = useNavigate();

  // Mode: null = Gatekeeper question, 'existing' = Current Teacher, 'new' = New Volunteer Application
  const [mode, setMode] = useState<'gatekeeper' | 'existing' | 'new'>('gatekeeper');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  // Form state for Current Teacher (Fast Onboarding)
  const [existingForm, setExistingForm] = useState({
    firstNameAr: '',
    lastNameAr: '',
    firstNameEn: '',
    lastNameEn: '',
    email: '',
    phone: '',
    password: '',
    teachingSubjects: [] as string[],
    currentCohortsDetails: '',
    notes: '',
    nationality: 'الجزائر',
  });

  // Form state for New Volunteer Teacher
  const [newForm, setNewForm] = useState({
    fullNameAr: '',
    fullNameEn: '',
    age: '',
    gender: 'male',
    email: '',
    phone: '',
    telegramId: '',
    nationality: 'الجزائر',
    teachingField: 'التعليم الثانوي - High school teaching',
    specialty: '',
    university: '',
    graduationYear: '',
    hasExperience: true,
    experienceYears: 'Between 5 and 10 years',
    experienceDetails: '',
    subjects: [] as string[],
    otherSubjects: '',
    preferredPlatform: 'Google Meet',
    sessionsPerWeek: 'Twice a week · مرتين',
    availableTimes: [] as string[],
    availableDays: [] as string[],
    preferredLanguage: '1 — Fusha Arabic only · الفصحى فقط',
    deviceType: [] as string[],
    internetReliability: 'Mostly stable — can handle video calls',
    motivation: '',
    discoveryChannel: '',
    additionalNotes: '',
    agreedToTerms: false,
  });

  const toggleSubject = (subjectLabel: string, isExisting: boolean) => {
    if (isExisting) {
      setExistingForm(prev => {
        const exists = prev.teachingSubjects.includes(subjectLabel);
        return {
          ...prev,
          teachingSubjects: exists 
            ? prev.teachingSubjects.filter(s => s !== subjectLabel)
            : [...prev.teachingSubjects, subjectLabel]
        };
      });
    } else {
      setNewForm(prev => {
        const exists = prev.subjects.includes(subjectLabel);
        return {
          ...prev,
          subjects: exists 
            ? prev.subjects.filter(s => s !== subjectLabel)
            : [...prev.subjects, subjectLabel]
        };
      });
    }
  };

  const toggleArrayItem = (key: 'availableTimes' | 'availableDays' | 'deviceType', val: string) => {
    setNewForm(prev => {
      const arr = prev[key];
      const exists = arr.includes(val);
      return {
        ...prev,
        [key]: exists ? arr.filter(item => item !== val) : [...arr, val]
      };
    });
  };

  const handleExistingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (existingForm.teachingSubjects.length === 0) {
      setErrorMessage('يُرجى تحديد مادة واحدة على الأقل تدرسها حالياً في برنامج باقون');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/volunteer/existing-teacher-onboard', existingForm);
      setSuccessResult({
        type: 'existing',
        message: res.data.message,
        user: res.data.user
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'تعذر تفعيل الحساب، يُرجى التأكد من البيانات المدخلة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newForm.agreedToTerms) {
      setErrorMessage('يُرجى الموافقة على شروط التطوع والتعهد الأكاديمي لإتمام إرسال الاستمارة');
      return;
    }

    if (newForm.subjects.length === 0) {
      setErrorMessage('يُرجى اختيار مادة واحدة على الأقل تستطيع تدريسها');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/volunteer/apply', newForm);
      setSuccessResult({
        type: 'new',
        message: res.data.message,
        telegramChannelUrl: res.data.telegramChannelUrl,
        whatsappGroupUrl: res.data.whatsappGroupUrl
      });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'تعذر إرسال الاستمارة، يرجى مراجعة الحقول الإلزامية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-3.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="باقون" className="h-10 w-auto object-contain" />
            <div>
              <span className="font-black text-baaqoon-800 dark:text-baaqoon-300 text-lg block leading-tight">باقــون</span>
              <span className="text-[10px] text-slate-500 font-bold block">مبادرة غزة الأكاديمية</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LangToggle />
            <Link 
              to="/login"
              className="px-3.5 py-1.5 text-xs font-bold text-baaqoon-700 dark:text-baaqoon-300 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-900/50 rounded-xl border border-baaqoon-200 dark:border-baaqoon-800 transition-all"
            >
              تسجيل الدخول
            </Link>
          </div>
        </header>

        {/* ─── SUCCESS SCREEN ─── */}
        {successResult && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-emerald-200 dark:border-emerald-800/50 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                {successResult.type === 'existing' ? 'تم تفعيل حسابك كمعلم بنجاح! 🎉' : 'تم استلام استمارتك بنجاح! 🌿'}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                {successResult.message}
              </p>
            </div>

            {successResult.type === 'existing' ? (
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/login"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm inline-flex items-center justify-center gap-2"
                >
                  <span>تسجيل الدخول إلى حسابك الآن</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xl mx-auto space-y-4 text-right">
                <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>الخطوة التالية المعتمدة:</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  بعد إكمال تعبئة هذا النموذج، يُرجى الانضمام إلى قناة التنسيق الخاصة بالمعلمين المتطوعين لمطابقة طلبك واعتماده من قبل الإدارة:
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a 
                    href="https://t.me/+TeachersForGaza" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>الانضمام لقناة التلغرام (Telegram)</span>
                  </a>
                  <a 
                    href="https://chat.whatsapp.com/TeachersForGaza" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>مجموعة الواتساب (WhatsApp)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── GATEKEEPER SCREEN (السؤال الأولي الإجباري) ─── */}
        {!successResult && mode === 'gatekeeper' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-8 animate-fade-in">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-baaqoon-100 dark:bg-baaqoon-900/40 text-baaqoon-800 dark:text-baaqoon-300 border border-baaqoon-200 dark:border-baaqoon-700">
                <HeartHandshake className="w-3.5 h-3.5 text-baaqoon-600" />
                <span>مبادرة تدريس طلبة قطاع غزة (Tawjihi Teachers For Gaza)</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
                أهلاً بك أستاذنا الفاضل في منصة باقون
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                حرصاً على تنظيم العمل الأكاديمي وتوفير وقتكم الثمين، يُرجى الإجابة عن السؤال الأولي التالي لتوجيهك للمسار الصحيح:
              </p>
            </div>

            {/* Gatekeeper Question Card */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 max-w-2xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-baaqoon-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  ؟
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    هل تدرس حالياً في برنامج باقون لطلبة غزة؟
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    اختر الإجابة المناسبة لمتابعة الإجراء المطلوب
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Option 1: Current Teacher */}
                <button
                  type="button"
                  onClick={() => { setMode('existing'); setErrorMessage(null); }}
                  className="group p-5 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl text-right transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm">
                        ١
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full dark:bg-emerald-900/60 dark:text-emerald-300">
                        معلم حالي
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                      نعم، أنا أدرس حالياً مع طلاب باقون
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      إذا كنت تدرس فعلياً في البرنامج وتريد تفعيل حسابك الرسمي على المنصة دون الحاجة لإعادة ملء الاستمارة الموسعة.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                    <span>متابعة التفعيل السريع</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Option 2: New Volunteer */}
                <button
                  type="button"
                  onClick={() => { setMode('new'); setErrorMessage(null); }}
                  className="group p-5 bg-white dark:bg-slate-900 hover:bg-baaqoon-50/50 dark:hover:bg-baaqoon-950/20 border-2 border-slate-200 dark:border-slate-700 hover:border-baaqoon-500 rounded-2xl text-right transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-lg bg-baaqoon-100 dark:bg-baaqoon-950 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center font-bold text-sm">
                        ٢
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-baaqoon-100 text-baaqoon-800 rounded-full dark:bg-baaqoon-900/60 dark:text-baaqoon-300">
                        متطوع جديد
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-baaqoon-600 transition-colors">
                      لا، أنا معلم جديد أرغب بالتطوع
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      هذا خيار المعلمين الجدد من الجزائر ودول شمال إفريقيا الراغبين في التطوع لتدريس طلبة غزة وفق شروط المبادرة.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-baaqoon-600 text-xs font-bold">
                    <span>تعبئة استمارة التطوع</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>

              </div>
            </div>
          </div>
        )}

        {/* ─── ERROR BANNER ─── */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-bold">{errorMessage}</span>
          </div>
        )}

        {/* ─── FORM 1: CURRENT TEACHER FAST REGISTRATION ─── */}
        {!successResult && mode === 'existing' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-black text-emerald-600 uppercase tracking-wider block">
                  مسار المعلمين الميدانيين الحاليين
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  تثبيت وتفعيل حساب المعلم الحالي في باقون
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMode('gatekeeper')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold flex items-center gap-1"
              >
                <span>العودة للسؤال</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleExistingSubmit} className="space-y-6">
              
              {/* Bilingual Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                    الاسم واللقب باللغة العربية <span className="text-rose-500">*</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="الاسم الأول (مثال: سهام)"
                      value={existingForm.firstNameAr}
                      onChange={e => setExistingForm({ ...existingForm, firstNameAr: e.target.value })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      required
                      placeholder="اللقب (مثال: مالكي)"
                      value={existingForm.lastNameAr}
                      onChange={e => setExistingForm({ ...existingForm, lastNameAr: e.target.value })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block text-left" dir="ltr">
                    Name in Latin (English / French)
                  </span>
                  <div className="grid grid-cols-2 gap-2" dir="ltr">
                    <input
                      type="text"
                      placeholder="First name (e.g. Sihem)"
                      value={existingForm.firstNameEn}
                      onChange={e => setExistingForm({ ...existingForm, firstNameEn: e.target.value })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Last name (e.g. Malki)"
                      value={existingForm.lastNameEn}
                      onChange={e => setExistingForm({ ...existingForm, lastNameEn: e.target.value })}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contact info & password */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    البريد الإلكتروني <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={existingForm.email}
                    onChange={e => setExistingForm({ ...existingForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الواتساب بالرمز الدولي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+213 555 123 456"
                    value={existingForm.phone}
                    onChange={e => setExistingForm({ ...existingForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور للحساب <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={existingForm.password}
                    onChange={e => setExistingForm({ ...existingForm, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Teaching Subject Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                  المادة أو المواد التي تدرسها حالياً في برنامج باقون: <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {AVAILABLE_SUBJECTS.map(s => {
                    const isSelected = existingForm.teachingSubjects.includes(s.label.split('·')[0].trim());
                    const shortName = s.label.split('·')[0].trim();
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => toggleSubject(shortName, true)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                          isSelected 
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{shortName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cohorts / Students description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  أسماء الأفواج أو الطلبة الذين تدرسهم حالياً (إن أمكن للمطابقة السريعة):
                </label>
                <textarea
                  rows={2}
                  placeholder="مثال: أدرس فوج كيمياء 12 علمي وفوج حادي عشر، مع الأستاذ المشرف..."
                  value={existingForm.currentCohortsDetails}
                  onChange={e => setExistingForm({ ...existingForm, currentCohortsDetails: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-normal outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('gatekeeper')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جاري التفعيل...</span>
                  ) : (
                    <>
                      <span>تأكيد وتفعيل الحساب الرسمي</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ─── FORM 2: NEW VOLUNTEER TEACHER (Tawjihi Teachers For Gaza) ─── */}
        {!successResult && mode === 'new' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200 dark:border-slate-800 space-y-8 animate-fade-in">
            
            {/* Header info from Google Form */}
            <div className="space-y-4 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-baaqoon-600 uppercase tracking-wider block">
                  استمارة التطوع المعتمدة · Tawjihi Teachers For Gaza - 2
                </span>
                <button
                  type="button"
                  onClick={() => setMode('gatekeeper')}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold flex items-center gap-1"
                >
                  <span>العودة للسؤال الأولي</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                استمارة التطوع لتدريس طلبة قطاع غزة (المنهاج الفلسطيني والأزهري)
              </h2>

              <div className="bg-baaqoon-50 dark:bg-baaqoon-950/40 p-4 rounded-2xl border border-baaqoon-200 dark:border-baaqoon-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
                <p>
                  <strong>ملاحظة توجيهية:</strong> هذا النموذج مخصص للمعلمين من الجزائر ودول شمال إفريقيا الراغبين في التطوع لتدريس طلبة من قطاع غزة. هذه المبادرة مخصصة للدروس التعليمية التطوعية فقط، ولا يترتب عليها أي دعم أو مقابل مالي. ستساعدنا المعلومات التي تقدمها أدناه في اختيار الطالب أو الفوج المناسب لك، وسيكون التدريس وفق المنهاج المعتمد في غزة.
                </p>
                <p className="text-[11px] text-baaqoon-700 dark:text-baaqoon-400 font-bold">
                  الهدف الأسمى هو دعم الطلاب لمواصلة التعلم في ظل عدم توفر المدارس بسبب الحرب.
                </p>
              </div>
            </div>

            <form onSubmit={handleNewSubmit} className="space-y-8">
              
              {/* Section 1: Personal Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-baaqoon-100 dark:bg-baaqoon-900 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center text-xs">١</span>
                  <span>البيانات الشخصية وهواية المعلم</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الاسم الكامل بالعربية · Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="الاسم واللقب بالأحرف العربية"
                      value={newForm.fullNameAr}
                      onChange={e => setNewForm({ ...newForm, fullNameAr: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 text-left" dir="ltr">
                      Full Name in Latin (English / French) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ahmed Benali"
                      value={newForm.fullNameEn}
                      onChange={e => setNewForm({ ...newForm, fullNameEn: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      العمر · Age <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={18}
                      max={80}
                      placeholder="مثال: 32"
                      value={newForm.age}
                      onChange={e => setNewForm({ ...newForm, age: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الجنس · Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newForm.gender}
                      onChange={e => setNewForm({ ...newForm, gender: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    >
                      <option value="male">ذكر · Male</option>
                      <option value="female">أنثى · Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      الدولة / الجنسية · Country <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="الجزائر، تونس، المغرب..."
                      value={newForm.nationality}
                      onChange={e => setNewForm({ ...newForm, nationality: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      البريد الإلكتروني · Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="teacher@example.com"
                      value={newForm.email}
                      onChange={e => setNewForm({ ...newForm, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      رقم الواتساب بالرمز الدولي · WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+213 5X XXX XXXX"
                      value={newForm.phone}
                      onChange={e => setNewForm({ ...newForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500 text-left"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      معرف التلغرام · Telegram ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="@username"
                      value={newForm.telegramId}
                      onChange={e => setNewForm({ ...newForm, telegramId: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500 text-left"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Education & Experience */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-baaqoon-100 dark:bg-baaqoon-900 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center text-xs">٢</span>
                  <span>المؤهل العلمي والخبرة في التدريس</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ما تخصصك؟ · Specialty <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رياضيات، علوم فيزيائية..."
                      value={newForm.specialty}
                      onChange={e => setNewForm({ ...newForm, specialty: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      في أيّ جامعة درست؟ · University <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="اسم الجامعة أو المدرسة العليا"
                      value={newForm.university}
                      onChange={e => setNewForm({ ...newForm, university: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      في أيّ سنة تخرجت؟ · Graduation year <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 2018"
                      value={newForm.graduationYear}
                      onChange={e => setNewForm({ ...newForm, graduationYear: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      كم عام خبرة في التدريس؟ · Experience Years <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newForm.experienceYears}
                      onChange={e => setNewForm({ ...newForm, experienceYears: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    >
                      <option value="<1 less than one year">أقل من عام · Less than 1 year</option>
                      <option value="1 one year">عام واحد · 1 year</option>
                      <option value="2 two years">عامان · 2 years</option>
                      <option value="3 three years">3 أعوام · 3 years</option>
                      <option value="4 four years">4 أعوام · 4 years</option>
                      <option value="Between 5 and 10 years">من 5 إلى 10 سنوات · Between 5 and 10 years</option>
                      <option value=">10 more than 10 years">أكثر من 10 سنوات · More than 10 years</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      لغة التدريس المفضلة · Language <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newForm.preferredLanguage}
                      onChange={e => setNewForm({ ...newForm, preferredLanguage: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    >
                      <option value="1 — Fusha Arabic only · الفصحى فقط">1 — الفصحى فقط · Fusha Arabic only</option>
                      <option value="2 — Fusha Arabic and English · الفصحى والإنجليزية">2 — الفصحى والإنجليزية · Arabic & English</option>
                      <option value="3 — English only · الإنجليزية فقط">3 — الإنجليزية فقط · English only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تكلم عن خبرتك في التدريس؟ · Talk about your experience <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="نبذة عن المراحل التعليمية والمواد والمؤسسات التي درّست فيها..."
                    value={newForm.experienceDetails}
                    onChange={e => setNewForm({ ...newForm, experienceDetails: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-normal outline-none focus:ring-2 focus:ring-baaqoon-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Section 3: Subjects & Availability */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-baaqoon-100 dark:bg-baaqoon-900 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center text-xs">٣</span>
                  <span>المواد التي تستطيع المساعدة فيها وأوقات التفرغ</span>
                </h3>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                    المواد التي تستطيع التدريس فيها؟ (اختر كل ما يناسبك): <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {AVAILABLE_SUBJECTS.map(s => {
                      const isSelected = newForm.subjects.includes(s.label.split('·')[0].trim());
                      const shortName = s.label.split('·')[0].trim();
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggleSubject(shortName, false)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-baaqoon-50 dark:bg-baaqoon-950/60 border-baaqoon-500 text-baaqoon-800 dark:text-baaqoon-300 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span>{shortName}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-baaqoon-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      منصة الدروس المفضلة لديك · Preferred platform <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newForm.preferredPlatform}
                      onChange={e => setNewForm({ ...newForm, preferredPlatform: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Zoom">Zoom</option>
                      <option value="WhatsApp only (voice/video calls)">WhatsApp only · واتساب فقط</option>
                      <option value="I'm flexible — tutor can decide">مرن بحسب رغبة الطلاب والمشرف</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      كم مرة في الأسبوع ترغب بالتدريس؟ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newForm.sessionsPerWeek}
                      onChange={e => setNewForm({ ...newForm, sessionsPerWeek: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    >
                      <option value="Once a week · مرة واحدة">مرة واحدة أسبوعياً · Once a week</option>
                      <option value="Twice a week · مرتين">مرتان أسبوعياً · Twice a week</option>
                      <option value="3 times a week · ثلاث مرات">3 مرات أسبوعياً · 3 times a week</option>
                    </select>
                  </div>
                </div>

                {/* Available Times */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    أوقات تفرغك بتوقيت غزة (اختر كل ما يناسبك):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const isChecked = newForm.availableTimes.includes(slot.id);
                      return (
                        <label 
                          key={slot.id}
                          className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                            isChecked
                              ? 'bg-baaqoon-50 dark:bg-baaqoon-950/60 border-baaqoon-500 text-baaqoon-800 dark:text-baaqoon-300'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleArrayItem('availableTimes', slot.id)}
                            className="w-3.5 h-3.5 text-baaqoon-600 rounded cursor-pointer"
                          />
                          <span>{slot.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Available Days */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    أيام تفرغك (بتوقيت غزة):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DAYS_OF_WEEK.map(day => {
                      const isChecked = newForm.availableDays.includes(day.id);
                      return (
                        <label 
                          key={day.id}
                          className={`p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-2 ${
                            isChecked
                              ? 'bg-baaqoon-50 dark:bg-baaqoon-950/60 border-baaqoon-500 text-baaqoon-800 dark:text-baaqoon-300'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleArrayItem('availableDays', day.id)}
                            className="w-3.5 h-3.5 text-baaqoon-600 rounded cursor-pointer"
                          />
                          <span>{day.label.split('-')[0].trim()}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 4: Device, Internet & Motivation */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-baaqoon-100 dark:bg-baaqoon-900 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center text-xs">٤</span>
                  <span>اللوجستيات والدافع الشخصي</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      مستوى استقرار الإنترنت لديك · Internet reliability
                    </label>
                    <select
                      value={newForm.internetReliability}
                      onChange={e => setNewForm({ ...newForm, internetReliability: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    >
                      <option value="Mostly stable — can handle video calls">مستقر غالباً — يتحمل مكالمات الفيديو</option>
                      <option value="Intermittent — sometimes cuts out">متقطع أحياناً</option>
                      <option value="Very limited — audio or text only">محدود — صوتي أو نصي فقط</option>
                      <option value="Varies day to day">يختلف من يوم لآخر</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      كيف سمعتَ عن هذه المبادرة؟
                    </label>
                    <input
                      type="text"
                      placeholder="فيسبوك، تلغرام، زميل معلم..."
                      value={newForm.discoveryChannel}
                      onChange={e => setNewForm({ ...newForm, discoveryChannel: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    لماذا أنت مهتم بتدريس طلاب غزة؟ <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="كلمات نابعة من القلب تعبر عن دافعك الإنساني والأكاديمي..."
                    value={newForm.motivation}
                    onChange={e => setNewForm({ ...newForm, motivation: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-normal outline-none focus:ring-2 focus:ring-baaqoon-500 leading-relaxed"
                  />
                </div>
              </div>

              {/* Section 5: Terms & Voluntary Pledge */}
              <div className="bg-amber-50 dark:bg-amber-950/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>الشروط والتعهد الأكاديمي التطوعي:</span>
                </h4>
                <ul className="text-[11px] text-amber-800 dark:text-amber-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>التدريس تطوعي بالكامل ولا يترتب عليه أي دعم أو مقابل مالي.</li>
                  <li>الالتزام بالتدريس لمدة عام دراسي كامل 2026-2027 بحسب القدرة والإمكانية.</li>
                  <li>عدم معاملة الطلبة على أنهم ضحايا، بل باحترام تام ومساواة تربوية كاملة.</li>
                  <li>عدم سؤال الطلبة عن مكان وجودهم أو أي معلومات تمس خصوصيتهم وظروفهم.</li>
                  <li>يمنع تصوير الطلبة أو تسجيل الحصص أو نشر أي صور أو تسجيلات بأي شكل.</li>
                  <li>التدريس وفق المنهاج الفلسطيني الحكومي أو المنهاج الأزهري المعتمدين.</li>
                </ul>

                <label className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={newForm.agreedToTerms}
                    onChange={e => setNewForm({ ...newForm, agreedToTerms: e.target.checked })}
                    className="w-4 h-4 text-baaqoon-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    قرأتُ الشروط والضوابط أعلاه وأتعهد بالالتزام التام بها كمتطوع تدريسي. <span className="text-rose-500">*</span>
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('gatekeeper')}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-baaqoon-600 hover:bg-baaqoon-700 text-white text-xs font-bold rounded-xl shadow-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جاري إرسال الاستمارة...</span>
                  ) : (
                    <>
                      <span>إرسال استمارة التطوع</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        )}

      </div>
    </div>
  );
}
