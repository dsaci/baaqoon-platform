import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Video,
  Play,
  CheckCircle2,
  Clock,
  BookOpen,
  User,
  Calendar,
  Search,
  Sparkles,
  ShieldCheck,
  FileText,
  Download,
  AlertTriangle,
  Layers,
  ArrowRight
} from "lucide-react";
import { api } from "../../../../lib/axios";
import { useAuthStore } from "../../../../store/useAuthStore";
import RecordedLessonPlayerModal from "./RecordedLessonPlayerModal";

interface StudentRecordedLessonsViewProps {
  initialLessonId?: string | null;
}

export default function StudentRecordedLessonsView({ initialLessonId }: StudentRecordedLessonsViewProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "unwatched" | "watched">("all");

  const [selectedLessonForPlayer, setSelectedLessonForPlayer] = useState<any>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Fetch recorded lessons for student
  const { data: recordedLessons = [], isLoading } = useQuery({
    queryKey: ["studentRecordedLessons"],
    queryFn: async () => {
      const res = await api.get("/curriculum/recorded-lessons");
      return res.data || [];
    }
  });

  // Auto-open initial lesson if provided via URL (e.g. notification click)
  React.useEffect(() => {
    if (initialLessonId && recordedLessons.length > 0) {
      const target = recordedLessons.find((l: any) => l.id === initialLessonId);
      if (target) {
        setSelectedLessonForPlayer(target);
        setIsPlayerOpen(true);
      }
    }
  }, [initialLessonId, recordedLessons]);

  // Extract unique subjects from student's available lessons
  const subjectList = useMemo(() => {
    const map = new Map<string, string>();
    recordedLessons.forEach((l: any) => {
      if (l.subject?.id && l.subject?.nameAr) {
        map.set(l.subject.id, l.subject.nameAr);
      }
    });
    return Array.from(map.entries()).map(([id, nameAr]) => ({ id, nameAr }));
  }, [recordedLessons]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return recordedLessons.filter((lesson: any) => {
      // Search
      const matchesSearch =
        !searchQuery.trim() ||
        lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.lesson?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.subject?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${lesson.creator?.firstName} ${lesson.creator?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

      // Subject Tab
      const matchesSubject =
        selectedSubjectTab === "all" || lesson.subjectId === selectedSubjectTab;

      // Status
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unwatched" && !lesson.isViewed) ||
        (statusFilter === "watched" && lesson.isViewed);

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [recordedLessons, searchQuery, selectedSubjectTab, statusFilter]);

  // Stats
  const unwatchedCount = useMemo(() => {
    return recordedLessons.filter((l: any) => !l.isViewed).length;
  }, [recordedLessons]);

  const watchedCount = recordedLessons.length - unwatchedCount;

  const handleLessonViewed = (lessonId: string) => {
    queryClient.setQueryData(["studentRecordedLessons"], (old: any[] = []) =>
      old.map((l) => (l.id === lessonId ? { ...l, isViewed: true, hasAcceptedPledge: true } : l))
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-emerald-800 to-cyan-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-cyan-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-emerald-100 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>لا يفوتك أي درس بعد اليوم! 🚀</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Video className="w-8 h-8 text-teal-200" />
              <span>الدروس المسجلة والمحتوى الإثرائي</span>
            </h1>
            <p className="text-emerald-100/90 text-sm md:text-base leading-relaxed">
              شاهد تسجيلات الحصص والمحتوى التعليمي التعويضي الذي فاتك لضمان استمرار تعلمك ومراجعة الدروس في أي وقت.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-black/20 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15">
            <div className="text-center px-2">
              <p className="text-xl font-black text-yellow-300">{unwatchedCount}</p>
              <p className="text-[11px] text-emerald-200 font-bold">جديد لم يُشاهد</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-2">
              <p className="text-xl font-black text-white">{watchedCount}</p>
              <p className="text-[11px] text-emerald-200 font-bold">تمت مشاهدته</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Privacy and Honor Pledge Notice ────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3.5 text-right">
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-amber-900 dark:text-amber-200">
            ميثاق الشرف التعليمي وأمانة المشاهدة (حماية خصوصية الأستاذات)
          </h4>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
            كافة الدروس والشروحات هي أمانة علمية مخصصة حصراً لطلبة المنصة. يمنع منعاً باتاً تصوير الشاشة أو نشر الروابط خارج المنصة احتراماً لخصوصية المعلمات والمعلمين. شاشة المشاهدة محمية وموسومة بعلامتك المائية الديناميكية المتضمنة اسمك ورقمك.
          </p>
        </div>
      </div>

      {/* ── Subject Filter Tabs & Status Switcher ─────────────────────────── */}
      <div className="space-y-3">
        {/* Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
              selectedSubjectTab === "all"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            }`}
          >
            كافة المواد ({recordedLessons.length})
          </button>
          {subjectList.map((sub) => {
            const count = recordedLessons.filter((l: any) => l.subjectId === sub.id).length;
            return (
              <button
                key={sub.id}
                onClick={() => setSelectedSubjectTab(sub.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedSubjectTab === sub.id
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                }`}
              >
                <span>{sub.nameAr}</span>
                <span className="text-[10px] opacity-75 font-bold">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بعنوان الدرس أو الأستاذ..."
              className="w-full pr-10 pl-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setStatusFilter("unwatched")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                statusFilter === "unwatched"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <span>جديد لم يُشاهد</span>
              {unwatchedCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
            <button
              onClick={() => setStatusFilter("watched")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === "watched"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              تمت مشاهدته ✓
            </button>
          </div>
        </div>
      </div>

      {/* ── Cards Grid ───────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-bold text-sm">جاري تحميل الدروس المسجلة...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mx-auto">
            <Video className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            لا توجد دروس مسجلة في هذا القسم حالياً
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            سيقوم أساتذة مادتك برفع تسجيلات الدروس والشروحات الإثرائية هنا تباعاً، وستصلك إشعارات فورية عند توفر أي درس جديد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson: any) => {
            const isUnwatched = !lesson.isViewed;

            return (
              <div
                key={lesson.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group shadow-sm hover:shadow-md ${
                  isUnwatched
                    ? "border-emerald-300/80 dark:border-emerald-700/80 ring-1 ring-emerald-500/20"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Card Header & Badges */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {/* Status Badge */}
                    {isUnwatched ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm flex items-center gap-1.5 animate-pulse">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        <span>درس جديد</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>تمت المشاهدة</span>
                      </span>
                    )}

                    {/* Scope Badge */}
                    {lesson.isGlobalSubject ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        متاح لكافة أفواج المادة
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {lesson.cohort?.name || "فوجك الدراسي"}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  {/* Curriculum Details */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{lesson.subject?.nameAr || "المادة"}</span>
                      {lesson.lesson?.title && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">
                          • {lesson.lesson.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                      <User className="w-3 h-3 shrink-0" />
                      <span>
                        الأستاذ(ة): {lesson.creator ? `${lesson.creator.firstName} ${lesson.creator.lastName}` : "معلم المادة"}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(lesson.createdAt).toLocaleDateString("ar-EG", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>

                    {/* Attachment preview if exists */}
                    {lesson.attachmentUrl && (
                      <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{lesson.attachmentName || "ورقة عمل مرفقة"}</span>
                        </div>
                        <a
                          href={lesson.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                        >
                          تحميل 📎
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedLessonForPlayer(lesson);
                      setIsPlayerOpen(true);
                    }}
                    className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      isUnwatched
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/20 hover:-translate-y-0.5"
                        : "bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{isUnwatched ? "مشاهدة الدرس الآن 🎥" : "إعادة المشاهدة والمراجعة 🔁"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Sandboxed Watermarked Player Modal ─────────────────────────────── */}
      {selectedLessonForPlayer && (
        <RecordedLessonPlayerModal
          lesson={selectedLessonForPlayer}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false);
            setSelectedLessonForPlayer(null);
          }}
          onViewRecorded={handleLessonViewed}
        />
      )}
    </div>
  );
}
