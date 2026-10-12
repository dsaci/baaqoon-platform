import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { 
  Shield, 
  User, 
  Users, 
  BookOpen, 
  AlertCircle, 
  Check, 
  X, 
  Loader2, 
  CheckCircle2, 
  UserCheck, 
  UserX,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';

interface ErrorBoundaryProps { children: React.ReactNode }
interface ErrorBoundaryState { hasError: boolean; error: any }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'white' }}>
          <h1>حدث خطأ في تحميل صفحة الإسناد الأكاديمي.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function DistributionAdminPageInner() {
  const queryClient = useQueryClient();
  const [assigningSubjectId, setAssigningSubjectId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['admin_distribution'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/distribution');
      return res.data;
    }
  });

  const assignSupervisorMutation = useMutation({
    mutationFn: async ({ subjectId, userId }: { subjectId: string; userId: string }) => {
      const res = await api.patch(`/groups/admin/distribution/${subjectId}/supervisor/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_distribution'] });
      setAssigningSubjectId(null);
      setSelectedUserId('');
      showToast(data?.message || 'تم تحديث تعيين المشرف بنجاح!', 'success');
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'تعذر تحديث المشرف، يرجى إعادة المحاولة';
      showToast(errMsg, 'error');
    }
  });

  const handleStartAssign = (subjectId: string, currentSupervisorId?: string) => {
    setAssigningSubjectId(subjectId);
    setSelectedUserId(currentSupervisorId || 'none');
  };

  const handleConfirmAssign = (subjectId: string) => {
    if (!selectedUserId) {
      showToast('يرجى تحديد المشرف أو اختيار "بدون مشرف"', 'error');
      return;
    }
    assignSupervisorMutation.mutate({ subjectId, userId: selectedUserId });
  };

  const handleCancelAssign = () => {
    setAssigningSubjectId(null);
    setSelectedUserId('');
  };

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col justify-center items-center h-full gap-4">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-sm">جاري تحميل بيانات الإسناد الأكاديمي...</p>
      </div>
    );
  }

  const { subjects = [], supervisors = [] } = data || {};

  const assignedCount = subjects.filter((s: any) => s.supervisors && s.supervisors.length > 0).length;
  const unassignedCount = subjects.length - assignedCount;
  const totalTeachers = subjects.reduce((sum: number, s: any) => sum + (s.teachers?.length || 0), 0);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'subject_supervisor':
        return 'مشرف مادة';
      case 'teacher':
        return 'معلم';
      case 'admin':
      case 'super_admin':
        return 'إدارة النظام';
      default:
        return 'كادر أكاديمي';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up font-sans pb-12" dir="rtl">
      {/* Toast Alert */}
      {toast && (
        <div 
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-bold transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">الإسناد الأكاديمي وتوزيع المشرفين</h1>
            {isRefetching && (
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
            )}
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
            إدارة وتعيين المشرفين الأكاديميين على المواد ومتابعة الأساتذة المعينين في الأفواج.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المواد الدراسية</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{subjects.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">مواد لها مشرف معتمد</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{assignedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">مواد بانتظار تعيين مشرف</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{unassignedCount}</p>
          </div>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects.map((subject: any) => {
          // Look for assigned supervisor (primaryRole is supervisor/admin)
          const supervisor = subject.supervisors?.[0];
          const isAssigning = assigningSubjectId === subject.id;
          const isPending = assignSupervisorMutation.isPending && assigningSubjectId === subject.id;

          return (
            <div 
              key={subject.id} 
              className="bg-white dark:bg-slate-900/60 rounded-2xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-violet-600"></div>
              
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      {subject.nameAr}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {subject.code}
                      </span>
                      {subject.applicableBranches && (
                        <span className="text-slate-400 text-xs">
                          {Array.isArray(subject.applicableBranches) ? subject.applicableBranches.join(' • ') : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isAssigning && (
                  <button 
                    onClick={() => handleStartAssign(subject.id, supervisor?.id)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300 px-3.5 py-1.5 rounded-lg transition-colors border border-violet-100 dark:border-violet-800 shrink-0 shadow-sm"
                  >
                    {supervisor ? 'تغيير المشرف' : 'تعيين مشرف'}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Supervisor Box */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <Shield className="w-4 h-4 text-purple-500" />
                      مشرف المادة المسؤول
                    </h4>
                    {supervisor && !isAssigning && (
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded-full">
                        مشرف معتمد
                      </span>
                    )}
                  </div>

                  {isAssigning ? (
                    <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border-2 border-violet-200 dark:border-violet-900/60 shadow-sm animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                        اختر المشرف الجديد أو اختر إلغاء التعيين:
                      </label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-slate-800 dark:text-slate-100"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        disabled={isPending}
                      >
                        <option value="none" className="text-rose-600 font-bold">
                          ✖ بدون مشرف (إلغاء التعيين الحالي)
                        </option>
                        <optgroup label="المشرفون والإدارة">
                          {supervisors
                            .filter((s: any) => s.primaryRole !== 'teacher')
                            .map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.firstName} {s.lastName} ({getRoleLabel(s.primaryRole)})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="الأساتذة (سيتم ترقيتهم إلى مشرف)">
                          {supervisors
                            .filter((s: any) => s.primaryRole === 'teacher')
                            .map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.firstName} {s.lastName} (معلم)
                              </option>
                            ))}
                        </optgroup>
                      </select>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button 
                          onClick={handleCancelAssign}
                          disabled={isPending}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          إلغاء
                        </button>
                        <button 
                          onClick={() => handleConfirmAssign(subject.id)}
                          disabled={isPending}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              جاري الحفظ...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              تأكيد التعيين
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : supervisor ? (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm">
                        {supervisor.firstName?.[0] || 'م'}{supervisor.lastName?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {supervisor.firstName} {supervisor.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {supervisor.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              {supervisor.email}
                            </span>
                          )}
                          {supervisor.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                              {supervisor.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm font-bold p-3 bg-white/60 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>لم يتم تعيين مشرف لهذه المادة حتى الآن.</span>
                    </div>
                  )}
                </div>

                {/* Teachers Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60">
                  <h4 className="text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                    <Users className="w-4 h-4 text-emerald-500" />
                    الأساتذة النشطون ضمن أفواج المادة ({subject.teachers?.length || 0})
                  </h4>
                  
                  {subject.teachers && subject.teachers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subject.teachers.map((teacher: any) => (
                        <div 
                          key={teacher.id} 
                          className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs"
                        >
                          <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{teacher.firstName} {teacher.lastName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold p-2 bg-white/40 dark:bg-slate-800/20 rounded-lg">
                      لا يوجد أساتذة معينين لأفواج هذه المادة حالياً.
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DistributionAdminPage() { 
  return (
    <ErrorBoundary>
      <DistributionAdminPageInner />
    </ErrorBoundary>
  ); 
}