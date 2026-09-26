import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../../lib/axios";
import {
  Clock,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  AlertCircle,
  BookOpen,
} from "lucide-react";

interface Question {
  id: string;
  orderIndex: number;
  points: number;
  questionTemplate: {
    id: string;
    questionTextAr: string;
    questionType: string;
    optionsAr: string[];
    correctAnswer: string;
  };
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  maxScore: number;
  dueDate?: string;
  questions: Question[];
  cohort?: { name: string };
}

export default function TakeAssessmentPage() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(45 * 60); // 45 minutes default

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.get(`/assessments/${assessmentId}`);
        setAssessment(res.data);
      } catch {
        setError("تعذر تحميل الاختبار. يرجى المحاولة لاحقاً.");
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [assessmentId]);

  // Timer countdown
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;
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
  }, [submitted, timeLeft]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted) {
      handleSubmit();
    }
  }, [timeLeft, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    try {
      await api.post(`/assessments/${assessmentId}/submit`, { answers });
      setSubmitted(true);
    } catch {
      setError("حدث خطأ أثناء تسليم الاختبار.");
    } finally {
      setSubmitting(false);
    }
  }, [assessmentId, answers, submitting, submitted]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baaqoon-50 dark:bg-baaqoon-950">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-baaqoon-accent border-t-transparent" />
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baaqoon-50 dark:bg-baaqoon-950">
        <div className="bg-white dark:bg-baaqoon-900 rounded-2xl shadow-lg p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-lg font-bold text-red-600">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-baaqoon-accent text-white rounded-lg"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-baaqoon-50 dark:bg-baaqoon-950">
        <div className="bg-white dark:bg-baaqoon-900 rounded-2xl shadow-lg p-10 max-w-md text-center space-y-6 animate-fade-in-up">
          <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-baaqoon-900 dark:text-white">
            تم تسليم الاختبار بنجاح! 🎉
          </h2>
          <p className="text-baaqoon-500 dark:text-baaqoon-400">
            أجبت على {Object.keys(answers).length} من{" "}
            {assessment?.questions.length} سؤال
          </p>
          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-8 py-3 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold rounded-xl transition-colors"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  const questions = assessment?.questions || [];
  const question = questions[currentQ];
  const progress = questions.length
    ? Math.round((Object.keys(answers).length / questions.length) * 100)
    : 0;
  const isTimeWarning = timeLeft < 5 * 60;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans" dir="rtl">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/20">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">
                {assessment?.title}
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                {assessment?.cohort?.name}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold shadow-sm ${
              isTimeWarning
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse border border-rose-200 dark:border-rose-800"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Progress */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-700/50">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-slate-500 font-bold">نسبة الإنجاز</span>
            <span className="font-black text-violet-600 dark:text-violet-400">{progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mb-6 shadow-inner">
            <div
              className="bg-gradient-to-l from-violet-500 to-fuchsia-600 h-3 rounded-full transition-all duration-500 shadow-sm shadow-violet-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Question dots */}
          <div className="flex flex-wrap gap-2.5">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(idx)}
                className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                  idx === currentQ
                    ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white scale-110 shadow-lg shadow-violet-500/30"
                    : answers[q.id]
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Card */}
        {question && (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-lg border border-slate-200 dark:border-slate-700 p-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black border border-slate-200 dark:border-slate-700">
                السؤال {currentQ + 1} من {questions.length}
              </span>
              <span className="text-xs px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-black border border-emerald-200 dark:border-emerald-800">
                {question.points} نقاط
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-relaxed">
              {question.questionTemplate?.questionTextAr}
            </h3>

            {/* Options */}
            {question.questionTemplate?.questionType === "mcq" && (
              <div className="space-y-4">
                {question.questionTemplate.optionsAr?.map(
                  (option: string, optIdx: number) => {
                    const isSelected = answers[question.id] === option;
                    const letters = ["أ", "ب", "ج", "د"];
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswer(question.id, option)}
                        className={`w-full text-right p-5 rounded-2xl border-2 transition-all flex items-center gap-4 group ${
                          isSelected
                            ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 shadow-md shadow-violet-500/10"
                            : "border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 transition-colors ${
                            isSelected
                              ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-inner"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600 dark:group-hover:bg-violet-900/50"
                          }`}
                        >
                          {letters[optIdx]}
                        </span>
                        <span
                          className={`text-base font-bold ${
                            isSelected
                              ? "text-violet-900 dark:text-violet-100"
                              : "text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {option}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-violet-500 mr-auto" />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            )}

            {/* True/False */}
            {question.questionTemplate?.questionType === "true_false" && (
              <div className="grid grid-cols-2 gap-4">
                {["صح", "خطأ"].map((opt) => {
                  const isSelected = answers[question.id] === opt;
                  const isTrue = opt === "صح";
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(question.id, opt)}
                      className={`p-6 rounded-2xl border-2 text-center transition-all font-black text-xl flex flex-col items-center gap-3 ${
                        isSelected
                          ? isTrue 
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-md shadow-emerald-500/20" 
                            : "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 shadow-md shadow-rose-500/20"
                          : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
            {(question.questionTemplate?.questionType === "short_answer" ||
              question.questionTemplate?.questionType === "essay") && (
              <textarea
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="اكتب إجابتك هنا بوضوح..."
                rows={question.questionTemplate.questionType === "essay" ? 8 : 4}
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all resize-none font-medium shadow-sm text-base leading-relaxed"
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <button
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            السابق
          </button>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQ((p) => Math.min(questions.length - 1, p + 1))
              }
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black transition-all shadow-md hover:-translate-y-0.5"
            >
              التالي
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
            >
              <Send className="w-5 h-5" />
              {submitting ? "جارٍ التسليم..." : "إنهاء وتسليم الاختبار"}
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-400 font-bold text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
