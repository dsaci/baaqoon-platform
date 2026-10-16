import React, { useState, useEffect } from "react";
import {
  X,
  Video,
  Upload,
  BookOpen,
  Users,
  Layers,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Bell,
  Link as LinkIcon,
  Sparkles
} from "lucide-react";
import { api } from "../../../../lib/axios";

interface AddRecordedLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newLesson: any) => void;
  defaultSubjectId?: string;
  defaultCohortId?: string;
}

export default function AddRecordedLessonModal({
  isOpen,
  onClose,
  onSuccess,
  defaultSubjectId,
  defaultCohortId
}: AddRecordedLessonModalProps) {
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [formOptions, setFormOptions] = useState<{
    subjects: any[];
    cohorts: any[];
    curriculumTree: any[];
    recentSessions: any[];
  }>({
    subjects: [],
    cohorts: [],
    curriculumTree: [],
    recentSessions: []
  });

  // Form State
  const [scope, setScope] = useState<"cohort" | "all_cohorts">(defaultCohortId ? "cohort" : "all_cohorts");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(defaultSubjectId || "");
  const [selectedCohortId, setSelectedCohortId] = useState<string>(defaultCohortId || "");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [selectedLessonId, setSelectedLessonId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [mediaType, setMediaType] = useState<string>("youtube");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [notifyStudents, setNotifyStudents] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Form Options on open
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      setErrorMsg(null);
      try {
        const res = await api.get("/curriculum/recorded-lessons/form-options");
        setFormOptions(res.data);

        // Pre-select subject if available
        if (!selectedSubjectId && res.data.subjects?.length > 0) {
          const initialSub = defaultSubjectId || res.data.subjects[0].id;
          setSelectedSubjectId(initialSub);
        }
      } catch (err: any) {
        console.error("Error loading form options:", err);
        setErrorMsg("تعذر تحميل خيارات النماذج الأكاديمية");
      } finally {
        setIsLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [isOpen, defaultSubjectId]);

  // Filter cohorts for selected subject
  const availableCohorts = formOptions.cohorts.filter(
    (c) => !selectedSubjectId || c.subjectId === selectedSubjectId || !c.subjectId
  );

  // Filter units for selected subject
  const availableUnits = formOptions.curriculumTree.filter(
    (u) => !selectedSubjectId || u.subjectId === selectedSubjectId
  );

  // Filter lessons for selected unit
  const selectedUnit = availableUnits.find((u) => u.unitId === selectedUnitId);
  const availableLessons = selectedUnit?.lessons || [];

  // Auto-fill title when a lesson is picked
  const handleLessonChange = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    if (lessonId) {
      const foundLesson = availableLessons.find((l: any) => l.id === lessonId);
      if (foundLesson && (!title || title.trim() === "")) {
        setTitle(foundLesson.title);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("يرجى إدخال عنوان الدرس");
      return;
    }
    if (!selectedSubjectId) {
      setErrorMsg("يرجى تحديد المادة الدراسية");
      return;
    }
    if (!mediaUrl.trim()) {
      setErrorMsg("يرجى إدخال رابط المحتوى أو الفيديو");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        subjectId: selectedSubjectId,
        cohortId: scope === "all_cohorts" ? null : (selectedCohortId || null),
        lessonId: selectedLessonId || null,
        sessionId: selectedSessionId || null,
        mediaType,
        mediaUrl: mediaUrl.trim(),
        attachmentUrl: attachmentUrl.trim() || undefined,
        attachmentName: attachmentName.trim() || undefined,
        notifyStudents
      };

      const res = await api.post("/curriculum/recorded-lessons", payload);
      onSuccess(res.data.lesson);
      onClose();
    } catch (err: any) {
      console.error("Failed to create recorded lesson:", err);
      setErrorMsg(err.response?.data?.message || "حدث خطأ أثناء حفظ الدرس المسجل");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                إضافة درس مسجل ومحتوى إثرائي 🎥
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                وضع روابط تسجيلات الحصص والملخصات لتعويض الطلبة الغائبين وتوسيع الفائدة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-bold text-rose-800 dark:text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. نطاق النشر (Scope) */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
              1. نطاق نشر الدرس المسجل <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setScope("all_cohorts")}
                className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                  scope === "all_cohorts"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 dark:text-emerald-100"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <Sparkles className={`w-5 h-5 mt-0.5 flex-shrink-0 ${scope === "all_cohorts" ? "text-emerald-600" : "text-slate-400"}`} />
                <div>
                  <div className="font-black text-sm">جميع أفواج المادة الدراسية</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    يظهر لجميع طلبة المادة في كافة الشعب والأفواج لتعميم الفائدة
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope("cohort")}
                className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 ${
                  scope === "cohort"
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 dark:text-emerald-100"
                    : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                }`}
              >
                <Users className={`w-5 h-5 mt-0.5 flex-shrink-0 ${scope === "cohort" ? "text-emerald-600" : "text-slate-400"}`} />
                <div>
                  <div className="font-black text-sm">فوج دراسي محدد فقط</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
                    يظهر حصراً لطلبة الفوج المختار (مثل تسجيل خاص بشعبة معينة)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 2. المادة والفوج */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                2. المادة الدراسية <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedCohortId("");
                  setSelectedUnitId("");
                  setSelectedLessonId("");
                }}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none"
              >
                <option value="">-- اختر المادة --</option>
                {formOptions.subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nameAr}
                  </option>
                ))}
              </select>
            </div>

            {scope === "cohort" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                  الفوج الدراسي المستهدف <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCohortId}
                  onChange={(e) => setSelectedCohortId(e.target.value)}
                  required={scope === "cohort"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none"
                >
                  <option value="">-- اختر الفوج الدراسي --</option>
                  {availableCohorts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 3. الوحدة والدرس المنهجي (Cascading) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                الوحدة الدراسية (اختياري للربط المنهجي)
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => {
                  setSelectedUnitId(e.target.value);
                  setSelectedLessonId("");
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none"
              >
                <option value="">-- ربط بوحدة من المنهاج --</option>
                {availableUnits.map((u) => (
                  <option key={u.unitId} value={u.unitId}>
                    {u.unitTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                الدرس المنهجي المستهدف
              </label>
              <select
                value={selectedLessonId}
                onChange={(e) => handleLessonChange(e.target.value)}
                disabled={!selectedUnitId}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none disabled:opacity-50"
              >
                <option value="">-- اختر الدرس من المنهاج --</option>
                {availableLessons.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. عنوان الدرس */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
              عنوان الدرس المسجل والمحتوى <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="مثال: تسجيل شرح درس هاليدات الألكيل وحل التمارين"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none"
            />
          </div>

          {/* 5. مسار الوسائط ونوع الرابط */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                نوع مسار المحتوى <span className="text-rose-500">*</span>
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-emerald-500/30 outline-none"
              >
                <option value="youtube">فيديو يوتيوب (Unlisted) 🎥</option>
                <option value="google_drive">جوجل درايف (مشاهدة فقط) 📁</option>
                <option value="loom">فيديو لووم (Loom) 💻</option>
                <option value="vimeo">فيديو فيميو (Vimeo) 🎬</option>
                <option value="direct_url">رابط فيديو مباشر (MP4) 🌐</option>
                <option value="pdf">ملخص وبدياف خفيف (PDF) 📄</option>
                <option value="word">ورقة عمل ووورد (DOCX) 📝</option>
                <option value="image">صور وشروحات سبورة 🖼️</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-black text-slate-700 dark:text-slate-300">
                رابط المحتوى أو الفيديو <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                placeholder={
                  mediaType === "youtube"
                    ? "https://youtu.be/... أو https://www.youtube.com/watch?v=..."
                    : mediaType === "google_drive"
                    ? "https://drive.google.com/file/d/.../view"
                    : "https://..."
                }
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono dir-ltr text-left focus:ring-2 focus:ring-emerald-500/30 outline-none"
              />
            </div>
          </div>

          {/* Privacy Tip Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-200">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-black">حماية خصوصية الأستاذات والروابط:</span> ستقوم المنصة تلقائياً بحجب الرابط الصريح عن الطلبة، وإلزام الطالب بميثاق الشرف الأمني، وطباعة علامة مائية ديناميكية باسمه ورقم هاتفه فوق شاشة العرض لردع أي تسريب.
            </div>
          </div>

          {/* 6. مرفق إضافي اختياري (كراسة أو ملخص PDF/Word) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                رابط كراسة / ورقة عمل مصاحبة (اختياري)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... أو رابط PDF"
                value={attachmentUrl}
                onChange={(e) => setAttachmentUrl(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono dir-ltr text-left outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                اسم المرفق الظاهر للطلبة
              </label>
              <input
                type="text"
                placeholder="مثال: ورقة عمل درس هاليدات الألكيل"
                value={attachmentName}
                onChange={(e) => setAttachmentName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none"
              />
            </div>
          </div>

          {/* 7. ربط اختياري بحصة سابقة مجدولة */}
          {formOptions.recentSessions.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                ربط بحصة فائتة مجدولة (تعويض للغائبين)
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none"
              >
                <option value="">-- بدون ربط بحصة سابقة --</option>
                {formOptions.recentSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({new Date(s.scheduledStartTime).toLocaleDateString("ar-EG")})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 8. توجيهات وملاحظات الأستاذ للطلبة */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              توجيهات وملاحظات للطلبة (تظهر أسفل الفيديو)
            </label>
            <textarea
              rows={2}
              placeholder="مثال: يرجى التركيز على حل المسألة رقم 4 في الدقيقة 12:30، وتسليم الواجب قبل يوم الخميس..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium outline-none resize-none leading-relaxed"
            />
          </div>

          {/* 9. إشعار الطلبة آلياً */}
          <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-xs font-black text-indigo-950 dark:text-indigo-200">
                  إشعار فوري لجميع الطلبة آلياً
                </p>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  إرسال تنبيه مباشر إلى جرس إشعارات جميع الطلبة المعنيين لمشاهدة التسجيل فور نشره
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifyStudents}
                onChange={(e) => setNotifyStudents(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isSubmitting ? "جاري النشر والإشعار..." : "اعتماد ونشر الدرس المسجل 🎥"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
