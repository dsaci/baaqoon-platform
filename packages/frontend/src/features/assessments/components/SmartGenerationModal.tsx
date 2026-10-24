import React, { useState, useEffect } from 'react';
import {
  Bot, X, Sparkles, ChevronRight, ChevronLeft,
  BookOpen, FileText, ClipboardList, GraduationCap, 
  Layers, Grid3X3, Lightbulb, HeartHandshake,
  Loader2, CheckCircle2, AlertCircle, Copy, Download,
  RefreshCw, ArrowRight, Info, Zap, Database, Image
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import GeneratedImageDocument from './GeneratedImageDocument';

// ─── Types ─────────────────────────────────────────────────────────────────────

type OutputType =
  | 'lesson_structure'
  | 'lesson_memo'
  | 'diagnostic_assessment'
  | 'formative_assessment'
  | 'exam_with_rubric'
  | 'evaluation_grid'
  | 'integration_situation'
  | 'remediation_plan';

interface Lesson { id: string; title: string; }
interface Unit { id: string; title: string; lessons: Lesson[]; }
interface CohortTree {
  cohortId: string;
  cohortName: string;
  course: { id: string; title: string; subject: { nameAr: string }; gradeLevel: string; academicBranch: string };
  units: Unit[];
}

interface GenerationResult {
  outputType: OutputType;
  title: string;
  content: string;
  curriculumSource: {
    lessonTitle: string;
    unitTitle: string;
    subjectName: string;
    gradeLevel: string;
    textbookPages?: string;
  };
  provider: string;
  model: string;
  fromFallback: boolean;
  generatedAt: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const OUTPUT_TYPES: { type: OutputType; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { type: 'lesson_structure', label: 'البناء التعلمي', description: 'بناء الدرس بالمقاربة بالكفاءات', icon: Layers, color: 'indigo' },
  { type: 'lesson_memo', label: 'مذكرة الدرس', description: 'الجذاذة الرسمية للحصة', icon: FileText, color: 'violet' },
  { type: 'diagnostic_assessment', label: 'تقويم تشخيصي', description: 'قياس المعارف القبلية', icon: ClipboardList, color: 'blue' },
  { type: 'formative_assessment', label: 'تقويم تكويني', description: 'متابعة التعلم أثناء الحصة', icon: CheckCircle2, color: 'teal' },
  { type: 'exam_with_rubric', label: 'اختبار + سلم التنقيط', description: 'اختبار شامل مع مفتاح الإجابات', icon: GraduationCap, color: 'amber' },
  { type: 'evaluation_grid', label: 'شبكة التقييم', description: 'تقييم الكفاءات ومتابعة المتعلمين', icon: Grid3X3, color: 'orange' },
  { type: 'integration_situation', label: 'وضعية إدماجية', description: 'وضعية تعلمية واقعية وفق APC', icon: Lightbulb, color: 'yellow' },
  { type: 'remediation_plan', label: 'خطة المعالجة', description: 'دعم متمايز للمستويات الثلاثة', icon: HeartHandshake, color: 'rose' },
];

const STUDENT_LEVELS = [
  { value: 'mixed', label: 'متباين المستوى (الافتراضي)' },
  { value: 'weak', label: 'يحتاج دعماً' },
  { value: 'average', label: 'متوسط المستوى' },
  { value: 'advanced', label: 'متقدم ومتميز' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface SmartGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SmartGenerationModal({ isOpen, onClose }: SmartGenerationModalProps) {
  const queryClient = useQueryClient();
  
  // Steps: 0=select-type, 1=select-lesson, 2=params, 3=generating, 4=result
  const [step, setStep] = useState(0);
  const [outputType, setOutputType] = useState<OutputType | null>(null);
  const [curriculumTree, setCurriculumTree] = useState<CohortTree[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedCohortIdx, setSelectedCohortIdx] = useState(0);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [studentLevel, setStudentLevel] = useState<'weak' | 'average' | 'advanced' | 'mixed'>('mixed');
  const [questionCount, setQuestionCount] = useState(5);
  const [durationMinutes, setDurationMinutes] = useState(55);
  const [additionalContext, setAdditionalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState('');
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [resultViewMode, setResultViewMode] = useState<'visual' | 'raw'>('visual');

  // Load curriculum tree and AI status on open
  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setOutputType(null);
    setResult(null);
    setError('');
    
    setTreeLoading(true);
    Promise.all([
      api.get('/ai/curriculum-tree'),
      api.get('/ai/status'),
    ])
      .then(([treeRes, statusRes]) => {
        setCurriculumTree(treeRes.data || []);
        setAiStatus(statusRes.data);
      })
      .catch(() => {
        setCurriculumTree([]);
      })
      .finally(() => setTreeLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCohort = curriculumTree[selectedCohortIdx];
  const selectedUnit = selectedCohort?.units.find(u => u.id === selectedUnitId);
  const selectedLesson = selectedUnit?.lessons.find(l => l.id === selectedLessonId);
  const needsQuestionCount = ['diagnostic_assessment', 'formative_assessment', 'exam_with_rubric', 'integration_situation'].includes(outputType || '');
  const needsDuration = ['lesson_structure', 'lesson_memo'].includes(outputType || '');

  const handleGenerate = async () => {
    if (!selectedLessonId || !outputType) return;
    setStep(3);
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/ai/generate', {
        lessonId: selectedLessonId,
        outputType,
        targetStudentLevel: studentLevel,
        questionCount,
        durationMinutes,
        additionalContext: additionalContext || undefined,
      });
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التوليد. تحقق من الإعدادات.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-200 dark:border-violet-700',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 border-teal-200 dark:border-teal-700',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
    rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div
        className={`bg-white dark:bg-slate-900 w-full ${step === 4 ? 'max-w-4xl' : 'max-w-2xl'} rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300`}
        style={{ maxHeight: '92vh' }}
        dir="rtl"
      >
        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-gradient-to-l from-indigo-600 to-violet-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black">✦ التوليد الذكي بالذكاء الاصطناعي</h2>
              <p className="text-xs text-indigo-200">مولِّد الوثائق البيداغوجية من المنهاج</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── AI Status Banner ── */}
        {aiStatus && !aiStatus.configured && (
          <div className="px-5 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 shrink-0">
            <Database className="w-4 h-4 shrink-0" />
            <span>{aiStatus.message} — المحتوى سيُولَّد من قاعدة البيانات المنهجية مباشرة.</span>
          </div>
        )}

        {/* ── Step Indicator ── */}
        {step < 3 && (
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold shrink-0">
            {['اختر النوع', 'حدد الدرس', 'معلمات التوليد'].map((label, i) => (
              <React.Fragment key={i}>
                <span className={`px-3 py-1 rounded-full ${step === i ? 'bg-indigo-600 text-white' : step > i ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {step > i ? '✓' : i + 1}. {label}
                </span>
                {i < 2 && <ChevronLeft className="w-3 h-3 text-slate-400" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ── Body (scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* STEP 0: Select Output Type */}
          {step === 0 && (
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">
                اختر نوع الوثيقة البيداغوجية التي تريد توليدها:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {OUTPUT_TYPES.map(({ type, label, description, icon: Icon, color }) => (
                  <button
                    key={type}
                    onClick={() => { setOutputType(type); setStep(1); }}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-right transition-all hover:shadow-md hover:-translate-y-0.5 ${
                      outputType === type
                        ? `${colorMap[color]} border-current shadow-md`
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200">{label}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: Select Lesson */}
          {step === 1 && (
            <div className="space-y-4">
              {treeLoading ? (
                <div className="text-center py-8 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
                  <p className="text-sm">جاري تحميل المنهاج...</p>
                </div>
              ) : curriculumTree.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">لم يتم العثور على أفواج دراسية مرتبطة بحسابك</p>
                  <p className="text-xs text-slate-500">يرجى التواصل مع المشرف لإضافتك إلى فوج دراسي</p>
                </div>
              ) : (
                <>
                  {/* Cohort Selector */}
                  {curriculumTree.length > 1 && (
                    <div>
                      <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2">الفوج الدراسي</label>
                      <div className="flex flex-wrap gap-2">
                        {curriculumTree.map((ct, idx) => (
                          <button
                            key={ct.cohortId}
                            onClick={() => { setSelectedCohortIdx(idx); setSelectedUnitId(''); setSelectedLessonId(''); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedCohortIdx === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                          >
                            {ct.cohortName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Course Info */}
                  {selectedCohort && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 shrink-0" />
                      <span>
                        <strong>{selectedCohort.course.subject.nameAr}</strong> — {selectedCohort.course.title} — {selectedCohort.cohortName}
                      </span>
                    </div>
                  )}

                  {/* Unit Selector */}
                  {selectedCohort && selectedCohort.units.length > 0 && (
                    <div>
                      <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2">الوحدة</label>
                      <select
                        value={selectedUnitId}
                        onChange={e => { setSelectedUnitId(e.target.value); setSelectedLessonId(''); }}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">— اختر الوحدة —</option>
                        {selectedCohort.units.map(u => (
                          <option key={u.id} value={u.id}>{u.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Lesson Selector */}
                  {selectedUnit && selectedUnit.lessons.length > 0 && (
                    <div>
                      <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2">الدرس</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedUnit.lessons.map(lesson => (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLessonId(lesson.id)}
                            className={`w-full text-right px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                              selectedLessonId === lesson.id
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                            }`}
                          >
                            {lesson.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 2: Parameters */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 space-y-1">
                <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> ملخص الطلب</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">{OUTPUT_TYPES.find(o => o.type === outputType)?.label}</p>
                <p className="text-xs text-indigo-500">الدرس: {selectedLesson?.title}</p>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2">مستوى المتعلمين</label>
                <div className="grid grid-cols-2 gap-2">
                  {STUDENT_LEVELS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setStudentLevel(l.value as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${studentLevel === l.value ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'}`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {needsQuestionCount && (
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2">
                    عدد الأسئلة: <span className="text-indigo-600 font-black">{questionCount}</span>
                  </label>
                  <input
                    type="range"
                    min={3} max={20} value={questionCount}
                    onChange={e => setQuestionCount(+e.target.value)}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1"><span>3</span><span>20</span></div>
                </div>
              )}

              {needsDuration && (
                <div>
                  <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2">
                    مدة الحصة: <span className="text-indigo-600 font-black">{durationMinutes} دقيقة</span>
                  </label>
                  <input
                    type="range"
                    min={30} max={120} step={5} value={durationMinutes}
                    onChange={e => setDurationMinutes(+e.target.value)}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1"><span>30 د</span><span>120 د</span></div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-slate-400 mb-2">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={additionalContext}
                  onChange={e => setAdditionalContext(e.target.value)}
                  rows={3}
                  placeholder="مثال: ركز على المفاهيم الأساسية فقط، أو: تجنب الأسئلة الطويلة..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Generating */}
          {step === 3 && (
            <div className="text-center py-12 space-y-4">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full bg-indigo-100 dark:bg-indigo-900/40 animate-ping opacity-40" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
                  <Bot className="w-9 h-9 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <p className="font-black text-slate-800 dark:text-slate-200 text-lg">جاري التوليد الذكي...</p>
                <p className="text-sm text-slate-500 mt-1">نقوم بتحليل المنهاج وإعداد المحتوى البيداغوجي</p>
              </div>
              <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Result */}
          {step === 4 && result && (
            <div className="space-y-4">
              {/* Source Attribution Summary */}
              <div className="p-3.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-black text-green-700 dark:text-green-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم التوليد بنجاح بناءً على المنهاج البيداغوجي المعتمد</span>
                  </p>
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    {result.fromFallback ? 'قاعدة البيانات المنهجية' : `النموذج: ${result.model}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-green-800 dark:text-green-300 font-bold pt-1">
                  <span>📚 {result.curriculumSource.subjectName}</span>
                  <span>📖 {result.curriculumSource.gradeLevel}</span>
                  <span className="truncate">🔖 {result.curriculumSource.unitTitle}</span>
                  <span className="truncate">📝 {result.curriculumSource.lessonTitle}</span>
                </div>
              </div>

              {/* View Switcher Tabs: Visual Document (RTL) vs Raw Text */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setResultViewMode('visual')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                      resultViewMode === 'visual'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>🖼️ وثيقة رسمية مولدة (صورة RTL)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultViewMode('raw')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all ${
                      resultViewMode === 'raw'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>📄 نص خام (Markdown)</span>
                  </button>
                </div>

                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                  {resultViewMode === 'visual' ? 'جاهزة للعرض والتحميل كصورة بشعار المنصة' : 'نص قابل للتعديل والنسخ'}
                </span>
              </div>

              {/* 1. Visual RTL Document Mode (Default) */}
              {resultViewMode === 'visual' && (
                <GeneratedImageDocument
                  title={result.title}
                  documentTypeLabel={OUTPUT_TYPES.find(o => o.type === result.outputType)?.label || 'وثيقة بيداغوجية'}
                  subjectName={result.curriculumSource.subjectName}
                  gradeLevel={result.curriculumSource.gradeLevel}
                  unitTitle={result.curriculumSource.unitTitle}
                  lessonTitle={result.curriculumSource.lessonTitle}
                  content={result.content}
                  aiModel={result.model}
                  fromFallback={result.fromFallback}
                  generatedAt={result.generatedAt}
                  fileName={result.title}
                  showToolbar={true}
                />
              )}

              {/* 2. Raw Text Mode */}
              {resultViewMode === 'raw' && (
                <div className="space-y-3">
                  <h3 className="font-black text-slate-800 dark:text-slate-200 text-base leading-relaxed">
                    {result.title}
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-mono border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                    {result.content}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCopy}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'تم النسخ!' : 'نسخ المحتوى'}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      تحميل ملف نصي (.txt)
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Reset / Re-generate Button */}
              <div className="pt-2">
                <button
                  onClick={() => { setStep(0); setOutputType(null); setResult(null); setSelectedLessonId(''); setSelectedUnitId(''); setResultViewMode('visual'); }}
                  className="w-full py-2.5 rounded-xl border-2 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  توليد وثيقة أخرى
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step < 3 && (
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 bg-white dark:bg-slate-900">
            {step > 0 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-sm flex items-center gap-2 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                رجوع
              </button>
            ) : (
              <div />
            )}

            {step === 0 && outputType && (
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 transition-colors"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {step === 1 && selectedLessonId && (
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center gap-2 transition-colors"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-l from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {loading ? 'جاري التوليد...' : 'توليد الآن'}
              </button>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0 bg-white dark:bg-slate-900">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
