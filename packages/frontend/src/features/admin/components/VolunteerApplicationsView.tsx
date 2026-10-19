import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserCheck, Search, Filter, CheckCircle2, XCircle, Clock, 
  MessageSquare, Phone, Mail, Send, Award, BookOpen, GraduationCap, 
  ExternalLink, Sparkles, RefreshCw, Eye, ShieldCheck, ChevronRight,
  Download, ArrowLeft, Copy, Check
} from 'lucide-react';
import { api } from '../../../lib/axios';
import { useAuthStore } from '../../../store/useAuthStore';

export default function VolunteerApplicationsView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all'); // all, existing, new

  const [selectedAppForDossier, setSelectedAppForDossier] = useState<any>(null);
  const [conversionModal, setConversionModal] = useState<{ open: boolean; app: any; result?: any }>({
    open: false,
    app: null
  });
  const [copied, setCopied] = useState(false);

  const isAdmin = ['super_admin', 'admin'].includes(user?.primaryRole || '');
  const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user?.primaryRole || '');

  // Fetch applications
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['volunteer_applications', selectedSubject, selectedStatus, selectedType, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType === 'existing') params.append('isExisting', 'true');
      if (selectedType === 'new') params.append('isExisting', 'false');
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/volunteer/applications?${params.toString()}`);
      return res.data;
    }
  });

  const applications = data?.applications || [];
  const totalCount = data?.totalCount || 0;
  const supervisedSubjectName = data?.supervisedSubjectName;

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, internalNotes }: { id: string; status: string; internalNotes?: string }) => {
      const res = await api.patch(`/volunteer/applications/${id}/status`, { status, internalNotes });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer_applications'] });
      if (selectedAppForDossier) {
        setSelectedAppForDossier(null);
      }
    }
  });

  // Convert to teacher mutation
  const convertMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/volunteer/applications/${id}/convert-to-teacher`, {});
      return res.data;
    },
    onSuccess: (resData) => {
      queryClient.invalidateQueries({ queryKey: ['volunteer_applications'] });
      setConversionModal(prev => ({ ...prev, result: resData }));
    }
  });

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // KPIs
  const currentTeachersCount = applications.filter((a: any) => a.isExistingBaaqoonTeacher).length;
  const newVolunteersCount = applications.filter((a: any) => !a.isExistingBaaqoonTeacher).length;
  const pendingCount = applications.filter((a: any) => a.status === 'pending').length;
  const approvedCount = applications.filter((a: any) => a.status === 'approved' || a.convertedUserId).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-baaqoon-800 to-baaqoon-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-white/10 backdrop-blur-md border border-white/20">
              {isAdmin ? 'الإدارة العامة · حوكمة المتطوعين' : `الإشراف الأكاديمي · مادة ${supervisedSubjectName || 'المادة'}`}
            </span>
            {supervisedSubjectName && (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950">
                فلترة تلقائية لمادة: {supervisedSubjectName}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            استمارات المعلمين المتطوعين لطلبة غزة
          </h1>
          <p className="text-xs sm:text-sm text-baaqoon-100 max-w-2xl leading-relaxed">
            منظومة فرز وتدقيق طلبات المعلمين المتطوعين من الجزائر ودول شمال إفريقيا، ومطابقتهم مع احتياجات الأفواج لضمان استمرار تعليم طلبة غزة.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">إجمالي المتقدمين</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-baaqoon-50 dark:bg-baaqoon-950 text-baaqoon-600 flex items-center justify-center font-black">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 block">معلمون حاليون ببرنامج باقون</span>
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{currentTeachersCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 block">طلبات قيد المراجعة</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 block">تم اعتمادهم / تفعيل حساباتهم</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{approvedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالاسم، البريد، الهاتف، التخصص، الجامعة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">كل الفئات (الكل)</option>
              <option value="existing">معلم حالي فقط 🟢</option>
              <option value="new">متطوع جديد 🟣</option>
            </select>

            {/* Subject Filter (For Admins) */}
            {isAdmin && (
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">كل المواد الدراسية</option>
                <option value="الرياضيات">الرياضيات</option>
                <option value="الفيزياء">الفيزياء</option>
                <option value="الكيمياء">الكيمياء</option>
                <option value="الأحياء والعلوم الحياتية">الأحياء</option>
                <option value="اللغة العربية وآدابها">اللغة العربية</option>
                <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                <option value="التاريخ">التاريخ</option>
                <option value="الجغرافيا">الجغرافيا</option>
                <option value="التربية الإسلامية والشريعة">التربية الإسلامية</option>
                <option value="التكنولوجيا والبرمجة">التكنولوجيا</option>
              </select>
            )}

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="pending">قيد المراجعة</option>
              <option value="approved">معتمد</option>
              <option value="rejected">مرفوض</option>
            </select>

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              title="تحديث"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-baaqoon-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2" />
          <p className="text-xs font-bold">جاري تحميل استمارات المعلمين...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            لا توجد استمارات تطوع مطابقة للفلاتر المحددة
          </h3>
          <p className="text-xs text-slate-400">
            عند إرسال المعلمين للاستمارات ستظهر هنا مباشرة للفرز والاعتماد
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map((app: any) => {
            const isApproved = app.status === 'approved' || app.convertedUserId;
            const isRejected = app.status === 'rejected';
            const cleanPhone = app.phone?.replace(/[^\d+]/g, '');

            return (
              <div 
                key={app.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {app.isExistingBaaqoonTeacher ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          🟢 معلم حالي ببرنامج باقون
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-baaqoon-100 text-baaqoon-800 dark:bg-baaqoon-950 dark:text-baaqoon-300 border border-baaqoon-200 dark:border-baaqoon-800">
                          🟣 متطوع جديد
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isApproved 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : isRejected 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {isApproved ? 'معتمد' : isRejected ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-bold" dir="ltr">
                      {new Date(app.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  {/* Name and Specialty */}
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>أ. {app.fullNameAr || app.fullNameEn}</span>
                      {app.fullNameEn && app.fullNameAr && (
                        <span className="text-xs text-slate-400 font-sans font-normal" dir="ltr">
                          ({app.fullNameEn})
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      {app.specialty && <span>تخصص: {app.specialty}</span>}
                      {app.university && <span>• {app.university}</span>}
                      {app.experienceYears && <span>• خبرة: {app.experienceYears}</span>}
                    </div>
                  </div>

                  {/* Subjects Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {app.subjects && app.subjects.map((sub: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {sub}
                      </span>
                    ))}
                  </div>

                  {/* Contact Badges */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                    {app.phone && (
                      <a 
                        href={`https://wa.me/${cleanPhone?.replace('+', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span dir="ltr">{app.phone}</span>
                      </a>
                    )}
                    {app.email && (
                      <a 
                        href={`mailto:${app.email}`}
                        className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span dir="ltr">{app.email}</span>
                      </a>
                    )}
                    {app.telegramId && (
                      <a 
                        href={`https://t.me/${app.telegramId.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span dir="ltr">{app.telegramId}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  
                  <button
                    onClick={() => setSelectedAppForDossier(app)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض الاستمارة كاملة</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Status Toggle */}
                    {!isApproved && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: app.id, status: 'approved' })}
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>اعتماد</span>
                      </button>
                    )}

                    {/* Admin: Convert to Teacher Button */}
                    {isAdmin && !app.convertedUserId && (
                      <button
                        onClick={() => {
                          setConversionModal({ open: true, app });
                          convertMutation.mutate(app.id);
                        }}
                        disabled={convertMutation.isPending}
                        className="px-3.5 py-1.5 rounded-xl bg-baaqoon-600 hover:bg-baaqoon-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>توليد حساب أستاذ رسمي</span>
                      </button>
                    )}

                    {app.convertedUserId && (
                      <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>حسابه مفعل بالمنصة</span>
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL 1: FULL DOSSIER / APPLICATION DETAILS ─── */}
      {selectedAppForDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black text-baaqoon-600 uppercase tracking-wider block">
                  الملف التفصيلي للمتطوع
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  أ. {selectedAppForDossier.fullNameAr} ({selectedAppForDossier.fullNameEn})
                </h3>
              </div>
              <button
                onClick={() => setSelectedAppForDossier(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              
              {/* Personal info */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white text-xs">١. البيانات الشخصية:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div><strong>العمر:</strong> {selectedAppForDossier.age || 'غير محدد'}</div>
                  <div><strong>الجنس:</strong> {selectedAppForDossier.gender === 'female' ? 'أنثى' : 'ذكر'}</div>
                  <div><strong>الدولة:</strong> {selectedAppForDossier.nationality}</div>
                  <div><strong>البريد:</strong> {selectedAppForDossier.email}</div>
                  <div><strong>الواتساب:</strong> {selectedAppForDossier.phone}</div>
                  <div><strong>التلغرام:</strong> {selectedAppForDossier.telegramId || 'غير متوفر'}</div>
                </div>
              </div>

              {/* Education & Experience */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white text-xs">٢. المؤهل والخبرة:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>التخصص:</strong> {selectedAppForDossier.specialty}</div>
                  <div><strong>الجامعة:</strong> {selectedAppForDossier.university}</div>
                  <div><strong>سنة التخرج:</strong> {selectedAppForDossier.graduationYear}</div>
                  <div><strong>سنوات الخبرة:</strong> {selectedAppForDossier.experienceYears}</div>
                </div>
                {selectedAppForDossier.experienceDetails && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <strong>تفاصيل الخبرة:</strong>
                    <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">{selectedAppForDossier.experienceDetails}</p>
                  </div>
                )}
              </div>

              {/* Tutoring Logistics */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white text-xs">٣. المواد والتفرغ:</h4>
                <div><strong>المواد المرغوبة:</strong> {selectedAppForDossier.subjects?.join('، ')}</div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div><strong>المنصة المفضلة:</strong> {selectedAppForDossier.preferredPlatform}</div>
                  <div><strong>الحصص أسبوعياً:</strong> {selectedAppForDossier.sessionsPerWeek}</div>
                  <div><strong>استقرار الإنترنت:</strong> {selectedAppForDossier.internetReliability}</div>
                  <div><strong>لغة التدريس:</strong> {selectedAppForDossier.preferredLanguage}</div>
                </div>
              </div>

              {/* Motivation */}
              {selectedAppForDossier.motivation && (
                <div className="bg-baaqoon-50 dark:bg-baaqoon-950/40 p-4 rounded-2xl border border-baaqoon-200 dark:border-baaqoon-800 space-y-1">
                  <h4 className="font-black text-baaqoon-900 dark:text-baaqoon-200 text-xs">٤. دافع التطوع لتدريس طلاب غزة:</h4>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-300">{selectedAppForDossier.motivation}</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedAppForDossier(null)}
                className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: CREDENTIALS MODAL AFTER CONVERSION ─── */}
      {conversionModal.open && conversionModal.result && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-200 dark:border-emerald-800 space-y-6 text-center animate-fade-in">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                تم توليد حساب الأستاذ الرسمي بنجاح!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                يمكنك نسخ البيانات التالية وإرسالها للأستاذ عبر الواتساب لتسجيل الدخول مباشرة
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-right space-y-2 font-mono text-xs">
              <div>
                <span className="text-slate-400 block font-sans text-[10px]">البريد الإلكتروني:</span>
                <span className="font-bold text-slate-900 dark:text-white" dir="ltr">{conversionModal.result.user?.email}</span>
              </div>
              {conversionModal.result.initialPassword && (
                <div>
                  <span className="text-slate-400 block font-sans text-[10px]">كلمة المرور المبدئية:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">{conversionModal.result.initialPassword}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleCopyCredentials(`بيانات دخول منصة باقون:\nالرابط: https://baaqoon.ps/login\nالبريد: ${conversionModal.result.user?.email}\nكلمة المرور: ${conversionModal.result.initialPassword || 'المحددة مسبقاً'}`)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الرسالة للواتساب'}</span>
              </button>

              <button
                onClick={() => setConversionModal({ open: false, app: null })}
                className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
