import React, { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Download,
  FileText,
  Video,
  Eye,
  CheckCircle2,
  AlertTriangle,
  User,
  Calendar,
  BookOpen
} from "lucide-react";
import { useAuthStore } from "../../../../store/useAuthStore";
import { api } from "../../../../lib/axios";

interface RecordedLessonPlayerModalProps {
  lesson: any;
  isOpen: boolean;
  onClose: () => void;
  onViewRecorded?: (lessonId: string) => void;
}

export default function RecordedLessonPlayerModal({
  lesson,
  isOpen,
  onClose,
  onViewRecorded
}: RecordedLessonPlayerModalProps) {
  const { user } = useAuthStore();
  const isStudent = user?.primaryRole === "student";

  // If already viewed or staff member, pledge is already accepted
  const initialPledge = !isStudent || Boolean(lesson?.hasAcceptedPledge);
  const [hasPledged, setHasPledged] = useState(initialPledge);
  const [pledgeChecked, setPledgeChecked] = useState(false);
  const [isSubmittingPledge, setIsSubmittingPledge] = useState(false);

  // Watermark coordinates animated slowly
  const [watermarkPos, setWatermarkPos] = useState({ top: 20, left: 20 });

  useEffect(() => {
    if (lesson) {
      setHasPledged(!isStudent || Boolean(lesson.hasAcceptedPledge));
      setPledgeChecked(false);
    }
  }, [lesson, isStudent]);

  // Floating watermark position shifter (changes every 6 seconds)
  useEffect(() => {
    if (!isOpen || !hasPledged) return;
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 70) + 10; // 10% to 80%
      const left = Math.floor(Math.random() * 60) + 10; // 10% to 70%
      setWatermarkPos({ top, left });
    }, 6000);
    return () => clearInterval(interval);
  }, [isOpen, hasPledged]);

  if (!isOpen || !lesson) return null;

  const handleAcceptPledge = async () => {
    if (!pledgeChecked) return;
    setIsSubmittingPledge(true);
    try {
      await api.post(`/curriculum/recorded-lessons/${lesson.id}/view`, {
        pledgeAccepted: true
      });
      setHasPledged(true);
      if (onViewRecorded) {
        onViewRecorded(lesson.id);
      }
    } catch (err) {
      console.error("Failed to record pledge:", err);
      // Still unlock locally so student is not completely blocked
      setHasPledged(true);
    } finally {
      setIsSubmittingPledge(false);
    }
  };

  /**
   * Helper: Parse media URL into a safe, sandboxed embed URL
   */
  const getEmbedInfo = (url: string, type: string) => {
    if (!url) return { embedUrl: "", isIframe: false, isVideoTag: false, isPdf: false };

    const cleanUrl = url.trim();

    // 1. YouTube
    if (type === "youtube" || cleanUrl.includes("youtube.com") || cleanUrl.includes("youtu.be")) {
      let videoId = "";
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = cleanUrl.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
      }
      if (videoId) {
        return {
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3&controls=1&showinfo=0&disablekb=0`,
          isIframe: true,
          isVideoTag: false,
          isPdf: false
        };
      }
    }

    // 2. Google Drive
    if (type === "google_drive" || cleanUrl.includes("drive.google.com")) {
      const match = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      const fileId = match ? match[1] : cleanUrl.split("id=")[1]?.split("&")[0];
      if (fileId) {
        return {
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          isIframe: true,
          isVideoTag: false,
          isPdf: false
        };
      }
    }

    // 3. Loom
    if (type === "loom" || cleanUrl.includes("loom.com")) {
      const match = cleanUrl.match(/share\/([a-zA-Z0-9]+)/);
      const videoId = match ? match[1] : "";
      if (videoId) {
        return {
          embedUrl: `https://www.loom.com/embed/${videoId}`,
          isIframe: true,
          isVideoTag: false,
          isPdf: false
        };
      }
    }

    // 4. Vimeo
    if (type === "vimeo" || cleanUrl.includes("vimeo.com")) {
      const match = cleanUrl.match(/vimeo\.com\/([0-9]+)/);
      const videoId = match ? match[1] : "";
      if (videoId) {
        return {
          embedUrl: `https://player.vimeo.com/video/${videoId}`,
          isIframe: true,
          isVideoTag: false,
          isPdf: false
        };
      }
    }

    // 5. PDF File
    if (type === "pdf" || cleanUrl.toLowerCase().endsWith(".pdf")) {
      return {
        embedUrl: cleanUrl,
        isIframe: true,
        isVideoTag: false,
        isPdf: true
      };
    }

    // 6. Direct MP4/WebM Video
    if (
      cleanUrl.toLowerCase().endsWith(".mp4") ||
      cleanUrl.toLowerCase().endsWith(".webm") ||
      cleanUrl.toLowerCase().endsWith(".ogg")
    ) {
      return {
        embedUrl: cleanUrl,
        isIframe: false,
        isVideoTag: true,
        isPdf: false
      };
    }

    // Fallback: embed via iframe
    return {
      embedUrl: cleanUrl,
      isIframe: true,
      isVideoTag: false,
      isPdf: false
    };
  };

  const { embedUrl, isIframe, isVideoTag, isPdf } = getEmbedInfo(lesson.mediaUrl, lesson.mediaType);
  const studentIdentity = `${user?.firstName || ""} ${user?.lastName || ""} • ${user?.phone || user?.email || "طالب باقون"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {lesson.subject?.nameAr || "مادة دراسية"}
                </span>
                {lesson.cohort?.name ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {lesson.cohort.name}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                    جميع أفواج المادة
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                {lesson.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Mandatory Honor Pledge if not yet accepted */}
          {!hasPledged ? (
            <div className="p-6 sm:p-10 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-auto min-h-[460px]">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5 ring-8 ring-amber-500/5">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 mb-3">
                خطوة أمنية إلزامية قبل المشاهدة
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-3">
                ميثاق الشرف التعليمي وتعهد الأمانة والخصوصية
              </h3>

              <div className="p-4 sm:p-5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-right text-sm text-slate-700 dark:text-slate-300 space-y-3 mb-6 leading-relaxed">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  أخي الطالب / أختي الطالبة:
                </p>
                <p>
                  إن هذا الدرس المسجل أمانة علمية وخصوصية مقدسة خُصصت حصراً لطلبة منصة باقون في ظل ظروف الحرب والتعليم البديل. احتراماً لخصوصية الأستاذات والأساتذة الأفاضل وميثاق الأمانة الأخلاقي والشرعي، <span className="font-black text-rose-600 dark:text-rose-400">يُمنع منعاً باتاً تصوير أو تسجيل الشاشة أو نسخ أو إعادة نشر هذا الدرس أو مشاركته خارج المنصة بأي وسيلة كانت</span>.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300 font-bold">
                  <span>🛡️ حماية تقنية مشددة:</span>
                  <span>يقوم النظام بعرض علامتك المائية الشخصية (اسمك ورقم هاتفك) تلقائياً فوق شاشة العرض لرصد ومنع أي تصوير خارجي.</span>
                </div>
              </div>

              <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right w-full mb-6">
                <input
                  type="checkbox"
                  checked={pledgeChecked}
                  onChange={(e) => setPledgeChecked(e.target.checked)}
                  className="mt-1 w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-sm font-black text-slate-800 dark:text-slate-200 select-none">
                  أتعهد أمام الله وإدارة المنصة بالأمانة التامة، وألتزم بعدم تصوير أو نسخ أو نشر هذا الدرس أو تسريب أي جزء منه تقديراً لجهد أساتذتنا الكرام.
                </span>
              </label>

              <button
                onClick={handleAcceptPledge}
                disabled={!pledgeChecked || isSubmittingPledge}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                {isSubmittingPledge ? "جاري التحقق والاعتماد..." : "أوافق على التعهد والبدء بالمشاهدة 🎥"}
              </button>
            </div>
          ) : (
            /* STEP 2: The Sandboxed Player with Dynamic Watermark */
            <div className="flex flex-col">
              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden select-none">
                {/* 1. Sandboxed Iframe (YouTube / Google Drive / Loom / PDF) */}
                {isIframe && embedUrl && (
                  <iframe
                    src={embedUrl}
                    title={lesson.title}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                  />
                )}

                {/* 2. Direct Video tag */}
                {isVideoTag && embedUrl && (
                  <video
                    src={embedUrl}
                    controls
                    controlsList="nodownload"
                    disablePictureInPicture
                    className="w-full h-full object-contain"
                  >
                    متصفحك لا يدعم تشغيل هذا الفيديو مباشرة.
                  </video>
                )}

                {/* 3. Non-embeddable or fallback */}
                {!isIframe && !isVideoTag && (
                  <div className="p-8 text-center text-white space-y-4">
                    <BookOpen className="w-12 h-12 text-emerald-400 mx-auto" />
                    <p className="font-bold text-lg">محتوى إثرائي مسجل</p>
                    <a
                      href={lesson.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors"
                    >
                      فتح المحتوى بأمان
                    </a>
                  </div>
                )}

                {/* 4. DYNAMIC FLOATING WATERMARK OVERLAY (Anti-Leak Phone Recording Shield) */}
                {isStudent && (
                  <div 
                    className="absolute pointer-events-none select-none z-30 transition-all duration-1000 ease-in-out"
                    style={{
                      top: `${watermarkPos.top}%`,
                      left: `${watermarkPos.left}%`,
                      transform: "translate(-50%, -50%)"
                    }}
                  >
                    <div className="px-3.5 py-1.5 rounded-xl bg-black/40 backdrop-blur-xs border border-white/10 text-white/40 text-[11px] sm:text-xs font-black tracking-wider flex items-center gap-1.5 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-pulse" />
                      <span>{studentIdentity} • منصة باقون</span>
                    </div>
                  </div>
                )}

                {/* Secondary Static Corner Watermark */}
                {isStudent && (
                  <div className="absolute bottom-3 left-4 pointer-events-none select-none z-20 text-[10px] text-white/30 font-bold">
                    حساب الطالب: {user?.firstName} {user?.lastName} ({user?.phone || user?.email || ""})
                  </div>
                )}
              </div>

              {/* Lesson Metadata & Additional Attachment */}
              <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {lesson.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-emerald-500" />
                        الأستاذ(ة): {lesson.creator?.firstName} {lesson.creator?.lastName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                        {new Date(lesson.createdAt).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                      {lesson.lesson?.title && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                          الدرس المنهجي: {lesson.lesson.title}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Attachment button if available */}
                  {lesson.attachmentUrl && (
                    <a
                      href={lesson.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors self-start sm:self-auto"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>تحميل المرفق: {lesson.attachmentName || "كراسة الدرس"}</span>
                    </a>
                  )}
                </div>

                {lesson.description && (
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-xs text-slate-500 dark:text-slate-400 mb-1">
                      ملاحظات وتوجيهات الأستاذ(ة):
                    </p>
                    <p className="whitespace-pre-line">{lesson.description}</p>
                  </div>
                )}

                {/* Privacy Reminder Badge */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    مشاهدتك لهذا الدرس موثقة ومحمية بميثاق الشرف والأمانة التعليمية. نتمنى لك دوام التفوق والنجاح!
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
