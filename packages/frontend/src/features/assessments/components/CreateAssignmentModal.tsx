import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { 
  X, 
  FileText, 
  Calendar, 
  Check, 
  Loader2, 
  BookOpen, 
  Users, 
  Award,
  AlertCircle,
  Clock
} from 'lucide-react';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCohortId?: string;
  onSuccess?: () => void;
}

export default function CreateAssignmentModal({
  isOpen,
  onClose,
  defaultCohortId,
  onSuccess
}: CreateAssignmentModalProps) {
  const queryClient = useQueryClient();

  // 7 days from now as default due date
  const defaultDueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    title: '',
    cohortId: defaultCohortId || '',
    subject: '',
    type: 'homework',
    dueDate: defaultDueDate,
    maxScore: '20',
    description: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Fetch teacher's cohorts
  const { data: myCohorts = [], isLoading: isLoadingCohorts } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      try {
        const res = await api.get('/groups/cohorts/me');
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (e) {
        // Fallback below
      }
      // Fallback: fetch admin cohorts if me returns empty
      try {
        const adminRes = await api.get('/groups/admin/data');
        if (adminRes.data?.cohorts) {
          return adminRes.data.cohorts;
        }
      } catch (e) {}
      return [];
    },
    enabled: isOpen
  });

  // Auto-select first cohort if none selected yet
  React.useEffect(() => {
    if (isOpen) {
      if (defaultCohortId) {
        setFormData(prev => ({ ...prev, cohortId: defaultCohortId }));
      } else if (!formData.cohortId && myCohorts.length > 0) {
        setFormData(prev => ({ ...prev, cohortId: myCohorts[0].id }));
      }
    }
  }, [isOpen, defaultCohortId, myCohorts]);

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/assessments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setShowSuccessToast(true);
      setTimeout(() => {
        setShowSuccessToast(false);
        handleResetAndClose();
        if (onSuccess) onSuccess();
      }, 1200);
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'حدث خطأ أثناء حفظ وإسناد الواجب');
    }
  });

  const handleResetAndClose = () => {
    setFormData({
      title: '',
      cohortId: defaultCohortId || '',
      subject: '',
      type: 'homework',
      dueDate: defaultDueDate,
      maxScore: '20',
      description: ''
    });
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('يرجى كتابة عنوان للواجب');
      return;
    }

    if (!formData.cohortId && myCohorts.length > 0) {
      setErrorMessage('يرجى تحديد الفوج المستهدف');
      return;
    }

    createMutation.mutate({
      title: formData.title.trim(),
      cohortId: formData.cohortId,
      subject: formData.subject.trim(),
      type: formData.type,
      dueDate: formData.dueDate,
      maxScore: Number(formData.maxScore) || 20,
      description: formData.description.trim()
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-md animate-fade-in overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        // Close when clicking outside modal body
        if (e.target === e.currentTarget && !createMutation.isPending) {
          handleResetAndClose();
        }
      }}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all transform scale-100 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-violet-50/80 via-purple-50/50 to-white dark:from-slate-800 dark:via-slate-850 dark:to-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                إنشاء وتكليف واجب جديد
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                تحديد الفوج الدراسي، محتوى التكليف، وموعد التسليم
              </p>
            </div>
          </div>
          
          {/* Close X Button */}
          <button 
            type="button"
            onClick={handleResetAndClose}
            disabled={createMutation.isPending}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors disabled:opacity-50"
            title="إلغاء وإغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Toast Banner */}
          {showSuccessToast && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-5 h-5 shrink-0" />
              <span>تم حفظ ونشر الواجب بنجاح وإسناده لطلبة الفوج ✓</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5">
              عنوان الواجب / التكليف <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: واجب درس قوانين نيوتن - حل المسائل من 1 إلى 5"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
              required
              autoFocus
            />
          </div>

          {/* Cohort & Subject Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Cohort */}
            <div>
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-violet-600" />
                الفوج المستهدف <span className="text-rose-500">*</span>
              </label>
              <select 
                value={formData.cohortId}
                onChange={e => setFormData({ ...formData, cohortId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                disabled={isLoadingCohorts}
                required
              >
                {isLoadingCohorts ? (
                  <option value="">جاري تحميل الأفواج...</option>
                ) : myCohorts.length === 0 ? (
                  <option value="">لا توجد أفواج مسجلة (اختر الفوج الافتراضي)</option>
                ) : (
                  <>
                    <option value="">-- اختر الفوج الدراسي --</option>
                    {myCohorts.map((cohort: any) => (
                      <option key={cohort.id} value={cohort.id}>
                        {cohort.name} {cohort.code ? `(${cohort.code})` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {/* Subject / Lesson Topic */}
            <div>
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                المبحث / موضوع الدرس
              </label>
              <input 
                type="text" 
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                placeholder="مثال: فيزياء - الوحدة الثانية"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Type, Due Date & Max Score */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Assignment Type */}
            <div>
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5">
                نوع التكليف
              </label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
              >
                <option value="homework">واجب منزلي</option>
                <option value="quiz">اختبار قصير (Quiz)</option>
                <option value="activity">نشاط / مشروع تطبيقي</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                آخر موعد للتسليم
              </label>
              <input 
                type="date" 
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* Max Score */}
            <div>
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                الدرجة القصوى
              </label>
              <input 
                type="number" 
                min="1"
                max="100"
                value={formData.maxScore}
                onChange={e => setFormData({ ...formData, maxScore: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all font-mono"
                placeholder="20"
              />
            </div>
          </div>

          {/* Description & Detailed Instructions */}
          <div>
            <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5">
              تفاصيل الواجب والأسئلة والتعليمات
            </label>
            <textarea 
              rows={4}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب نص الأسئلة، الصفحات المقررة في الكتاب المدرسي، طريقة الحل، أو أي إرشادات للطلبة..."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all resize-none leading-relaxed placeholder:text-slate-400"
            />
          </div>

          {/* Action Buttons in Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
            {/* Cancel Button */}
            <button 
              type="button"
              onClick={handleResetAndClose}
              disabled={createMutation.isPending}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            >
              <X className="w-4 h-4 text-slate-500" />
              إلغاء وتراجع
            </button>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={createMutation.isPending || !formData.title.trim()}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الحفظ والنشر...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  حفظ ونشر الواجب للطلاب
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
