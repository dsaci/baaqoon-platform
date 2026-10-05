import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Shield, User, Users, BookOpen, AlertCircle } from 'lucide-react';


interface ErrorBoundaryProps { children: React.ReactNode }
interface ErrorBoundaryState { hasError: boolean; error: any }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'white' }}>
          <h1>Something went wrong in DistributionAdminPage.</h1>
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

  const { data, isLoading } = useQuery({
    queryKey: ['admin_distribution'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/distribution');
      return res.data;
    }
  });

  const assignSupervisorMutation = useMutation({
    mutationFn: async ({ subjectId, userId }: { subjectId: string; userId: string }) => {
      return api.patch(`/groups/admin/distribution/${subjectId}/supervisor/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_distribution'] });
      setAssigningSubjectId(null);
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { subjects = [], supervisors = [] } = data || {};

  return (
    <div className="space-y-6 animate-fade-in-up font-sans" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">الإسناد الأكاديمي</h1>
        <p className="text-slate-500 dark:text-slate-400 font-bold">تعيين المشرفين على المواد ومتابعة الأساتذة المعينين في الأفواج.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map((subject: any) => {
          const supervisor = subject.supervisors?.[0]; // Assume one main supervisor per subject
          const isAssigning = assigningSubjectId === subject.id;

          return (
            <div key={subject.id} className="bg-white dark:bg-slate-900/50 rounded-2xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">{subject.nameAr}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-bold font-mono">{subject.code}</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Supervisor Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-black flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <Shield className="w-4 h-4 text-purple-500" />
                      مشرف المادة
                    </h4>
                    {!isAssigning && (
                      <button 
                        onClick={() => setAssigningSubjectId(subject.id)}
                        className="text-xs font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:hover:text-violet-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        {supervisor ? 'تغيير المشرف' : 'تعيين مشرف'}
                      </button>
                    )}
                  </div>

                  {isAssigning ? (
                    <div className="flex flex-col gap-2">
                      <select
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                        onChange={(e) => assignSupervisorMutation.mutate({ subjectId: subject.id, userId: e.target.value })}
                        disabled={assignSupervisorMutation.isPending}
                        defaultValue={supervisor?.id || ""}
                      >
                        <option value="" disabled>اختر المشرف...</option>
                        <option value="none" className="text-rose-500">بدون مشرف (إزالة)</option>
                        {supervisors.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                        ))}
                      </select>
                      <button 
                        onClick={() => setAssigningSubjectId(null)}
                        className="text-xs text-slate-500 hover:text-slate-700 self-end font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : supervisor ? (
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-xs">
                        {supervisor.firstName[0]}{supervisor.lastName[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">{supervisor.firstName} {supervisor.lastName}</p>
                        <p className="text-xs text-slate-500">{supervisor.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-sm font-bold p-2">
                      <AlertCircle className="w-4 h-4" />
                      لم يتم تعيين مشرف لهذه المادة
                    </div>
                  )}
                </div>

                {/* Teachers Section */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <h4 className="text-sm font-black flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-3">
                    <Users className="w-4 h-4 text-emerald-500" />
                    الأساتذة ضمن أفواج المادة ({subject.teachers?.length || 0})
                  </h4>
                  
                  {subject.teachers?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {subject.teachers.map((teacher: any) => (
                        <div key={teacher.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                          <User className="w-3 h-3 text-emerald-500" />
                          {teacher.firstName} {teacher.lastName}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold p-2">لا يوجد أساتذة معينين لأفواج هذه المادة حالياً.</p>
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

export default function DistributionAdminPage() { return <ErrorBoundary><DistributionAdminPageInner /></ErrorBoundary>; }