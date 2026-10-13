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
  Phone,
  Mail,
  Trash2,
  UserPlus,
  Sparkles,
  GraduationCap
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

  // Mutation to add / assign a supervisor to a subject
  const addSupervisorMutation = useMutation({
    mutationFn: async ({ subjectId, userId }: { subjectId: string; userId: string }) => {
      const res = await api.post(`/groups/admin/distribution/${subjectId}/supervisor/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_distribution'] });
      setAssigningSubjectId(null);
      setSelectedUserId('');
      showToast(data?.message || 'تم تعيين المشرف بنجاح!', 'success');
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'تعذر إضافة المشرف، يرجى إعادة المحاولة';
      showToast(errMsg, 'error');
    }
  });

  // Mutation to remove a specific supervisor from a subject
  const removeSupervisorMutation = useMutation({
    mutationFn: async ({ subjectId, userId }: { subjectId: string; userId: string }) => {
      const res = await api.delete(`/groups/admin/distribution/${subjectId}/supervisor/${userId}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin_distribution'] });
      showToast(data?.message || 'تم إزالة المشرف من المادة بنجاح', 'success');
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.message || 'تعذر إزالة المشرف، يرجى إعادة المحاولة';
      showToast(errMsg, 'error');
    }
  });

  const handleStartAddSupervisor = (subjectId: string) => {
    setAssigningSubjectId(subjectId);
    setSelectedUserId('');
  };

  const handleConfirmAddSupervisor = (subjectId: string) => {
    if (!selectedUserId) {
      showToast('يرجى اختيار المشرف أو الأستاذ المراد تعيينه', 'error');
      return;
    }
    addSupervisorMutation.mutate({ subjectId, userId: selectedUserId });
  };

  const handleRemoveSupervisor = (subjectId: string, supervisor: any) => {
    if (confirm(`هل أنت متأكد من إزالة المشرف "${supervisor.firstName} ${supervisor.lastName}" من هذه المادة؟`)) {
      removeSupervisorMutation.mutate({ subjectId, userId: supervisor.id });
    }
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
  const totalAssignedSupervisors = subjects.reduce((sum: number, s: any) => sum + (s.supervisors?.length || 0), 0);

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
            إدارة وتعيين المشرفين والمنسقين الأكاديميين (مشرف واحد أو أكثر لكل مادة) ومتابعة الأساتذة المعينين في الأفواج.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">مواد لها مشرفون</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{assignedCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي المشرفين المعينين</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400">{totalAssignedSupervisors}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3.5 shadow-sm">
          <div className="w-11 h-11 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">مواد بانتظار مشرف</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{unassignedCount}</p>
          </div>
        </div>
      </div>

      {/* Grid of Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects.map((subject: any) => {
          const subjectSupervisors: any[] = subject.supervisors || [];
          const isAssigning = assigningSubjectId === subject.id;
          const isPending = addSupervisorMutation.isPending && assigningSubjectId === subject.id;

          // Filter out candidates already assigned as supervisors to this subject
          const availableCandidates = supervisors.filter((c: any) => 
            !subjectSupervisors.some((s: any) => s.id === c.id)
          );

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
                    onClick={() => handleStartAddSupervisor(subject.id)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300 px-3.5 py-1.5 rounded-lg transition-colors border border-violet-100 dark:border-violet-800 shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>إضافة مشرف للمادة</span>
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {/* Supervisors Box (supports multiple supervisors) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <Shield className="w-4 h-4 text-purple-500" />
                      مشرفو ومنسقو المادة المعتمدون ({subjectSupervisors.length})
                    </h4>
                    {subjectSupervisors.length > 0 && (
                      <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-0.5 rounded-full">
                        {subjectSupervisors.length === 1 ? 'مشرف واحد' : `${subjectSupervisors.length} مشرفين`}
                      </span>
                    )}
                  </div>

                  {/* Add Supervisor Form */}
                  {isAssigning && (
                    <div className="space-y-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border-2 border-violet-200 dark:border-violet-900/60 shadow-sm animate-in fade-in mb-3">
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                        اختر المشرف أو الأستاذ لإضافته إلى قائمة منسقي هذه المادة (المعلم المرقّى يحصل تلقائياً على صفة ثنائية: تدريس + إشراف دون الحاجة لحسابين):
                      </label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none text-slate-800 dark:text-slate-100"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        disabled={isPending}
                      >
                        <option value="">-- اختر من القائمة المرشحة --</option>
                        <optgroup label="المشرفون والإدارة">
                          {availableCandidates
                            .filter((s: any) => s.primaryRole !== 'teacher')
                            .map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.firstName} {s.lastName} ({getRoleLabel(s.primaryRole)})
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="الأساتذة (ترقية لصفة ثنائية: أستاذ مدرّس + مشرف منسق)">
                          {availableCandidates
                            .filter((s: any) => s.primaryRole === 'teacher')
                            .map((s: any) => (
                              <option key={s.id} value={s.id}>
                                {s.firstName} {s.lastName} (أستاذ — ترقية لصفة ثنائية)
                              </option>
                            ))}
                        </optgroup>
                      </select>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button 
                          onClick={handleCancelAssign}
                          disabled={isPending}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          إلغاء
                        </button>
                        <button 
                          onClick={() => handleConfirmAddSupervisor(subject.id)}
                          disabled={isPending || !selectedUserId}
                          className="px-4 py-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              جاري الإضافة...
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              تعيين / ترقية بصفة ثنائية
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of current supervisors */}
                  {subjectSupervisors.length > 0 ? (
                    <div className="space-y-2">
                      {subjectSupervisors.map((supervisor: any) => (
                        <div 
                          key={supervisor.id}
                          className="flex items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-2xs">
                              {supervisor.firstName?.[0] || 'م'}{supervisor.lastName?.[0] || ''}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {supervisor.firstName} {supervisor.lastName}
                                </p>
                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                                  منسق معتمد
                                </span>
                                {(supervisor.isDualRole || (supervisor.taughtCohortsCount && supervisor.taughtCohortsCount > 0)) && (
                                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <GraduationCap className="w-3 h-3" />
                                    صفة ثنائية: مشرف + أستاذ مدرّس
                                    {supervisor.taughtCohortsCount ? ` (${supervisor.taughtCohortsCount} أفواج)` : ''}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                {supervisor.email && (
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    {supervisor.email}
                                  </span>
                                )}
                                {supervisor.phone && (
                                  <span className="flex items-center gap-1 font-mono">
                                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                    {supervisor.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveSupervisor(subject.id, supervisor)}
                            disabled={removeSupervisorMutation.isPending}
                            title="إلغاء إسناد هذا المشرف من المادة (مع الاحتفاظ بحسابه التدريسي)"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : !isAssigning ? (
                    <div className="flex items-center justify-between gap-2 p-3 bg-white/60 dark:bg-slate-800/40 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>لم يتم تعيين أي مشرف لهذه المادة حتى الآن.</span>
                      </div>
                      <button
                        onClick={() => handleStartAddSupervisor(subject.id)}
                        className="text-xs font-bold text-violet-600 hover:underline cursor-pointer"
                      >
                        + تعيين الآن
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Teachers Section with 1-Click Dual-Role Promotion */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs font-black flex items-center gap-1.5 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      <Users className="w-4 h-4 text-emerald-500" />
                      الأساتذة النشطون ضمن أفواج المادة ({subject.teachers?.length || 0})
                    </h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      يمكن ترقية أي أستاذ لمشرف منسق بصفة ثنائية بضغطة زر
                    </span>
                  </div>
                  
                  {subject.teachers && subject.teachers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subject.teachers.map((teacher: any) => {
                        const isAlreadySupervisor = subjectSupervisors.some((s: any) => s.id === teacher.id);
                        return (
                          <div 
                            key={teacher.id} 
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-2xs"
                          >
                            <User className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>{teacher.firstName} {teacher.lastName}</span>
                            {isAlreadySupervisor ? (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                                مشرف + أستاذ
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addSupervisorMutation.mutate({ subjectId: subject.id, userId: teacher.id })}
                                disabled={addSupervisorMutation.isPending}
                                title="ترقية هذا الأستاذ ليصبح مشرفاً منسقاً للمادة مع احتفاظه بتدريس أفواجه (صفة ثنائية)"
                                className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                              >
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>ترقية لمشرف (صفة ثنائية)</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
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