import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertCircle,
  BookOpen,
  FileText,
  Calendar,
  Award,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react";

interface QuestionTemplate {
  id: string;
  content?: string;
  questionTextAr?: string;
  type?: string;
  questionType?: string;
  options?: any;
  optionsAr?: string[];
  correctAnswer?: string;
  difficulty?: number;
}

interface Question {
  id: string;
  orderIndex: number;
  scoreWeight?: number | string;
  points?: number;
  content?: string;
  questionTemplate?: QuestionTemplate;
}

interface Submission {
  id: string;
  studentId: string;
  status: string;
  score?: number | null;
  feedback?: string | null;
  submittedAt?: string;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  maxScore: number;
  type?: string;
  dueDate?: string;
  questions?: Question[];
  cohort?: { id: string; name: string };
  submissions?: Submission[];
}

export default function TakeAssessmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [solutionText, setSolutionText] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");

  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60);

  // Load Assessment data
  useEffect(() => {
    let isMounted = true;
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assessments/${assessmentId}`);
        if (!isMounted) return;
        const data: Assessment = res.data;
        setAssessment(data);

        // Check if current user already submitted
        const mySub = data.submissions?.find((s) => s.studentId === user?.id);
        if (mySub) {
          // Parse past answers/solution
          try {
            const parsed = typeof mySub.feedback === "string" ? JSON.parse(mySub.feedback) : mySub.feedback;
            if (parsed) {
              if (parsed.answers) setAnswers(parsed.answers);
              if (parsed.solutionText) setSolutionText(parsed.solutionText);
              if (parsed.fileUrl) setFileUrl(parsed.fileUrl);
              if (parsed.notes) setNotes(parsed.notes);
            }
          } catch {
            if (mySub.feedback) setSolutionText(mySub.feedback);
          }
          setSubmitted(true);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.response?.data?.message || "تعذر تحميل التقييم أو الواجب المطلوب. يرجى المحاولة لاحقاً.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (assessmentId) {
      fetchAssessment();
    }
    return () => {
      isMounted = false;
    };
  }, [assessmentId, user?.id]);

  const questions: Question[] = useMemo(() => {
    return assessment?.questions || [];
  }, [assessment]);

  const isQuiz = questions.length > 0;

  // Normalized current question for quiz mode
  const currentQuestion = questions[currentQ];
  const questionContent = useMemo(() => {
    if (!currentQuestion) return "";
    return (
      currentQuestion.questionTemplate?.content ||
      currentQuestion.questionTemplate?.questionTextAr ||
      currentQuestion.content ||
      `السؤال رقم ${currentQ + 1}`
    );
  }, [currentQuestion, currentQ]);

  const questionType = useMemo(() => {
    if (!currentQuestion) return "multiple_choice";
    const raw = (
      currentQuestion.questionTemplate?.type ||
      currentQuestion.questionTemplate?.questionType ||
      "multiple_choice"
    ).toLowerCase();
    if (raw === "mcq" || raw === "multiple_choice") return "multiple_choice";
    if (raw === "true_false" || raw === "boolean") return "true_false";
    return raw;
  }, [currentQuestion]);

  const questionOptions = useMemo(() => {
    if (!currentQuestion) return [];
    const tpl = currentQuestion.questionTemplate;
    if (!tpl) return [];
    if (Array.isArray(tpl.options)) return tpl.options;
    if (typeof tpl.options === "string") {
      try {
        const parsed = JSON.parse(tpl.options);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    if (Array.isArray(tpl.optionsAr)) return tpl.optionsAr;
    return [];
  }, [currentQuestion]);

  const questionPoints = useMemo(() => {
    if (!currentQuestion) return 1;
    return Number(currentQuestion.scoreWeight || currentQuestion.points || 1);
  }, [currentQuestion]);

  // Timer countdown for quiz mode
  useEffect(() => {
    if (!isQuiz || submitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isQuiz, submitted, timeLeft]);

  // Auto-submit when time runs out in quiz mode
  useEffect(() => {
    if (isQuiz && timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, isQuiz, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    if (!isQuiz) {
      if (!solutionText.trim() && !fileUrl.trim()) {
        setError("يرجى كتابة حل الواجب أو إرفاق رابط خارجي للحل قبل التسليم.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.post(`/assessments/${assessmentId}/submit`, {
        answers,
        solutionText: solutionText.trim(),
        fileUrl: fileUrl.trim(),
        notes: notes.trim()
      });

      setSubmitted(true);
      setIsEditingExisting(false);

      // Re-fetch assessment to get updated submission info
      const refreshed = await api.get(`/assessments/${assessmentId}`);
      setAssessment(refreshed.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء تسليم الواجب. يرجى المحاولة مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }, [assessmentId, answers, solutionText, fileUrl, notes, isQuiz, submitting]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-baaqoon-950 p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-600 border-t-transparent mb-4" />
        <p className="text-slate-600 dark:text-slate-300 font-bold text-sm">جارٍ تحميل التكليف والواجب الدراسي...</p>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-baaqoon-950 p-4" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 max-w-md text-center space-y-5 border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">تعذر فتح الواجب</h3>
          <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors"
          >
            العودة للصفحة السابقة
          </button>
        </div>
      </div>
    );
  }

  const mySubmission = assessment?.submissions?.find((s) => s.studentId === user?.id);

  // Submitted success state (when not in edit mode)
  if (submitted && !isEditingExisting) {
    const isGraded = mySubmission?.status === "graded" && mySubmission.score !== null && mySubmission.score !== undefined;
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-baaqoon-950 p-4 font-sans" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl p-8 md:p-12 max-w-lg w-full text-center space-y-6 border border-slate-200 dark:border-slate-800 animate-fade-in-up">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              تم تسليم الواجب بنجاح! 🎉
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {assessment?.title} — {assessment?.cohort?.name}
            </p>
          </div>

          {/* Submission status details */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-3 text-right">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 font-bold">حالة التقييم:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                isGraded
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}>
                {isGraded ? "تم التصحيح والتقييم" : "تم الاستلام وبانتظار تصحيح المعلم ⏳"}
              </span>
            </div>

            {isGraded && (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-bold">الدرجة المحصلة:</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {mySubmission?.score} من {assessment?.maxScore}
                </span>
              </div>
            )}

            {isQuiz ? (
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-bold">عدد الأسئلة المجابة:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {Object.keys(answers).length} من {questions.length} سؤال
                </span>
              </div>
            ) : (
              solutionText && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs text-slate-400 block mb-1 font-bold">الحل الذي قمت بإرساله:</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 whitespace-pre-line">
                    {solutionText}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {!isGraded && (
              <button
                onClick={() => setIsEditingExisting(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                تعديل الحل المسلم
              </button>
            )}
            <button
              onClick={() => navigate("/student/dashboard")}
              className="flex-1 py-3 px-6 bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-violet-500/20"
            >
              العودة للوحة التحكم
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Progress
  const quizProgress = questions.length
    ? Math.round((Object.keys(answers).length / questions.length) * 100)
    : 0;
  const isTimeWarning = timeLeft < 5 * 60;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-baaqoon-950 font-sans pb-16" dir="rtl">
      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20 shrink-0">
              {isQuiz ? <BookOpen className="w-5 h-5 text-white" /> : <FileText className="w-5 h-5 text-white" />}
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                {assessment?.title || "واجب مدرسي"}
              </h1>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                <span>{assessment?.cohort?.name || "الفوج الدراسي"}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Award className="w-3.5 h-3.5" />
                  الدرجة: {assessment?.maxScore || 20}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isQuiz && (
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold shadow-sm ${
                  isTimeWarning
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse border border-rose-200 dark:border-rose-800"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
            )}
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              خروج
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Banner with Due Date & Description */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                {isQuiz ? "اختبار ذكي متعدد الأسئلة" : "واجب وتكليف منزلي"}
              </span>
              {assessment?.dueDate && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  موعد التسليم: {new Date(assessment.dueDate).toLocaleDateString("ar-PS")}
                </span>
              )}
            </div>
            {isEditingExisting && (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> وضع تعديل الحل
              </span>
            )}
          </div>

          {/* Description / Instructions */}
          {assessment?.description ? (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-slate-300 mb-2">
                <Info className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>المطلوب من الطالب / تعليمات الواجب:</span>
              </div>
              <p className="text-sm md:text-base font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                {assessment.description}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-violet-50/50 dark:bg-violet-950/20 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300">
              يرجى قراءة التكليف والإجابة بدقة لضمان تحصيل الدرجة الكاملة.
            </div>
          )}
        </div>

        {/* ── MODE 1: QUIZ WITH QUESTIONS ────────────────────────────────────── */}
        {isQuiz && (
          <div className="space-y-6">
            {/* Progress Bar & Dots */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">نسبة إنجاز الأسئلة</span>
                <span className="font-black text-violet-600 dark:text-violet-400">{quizProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-l from-violet-500 to-indigo-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${quizProgress}%` }}
                />
              </div>

              {/* Dots */}
              <div className="flex flex-wrap gap-2 pt-1">
                {questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentQ;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQ(idx)}
                      className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                        isCurrent
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white scale-110 shadow-lg shadow-violet-500/30"
                          : isAnswered
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            {currentQuestion && (
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-md border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black border border-slate-200 dark:border-slate-700">
                    السؤال {currentQ + 1} من {questions.length}
                  </span>
                  <span className="text-xs px-3.5 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800">
                    {questionPoints} نقاط
                  </span>
                </div>

                <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
                  {questionContent}
                </h3>

                {/* Multiple Choice Options */}
                {questionType === "multiple_choice" && (
                  <div className="space-y-3 pt-2">
                    {questionOptions.map((option: string, optIdx: number) => {
                      const isSelected = answers[currentQuestion.id] === option;
                      const letters = ["أ", "ب", "ج", "د", "هـ", "و"];
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleAnswerChange(currentQuestion.id, option)}
                          className={`w-full text-right p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                            isSelected
                              ? "border-violet-600 bg-violet-50/80 dark:bg-violet-950/40 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                        >
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-colors ${
                              isSelected
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600"
                            }`}
                          >
                            {letters[optIdx] || optIdx + 1}
                          </span>
                          <span
                            className={`text-sm md:text-base font-bold flex-1 ${
                              isSelected
                                ? "text-violet-950 dark:text-violet-100"
                                : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {option}
                          </span>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-violet-600 dark:text-violet-400 shrink-0 mr-auto" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True / False Options */}
                {questionType === "true_false" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {["صح", "خطأ"].map((opt) => {
                      const isSelected = answers[currentQuestion.id] === opt;
                      const isTrue = opt === "صح";
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                          className={`p-6 rounded-2xl border-2 text-center transition-all font-black text-lg md:text-xl flex flex-col items-center gap-2 ${
                            isSelected
                              ? isTrue
                                ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-sm"
                                : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 shadow-sm"
                              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <span className="text-3xl">{isTrue ? "✅" : "❌"}</span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer / Essay */}
                {questionType !== "multiple_choice" && questionType !== "true_false" && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                      اكتب إجابتك النموذجية للسؤال:
                    </label>
                    <textarea
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="اكتب إجابتك هنا بوضوح وبشكل مفصل..."
                      rows={5}
                      className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-violet-600 outline-none transition-all font-medium text-sm leading-relaxed"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                السابق
              </button>

              {currentQ < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQ((p) => Math.min(questions.length - 1, p + 1))}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black transition-all shadow-md text-sm"
                >
                  التالي
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/20 text-sm"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? "جارٍ التسليم..." : "إنهاء وتسليم الاختبار"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── MODE 2: WRITTEN ASSIGNMENT / HOMEWORK ────────────────────────────── */}
        {!isQuiz && (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-md border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white">
                  مساحة تقديم حل الواجب
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  قم بكتابة الحل أو وضع رابط خارجي (مستند، صورة الدفتر، أو درايف)
                </p>
              </div>
            </div>

            {/* Solution Text Area */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200">
                نص الحل أو إجابة الواجب: <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={solutionText}
                onChange={(e) => setSolutionText(e.target.value)}
                rows={8}
                placeholder="اكتب هنا إجابتك وحل التمرين بالتفصيل وبشكل واضح..."
                className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-violet-600 outline-none transition-all font-medium text-sm leading-relaxed"
              />
            </div>

            {/* External Link */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                رابط مستند خارجي أو صورة الحل (Google Drive / OneDrive - اختياري):
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-violet-600 outline-none text-sm transition-all"
              />
              <p className="text-xs text-slate-400">
                تأكد من جعل الرابط متاحاً للمشاهدة من قبل المعلم (Anyone with the link can view).
              </p>
            </div>

            {/* Extra Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                ملاحظات أو استفسار للمعلم (اختياري):
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظة أو توضيح تريد إرساله للمعلم بخصوص هذا الواجب..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:border-violet-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-black transition-all disabled:opacity-60 shadow-lg shadow-violet-500/25 text-sm"
              >
                <Send className="w-4 h-4" />
                {submitting ? "جارٍ إرسال الحل..." : "تسليم حل الواجب للمعلم"}
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 font-bold text-sm text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
