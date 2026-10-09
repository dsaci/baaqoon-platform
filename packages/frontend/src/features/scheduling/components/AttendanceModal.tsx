import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Check, Loader2, Users } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

export default function AttendanceModal({ isOpen, onClose, sessionId }: AttendanceModalProps) {
  const queryClient = useQueryClient();
  const [records, setRecords] = useState<Record<string, string>>({});

  const { data: students, isLoading } = useQuery({
    queryKey: ['sessionAttendance', sessionId],
    queryFn: async () => {
      const res = await api.get(`/sessions/${sessionId}/attendance`);
      return res.data;
    },
    enabled: isOpen
  });

  useEffect(() => {
    if (students) {
      const initial: Record<string, string> = {};
      students.forEach((s: any) => {
        initial[s.studentId] = s.status;
      });
      setRecords(initial);
    }
  }, [students]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      return api.patch(`/sessions/${sessionId}/attendance`, { records: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionAttendance', sessionId] });
      onClose();
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-500" />
            رصد الغياب والحضور
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : students?.length === 0 ? (
            <div className="text-center p-8 text-slate-500">لا يوجد طلاب مسجلين في هذا الفوج</div>
          ) : (
            <div className="space-y-2">
              {students?.map((s: any) => (
                <div key={s.studentId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {s.firstName} {s.lastName}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setRecords(prev => ({ ...prev, [s.studentId]: 'present' }))}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        records[s.studentId] === 'present' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                      }`}
                    >
                      حاضر
                    </button>
                    <button 
                      onClick={() => setRecords(prev => ({ ...prev, [s.studentId]: 'late' }))}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        records[s.studentId] === 'late' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                      }`}
                    >
                      متأخر
                    </button>
                    <button 
                      onClick={() => setRecords(prev => ({ ...prev, [s.studentId]: 'absent_unexcused' }))}
                      className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                        records[s.studentId] === 'absent_unexcused' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                      }`}
                    >
                      غائب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
          <button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white font-black rounded-xl transition-all"
          >
            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> حفظ السجل</>}
          </button>
        </div>
      </div>
    </div>
  );
}
