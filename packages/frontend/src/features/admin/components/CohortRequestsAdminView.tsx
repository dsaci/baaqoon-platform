import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function CohortRequestsAdminView() {
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['cohort_requests'],
    queryFn: async () => {
      const res = await api.get('/groups/requests');
      return res.data;
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: any) => {
      return api.patch(`/groups/requests/${id}/status`, { status, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort_requests'] });
      setRejectId(null);
      setRejectReason('');
    }
  });

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
                  {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                </span>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">{req.suggestedName}</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                مقدم الطلب: <span className="font-bold">{req.teacher?.firstName} {req.teacher?.lastName}</span> | المادة: <span className="font-bold">{req.subject?.name}</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">العدد المتوقع: {req.expectedStudents} طلاب</p>
              {req.notes && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm border border-slate-100 dark:border-slate-800">
                  <span className="font-bold block mb-1">ملاحظات الأستاذ:</span>
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
                  onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'approved' })}
                  disabled={updateRequestMutation.isPending}
                  className="flex-1 md:flex-none px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-emerald-200"
                >
                  <CheckCircle className="w-5 h-5" /> قبول
                </button>
                <button
                  onClick={() => setRejectId(req.id)}
                  disabled={updateRequestMutation.isPending}
                  className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-200"
                >
                  <XCircle className="w-5 h-5" /> رفض
                </button>
              </div>
            )}
          </div>

          {/* Rejection Modal inline */}
          {rejectId === req.id && (
            <div className="mt-4 p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 rounded-xl">
              <label className="block text-sm font-bold text-red-800 dark:text-red-300 mb-2">اكتب تبرير الرفض:</label>
              <textarea 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-lg border border-red-200 dark:border-red-800 mb-3 bg-white dark:bg-slate-900 text-sm"
                placeholder="مثال: العدد قليل جداً، يرجى دمجهم مع فوج آخر..."
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
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
