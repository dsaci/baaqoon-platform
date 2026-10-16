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
  ArrowRight,
  ExternalLink,
  GraduationCap
} from "lucide-react";
import { api } from "../../../../lib/axios";
import { useAuthStore } from "../../../../store/useAuthStore";
import RecordedLessonPlayerModal from "./RecordedLessonPlayerModal";

interface StudentRecordedLessonsViewProps {
  initialLessonId?: string | null;
}

/**
 * Helper to extract YouTube video ID
 */
function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
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
      {/* ── 1. Hero Banner (Earthy Olive & Khaki Brand) ────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#394C2A] via-[#2D3D21] to-[#1F2A18] p-6 md:p-8 text-white shadow-xl border border-[#4B6337]/50">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-[#BAAA80]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#E6EADB] text-xs font-bold">
              <Sparkles className="w-4 h-4 text-[#BAAA80]" />
              <span>لا يفوتك أي درس بعد اليوم! 🚀</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                <Video className="w-6 h-6 text-[#BAAA80]" />
              </div>
              <span>الدروس المسجلة والمحتوى الإثرائي</span>
            </h1>
            <p className="text-[#D8E0D2] text-sm md:text-base leading-relaxed">
              شاهد تسجيلات الحصص والمحتوى التعليمي التعويضي الذي فاتك لضمان استمرار تفوقك ومراجعة الدروس في أي وقت بكل أمان وموثوقية.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 self-start md:self-auto bg-black/25 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 shadow-inner">
            <div className="text-center px-1">
              <p className="text-2xl font-black text-[#BAAA80]">{unwatchedCount}</p>
              <p className="text-[11px] text-[#D8E0D2] font-bold">جديد لم يُشاهد</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center px-1">
              <p className="text-2xl font-black text-white">{watchedCount}</p>
              <p className="text-[11px] text-[#D8E0D2] font-bold">تمت مشاهدته</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Privacy & Honor Notice ────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#F8F5E9] dark:bg-[#232B1D]/70 border border-[#E2DDD3] dark:border-[#3E4D2C] flex items-start gap-3.5 text-right shadow-xs">
        <div className="w-9 h-9 rounded-xl bg-[#E8E1CF] dark:bg-[#344126] text-[#695F35] dark:text-[#BAAA80] flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-[#19232D] dark:text-white">
            ميثاق الشرف التعليمي وأمانة المشاهدة (حماية خصوصية الأستاذات والأساتذة)
          </h4>
          <p className="text-xs text-[#5D6B52] dark:text-zinc-300 leading-relaxed">
            كافة الدروس والشروحات أمانة علمية مخصصة حصراً لطلبة المنصة. يمنع تصوير الشاشة أو نشر الروابط خارج المنصة. شاشة المشاهدة محمية وموسومة بعلامتك المائية الديناميكية المتضمنة اسمك ورقم هاتفك لرصد أي تسريب.
          </p>
        </div>
      </div>

      {/* ── 3. Subject Tabs & Search Controls ─────────────────────────────────── */}
      <div className="space-y-3">
        {/* Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedSubjectTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
              selectedSubjectTab === "all"
                ? "bg-[#394C2A] text-white shadow-md shadow-[#394C2A]/20"
                : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-[#E5E0D5] dark:border-zinc-700 hover:bg-[#FAF7F2]"
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
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  selectedSubjectTab === sub.id
                    ? "bg-[#394C2A] text-white shadow-md shadow-[#394C2A]/20"
                    : "bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-[#E5E0D5] dark:border-zinc-700 hover:bg-[#FAF7F2]"
                }`}
              >
                <span>{sub.nameAr}</span>
                <span className="text-[10px] opacity-80 font-bold">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Status Filters */}
        <div className="bg-white dark:bg-zinc-800/90 rounded-2xl p-3 border border-[#E5E0D5] dark:border-zinc-700 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بعنوان الدرس أو الأستاذ..."
              className="w-full pr-10 pl-3 py-2 rounded-xl border border-[#E5E0D5] dark:border-zinc-700 bg-[#FAF7F2] dark:bg-zinc-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-[#394C2A]/40"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-[#F5F2EA] dark:bg-zinc-900 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("all")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white dark:bg-zinc-800 text-[#19232D] dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              الكل ({recordedLessons.length})
            </button>
            <button
              onClick={() => setStatusFilter("unwatched")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                statusFilter === "unwatched"
                  ? "bg-[#394C2A] text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              <span>جديد لم يُشاهد</span>
              {unwatchedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#BAAA80] text-[#19232D] text-[10px] font-black">
                  {unwatchedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter("watched")}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "watched"
                  ? "bg-white dark:bg-zinc-800 text-[#19232D] dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
              }`}
            >
              تمت المشاهدة ✓
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Professional Video Cards Grid ─────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white dark:bg-zinc-800/90 rounded-3xl p-14 border border-[#E5E0D5] dark:border-zinc-700 text-center">
          <div className="w-10 h-10 border-4 border-[#394C2A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-600 dark:text-zinc-400 font-bold text-sm">جاري تحميل الدروس المسجلة...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-zinc-800/90 rounded-3xl p-14 border border-dashed border-[#DFDACF] dark:border-zinc-700 text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F2EA] dark:bg-zinc-700 text-[#394C2A] dark:text-[#A8C794] flex items-center justify-center mx-auto shadow-xs">
            <Video className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#19232D] dark:text-white">
            لا توجد دروس مسجلة مطابقة لبحثك حالياً
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            سيقوم أساتذة مادتك برفع تسجيلات الدروس والشروحات الإثرائية هنا تباعاً، وستصلك إشعارات فورية عند توفر أي درس جديد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson: any) => {
            const isUnwatched = !lesson.isViewed;
            const ytId = getYouTubeId(lesson.mediaUrl);
            const thumbUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null;

            return (
              <div
                key={lesson.id}
                className={`bg-white dark:bg-zinc-800/90 rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-xs hover:shadow-xl hover:-translate-y-1 ${
                  isUnwatched
                    ? "border-[#BAAA80] dark:border-[#5D532E] ring-2 ring-[#BAAA80]/20"
                    : "border-[#E5E0D5] dark:border-zinc-700/80"
                }`}
              >
                <div>
                  {/* ── 16:9 HD Video Cover & Thumbnail ───────────────────────── */}
                  <div 
                    onClick={() => {
                      setSelectedLessonForPlayer(lesson);
                      setIsPlayerOpen(true);
                    }}
                    className="relative aspect-video w-full bg-[#1F2A18] overflow-hidden cursor-pointer"
                  >
                    {thumbUrl ? (
                      <img 
                        src={thumbUrl} 
                        alt={lesson.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#394C2A] to-[#1F2A18] flex flex-col items-center justify-center p-6 text-center text-white/90">
                        <GraduationCap className="w-12 h-12 text-[#BAAA80] mb-2 opacity-80" />
                        <span className="text-xs font-bold text-white/90 line-clamp-2">{lesson.title}</span>
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Top Badges Row */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10">
                      {/* Subject Badge */}
                      <span className="px-3 py-1 rounded-full text-[11px] font-black bg-black/60 backdrop-blur-md text-[#FAF7F2] border border-white/20 flex items-center gap-1.5 shadow-sm">
                        <BookOpen className="w-3 h-3 text-[#BAAA80]" />
                        <span>{lesson.subject?.nameAr || "المادة"}</span>
                      </span>

                      {/* Watch Status Badge */}
                      {isUnwatched ? (
                        <span className="px-3 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-[#BAAA80] to-[#8E8759] text-[#19232D] shadow-md flex items-center gap-1.5 animate-pulse">
                          <Sparkles className="w-3 h-3" />
                          <span>درس جديد</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/60 backdrop-blur-md text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>تمت المشاهدة</span>
                        </span>
                      )}
                    </div>

                    {/* Centered Play Button Icon */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shadow-2xl group-hover:scale-115 group-hover:bg-[#BAAA80] group-hover:text-[#19232D] transition-all duration-300">
                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                      </div>
                    </div>

                    {/* Bottom Metadata Overlay */}
                    <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[11px] text-white/90 font-bold z-10">
                      <span className="px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-[#BAAA80] flex items-center gap-1">
                        <span>HD 1080p</span>
                        <span>•</span>
                        <span>فيديو مسجل 🎥</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-white/80">
                        {lesson.isGlobalSubject ? "متاح للجميع" : (lesson.cohort?.name || "فوجك الدراسي")}
                      </span>
                    </div>
                  </div>

                  {/* ── Card Body & Details ─────────────────────────────────────── */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 
                        onClick={() => {
                          setSelectedLessonForPlayer(lesson);
                          setIsPlayerOpen(true);
                        }}
                        className="text-base font-black text-[#19232D] dark:text-white group-hover:text-[#394C2A] dark:group-hover:text-[#A8C794] transition-colors line-clamp-2 leading-snug cursor-pointer"
                      >
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-[#5D6B52] dark:text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                          {lesson.description}
                        </p>
                      )}
                    </div>

                    {/* Teacher & Metadata row */}
                    <div className="pt-3 border-t border-[#E5E0D5]/70 dark:border-zinc-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#F5F2EA] dark:bg-zinc-700 text-[#394C2A] dark:text-[#A8C794] font-bold text-xs flex items-center justify-center shrink-0 border border-[#E2DDD3]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate font-bold text-slate-800 dark:text-zinc-200">
                          {lesson.creator ? `${lesson.creator.firstName} ${lesson.creator.lastName}` : "معلم المادة"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-zinc-500 shrink-0">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(lesson.createdAt).toLocaleDateString("ar-EG", {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Attached Material (ورقة عمل / ملخص) */}
                    {lesson.attachmentUrl && (
                      <div className="p-2.5 rounded-2xl bg-[#FAF7F2] dark:bg-zinc-900/60 border border-[#E5E0D5] dark:border-zinc-700 flex items-center justify-between text-xs font-bold text-[#394C2A] dark:text-[#A8C794] mt-2 shadow-2xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 shrink-0 text-[#BAAA80]" />
                          <span className="truncate">{lesson.attachmentName || "ورقة عمل مرفقة"}</span>
                        </div>
                        <a
                          href={lesson.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-[#DFDACF] dark:border-zinc-700 text-[11px] text-[#19232D] dark:text-white hover:bg-[#F5F2EA] transition-colors shrink-0 flex items-center gap-1 shadow-2xs"
                        >
                          <Download className="w-3 h-3" />
                          <span>تحميل</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Card Footer Action ───────────────────────────────────────── */}
                <div className="p-4 bg-[#FAF7F2]/80 dark:bg-zinc-900/40 border-t border-[#E5E0D5] dark:border-zinc-700/60">
                  <button
                    onClick={() => {
                      setSelectedLessonForPlayer(lesson);
                      setIsPlayerOpen(true);
                    }}
                    className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isUnwatched
                        ? "bg-gradient-to-l from-[#BAAA80] to-[#394C2A] hover:opacity-95 text-white shadow-md shadow-[#394C2A]/20 hover:-translate-y-0.5 active:translate-y-0"
                        : "bg-white dark:bg-zinc-800 hover:bg-[#F5F2EA] dark:hover:bg-zinc-700 text-[#19232D] dark:text-zinc-200 border border-[#DFDACF] dark:border-zinc-700"
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

      {/* ── Sandboxed Watermarked Player Modal ─────────────────────────────────── */}
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
