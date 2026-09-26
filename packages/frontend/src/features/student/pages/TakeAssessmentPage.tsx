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
    <div className="min-h-screen bg-baaqoon-50 dark:bg-baaqoon-950" dir="rtl">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-baaqoon-900/90 backdrop-blur-md border-b border-baaqoon-200 dark:border-baaqoon-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-baaqoon-accent" />
            <div>
              <h1 className="font-bold text-sm text-baaqoon-900 dark:text-white line-clamp-1">
                {assessment?.title}
              </h1>
              <p className="text-xs text-baaqoon-500">
                {assessment?.cohort?.name}
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-sm font-bold ${
              isTimeWarning
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                : "bg-baaqoon-100 text-baaqoon-700 dark:bg-baaqoon-800 dark:text-baaqoon-300"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <div className="bg-white dark:bg-baaqoon-900 rounded-xl p-4 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-baaqoon-500">التقدم</span>
            <span className="font-bold text-baaqoon-accent">{progress}%</span>
          </div>
          <div className="w-full bg-baaqoon-100 dark:bg-baaqoon-800 rounded-full h-2.5">
            <div
              className="bg-gradient-to-l from-baaqoon-accent to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Question dots */}
          <div className="flex flex-wrap gap-2 mt-3">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQ(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  idx === currentQ
                    ? "bg-baaqoon-accent text-white scale-110 shadow-md"
                    : answers[q.id]
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-baaqoon-50 text-baaqoon-500 dark:bg-baaqoon-800 dark:text-baaqoon-400"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Card */}
        {question && (
          <div className="bg-white dark:bg-baaqoon-900 rounded-2xl shadow-sm border border-baaqoon-100 dark:border-baaqoon-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1 rounded-full bg-baaqoon-100 dark:bg-baaqoon-800 text-baaqoon-600 dark:text-baaqoon-300 font-bold">
                السؤال {currentQ + 1} من {questions.length}
              </span>
              <span className="text-xs px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-bold">
                {question.points} نقطة
              </span>
            </div>

            <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white leading-relaxed">
              {question.questionTemplate?.questionTextAr}
            </h3>

            {/* Options */}
            {question.questionTemplate?.questionType === "mcq" && (
              <div className="space-y-3">
                {question.questionTemplate.optionsAr?.map(
                  (option: string, optIdx: number) => {
                    const isSelected = answers[question.id] === option;
                    const letters = ["أ", "ب", "ج", "د"];
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswer(question.id, option)}
                        className={`w-full text-right p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-baaqoon-accent bg-baaqoon-accent/5 dark:bg-baaqoon-accent/10 shadow-sm"
                            : "border-baaqoon-100 dark:border-baaqoon-700 hover:border-baaqoon-300 dark:hover:border-baaqoon-600 hover:bg-baaqoon-50/50 dark:hover:bg-baaqoon-800/50"
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isSelected
                              ? "bg-baaqoon-accent text-white"
                              : "bg-baaqoon-100 dark:bg-baaqoon-800 text-baaqoon-500"
                          }`}
                        >
                          {letters[optIdx]}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            isSelected
                              ? "text-baaqoon-accent"
                              : "text-baaqoon-700 dark:text-baaqoon-300"
                          }`}
                        >
                          {option}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-baaqoon-accent mr-auto" />
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
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(question.id, opt)}
                      className={`p-5 rounded-xl border-2 text-center transition-all font-bold text-lg ${
                        isSelected
                          ? "border-baaqoon-accent bg-baaqoon-accent/5 text-baaqoon-accent shadow-sm"
                          : "border-baaqoon-100 dark:border-baaqoon-700 text-baaqoon-500 hover:border-baaqoon-300"
                      }`}
                    >
                      {opt === "صح" ? "✅ صح" : "❌ خطأ"}
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
                placeholder="اكتب إجابتك هنا..."
                rows={question.questionTemplate.questionType === "essay" ? 6 : 3}
                className="w-full px-4 py-3 rounded-xl border-2 border-baaqoon-100 dark:border-baaqoon-700 bg-transparent text-baaqoon-900 dark:text-white focus:border-baaqoon-accent focus:ring-2 focus:ring-baaqoon-accent/20 outline-none transition-all resize-none"
              />
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
            disabled={currentQ === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-baaqoon-200 dark:border-baaqoon-700 text-baaqoon-600 dark:text-baaqoon-300 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800 disabled:opacity-40 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            السابق
          </button>

          {currentQ < questions.length - 1 ? (
            <button
              onClick={() =>
                setCurrentQ((p) => Math.min(questions.length - 1, p + 1))
              }
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold transition-colors"
            >
              التالي
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {submitting ? "جارٍ التسليم..." : "تسليم الاختبار"}
            </button>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
