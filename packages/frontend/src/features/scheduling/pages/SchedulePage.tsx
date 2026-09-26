import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { api } from "../../../lib/axios";
import {
  Bot,
  Loader2,
  PlayCircle,
  BookOpen,
  Layers,
  CheckCircle2,
  ListChecks,
  FileText,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import RapidGeneratorModal from "../../assessments/components/RapidGeneratorModal";
import BulkScheduleModal from "../components/BulkScheduleModal";

export default function SchedulePage() {
  const renderJsonField = (field: any, fallback: string) => {
    if (!field) return <p className="text-baaqoon-500">{fallback}</p>;
    if (typeof field === "string")
      return <p className="whitespace-pre-wrap">{field}</p>;
    if (Array.isArray(field)) {
      return (
        <ul className="list-disc list-inside space-y-2">
          {field.map((item, idx) => (
            <li key={idx} className="text-sm">
              {typeof item === "object" && item !== null ? (
                <div className="inline-block align-top mr-2 bg-white dark:bg-baaqoon-900/50 p-3 rounded-lg border border-baaqoon-100 dark:border-baaqoon-700 w-full mt-1 shadow-sm">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k} className="mb-1 last:mb-0">
                      <strong className="text-baaqoon-800 dark:text-baaqoon-200 ml-1">
                        {k === "stage"
                          ? "المرحلة:"
                          : k === "activities"
                            ? "الأنشطة:"
                            : k}
                        :
                      </strong>
                      <span className="text-baaqoon-600 dark:text-baaqoon-400 leading-relaxed">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                String(item)
              )}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <pre className="text-xs overflow-x-auto p-2 bg-gray-100 dark:bg-gray-800 rounded">
        {JSON.stringify(field, null, 2)}
      </pre>
    );
  };

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isBulkScheduleOpen, setIsBulkScheduleOpen] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState("");
  const [sessionDate, setSessionDate] = useState("");

  const { data: tree = [], isLoading: isLoadingTree } = useQuery({
    queryKey: ["curriculumTree"],
    queryFn: async () => {
      const res = await api.get("/curriculum/subjects/tree");
      return res.data;
    },
  });

  const { data: cohorts = [], isLoading: isLoadingCohorts } = useQuery({
    queryKey: ["myCohorts"],
    queryFn: async () => {
      const res = await api.get("/groups/cohorts/me");
      return res.data;
    },
  });

  // Set default cohort when loaded
  React.useEffect(() => {
    if (cohorts.length > 0 && !selectedCohortId) {
      setSelectedCohortId(cohorts[0].id);
    }
  }, [cohorts, selectedCohortId]);

  if (isLoadingTree || isLoadingCohorts) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-baaqoon-accent" />
      </div>
    );
  }

  const subjects = tree.filter((s: any) => s.courses && s.courses.length > 0);

  const handleBuildSession = async () => {
    if (!selectedLesson) {
      alert("الرجاء اختيار الدرس أولاً من شجرة المناهج");
      return;
    }
    if (!selectedCohortId) {
      alert("الرجاء اختيار الفوج (القسم) أولاً");
      return;
    }

    // Alert the teacher that this will be generated automatically
    if (!confirm("سيتم بناء وتوليد الحصة آلياً لهذا الفوج. هل تريد الاستمرار؟"))
      return;

    try {
      const payload = { lessonId: selectedLesson.id, title: "درس: " + selectedLesson.title, cohortId: selectedCohortId, scheduledStartTime: sessionDate ? new Date(sessionDate).toISOString() : new Date().toISOString() };
      await api.post("/sessions", payload);
      alert("تمت إضافة الحصة للجدول الأسبوعي بنجاح!");
    } catch (err) {
      alert("حدث خطأ أثناء الإنشاء");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white">
            بناء وتوليد الحصص (هيكل المناهج)
          </h1>
          <p className="text-baaqoon-600 dark:text-baaqoon-400 mt-1">
            استعرض هيكل المناهج المدخلة، وقم بتوليد حصص واختبارات بناءً على
            البناء التعلمي الجاهز.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (!selectedSubject) {
                alert("الرجاء اختيار المادة أولاً من القائمة الجانبية");
                return;
              }
              setIsBulkScheduleOpen(true);
            }}
            className="px-4 py-2 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold rounded-xl flex items-center gap-2 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            أتمتة وبناء الجدول للمادة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* RIGHT SIDEBAR: Curriculum Tree */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-baaqoon-900 rounded-2xl p-4 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
            <h2 className="font-bold text-lg text-baaqoon-900 dark:text-white mb-4 flex items-center gap-2 border-b border-baaqoon-100 dark:border-baaqoon-800 pb-3">
              <Layers className="w-5 h-5 text-baaqoon-accent" />
              هيكل المناهج المعتمدة
            </h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              {subjects.map((subject: any) => (
                <div key={subject.id} className="space-y-2">
                  <button
                    onClick={() =>
                      setSelectedSubject(
                        selectedSubject?.id === subject.id ? null : subject,
                      )
                    }
                    className={`w-full text-right font-bold p-3 rounded-xl transition-colors ${selectedSubject?.id === subject.id ? "bg-baaqoon-accent text-white" : "bg-baaqoon-50 dark:bg-baaqoon-800 text-baaqoon-800 dark:text-baaqoon-100 hover:bg-baaqoon-100 dark:hover:bg-baaqoon-700"}`}
                  >
                    {subject.nameAr}
                  </button>

                  {selectedSubject?.id === subject.id &&
                    subject.courses.map((course: any) => (
                      <div key={course.id} className="pr-4 space-y-2 mt-2">
                        <div className="font-bold text-sm text-baaqoon-700 dark:text-baaqoon-300 mb-2 border-b border-baaqoon-100 dark:border-baaqoon-800 pb-1">
                          {course.title}
                        </div>
                        {course.versions[0]?.units?.map((unit: any) => (
                          <div
                            key={unit.id}
                            className="pr-4 border-r-2 border-baaqoon-200 dark:border-baaqoon-700 space-y-1 my-2"
                          >
                            <h3 className="font-semibold text-baaqoon-600 dark:text-baaqoon-400 text-xs py-1">
                              {unit.title}
                            </h3>
                            {unit.lessons.map((lesson: any) => (
                              <button
                                key={lesson.id}
                                onClick={() => setSelectedLesson(lesson)}
                                className={`w-full text-right text-xs p-2 rounded-lg transition-colors ${selectedLesson?.id === lesson.id ? "bg-baaqoon-100 dark:bg-baaqoon-700 text-baaqoon-800 dark:text-white font-bold" : "text-baaqoon-500 dark:text-baaqoon-400 hover:bg-baaqoon-50 dark:hover:bg-baaqoon-800/50"}`}
                              >
                                - {lesson.title}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LEFT AREA: Content View */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedLesson ? (
            <div className="bg-baaqoon-50 dark:bg-baaqoon-900/50 rounded-3xl border-2 border-dashed border-baaqoon-200 dark:border-baaqoon-700 h-[70vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-20 h-20 bg-baaqoon-100 dark:bg-baaqoon-800 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="w-10 h-10 text-baaqoon-400" />
              </div>
              <h2 className="text-xl font-bold text-baaqoon-600 dark:text-baaqoon-300 mb-2">
                بناء وتوليد الحصص (هيكل المناهج)
              </h2>
              <p className="text-baaqoon-500 dark:text-baaqoon-400 max-w-md mx-auto mb-8 leading-relaxed">
                استعرض هيكل المناهج المدخلة، وقم بتوليد حصص واختبارات بناءً على
                البناء التعلمي الجاهز.
              </p>

              <div className="text-right w-full max-w-sm bg-white dark:bg-baaqoon-900 p-6 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800">
                <h3 className="font-bold text-baaqoon-900 dark:text-white mb-3">
                  المناهج المتوفرة حالياً:
                </h3>
                <ul className="list-disc list-inside space-y-2 text-baaqoon-700 dark:text-baaqoon-300 text-sm">
                  <li>المطالعة والقواعد والتعبير</li>
                  <li>الأدب والبلاغة</li>
                  <li>الدراسات التاريخية</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-slide-up">
              {/* Lesson Header Header & Generation Tools */}
              <div className="bg-white dark:bg-baaqoon-900 rounded-2xl p-6 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 pb-6 border-b border-baaqoon-100 dark:border-baaqoon-800">
                  <div>
                    <span className="inline-block px-3 py-1 bg-baaqoon-accent/10 text-baaqoon-accent text-xs font-bold rounded-full mb-3">
                      الدرس المختار للتحضير والتوليد
                    </span>
                    <h2 className="text-2xl font-bold text-baaqoon-900 dark:text-white mb-2">
                      {selectedLesson.title}
                    </h2>

                    <div className="flex items-center gap-4 mt-4">
                      {/* Cohort Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-baaqoon-600 dark:text-baaqoon-400 flex items-center gap-1">
                          <Users className="w-3 h-3" /> اختر الفوج (القسم)
                        </label>
                        <select
                          value={selectedCohortId}
                          onChange={(e) => setSelectedCohortId(e.target.value)}
                          className="px-3 py-1.5 bg-baaqoon-50 dark:bg-baaqoon-800 border border-baaqoon-200 dark:border-baaqoon-700 rounded-lg text-sm font-medium outline-none"
                        >
                          {cohorts.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                          {cohorts.length === 0 && (
                            <option value="">لا توجد أفواج حالياً</option>
                          )}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-baaqoon-600 dark:text-baaqoon-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> وقت الحصة (الجدول)
                        </label>
                        <input
                          type="datetime-local"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          className="px-3 py-1.5 bg-baaqoon-50 dark:bg-baaqoon-800 border border-baaqoon-200 dark:border-baaqoon-700 rounded-lg text-sm font-medium outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button
                      onClick={handleBuildSession}
                      disabled={!selectedCohortId}
                      className="px-5 py-2.5 bg-baaqoon-100 hover:bg-baaqoon-200 text-baaqoon-800 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Calendar className="w-5 h-5" />
                      حفظ في الجدول الأسبوعي
                    </button>
                    <button
                      onClick={() => {
                        if (!selectedCohortId) {
                          alert("الرجاء اختيار الفوج (القسم) أولاً");
                          return;
                        }
                        setIsGeneratorOpen(true);
                      }}
                      disabled={!selectedCohortId}
                      className="px-5 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <FileText className="w-5 h-5" />
                      توليد اختبار
                    </button>
                  </div>
                </div>

                {/* Lesson Details (Read only preview) */}
                <div className="space-y-6">
                  <div className="bg-baaqoon-50/50 dark:bg-baaqoon-800/20 p-5 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800">
                    <h3 className="font-bold text-baaqoon-800 dark:text-baaqoon-200 mb-3 flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-baaqoon-accent" />{" "}
                      مراحل بناء التعلم
                    </h3>
                    <div className="prose dark:prose-invert prose-sm max-w-none text-baaqoon-600 dark:text-baaqoon-300">
                      {renderJsonField(
                        selectedLesson.learningSequence,
                        "لا توجد بيانات مرحلية لهذا الدرس.",
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-baaqoon-50/50 dark:bg-baaqoon-800/20 p-5 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800">
                      <h3 className="font-bold text-baaqoon-800 dark:text-baaqoon-200 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />{" "}
                        أهداف التعلم (المخرجات)
                      </h3>
                      <div className="prose dark:prose-invert prose-sm max-w-none text-baaqoon-600 dark:text-baaqoon-300">
                        {renderJsonField(
                          selectedLesson.learningObjectives,
                          "لا توجد أهداف مسجلة.",
                        )}
                      </div>
                    </div>

                    <div className="bg-baaqoon-50/50 dark:bg-baaqoon-800/20 p-5 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800">
                      <h3 className="font-bold text-baaqoon-800 dark:text-baaqoon-200 mb-3 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-purple-500" /> توجيهات
                        الذكاء الاصطناعي للأستاذ
                      </h3>
                      <div className="prose dark:prose-invert prose-sm max-w-none text-baaqoon-600 dark:text-baaqoon-300">
                        {renderJsonField(
                          selectedLesson.teacherGuide,
                          "لا توجد توجيهات إضافية.",
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedLesson && selectedCohortId && (
        <RapidGeneratorModal
          isOpen={isGeneratorOpen}
          onClose={() => setIsGeneratorOpen(false)}
          cohortId={selectedCohortId}
          defaultLessonId={selectedLesson.id}
        />
      )}
      
      {selectedSubject && (
        <BulkScheduleModal
          isOpen={isBulkScheduleOpen}
          onClose={() => setIsBulkScheduleOpen(false)}
          cohortId={selectedCohortId}
          lessons={selectedSubject?.courses?.[0]?.versions?.[0]?.units?.flatMap((u: any) => u.lessons) || []}
        />
      )}
    </div>
  );
}
