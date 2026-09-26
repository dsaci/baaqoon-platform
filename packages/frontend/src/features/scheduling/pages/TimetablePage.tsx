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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl border border-white/60 dark:border-slate-700/50 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <CalendarIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">الجدول الأسبوعي</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl text-sm">
              هذا الجدول يعده الأستاذ والمشرف بناءً على الاتفاق مع الطلبة حول
              التوقيت والساعة. كل أستاذ يشرف على فوج واحد لضمان جودة المتابعة.
            </p>
          </div>
        </div>

        {isTeacherOrSupervisor && (
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => navigate(user?.primaryRole === 'teacher' ? '/teacher/curriculum' : '/supervisor/dashboard')}
              className="px-5 py-3 bg-gradient-to-l from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              بناء حصة جديدة (أتمتة)
            </button>
          </div>
        )}
      </div>

      {/* Gaza Context Banner */}
      <div className="bg-gradient-to-l from-amber-500 to-orange-500 rounded-2xl p-6 mb-8 flex items-start gap-4 shadow-lg shadow-amber-500/20 text-white">
        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shrink-0">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-black text-lg mb-1">
            النقاط التعليمية (غزة)
          </h3>
          <p className="text-amber-50 font-medium leading-relaxed">
            تم إطلاق الدفعة الأولى والثانية من التفويج والتدريس. للطلبة في غزة
            الذين لا يحوزون على إنترنت أو هاتف، تم إقامة{" "}
            <strong className="bg-white/20 px-2 rounded-md">نقاط تعليمية</strong> مجهزة لمتابعة الحصص عن بعد بانتظام.
          </p>
        </div>
      </div>

      {/* Filters / Selectors */}
      <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-2xl p-4 mb-6 shadow-sm border border-slate-200 dark:border-slate-700/50 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-500" />
            </button>
            <span className="font-bold text-sm min-w-[120px] text-center text-slate-700 dark:text-slate-300">
              الأسبوع الحالي
            </span>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-slate-600 dark:text-slate-400">
            الفوج المستهدف:
          </label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none shadow-sm"
          >
            <option value="all">عرض كل الأفواج</option>
            {uniqueCohorts.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="min-w-[800px]">
          {/* Header Row (Days) */}
          <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="p-4 border-l border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-4 text-center border-l last:border-l-0 border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Time Slots */}
          {TIMES.map((time, idx) => (
            <div
              key={time}
              className="grid grid-cols-6 border-b last:border-b-0 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
            >
              {/* Time Column */}
              <div className="p-4 border-l border-slate-100 dark:border-slate-800/50 flex flex-col items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                <span>{time}</span>
                {idx < TIMES.length - 1 && (
                  <span className="text-xs text-slate-400 font-medium mt-1">
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
                      className="p-1.5 border-l last:border-l-0 border-slate-100 dark:border-slate-800/50 min-h-[95px] relative group flex flex-col gap-1.5"
                    >
                      {sessionsAtSlot.map((session, sidx) => {
                        const colors = [
                          { bg: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30", border: "border-emerald-200 dark:border-emerald-800/50", text: "text-emerald-900 dark:text-emerald-300", badge: "bg-emerald-200/50 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200" },
                          { bg: "bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/30 dark:to-pink-900/30", border: "border-rose-200 dark:border-rose-800/50", text: "text-rose-900 dark:text-rose-300", badge: "bg-rose-200/50 dark:bg-rose-800/50 text-rose-800 dark:text-rose-200" },
                          { bg: "bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/30", border: "border-violet-200 dark:border-violet-800/50", text: "text-violet-900 dark:text-violet-300", badge: "bg-violet-200/50 dark:bg-violet-800/50 text-violet-800 dark:text-violet-200" },
                          { bg: "bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30", border: "border-cyan-200 dark:border-cyan-800/50", text: "text-cyan-900 dark:text-cyan-300", badge: "bg-cyan-200/50 dark:bg-cyan-800/50 text-cyan-800 dark:text-cyan-200" },
                          { bg: "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30", border: "border-amber-200 dark:border-amber-800/50", text: "text-amber-900 dark:text-amber-300", badge: "bg-amber-200/50 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200" }
                        ];
                        const colorIndex = (session.subject.length + sidx) % colors.length;
                        const c = colors[colorIndex];
                        
                        return (
                          <div
                            key={sidx}
                            className={`w-full rounded-xl p-2.5 border shadow-sm flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${c.bg} ${c.border}`}
                          >
                            <div>
                              <h4 className={`font-black text-[12px] leading-tight line-clamp-2 ${c.text}`}>
                                {session.subject}
                              </h4>
                              <p className={`text-[11px] font-medium mt-1 opacity-90 ${c.text}`}>
                                {session.teacher}
                              </p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-1">
                              <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${c.badge}`}>
                                {session.cohort || "نقطة استشارية"}
                              </span>
                              <span className={`text-[10px] font-bold opacity-90 ${c.text}`}>
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
