import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  HeartHandshake, BookOpen, UserCheck, ShieldCheck, CheckCircle2, 
  ArrowLeft, ArrowRight, Send, AlertCircle, Sparkles, MessageSquare, 
  Phone, Mail, GraduationCap, Clock, Calendar, Laptop, Wifi, HelpCircle,
  Users, ChevronDown, Check, Globe, Eye, EyeOff, Search, Lock, User
} from 'lucide-react';
import logo from '../../../assets/logo.png';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';
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

const NATIONALITIES = [
  'فلسطيني', 'أردني', 'مصري', 'سعودي', 'إماراتي', 'كويتي', 'عماني', 'قطري', 'بحريني', 
  'يمني', 'عراقي', 'سوري', 'لبناني', 'سوداني', 'ليبي', 'تونسي', 'جزائري', 'مغربي', 
  'موريتاني', 'بريطاني', 'كندي', 'أمريكي', 'تركي', 'ألماني', 'فرنسي', 'سويدي', 
  'هولندي', 'أجنبي (أخرى)'
];

export default function VolunteerPortalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  // Mode: 'gatekeeper' = selector, 'new' = New Volunteer Application, 'status' = Application Status & Completion
  const [mode, setMode] = useState<'gatekeeper' | 'new' | 'status'>('gatekeeper');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any>(null);

  // Status check & Completion state
  const [statusIdentifier, setStatusIdentifier] = useState('');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusResult, setStatusResult] = useState<any>(null);

  const [completionForm, setCompletionForm] = useState({
    firstNameAr: '',
    lastNameAr: '',
    firstNameEn: '',
    lastNameEn: '',
    nationality: 'فلسطيني',
    password: '',
    confirmPassword: '',
  });
  const [showCompletionPassword, setShowCompletionPassword] = useState(false);
  const [showCompletionConfirmPassword, setShowCompletionConfirmPassword] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionSuccess, setCompletionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab') || searchParams.get('action');
    if (tab === 'status' || tab === 'check') {
      setMode('status');
    } else if (tab === 'new' || tab === 'apply') {
      setMode('new');
    }
  }, [searchParams]);

  // Dynamic subjects from backend database
  const [dbSubjects, setDbSubjects] = useState<Array<{ id: string; nameAr: string; nameEn?: string; code: string }>>([]);

  useEffect(() => {
    api.get('/volunteer/subjects-list')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setDbSubjects(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const subjectsList = dbSubjects.length > 0
    ? dbSubjects.map(s => ({
        id: s.id,
        label: s.nameEn ? `${s.nameAr} · ${s.nameEn}` : s.nameAr,
        cleanName: s.nameAr,
      }))
    : AVAILABLE_SUBJECTS.map(s => ({
        id: s.id,
        label: s.label,
        cleanName: s.label.split('·')[0].trim(),
      }));

  // Form state for New Volunteer Teacher
  const [newForm, setNewForm] = useState({
    isExistingBaaqoonTeacher: false,
    currentCohortsDetails: '',
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

  const toggleSubject = (subjectLabel: string) => {
    setNewForm(prev => {
      const exists = prev.subjects.includes(subjectLabel);
      return {
        ...prev,
        subjects: exists 
          ? prev.subjects.filter(s => s !== subjectLabel)
          : [...prev.subjects, subjectLabel]
      };
    });
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
      const payload = {
        ...newForm,
        additionalNotes: newForm.isExistingBaaqoonTeacher && newForm.currentCohortsDetails
          ? `[أستاذ ميداني حالي في باقون - أفواج/مشرف: ${newForm.currentCohortsDetails}] ${newForm.additionalNotes || ''}`
          : newForm.additionalNotes,
      };
      const res = await api.post('/volunteer/apply', payload);
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

  const handleCheckStatus = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!statusIdentifier.trim()) {
      setErrorMessage('يُرجى إدخال البريد الإلكتروني أو رقم الهاتف للاستعلام');
      return;
    }

    setIsCheckingStatus(true);
    setErrorMessage(null);
    setStatusResult(null);
    setCompletionSuccess(null);

    try {
      const res = await api.get('/volunteer/application-status', {
        params: { identifier: statusIdentifier.trim() },
      });
      setStatusResult(res.data);
      if (res.data.found && res.data.application) {
        setCompletionForm(prev => ({
          ...prev,
          firstNameAr: res.data.application.firstNameAr || '',
          lastNameAr: res.data.application.lastNameAr || '',
          firstNameEn: res.data.application.firstNameEn || '',
          lastNameEn: res.data.application.lastNameEn || '',
          nationality: res.data.application.nationality || 'فلسطيني',
        }));
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'تعذر الاستعلام عن حالة الطلب، يُرجى المحاولة لاحقاً');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!completionForm.password || completionForm.password.length < 8) {
      setErrorMessage('كلمة المرور يجب أن تتكون من 8 خانات على الأقل');
      return;
    }

    if (completionForm.password !== completionForm.confirmPassword) {
      setErrorMessage('كلمة المرور وتأكيد كلمة المرور غير متطابقتين، يُرجى التأكد من تطابقهما بدقة');
      return;
    }

    if (!statusResult?.application?.id) {
      setErrorMessage('بيانات الاستمارة غير مكتملة، يُرجى إعادة فحص حالة الطلب');
      return;
    }

    setIsCompleting(true);
    try {
      const res = await api.post('/volunteer/complete-registration', {
        applicationId: statusResult.application.id,
        identifier: statusIdentifier.trim(),
        ...completionForm,
      });

      const { accessToken, user, message } = res.data;
      setAuth(user, accessToken);
      setCompletionSuccess(message || 'تم تعيين كلمة المرور وتفعيل حساب الأستاذ بنجاح!');

      setTimeout(() => {
        navigate('/teacher/dashboard');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'حدث خطأ أثناء استكمال التسجيل وتعيين كلمة المرور');
    } finally {
      setIsCompleting(false);
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

        {/* Top Navigation Mode Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('gatekeeper'); setErrorMessage(null); }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'gatekeeper'
                ? 'bg-baaqoon-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🏠 البوابة الرئيسية
          </button>
          <button
            type="button"
            onClick={() => { setMode('new'); setErrorMessage(null); }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'new'
                ? 'bg-baaqoon-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🌿 تقديم استمارة جديدة
          </button>
          <button
            type="button"
            onClick={() => { setMode('status'); setErrorMessage(null); }}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'status'
                ? 'bg-amber-600 text-white shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🔍 متابعة حالة الطلب / استكمال التسجيل
          </button>
        </div>

        {/* ─── SUCCESS SCREEN ─── */}
        {successResult && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-emerald-200 dark:border-emerald-800/50 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                تم استلام استمارتك بنجاح! 🌿
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
                {successResult.message}
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xl mx-auto space-y-4 text-right">
              <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>الخطوة التالية المعتمدة:</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                بعد إكمال تعبئة هذا النموذج، يُرجى الانضمام إلى قناة التنسيق الخاصة بالأساتذة المتطوعين لمطابقة طلبك واعتماده من قبل الإدارة:
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
                حرصاً على تنظيم العمل الأكاديمي وتوفير وقتكم الثمين، يُرجى اختيار المسار المناسب لك للمتابعة:
              </p>
            </div>

            {/* Gatekeeper Options Grid */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700/80 max-w-3xl mx-auto space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-baaqoon-500 text-white flex items-center justify-center font-black text-lg shadow-md shrink-0">
                  ؟
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    كيف ترغب بمتابعة إجراءاتك الأكاديمية؟
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    اختر الإجراء المناسب للانطلاق مباشرة
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
                
                {/* Option 1: New Volunteer */}
                <button
                  type="button"
                  onClick={() => { setMode('new'); setErrorMessage(null); }}
                  className="group p-5 bg-white dark:bg-slate-900 hover:bg-baaqoon-50/50 dark:hover:bg-baaqoon-950/20 border-2 border-slate-200 dark:border-slate-700 hover:border-baaqoon-500 rounded-2xl text-right transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-baaqoon-100 dark:bg-baaqoon-950 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center font-bold text-xs">
                        ١
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-baaqoon-100 text-baaqoon-800 rounded-full dark:bg-baaqoon-900/60 dark:text-baaqoon-300">
                        متطوع جديد
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-baaqoon-600 transition-colors">
                      أنا أستاذ أرغب بالتطوع لتدريس طلبة غزة
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      تقديم استمارة انضمام أكاديمية جديدة لتدريس طلبة غزة وفق شروط المبادرة وتدقيق المشرف الأكاديمي.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-baaqoon-600 text-xs font-bold">
                    <span>تعبئة الاستمارة الأكاديمية</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Option 2: Status & Complete Registration */}
                <button
                  type="button"
                  onClick={() => { setMode('status'); setErrorMessage(null); }}
                  className="group p-5 bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 rounded-2xl text-right transition-all shadow-sm hover:shadow-md cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                        ٢
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full dark:bg-amber-900/60 dark:text-amber-300">
                        متابعة واعتماد
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      متابعة الطلب / استكمال التسجيل
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      فحص نتيجة دراسة الملف الأكاديمي، أو تعيين كلمة المرور واستكمال الحساب للمعتمدين من الإدارة.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                    <span>الاستعلام والاستكمال</span>
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
                  <strong>ملاحظة توجيهية:</strong> هذا النموذج مخصص للأساتذة من الجزائر ودول شمال إفريقيا الراغبين في التطوع لتدريس طلبة من قطاع غزة. هذه المبادرة مخصصة للدروس التعليمية التطوعية فقط، ولا يترتب عليها أي مقابل مالي، مع إمكانية الاستفادة من الدعم الأكاديمي في إطار التكوين والتمكين المهني وشهادات الخبرة والتقدير المعتمدة. ستساعدنا المعلومات التي تقدمها أدناه في اختيار الطالب أو الفوج المناسب لك، وسيكون التدريس وفق المنهاج المعتمد في غزة.
                </p>
                <p className="text-[11px] text-baaqoon-700 dark:text-baaqoon-400 font-bold">
                  الهدف الأسمى هو دعم الطلاب لمواصلة التعلم في ظل عدم توفر المدارس بسبب الحرب.
                </p>
              </div>
            </div>

            <form onSubmit={handleNewSubmit} className="space-y-8">
              
              {/* Field Teacher Status Toggle */}
              <div className={`p-4 rounded-2xl border transition-all ${
                newForm.isExistingBaaqoonTeacher 
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
              }`}>
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newForm.isExistingBaaqoonTeacher}
                    onChange={e => setNewForm({ ...newForm, isExistingBaaqoonTeacher: e.target.checked })}
                    className="w-5 h-5 mt-0.5 text-emerald-600 rounded cursor-pointer shrink-0 accent-emerald-600"
                  />
                  <div className="space-y-1">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
                      هل تدرس حالياً مع طلاب باقون في الميدان؟ (تثبيت حساب أستاذ ميداني قائم)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-relaxed">
                      إذا كنت تدرس بالفعل أحد الأفواج، فعّل هذا الخيار ليتم تمييز طلبك بوسم «أستاذ حالي» لمطابقة أفواجك واعتماد حسابك بأولوية فورية من المشرف الأكاديمي.
                    </span>
                  </div>
                </label>

                {newForm.isExistingBaaqoonTeacher && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 animate-fade-in space-y-1.5">
                    <label className="block text-xs font-bold text-emerald-900 dark:text-emerald-300">
                      اسم المشرف الميداني أو أسماء الأفواج التي تدرسها حالياً (إن أمكن للتدقيق والمطابقة السريعة):
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: أدرس فوج كيمياء 12 علمي مع الأستاذ المشرف..."
                      value={newForm.currentCohortsDetails}
                      onChange={e => setNewForm({ ...newForm, currentCohortsDetails: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              {/* Section 1: Personal Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-baaqoon-100 dark:bg-baaqoon-900 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center text-xs">١</span>
                  <span>البيانات الشخصية والتعريفية للأستاذ</span>
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
                    {subjectsList.map(s => {
                      const isSelected = newForm.subjects.includes(s.cleanName);
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => toggleSubject(s.cleanName)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center justify-between ${
                            isSelected 
                              ? 'bg-baaqoon-50 dark:bg-baaqoon-950/60 border-baaqoon-500 text-baaqoon-800 dark:text-baaqoon-300 shadow-sm'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <span>{s.cleanName}</span>
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
                      placeholder="فيسبوك، تلغرام، زميل أستاذ..."
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
              <div className="bg-amber-50 dark:bg-amber-950/30 p-5 sm:p-6 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/70 dark:border-amber-800/50 pb-3">
                  <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                    <span>الشروط والتعهد الأكاديمي التطوعي:</span>
                  </h4>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 rounded-lg">
                    ميثاق أخلاقي وتربوي ملزم
                  </span>
                </div>

                <div className="space-y-3 text-[11px] sm:text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  
                  {/* بند 1: طبيعة التطوع والتكوين */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      ١
                    </span>
                    <p>
                      <strong>طبيعة العمل والتكوين:</strong> التدريس تطوعي بالكامل ومخصص لخدمة طلبة غزة دون أي مقابل مالي، مع إمكانية الاستفادة من <strong>الدعم الأكاديمي في إطار التكوين والتمكين المهني</strong>، ورشات التطوير المستمر، ونيل شهادات خبرة وتقدير معتمدة من إدارة المبادرة والمنصة.
                    </p>
                  </div>

                  {/* بند 2: الالتزام الأكاديمي */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      ٢
                    </span>
                    <p>
                      <strong>الالتزام الأكاديمي:</strong> الالتزام بالتدريس لمدة عام دراسي كامل 2026-2027 بحسب استطاعة وتفرغ الأستاذ وقدرته.
                    </p>
                  </div>

                  {/* بند 3: الكرامة والمساواة */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      ٣
                    </span>
                    <p>
                      <strong>الكرامة والمساواة التربوية:</strong> عدم معاملة الطلبة على أنهم ضحايا، بل باحترام تام ومساواة تربوية كاملة كأي طالب في العالم، وزرع الأمل والعزيمة لديهم.
                    </p>
                  </div>

                  {/* بند 4: أمان وخصوصية الطلبة */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      ٤
                    </span>
                    <p>
                      <strong>أمان وخصوصية الطلبة:</strong> عدم سؤال الطلبة عن مكان وجودهم الدقيق أو أي معلومات تمس سلامتهم وأمنهم وخصوصيتهم وظروفهم الميدانية.
                    </p>
                  </div>

                  {/* بند 5: التوضيح الحاسم بشأن تصوير الحصص مقابل الدروس المسجلة */}
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-300 dark:border-amber-700/60 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <span className="text-amber-600 text-sm">🎥</span>
                      <span>توضيح هام يرفع أي تناقض بشأن تسجيل الحصص مقابل «تسجيل الدروس المسجلة»:</span>
                    </div>

                    <div className="space-y-2 pr-4 border-r-2 border-amber-400">
                      <div className="text-rose-700 dark:text-rose-300">
                        <span className="font-black block mb-0.5">🚫 أثناء الحصص التفاعلية المباشرة (مع الطلبة):</span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300">
                          يُمنع قطعياً تصوير وجوه الطلبة أو تسجيل أصواتهم أو التقاط شاشاتهم أو نشر أي صور أو تسجيلات للحصص المباشرة على وسائل التواصل الاجتماعي، حمايةً لأمانهم وخصوصيتهم الشخصية في ظروف الحرب.
                        </p>
                      </div>

                      <div className="text-emerald-700 dark:text-emerald-300">
                        <span className="font-black block mb-0.5">✅ ميزة «تسجيل الدروس المسجلة» المتاحة في المنصة:</span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300">
                          هي ميزة أكاديمية مخصصة ومطلوبة، يقوم فيها الأستاذ بتسجيل شروحاته المقررة <strong>منفرداً</strong> (شرح الأستاذ للمادة فقط دون حضور أو تصوير أي طالب) لتُرفع حصرياً داخل بنك الدروس بالمنصة، بهدف مساعدة الطلبة الذين يعانون من انقطاع الإنترنت أو التيار الكهربائي في غزة لمشاهدة الشرح لاحقاً.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* بند 6: المنهاج */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-300 flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">
                      ٦
                    </span>
                    <p>
                      <strong>المنهاج المعتمد:</strong> التدريس وفق المنهاج الفلسطيني المعتمد (أو المنهاج الأزهري المعتمد لغزة) للثانوية العامة والتوجيهي.
                    </p>
                  </div>

                </div>

                <label className="flex items-center gap-2 pt-3 border-t border-amber-200 dark:border-amber-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={newForm.agreedToTerms}
                    onChange={e => setNewForm({ ...newForm, agreedToTerms: e.target.checked })}
                    className="w-4 h-4 text-baaqoon-600 rounded cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    قرأتُ الشروط والضوابط الأكاديمية أعلاه وأتعهد بالالتزام التام بها كمتطوع تدريسي. <span className="text-rose-500">*</span>
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

        {/* ─── MODE: STATUS INQUIRY & REGISTRATION COMPLETION ─── */}
        {!successResult && mode === 'status' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-black text-amber-600 uppercase tracking-wider block">
                  بوابة المتابعة واعتماد الأساتذة
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  الاستعلام عن حالة الطلب واستكمال التسجيل
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMode('gatekeeper')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>العودة للرئيسية</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Search Box */}
            <form onSubmit={handleCheckStatus} className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                أدخل البريد الإلكتروني أو رقم الهاتف الذي قدمت به الاستمارة <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="example@domain.com أو +970..."
                    value={statusIdentifier}
                    onChange={e => setStatusIdentifier(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-amber-500 text-left"
                    dir="ltr"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCheckingStatus}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCheckingStatus ? (
                    <span>جاري الفحص...</span>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>فحص حالة الملف</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Status Result Display */}
            {statusResult && !statusResult.found && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <div>
                  <span className="font-black block mb-0.5">لم يتم العثور على استمارة مطابقة</span>
                  <p className="text-[11px] leading-relaxed">{statusResult.message}</p>
                </div>
              </div>
            )}

            {statusResult && statusResult.found && (
              <div className="space-y-4 animate-fade-in">
                {/* 1. Pending */}
                {statusResult.status === 'pending' && (
                  <div className="p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 font-black text-amber-800 dark:text-amber-300 text-sm">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span>طلبكم قيد الدراسة والتدقيق الأكاديمي ⏳</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      نرحب بكم أستاذنا الفاضل «{statusResult.application.fullNameAr || statusResult.application.fullNameEn}». تم استلام استمارتكم لمادة ({statusResult.application.subjects?.join('، ')}) بنجاح، وهي حالياً قيد المراجعة والتدقيق لدى المشرف التربوي المختص وإدارة المنصة.
                    </p>
                    <div className="text-[11px] text-slate-500 font-bold pt-2 border-t border-amber-200 dark:border-amber-800/40 flex items-center justify-between">
                      <span>تاريخ تقديم الطلب: {new Date(statusResult.application.createdAt).toLocaleDateString('ar-EG')}</span>
                      <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-full font-black text-[10px]">قيد المراجعة</span>
                    </div>
                  </div>
                )}

                {/* 2. Supervisor Approved */}
                {statusResult.status === 'supervisor_approved' && (
                  <div className="p-6 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 font-black text-sky-800 dark:text-sky-300 text-sm">
                      <Sparkles className="w-5 h-5 text-sky-600" />
                      <span>توصية بالقبول من المشرف التربوي 🎯</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      أتم المشرف التربوي المختص دراسة ملفكم وأوصى باعتمادكم لتدريس مادة ({statusResult.application.assignedSubject?.nameAr || statusResult.application.subjects?.join('، ')}). الملف حالياً بانتظار التأكيد الإداري النهائي من إدارة المنصة لتتمكن من تعيين كلمة المرور.
                    </p>
                    <div className="text-[11px] text-slate-500 font-bold pt-2 border-t border-sky-200 dark:border-sky-800/40 flex items-center justify-between">
                      <span>الحالة: معتمد من المشرف التربوي</span>
                      <span className="px-2.5 py-0.5 bg-sky-200 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 rounded-full font-black text-[10px]">بانتظار التأكيد الإداري</span>
                    </div>
                  </div>
                )}

                {/* 3. Rejected */}
                {statusResult.status === 'rejected' && (
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-200 text-sm">
                      <HeartHandshake className="w-5 h-5 text-baaqoon-600" />
                      <span>شكراً لمبادرتكم الكريمة ونبيل عطائكم 🤍</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      نشكر لكم مبادرتكم الكريمة ورغبتكم الصادقة في إسناد وتدريس طلبة غزة. نعتذر منكم عن تعذر قبول الملف في هذه الدورة لانشغال الشواغر التدريسية أو عدم توفر أفواج تطابق التخصص والجدول المتاح في الوقت الراهن. سيبقى ملفكم محفوظاً لدى إدارة المنصة للدورات القادمة بإذن الله.
                    </p>
                    {statusResult.application.rejectionReason && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        <strong className="block text-slate-800 dark:text-white mb-0.5">توضيح المشرف:</strong>
                        <span>{statusResult.application.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Approved & Already Completed */}
                {statusResult.status === 'approved' && statusResult.isCompleted && (
                  <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>حسابكم مفعل ومكتمل وجاهز للتدريس 🎓</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      أستاذنا الفاضل «{statusResult.application.fullNameAr || statusResult.application.fullNameEn}»، حسابكم معتمد ومكتمل في مادة {statusResult.application.assignedSubject?.nameAr || statusResult.application.subjects?.join('، ')}. يمكنك تسجيل الدخول إلى منصة التدريس مباشرة بكلمة المرور الخاصة بكم.
                    </p>
                    <div className="pt-2">
                      <Link
                        to="/login"
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                      >
                        <span>تسجيل الدخول إلى حسابك</span>
                        <ArrowLeft className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* 5. Approved & Needs Completion */}
                {statusResult.status === 'approved' && !statusResult.isCompleted && (
                  <div className="space-y-6">
                    {/* Approval Celebration Card */}
                    <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                        🎓
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="font-black text-sm text-emerald-900 dark:text-emerald-200">
                            مبارك! تم اعتمادكم أستاذاً رسمياً في منصة باقون 🎉
                          </h3>
                          {statusResult.application.assignedSubject && (
                            <span className="px-3 py-1 bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 rounded-full font-black text-xs">
                              المادة المعتمدة: {statusResult.application.assignedSubject.nameAr}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          أهلاً بك أ. {statusResult.application.fullNameAr || statusResult.application.fullNameEn}! تم اعتماد ملفكم الأكاديمي بنجاح. يُرجى تعيين كلمة المرور الخاصة بكم واستكمال أي بيانات ناقصة لتفعيل الحساب والانطلاق مباشرة.
                        </p>
                      </div>
                    </div>

                    {completionSuccess && (
                      <div className="p-4 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-bold animate-fade-in">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{completionSuccess}</span>
                      </div>
                    )}

                    {/* Completion Form */}
                    <form onSubmit={handleCompleteRegistration} className="space-y-5 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                      <div className="border-b border-slate-200 dark:border-slate-700 pb-3">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-600" />
                          <span>واجهة استكمال التسجيل وتعيين كلمة المرور</span>
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          عين كلمة مرور قوية لحسابك وتحقق من صحة الاسم والجنسية
                        </span>
                      </div>

                      {/* Names Ar & En */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            الاسم بالعربية <span className="text-rose-500">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              placeholder="الاسم الأول"
                              value={completionForm.firstNameAr}
                              onChange={e => setCompletionForm({ ...completionForm, firstNameAr: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                            />
                            <input
                              type="text"
                              required
                              placeholder="اللقب / العائلة"
                              value={completionForm.lastNameAr}
                              onChange={e => setCompletionForm({ ...completionForm, lastNameAr: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            الاسم بالأحرف اللاتينية (English / Latin)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="First Name"
                              value={completionForm.firstNameEn}
                              onChange={e => setCompletionForm({ ...completionForm, firstNameEn: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none text-left"
                              dir="ltr"
                            />
                            <input
                              type="text"
                              placeholder="Last Name"
                              value={completionForm.lastNameEn}
                              onChange={e => setCompletionForm({ ...completionForm, lastNameEn: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none text-left"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Nationality */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          الجنسية <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={completionForm.nationality}
                          onChange={e => setCompletionForm({ ...completionForm, nationality: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none cursor-pointer"
                        >
                          {NATIONALITIES.map(nat => (
                            <option key={nat} value={nat}>{nat}</option>
                          ))}
                        </select>
                      </div>

                      {/* Password & Confirm Password */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            كلمة المرور الجديدة (8 خانات على الأقل) <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showCompletionPassword ? 'text' : 'password'}
                              required
                              minLength={8}
                              placeholder="••••••••"
                              value={completionForm.password}
                              onChange={e => setCompletionForm({ ...completionForm, password: e.target.value })}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none text-left pr-10"
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCompletionPassword(!showCompletionPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                              {showCompletionPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            تأكيد كلمة المرور الجديدة <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showCompletionConfirmPassword ? 'text' : 'password'}
                              required
                              minLength={8}
                              placeholder="••••••••"
                              value={completionForm.confirmPassword}
                              onChange={e => setCompletionForm({ ...completionForm, confirmPassword: e.target.value })}
                              className={`w-full px-3.5 py-2.5 rounded-xl border ${
                                completionForm.confirmPassword && completionForm.password !== completionForm.confirmPassword
                                  ? 'border-rose-400 focus:ring-rose-500'
                                  : completionForm.confirmPassword && completionForm.password === completionForm.confirmPassword
                                  ? 'border-emerald-500 focus:ring-emerald-500'
                                  : 'border-slate-200 dark:border-slate-700'
                              } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none text-left pr-10`}
                              dir="ltr"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCompletionConfirmPassword(!showCompletionConfirmPassword)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                              {showCompletionConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {completionForm.confirmPassword && (
                            <div className="text-[11px] font-bold flex items-center gap-1 mt-1">
                              {completionForm.password === completionForm.confirmPassword ? (
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

                      <div className="pt-3 flex justify-end">
                        <button
                          type="submit"
                          disabled={isCompleting}
                          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isCompleting ? (
                            <span>جاري تفعيل الحساب...</span>
                          ) : (
                            <>
                              <span>تأكيد واستكمال الحساب والدخول لمنصة التدريس</span>
                              <ArrowLeft className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
