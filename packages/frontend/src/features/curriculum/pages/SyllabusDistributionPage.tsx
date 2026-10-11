import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { api } from "../../../lib/axios";
import { useAuthStore } from "../../../store/useAuthStore";

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

  const selectedDist = distributions?.find((d: any) => 
    selectedCourseId ? d.courseId === selectedCourseId : true
  ) || distributions?.[0];

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-baaqoon-accent" />
            التوزيع السنوي والشهري للمنهج
          </h1>
          <p className="text-gray-500 mt-1">توزيع الخطة الدراسية للعام {selectedDist?.academicYear}</p>
        </div>
        
        <div className="w-full sm:w-auto">
          <select 
            value={selectedDist?.courseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-baaqoon-accent focus:border-transparent dark:bg-baaqoon-800 dark:border-baaqoon-700 dark:text-white font-medium shadow-sm"
          >
            {distributions.map((d: any) => (
              <option key={d.id} value={d.courseId}>
                {d.course.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Semester 1 */}
        <div className="bg-white dark:bg-baaqoon-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-baaqoon-700">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100 dark:border-baaqoon-700">
            <h2 className="text-xl font-bold text-baaqoon-800 dark:text-white border-b-2 border-baaqoon-accent pb-1 inline-block">
              الفصل الدراسي الأول (4 أشهر)
            </h2>
            <span className="text-xs px-2.5 py-1 bg-baaqoon-accent/10 text-baaqoon-accentDark dark:text-baaqoon-accent rounded-full font-bold">
              سبتمبر - ديسمبر
            </span>
          </div>
          
          <div className="space-y-4">
            {sem1.map((month: any) => (
              <div 
                key={month.id} 
                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg transition-colors ${
                  month.isExamPeriod 
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" 
                    : "bg-gray-50 dark:bg-baaqoon-900/50 border border-gray-100 dark:border-baaqoon-700"
                }`}
              >
                <div className="sm:w-28 flex-shrink-0 flex items-center gap-2 font-bold text-baaqoon-accentDark dark:text-baaqoon-300 text-sm">
                  <Calendar className="w-4 h-4 opacity-75" />
                  {month.monthNameAr}
                </div>
                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {month.topics}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semester 2 */}
        <div className="bg-white dark:bg-baaqoon-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-baaqoon-700">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100 dark:border-baaqoon-700">
            <h2 className="text-xl font-bold text-baaqoon-800 dark:text-white border-b-2 border-emerald-500 pb-1 inline-block">
              الفصل الدراسي الثاني (4 أشهر)
            </h2>
            <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-full font-bold">
              فبراير - مايو
            </span>
          </div>
          
          <div className="space-y-4">
            {sem2.map((month: any) => (
              <div 
                key={month.id} 
                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg transition-colors ${
                  month.isExamPeriod 
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800" 
                    : "bg-gray-50 dark:bg-baaqoon-900/50 border border-gray-100 dark:border-baaqoon-700"
                }`}
              >
                <div className="sm:w-28 flex-shrink-0 flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  <Calendar className="w-4 h-4 opacity-75" />
                  {month.monthNameAr}
                </div>
                <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {month.topics}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-800 mt-6">
        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">هيكلية التقويم الدراسي الفلسطيني</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
            وفق النظام المعتمد، يمتد كل فصل دراسي على مدار 4 أشهر دراسية، تتوسطهما استراحة بين الفصلين في شهر يناير، وتعقب الفصل الثاني عطلة صيفية مدتها 3 أشهر (يونيو، يوليو، أغسطس).
          </p>
        </div>
      </div>
    </div>
  );
}
