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
  Sparkles,
  Wand2,
  RefreshCw,
  CheckCircle2,
  BookMarked,
  Target,
  Sliders,
  Edit3,
  ListOrdered,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import GeneratedImageDocument from './GeneratedImageDocument';

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

  // Pedagogical Co-Pilot Configuration States
  const [selectedStyle, setSelectedStyle] = useState<'standard_practice' | 'apc_integration' | 'quick_quiz' | 'remediation' | 'research_project'>('standard_practice');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'average' | 'remedial' | 'advanced'>('average');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [isCoPilotExpanded, setIsCoPilotExpanded] = useState<boolean>(true);

  // AI Generation & Preview States
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [showAiCard, setShowAiCard] = useState(false);
  const [aiNotification, setAiNotification] = useState('');
  const [activePreviewTab, setActivePreviewTab] = useState<'image' | 'full' | 'questions' | 'rubric' | 'edit'>('image');
  const [editableDescription, setEditableDescription] = useState<string>('');
  const [showManualImagePreview, setShowManualImagePreview] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // 1. Fetch teacher's cohorts
  const { data: myCohorts = [], isLoading: isLoadingCohorts } = useQuery({
    queryKey: ['myCohorts'],
    queryFn: async () => {
      try {
        const res = await api.get('/groups/cohorts/me');
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (e) {}
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

  // 2. Fetch Curriculum Tree for Curriculum Linking
  const { data: curriculumTree = [] } = useQuery({
    queryKey: ['curriculumTree'],
    queryFn: async () => {
      try {
        const res = await api.get('/ai/curriculum-tree');
        return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        return [];
      }
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

  // Find lessons belonging to current selected cohort
  const activeCohortNode = curriculumTree.find(
    (c: any) => c.cohortId === formData.cohortId
  );

  const cohortLessons: Array<{ id: string; title: string; unitTitle: string }> = (
    activeCohortNode?.units || []
  ).flatMap((u: any) =>
    (u.lessons || []).map((l: any) => ({
      id: l.id,
      title: l.title,
      unitTitle: u.title,
    }))
  );

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    if (!lessonId) return;
    const found = cohortLessons.find((l) => l.id === lessonId);
    if (found) {
      const subjectPrefix = activeCohortNode?.course?.subject?.nameAr || '';
      setFormData(prev => ({
        ...prev,
        subject: subjectPrefix ? `${subjectPrefix} - ${found.unitTitle}` : found.unitTitle,
        title: prev.title ? prev.title : `واجب تطبيقي: ${found.title}`
      }));
    }
  };

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

  // Trigger Smart AI Generation / Assistance
  const handleAiAssist = async (actionPrompt?: string) => {
    setIsAiAssisting(true);
    setErrorMessage('');
    try {
      const res = await api.post('/ai/assist-assignment', {
        title: formData.title,
        subject: formData.subject,
        existingDescription: formData.description,
        type: formData.type,
        maxScore: Number(formData.maxScore) || 20,
        cohortId: formData.cohortId,
        lessonId: selectedLessonId || undefined,
        style: selectedStyle,
        difficulty: selectedDifficulty,
        actionPrompt: actionPrompt || 'full_build',
      });
      setAiSuggestion(res.data);
      setEditableDescription(res.data.suggestedDescription || '');
      setShowAiCard(true);
      setActivePreviewTab('image');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'تعذر تشغيل المساعد الذكي حالياً.');
    } finally {
      setIsAiAssisting(false);
    }
  };

  // 1. Apply All: Copies Title, Subject, Type, MaxScore, and full Description
  const handleApplyAll = () => {
    if (!aiSuggestion) return;
    setFormData(prev => ({
      ...prev,
      title: aiSuggestion.suggestedTitle || prev.title,
      subject: aiSuggestion.suggestedSubject || prev.subject,
      type: aiSuggestion.suggestedType || prev.type,
      maxScore: String(aiSuggestion.suggestedMaxScore || prev.maxScore),
      description: editableDescription || aiSuggestion.suggestedDescription || prev.description,
    }));
    setShowAiCard(false);
    setAiNotification('✓ تم اعتماد مقترح المساعد الذكي بالكامل وتعبئة النموذج بنجاح!');
    setTimeout(() => setAiNotification(''), 6000);
  };

  // 2. Apply Questions Only
  const handleApplyQuestionsOnly = () => {
    if (!aiSuggestion?.questionsText) return;
    setFormData(prev => ({
      ...prev,
      description: (prev.description ? prev.description + '\n\n' : '') + aiSuggestion.questionsText,
      title: prev.title || aiSuggestion.suggestedTitle,
    }));
    setShowAiCard(false);
    setAiNotification('✓ تم اعتماد نص الأسئلة فقط وتعبئتها في صندوق الوصف بنجاح!');
    setTimeout(() => setAiNotification(''), 6000);
  };

  // 3. Apply Rubric Only
  const handleApplyRubricOnly = () => {
    if (!aiSuggestion?.rubricText) return;
    const rubricBlock = `---\n\n### ⚖️ سلّم التنقيط المقترح (${aiSuggestion.suggestedMaxScore || 20} ن):\n${aiSuggestion.rubricText}`;
    setFormData(prev => ({
      ...prev,
      description: (prev.description ? prev.description + '\n\n' : '') + rubricBlock,
      maxScore: String(aiSuggestion.suggestedMaxScore || prev.maxScore),
    }));
    setShowAiCard(false);
    setAiNotification('✓ تم إلحاق سلّم التنقيط وشبكة المعايير بنهاية التكليف بنجاح!');
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
    setSelectedStyle('standard_practice');
    setSelectedDifficulty('average');
    setSelectedLessonId('');
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
      description: formData.description.trim(),
      curriculumLessonId: selectedLessonId || undefined,
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-md animate-fade-in overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createMutation.isPending) {
          handleResetAndClose();
        }
      }}
    >
      <div 
        className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${showAiCard || showManualImagePreview ? 'max-w-4xl' : 'max-w-3xl'} shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all duration-300 transform scale-100 animate-slide-up`}
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
                إنشاء وتكليف واجب دراسي جديد
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                تحديد الفوج الدراسي، محتوى التكليف، النمط البيداغوجي، وسلّم الدرجات
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[78vh]">
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

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* 🌟 SMART AI ASSIGNMENT CO-PILOT SUITE (مزيج يدوي + بيداغوجي ذكي)            */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600/10 via-fuchsia-600/10 to-indigo-600/10 border-2 border-violet-200/80 dark:border-violet-900/60 shadow-sm space-y-3.5 transition-all">
            {/* Header / Toggle Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/25 shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      المساعد البيداغوجي الذكي لبناء الواجب
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold border border-violet-200 dark:border-violet-800">
                      مقاربة الكفاءات APC
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                      باستئذانك وموافقتك
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    اختر نمط الواجب ومستوى الصعوبة، واترك المساعد يكمل الأسئلة المتدرجة وسلّم التنقيط الدقيق
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCoPilotExpanded(!isCoPilotExpanded)}
                className="w-8 h-8 rounded-lg bg-white/70 dark:bg-slate-800/80 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors"
                title={isCoPilotExpanded ? "طي خيارات المساعد" : "إظهار خيارات المساعد"}
              >
                {isCoPilotExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* Expandable Controls */}
            {isCoPilotExpanded && (
              <div className="pt-2 border-t border-violet-200/50 dark:border-violet-900/40 space-y-3 animate-fade-in">
                {/* 1. Style Selection Pills */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-violet-600" />
                    نمط وهيكل الواجب البيداغوجي:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                    {[
                      { id: 'standard_practice', label: 'واجب تدريبي', icon: '📝', desc: 'تدرج مفاهيمي قياسي' },
                      { id: 'apc_integration', label: 'وضعية إدماجية', icon: '🎯', desc: 'سياق وسندات APC' },
                      { id: 'quick_quiz', label: 'اختبار قصير', icon: '⚡', desc: 'فحص فهم 20 دقيقة' },
                      { id: 'remediation', label: 'دعم ومعالجة', icon: '🩺', desc: 'تدارك فاقد تعليمي' },
                      { id: 'research_project', label: 'مشروع وبحث', icon: '🔬', desc: 'نشاط استكشافي' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setSelectedStyle(st.id as any)}
                        className={`p-2 rounded-xl text-right font-bold transition-all border flex flex-col justify-between ${
                          selectedStyle === st.id
                            ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/25'
                            : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-violet-300'
                        }`}
                      >
                        <span className="flex items-center gap-1 font-black text-xs">
                          <span>{st.icon}</span>
                          <span>{st.label}</span>
                        </span>
                        <span className={`text-[10px] mt-0.5 line-clamp-1 ${selectedStyle === st.id ? 'text-violet-100' : 'text-slate-400'}`}>
                          {st.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Difficulty & Action Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  {/* Difficulty selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1 shrink-0">
                      <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                      الصعوبة:
                    </span>
                    <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                      {[
                        { id: 'remedial', label: 'ميسر / علاجي', color: 'text-emerald-700 dark:text-emerald-300' },
                        { id: 'average', label: 'متوسط / قياسي', color: 'text-indigo-700 dark:text-indigo-300' },
                        { id: 'advanced', label: 'متقدم / تحدي', color: 'text-purple-700 dark:text-purple-300' },
                      ].map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDifficulty(d.id as any)}
                          className={`px-2.5 py-1 rounded-lg transition-all ${
                            selectedDifficulty === d.id
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-sm'
                              : `${d.color} hover:bg-slate-100 dark:hover:bg-slate-700`
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Action Trigger Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAiAssist('full_build')}
                      disabled={isAiAssisting}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95"
                    >
                      {isAiAssisting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>جاري البناء والصياغة...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>توليد واقتراح متكامل ✨</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAiAssist('add_rubric')}
                      disabled={isAiAssisting}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-slate-750 border border-violet-200 dark:border-violet-800 flex items-center gap-1 cursor-pointer transition-colors"
                      title="توليد أو استخراج سلّم التنقيط وشبكة معايير الكفاءات فقط"
                    >
                      <ListOrdered className="w-3.5 h-3.5 text-violet-600" />
                      <span>إضافة سلّم تنقيط ⚖️</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* 🎯 AI SUGGESTION PREVIEW & GRANULAR APPROVAL CARD (باستئذان الأستاذ التام)   */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {showAiCard && aiSuggestion && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/95 dark:bg-slate-800/95 border-2 border-indigo-300 dark:border-indigo-700 shadow-xl space-y-3.5 animate-slide-up">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-indigo-200/70 dark:border-indigo-800 pb-2.5">
                <span className="text-xs font-black text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>مقترح المساعد البيداغوجي جاهز لمراجعتك وإذنك بالاعتماد</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowAiCard(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  إخفاء المقترح ✕
                </button>
              </div>

              {/* Pedagogical Explanation */}
              {aiSuggestion.explanation && (
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 bg-white/80 dark:bg-slate-900/70 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 flex items-start gap-2 leading-relaxed">
                  <span className="text-base shrink-0">💡</span>
                  <span>{aiSuggestion.explanation}</span>
                </div>
              )}

              {/* Suggested Fields Quick Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block mb-0.5">العنوان المقترح:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 line-clamp-1">{aiSuggestion.suggestedTitle}</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block mb-0.5">المبحث المقترح:</span>
                  <span className="font-black text-slate-800 dark:text-slate-200 line-clamp-1">{aiSuggestion.suggestedSubject}</span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block mb-0.5">النمط البيداغوجي:</span>
                  <span className="font-black text-violet-700 dark:text-violet-300">
                    {aiSuggestion.style || selectedStyle}
                  </span>
                </div>
                <div className="bg-white/80 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-bold block mb-0.5">الدرجة القصوى:</span>
                  <span className="font-black text-amber-600 dark:text-amber-400">{aiSuggestion.suggestedMaxScore || 20} درجة</span>
                </div>
              </div>

              {/* Preview Tabs */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-white/70 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('image')}
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0 ${
                        activePreviewTab === 'image'
                          ? 'bg-violet-600 text-white font-black shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>🖼️ صورة الواجب (RTL)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('full')}
                      className={`px-3 py-1 rounded-lg transition-colors shrink-0 ${
                        activePreviewTab === 'full'
                          ? 'bg-violet-600 text-white font-black shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      📋 العرض الكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('questions')}
                      className={`px-3 py-1 rounded-lg transition-colors shrink-0 ${
                        activePreviewTab === 'questions'
                          ? 'bg-violet-600 text-white font-black shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      ❓ الأسئلة فقط
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('rubric')}
                      className={`px-3 py-1 rounded-lg transition-colors shrink-0 ${
                        activePreviewTab === 'rubric'
                          ? 'bg-violet-600 text-white font-black shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      ⚖️ سلّم التنقيط والمعايير
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePreviewTab('edit')}
                      className={`px-3 py-1 rounded-lg transition-colors shrink-0 ${
                        activePreviewTab === 'edit'
                          ? 'bg-violet-600 text-white font-black shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      ✏️ تعديل مسبق
                    </button>
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                    يمكنك تعديل أي جزئية قبل اعتمادها
                  </span>
                </div>

                {/* Tab 0: Visual RTL Document Image View */}
                {activePreviewTab === 'image' && (
                  <div className="pt-1">
                    <GeneratedImageDocument
                      title={aiSuggestion.suggestedTitle || formData.title || 'واجب مدرسي'}
                      documentTypeLabel={formData.type === 'exam' ? 'امتحان / اختبار' : formData.type === 'quiz' ? 'فرض محروس' : 'واجب منزلي'}
                      subjectName={aiSuggestion.suggestedSubject || formData.subject}
                      gradeLevel={myCohorts.find((c: any) => c.id === formData.cohortId)?.name || 'التعليم الثانوي'}
                      cohortName={myCohorts.find((c: any) => c.id === formData.cohortId)?.name}
                      dueDate={formData.dueDate}
                      maxScore={aiSuggestion.suggestedMaxScore || formData.maxScore || 20}
                      content={editableDescription || aiSuggestion.suggestedDescription}
                      aiModel="Baaqoon Educational AI (APC)"
                      fileName={aiSuggestion.suggestedTitle || formData.title}
                      showToolbar={true}
                    />
                  </div>
                )}

                {/* Tab 1: Full Preview */}
                {activePreviewTab === 'full' && (
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                    {editableDescription || aiSuggestion.suggestedDescription}
                  </div>
                )}

                {/* Tab 2: Questions Only */}
                {activePreviewTab === 'questions' && (
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                    {aiSuggestion.questionsText || 'لا تتوفر أسئلة منفصلة، راجع العرض الكامل.'}
                  </div>
                )}

                {/* Tab 3: Rubric & Criteria Only */}
                {activePreviewTab === 'rubric' && (
                  <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono space-y-3">
                    <div>
                      <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">سلّم التنقيط:</span>
                      <p>{aiSuggestion.rubricText || 'تم تضمين سلّم التنقيط داخل العرض الكامل.'}</p>
                    </div>
                    {aiSuggestion.criteriaText && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-purple-700 dark:text-purple-300 block mb-1">شبكة المعايير والمؤشرات (APC):</span>
                        <p>{aiSuggestion.criteriaText}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Direct Editing before Apply */}
                {activePreviewTab === 'edit' && (
                  <textarea
                    rows={6}
                    value={editableDescription}
                    onChange={e => setEditableDescription(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl border-2 border-indigo-400 dark:border-indigo-600 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none resize-none leading-relaxed font-mono"
                    placeholder="يمكنك إجراء أي تعديلات مباشرة على نص المقترح هنا قبل اعتماده في النموذج..."
                  />
                )}
              </div>

              {/* Approval / Permission Action Buttons (باستئذان الأستاذ الصريح) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-indigo-200/60 dark:border-indigo-800">
                <button
                  type="button"
                  onClick={() => handleAiAssist('full_build')}
                  disabled={isAiAssisting}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  اقتراح صياغة بديلة
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {aiSuggestion.questionsText && (
                    <button
                      type="button"
                      onClick={handleApplyQuestionsOnly}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-750 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                    >
                      اعتماد الأسئلة فقط ❓
                    </button>
                  )}

                  {aiSuggestion.rubricText && (
                    <button
                      type="button"
                      onClick={handleApplyRubricOnly}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-750 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                    >
                      إلحاق سلّم التنقيط ⚖️
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyAll}
                    className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    اعتماد وتعبئة الكل في النموذج (إذن بالتطبيق) ✓
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════════ */}
          {/* STANDARD MANUAL / BLENDED FORM FIELDS                                       */}
          {/* ══════════════════════════════════════════════════════════════════════════════ */}

          {/* Title */}
          <div>
            <label className="block text-sm font-black text-slate-800 dark:text-slate-200 mb-1.5">
              عنوان الواجب / التكليف <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: واجب درس دراسة الدوال العددية - حل المسائل التطبيقية"
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
                onChange={e => {
                  setFormData({ ...formData, cohortId: e.target.value });
                  setSelectedLessonId('');
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                disabled={isLoadingCohorts}
                required
              >
                {isLoadingCohorts ? (
                  <option value="">جاري تحميل الأفواج...</option>
                ) : myCohorts.length === 0 ? (
                  <option value="">لا توجد أفواج مسجلة</option>
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

              {/* Dynamic Curriculum Lesson Selector (if cohort has lessons) */}
              {cohortLessons.length > 0 && (
                <div className="mt-2.5 p-2.5 bg-indigo-50/70 dark:bg-slate-800/60 rounded-xl border border-indigo-200/60 dark:border-slate-700 animate-fade-in">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                      <BookMarked className="w-3.5 h-3.5 text-indigo-600" />
                      ربط بدرس من منهاج الفوج (اختياري):
                    </label>
                    {selectedLessonId && (
                      <button
                        type="button"
                        onClick={() => setSelectedLessonId('')}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline font-normal"
                      >
                        إلغاء التحديد
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedLessonId}
                    onChange={e => handleSelectLesson(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold focus:border-violet-600 focus:outline-none"
                  >
                    <option value="">-- جميع دروس الفوج / موضوع عام --</option>
                    {cohortLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.unitTitle ? `[${l.unitTitle}] ` : ''}{l.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                placeholder="مثال: الرياضيات - دراسة الدوال العددية"
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200">
                تفاصيل الواجب والأسئلة والتعليمات
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualImagePreview(!showManualImagePreview)}
                  className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800"
                  title="معاينة الواجب الحالي كصورة معتمدة وتصديرها"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{showManualImagePreview ? 'إخفاء معاينة الصورة' : 'معاينة وتصدير كصورة (RTL) 📷'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAiAssist('refine_draft')}
                  disabled={isAiAssisting}
                  className="text-xs font-black text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 cursor-pointer transition-colors"
                  title="توليد أو إكمال الأسئلة بذكاء"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>إكمال وتجويد مسودتي ✨</span>
                </button>
              </div>
            </div>
            <textarea 
              rows={5}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب نص الأسئلة، الصفحات المقررة في الكتاب المدرسي، طريقة الحل، أو أي إرشادات للطلبة... أو اضغط 'توليد واقتراح متكامل' للمساعد الذكي."
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-violet-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all resize-none leading-relaxed placeholder:text-slate-400 font-mono text-xs"
            />

            {/* Manual Image Document Preview & Export */}
            {showManualImagePreview && (
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>معاينة الواجب كبطاقة بصرية رسمية جاهزة للتحميل والنشر</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManualImagePreview(false)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    إغلاق المعاينة ✕
                  </button>
                </div>
                <GeneratedImageDocument
                  title={formData.title || 'واجب دراسي جديد'}
                  documentTypeLabel={formData.type === 'exam' ? 'امتحان / اختبار' : formData.type === 'quiz' ? 'فرض محروس' : 'واجب منزلي'}
                  subjectName={formData.subject}
                  gradeLevel={myCohorts.find((c: any) => c.id === formData.cohortId)?.name || 'التعليم الثانوي'}
                  cohortName={myCohorts.find((c: any) => c.id === formData.cohortId)?.name}
                  dueDate={formData.dueDate}
                  maxScore={formData.maxScore || 20}
                  content={formData.description || 'لم يتم إدخال تفاصيل الواجب بعد.'}
                  fileName={formData.title || 'واجب_منصة_باقون'}
                  showToolbar={true}
                />
              </div>
            )}
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