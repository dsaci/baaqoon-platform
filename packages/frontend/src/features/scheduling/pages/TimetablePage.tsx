import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Info,
} from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { useNavigate } from 'react-router-dom';

// Mock data based on the user's Gaza context and cohort logic


const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "السبت"];
const TIMES = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"];

export default function TimetablePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacherOrSupervisor = user?.primaryRole === "teacher" || user?.primaryRole === "supervisor";

  const [selectedCohort, setSelectedCohort] = useState("all");

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['timetable_sessions'],
    queryFn: async () => {
      const endpoint = user?.primaryRole === 'student' ? '/sessions/student/me' : '/sessions';
      const res = await api.get(endpoint);
      return res.data;
    }
  });

  const getDayName = (dateString: string) => {
    const d = new Date(dateString);
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[d.getDay()];
  };

  const getHour = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getHours().toString().padStart(2, '0')}:00`;
  };

  // Build schedule
  const SCHEDULE = sessions.map((s: any) => ({
    id: s.id,
    day: getDayName(s.scheduledStartTime),
    time: getHour(s.scheduledStartTime),
    subject: s.title,
    teacher: s.teacher?.firstName || s.teacher?.name || 'مدرس',
    cohort: s.cohort?.name || 'فوج غير معروف',
    type: s.jitsiRoomName ? 'online' : 'point', // mockup logic
    cohortId: s.cohortId
  }));

  const filteredSchedule = selectedCohort === 'all' ? SCHEDULE : SCHEDULE.filter(s => s.cohortId === selectedCohort);

  // unique cohorts for select
  const uniqueCohorts = Array.from(new Set(sessions.filter((s:any) => s.cohort).map((s: any) => JSON.stringify({ id: s.cohort.id, name: s.cohort.name })))).map((str: any) => JSON.parse(str));

  return (
    <div
      className="min-h-screen bg-baaqoon-50 dark:bg-baaqoon-950 text-baaqoon-900 dark:text-white p-6 animate-fade-in"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white mb-2 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-baaqoon-accent" />
            الجدول الأسبوعي
          </h1>
          <p className="text-baaqoon-500 dark:text-baaqoon-400 max-w-2xl">
            هذا الجدول يعده الأستاذ والمشرف بناءً على الاتفاق مع الطلبة حول
            التوقيت والساعة. كل أستاذ يشرف على فوج واحد لضمان جودة المتابعة.
          </p>
        </div>

        {isTeacherOrSupervisor && (
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={() => navigate(user?.primaryRole === 'teacher' ? '/teacher/curriculum' : '/supervisor/dashboard')}
              className="px-5 py-2.5 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              بناء حصة جديدة (أتمتة)
            </button>
          </div>
        )}
      </div>

      {/* Gaza Context Banner */}
      <div className="bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-8 flex items-start gap-4">
        <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full shrink-0 mt-1">
          <MapPin className="w-5 h-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 dark:text-amber-300 mb-1">
            النقاط التعليمية (غزة)
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-400/90 leading-relaxed">
            تم إطلاق الدفعة الأولى والثانية من التفويج والتدريس. للطلبة في غزة
            الذين لا يحوزون على إنترنت أو هاتف، تم إقامة{" "}
            <strong>نقاط تعليمية</strong> مجهزة لمتابعة الحصص عن بعد بانتظام.
          </p>
        </div>
      </div>

      {/* Filters / Selectors */}
      <div className="glass-panel rounded-2xl p-4 mb-6 shadow-sm border border-baaqoon-100 dark:border-baaqoon-800 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="p-1.5 hover:bg-baaqoon-100 dark:hover:bg-baaqoon-800 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            <span className="font-bold text-sm min-w-[120px] text-center">
              الأسبوع الحالي
            </span>
            <button className="p-1.5 hover:bg-baaqoon-100 dark:hover:bg-baaqoon-800 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-baaqoon-700 dark:text-baaqoon-300">
            الفوج المستهدف:
          </label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="bg-baaqoon-50 dark:bg-baaqoon-950 border border-baaqoon-200 dark:border-baaqoon-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-baaqoon-accent/50 outline-none"
          >
            <option value="all">عرض كل الأفواج</option>
            {uniqueCohorts.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white dark:bg-baaqoon-900 rounded-2xl shadow-sm border border-baaqoon-200 dark:border-baaqoon-700 overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row (Days) */}
          <div className="grid grid-cols-6 border-b border-baaqoon-200 dark:border-baaqoon-700 bg-baaqoon-50 dark:bg-baaqoon-800/50">
            <div className="p-4 border-l border-baaqoon-200 dark:border-baaqoon-700 flex items-center justify-center text-baaqoon-500 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-4 text-center border-l last:border-l-0 border-baaqoon-200 dark:border-baaqoon-700 font-bold text-baaqoon-800 dark:text-baaqoon-200"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {TIMES.map((time, idx) => (
            <div
              key={time}
              className="grid grid-cols-6 border-b last:border-b-0 border-baaqoon-100 dark:border-baaqoon-800/50"
            >
              {/* Time Column */}
              <div className="p-4 border-l border-baaqoon-100 dark:border-baaqoon-800/50 flex flex-col items-center justify-center text-sm font-bold text-baaqoon-600 dark:text-baaqoon-400 bg-baaqoon-50/30 dark:bg-baaqoon-900/30">
                <span>{time}</span>
                {idx < TIMES.length - 1 && (
                  <span className="text-xs text-baaqoon-400 font-normal mt-1">
                    {TIMES[idx + 1]}
                  </span>
                )}
              </div>

              {/* Day Columns for this Time */}
              {DAYS.map((day) => {
                // Find sessions that start roughly at this time (mock logic)
                const sessionsAtSlot = filteredSchedule.filter(
                    (s) => s.day === day && s.time.startsWith(time)
                  );

                  return (
                    <div
                      key={`${day}-${time}`}
                      className="p-1.5 border-l last:border-l-0 border-baaqoon-100 dark:border-baaqoon-800/50 min-h-[85px] relative group hover:bg-baaqoon-50/50 dark:hover:bg-baaqoon-800/20 transition-colors flex flex-col gap-1.5"
                    >
                      {sessionsAtSlot.map((session, sidx) => {
                        const colors = [
                          { bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-200 dark:border-emerald-800/50", text: "text-emerald-900 dark:text-emerald-300", badge: "bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200" },
                          { bg: "bg-rose-50 dark:bg-rose-900/30", border: "border-rose-200 dark:border-rose-800/50", text: "text-rose-900 dark:text-rose-300", badge: "bg-rose-200/50 dark:bg-rose-800/50 text-rose-800 dark:text-rose-200" },
                          { bg: "bg-violet-50 dark:bg-violet-900/30", border: "border-violet-200 dark:border-violet-800/50", text: "text-violet-900 dark:text-violet-300", badge: "bg-violet-200/50 dark:bg-violet-800/50 text-violet-800 dark:text-violet-200" },
                          { bg: "bg-teal-50 dark:bg-teal-900/30", border: "border-teal-200 dark:border-teal-800/50", text: "text-teal-900 dark:text-teal-300", badge: "bg-teal-200/50 dark:bg-teal-800/50 text-teal-800 dark:text-teal-200" },
                          { bg: "bg-pink-50 dark:bg-pink-900/30", border: "border-pink-200 dark:border-pink-800/50", text: "text-pink-900 dark:text-pink-300", badge: "bg-pink-200/50 dark:bg-pink-800/50 text-pink-800 dark:text-pink-200" }
                        ];
                        const colorIndex = (session.subject.length + sidx) % colors.length;
                        const c = colors[colorIndex];
                        
                        return (
                          <div
                            key={sidx}
                            className={`w-full rounded-xl p-2.5 border shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md ${c.bg} ${c.border}`}
                          >
                            <div>
                              <h4 className={`font-bold text-[12px] leading-tight line-clamp-2 ${c.text}`}>
                                {session.subject}
                              </h4>
                              <p className={`text-[11px] mt-1 opacity-80 ${c.text}`}>
                                {session.teacher}
                              </p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-1">
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${c.badge}`}>
                                {session.cohort || "نقطة استشارية"}
                              </span>
                              <span className={`text-[10px] font-bold opacity-80 ${c.text}`}>
                                {session.time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
              })}

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
