import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { CheckCircle, XCircle, Clock, AlertCircle, User, Users, BookOpen, Sparkles, X, Check, ArrowRight } from 'lucide-react';

export default function CohortRequestsAdminView() {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Approval Modal State
  const [selectedApproveReq, setSelectedApproveReq] = useState<any>(null);
  const [approveForm, setApproveForm] = useState({
    assignedTeacherId: '',
    cohortName: '',
    maxStudents: 20
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['cohort_requests'],
    queryFn: async () => {
      const res = await api.get('/groups/requests');
      return res.data;
    }
  });

  // Fetch teachers for substitute assignment if needed
  const { data: teachersData } = useQuery({
    queryKey: ['admin_teachers_for_request'],
    queryFn: async () => {
      const res = await api.get('/groups/admin/data');
      return res.data?.teachers || [];
    }
  });
  const allTeachers: any[] = teachersData || [];

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason, assignedTeacherId, cohortName, maxStudents }: any) => {
      return api.patch(`/groups/requests/${id}/status`, {
        status,
        rejectionReason,
        assignedTeacherId,
        cohortName,
        maxStudents
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['cohort_requests'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      queryClient.invalidateQueries({ queryKey: ['myCohorts'] });
      setRejectId(null);
      setRejectReason('');
      setSelectedApproveReq(null);
      if (data?.data?.message) {
        alert(data.data.message);
      }
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || 'حدث خطأ أثناء معالجة الطلب');
    }
  });

  const handleStartApprove = (req: any) => {
    setSelectedApproveReq(req);
    setApproveForm({
      assignedTeacherId: req.teacherId || req.teacher?.id || '',
      cohortName: req.suggestedName,
      maxStudents: req.expectedStudents || 20
    });
  };

  const handleConfirmApprove = () => {
    if (!selectedApproveReq) return;
    updateRequestMutation.mutate({
      id: selectedApproveReq.id,
      status: 'approved',
      assignedTeacherId: approveForm.assignedTeacherId,
      cohortName: approveForm.cohortName,
      maxStudents: parseInt(String(approveForm.maxStudents), 10)
    });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center p-12 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
        <p className="text-slate-500 font-bold">لا يوجد طلبات فتح أفواج حالياً.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req: any) => (
        <div key={req.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                  req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'تمت الموافقة وتأسيس الفوج' : 'مرفوض'}
                </span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">{req.suggestedName}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                مقدم الطلب: <span className="font-bold text-slate-900 dark:text-white">أ. {req.teacher?.firstName} {req.teacher?.lastName}</span> | المادة: <span className="font-bold">{req.subject?.nameAr || req.subject?.name}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                <span>العدد المتوقع: {req.expectedStudents} طلاب</span>
                <span>•</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  مصير الأستاذ مع الفوج: يُسند إليه الفوج تلقائياً كأستاذ رئيسي عند القبول
                </span>
              </div>
              {req.notes && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-bold block mb-1">مبررات وملاحظات الأستاذ:</span>
                  {req.notes}
                </div>
              )}
              {req.rejectionReason && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-100 dark:border-red-900/50">
                  <span className="font-bold block mb-1">سبب الرفض:</span>
                  {req.rejectionReason}
                </div>
              )}
            </div>

            {req.status === 'pending' && (
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleStartApprove(req)}
                  disabled={updateRequestMutation.isPending}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle className="w-5 h-5" /> قبول وإسناد الفوج
                </button>
                <button
                  onClick={() => setRejectId(req.id)}
                  disabled={updateRequestMutation.isPending}
                  className="flex-1 md:flex-none px-4 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
                >
                  <XCircle className="w-5 h-5" /> رفض
                </button>
              </div>
            )}
          </div>

          {/* Rejection Modal inline */}
          {rejectId === req.id && (
            <div className="mt-4 p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <label className="block text-sm font-bold text-red-800 dark:text-red-300 mb-2">اكتب تبرير الرفض للأستاذ:</label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-lg border border-red-200 dark:border-red-800 mb-3 bg-white dark:bg-slate-900 text-sm"
                placeholder="مثال: يرجى توجيه الطلاب لفوج الرياضيات القائم لوجود شواغر فيه..."
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'rejected', rejectionReason: rejectReason })}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                >
                  تأكيد الرفض
                </button>
                <button 
                  onClick={() => { setRejectId(null); setRejectReason(''); }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Approval & Teacher Assignment Modal */}
      {selectedApproveReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    اعتماد فتح الفوج وإسناده للأستاذ
                  </h3>
                  <p className="text-xs font-bold text-slate-500">
                    مادة: {selectedApproveReq.subject?.nameAr || selectedApproveReq.subject?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApproveReq(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold text-emerald-900 dark:text-emerald-200 leading-relaxed space-y-1">
              <p>
                💡 <strong>مصير الأستاذ مع الفوج:</strong>
              </p>
              <p>
                عند الاعتماد، سيتم <strong>تأسيس الفوج تلقائياً</strong> وإسناده فوراً للأستاذ كـ <strong>أستاذ رئيسي (Primary Teacher)</strong>، وسيظهر الفوج مباشرة في فضاء تدريسه مع إرسال إشعار ترحيبي له.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  اسم الفوج المعتمد:
                </label>
                <input
                  type="text"
                  value={approveForm.cohortName}
                  onChange={(e) => setApproveForm({ ...approveForm, cohortName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  سعة الفوج (الحد الأقصى للطلاب):
                </label>
                <input
                  type="number"
                  min="3"
                  max="100"
                  value={approveForm.maxStudents}
                  onChange={(e) => setApproveForm({ ...approveForm, maxStudents: Number(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5">
                  الأستاذ المسند لتدريس الفوج:
                </label>
                <select
                  value={approveForm.assignedTeacherId}
                  onChange={(e) => setApproveForm({ ...approveForm, assignedTeacherId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={selectedApproveReq.teacherId}>
                    🌟 {selectedApproveReq.teacher?.firstName} {selectedApproveReq.teacher?.lastName} (مقدم الطلب - الافتراضي)
                  </option>
                  <optgroup label="أساتذة آخرون متاحون (في حال الرغبة بإسناده لمعلم بديل)">
                    {allTeachers
                      .filter((t: any) => t.id !== selectedApproveReq.teacherId)
                      .map((t: any) => (
                        <option key={t.id} value={t.id}>
                          {t.firstName} {t.lastName}
                        </option>
                      ))}
                  </optgroup>
                </select>
                <p className="text-[11px] font-bold text-slate-400 mt-1">
                  الافتراضي هو إسناد الفوج للأستاذ مقدم الطلب ما لم ترغب الإدارة بإسناده لأستاذ آخر لموازنة العبء التدريسي.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedApproveReq(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-sm text-slate-700 dark:text-slate-300"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={updateRequestMutation.isPending || !approveForm.cohortName}
                className="flex-2 w-2/3 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{updateRequestMutation.isPending ? 'جاري تأسيس الفوج...' : 'تأكيد فتح الفوج وإسناده للأستاذ'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
