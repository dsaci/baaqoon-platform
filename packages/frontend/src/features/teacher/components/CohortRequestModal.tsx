import React, { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';

export default function CohortRequestModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    subjectId: '',
    suggestedName: '',
    expectedStudents: '10',
    notes: ''
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses_for_request'],
    queryFn: async () => {
      const res = await api.get('/curriculum/courses');
      return res.data;
    },
    enabled: isOpen
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/groups/requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cohort_requests'] });
      onClose();
      alert('تم إرسال الطلب بنجاح إلى الإدارة!');
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">طلب فتح فوج جديد</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form 
          className="p-6 space-y-5 overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            submitMutation.mutate(formData);
          }}
        >
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">المادة (المساق)</label>
            <select 
              required
              value={formData.subjectId}
              onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500"
            >
              <option value="">اختر المادة...</option>
              {courses.map((c: any) => (
                <option key={c.subject.id} value={c.subject.id}>{c.subject.name} - {c.grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الاسم المقترح للفوج</label>
            <input 
              required
              type="text"
              placeholder="مثال: فوج غزة - رياضيات 1"
              value={formData.suggestedName}
              onChange={(e) => setFormData({...formData, suggestedName: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">العدد المتوقع للطلاب</label>
            <input 
              required
              type="number"
              min="1"
              value={formData.expectedStudents}
              onChange={(e) => setFormData({...formData, expectedStudents: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ملاحظات إضافية للمدير (اختياري)</label>
            <textarea 
              rows={3}
              placeholder="مبررات فتح الفوج، مثل: تزايد الطلب، أو تقسيم فوج مكتظ..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-violet-500 resize-none"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="flex-[2] px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {submitMutation.isPending ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
