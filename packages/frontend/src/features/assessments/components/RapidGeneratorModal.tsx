import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { 
  Zap, 
  FileText, 
  Loader2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Users, 
  ArrowRight,
  Layers,
  Sparkles,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import GeneratedImageDocument from './GeneratedImageDocument';

interface Lesson {
  id: string;
  title: string;
}

interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface CohortTree {
  cohortId: string;
  cohortName: string;
  course: {
    id: string;
    title: string;
    subject: { nameAr: string };
    gradeLevel: string;
    academicBranch: string;
  };
  units: Unit[];
}

interface RapidGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId?: string;
  defaultLessonId?: string;
}

export default function RapidGeneratorModal({
  isOpen,
  onClose,
  cohortId: propCohortId,
  defaultLessonId
}: RapidGeneratorModalProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // State
  const [curriculumTree, setCurriculumTree] = useState<CohortTree[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedCohortIdx, setSelectedCohortIdx] = useState(0);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState(defaultLessonId || '');
  const [questionCount, setQuestionCount] = useState(5);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'summary'>('visual');

  // Load curriculum tree when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setError('');
    setViewMode('visual');
    setTreeLoading(true);

    api.get('/ai/curriculum-tree')
      .then((res) => {
        const treeData: CohortTree[] = Array.isArray(res.data) ? res.data : [];
        setCurriculumTree(treeData);

        if (treeData.length > 0) {
          // If propCohortId was supplied, match it
          let initialCohortIdx = 0;
          if (propCohortId) {
            const matchIdx = treeData.findIndex(c => c.cohortId === propCohortId);
            if (matchIdx !== -1) initialCohortIdx = matchIdx;
          }
          setSelectedCohortIdx(initialCohortIdx);

          const cohort = treeData[initialCohortIdx];
          if (cohort?.units?.length > 0) {
            const firstUnit = cohort.units[0];
            setSelectedUnitId(firstUnit.id);
            if (firstUnit.lessons?.length > 0) {
              setSelectedLessonId(defaultLessonId || firstUnit.lessons[0].id);
            }
          }
        }
      })
      .catch(() => {
        setError('تعذر تحميل هيكل الدروس والمناهج. يرجى إعادة المحاولة.');
      })
      .finally(() => {
        setTreeLoading(false);
      });
  }, [isOpen, propCohortId, defaultLessonId]);

  // When cohort selection changes, auto-select its first unit and lesson
  const handleCohortChange = (idx: number) => {
    setSelectedCohortIdx(idx);
    const cohort = curriculumTree[idx];
    if (cohort?.units?.length > 0) {
      const firstUnit = cohort.units[0];
      setSelectedUnitId(firstUnit.id);
      if (firstUnit.lessons?.length > 0) {
        setSelectedLessonId(firstUnit.lessons[0].id);
      } else {
        setSelectedLessonId('');
      }
    } else {
      setSelectedUnitId('');
      setSelectedLessonId('');
    }
  };

  // When unit changes, auto-select its first lesson
  const handleUnitChange = (unitId: string) => {
    setSelectedUnitId(unitId);
    const cohort = curriculumTree[selectedCohortIdx];
    const unit = cohort?.units.find(u => u.id === unitId);
    if (unit?.lessons?.length > 0) {
      setSelectedLessonId(unit.lessons[0].id);
    } else {
      setSelectedLessonId('');
    }
  };

  if (!isOpen) return null;

  const currentCohort = curriculumTree[selectedCohortIdx];
  const currentUnits = currentCohort?.units || [];
  const currentLessons = currentUnits.find(u => u.id === selectedUnitId)?.lessons || [];

  const handleGenerate = async () => {
    if (!selectedLessonId) {
      setError('الرجاء اختيار الدرس المقرر لتوليد أسئلة الاختبار.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/assessments/generate', {
        cohortId: currentCohort?.cohortId || undefined,
        curriculumLessonId: selectedLessonId,
        questionCount
      });
      setResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء التوليد السريع للاختبار.');
    } finally {
      setLoading(false);
    }
  };

  // Build markdown content for visual image document preview
  const buildResultMarkdown = () => {
    if (!result) return '';
    const qList = Array.isArray(result.questions) ? result.questions : [];
    
    let md = `## اختبار تقويمي سريع: ${result.title || 'اختبار في الدرس'}\n\n`;
    if (result.description) {
      md += `> ${result.description}\n\n`;
    }
    md += `---\n\n### الأسئلة المقررة:\n\n`;
    
    qList.forEach((q: any, i: number) => {
      md += `**السؤال ${i + 1}:** ${q.content || q.text || ''}\n`;
      if (Array.isArray(q.options) && q.options.length > 0) {
        q.options.forEach((opt: string, optIdx: number) => {
          const letter = ['أ', 'ب', 'ج', 'د'][optIdx] || `${optIdx + 1}`;
          md += `  - (${letter}) ${opt}\n`;
        });
      }
      if (q.explanation) {
        md += `\n> *توجيه بيداغوجي:* ${q.explanation}\n`;
      }
      md += '\n';
    });

    md += `---\n\n*الدرجة القصوى: ${result.maxScore || 20} نقطة — بالتوفيق لجميع الطلبة.*`;
    return md;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md animate-fade-in overflow-y-auto"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div 
        className={`bg-white dark:bg-slate-900 w-full ${result ? 'max-w-4xl' : 'max-w-xl'} rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col my-auto transition-all duration-300 animate-slide-up max-h-[92vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-l from-amber-500/10 via-indigo-500/10 to-violet-500/10 dark:from-slate-800 dark:to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>توليد اختبار سريع (Quick Quiz)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                  بضغطة واحدة ⚡
                </span>
              </h2>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                توليد ونشر اختبار تقويمي فوري للفوج مسحوب مباشرة من بنك أسئلة المنهاج
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            disabled={loading}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors disabled:opacity-50"
            title="إلغاء وإغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {treeLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto" />
              <p className="text-sm font-bold text-slate-500">جاري تحميل شجرة الفصول والمناهج الدراسية...</p>
            </div>
          ) : !result ? (
            /* Step 1: Configuration Form */
            <div className="space-y-4">
              {/* 1. Target Cohort Dropdown */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  الفوج الدراسي المستهدف:
                </label>
                <select
                  value={selectedCohortIdx}
                  onChange={(e) => handleCohortChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs"
                >
                  {curriculumTree.map((cohort, idx) => (
                    <option key={cohort.cohortId || idx} value={idx}>
                      {cohort.cohortName} — {cohort.course?.title || cohort.course?.subject?.nameAr || 'المادة'} ({cohort.course?.gradeLevel || 'المستوى'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Unit Dropdown */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-violet-600" />
                  الوحدة التعليمية:
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => handleUnitChange(e.target.value)}
                  disabled={currentUnits.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {currentUnits.length === 0 ? (
                    <option value="">لا توجد وحدات تعليمية متاحة لهذا الفوج</option>
                  ) : (
                    currentUnits.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.title} ({u.lessons?.length || 0} درس)
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 3. Lesson Dropdown */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  الدرس المقرر للاختبار:
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  disabled={currentLessons.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-600 transition-colors shadow-2xs disabled:opacity-50"
                >
                  {currentLessons.length === 0 ? (
                    <option value="">لا توجد دروس مدخلة في هذه الوحدة</option>
                  ) : (
                    currentLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        • {l.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 4. Question Count Pills */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-amber-500" />
                  حجم الاختبار (عدد الأسئلة):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { count: 3, label: '3 أسئلة', badge: 'فحص سريع (10 د)' },
                    { count: 5, label: '5 أسئلة', badge: 'اختبار قياسي (20 د)' },
                    { count: 10, label: '10 أسئلة', badge: 'تقويم شامل (45 د)' },
                  ].map((item) => (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => setQuestionCount(item.count)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        questionCount === item.count
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <span className="block font-black text-xs sm:text-sm">{item.label}</span>
                      <span className={`block text-[10px] mt-0.5 ${questionCount === item.count ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {item.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Step 2: Result Display with RTL Visual Document & Actions */
            <div className="space-y-4">
              {/* Success Banner */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-900 dark:text-emerald-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>تم إنشاء وحفظ الاختبار في المنهاج بنجاح وأُدرج في قائمة التقييمات!</span>
                </span>
                <span className="font-mono bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded text-[11px]">
                  {result.questions?.length || questionCount} أسئلة
                </span>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                      viewMode === 'visual'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🖼️ وثيقة الاختبار كصورة (RTL)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('summary')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                      viewMode === 'summary'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    📋 ملخص البيانات
                  </button>
                </div>

                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                  يمكنك تحميل الاختبار كصورة أو الانتقال مباشرة لتصحيحه
                </span>
              </div>

              {/* 1. Visual RTL Document View */}
              {viewMode === 'visual' && (
                <GeneratedImageDocument
                  title={result.title || 'اختبار تقويمي سريع'}
                  documentTypeLabel="اختبار تقويمي سريع"
                  subjectName={currentCohort?.course?.subject?.nameAr || currentCohort?.course?.title}
                  gradeLevel={currentCohort?.course?.gradeLevel}
                  cohortName={currentCohort?.cohortName}
                  unitTitle={currentUnits.find(u => u.id === selectedUnitId)?.title}
                  lessonTitle={currentLessons.find(l => l.id === selectedLessonId)?.title}
                  maxScore={result.maxScore || 20}
                  content={buildResultMarkdown()}
                  fileName={result.title || 'اختبار_سريع'}
                  showToolbar={true}
                />
              )}

              {/* 2. Summary View */}
              {viewMode === 'summary' && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block mb-0.5">اسم الاختبار:</span>
                      <span className="font-black text-slate-800 dark:text-slate-200 line-clamp-1">{result.title}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block mb-0.5">الفوج:</span>
                      <span className="font-black text-slate-800 dark:text-slate-200 line-clamp-1">{currentCohort?.cohortName}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block mb-0.5">الدرجة القصوى:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">{result.maxScore || 20} نقطة</span>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 block mb-0.5">عدد الأسئلة:</span>
                      <span className="font-black text-indigo-600 dark:text-indigo-400">{result.questions?.length || questionCount} أسئلة</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="font-black text-slate-700 dark:text-slate-300 block">نص الأسئلة المسحوبة:</span>
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {result.questions?.map((q: any, i: number) => (
                        <div key={q.id || i} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <p className="font-black text-slate-800 dark:text-slate-200">
                            {i + 1}. {q.content || q.text}
                          </p>
                          {q.options?.map((opt: string, optIdx: number) => (
                            <p key={optIdx} className="text-slate-600 dark:text-slate-400 pr-3 text-[11px]">
                              {['أ', 'ب', 'ج', 'د'][optIdx] || optIdx + 1}) {opt}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {!result ? (
            <>
              <button 
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-5 py-2.5 bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs transition-colors"
              >
                إلغاء
              </button>

              <button 
                type="button"
                onClick={handleGenerate}
                disabled={loading || !selectedLessonId || treeLoading}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-violet-600 hover:from-amber-600 hover:to-violet-700 text-white rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري توليد الأسئلة...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>توليد وحفظ الاختبار الآن ⚡</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button 
                type="button"
                onClick={() => {
                  setResult(null);
                  setError('');
                }}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>توليد اختبار آخر</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-black text-xs transition-colors"
                >
                  إغلاق والعودة للسجل
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/teacher/assessments/${result.id}/grade`);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/25 active:scale-95"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>الانتقال لتصحيح التسليمات 📝</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
