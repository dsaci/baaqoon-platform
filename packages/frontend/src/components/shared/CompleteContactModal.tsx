import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Mail, Phone, Loader2, CheckCircle2, BookOpen, MapPin } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';

interface CompleteContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMissingEmail: boolean;
  isMissingPhone: boolean;
  isMissingSubject?: boolean;
  isMissingNationality?: boolean;
}

export default function CompleteContactModal({
  isOpen,
  onClose,
  isMissingEmail,
  isMissingPhone,
  isMissingSubject = false,
  isMissingNationality = false
}: CompleteContactModalProps) {
  const { user, initialize } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [countryCode, setCountryCode] = useState('+970');
  const [supervisedSubjectId, setSupervisedSubjectId] = useState(user?.supervisedSubjectId || '');
  const [nationality, setNationality] = useState(user?.nationality || '');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/curriculum/subjects')
        .then((res) => {
          if (res.data) setSubjects(res.data);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (user?.supervisedSubjectId) setSupervisedSubjectId(user.supervisedSubjectId);
    if (user?.nationality) setNationality(user.nationality);
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isMissingSubject && !supervisedSubjectId) {
      setError(user?.primaryRole === 'teacher' ? 'تحديد مادة التدريس إجباري لتفويجك وإسناد الأفواج والطلاب إليك' : 'تحديد مادة التنسيق والإشراف إجباري');
      return;
    }

    if (isMissingNationality && !nationality) {
      setError('تحديد الجنسية إجباري لاستكمال البيانات');
      return;
    }

    if (isMissingEmail && !email.trim()) {
      setError('يرجى إدخال عنوان البريد الإلكتروني');
      return;
    }

    if (isMissingPhone && !phone.trim()) {
      setError('يرجى إدخال رقم الهاتف');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = phone.trim().replace(/^0+/, '');
      const dialCode = countryCode.split('-')[0];
      const formattedPhone = cleanPhone
        ? (cleanPhone.startsWith('+') ? cleanPhone : `${dialCode}${cleanPhone}`)
        : undefined;

      const payload: any = {};
      if (email.trim()) payload.email = email.trim();
      if (formattedPhone) payload.phone = formattedPhone;
      if (supervisedSubjectId) payload.supervisedSubjectId = supervisedSubjectId;
      if (nationality) payload.nationality = nationality;

      await api.patch('/users/me/profile', payload);
      
      // Refresh user session store
      const updatedUser = await api.get('/auth/me');
      if (updatedUser?.data) {
        initialize(updatedUser.data);
      }
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة لاحقاً');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto animate-fade-in">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {isMissingSubject ? 'استكمال البيانات وتحديد مادة التدريس' : 'استكمال بيانات الحساب الإلزامية'}
              </h3>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                {isMissingSubject 
                  ? 'إلزامي لتفويج المعلمين وإسناد الطلاب وتأمين الحساب'
                  : 'تأمين الحساب واستكمال معلومات التواصل'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
            {isMissingSubject ? (
              <span>⚠️ <strong>تنبيه هام للأساتذة:</strong> لا يمكن للمشرفين الأكاديميين أو الإدارة إسناد الأفواج والطلاب إليك حتى تقوم بتحديد مادتك الدراسية الأساسية. يرجى اختيارها أدناه لتثبيتها فوراً.</span>
            ) : (
              <span>🔒 وفقاً لمعايير منصة باقون، يلزم توفر البريد الإلكتروني ورقم الهاتف والجنسية لضمان أمان الحساب وتلقي الإشعارات الهامة.</span>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>تم تحديث وتثبيت بياناتك ومادتك بنجاح! شكراً لك.</span>
            </div>
          )}

          {/* Missing Subject Field - Crucial for Teachers / Supervisors */}
          {isMissingSubject && (
            <div className="space-y-1.5 p-3.5 bg-purple-50/80 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800">
              <label className="block text-xs font-black text-purple-900 dark:text-purple-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                  {user?.primaryRole === 'teacher' ? 'مادة التدريس والتخصص الدراسي' : 'مادة التنسيق والإشراف'}
                </span>
                <span className="text-rose-500 font-bold">* إجباري للتفويج</span>
              </label>
              <select
                required
                value={supervisedSubjectId}
                onChange={(e) => setSupervisedSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black focus:ring-2 focus:ring-purple-500 outline-none transition-all shadow-xs"
              >
                <option value="">-- اختر مادتك الدراسية الأساسية للتفويج --</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nameAr}</option>
                ))}
              </select>
            </div>
          )}

          {/* Missing Nationality Field */}
          {isMissingNationality && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                الجنسية <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="">-- اختر الجنسية --</option>
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
          )}

          {/* Missing Email Field */}
          {isMissingEmail && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none dir-ltr text-left transition-all"
                />
              </div>
            </div>
          )}

          {/* Missing Phone Field */}
          {isMissingPhone && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                رقم الهاتف (الواتساب) <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2" dir="ltr">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold w-44 shrink-0 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <optgroup label="🇵🇸 فلسطين">
                    <option value="+970">🇵🇸 فلسطين (+970)</option>
                    <option value="+972">🇵🇸 فلسطين - الداخل (+972)</option>
                  </optgroup>
                  <optgroup label="🏛️ الدول العربية">
                    <option value="+962">🇯🇴 الأردن (+962)</option>
                    <option value="+20">🇪🇬 مصر (+20)</option>
                    <option value="+213">🇩🇿 الجزائر (+213)</option>
                    <option value="+966">🇸🇦 السعودية (+966)</option>
                    <option value="+971">🇦🇪 الإمارات (+971)</option>
                    <option value="+974">🇶🇦 قطر (+974)</option>
                    <option value="+965">🇰🇼 الكويت (+965)</option>
                    <option value="+968">🇴🇲 سلطنة عُمان (+968)</option>
                    <option value="+961">🇱🇧 لبنان (+961)</option>
                    <option value="+963">🇸🇾 سوريا (+963)</option>
                    <option value="+964">🇮🇶 العراق (+964)</option>
                  </optgroup>
                  <optgroup label="🌍 دول الاغتراب">
                    <option value="+44">🇬🇧 بريطانيا (+44)</option>
                    <option value="+1-US">🇺🇸 أمريكا (+1)</option>
                    <option value="+1-CA">🇨🇦 كندا (+1)</option>
                    <option value="+49">🇩🇪 ألمانيا (+49)</option>
                    <option value="+90">🇹🇷 تركيا (+90)</option>
                    <option value="+46">🇸🇪 السويد (+46)</option>
                  </optgroup>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="591234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              تذكيري لاحقاً
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black shadow-lg shadow-amber-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <span>حفظ وتأكيد البيانات</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
