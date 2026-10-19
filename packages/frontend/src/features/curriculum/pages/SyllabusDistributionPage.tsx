import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, BookOpen, AlertCircle, Loader2, Sparkles, Layers } from "lucide-react";
import { api } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";

const SUB_BRANCH_CODES = [
  "AZH-12-NAHW",
  "AZH-12-SARF",
  "AZH-12-BALAGHA",
  "AZH-12-ADAB",
  "AZH-12-MOTALAA",
  "AZH-12-QURAN",
  "AZH-12-HADITH",
  "AZH-12-TAWHEED",
  "AZH-12-TAFSEER",
  "AZH-12-FIQH-SHAFII",
  "AZH-12-MEERATH",
  "AZH-12-MATH-PURE",
  "AZH-12-MATH-APPLIED",
];

// Helper to render branch-divided month topics with elegant typography
function renderBranchTopics(topics: string) {
  if (!topics) return <p className="text-gray-400 italic">لا توجد موضوعات مسجلة لهذا الشهر.</p>;

  // Check if text has multiple branch dividers (e.g., 📌 or 📖 or 🔍 or 📜 or ⚖️ or 🕋 or 📐 or ⚙️)
  const branchRegex = /(?:^|\n\n)(?=📌|📖|🔍|📜|⚖️|🕋|📐|⚙️)/;
  const hasBranchMarkers = branchRegex.test(topics);

  if (!hasBranchMarkers) {
    return <div className="whitespace-pre-wrap leading-relaxed">{topics}</div>;
  }

  // Split into branch chunks
  const chunks = topics.split(/(?=\n(?:📌|📖|🔍|📜|⚖️|🕋|📐|⚙️))/).map(c => c.trim()).filter(Boolean);

  return (
    <div className="space-y-3.5">
      {chunks.map((chunk, idx) => {
        const firstLineEnd = chunk.indexOf("\n");
        let header = chunk;
        let body = "";

        if (firstLineEnd !== -1) {
          header = chunk.substring(0, firstLineEnd).trim();
          body = chunk.substring(firstLineEnd + 1).trim();
        } else if (chunk.includes(":")) {
          const colonIdx = chunk.indexOf(":");
          header = chunk.substring(0, colonIdx + 1).trim();
          body = chunk.substring(colonIdx + 1).trim();
        }

        return (
          <div 
            key={idx}
            className="p-3.5 rounded-xl bg-white/80 dark:bg-baaqoon-900/80 border border-gray-200/80 dark:border-baaqoon-700/80 shadow-xs space-y-1.5 transition-all hover:border-baaqoon-accent/40"
          >
            <div className="text-xs font-black text-baaqoon-900 dark:text-baaqoon-100 flex items-center gap-1.5">
              <span>{header}</span>
            </div>
            {body && (
              <div className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pl-1 pr-1 font-medium">
                {body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SyllabusDistributionPage() {
  const { user } = useAuthStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: distributions, isLoading } = useQuery({
    queryKey: ["syllabus-distributions"],
    queryFn: async () => {
      const res = await api.get("/syllabus");
      return res.data;
    },
  });

  // Separate primary (unified + core courses) from isolated sub-branches
  const primaryDistributions = (distributions || []).filter(
    (d: any) => !SUB_BRANCH_CODES.includes(d.course?.code)
  );

  const subBranchDistributions = (distributions || []).filter(
    (d: any) => SUB_BRANCH_CODES.includes(d.course?.code)
  );

  const userSupervisedDist = user?.supervisedSubjectId
    ? primaryDistributions?.find((d: any) => d.course?.subjectId === user.supervisedSubjectId) ||
      distributions?.find((d: any) => d.course?.subjectId === user.supervisedSubjectId)
    : null;

  const defaultCourseId = primaryDistributions?.[0]?.courseId || distributions?.[0]?.courseId;
  const activeCourseId = selectedCourseId || userSupervisedDist?.courseId || defaultCourseId;

  const selectedDist = distributions?.find((d: any) => d.courseId === activeCourseId) || distributions?.[0];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-baaqoon-accent" />
      </div>
    );
  }

  if (!distributions || distributions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-4">
        <AlertCircle className="w-12 h-12 text-gray-400" />
        <p className="text-lg">لا توجد خطط توزيع سنوية متاحة حالياً.</p>
      </div>
    );
  }

  const sem1 = selectedDist?.months.filter((m: any) => m.semester === 1) || [];
  const sem2 = selectedDist?.months.filter((m: any) => m.semester === 2) || [];

  const isArabic =
    selectedDist?.course?.title?.includes("اللغة العربية") ||
    selectedDist?.course?.code?.includes("ARABIC");

  const isIslamic =
    selectedDist?.course?.title?.includes("التربية الإسلامية") ||
    selectedDist?.course?.title?.includes("العلوم الشرعية") ||
    selectedDist?.course?.code?.includes("ISLAMIC");

  const isMath =
    selectedDist?.course?.title?.includes("الرياضيات") ||
    selectedDist?.course?.code?.includes("MATH");

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Header & Course Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white dark:bg-baaqoon-800 p-6 rounded-3xl border border-gray-100 dark:border-baaqoon-700 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-baaqoon-50 dark:bg-baaqoon-900/60 text-baaqoon-600 dark:text-baaqoon-400">
              <Calendar className="w-5 h-5 text-baaqoon-accent" />
            </span>
            <h1 className="text-2xl font-black text-baaqoon-900 dark:text-white">
              التوزيع السنوي والشهري للمنهج
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            توزيع الخطة الدراسية الشاملة المعتمدة للعام الدراسي {selectedDist?.academicYear}
          </p>
          
          {/* Approved Branch Tags for Arabic */}
          {isArabic && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs text-blue-700 dark:text-blue-300 font-black ml-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                فروع اللغة العربية الشاملة في هذه الخطة:
              </span>
              {["النحو", "الصرف", "البلاغة", "الأدب والنصوص وتاريخ الأدب", "المطالعة والإنشاء"].map(branch => (
                <span key={branch} className="px-2.5 py-0.5 rounded-lg text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 font-bold border border-blue-200 dark:border-blue-800">
                  {branch}
                </span>
              ))}
            </div>
          )}

          {/* Approved Branch Tags for Islamic Studies */}
          {isIslamic && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-black ml-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                فروع العلوم الشرعية الشاملة في هذه الخطة:
              </span>
              {["القرآن الكريم وتجويده", "التفسير", "الحديث الشريف وعلومه", "الفقه الشافعي", "الوجيز في الميراث", "التوحيد والعقيدة"].map(branch => (
                <span key={branch} className="px-2.5 py-0.5 rounded-lg text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 font-bold border border-emerald-200 dark:border-emerald-800">
                  {branch}
                </span>
              ))}
            </div>
          )}

          {/* Approved Branch Tags for Mathematics */}
          {isMath && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-xs text-cyan-700 dark:text-cyan-300 font-black ml-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                فروع الرياضيات الشاملة في هذه الخطة:
              </span>
              {["الرياضيات البحتة (تفاضل، تكامل، جبر، فراغية)", "الرياضيات التطبيقية (استاتيكا، ديناميكا)"].map(branch => (
                <span key={branch} className="px-2.5 py-0.5 rounded-lg text-[11px] bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-200 font-bold border border-cyan-200 dark:border-cyan-800">
                  {branch}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Dropdown Selector */}
        <div className="w-full sm:w-auto shrink-0">
          <label className="block text-xs font-black text-gray-600 dark:text-gray-300 mb-1.5">
            اختر المادة الدراسية:
          </label>
          <select 
            value={selectedDist?.courseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-auto min-w-[280px] px-4 py-2.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-baaqoon-accent focus:border-transparent dark:bg-baaqoon-900 dark:border-baaqoon-700 dark:text-white font-bold text-xs shadow-sm cursor-pointer"
          >
            <optgroup label="✨ المناهج الدراسية الشاملة المعتمدة (توجيهي حكومي وأزهري)">
              {primaryDistributions.map((d: any) => (
                <option key={d.id} value={d.courseId}>
                  {d.course.title} — ({d.course?.gradeLevel === 'grade_11' ? 'صف 11' : 'توجيهي'}) [{d.course?.curriculumType === 'azhari' ? 'أزهري' : 'حكومي'}]
                </option>
              ))}
            </optgroup>

            {subBranchDistributions.length > 0 && (
              <optgroup label="📚 فروع ومساقات مفردة (أزهري)">
                {subBranchDistributions.map((d: any) => (
                  <option key={d.id} value={d.courseId}>
                    {d.course.title} — [فرع أزهري مفرد]
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      {/* Monthly Distribution Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Semester 1 */}
        <div className="bg-white dark:bg-baaqoon-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-baaqoon-700 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-baaqoon-700">
            <h2 className="text-lg font-black text-baaqoon-900 dark:text-white border-b-2 border-baaqoon-accent pb-1 inline-block">
              الفصل الدراسي الأول (4 أشهر)
            </h2>
            <span className="text-xs px-3 py-1 bg-baaqoon-accent/10 text-baaqoon-accentDark dark:text-baaqoon-accent rounded-full font-black">
              سبتمبر - ديسمبر
            </span>
          </div>
          
          <div className="space-y-4">
            {sem1.map((month: any) => (
              <div 
                key={month.id} 
                className={`flex flex-col gap-3 p-4 rounded-2xl transition-all ${
                  month.isExamPeriod 
                    ? "bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" 
                    : "bg-gray-50 dark:bg-baaqoon-900/40 border border-gray-100 dark:border-baaqoon-700"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/50 dark:border-baaqoon-700/50">
                  <div className="flex items-center gap-2 font-black text-baaqoon-900 dark:text-baaqoon-100 text-sm">
                    <Calendar className="w-4 h-4 text-baaqoon-accent" />
                    <span>شهر {month.monthNameAr}</span>
                  </div>
                  {month.isExamPeriod && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                      فترة اختبارات ونهاية فصل
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {renderBranchTopics(month.topics)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semester 2 */}
        <div className="bg-white dark:bg-baaqoon-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-baaqoon-700 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-baaqoon-700">
            <h2 className="text-lg font-black text-baaqoon-900 dark:text-white border-b-2 border-emerald-500 pb-1 inline-block">
              الفصل الدراسي الثاني (4 أشهر)
            </h2>
            <span className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full font-black">
              فبراير - مايو
            </span>
          </div>
          
          <div className="space-y-4">
            {sem2.map((month: any) => (
              <div 
                key={month.id} 
                className={`flex flex-col gap-3 p-4 rounded-2xl transition-all ${
                  month.isExamPeriod 
                    ? "bg-amber-50/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" 
                    : "bg-gray-50 dark:bg-baaqoon-900/40 border border-gray-100 dark:border-baaqoon-700"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-gray-200/50 dark:border-baaqoon-700/50">
                  <div className="flex items-center gap-2 font-black text-emerald-700 dark:text-emerald-300 text-sm">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>شهر {month.monthNameAr}</span>
                  </div>
                  {month.isExamPeriod && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                      فترة اختبارات ونهاية العام
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {renderBranchTopics(month.topics)}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      
      {/* Calendar Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-800">
        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm">
            هيكلية التقويم والتوزيع الدراسي المعتمد
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
            وفق النظام المعتمد، يمتد كل فصل دراسي على مدار 4 أشهر دراسية (سبتمبر - ديسمبر للفصل الأول، وفبراير - مايو للفصل الثاني)، مع دمج كافة فروع اللغة والعلوم الشرعية تفصيلياً في خطة موحدة لكل شهر.
          </p>
        </div>
      </div>

    </div>
  );
}
