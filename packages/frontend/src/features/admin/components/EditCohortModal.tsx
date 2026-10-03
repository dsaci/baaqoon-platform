import React, { useState, useEffect } from 'react';
import { api } from '../../../lib/axios';
import { X, Users, BookOpen, UserCheck, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function EditCohortModal({ 
  isOpen, 
  onClose, 
  cohort,
  adminData
}: { 
  isOpen: boolean; 
  onClose: () => void;
  cohort: any;
  adminData: any;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (cohort) {
      setName(cohort.name);
      setCode(cohort.code);
      setTeacherId(cohort.instructors?.[0]?.teacherId || '');
      setStudentIds(cohort.enrollments?.map((e: any) => e.studentId) || []);
    }
  }, [cohort]);

  if (!isOpen || !cohort) return null;

  const selectedCourse = adminData?.courses?.find((c: any) => c.id === cohort.courseId);
  const targetSubjectId = selectedCourse?.subjectId;
  const targetBranch = selectedCourse?.academicBranch;
  const targetCurriculum = selectedCourse?.curriculumType;
  
  const availableTeachers = adminData?.teachers?.filter((t: any) => !targetSubjectId || t.supervisedSubjectId === targetSubjectId) || [];
  const availableStudents = adminData?.students?.filter((s: any) => (!targetBranch || s.academicBranch === targetBranch) && (!targetCurriculum || s.curriculumType === targetCurriculum)) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.patch(`/groups/admin/cohorts/${cohort.id}`, {
        name,
        code,
        teacherId,
        studentIds
      });
      queryClient.invalidateQueries({ queryKey: ['adminData'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      onClose();
    } catch (err) {
      alert("حدث خطأ أثناء التحديث");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-violet-500" />
              تعديل بيانات الفوج
            </h2>
            <p className="text-sm text-slate-500 font-bold mt-1">{selectedCourse?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">اسم الفوج</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-violet-500 font-bold" />
            </div>
            <div>
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">كود الفوج</label>
              <input type="text" required value={code} onChange={e => setCode(e.target.value)} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-violet-500 font-bold font-mono text-left" dir="ltr" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-1.5">أستاذ المادة</label>
            <select value={teacherId} onChange={e => setTeacherId(e.target.value)} required className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold focus:border-violet-500 outline-none">
              <option value="">-- اختر المعلم --</option>
              {availableTeachers.map((t: any) => (
                <option key={t.id} value={t.id}>أ. {t.firstName} {t.lastName} ({t.email})</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-black text-slate-700 dark:text-slate-300">الطلبة المسندين للفوج</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStudentIds(availableStudents.map((s: any) => s.id))} className="text-xs text-violet-600 font-bold bg-violet-50 px-2 py-1 rounded">تحديد الكل</button>
                <button type="button" onClick={() => setStudentIds([])} className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">إلغاء التحديد</button>
              </div>
            </div>
            <div className="w-full max-h-48 overflow-y-auto px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
              {availableStudents.length === 0 ? (
                <span className="text-slate-400 text-sm">لا يوجد طلاب متوافقون</span>
              ) : (
                <div className="space-y-1">
                  {availableStudents.map((s: any) => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer w-full hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-lg border border-transparent">
                      <input type="checkbox" checked={studentIds.includes(s.id)} onChange={(e) => {
                        if (e.target.checked) setStudentIds(prev => [...prev, s.id]);
                        else setStudentIds(prev => prev.filter(id => id !== s.id));
                      }} className="w-4 h-4 text-violet-600 rounded border-slate-300" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.firstName} {s.lastName}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2 text-xs font-bold text-slate-500">محدد {studentIds.length} من {availableStudents.length}</div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-70 text-white font-black rounded-xl transition-all">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ التعديلات'}
          </button>
        </form>
      </div>
    </div>
  );
}
