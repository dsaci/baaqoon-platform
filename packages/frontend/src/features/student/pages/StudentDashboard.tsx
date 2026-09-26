import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Video,
  FileText,
  AlertCircle,
  BookOpen,
  Calendar,
  CheckSquare,
  Award,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const studentName = user
    ? `${user.firstName} ${user.lastName}`
    : "طالب باقون";

  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ["studentSessions"],
    queryFn: async () => {
      const res = await api.get("/sessions/student/me");
      return res.data;
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["studentAssessments"],
    queryFn: async () => {
      const res = await api.get("/assessments/student/me");
      return res.data;
    },
  });

  return (
    <div
      dir="rtl"
      className="p-6 max-w-7xl mx-auto space-y-8 bg-baaqoon-50 dark:bg-baaqoon-950 min-h-screen"
    >
      {/* Welcome Header */}
      <div className="flex justify-between items-center bg-white dark:bg-baaqoon-900 p-8 rounded-2xl shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
        <div>
          <h1 className="text-3xl font-bold text-baaqoon-900 dark:text-white mb-2">
            مرحباً {studentName} 👋
          </h1>
          <p className="text-baaqoon-600 dark:text-baaqoon-300">
            أهلاً بك في منصة باقون، دليلك نحو التفوق في الثانوية العامة! استمر
            في التقدم.
          </p>
        </div>
        <div className="hidden md:block">
          <div className="w-24 h-24 bg-baaqoon-100 dark:bg-baaqoon-800 rounded-full flex items-center justify-center text-baaqoon-600 dark:text-baaqoon-400">
            <Award size={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area (Sessions) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-panel p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-baaqoon-900 dark:text-white flex items-center gap-2">
                <Calendar className="text-baaqoon-accent" />
                جدول حصصي
              </h2>
            </div>

            <div className="space-y-6">
              {upcomingSessions.map((session: any, idx: number) => {
                const isNow = idx === 0;
                return (
                  <div key={session.id} className="flex gap-4 relative">
                    <div className="w-px h-full bg-baaqoon-200 dark:bg-baaqoon-700 absolute right-[19px] top-10"></div>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white dark:ring-baaqoon-900 ${isNow ? "bg-red-100 text-red-500" : "bg-baaqoon-100 text-baaqoon-accent"}`}
                    >
                      <Video size={18} />
                    </div>
                    <div className="bg-white dark:bg-baaqoon-800/20 rounded-xl p-4 flex-1 border border-baaqoon-100 dark:border-baaqoon-700">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          {isNow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold mb-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400 animate-pulse"></span>
                              مباشر الآن
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-baaqoon-100 dark:bg-baaqoon-800 text-baaqoon-accentDark dark:text-baaqoon-accent text-xs font-semibold mb-2">
                              قادمة
                            </span>
                          )}
                          <h3 className="text-lg font-bold text-baaqoon-900 dark:text-white">
                            {session.title}
                          </h3>
                        </div>
                        <div className="flex items-center text-baaqoon-500 dark:text-baaqoon-400 text-sm gap-1">
                          <Clock size={14} />
                          <span>
                            {new Date(
                              session.scheduledStartTime,
                            ).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/sessions/${session.id}/room`)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto ${isNow ? "bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white" : "bg-baaqoon-100 text-baaqoon-500"}`}
                      >
                        {isNow ? "انضم الآن" : "انضم الآن (يفتح في موعده)"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {upcomingSessions.length === 0 && (
                <div className="text-center p-8 text-baaqoon-500">
                  لا توجد حصص قادمة لفوجك!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar (Tasks & Assessments) */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-baaqoon-900 p-6 rounded-2xl shadow-sm border border-baaqoon-100 dark:border-baaqoon-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-baaqoon-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="text-baaqoon-accent" />
                المهام والواجبات
              </h2>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment: any) => {
                const isCompleted = assignment.submissions?.length > 0;
                return (
                  <div
                    key={assignment.id}
                    className="p-4 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800 bg-baaqoon-50 dark:bg-baaqoon-950 flex flex-col gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${isCompleted ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}
                      >
                        {isCompleted ? (
                          <CheckSquare size={20} />
                        ) : (
                          <FileText size={20} />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-baaqoon-900 dark:text-white text-sm leading-tight mb-1">
                          {assignment.title}
                        </h3>
                        <div className="flex items-center text-xs text-baaqoon-500 dark:text-baaqoon-400 gap-2">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            موعد التسليم:{" "}
                            {new Date(
                              assignment.dueDate || new Date(),
                            ).toLocaleDateString("ar-EG")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => !isCompleted && navigate(`/student/assessments/${assignment.id}/take`)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${isCompleted ? "bg-baaqoon-100 text-baaqoon-600 cursor-default" : "bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white"}`}
                    >
                      {isCompleted ? "تم التسليم" : "ابدأ الحل"}
                    </button>
                  </div>
                );
              })}
              {assignments.length === 0 && (
                <div className="text-center p-8 text-baaqoon-500">
                  لا توجد واجبات مطلوبة منك حالياً! استمتع بوقتك!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
