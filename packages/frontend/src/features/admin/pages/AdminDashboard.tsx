import React, { useState } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  UserCheck, 
  Plus, 
  X, 
  Eye, 
  Settings, 
  BarChart3, 
  Edit, 
  Trash2, 
  Database, 
  Users2, 
  GraduationCap, 
  ShieldAlert, 
  FileSpreadsheet, 
  Megaphone, 
  Archive,
  ArrowRight,
  Layers,
  Activity,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import EditCohortModal from '../components/EditCohortModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import CohortRequestsAdminView from '../components/CohortRequestsAdminView';
import HrManagementAdminView from '../components/HrManagementAdminView';
import ActivityLogsView from '../components/ActivityLogsView';
import SupervisorAccountabilityView from '../../supervisor/components/SupervisorAccountabilityView';
import ComingSoonSection from '../../../components/ui/ComingSoonSection';
import ExamPrepWidget from '../../../components/shared/ExamPrepWidget';
import LiveMonitoringWidget from '../../scheduling/components/LiveMonitoringWidget';
import DistributionAdminPage from './DistributionAdminPage';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(window.location.search);
  const tabParam = searchParams.get('tab');
  const subParam = searchParams.get('sub');
  const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'students' | 'cohorts' | 'accountability'>(() => {
    if (tabParam === 'cohorts' || tabParam === 'distribution') return 'cohorts';
    if (tabParam === 'hr' || tabParam === 'teachers') return 'teachers';
    if (tabParam === 'students') return 'students';
    if (tabParam === 'accountability') return 'accountability';
    if (tabParam === 'stats' || tabParam === 'activity') return 'stats';
    return 'stats';
  });
  const [cohortSubTab, setCohortSubTab] = useState<'list' | 'requests' | 'distribution'>(() => {
    if (tabParam === 'distribution' || subParam === 'distribution') return 'distribution';
    if (subParam === 'requests') return 'requests';
    return 'list';
  });

  React.useEffect(() => {
    const handleLocationChange = () => {
      const search = new URLSearchParams(window.location.search);
      const tab = search.get('tab');
      const sub = search.get('sub');
      if (tab === 'distribution') {
        setActiveTab('cohorts');
        setCohortSubTab('distribution');
      } else if (tab === 'cohorts') {
        setActiveTab('cohorts');
        if (sub === 'distribution') setCohortSubTab('distribution');
        else if (sub === 'requests') setCohortSubTab('requests');
      }
      else if (tab === 'hr' || tab === 'teachers') setActiveTab('teachers');
      else if (tab === 'students') setActiveTab('students');
      else if (tab === 'accountability') setActiveTab('accountability');
      else if (tab === 'stats' || tab === 'activity') setActiveTab('stats');
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const { data: adminStats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/stats');
      return res.data;
    }
  });

  const { data: adminData } = useQuery({
    queryKey: ['adminData'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/data');
      return res.data;
    }
  });

  const { data: pendingUsers = [] } = useQuery({
    queryKey: ['admin_pending_users'],
    queryFn: async () => {
      const res = await api.get('/users/admin/list');
      return (res.data || []).filter((u: any) => u.status === 'pending');
    }
  });

  const { data: passwordRequests = [] } = useQuery({
    queryKey: ['admin_password_requests'],
    queryFn: async () => {
      const res = await api.get('/users/admin/password-requests');
      return res.data || [];
    }
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['cohort_requests_count'],
    queryFn: async () => {
      const res = await api.get('/groups/requests');
      return (res.data || []).filter((r: any) => r.status === 'pending');
    }
  });

  const pendingTeachersCount = pendingUsers.filter((u: any) => u.primaryRole === 'teacher').length;
  const pendingStudentsCount = pendingUsers.filter((u: any) => u.primaryRole === 'student').length;

  const createCohortMutation = useMutation({
    mutationFn: async (newCohort: any) => {
      const res = await api.post('/groups/cohorts', newCohort);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['adminData'] });
      setIsCreateModalOpen(false);
      setNewCohortName('');
      setNewCohortCode('');
      setSelectedCourseId('');
      setSelectedTeacherId('');
    }
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortCode, setNewCohortCode] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [editingCohort, setEditingCohort] = useState<any>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const handleDeleteCohort = async (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الفوج "${name}"؟ هذه العملية لا يمكن التراجع عنها.`)) {
      try {
        await api.delete(`/groups/cohorts/${id}`);
        queryClient.invalidateQueries({ queryKey: ['adminData'] });
        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      } catch (err) {
        alert("حدث خطأ أثناء الحذف");
      }
    }
  };
  
  const handleCreateCohortSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCohortName || !newCohortCode || !selectedCourseId || !selectedTeacherId) {
      alert('يرجى ملء جميع الحقول');
      return;
    }

    const course = adminData?.courses?.find((c: any) => c.id === selectedCourseId);
    if (!course || !course.versions || course.versions.length === 0) {
      alert('المادة غير مكتملة الإعداد في قاعدة البيانات (لا توجد نسخة منهج)');
      return;
    }

    createCohortMutation.mutate({
      name: newCohortName,
      code: newCohortCode,
      courseId: selectedCourseId,
      curriculumVersionId: course.versions[0].id,
      teacherId: selectedTeacherId,
      studentIds: selectedStudentIds
    });
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-sans" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          {passwordRequests.length > 0 && (
            <div className="mb-4 bg-red-100 dark:bg-red-950/70 border-2 border-red-400 dark:border-red-600/70 text-red-800 dark:text-red-100 px-4 py-3 rounded-xl relative flex items-center gap-3 animate-pulse">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="font-bold">يوجد لديك ({passwordRequests.length}) طلبات جديدة لاستعادة كلمات المرور! تفقد قسم إدارة الحسابات لمعالجتها.</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-2.5 h-8 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full shrink-0"></span>
            <span className="text-slate-900 dark:text-white">مرحباً بك {user?.firstName} {user?.lastName} - مدير المنصة 👋</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 font-bold">
            لوحة التحكم المركزية لإدارة الموارد البشرية، الأفواج التربوية، والإشراف على متابعة المنهاج.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/reports')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-indigo-600/20 transition-all flex-shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            الإحصائيات والتقارير والنسب
          </button>
          <button
            onClick={async () => {
              try {
                const res = await api.get('/groups/admin/export-database', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `baaqoon_database_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
              } catch (e) {
                alert('حدث خطأ أثناء تصدير قاعدة البيانات بصيغة Excel');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs shadow-lg shadow-emerald-600/20 transition-all flex-shrink-0"
            title="تصدير نسخة احتياطية كاملة لقاعدة البيانات بصيغة Excel"
          >
            <FileSpreadsheet className="w-4 h-4" />
            تصدير قاعدة البيانات (Excel)
          </button>
        </div>
      </header>

      {/* Alert: Pending Registrations */}
      {pendingUsers.length > 0 && (
        <div 
          onClick={() => setActiveTab('teachers')}
          className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
        >
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-800/50 rounded-full flex items-center justify-center shrink-0">
            <span className="text-2xl">⏳</span>
          </div>
          <div className="flex-1">
            <p className="font-black text-amber-800 dark:text-amber-200">
              {pendingUsers.length} حسابات بانتظار موافقتك
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-0.5">
              {pendingUsers.filter((u: any) => u.primaryRole === 'teacher').length} أساتذة · {pendingUsers.filter((u: any) => u.primaryRole === 'student').length} طلبة · {pendingUsers.filter((u: any) => u.primaryRole === 'subject_supervisor').length} مشرفين
            </p>
          </div>
          <span className="text-amber-600 font-bold text-sm">معالجة الآن ←</span>
        </div>
      )}

      {/* Automated Exam Prep Camps & Reminders */}
      <ExamPrepWidget role="admin" />

      {/* 5 Prominent Framed Action & Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
        {/* 1. الإحصائيات والمتابعة */}
        <button 
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'stats' 
              ? 'bg-gradient-to-br from-indigo-50/90 via-purple-50/40 to-white dark:from-indigo-950/60 dark:via-purple-950/30 dark:to-slate-900 border-indigo-600 dark:border-indigo-500 shadow-md shadow-indigo-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            {activeTab === 'stats' ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                النشط الآن
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400">مباشر</span>
            )}
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              الإحصائيات والمتابعة
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              مؤشرات الأداء والرصد الحي
            </p>
          </div>
        </button>

        {/* 2. أساتذة المادة */}
        <button 
          type="button"
          onClick={() => setActiveTab('teachers')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'teachers' 
              ? 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white dark:from-emerald-950/60 dark:via-teal-950/30 dark:to-slate-900 border-emerald-600 dark:border-emerald-500 shadow-md shadow-emerald-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1">
              {pendingTeachersCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                  {pendingTeachersCount} معلق
                </span>
              )}
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                {isLoading ? '...' : adminStats?.stats?.teachers || 0} أستاذ
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              أساتذة المادة
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              الكادر التعليمي والنشاط
            </p>
          </div>
        </button>

        {/* 3. طلبة المادة */}
        <button 
          type="button"
          onClick={() => setActiveTab('students')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'students' 
              ? 'bg-gradient-to-br from-blue-50/90 via-sky-50/40 to-white dark:from-blue-950/60 dark:via-sky-950/30 dark:to-slate-900 border-blue-600 dark:border-blue-500 shadow-md shadow-blue-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold group-hover:scale-110 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1">
              {pendingStudentsCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                  {pendingStudentsCount} معلق
                </span>
              )}
              <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950/70 px-2 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                {isLoading ? '...' : adminStats?.stats?.students || 0} طالب
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              طلبة المادة
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              سجلات وحضور الطلاب
            </p>
          </div>
        </button>

        {/* 4. الأفواج والإسناد */}
        <button 
          type="button"
          onClick={() => setActiveTab('cohorts')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'cohorts' 
              ? 'bg-gradient-to-br from-fuchsia-50/90 via-pink-50/40 to-white dark:from-fuchsia-950/60 dark:via-pink-950/30 dark:to-slate-900 border-fuchsia-600 dark:border-fuchsia-500 shadow-md shadow-fuchsia-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-fuchsia-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-900/50 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 font-bold group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1">
              {pendingRequests.length > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                  {pendingRequests.length} طلب
                </span>
              )}
              <span className="text-xs font-black text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-100/70 dark:bg-fuchsia-950/70 px-2 py-0.5 rounded-lg border border-fuchsia-200/60 dark:border-fuchsia-800/60">
                {isLoading ? '...' : adminStats?.stats?.cohorts || 0} فوج
              </span>
            </div>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              الأفواج والإسناد
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              إدارة الأفواج والمجموعات
            </p>
          </div>
        </button>

        {/* 5. المرافقة ومتابعة المنهاج */}
        <button 
          type="button"
          onClick={() => setActiveTab('accountability')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative overflow-hidden group shadow-xs ${
            activeTab === 'accountability' 
              ? 'bg-gradient-to-br from-rose-50/90 via-amber-50/40 to-white dark:from-rose-950/60 dark:via-amber-950/30 dark:to-slate-900 border-rose-600 dark:border-rose-500 shadow-md shadow-rose-600/10 scale-[1.02]' 
              : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-200/90 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700 hover:shadow-sm hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold group-hover:scale-110 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              مرافقة فورية
            </span>
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white mb-0.5">
              المرافقة ومتابعة المنهاج
            </h3>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              الخطة السنوية والالتزام
            </p>
          </div>
        </button>
      </div>

      {/* Main Tab Content Display */}

      {/* 1. TAB: الإحصائيات والمتابعة */}
      {activeTab === 'stats' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">الأفواج التربوية</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {isLoading ? '...' : adminStats?.stats?.cohorts || 0}
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">إجمالي الطلبة</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {isLoading ? '...' : adminStats?.stats?.students || 0}
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">كادر الأساتذة</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {isLoading ? '...' : adminStats?.stats?.teachers || 0}
                </p>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">الحصص المجدولة</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  {isLoading ? '...' : adminStats?.stats?.activeSessions || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Platform Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/reports')}
              className="p-5 rounded-2xl border border-purple-200 dark:border-purple-800/80 bg-gradient-to-br from-purple-50/50 to-white dark:from-purple-950/40 dark:to-slate-900 text-right hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">الإحصائيات والتقارير الشاملة</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">مؤشرات الأداء، نسب المناهج، والتوزع الديموغرافي</p>
            </button>

            <button
              onClick={() => navigate('/admin/database')}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-900 dark:to-slate-950 text-right hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">قاعدة البيانات المركزية وإدارة النظام</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">تسيير المنصة الرئيسية، الأقسام، والمواد التعليمية</p>
            </button>

            <button
              onClick={() => {
                setActiveTab('cohorts');
                setCohortSubTab('distribution');
              }}
              className="p-5 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/40 dark:to-slate-900 text-right hover:shadow-md transition-all group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users2 className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">الإسناد الأكاديمي وتوزيع المشرفين</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">توزيع المهام والمشرفين على المواد (مشرف أو أكثر لكل مادة)</p>
            </button>
          </div>

          {/* Live Sessions Monitoring Section for Admin / Director */}
          <LiveMonitoringWidget role="admin" />

          {/* Activity Logs Section */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              سجل النشاط المباشر والعمليات على المنصة
            </h3>
            <ActivityLogsView />
          </div>
        </div>
      )}

      {/* 2. TAB: أساتذة المادة */}
      {activeTab === 'teachers' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-fade-in">
          <HrManagementAdminView initialRoleFilter="teacher" />
        </div>
      )}

      {/* 3. TAB: طلبة المادة */}
      {activeTab === 'students' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-fade-in">
          <HrManagementAdminView initialRoleFilter="student" />
        </div>
      )}

      {/* 4. TAB: الأفواج والإسناد */}
      {activeTab === 'cohorts' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-fade-in space-y-6">
          {/* Sub Header / Tab Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCohortSubTab('list')}
                className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                  cohortSubTab === 'list'
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                الأفواج التربوية ({adminStats?.recentCohorts?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setCohortSubTab('requests')}
                className={`px-4 py-2 rounded-xl text-sm font-black transition-all relative flex items-center gap-2 ${
                  cohortSubTab === 'requests'
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                طلبات فتح الأفواج
                {pendingRequests.length > 0 && (
                  <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setCohortSubTab('distribution')}
                className={`px-4 py-2 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${
                  cohortSubTab === 'distribution'
                    ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                الإسناد الأكاديمي وتوزيع المشرفين (مشرف أو أكثر لكل مادة)
              </button>
            </div>

            {cohortSubTab !== 'distribution' && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-fuchsia-500/25 hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> إنشاء فوج وإسناد
              </button>
            )}
          </div>

          {/* Sub Tab: Distribution (Multiple supervisors per subject) */}
          {cohortSubTab === 'distribution' && (
            <div className="pt-2">
              <DistributionAdminPage />
            </div>
          )}

          {/* Sub Tab: Requests */}
          {cohortSubTab === 'requests' && (
            <CohortRequestsAdminView />
          )}

          {/* Sub Tab: List */}
          {cohortSubTab === 'list' && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : adminStats?.recentCohorts?.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Users className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="font-bold text-slate-500 dark:text-slate-400 mb-4">لا توجد أفواج تربوية بعد.</p>
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="px-6 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold transition-colors"
                  >
                    أنشئ أول فوج الآن
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {adminStats?.recentCohorts?.map((cohort: any) => {
                    const maxStudents = cohort.maxStudents || 20;
                    const enrolled = cohort.enrollments?.length || 0;
                    const isFull = enrolled >= maxStudents;
                    const teacherName = cohort.instructors?.[0]?.teacher ? `${cohort.instructors[0].teacher.firstName} ${cohort.instructors[0].teacher.lastName}` : 'غير مسند';
                    
                    return (
                      <div key={cohort.id} className="p-5 border border-slate-100 dark:border-slate-800/50 rounded-2xl bg-white dark:bg-slate-800/50 relative overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-fuchsia-500 to-indigo-500"></div>
                        
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-slate-900 dark:text-white text-base">{cohort.name}</h4>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditingCohort(cohort)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-fuchsia-600 transition-colors" title="تعديل الفوج">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteCohort(cohort.id, cohort.name)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-rose-600 transition-colors" title="حذف الفوج">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded inline-block">{cohort.code}</p>
                          </div>
                          <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${isFull ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                            {enrolled}/{maxStudents}
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-4 overflow-hidden">
                          <div className={`h-1.5 rounded-full transition-all ${isFull ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((enrolled/maxStudents)*100, 100)}%` }}></div>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
                          <UserCheck className="w-4 h-4 text-fuchsia-500 shrink-0" />
                          <span className="truncate">الأستاذ: {teacherName}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB: المرافقة ومتابعة المنهاج */}
      {activeTab === 'accountability' && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm animate-fade-in">
          <SupervisorAccountabilityView />
        </div>
      )}

      {/* Strategic Features (Coming Soon) */}
      <ComingSoonSection 
        features={[
          {
            id: 'export_reports',
            title: 'تصدير التقارير (Export Reports)',
            description: 'استخراج تقارير شاملة بصيغة PDF أو Excel عن عدد الطلاب، نسب الحضور، والأساتذة لتقديمها للجهات المعنية.',
            icon: FileSpreadsheet
          },
          {
            id: 'announcements',
            title: 'إعلانات عامة (Announcements)',
            description: 'إرسال تعميم فوري يظهر في أعلى الشاشة (Banner) لجميع مستخدمي المنصة دفعة واحدة.',
            icon: Megaphone
          },
          {
            id: 'archive_cohorts',
            title: 'أرشيف الأفواج (Archive)',
            description: 'أرشفة بيانات الأفواج المنتهية نهاية العام الدراسي والاحتفاظ بنتائجهم دون حذفها للرجوع إليها لاحقاً.',
            icon: Archive
          }
        ]} 
      />

      {/* Create Cohort Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                 <div className="w-10 h-10 bg-fuchsia-100 dark:bg-fuchsia-900/30 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-fuchsia-600" />
                 </div>
                 إنشاء فوج جديد وإسناد
               </h2>
               <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 p-2 rounded-full">
                 <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleCreateCohortSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اسم الفوج</label>
                <input 
                  type="text" 
                  value={newCohortName}
                  onChange={e => setNewCohortName(e.target.value)}
                  placeholder="مثال: فوج غزة - الفيزياء" 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 font-bold transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">رمز الفوج</label>
                <input 
                  type="text" 
                  value={newCohortCode}
                  onChange={e => setNewCohortCode(e.target.value)}
                  placeholder="مثال: GAZA-PHY-01" 
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 font-bold font-mono transition-all"
                  dir="ltr"
                  required
                />
              </div>

              {(() => {
                const selectedCourse = adminData?.courses?.find((c: any) => c.id === selectedCourseId);
                const targetSubjectId = selectedCourse?.subjectId;
                const targetBranch = selectedCourse?.academicBranch;
                const targetCurriculum = selectedCourse?.curriculumType;
                const targetGrade = selectedCourse?.gradeLevel;
                
                const availableTeachers = adminData?.teachers?.filter((t: any) => !targetSubjectId || t.supervisedSubjectId === targetSubjectId) || [];
                const availableStudents = adminData?.students?.filter((s: any) => 
                  (!targetBranch || s.academicBranch === targetBranch) && 
                  (!targetCurriculum || s.curriculumType === targetCurriculum) &&
                  (!targetGrade || !s.gradeLevel || s.gradeLevel === targetGrade)
                ) || [];

                return (
                  <>
                    <div>
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر المادة والمنهج</label>
                      <select 
                        value={selectedCourseId}
                        onChange={e => {
                          setSelectedCourseId(e.target.value);
                          setSelectedTeacherId('');
                          setSelectedStudentIds([]);
                        }}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 font-bold transition-all"
                        required
                      >
                        <option value="">-- اختر المادة --</option>
                        {adminData?.courses?.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.title} — ({c.gradeLevel === 'grade_11' ? 'صف 11' : 'توجيهي'}) [{c.curriculumType === 'azhari' ? 'أزهري' : 'حكومي'}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اختر الأستاذ (حسب التخصص)</label>
                      <select 
                        value={selectedTeacherId}
                        onChange={e => setSelectedTeacherId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/20 font-bold transition-all"
                        required
                        disabled={!selectedCourseId}
                      >
                        <option value="">-- اختر الأستاذ --</option>
                        {availableTeachers.map((t: any) => (
                          <option key={t.id} value={t.id}>أ. {t.firstName} {t.lastName} ({t.email})</option>
                        ))}
                      </select>
                      {selectedCourseId && availableTeachers.length === 0 && (
                        <p className="text-sm text-amber-500 mt-1 font-bold">لا يوجد أساتذة مسجلون في تخصص هذه المادة.</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300">اختر الطلاب (حسب الفرع والمنهج)</label>
                        {selectedCourseId && availableStudents.length > 0 && (
                          <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => setSelectedStudentIds(availableStudents.map((s: any) => s.id))}
                              className="text-xs text-fuchsia-600 hover:text-fuchsia-700 font-bold bg-fuchsia-50 hover:bg-fuchsia-100 px-2 py-1 rounded"
                            >
                              تحديد الكل
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setSelectedStudentIds([])}
                              className="text-xs text-rose-600 hover:text-rose-700 font-bold bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded"
                            >
                              إلغاء التحديد
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {selectedCourseId && availableStudents.length > 0 && (
                        <div className="mb-2">
                          <input 
                            type="text" 
                            placeholder="ابحث عن طالب بالاسم أو الإيميل..." 
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:border-fuchsia-500 transition-all"
                          />
                        </div>
                      )}

                      <div className="w-full max-h-48 overflow-y-auto px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white">
                        {!selectedCourseId ? (
                          <span className="text-slate-400 text-sm">اختر المادة أولاً لعرض الطلاب المتوافقين</span>
                        ) : availableStudents.length === 0 ? (
                          <span className="text-slate-400 text-sm">لا يوجد طلاب متوافقون مع الفرع والمنهج</span>
                        ) : (
                          <div className="space-y-1 flex flex-col items-start gap-1">
                            {availableStudents
                              .filter((s: any) => 
                                !studentSearchQuery || 
                                (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                                s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())
                              )
                              .map((s: any) => (
                              <label key={s.id} className="flex items-center gap-2 cursor-pointer w-full hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(s.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedStudentIds(prev => [...prev, s.id]);
                                    } else {
                                      setSelectedStudentIds(prev => prev.filter(id => id !== s.id));
                                    }
                                  }}
                                  className="w-4 h-4 text-fuchsia-600 rounded border-slate-300 focus:ring-fuchsia-500 cursor-pointer"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                  {s.firstName} {s.lastName} 
                                  <span className="text-slate-400 font-normal text-xs mr-1">({s.email})</span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold mr-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                                    {s.gradeLevel === 'grade_11' ? 'صف 11' : 'توجيهي'}
                                  </span>
                                </span>
                              </label>
                            ))}
                            {availableStudents.filter((s: any) => !studentSearchQuery || (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearchQuery.toLowerCase()) || s.email.toLowerCase().includes(studentSearchQuery.toLowerCase())).length === 0 && (
                              <span className="text-slate-400 text-sm">لا يوجد نتائج بحث متطابقة.</span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {selectedCourseId && (
                         <div className="mt-2 text-xs font-bold text-slate-500">
                           تم تحديد <span className="text-fuchsia-600">{selectedStudentIds.length}</span> من أصل {availableStudents.length} طلاب مؤهلين
                         </div>
                      )}
                    </div>
                  </>
                );
              })()}

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={createCohortMutation.isPending}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-700 hover:to-indigo-700 text-white font-black rounded-xl transition-all shadow-lg shadow-fuchsia-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {createCohortMutation.isPending ? 'جاري الإنشاء...' : '✅ إنشاء الفوج وإسناد الأستاذ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <EditCohortModal isOpen={!!editingCohort} onClose={() => setEditingCohort(null)} cohort={editingCohort} adminData={adminData} />
    </div>
  );
}
