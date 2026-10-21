import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import PasswordRequestsModal from './PasswordRequestsModal';
import { CheckCircle, XCircle, Users, User, Shield, ShieldAlert, GraduationCap, Trash2 , UserPlus, Key, Bell, X, Eye, BookOpen, MapPin, Sparkles, ArrowRightLeft, Clock, AlertTriangle, Send, Mail, Megaphone } from 'lucide-react';
import { getUserActivityStatus } from '../../../utils/activityStatus';

interface HrManagementAdminViewProps {
  initialRoleFilter?: string;
}

export default function HrManagementAdminView({ initialRoleFilter = 'all' }: HrManagementAdminViewProps) {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState(initialRoleFilter);

  React.useEffect(() => {
    if (initialRoleFilter) {
      setRoleFilter(initialRoleFilter);
    }
  }, [initialRoleFilter]);
  const [isPasswordRequestsOpen, setIsPasswordRequestsOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<any>(null);
  const [selectedUserForView, setSelectedUserForView] = useState<any>(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedUserForDualRole, setSelectedUserForDualRole] = useState<any>(null);
  const [dualRoleSubjectId, setDualRoleSubjectId] = useState<string>('');
  const [enableDualRoleState, setEnableDualRoleState] = useState<boolean>(true);
  const [newPassword, setNewPassword] = useState('');
  const [newUser, setNewUser] = useState({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student', academicBranch: 'scientific', curriculumType: 'governmental', gradeLevel: 'grade_11', supervisedSubjectId: '', nationality: '' });
  const [nudgeUserModal, setNudgeUserModal] = useState<any>(null);
  const [nudgeMessage, setNudgeMessage] = useState<string>('');
  const [isNudging, setIsNudging] = useState<boolean>(false);
  const [showBulkNudgeModal, setShowBulkNudgeModal] = useState<boolean>(false);
  const [bulkNudgeMessage, setBulkNudgeMessage] = useState<string>("");
  const [isBulkNudging, setIsBulkNudging] = useState<boolean>(false);
  const [showImportantModal, setShowImportantModal] = useState<boolean>(false);
  const [importantNoticeTarget, setImportantNoticeTarget] = useState<string>('all');
  const [importantNoticeUser, setImportantNoticeUser] = useState<any>(null);
  const [importantNoticeTitle, setImportantNoticeTitle] = useState<string>('');
  const [importantNoticeBody, setImportantNoticeBody] = useState<string>('');
  const [importantNoticeActionUrl, setImportantNoticeActionUrl] = useState<string>('');
  const [importantNoticeIsUrgent, setImportantNoticeIsUrgent] = useState<boolean>(false);
  const [isSendingImportantNotice, setIsSendingImportantNotice] = useState<boolean>(false);
  const [viewEditSubjectId, setViewEditSubjectId] = useState<string>('');
  const [viewEditNationality, setViewEditNationality] = useState<string>('');

  const { data: subjects = [] } = useQuery({
    queryKey: ['admin_subjects_list'],
    queryFn: async () => {
      const res = await api.get('/curriculum/subjects');
      return res.data;
    }
  });

  const { data: passwordRequests = [] } = useQuery({
    queryKey: ['admin_password_requests'],
    queryFn: async () => {
      const res = await api.get('/users/admin/password-requests');
      return res.data;
    },
    refetchInterval: 10000 // Poll every 10 seconds for notifications
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin_users_list'],
    queryFn: async () => {
      const res = await api.get('/users/admin/list');
      return res.data;
    }
  });

  
  
  const addMutation = useMutation({
    mutationFn: async (userData: any) => {
      return api.post('/users/admin/create', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
      queryClient.invalidateQueries({ queryKey: ['admin_distribution'] });
      setIsAddUserOpen(false);
      setNewUser({ firstName: '', lastName: '', email: '', password: '', primaryRole: 'student', academicBranch: 'scientific', curriculumType: 'governmental', gradeLevel: 'grade_11', supervisedSubjectId: '', nationality: '' });
    }
  });

  const dualRoleMutation = useMutation({
    mutationFn: async ({ id, enableDualRole, supervisedSubjectId }: { id: string; enableDualRole: boolean; supervisedSubjectId?: string }) => {
      const res = await api.patch(`/users/admin/${id}/dual-role`, {
        enableDualRole,
        supervisedSubjectId: supervisedSubjectId || undefined,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
      queryClient.invalidateQueries({ queryKey: ['admin_distribution'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      alert(data?.message || 'تم تحديث الصفة الثنائية بنجاح');
      setSelectedUserForDualRole(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'تعذر تحديث الصفة الثنائية');
    }
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async ({ id, supervisedSubjectId, nationality }: { id: string; supervisedSubjectId?: string | null; nationality?: string | null }) => {
      const res = await api.patch(`/users/admin/${id}/details`, {
        supervisedSubjectId,
        nationality
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
      queryClient.invalidateQueries({ queryKey: ['admin_distribution'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      setSelectedUserForView((prev: any) => prev ? { ...prev, ...data } : null);
      alert('تم تثبيت وحفظ البيانات بنجاح في قاعدة البيانات!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'تعذر حفظ البيانات');
    }
  });
  
  
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return api.patch(`/users/admin/${id}/password`, { password });
    },
    onSuccess: () => {
      alert('تم تغيير كلمة المرور بنجاح');
      setIsResetPasswordOpen(false);
      setNewPassword('');
    }
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/users/admin/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      return api.patch(`/users/admin/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_users_list'] });
      queryClient.invalidateQueries({ queryKey: ['admin_pending_users'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    }
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const idleCount = users.filter((u: any) => getUserActivityStatus(u.lastLoginAt, u.createdAt).isIdle).length;

  const teachersWithoutSubject = users.filter((u: any) => 
    (u.primaryRole === 'teacher') && !u.supervisedSubjectId && !u.isDualRole
  );

  const filteredUsers = users.filter((u: any) => {
    if (roleFilter === 'idle') {
      return getUserActivityStatus(u.lastLoginAt, u.createdAt).isIdle;
    }
    if (roleFilter === 'no_subject') {
      return (u.primaryRole === 'teacher') && !u.supervisedSubjectId && !u.isDualRole;
    }
    if (roleFilter === 'all') return true;
    if (roleFilter === 'teacher') {
      return u.primaryRole === 'teacher' || u.isDualRole || (Array.isArray(u.roles) && u.roles.includes('teacher'));
    }
    if (roleFilter === 'subject_supervisor') {
      return u.primaryRole === 'subject_supervisor' || u.isDualRole || (Array.isArray(u.roles) && u.roles.includes('subject_supervisor'));
    }
    return u.primaryRole === roleFilter;
  });

  const getRoleBadge = (userOrRole: any) => {
    const role = typeof userOrRole === 'string' ? userOrRole : userOrRole?.primaryRole;
    const isDual = typeof userOrRole === 'object' && userOrRole?.isDualRole;
    const subjectName = typeof userOrRole === 'object' ? (userOrRole?.supervisedSubject?.nameAr || subjects.find((s: any) => s.id === userOrRole?.supervisedSubjectId)?.nameAr) : null;

    if (isDual) {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 text-indigo-700 bg-gradient-to-r from-purple-100 to-emerald-100 border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            مشرف منسق + أستاذ (صفة ثنائية)
          </span>
          {subjectName && (
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
              مادة: {subjectName}
            </span>
          )}
        </div>
      );
    }

    switch(role) {
      case 'student': return <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold"><GraduationCap className="w-3 h-3"/> طالب</span>;
      case 'teacher': return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-xs font-bold"><User className="w-3 h-3"/> أستاذ</span>
          {subjectName ? (
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50/70 px-2 py-0.5 rounded">مادة: {subjectName}</span>
          ) : (
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1" title="يجب تحديد مادة التدريس لتفويجه وإسناد الأفواج إليه">
              <AlertTriangle className="w-2.5 h-2.5" /> بحاجة لتحديد مادة التدريس
            </span>
          )}
        </div>
      );
      case 'subject_supervisor': return (
        <div className="flex flex-col items-start gap-1">
          <span className="inline-flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-md text-xs font-bold"><Shield className="w-3 h-3"/> مشرف منسق</span>
          {subjectName ? (
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50/70 px-2 py-0.5 rounded">مادة: {subjectName}</span>
          ) : (
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5" /> بحاجة لتحديد مادة الإشراف
            </span>
          )}
        </div>
      );
      case 'admin':
      case 'super_admin': return <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-bold"><ShieldAlert className="w-3 h-3"/> إدارة</span>;
      default: return <span className="text-slate-600 bg-slate-50 px-2 py-1 rounded-md text-xs font-bold">{role}</span>;
    }
  };

  const pendingCount = users.filter((u: any) => u.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
          <button onClick={() => setIsPasswordRequestsOpen(true)} className="relative px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
            <Key className="w-5 h-5" /> طلبات كلمات المرور
            {passwordRequests.length > 0 && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-red-500 items-center justify-center text-xs text-white font-black shadow-lg ring-2 ring-white dark:ring-slate-900 border-2 border-red-200">
                  {passwordRequests.length}
                </span>
                <Bell className="absolute -top-4 -right-1 w-4 h-4 text-red-500 animate-bounce drop-shadow-md" />
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsAddUserOpen(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            إضافة مستخدم جديد
          </button>
        </div>
        {/* Sub-tabs for filtering */}
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => setRoleFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          الجميع
        </button>
        <button 
          onClick={() => setRoleFilter('student')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'student' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          الطلبة
        </button>
        <button 
          onClick={() => setRoleFilter('teacher')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'teacher' ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          الأساتذة
        </button>
        <button 
          onClick={() => setRoleFilter('subject_supervisor')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${roleFilter === 'subject_supervisor' ? 'bg-purple-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          المشرفون
        </button>
        
        <button 
          onClick={() => setRoleFilter('idle')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            roleFilter === 'idle' 
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400' 
              : 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
          title="عرض المستخدمين الخاملين أو المنقطعين عن المنصة لأكثر من أسبوع"
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>الخاملون والمنقطعون</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-200">
            {idleCount}
          </span>
        </button>

        {roleFilter === 'idle' && idleCount > 0 && (
          <button
            onClick={() => {
              setBulkNudgeMessage('نلفت عنايتكم الكريمة إلى انقطاعكم عن منصة باقون مؤخراً. نرجو تسجيل الدخول ومتابعة مهامكم وحصصكم والتكليفات بانتظام.');
              setShowBulkNudgeModal(true);
            }}
            className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Mail className="w-4 h-4" />
            <span>تنبيه كافة الخاملين ({idleCount}) عبر المنصة والبريد</span>
          </button>
        )}
        
        <button
          onClick={() => {
            setImportantNoticeTarget(roleFilter === 'all' || roleFilter === 'idle' ? 'all' : roleFilter);
            setImportantNoticeUser(null);
            setImportantNoticeTitle('');
            setImportantNoticeBody('');
            setImportantNoticeActionUrl('');
            setImportantNoticeIsUrgent(false);
            setShowImportantModal(true);
          }}
          className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-700 via-baaqoon-800 to-amber-700 hover:from-emerald-800 hover:to-amber-800 text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer mr-2"
          title="إرسال تعميم أو إشعار هام يصل داخل المنصة وعلى البريد الإلكتروني فوراً"
        >
          <Megaphone className="w-4 h-4 text-amber-300" />
          <span>إرسال إشعار وتعميم هام (منصة + بريد)</span>
        </button>

        {pendingCount > 0 && (
          <div className="mr-auto bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            {pendingCount} حسابات بانتظار الموافقة
          </div>
        )}
      </div>

      {/* Warning banner for teachers without subject */}
      {teachersWithoutSubject.length > 0 && (
        <div className="flex items-center gap-3 p-3 mb-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-amber-800 dark:text-amber-200 font-bold text-sm">
              {teachersWithoutSubject.length} أستاذ بدون مادة محددة — مخفيون عن المنسقين
            </p>
            <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">
              يجب تحديد مادتهم ليظهروا في لوحة المنسق ويتم إسناد الأفواج إليهم
            </p>
          </div>
          <button
            onClick={() => setRoleFilter(roleFilter === 'no_subject' ? 'all' : 'no_subject')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex-shrink-0 ${
              roleFilter === 'no_subject' 
                ? 'bg-amber-600 text-white' 
                : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-50'
            }`}
          >
            {roleFilter === 'no_subject' ? 'عرض الكل' : 'عرض المخفيين فقط'}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-black">الاسم</th>
                <th className="px-6 py-4 font-black">معلومات التواصل</th>
                <th className="px-6 py-4 font-black">الدور</th>
                <th className="px-6 py-4 font-black">حالة الحساب</th>
                <th className="px-6 py-4 font-black">حالة النشاط / آخر دخول</th>
                <th className="px-6 py-4 font-black text-center">الإجراءات (قبول/رفض/تجميد)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u: any) => {
                const act = getUserActivityStatus(u.lastLoginAt, u.createdAt);
                return (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-slate-500">{new Date(u.createdAt).toLocaleDateString('ar-EG')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300">{u.email || 'لا يوجد إيميل'}</div>
                    <div className="text-xs text-slate-500 font-mono" dir="ltr">{u.phone || 'لا يوجد هاتف'}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(u)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                      u.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                      u.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {u.status === 'active' ? 'نشط' : u.status === 'pending' ? 'قيد الانتظار' : 'مجمد'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg ${act.badgeClass}`}>
                        <span className={`w-2 h-2 rounded-full ${act.dotClass}`} />
                        {act.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono" dir="rtl">
                        {u.lastLoginAt ? `آخر ظهور: ${act.formattedLastLogin}` : 'لم يسجل الدخول قط'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {act.isIdle && (
                        <button
                          onClick={() => {
                            setNudgeUserModal(u);
                            setNudgeMessage(
                              u.primaryRole === 'teacher'
                                ? `أهلاً أ. ${u.firstName}، نلفت عنايتكم الكريمة إلى انقطاعكم عن المنصة مؤخراً، نرجو تسجيل الدخول ومتابعة الأفواج والخطط الأكاديمية.`
                                : `مرحباً ${u.firstName}، نلاحظ غيابك عن المنصة مؤخراً، نرجو تسجيل الدخول للاطلاع على الحصص والتكليفات المدرسية بانتظام.`
                            );
                          }}
                          title="إرسال تنبيه خمول ومتابعة (منصة + بريد)"
                          className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg transition-colors ml-1"
                        >
                          <Bell className="w-5 h-5 text-amber-600 animate-pulse" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setImportantNoticeUser(u);
                          setImportantNoticeTarget('single');
                          setImportantNoticeTitle('');
                          setImportantNoticeBody('');
                          setImportantNoticeActionUrl('');
                          setImportantNoticeIsUrgent(false);
                          setShowImportantModal(true);
                        }}
                        title={`إرسال إشعار هام إلى ${u.firstName} (منصة + بريد)`}
                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg transition-colors ml-1"
                      >
                        <Megaphone className="w-5 h-5 text-rose-600" />
                      </button>
                      {u.status !== 'active' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: u.id, status: 'active' })}
                          disabled={updateStatusMutation.isPending}
                          title="قبول وتنشيط"
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      )}
                      {(u.primaryRole === 'teacher' || u.primaryRole === 'subject_supervisor' || u.isDualRole) && (
                        <button
                          onClick={() => {
                            setSelectedUserForDualRole(u);
                            setDualRoleSubjectId(u.supervisedSubjectId || '');
                            setEnableDualRoleState(true);
                          }}
                          title="ترقية أو إدارة الصفة الثنائية (تدريس + إشراف معاً بدون حسابين)"
                          className={`px-2.5 py-2 rounded-lg transition-colors ml-1 flex items-center gap-1 text-xs font-black ${
                            u.isDualRole
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-200'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                          }`}
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          <span className="hidden xl:inline">{u.isDualRole ? 'الصفة الثنائية' : 'ترقية لصفة ثنائية'}</span>
                        </button>
                      )}
                      <button
                        onClick={() => { 
                          setSelectedUserForView(u); 
                          setViewEditSubjectId(u.supervisedSubjectId || '');
                          setViewEditNationality(u.nationality || '');
                          setIsViewDetailsOpen(true); 
                        }}
                        title="عرض كل التفاصيل"
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors ml-1"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setSelectedUserForReset(u); setIsResetPasswordOpen(true); }}
                        title="تغيير كلمة المرور"
                        className="p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors ml-1"
                      >
                        <Key className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => {
                          if(window.confirm('هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع عن هذا الإجراء!')) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="حذف نهائي"
                        className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors ml-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      {u.status !== 'suspended' && (
                        <button
                          onClick={() => {
                            if(window.confirm('هل أنت متأكد من تجميد / رفض هذا الحساب؟')) {
                              updateStatusMutation.mutate({ id: u.id, status: 'suspended' });
                            }
                          }}
                          disabled={updateStatusMutation.isPending}
                          title="رفض / تجميد"
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
              
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    لا يوجد حسابات مسجلة في هذا القسم.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
      {isAddUserOpen && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-3">
              <UserPlus className="w-7 h-7 text-violet-500" /> إضافة مستخدم جديد
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="الاسم الأول" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.firstName} onChange={e => setNewUser({...newUser, firstName: e.target.value})} />
              <input type="text" placeholder="الاسم الأخير" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.lastName} onChange={e => setNewUser({...newUser, lastName: e.target.value})} />
              <input type="email" placeholder="البريد الإلكتروني" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input type="password" placeholder="كلمة المرور (اختياري، الافتراضي: 123456)" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.primaryRole} onChange={e => setNewUser({...newUser, primaryRole: e.target.value})}>
                <option value="student">طالب</option>
                <option value="teacher">أستاذ</option>
                <option value="subject_supervisor">مشرف منسق</option>
                <option value="dual_teacher_supervisor">أستاذ ومشرف منسق معاً (صفة ثنائية)</option>
                <option value="admin">مدير (Admin)</option>
              </select>

              {newUser.primaryRole === 'student' && (
                <div className="space-y-3 animate-fade-in-up">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1">الصف الدراسي</label>
                      <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.gradeLevel} onChange={e => setNewUser({...newUser, gradeLevel: e.target.value})}>
                        <option value="grade_11">الصف الحادي عشر (11)</option>
                        <option value="grade_12">الصف الثاني عشر (توجيهي - 12)</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 mb-1">الفرع الأكاديمي</label>
                      <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.academicBranch} onChange={e => setNewUser({...newUser, academicBranch: e.target.value})}>
                        <option value="scientific">علمي</option>
                        <option value="literary">أدبي</option>
                        <option value="entrepreneurship">ريادة وأعمال</option>
                        <option value="industrial">صناعي</option>
                        <option value="sharia">شرعي</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">المنهج</label>
                    <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.curriculumType} onChange={e => setNewUser({...newUser, curriculumType: e.target.value})}>
                      <option value="governmental">منهج عام (حكومي)</option>
                      <option value="azhari">منهج أزهري معتمد</option>
                    </select>
                  </div>
                </div>
              )}

              {(newUser.primaryRole === 'teacher' || newUser.primaryRole === 'subject_supervisor' || newUser.primaryRole === 'dual_teacher_supervisor') && (
                <div className="animate-fade-in-up">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {newUser.primaryRole === 'teacher' ? 'مادة التخصص للأستاذ' : newUser.primaryRole === 'dual_teacher_supervisor' ? 'مادة التدريس والتنسيق المشترك (صفة ثنائية)' : 'مادة التنسيق والمتابعة للمشرف'}
                  </label>
                  <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.supervisedSubjectId} onChange={e => setNewUser({...newUser, supervisedSubjectId: e.target.value})}>
                    <option value="">-- اختر المادة --</option>
                    {subjects.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nameAr}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* حقل الجنسية لجميع المستخدمين */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">الجنسية</label>
                <select className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newUser.nationality} onChange={e => setNewUser({...newUser, nationality: e.target.value})}>
                  <option value="">-- غير محدد --</option>
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
                  <option value="أجنبي (أخرى)">أجنبي (أخرى)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsAddUserOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={() => addMutation.mutate({...newUser, password: newUser.password || '123456'})} disabled={addMutation.isPending} className="flex-2 px-4 py-3 bg-violet-600 text-white rounded-xl font-bold w-2/3">إضافة وتفعيل</button>
            </div>
          </div>
        </div>,
        document.body
      )}
  
      
      {isResetPasswordOpen && selectedUserForReset && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md shadow-2xl p-6">
            <h2 className="text-xl font-black mb-4 dark:text-white">تغيير كلمة المرور</h2>
            <p className="mb-4 text-slate-600 dark:text-slate-400">للمستخدم: {selectedUserForReset.firstName} {selectedUserForReset.lastName}</p>
            <div className="space-y-4">
              <input type="password" placeholder="كلمة المرور الجديدة" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsResetPasswordOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={() => resetPasswordMutation.mutate({ id: selectedUserForReset.id, password: newPassword })} disabled={resetPasswordMutation.isPending || !newPassword} className="flex-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold w-2/3">حفظ الكلمة الجديدة</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {isViewDetailsOpen && selectedUserForView && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-6 h-6" />
                </div>
                تفاصيل حساب المستخدم
              </h2>
              <button onClick={() => setIsViewDetailsOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">الاسم الأول</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{selectedUserForView.firstName}</div>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">اسم العائلة</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">{selectedUserForView.lastName}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">البريد الإلكتروني</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white" dir="ltr">{selectedUserForView.email || '—'}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">رقم الهاتف</span>
                  <div className="text-lg font-bold text-slate-900 dark:text-white font-mono" dir="ltr">{selectedUserForView.phone || '—'}</div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">الدور وصلاحيات الحساب</span>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedUserForView.primaryRole === 'student' ? 'طالب' : 
                       selectedUserForView.primaryRole === 'teacher' ? 'أستاذ' : 
                       selectedUserForView.primaryRole === 'subject_supervisor' ? 'مشرف منسق' : 'مدير'}
                    </div>
                  </div>
                  {getRoleBadge(selectedUserForView.primaryRole)}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">حالة الحساب</span>
                    <div className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedUserForView.status === 'active' ? 'نشط' : selectedUserForView.status === 'pending' ? 'بانتظار التفعيل' : 'مجمد'}
                    </div>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${selectedUserForView.status === 'active' ? 'bg-emerald-500' : selectedUserForView.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-400" /> الجنسية
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">تعديل فوري</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={viewEditNationality}
                      onChange={(e) => setViewEditNationality(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-slate-400"
                    >
                      <option value="">-- غير محدد --</option>
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
                    <button
                      onClick={() => {
                        updateDetailsMutation.mutate({
                          id: selectedUserForView.id,
                          nationality: viewEditNationality || null
                        });
                      }}
                      disabled={updateDetailsMutation.isPending}
                      className="px-5 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-sm transition-all disabled:opacity-50 shrink-0"
                    >
                      تثبيت الجنسية
                    </button>
                  </div>
                </div>

                {selectedUserForView.primaryRole === 'student' && (
                  <>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><GraduationCap className="w-4 h-4" /> الصف والمرحلة</span>
                      <div className="text-lg font-black text-indigo-900 dark:text-indigo-200">
                        {selectedUserForView.gradeLevel === 'grade_11' ? 'الصف الحادي عشر (11)' :
                         selectedUserForView.gradeLevel === 'grade_12' ? 'الصف الثاني عشر (توجيهي)' : 'الصف الحادي عشر (11)'}
                      </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><GraduationCap className="w-4 h-4" /> الفرع الأكاديمي</span>
                      <div className="text-lg font-black text-indigo-900 dark:text-indigo-200">
                        {selectedUserForView.academicBranch === 'scientific' ? 'علمي' :
                         selectedUserForView.academicBranch === 'literary' ? 'أدبي' :
                         selectedUserForView.academicBranch === 'industrial' ? 'صناعي' :
                         selectedUserForView.academicBranch === 'entrepreneurship' ? 'ريادة وأعمال' :
                         selectedUserForView.academicBranch === 'sharia' ? 'شرعي' : selectedUserForView.academicBranch || 'غير محدد'}
                      </div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 md:col-span-2">
                      <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1 flex items-center gap-1"><BookOpen className="w-4 h-4" /> المنهج المعتمد</span>
                      <div className="text-lg font-black text-indigo-900 dark:text-indigo-200">
                        {selectedUserForView.curriculumType === 'governmental' ? 'منهج عام (حكومي)' :
                         selectedUserForView.curriculumType === 'azhari' ? 'منهج أزهري معتمد' : selectedUserForView.curriculumType || 'غير محدد'}
                      </div>
                    </div>
                  </>
                )}

                {(selectedUserForView.primaryRole === 'teacher' || selectedUserForView.primaryRole === 'subject_supervisor') && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-purple-700 dark:text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-purple-600" />
                        {selectedUserForView.primaryRole === 'teacher' ? 'مادة التدريس والتخصص الدراسي' : 'مادة التنسيق والإشراف الأكاديمي'}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        إسناد وتفويج فوري
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <select
                        value={viewEditSubjectId}
                        onChange={(e) => setViewEditSubjectId(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
                      >
                        <option value="">-- غير محدد (اختر المادة لتفويج الأستاذ) --</option>
                        {subjects.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.nameAr}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          updateDetailsMutation.mutate({
                            id: selectedUserForView.id,
                            supervisedSubjectId: viewEditSubjectId || null
                          });
                        }}
                        disabled={updateDetailsMutation.isPending}
                        className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 shrink-0"
                      >
                        {updateDetailsMutation.isPending ? 'جاري الحفظ...' : 'تثبيت مادة التدريس'}
                      </button>
                    </div>

                    <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 font-medium">
                      💡 عند تثبيت مادة التدريس، يظهر الأستاذ فوراً لدى مشرف المادة في قائمة أساتذة التخصص ويكون متاحاً للإسناد في أي فوج دراسي جديد.
                    </p>
                  </div>
                )}

                {(() => {
                  const act = getUserActivityStatus(selectedUserForView.lastLoginAt, selectedUserForView.createdAt);
                  return (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 md:col-span-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        حالة نشاط المستخدم على المنصة
                      </span>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-xl ${act.badgeClass}`}>
                            <span className={`w-2.5 h-2.5 rounded-full ${act.dotClass}`} />
                            {act.label}
                          </span>
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                            {selectedUserForView.lastLoginAt ? `آخر ظهور: ${act.formattedLastLogin}` : 'لم يسجل الدخول للمنصة مطلقاً'}
                          </span>
                        </div>
                        {act.isIdle && (
                          <button
                            onClick={() => {
                              setNudgeUserModal(selectedUserForView);
                              setNudgeMessage(
                                selectedUserForView.primaryRole === 'teacher'
                                  ? `أهلاً أ. ${selectedUserForView.firstName}، نلفت عنايتكم الكريمة إلى انقطاعكم عن المنصة مؤخراً، نرجو تسجيل الدخول ومتابعة الأفواج والخطط الأكاديمية.`
                                  : `مرحباً ${selectedUserForView.firstName}، نلاحظ غيابك عن المنصة مؤخراً، نرجو تسجيل الدخول للاطلاع على الحصص والتكليفات المدرسية بانتظام.`
                              );
                            }}
                            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                          >
                            <Bell className="w-3.5 h-3.5" />
                            إرسال تنبيه خمول مباشر
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button onClick={() => setIsViewDetailsOpen(false)} className="px-8 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl font-bold transition-all">
                إغلاق
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {nudgeUserModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl p-6 border border-amber-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">إرسال تنبيه خمول ومتابعة</h3>
                  <p className="text-xs text-slate-500 font-bold">للمستخدم: {nudgeUserModal.firstName} {nudgeUserModal.lastName}</p>
                </div>
              </div>
              <button onClick={() => setNudgeUserModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p>الربط بالبريد الإلكتروني مفعل تلقائياً 🌿</p>
                  <p className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400 mt-0.5">
                    سيصل هذا التنبيه مباشرة إلى شريط إشعارات المستخدم داخل المنصة، <strong>وكذلك رسالة رسمية فورية إلى بريده الإلكتروني:</strong> <span className="font-mono text-emerald-900 dark:text-emerald-200" dir="ltr">{nudgeUserModal.email || 'غير مسجل'}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  نص التنبيه والمتابعة:
                </label>
                <textarea
                  rows={4}
                  value={nudgeMessage}
                  onChange={(e) => setNudgeMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNudgeUserModal(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isNudging || !nudgeMessage.trim()}
                  onClick={async () => {
                    try {
                      setIsNudging(true);
                      await api.post('/users/admin/nudge-inactive', {
                        userId: nudgeUserModal.id,
                        message: nudgeMessage.trim()
                      });
                      const emailNotice = nudgeUserModal.email ? ' وعبر البريد الإلكتروني (' + nudgeUserModal.email + ')' : '';
                      alert('تم إرسال تنبيه المتابعة بنجاح إلى ' + nudgeUserModal.firstName + ' ' + nudgeUserModal.lastName + ' في المنصة' + emailNotice + '.');
                      setNudgeUserModal(null);
                    } catch (err: any) {
                      alert(err?.response?.data?.message || 'حدث خطأ أثناء إرسال التنبيه');
                    } finally {
                      setIsNudging(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isNudging ? 'جاري الإرسال...' : 'إرسال التنبيه الآن'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showImportantModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xl shadow-2xl p-6 border border-rose-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-md">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">إرسال إشعار وتعميم رسمي هام</h3>
                  <p className="text-xs text-slate-500 font-bold">تسليم مزدوج فوري: في شريط إشعارات المنصة + البريد الإلكتروني</p>
                </div>
              </div>
              <button onClick={() => setShowImportantModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Target recipient info */}
              {importantNoticeUser ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">المستلم الفردي: </span>
                    <strong className="text-emerald-700 dark:text-emerald-400 font-black">{importantNoticeUser.firstName} {importantNoticeUser.lastName}</strong>
                    <span className="text-slate-400 mr-2">({importantNoticeUser.primaryRole})</span>
                  </div>
                  <div className="font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                    {importantNoticeUser.email || 'بدون بريد مسجل'}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    الفئة المستهدفة بالإشعار الهام:
                  </label>
                  <select
                    value={importantNoticeTarget}
                    onChange={(e) => setImportantNoticeTarget(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold"
                  >
                    <option value="all">جميع مستخدمي المنصة (الطلاب + الأساتذة + المشرفين)</option>
                    <option value="student">جميع الطلاب فقط</option>
                    <option value="teacher">جميع الأساتذة فقط</option>
                    <option value="subject_supervisor">جميع المشرفين الأكاديميين فقط</option>
                  </select>
                </div>
              )}

              {/* Title input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    عنوان الإشعار الهام:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setImportantNoticeTitle('تنبيه هام وعاجل: موعد الاختبارات التجريبية')}
                      className="text-[10px] text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg font-bold"
                    >
                      + اختبارات
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportantNoticeTitle('توجيه رسمي هام بشأن تسجيل ومتابعة الحصص')}
                      className="text-[10px] text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg font-bold"
                    >
                      + حصص
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={importantNoticeTitle}
                  onChange={(e) => setImportantNoticeTitle(e.target.value)}
                  placeholder="مثال: تنبيه هام بشأن خطة الدراسة والتقييمات"
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Body textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  نص الإشعار الهام والتعميم (المنصة + البريد الإلكتروني):
                </label>
                <textarea
                  rows={4}
                  value={importantNoticeBody}
                  onChange={(e) => setImportantNoticeBody(e.target.value)}
                  placeholder="اكتب التوجيه والتعميم بالتفصيل..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Action URL input */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  رابط الإجراء في المنصة (اختياري):
                </label>
                <input
                  type="text"
                  value={importantNoticeActionUrl}
                  onChange={(e) => setImportantNoticeActionUrl(e.target.value)}
                  placeholder="/student/schedule أو /teacher/dashboard"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                  dir="ltr"
                />
              </div>

              {/* Priority Toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={importantNoticeIsUrgent}
                  onChange={(e) => setImportantNoticeIsUrgent(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-rose-800 dark:text-rose-300">تمييز كإشعار عاجل ذو أولوية قصوى 🚨</span>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">يظهر بشارة تنبيه حمراء بارزة في الإشعارات وعنوان البريد الإلكتروني.</p>
                </div>
              </label>

              {/* Dual delivery guarantee note */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-bold flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p>الربط بالبريد الإلكتروني نشط تلقائياً 🌿</p>
                  <p className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400 mt-0.5">
                    يصل هذا الإشعار إلى شريط التنبيهات الداخلي، وتُرسل نسخة رسمية مطابقة عبر البريد الإلكتروني لكل مستهدف بهوية منصة باقون المعتمدة.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportantModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isSendingImportantNotice || !importantNoticeTitle.trim() || !importantNoticeBody.trim()}
                  onClick={async () => {
                    try {
                      setIsSendingImportantNotice(true);
                      const payload: any = {
                        title: importantNoticeTitle.trim(),
                        body: importantNoticeBody.trim(),
                        actionUrl: importantNoticeActionUrl.trim() || undefined,
                        isUrgent: importantNoticeIsUrgent,
                      };
                      if (importantNoticeUser) {
                        payload.userId = importantNoticeUser.id;
                      } else {
                        payload.role = importantNoticeTarget;
                      }

                      const res = await api.post('/notifications/admin/broadcast-important', payload);
                      alert(res.data?.message || 'تم إرسال الإشعار الهام بنجاح عبر المنصة والبريد الإلكتروني.');
                      setShowImportantModal(false);
                    } catch (err: any) {
                      alert(err?.response?.data?.message || 'حدث خطأ أثناء إرسال الإشعار الهام');
                    } finally {
                      setIsSendingImportantNotice(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isSendingImportantNotice ? 'جاري الإرسال المزدوج...' : 'إرسال الإشعار الهام الآن'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showBulkNudgeModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl p-6 border border-rose-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">تنبيه متابعة جماعي لكافة الخاملين</h3>
                  <p className="text-xs text-slate-500 font-bold">العدد الإجمالي المستهدف: {idleCount} مستخدم</p>
                </div>
              </div>
              <button onClick={() => setShowBulkNudgeModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-bold">
                سيتم إرسال هذا التنبيه دفعة واحدة إلى كافة المستخدمين المنقطعين عن المنصة؛ حيث يصلهم إشعار داخلي في المنصة مع رسالة بريد إلكتروني مخصصة باسم كل مستخدم ورابط تسجيل الدخول.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  نص التنبيه الجماعي (المنصة + البريد الإلكتروني):
                </label>
                <textarea
                  rows={4}
                  value={bulkNudgeMessage}
                  onChange={(e) => setBulkNudgeMessage(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkNudgeModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={isBulkNudging || !bulkNudgeMessage.trim()}
                  onClick={async () => {
                    try {
                      setIsBulkNudging(true);
                      const res = await api.post('/users/admin/nudge-inactive-bulk', {
                        message: bulkNudgeMessage.trim()
                      });
                      alert(res.data?.message || 'تم إرسال التنبيه الجماعي بنجاح إلى المستخدمين في المنصة والبريد.');
                      setShowBulkNudgeModal(false);
                    } catch (err) {
                      alert(err?.response?.data?.message || 'حدث خطأ أثناء الإرسال الجماعي');
                    } finally {
                      setIsBulkNudging(false);
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {isBulkNudging ? 'جاري الإرسال الجماعي...' : 'إرسال للجميع (' + idleCount + ')'}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedUserForDualRole && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl p-6 border border-indigo-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <ArrowRightLeft className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    الترقية والصفة الثنائية (تدريس + إشراف)
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    {selectedUserForDualRole.firstName} {selectedUserForDualRole.lastName}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedUserForDualRole(null)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs font-bold text-indigo-900 dark:text-indigo-200 leading-relaxed">
              تتيح <strong>الصفة الثنائية</strong> للأستاذ أو المشرف الجمع بين <strong>التدريس الفعلي للأفواج</strong> و<strong>الإشراف والتنسيق الأكاديمي للمادة</strong> من نفس الحساب مع زر تبديل فوري بين الفضاءين دون الحاجة للتسجيل مرتين، كما تسمح بتعيين أكثر من مشرف لنفس المادة.
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                مادة التخصص والتنسيق المشترك:
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm"
                value={dualRoleSubjectId}
                onChange={(e) => setDualRoleSubjectId(e.target.value)}
              >
                <option value="">-- اختر المادة الدراسية --</option>
                {subjects.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                نوع الصلاحية المطلوبة:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setEnableDualRoleState(true)}
                  className={`p-3 rounded-xl border text-right font-bold text-xs flex items-center justify-between transition-all ${
                    enableDualRoleState
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>تفعيل الصفة الثنائية (مشرف منسق للمادة + أستاذ مدرّس للأفواج معاً)</span>
                  <Sparkles className="w-4 h-4 shrink-0" />
                </button>
                {selectedUserForDualRole.isDualRole && (
                  <button
                    type="button"
                    onClick={() => setEnableDualRoleState(false)}
                    className={`p-3 rounded-xl border text-right font-bold text-xs flex items-center justify-between transition-all ${
                      !enableDualRoleState
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>إلغاء الصفة الثنائية والاكتفاء بصفة أستاذ فقط</span>
                    <User className="w-4 h-4 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedUserForDualRole(null)}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() =>
                  dualRoleMutation.mutate({
                    id: selectedUserForDualRole.id,
                    enableDualRole: enableDualRoleState,
                    supervisedSubjectId: dualRoleSubjectId || undefined,
                  })
                }
                disabled={dualRoleMutation.isPending || (enableDualRoleState && !dualRoleSubjectId)}
                className="flex-2 w-2/3 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-sm shadow-md"
              >
                {dualRoleMutation.isPending ? 'جاري الحفظ...' : 'اعتماد وحفظ الصفة'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isPasswordRequestsOpen && (
        <PasswordRequestsModal onClose={() => setIsPasswordRequestsOpen(false)} />
      )}

      </div>
    </div>
  );
}
