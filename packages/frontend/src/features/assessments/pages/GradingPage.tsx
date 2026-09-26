import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  Award,
  ChevronRight,
  Minus,
  Plus,
  Save,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/axios";

// Mock Data
const MOCK_SUBMISSIONS = [
  {
    id: "s1",
    studentName: "أحمد محمود",
    submittedAt: "منذ 3 ساعات",
    status: "pending",
    score: null,
    answer:
      "ينص قانون نيوتن الثالث على أن لكل فعل رد فعل، مساوٍ له في المقدار ومعاكس له في الاتجاه. مثال على ذلك عندما تسبح في الماء وتدفع الماء للخلف، فإن الماء يدفعك للأمام لتتحرك.",
    feedback: "",
  },
  {
    id: "s2",
    studentName: "سارة خالد",
    submittedAt: "منذ 5 ساعات",
    status: "graded",
    score: 18,
    answer:
      "قانون نيوتن الثالث: لكل قوة فعل قوة رد فعل، متساويتان في المقدار ومتضادتان في الاتجاه. مثل إطلاق صاروخ للفضاء حيث يندفع الغاز للأسفل فيندفع الصاروخ للأعلى.",
    feedback: "إجابة ممتازة ومثال واضح.",
  },
  {
    id: "s3",
    studentName: "محمد علي",
    submittedAt: "منذ 8 ساعات",
    status: "pending",
    score: null,
    answer: "قانون نيوتن يقول لكل فعل رد فعل. مثل المشي.",
    feedback: "",
  },
  // Add some more mock data to reach 12
  ...Array.from({ length: 9 }).map((_, i) => ({
    id: `s${i + 4}`,
    studentName: `طالب ${i + 4}`,
    submittedAt: `منذ ${10 + i} ساعات`,
    status: i % 2 === 0 ? "graded" : "pending",
    score: i % 2 === 0 ? 15 + (i % 5) : null,
    answer: "إجابة الطالب هنا...",
    feedback: i % 2 === 0 ? "عمل جيد" : "",
  })),
];

const getStudentName = (submission: any) => {
  if (!submission) return "لا يوجد تسليمات";
  if (submission.studentName) return submission.studentName;
  if (submission.student)
    return `${submission.student.firstName} ${submission.student.lastName}`;
  return "طالب غير معروف";
};

const getInitials = (name: string) => {
  if (!name) return "؟";
  return name
    .split(" ")
    .map((n) => n[0] || "")
    .join("");
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "غير متوفر";
  if (dateString.includes("منذ")) return dateString;
  try {
    return new Date(dateString).toLocaleDateString("ar-PS");
  } catch (e) {
    return dateString;
  }
};

export default function GradingPage() {
  const navigate = useNavigate();
  const { assessmentId } = useParams();

  const { data: assessment, isLoading } = useQuery({
    queryKey: ["assessment", assessmentId],
    queryFn: async () => {
      const res = await api.get(`/assessments/${assessmentId}`);
      return res.data;
    },
    enabled: !!assessmentId,
  });

  const [localSubmissions, setLocalSubmissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "graded">(
    "all",
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);

  const [currentScore, setCurrentScore] = useState<number | "">(0);
  const [currentFeedback, setCurrentFeedback] = useState("");
  const [showToast, setShowToast] = useState(false);

  React.useEffect(() => {
    if (assessment?.submissions) {
      setLocalSubmissions(assessment.submissions);
      if (assessment.submissions.length > 0 && !selectedSubmissionId) {
        setSelectedSubmissionId(assessment.submissions[0].id);
      }
    }
  }, [assessment]);

  const maxScore = assessment ? parseFloat(assessment.maxScore) : 20;

  const filteredSubmissions = localSubmissions.filter((s) => {
    if (activeTab === "pending")
      return (
        s.status === "pending" ||
        s.status === "draft" ||
        s.status === "submitted"
      );
    if (activeTab === "graded") return s.status === "graded";
    return true;
  });

  const selectedSubmission = localSubmissions.find(
    (s) => s.id === selectedSubmissionId,
  );

  // Update form state when selection changes
  React.useEffect(() => {
    if (selectedSubmission) {
      setCurrentScore(
        selectedSubmission.score !== null ? selectedSubmission.score : "",
      );
      setCurrentFeedback(selectedSubmission.feedback || "");
    }
  }, [selectedSubmissionId, selectedSubmission]);

  const handleScoreChange = (val: number | "") => {
    if (val === "") {
      setCurrentScore("");
      return;
    }
    if (val >= 0 && val <= maxScore) {
      setCurrentScore(val);
    }
  };

  const handleIncrement = () => {
    const s = typeof currentScore === "number" ? currentScore : 0;
    if (s < maxScore) setCurrentScore(s + 1);
  };

  const handleDecrement = () => {
    const s = typeof currentScore === "number" ? currentScore : 0;
    if (s > 0) setCurrentScore(s - 1);
  };

  const handleSubmitGrade = async () => {
    if (typeof currentScore !== "number" || !selectedSubmissionId) return;

    try {
      await api.patch(`/assessments/submissions/${selectedSubmissionId}/grade`, {
        score: currentScore,
        feedback: currentFeedback
      });

      setLocalSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmissionId
            ? { ...s, status: "graded", score: currentScore, feedback: currentFeedback }
            : s,
        ),
      );

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      alert("حدث خطأ أثناء حفظ الدرجة");
    }
  };

  const pendingCount = localSubmissions.filter(
    (s) =>
      s.status === "pending" ||
      s.status === "draft" ||
      s.status === "submitted",
  ).length;
  const gradedCount = localSubmissions.filter(
    (s) => s.status === "graded",
  ).length;

  return (
    <div
      className="min-h-screen bg-baaqoon-50 dark:bg-baaqoon-950 text-baaqoon-900 dark:text-white"
      dir="rtl"
    >
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-baaqoon-900 border-b border-baaqoon-200 dark:border-baaqoon-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-baaqoon-50 dark:bg-baaqoon-950 rounded-full transition-colors text-baaqoon-600 dark:text-baaqoon-400"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-baaqoon-900 dark:text-white">
              التقييمات - تصحيح التسليمات
            </h1>
            <p className="text-sm text-baaqoon-500 dark:text-baaqoon-400">
              {assessment?.title || "جاري التحميل..."}
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="hidden md:flex items-center gap-2 text-sm font-medium">
          <div className="flex items-center text-baaqoon-500 dark:text-baaqoon-400">
            <span className="w-6 h-6 rounded-full bg-baaqoon-100 dark:bg-baaqoon-900/50 flex items-center justify-center mr-2 text-xs">
              1
            </span>
            مسودة
          </div>
          <div className="w-8 h-px bg-baaqoon-200"></div>
          <div className="flex items-center text-baaqoon-500 dark:text-baaqoon-400">
            <span className="w-6 h-6 rounded-full bg-baaqoon-100 dark:bg-baaqoon-900/50 flex items-center justify-center mr-2 text-xs">
              2
            </span>
            تم التسليم
          </div>
          <div className="w-8 h-px bg-baaqoon-200"></div>
          <div className="flex items-center text-baaqoon-accent">
            <span className="w-6 h-6 rounded-full bg-baaqoon-accent/20 flex items-center justify-center mr-2 text-xs">
              3
            </span>
            التصحيح
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col md:flex-row gap-6">
        {/* LEFT PANEL */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="glass-panel rounded-2xl p-4 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                سجل التسليمات
                <span className="bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-600 dark:text-baaqoon-400 px-2 py-0.5 rounded-full text-xs font-medium">
                  {localSubmissions.length} تسليمة
                </span>
              </h2>
            </div>

            {/* Filter Tabs */}
            <div className="flex p-1 bg-baaqoon-50 dark:bg-baaqoon-950 rounded-lg mb-4">
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors ${activeTab === "all" ? "bg-white dark:bg-baaqoon-900 shadow-sm text-baaqoon-900 dark:text-white" : "text-baaqoon-500 dark:text-baaqoon-400 hover:text-baaqoon-700 dark:text-baaqoon-300"}`}
              >
                الكل
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === "pending" ? "bg-white dark:bg-baaqoon-900 shadow-sm text-baaqoon-900 dark:text-white" : "text-baaqoon-500 dark:text-baaqoon-400 hover:text-baaqoon-700 dark:text-baaqoon-300"}`}
              >
                بانتظار التصحيح
                <span className="bg-red-100 text-baaqoon-red w-5 h-5 rounded-full text-xs flex items-center justify-center">
                  {pendingCount}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("graded")}
                className={`flex-1 text-sm py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === "graded" ? "bg-white dark:bg-baaqoon-900 shadow-sm text-baaqoon-900 dark:text-white" : "text-baaqoon-500 dark:text-baaqoon-400 hover:text-baaqoon-700 dark:text-baaqoon-300"}`}
              >
                تم التصحيح
                <span className="bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-accentDark w-5 h-5 rounded-full text-xs flex items-center justify-center">
                  {gradedCount}
                </span>
              </button>
            </div>

            {/* Submissions List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmissionId(submission.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedSubmissionId === submission.id
                      ? "border-baaqoon-accent bg-baaqoon-50 dark:bg-baaqoon-900 shadow-sm"
                      : "border-transparent hover:border-baaqoon-200 dark:hover:border-baaqoon-700"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-baaqoon-200 flex items-center justify-center text-baaqoon-700 dark:text-baaqoon-300 font-bold shrink-0">
                      {getInitials(getStudentName(submission))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-baaqoon-900 dark:text-white truncate">
                        {getStudentName(submission)}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-baaqoon-500 dark:text-baaqoon-400 mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(submission.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    {submission.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 text-baaqoon-red text-xs px-2 py-1 rounded-md font-medium">
                        <AlertCircle className="w-3 h-3" />
                        بانتظار التصحيح
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-accent text-xs px-2 py-1 rounded-md font-medium">
                        <CheckCircle className="w-3 h-3" />
                        تم التصحيح: {submission.score}/{maxScore}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredSubmissions.length === 0 && (
                <div className="text-center py-10 text-baaqoon-500 dark:text-baaqoon-400">
                  لا توجد تسليمات تطابق هذا الفلتر
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-2/3 flex flex-col gap-6">
          {selectedSubmission ? (
            <>
              {/* Submission Content */}
              <div className="glass-panel rounded-2xl p-6 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800 relative">
                {/* Toast Notification */}
                {showToast && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-down">
                    <CheckCircle className="w-5 h-5" />
                    تم حفظ الدرجة بنجاح
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-baaqoon-100 dark:border-baaqoon-800">
                  <div className="w-12 h-12 rounded-full bg-baaqoon-accent/10 flex items-center justify-center text-baaqoon-accent font-bold text-lg">
                    {getInitials(getStudentName(selectedSubmission))}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-baaqoon-900 dark:text-white">
                      {getStudentName(selectedSubmission)}
                    </h2>
                    <p className="text-sm text-baaqoon-500 dark:text-baaqoon-400">
                      الفرع العلمي
                    </p>
                  </div>
                </div>

                <div className="bg-baaqoon-50 dark:bg-baaqoon-950 rounded-xl p-6 border border-baaqoon-200 dark:border-baaqoon-700">
                  {assessment?.questions?.map((q: any, idx: number) => (
                    <div key={q.id} className="mb-6 last:mb-0">
                      <h3 className="font-semibold text-baaqoon-900 dark:text-white mb-2 flex items-start gap-2">
                        <span className="text-baaqoon-accent mt-0.5 font-bold">
                          س{idx + 1}:
                        </span>
                        {q.questionTemplate?.content || "سؤال غير متوفر"}
                      </h3>
                      <div className="mt-4 bg-white dark:bg-baaqoon-900 p-5 rounded-lg border border-baaqoon-200 dark:border-baaqoon-700 text-baaqoon-700 dark:text-baaqoon-300 leading-relaxed min-h-[120px]">
                        {selectedSubmission?.answer ||
                          "لم يتم تقديم إجابة أو لا توجد تسليمات بعد."}
                      </div>
                    </div>
                  ))}
                  {!assessment?.questions?.length && (
                    <div className="text-center p-4 text-baaqoon-500">
                      لا توجد أسئلة مولدة في هذا الواجب
                    </div>
                  )}
                </div>
              </div>

              {/* Grading Section */}
              <div className="glass-panel rounded-2xl p-6 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Award className="w-5 h-5 text-baaqoon-accent" />
                    إدخال الدرجة
                  </h3>
                  <span className="text-sm font-medium text-baaqoon-600 dark:text-baaqoon-400 bg-baaqoon-50 dark:bg-baaqoon-950 px-3 py-1 rounded-full">
                    الدرجة القصوى: {maxScore}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {/* Score Input */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-4 bg-baaqoon-50 dark:bg-baaqoon-950 p-4 rounded-2xl border border-baaqoon-200 dark:border-baaqoon-700">
                      <button
                        onClick={handleDecrement}
                        className="w-10 h-10 rounded-full bg-white dark:bg-baaqoon-900 shadow-sm border border-baaqoon-200 dark:border-baaqoon-700 flex items-center justify-center hover:bg-baaqoon-100 dark:bg-baaqoon-900/50 transition-colors text-baaqoon-700 dark:text-baaqoon-300"
                      >
                        <Minus className="w-5 h-5" />
                      </button>

                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max={maxScore}
                          value={currentScore}
                          onChange={(e) =>
                            handleScoreChange(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                          className="w-20 text-center text-3xl font-bold bg-transparent outline-none text-baaqoon-900 dark:text-white [-moz-appearance:_textfield] [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-baaqoon-300 rounded-full"></div>
                      </div>

                      <button
                        onClick={handleIncrement}
                        className="w-10 h-10 rounded-full bg-white dark:bg-baaqoon-900 shadow-sm border border-baaqoon-200 dark:border-baaqoon-700 flex items-center justify-center hover:bg-baaqoon-100 dark:bg-baaqoon-900/50 transition-colors text-baaqoon-700 dark:text-baaqoon-300"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div className="md:col-span-8 flex flex-col gap-3">
                    <label className="text-sm font-medium text-baaqoon-700 dark:text-baaqoon-300 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      ملاحظات المصحح
                    </label>
                    <textarea
                      value={currentFeedback}
                      onChange={(e) => setCurrentFeedback(e.target.value)}
                      placeholder="أضف ملاحظاتك للطالب هنا..."
                      className="w-full h-32 p-4 rounded-xl border border-baaqoon-200 dark:border-baaqoon-700 focus:border-baaqoon-accent focus:ring-1 focus:ring-baaqoon-accent outline-none resize-none bg-baaqoon-50 dark:bg-baaqoon-950/50 transition-all text-baaqoon-900 dark:text-white"
                    ></textarea>

                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSubmitGrade}
                        disabled={typeof currentScore !== "number"}
                        className="bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-5 h-5" />
                        تأكيد الدرجة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-2xl p-10 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800 h-full flex flex-col items-center justify-center text-baaqoon-500 dark:text-baaqoon-400">
              <User className="w-16 h-16 text-baaqoon-200 mb-4" />
              <p className="text-lg">
                الرجاء اختيار تسليم من القائمة لعرضه وتصحيحه
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
