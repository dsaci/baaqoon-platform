import React, { useState } from "react";
import { X, Calendar as CalendarIcon, Clock, Loader2, Check } from "lucide-react";
import { api } from "../../../lib/axios";

interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohortId: string;
  lessons: any[];
}

const DAYS = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export default function BulkScheduleModal({
  isOpen,
  onClose,
  cohortId,
  lessons,
}: BulkScheduleModalProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("18:00");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const handleSchedule = async () => {
    if (selectedDays.length === 0 || !startTime || !startDate) {
      alert("الرجاء تحديد أيام الحصص ووقت البدء وتاريخ البداية");
      return;
    }

    if (!lessons || lessons.length === 0) {
      alert("لا يوجد دروس لجدولتها!");
      return;
    }

    setIsSubmitting(true);
    try {
      // Extract just the IDs in order
      const lessonIds = lessons.map(l => l.id);
      
      await api.post('/sessions/bulk-schedule', {
        cohortId,
        lessonIds,
        daysOfWeek: selectedDays,
        startTime,
        startDate
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء أتمتة الجدول");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-baaqoon-900 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden border border-baaqoon-100 dark:border-baaqoon-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-baaqoon-100 dark:border-baaqoon-800">
          <div className="flex items-center gap-3 text-baaqoon-900 dark:text-white">
            <div className="p-2 bg-baaqoon-100 dark:bg-baaqoon-800 rounded-lg text-baaqoon-accent">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">أتمتة الجدول الزمني (استعمال زمني)</h2>
              <p className="text-sm text-baaqoon-500">
                سيتم توزيع دروس المنهج تلقائياً على الأيام المحددة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-baaqoon-400 hover:text-baaqoon-600 dark:hover:text-baaqoon-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 text-green-600 dark:text-green-400">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check size={32} />
              </div>
              <h3 className="text-lg font-bold">تم بناء الجدول بنجاح!</h3>
              <p className="text-center text-baaqoon-600 dark:text-baaqoon-300 mt-2">
                تم اعتماد المواعيد وتثبيتها للطلبة وللمشرف.
              </p>
            </div>
          ) : (
            <>
              {/* Days Selection */}
              <div>
                <label className="block text-sm font-bold text-baaqoon-800 dark:text-baaqoon-200 mb-3">
                  أيام الحصص الأسبوعية المعتمدة
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          isSelected
                            ? "bg-baaqoon-accent text-white shadow-md shadow-baaqoon-accent/20"
                            : "bg-baaqoon-50 dark:bg-baaqoon-800 text-baaqoon-600 dark:text-baaqoon-300 hover:bg-baaqoon-100 dark:hover:bg-baaqoon-700"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-baaqoon-800 dark:text-baaqoon-200 mb-2">
                    تاريخ البدء
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-baaqoon-400 w-5 h-5" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-baaqoon-50 dark:bg-baaqoon-800 border-none rounded-xl py-3 pr-10 pl-4 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent"
                      dir="ltr"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-baaqoon-800 dark:text-baaqoon-200 mb-2">
                    وقت الحصة الموحد
                  </label>
                  <div className="relative">
                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 text-baaqoon-400 w-5 h-5" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-baaqoon-50 dark:bg-baaqoon-800 border-none rounded-xl py-3 pr-10 pl-4 text-baaqoon-900 dark:text-white focus:ring-2 focus:ring-baaqoon-accent"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                <p>
                  سيتم جدولة <strong>{lessons.length}</strong> درس بشكل تسلسلي على الأيام المختارة ({selectedDays.length} أيام في الأسبوع) بدءاً من {new Date(startDate).toLocaleDateString('ar-EG')}.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSchedule}
                  disabled={isSubmitting || selectedDays.length === 0}
                  className="flex-1 bg-baaqoon-accent hover:bg-baaqoon-accentDark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-baaqoon-accent/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CalendarIcon className="w-5 h-5" />
                      اعتماد وبناء الجدول الزمني
                    </>
                  )}
                </button>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 bg-baaqoon-100 hover:bg-baaqoon-200 dark:bg-baaqoon-800 dark:hover:bg-baaqoon-700 text-baaqoon-700 dark:text-baaqoon-200 font-bold rounded-xl transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
