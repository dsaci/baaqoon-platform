import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, UserCheck, Search, Filter, CheckCircle2, XCircle, Clock, 
  MessageSquare, Phone, Mail, Send, Award, BookOpen, GraduationCap, 
  ExternalLink, Sparkles, RefreshCw, Eye, ShieldCheck, ChevronRight,
  Download, ArrowLeft, Copy, Check, ThumbsUp, ThumbsDown, AlertCircle,
  FileText, Calendar, Globe, Monitor
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
  const [selectedTier, setSelectedTier] = useState('all'); // all, highly_recommended, qualified, needs_review

  const [selectedAppForDossier, setSelectedAppForDossier] = useState<any>(null);

  // Supervisor Review Modal state
  const [supervisorReviewModal, setSupervisorReviewModal] = useState<{
    open: boolean;
    app: any;
    decision: 'approved' | 'rejected';
    notes: string;
    rejectionReason: string;
    recommendedSubjectId: string;
  }>({
    open: false,
    app: null,
    decision: 'approved',
    notes: '',
    rejectionReason: '',
    recommendedSubjectId: '',
  });

  // Admin Confirmation Modal state
  const [adminConfirmModal, setAdminConfirmModal] = useState<{
    open: boolean;
    app: any;
    action: 'activate' | 'reject';
    assignedSubjectId: string;
    adminNotes: string;
    customPassword: string;
  }>({
    open: false,
    app: null,
    action: 'activate',
    assignedSubjectId: '',
    adminNotes: '',
    customPassword: '',
  });

  // Credentials success modal
  const [conversionModal, setConversionModal] = useState<{ open: boolean; app: any; result?: any }>({
    open: false,
    app: null,
  });
  const [copied, setCopied] = useState(false);

  const isAdmin = ['super_admin', 'admin'].includes(user?.primaryRole || '');
  const isSupervisor = ['subject_supervisor', 'supervisor'].includes(user?.primaryRole || '');

  // Fetch subjects list for dropdowns
  const { data: subjectsList = [] } = useQuery({
    queryKey: ['volunteer-subjects-list'],
    queryFn: async () => {
      const res = await api.get('/volunteer/subjects-list');
      return res.data;
    },
  });

  // Fetch applications
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['volunteer_applications', selectedSubject, selectedStatus, selectedType, selectedTier, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType === 'existing') params.append('isExisting', 'true');
      if (selectedType === 'new') params.append('isExisting', 'false');
      if (selectedTier !== 'all') params.append('tier', selectedTier);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/volunteer/applications?${params.toString()}`);
      return res.data;
    },
  });

  const applications = data?.applications || [];
  const totalCount = data?.totalCount || 0;
  const supervisedSubjectName = data?.supervisedSubjectName;
  const supervisedSubjects = data?.supervisedSubjects || [];
  const isMultiSubjectSupervisor = data?.isMultiSubjectSupervisor || false;
  const stats = data?.stats;

  // Mutation 1: Supervisor Review
  const supervisorReviewMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      supervisorNotes,
      rejectionReason,
      recommendedSubjectId,
    }: {
      id: string;
      decision: 'approved' | 'rejected';
      supervisorNotes?: string;
      rejectionReason?: string;
      recommendedSubjectId?: string;
    }) => {
      const res = await api.patch(`/volunteer/applications/${id}/supervisor-review`, {
        decision,
        supervisorNotes,
        rejectionReason,
        recommendedSubjectId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer_applications'] });
      setSupervisorReviewModal({ open: false, app: null, decision: 'approved', notes: '', rejectionReason: '', recommendedSubjectId: '' });
      if (selectedAppForDossier) setSelectedAppForDossier(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'حدث خطأ أثناء حفظ مراجعة المشرف');
    },
  });

  // Helper to open automated supervisor review with prefilled recommendation & target subject
  const openAutomatedSupervisorReview = (app: any) => {
    const analysis = app.dossierAnalysis;
    const isGoodMatch = analysis ? analysis.score >= 50 : true;

    let bestSubjectId = '';
    if (supervisedSubjects.length > 0) {
      if (analysis?.targetSubject) {
        const found = supervisedSubjects.find((s: any) =>
          analysis.targetSubject.includes(s.nameAr) || s.nameAr.includes(analysis.targetSubject)
        );
        if (found) bestSubjectId = found.id;
      }
      if (!bestSubjectId && supervisedSubjects[0]) {
        bestSubjectId = supervisedSubjects[0].id;
      }
    }

    setSupervisorReviewModal({
      open: true,
      app,
      decision: isGoodMatch ? 'approved' : 'rejected',
      notes: isGoodMatch ? (analysis?.suggestedRecommendation || '') : '',
      rejectionReason: !isGoodMatch ? (analysis?.suggestedRejection || '') : '',
      recommendedSubjectId: bestSubjectId,
    });
  };

  // Mutation 2: Admin Final Confirmation & Activation
  const adminConfirmMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      assignedSubjectId,
      adminNotes,
      customPassword,
    }: {
      id: string;
      action: 'activate' | 'reject';
      assignedSubjectId?: string;
      adminNotes?: string;
      customPassword?: string;
    }) => {
      const res = await api.post(`/volunteer/applications/${id}/admin-confirm`, {
        action,
        assignedSubjectId,
        adminNotes,
        customPassword,
      });
      return res.data;
    },
    onSuccess: (resData, vars) => {
      queryClient.invalidateQueries({ queryKey: ['volunteer_applications'] });
      setAdminConfirmModal({ open: false, app: null, action: 'activate', assignedSubjectId: '', adminNotes: '', customPassword: '' });
      if (selectedAppForDossier) setSelectedAppForDossier(null);
      if (vars.action === 'activate') {
        setConversionModal({ open: true, app: adminConfirmModal.app, result: resData });
      } else {
        alert('تم تسجيل الرفض النهائي للطلب بنجاح.');
      }
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'حدث خطأ أثناء تنفيذ القرار الإداري');
    },
  });

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // KPIs
  const currentTeachersCount = applications.filter((a: any) => a.isExistingBaaqoonTeacher).length;
  const newVolunteersCount = applications.filter((a: any) => !a.isExistingBaaqoonTeacher).length;
  const pendingCount = applications.filter((a: any) => a.status === 'pending' || a.status === 'pending_supervisor').length;
  const supervisorApprovedCount = applications.filter((a: any) => a.status === 'supervisor_approved').length;
  const supervisorRejectedCount = applications.filter((a: any) => a.status === 'supervisor_rejected').length;
  const fullyApprovedCount = applications.filter((a: any) => a.status === 'approved' || a.convertedUserId).length;

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-baaqoon-800 via-baaqoon-900 to-[#1F2A18] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-white/10 backdrop-blur-md border border-white/20">
              {isAdmin ? 'الإدارة العامة · حوكمة واعتماد المعلمين الجدد' : `الإشراف الأكاديمي · دراسة ملفات أساتذة ${supervisedSubjectName || 'المادة'}`}
            </span>
            {supervisedSubjectName && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-950 flex items-center gap-1.5 shadow-sm">
                <BookOpen className="w-3.5 h-3.5" />
                {isMultiSubjectSupervisor ? `إشراف ثنائي/متعدد: ${supervisedSubjectName}` : `مادة: ${supervisedSubjectName}`}
              </span>
            )}
            {isMultiSubjectSupervisor && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-400 text-emerald-950 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                أتمتة الفرز والتوصية للمادتين مفعلة ⚡
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            دراسة وفرز ملفات المعلمين المتطوعين لطلبة غزة
          </h1>
          <p className="text-xs sm:text-sm text-baaqoon-100 max-w-2xl leading-relaxed">
            منظومة أكاديمية ذكية ومؤتمتة لدراسة ملفات ومؤهلات الأساتذة المتقدمين، مع حساب نسبة التطابق التخصصي واقتراح المسار المناسب تلقائياً، واعتماد مرحلي ثنائي بين المشرف ومدير المنصة.
          </p>
        </div>
      </div>

      {/* Multi-Subject Supervisor Control & Switcher Bar */}
      {isMultiSubjectSupervisor && (
        <div className="bg-gradient-to-r from-blue-900/10 via-slate-900/5 to-emerald-900/10 border border-blue-200 dark:border-blue-900/50 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md flex-shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  أتمتة دراسة الملفات لحسابات الإشراف الثنائي
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {supervisedSubjects.length} مواد مسندة
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                انقر على إحدى المواد لفرز المتقدمين بدقة، أو اختر المتقدمين المؤهلين لكلا المادتين معاً لتوجيههم بضغطة واحدة.
              </p>
            </div>
          </div>

          {/* Quick Subject Switcher Pills */}
          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
            <button
              onClick={() => setSelectedSubject('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              كل المواد المشرف عليها ({totalCount})
            </button>

            {supervisedSubjects.map((sub: any) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubject(sub.nameAr)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  selectedSubject === sub.nameAr
                    ? 'bg-baaqoon-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                مادة {sub.nameAr}
              </button>
            ))}

            <button
              onClick={() => setSelectedSubject('__dual__')}
              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                selectedSubject === '__dual__'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100'
              }`}
            >
              <span>⚡ متقدمون لكلا المادتين</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block">إجمالي الملفات</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{totalCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-black">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 block">موصى به بقوة ⚡</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats?.highlyRecommended || 0}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 block">بانتظار دراسة المشرف</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{pendingCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center font-black">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-600 block">موصى به (بانتظار المدير)</span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{supervisorApprovedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-black">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 block">معتمد ومفعّل رسمياً</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{fullyApprovedCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="البحث بالاسم (عربي ولاتيني)، البريد، الهاتف، الجامعة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-baaqoon-500"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            
            {/* Academic Match Tier Filter */}
            <select
              value={selectedTier}
              onChange={e => setSelectedTier(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">كل درجات التطابق الأكاديمي ⚡</option>
              <option value="highly_recommended">🟢 موصى به بقوة (أولوية قصوى)</option>
              <option value="qualified">🔵 مؤهل ومطابق للشروط</option>
              <option value="needs_review">🟡 يحتاج تدقيق إضافي</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">كل الحالات (المراحل)</option>
              <option value="pending">⏳ بانتظار دراسة المشرف</option>
              <option value="supervisor_approved">🟡 موصى به من المشرف (بانتظار المدير)</option>
              <option value="supervisor_rejected">🔴 مرفوض من المشرف بمبرر</option>
              <option value="approved">🟢 معتمد نهائياً ومُفعّل</option>
              <option value="rejected">⛔ مرفوض نهائياً</option>
            </select>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
            >
              <option value="all">كل الفئات (جدد وحاليون)</option>
              <option value="new">متطوع جديد 🟣</option>
              <option value="existing">معلم حالي بباقون 🟢</option>
            </select>

            {/* Subject Filter (For Admins) */}
            {isAdmin && (
              <select
                value={selectedSubject}
                onChange={e => setSelectedSubject(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">كل المواد الدراسية</option>
                {subjectsList.map((s: any) => (
                  <option key={s.id} value={s.nameAr}>{s.nameAr}</option>
                ))}
              </select>
            )}

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-baaqoon-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-2 text-baaqoon-600" />
          <p className="text-xs font-bold">جاري تحميل وتدقيق استمارات المعلمين...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            لا توجد استمارات مطابقة للفلاتر المحددة حالياً
          </h3>
          <p className="text-xs text-slate-400">
            ستظهر طلبات المعلمين الجدد فور تقديمهم ليتم دراستها وتوجيهها للأفواج المناسبة
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {applications.map((app: any) => {
            const isFullyApproved = app.status === 'approved' || app.convertedUserId;
            const isFullyRejected = app.status === 'rejected';
            const isSupApproved = app.status === 'supervisor_approved';
            const isSupRejected = app.status === 'supervisor_rejected';
            const isPending = app.status === 'pending' || app.status === 'pending_supervisor';

            const cleanPhone = app.phone?.replace(/[^\d+]/g, '');

            return (
              <div 
                key={app.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isFullyApproved 
                    ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10'
                    : isSupApproved
                      ? 'border-blue-200 dark:border-blue-900/40 bg-blue-50/10'
                      : isSupRejected || isFullyRejected
                        ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/10'
                        : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Top Bar: Tags & Status Badge */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {app.isExistingBaaqoonTeacher ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          🟢 معلم حالي بباقون
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-baaqoon-100 text-baaqoon-800 dark:bg-baaqoon-950 dark:text-baaqoon-300 border border-baaqoon-200 dark:border-baaqoon-800">
                          🟣 متطوع جديد
                        </span>
                      )}

                      {/* Status Badges */}
                      {isFullyApproved ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          معتمد ومفعّل رسمياً
                        </span>
                      ) : isSupApproved ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-300 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          موصى به من المشرف (بانتظار المدير)
                        </span>
                      ) : isSupRejected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
                          <ThumbsDown className="w-3 h-3" />
                          مرفوض من المشرف بمبرر
                        </span>
                      ) : isFullyRejected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-400">
                          ⛔ مرفوض نهائياً
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          بانتظار دراسة المشرف
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-400 font-bold" dir="ltr">
                      {new Date(app.createdAt).toLocaleDateString('ar-EG')}
                    </span>
                  </div>

                  {/* Teacher Name & Specialty Header */}
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>أ. {app.fullNameAr || app.fullNameEn}</span>
                      {app.fullNameEn && app.fullNameAr && (
                        <span className="text-xs text-slate-400 font-sans font-normal" dir="ltr">
                          ({app.fullNameEn})
                        </span>
                      )}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                      {app.specialty && <span className="font-bold text-slate-700 dark:text-slate-300">تخصص: {app.specialty}</span>}
                      {app.university && <span>• {app.university}</span>}
                      {app.graduationYear && <span>• تخرج: {app.graduationYear}</span>}
                      {app.experienceYears && <span className="text-baaqoon-600 dark:text-baaqoon-400 font-bold">• خبرة: {app.experienceYears}</span>}
                    </div>
                  </div>

                  {/* Subjects Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {app.subjects && app.subjects.map((sub: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {sub}
                      </span>
                    ))}
                  </div>

                  {/* Automated Dossier Evaluation Card */}
                  {app.dossierAnalysis && (
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-700/80 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <div
                            className="px-2.5 py-1 rounded-xl text-xs font-black text-white flex items-center gap-1 shadow-sm"
                            style={{ backgroundColor: app.dossierAnalysis.tierColor }}
                          >
                            <Sparkles className="w-3 h-3 text-amber-200" />
                            <span>{app.dossierAnalysis.score}% تطابق</span>
                          </div>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            {app.dossierAnalysis.tierLabel}
                          </span>
                        </div>

                        <div className="text-[11px] font-bold text-baaqoon-700 dark:text-baaqoon-300 bg-baaqoon-50 dark:bg-baaqoon-950/60 px-2.5 py-0.5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-800">
                          المسار المقترح: {app.dossierAnalysis.targetSubject}
                        </div>
                      </div>

                      {/* Strengths tags */}
                      {app.dossierAnalysis.strengths && app.dossierAnalysis.strengths.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {app.dossierAnalysis.strengths.slice(0, 3).map((st: string, idx: number) => (
                            <span key={idx} className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              <span>{st}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Supervisor Review Summary Box (if reviewed) */}
                  {(app.supervisorDecision || app.supervisorReviewedBy) && (
                    <div className={`p-3 rounded-2xl text-xs space-y-1.5 border ${
                      app.supervisorDecision === 'approved' 
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
                        : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                    }`}>
                      <div className="flex items-center justify-between font-black">
                        <span className="flex items-center gap-1.5">
                          {app.supervisorDecision === 'approved' ? (
                            <>
                              <ThumbsUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>توصية المشرف الأكاديمي: قبول وترشيح</span>
                            </>
                          ) : (
                            <>
                              <ThumbsDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span>قرار المشرف الأكاديمي: اعتذار ورفض</span>
                            </>
                          )}
                        </span>
                        {app.supervisorReviewedBy && (
                          <span className="text-[10px] opacity-75 font-normal">
                            المشرف: أ. {app.supervisorReviewedBy.firstName} {app.supervisorReviewedBy.lastName}
                          </span>
                        )}
                      </div>

                      {app.supervisorNotes && (
                        <p className="text-[11px] leading-relaxed">
                          <strong>ملاحظات المشرف:</strong> {app.supervisorNotes}
                        </p>
                      )}

                      {app.supervisorRejectionReason && (
                        <p className="text-[11px] text-rose-700 dark:text-rose-300 font-bold leading-relaxed">
                          <strong>مبرر الرفض:</strong> {app.supervisorRejectionReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Quick Contact Buttons */}
                  <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                    {app.phone && (
                      <a 
                        href={`https://wa.me/${cleanPhone?.replace('+', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                        title="مراسلة عبر واتساب"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span dir="ltr">{app.phone}</span>
                      </a>
                    )}
                    {app.email && (
                      <a 
                        href={`mailto:${app.email}`}
                        className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5 transition-colors"
                        title="إرسال بريد إلكتروني"
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
                        title="مراسلة عبر تيليغرام"
                      >
                        <Send className="w-3 h-3" />
                        <span dir="ltr">{app.telegramId}</span>
                      </a>
                    )}
                  </div>

                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  
                  {/* View Full Dossier */}
                  <button
                    onClick={() => setSelectedAppForDossier(app)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>فحص الملف الكامل</span>
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    
                    {/* Supervisor Action Buttons */}
                    {isSupervisor && !isFullyApproved && (
                      <>
                        <button
                          onClick={() => openAutomatedSupervisorReview(app)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          title="أتمتة دراسة الملف وتوليد التوصية الرسمية لإدارة المنصة بضغطة واحدة"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>دراسة وتوصية مؤتمتة ⚡</span>
                        </button>

                        <button
                          onClick={() => setSupervisorReviewModal({
                            open: true,
                            app,
                            decision: 'rejected',
                            notes: '',
                            rejectionReason: app.supervisorRejectionReason || app.dossierAnalysis?.suggestedRejection || '',
                            recommendedSubjectId: '',
                          })}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>اعتذار بمبرر</span>
                        </button>
                      </>
                    )}

                    {/* Admin Action Buttons */}
                    {isAdmin && !app.convertedUserId && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setAdminConfirmModal({
                            open: true,
                            app,
                            action: 'activate',
                            assignedSubjectId: app.assignedSubjectId || '',
                            adminNotes: app.internalNotes || '',
                            customPassword: '',
                          })}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>تأكيد نهائي وتفعيل حساب ⚡</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من الرفض النهائي لهذا الطلب؟')) {
                              adminConfirmMutation.mutate({ id: app.id, action: 'reject' });
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs font-bold transition-colors cursor-pointer"
                        >
                          رفض نهائي
                        </button>
                      </div>
                    )}

                    {app.convertedUserId && (
                      <span className="px-2.5 py-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>حسابه مفعّل رسمياً بالمنصة</span>
                      </span>
                    )}

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL 1: SUPERVISOR REVIEW MODAL (قبول أو رفض بمبرر) ─── */}
      {supervisorReviewModal.open && supervisorReviewModal.app && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black text-baaqoon-600 uppercase tracking-wider block">
                  الإشراف الأكاديمي · دراسة ملف المتطوع
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  أ. {supervisorReviewModal.app.fullNameAr || supervisorReviewModal.app.fullNameEn}
                </h3>
              </div>
              <button
                onClick={() => setSupervisorReviewModal(prev => ({ ...prev, open: false }))}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">

              {/* Automated Analysis Box inside Modal */}
              {supervisorReviewModal.app.dossierAnalysis && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      التقييم الأكاديمي المؤتمت:
                    </span>
                    <span 
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-black text-white"
                      style={{ backgroundColor: supervisorReviewModal.app.dossierAnalysis.tierColor }}
                    >
                      {supervisorReviewModal.app.dossierAnalysis.score}% تطابق · {supervisorReviewModal.app.dossierAnalysis.tierLabel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>المسار التخصصي الأنسب:</strong> مادة {supervisorReviewModal.app.dossierAnalysis.targetSubject}
                  </p>
                </div>
              )}

              {/* Decision Toggle */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  قرار المشرف الأكاديمي:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const sugg = supervisorReviewModal.app?.dossierAnalysis?.suggestedRecommendation || '';
                      setSupervisorReviewModal(prev => ({ ...prev, decision: 'approved', notes: prev.notes || sugg }));
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      supervisorReviewModal.decision === 'approved'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>توصية بالقبول للمدير</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const suggRej = supervisorReviewModal.app?.dossierAnalysis?.suggestedRejection || '';
                      setSupervisorReviewModal(prev => ({ ...prev, decision: 'rejected', rejectionReason: prev.rejectionReason || suggRej }));
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      supervisorReviewModal.decision === 'rejected'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>اعتذار ورفض بمبرر</span>
                  </button>
                </div>
              </div>

              {/* Multi-subject selector for dual supervisor */}
              {supervisedSubjects.length > 1 && supervisorReviewModal.decision === 'approved' && (
                <div className="space-y-1.5 p-3.5 bg-blue-50/60 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <label className="block text-xs font-black text-blue-950 dark:text-blue-200">
                    المادة الموصى باعتماد الأستاذ لتدريسها (من المواد المسندة إليك):
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {supervisedSubjects.map((sub: any) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSupervisorReviewModal(prev => ({ ...prev, recommendedSubjectId: sub.id }))}
                        className={`p-2.5 rounded-xl text-xs font-black border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                          supervisorReviewModal.recommendedSubjectId === sub.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-300'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>مادة {sub.nameAr}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* If Approved: Notes for Admin */}
              {supervisorReviewModal.decision === 'approved' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      ملاحظات وتوصية المشرف لمدير المنصة:
                    </label>
                    {supervisorReviewModal.app.dossierAnalysis?.suggestedRecommendation && (
                      <button
                        type="button"
                        onClick={() => setSupervisorReviewModal(prev => ({
                          ...prev,
                          notes: supervisorReviewModal.app.dossierAnalysis.suggestedRecommendation,
                        }))}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>إعادة توليد الصيغة المؤتمتة ⚡</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    placeholder="ملاحظات وتوصية المشرف..."
                    value={supervisorReviewModal.notes}
                    onChange={e => setSupervisorReviewModal(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                  />
                </div>
              )}

              {/* If Rejected: Mandatory Rejection Reason */}
              {supervisorReviewModal.decision === 'rejected' && (
                <div className="space-y-1.5 p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-rose-900 dark:text-rose-200">
                      مبرر الرفض الأكاديمي:
                    </label>
                    <span className="text-[10px] text-rose-600 font-black">* إجباري قطعي</span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="يُرجى توضيح سبب عدم ملاءمة الملف (مثلاً: عدم تطابق التخصص، عدم توفر ساعات تفرغ كافية، الاعتذار عن المنهاج الفلسطيني...)"
                    value={supervisorReviewModal.rejectionReason}
                    onChange={e => setSupervisorReviewModal(prev => ({ ...prev, rejectionReason: e.target.value }))}
                    className="w-full p-3 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[10px] text-rose-700 dark:text-rose-300 leading-relaxed">
                    💡 سيتم توثيق هذا المبرر رسميًا ورفعه لمدير المنصة للاطلاع والبت النهائي.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSupervisorReviewModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => supervisorReviewMutation.mutate({
                  id: supervisorReviewModal.app.id,
                  decision: supervisorReviewModal.decision,
                  supervisorNotes: supervisorReviewModal.notes,
                  rejectionReason: supervisorReviewModal.rejectionReason,
                  recommendedSubjectId: supervisorReviewModal.recommendedSubjectId,
                })}
                disabled={supervisorReviewMutation.isPending || (supervisorReviewModal.decision === 'rejected' && !supervisorReviewModal.rejectionReason.trim())}
                className={`px-5 py-2 rounded-xl text-white text-xs font-black shadow-md transition-all cursor-pointer ${
                  supervisorReviewModal.decision === 'approved'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-rose-600 hover:bg-rose-700 disabled:opacity-60'
                }`}
              >
                {supervisorReviewMutation.isPending ? 'جاري الحفظ...' : 'تأكيد وإرسال للمدير'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 2: ADMIN CONFIRMATION & ACCOUNT ACTIVATION MODAL ─── */}
      {adminConfirmModal.open && adminConfirmModal.app && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">
                  إدارة المنصة · التأكيد النهائي وتفعيل حساب أستاذ
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  أ. {adminConfirmModal.app.fullNameAr || adminConfirmModal.app.fullNameEn}
                </h3>
              </div>
              <button
                onClick={() => setAdminConfirmModal(prev => ({ ...prev, open: false }))}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Supervisor note preview if available */}
            {adminConfirmModal.app.supervisorDecision && (
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                <span className="font-black text-blue-900 dark:text-blue-200 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>توصية المشرف:</span>
                </span>
                <p className="text-slate-700 dark:text-slate-300">
                  {adminConfirmModal.app.supervisorNotes || 'أوصى المشرف بقبول وترشيح المتطوع'}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Select Official Subject to Assign */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  إسناد مادة التدريس الرسمية للأستاذ:
                </label>
                <select
                  value={adminConfirmModal.assignedSubjectId}
                  onChange={e => setAdminConfirmModal(prev => ({ ...prev, assignedSubjectId: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- اضغط لتحديد المادة المعتمدة في المنصة --</option>
                  {subjectsList.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nameAr} ({s.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  المواد التي صرّح بها في الاستمارة: {adminConfirmModal.app.subjects?.join('، ') || 'لم تُحدد'}
                </p>
              </div>

              {/* Optional Custom Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  كلمة المرور المبدئية (اتركها فارغة للتوليد التلقائي الآمن):
                </label>
                <input
                  type="text"
                  placeholder="مثال: Baaqoon@2026"
                  value={adminConfirmModal.customPassword}
                  onChange={e => setAdminConfirmModal(prev => ({ ...prev, customPassword: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono outline-none"
                  dir="ltr"
                />
              </div>

              {/* Admin Internal Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ملاحظات إدارية داخلية (اختياري):
                </label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات الإدارة حول الملف، تفاصيل الاتصال..."
                  value={adminConfirmModal.adminNotes}
                  onChange={e => setAdminConfirmModal(prev => ({ ...prev, adminNotes: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminConfirmModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => adminConfirmMutation.mutate({
                  id: adminConfirmModal.app.id,
                  action: 'activate',
                  assignedSubjectId: adminConfirmModal.assignedSubjectId,
                  adminNotes: adminConfirmModal.adminNotes,
                  customPassword: adminConfirmModal.customPassword,
                })}
                disabled={adminConfirmMutation.isPending}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{adminConfirmMutation.isPending ? 'جاري التفعيل...' : 'اعتماد وتفعيل الحساب الآن'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 3: FULL COMPREHENSIVE DOSSIER MODAL ─── */}
      {selectedAppForDossier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-fade-in">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black text-baaqoon-600 uppercase tracking-wider block">
                  الملف التفصيلي الشامل للمتطوع
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>أ. {selectedAppForDossier.fullNameAr || selectedAppForDossier.fullNameEn}</span>
                  {selectedAppForDossier.fullNameEn && selectedAppForDossier.fullNameAr && (
                    <span className="text-xs text-slate-400 font-sans font-normal" dir="ltr">
                      ({selectedAppForDossier.fullNameEn})
                    </span>
                  )}
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
              
              {/* Automated Academic Assessment Block */}
              {selectedAppForDossier.dossierAnalysis && (
                <div className="bg-gradient-to-r from-blue-900/10 via-baaqoon-900/10 to-emerald-900/10 p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div 
                        className="px-3 py-1 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-sm"
                        style={{ backgroundColor: selectedAppForDossier.dossierAnalysis.tierColor }}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                        <span>نسبة التطابق الأكاديمي: {selectedAppForDossier.dossierAnalysis.score}%</span>
                      </div>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {selectedAppForDossier.dossierAnalysis.tierLabel}
                      </span>
                    </div>

                    <div className="text-xs font-black text-baaqoon-700 dark:text-baaqoon-300 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-baaqoon-200 dark:border-baaqoon-700">
                      المسار المقترح: {selectedAppForDossier.dossierAnalysis.targetSubject}
                    </div>
                  </div>

                  {/* Strengths & Concerns */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block">نقاط القوة والمطابقة:</span>
                      {selectedAppForDossier.dossierAnalysis.strengths?.map((st: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>

                    {selectedAppForDossier.dossierAnalysis.concerns && selectedAppForDossier.dossierAnalysis.concerns.length > 0 && (
                      <div className="bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
                        <span className="font-bold text-amber-800 dark:text-amber-300 block">نقاط تتطلب عناية:</span>
                        {selectedAppForDossier.dossierAnalysis.concerns.map((cn: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                            <span>{cn}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Automated recommendation text preview */}
                  <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] leading-relaxed">
                    <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">صيغة التوصية الأكاديمية المؤتمتة:</span>
                    <p className="text-slate-600 dark:text-slate-300">{selectedAppForDossier.dossierAnalysis.suggestedRecommendation}</p>
                  </div>
                </div>
              )}

              {/* Personal info */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-baaqoon-600" />
                  <span>١. البيانات الشخصية:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div><strong>العمر:</strong> {selectedAppForDossier.age || 'غير محدد'}</div>
                  <div><strong>الجنس:</strong> {selectedAppForDossier.gender === 'female' ? 'أنثى' : 'ذكر'}</div>
                  <div><strong>الدولة / الجنسية:</strong> {selectedAppForDossier.nationality}</div>
                  <div><strong>البريد:</strong> {selectedAppForDossier.email}</div>
                  <div><strong>الواتساب:</strong> {selectedAppForDossier.phone}</div>
                  <div><strong>التلغرام:</strong> {selectedAppForDossier.telegramId || 'غير متوفر'}</div>
                </div>
              </div>

              {/* Education & Experience */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>٢. المؤهل والخبرة التعليمية:</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><strong>التخصص الأكاديمي:</strong> {selectedAppForDossier.specialty}</div>
                  <div><strong>الجامعة:</strong> {selectedAppForDossier.university}</div>
                  <div><strong>سنة التخرج:</strong> {selectedAppForDossier.graduationYear}</div>
                  <div><strong>سنوات الخبرة:</strong> {selectedAppForDossier.experienceYears}</div>
                </div>
                {selectedAppForDossier.experienceDetails && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <strong>تفاصيل الخبرة والدروس:</strong>
                    <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">{selectedAppForDossier.experienceDetails}</p>
                  </div>
                )}
              </div>

              {/* Subjects & Tutoring Logistics */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl space-y-2">
                <h4 className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                  <span>٣. المواد والرغبات اللوجستية:</span>
                </h4>
                <div><strong>المواد المعتمدة:</strong> {selectedAppForDossier.subjects?.join('، ')}</div>
                {selectedAppForDossier.otherSubjects && (
                  <div><strong>مواد أخرى يقترحها:</strong> {selectedAppForDossier.otherSubjects}</div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div><strong>المنصة المفضلة:</strong> {selectedAppForDossier.preferredPlatform || 'غير محدد'}</div>
                  <div><strong>الحصص أسبوعياً:</strong> {selectedAppForDossier.sessionsPerWeek || 'غير محدد'}</div>
                  <div><strong>استقرار الإنترنت:</strong> {selectedAppForDossier.internetReliability || 'غير محدد'}</div>
                  <div><strong>لغة الشرح:</strong> {selectedAppForDossier.preferredLanguage || 'العربية'}</div>
                </div>
                {selectedAppForDossier.availableDays && selectedAppForDossier.availableDays.length > 0 && (
                  <div><strong>الأيام المتاحة:</strong> {selectedAppForDossier.availableDays.join('، ')}</div>
                )}
                {selectedAppForDossier.availableTimes && selectedAppForDossier.availableTimes.length > 0 && (
                  <div><strong>الفترات المفضلة:</strong> {selectedAppForDossier.availableTimes.join('، ')}</div>
                )}
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
                إغلاق النافذة
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL 4: CREDENTIALS MODAL AFTER ACTIVATION ─── */}
      {conversionModal.open && conversionModal.result && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-emerald-200 dark:border-emerald-800 space-y-6 text-center animate-fade-in">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                تم اعتماد وتفعيل حساب الأستاذ بنجاح! 🌿
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                تم إنشاء حساب رسمي للأستاذ بالمنصة، يمكنك نسخ الرسالة التالية وإرسالها للأستاذ عبر الواتساب لتسجيل الدخول مباشرة
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-right space-y-2 font-mono text-xs">
              <div>
                <span className="text-slate-400 block font-sans text-[10px]">البريد الإلكتروني المعتمد:</span>
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
                onClick={() => handleCopyCredentials(`أهلاً وسهلاً بك أستاذنا الفاضل في منصة باقون لتعليم طلبة غزة 🌿\nتم اعتماد ملفكم وتفعيل حسابكم الرسمي:\nرابط المنصة: https://baaqoon.ps/login\nالبريد: ${conversionModal.result.user?.email}\nكلمة المرور: ${conversionModal.result.initialPassword || 'المحددة من طرفكم'}\nنرجو تغيير كلمة المرور عند أول تسجيل دخول.`)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم النسخ بنجاح!' : 'نسخ الرسالة للواتساب'}</span>
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
