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
  Clock,
  Sparkles,
  Wand2,
  RefreshCw,
  CheckCircle2
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
    type: 'assignment',
    dueDate: defaultDueDate,
    maxScore: '20',
    description: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [showAiCard, setShowAiCard] = useState(false);
  const [aiNotification, setAiNotification] = useState('');

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

  const handleAiAssist = async () => {
    setIsAiAssisting(true);
    setErrorMessage('');
    try {
      const res = await api.post('/ai/assist-assignment', {
        title: formData.title,
        subject: formData.subject,
        existingDescription: formData.description,
        type: formData.type,
        maxScore: Number(formData.maxScore) || 20,
        cohortId: formData.cohortId
      });
      setAiSuggestion(res.data);
      setShowAiCard(true);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'تعذر تشغيل المساعد الذكي حالياً.');
    } finally {
      setIsAiAssisting(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setFormData(prev => ({
      ...prev,
      title: aiSuggestion.suggestedTitle || prev.title,
      subject: aiSuggestion.suggestedSubject || prev.subject,
      type: aiSuggestion.suggestedType || prev.type,
      maxScore: String(aiSuggestion.suggestedMaxScore || prev.maxScore),
      description: aiSuggestion.suggestedDescription || prev.description,
    }));
    setShowAiCard(false);
    setAiNotification('✓ تم اعتماد مقترح المساعد الذكي وتعبئة النموذج بنجاح! يمكنك الآن مراجعة أو تعديل أي تفاصيل بحرية.');
    setTimeout(() => setAiNotification(''), 6000);
  };

  const handleResetAndClose = () => {
    setFormData({
      title: '',
      cohortId: defaultCohortId || '',
      subject: '',
      type: 'assignment',
      dueDate: defaultDueDate,
      maxScore: '20',
      description: ''
    });
    setErrorMessage('');
    setShowAiCard(false);
    setAiSuggestion(null);
    setAiNotification('');
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

          {/* AI Notification Banner */}
          {aiNotification && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{aiNotification}</span>
            </div>
          )}

          {/* ══════════ Smart AI Assignment Co-pilot Banner ══════════ */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-violet-600/10 via-fuchsia-600/10 to-indigo-600/10 border border-violet-200/80 dark:border-violet-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>المساعد الذكي لبناء الواجب</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold border border-violet-200 dark:border-violet-800">
                    مزيج يدوي + ذكي
                  </span>
                </span>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  اكتب فكرتك أو عنواناً بسيطاً، واترك المساعد يكمل الصياغة ويقترح الأسئلة وسلّم التنقيط
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAiAssist}
              disabled={isAiAssisting}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/20 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60 active:scale-95"
            >
              {isAiAssisting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري التحليل والصياغة...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>توليد وإكمال بذكاء</span>
                </>
              )}
            </button>
          </div>

          {/* ══════════ AI Suggestion Preview & Approval Card (باستئذان الأستاذ) ══════════ */}
          {showAiCard && aiSuggestion && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/90 dark:bg-slate-800/90 border-2 border-indigo-300 dark:border-indigo-700/80 shadow-lg space-y-3.5 animate-slide-up">
              <div className="flex items-center justify-between border-b border-indigo-200/60 dark:border-indigo-800 pb-2.5">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  مقترح المساعد الذكي جاهز لمراجعتك وإذنك
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiCard(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  إخفاء المقترح ✕
                </button>
              </div>

              {aiSuggestion.explanation && (
                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900">
                  💡 {aiSuggestion.explanation}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block mb-0.5">العنوان المقترح:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{aiSuggestion.suggestedTitle}</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block mb-0.5">المبحث المقترح:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200">{aiSuggestion.suggestedSubject}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-black text-slate-600 dark:text-slate-300">معاينة تفاصيل الواجب والأسئلة وسلّم التنقيط:</span>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                  {aiSuggestion.suggestedDescription}
                </div>
              </div>

              {/* Approval / Permission Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleAiAssist}
                  disabled={isAiAssisting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  اقتراح صياغة أخرى
                </button>

                <button
                  type="button"
                  onClick={handleApplyAiSuggestion}
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  اعتماد وتعبئة في النموذج (إذن بالتطبيق) ✓
                </button>
              </div>
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
                <option value="assignment">واجب منزلي / تكليف</option>
                <option value="quiz">اختبار قصير (Quiz)</option>
                <option value="project">نشاط / مشروع تطبيقي</option>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200">
                تفاصيل الواجب والأسئلة والتعليمات
              </label>
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={isAiAssisting}
                className="text-xs font-black text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors"
                title="توليد أو إكمال الأسئلة بذكاء"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>إكمال وصياغة بذكاء ✨</span>
              </button>
            </div>
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
