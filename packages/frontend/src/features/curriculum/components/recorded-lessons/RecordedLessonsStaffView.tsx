import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Video,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  ExternalLink,
  BookOpen,
  Users,
  ShieldCheck,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  Play,
  CheckCircle2,
  FileUp,
  Download
} from "lucide-react";
import { api } from "../../../../lib/axios";
import { useAuthStore } from "../../../../store/useAuthStore";
import AddRecordedLessonModal from "./AddRecordedLessonModal";
import RecordedLessonPlayerModal from "./RecordedLessonPlayerModal";

export default function RecordedLessonsStaffView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLessonForPlayer, setSelectedLessonForPlayer] = useState<any>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [selectedMediaTypeFilter, setSelectedMediaTypeFilter] = useState<string>("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Fetch recorded lessons
  const { data: recordedLessons = [], isLoading, error } = useQuery({
    queryKey: ["recordedLessons", selectedSubjectFilter],
    queryFn: async () => {
      const url = selectedSubjectFilter && selectedSubjectFilter !== "all"
        ? `/curriculum/recorded-lessons?subjectId=${selectedSubjectFilter}`
        : "/curriculum/recorded-lessons";
      const res = await api.get(url);
      return res.data || [];
    }
  });

  // Fetch options for filter subjects
  const { data: formOptions } = useQuery({
    queryKey: ["recordedLessonsFormOptions"],
    queryFn: async () => {
      const res = await api.get("/curriculum/recorded-lessons/form-options");
      return res.data;
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/curriculum/recorded-lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordedLessons"] });
      setDeleteConfirmId(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || "حدث خطأ أثناء حذف الدرس المسجل");
    }
  });

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return recordedLessons.filter((lesson: any) => {
      const matchesSearch =
        !searchQuery.trim() ||
        lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.lesson?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.subject?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${lesson.creator?.firstName} ${lesson.creator?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesMedia =
        selectedMediaTypeFilter === "all" || lesson.mediaType === selectedMediaTypeFilter;

      return matchesSearch && matchesMedia;
    });
  }, [recordedLessons, searchQuery, selectedMediaTypeFilter]);

  // Overall Stats
  const totalViews = useMemo(() => {
    return recordedLessons.reduce((acc: number, l: any) => acc + (l.viewsCount || 0), 0);
  }, [recordedLessons]);

  const getMediaBadge = (type: string) => {
    switch (type) {
      case "youtube":
        return { label: "يوتيوب (YouTube)", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800" };
      case "drive":
        return { label: "جوجل درايف (Drive)", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" };
      case "video":
        return { label: "فيديو مباشر (MP4)", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" };
      case "pdf":
        return { label: "ملف PDF / شروحات", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800" };
      case "worksheet":
        return { label: "ورقة عمل / تمارين", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800" };
      case "image":
        return { label: "صور السبورة والتلخيص", color: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800" };
      default:
        return { label: "رابط وسائط", color: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" };
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>نظام الدروس التعويضية والإثرائية المحمية 🛡️</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Video className="w-8 h-8 text-indigo-400" />
              <span>الدروس المسجلة والمحتوى الإثرائي</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              منصة نشر الشروحات والتسجيلات المرئية لتعويض الطلبة المتغيبين ومساعدتهم على استدراك ما فاتهم، مع الحماية الكاملة لخصوصية الأستاذات وميثاق شرف إلكتروني ملزم.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="self-start md:self-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm md:text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex items-center gap-2.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>+ إضافة درس مسجل جديد 🎥</span>
          </button>
        </div>
      </div>

      {/* ── Stats Summary Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {recordedLessons.length}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي الدروس المسجلة
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {totalViews}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              إجمالي مشاهدات الطلبة
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {recordedLessons.filter((l: any) => l.isGlobalSubject).length}
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              دروس عامة لكافة الأفواج
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              100%
            </p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              محمي بعلامة مائية وتعهد
            </p>
          </div>
        </div>
      </div>

      {/* ── Search & Filters Bar ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالعنوان، المادة، اسم الأستاذ، أو موضوع الدرس..."
            className="w-full pr-11 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Subject Filter */}
        {formOptions?.subjects && formOptions.subjects.length > 1 && (
          <div className="w-full md:w-56">
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">كافة المواد الدراسية</option>
              {formOptions.subjects.map((sub: any) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nameAr}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Media Type Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedMediaTypeFilter}
            onChange={(e) => setSelectedMediaTypeFilter(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">جميع أنواع الوسائط</option>
            <option value="youtube">يوتيوب (YouTube)</option>
            <option value="drive">جوجل درايف (Drive)</option>
            <option value="video">فيديو مباشر (MP4)</option>
            <option value="pdf">ملف PDF / شروحات</option>
            <option value="worksheet">ورقة عمل / تمارين</option>
            <option value="image">صور السبورة</option>
          </select>
        </div>
      </div>

      {/* ── Content Grid / List ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-bold">جاري تحميل الدروس المسجلة...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center mx-auto">
            <Video className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {searchQuery ? "لم يتم العثور على نتائج مطابقة للبحث" : "لا توجد دروس مسجلة منشورة حتى الآن"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {searchQuery
                ? "جرّب تغيير كلمات البحث أو إعادة ضبط خيارات التصفية."
                : "يمكنك البدء برفع أول درس مسجل لتمكين طلبتك من تعويض الحصص الفائتة ومراجعة المفاهيم في أي وقت."}
            </p>
          </div>
          {!searchQuery && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة أول درس مسجل الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((lesson: any) => {
            const badge = getMediaBadge(lesson.mediaType);
            const canDelete =
              user?.primaryRole === "super_admin" ||
              user?.primaryRole === "admin" ||
              lesson.createdById === user?.id ||
              user?.primaryRole === "subject_supervisor";

            return (
              <div
                key={lesson.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Header & Badges */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${badge.color}`}>
                      {badge.label}
                    </span>

                    {lesson.isGlobalSubject ? (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        لكافة أفواج المادة
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {lesson.cohort?.name || "فوج محدد"}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {lesson.title}
                    </h3>
                    {lesson.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  {/* Subject & Lesson tags */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-bold">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>{lesson.subject?.nameAr || "المادة"}</span>
                      {lesson.lesson?.title && (
                        <span className="text-slate-400 dark:text-slate-500 font-normal">
                          • {lesson.lesson.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>
                        نُشر بواسطة: {lesson.creator ? `${lesson.creator.firstName} ${lesson.creator.lastName}` : "أستاذ باقون"}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(lesson.createdAt).toLocaleDateString("ar-EG", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>

                    {lesson.attachmentUrl && (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>مرفق: {lesson.attachmentName || "ورقة عمل / ملخص"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls & Analytics */}
                <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                    <Eye className="w-4 h-4 text-emerald-500" />
                    <span>{lesson.viewsCount || 0} مشاهدة للطلبة</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedLessonForPlayer(lesson);
                        setIsPlayerOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>معاينة وتشغيل</span>
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => setDeleteConfirmId(lesson.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="حذف الدرس المسجل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Modal ─────────────────────────────────────────────────────── */}
      <AddRecordedLessonModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["recordedLessons"] });
        }}
      />

      {/* ── Player Modal ──────────────────────────────────────────────────── */}
      {selectedLessonForPlayer && (
        <RecordedLessonPlayerModal
          lesson={selectedLessonForPlayer}
          isOpen={isPlayerOpen}
          onClose={() => {
            setIsPlayerOpen(false);
            setSelectedLessonForPlayer(null);
          }}
        />
      )}

      {/* ── Delete Confirmation Dialog ────────────────────────────────────── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                تأكيد حذف الدرس المسجل
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                هل أنت متأكد من رغبتك في حذف هذا التسجيل؟ لن يتمكن الطلبة من مشاهدته بعد الآن.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteConfirmId)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? "جاري الحذف..." : "تأكيد الحذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
