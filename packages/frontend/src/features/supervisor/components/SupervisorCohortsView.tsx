import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/axios';
import { Users, UserPlus, BookOpen, Search, Filter, Loader2, CheckCircle, GraduationCap } from 'lucide-react';

export default function SupervisorCohortsView() {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    teacherId: '',
    curriculumType: '',
    academicBranch: ''
  });
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Fetch delegated courses
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['supervisor_delegated_courses'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/delegated/courses');
      return res.data;
    }
  });

  // Fetch delegated teachers
  const { data: teachers = [] } = useQuery({
    queryKey: ['supervisor_delegated_teachers'],
    queryFn: async () => {
      const res = await api.get('/groups/supervisor/delegated/teachers');
      return res.data;
    }
  });

  // Fetch eligible students based on filters
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['supervisor_delegated_students', formData.academicBranch, formData.curriculumType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (formData.academicBranch) params.append('branch', formData.academicBranch);
      if (formData.curriculumType) params.append('curriculum', formData.curriculumType);
      
      const res = await api.get(`/groups/supervisor/delegated/students?${params.toString()}`);
      return res.data;
    }
  });

  const createCohortMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/groups/supervisor/delegated/cohorts', {
        name: formData.name,
        courseId: formData.courseId,
        teacherId: formData.teacherId,
        studentIds: selectedStudents
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_cohorts_list'] });
      setIsCreateModalOpen(false);
      setStep(1);
      setFormData({ name: '', courseId: '', teacherId: '', curriculumType: '', academicBranch: '' });
      setSelectedStudents([]);
      alert('تم إنشاء الفوج بنجاح وإسناد الأستاذ والطلبة!');
    }
  });

  const handleSelectStudent = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s: any) => s.id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            إدارة الأفواج والإسناد
          </h2>
          <p className="text-slate-500 text-sm mt-1">قم بتكوين أفواج للطلبة وإسنادها لأساتذة مادتك</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
        >
          <UserPlus className="w-5 h-5" />
          تكوين فوج جديد
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">نظام التفويج الذكي</h3>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          هذه المساحة مخصصة لك كمشرف لإنشاء أفواج دراسية لأساتذة المادة التي تشرف عليها، وتوزيع الطلبة عليهم بناءً على الفرع الأكاديمي والمنهج.
        </p>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-2xl font-black dark:text-white flex items-center gap-3">
                تكوين فوج جديد - الخطوة {step} من 3
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                إغلاق
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              
              {/* STEP 1: Details */}
              {step === 1 && (
                <div className="space-y-6 max-w-xl mx-auto animate-fade-in">
                  <div className="text-center mb-8">
                    <BookOpen className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">تفاصيل الفوج والمادة</h3>
                    <p className="text-slate-500 text-sm mt-1">اختر المادة والفرع الذي تريد التفويج له</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اختر المادة (المساق)</label>
                    {isLoadingCourses ? (
                      <div className="p-4 text-center text-slate-500">جاري التحميل...</div>
                    ) : (
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none"
                        value={formData.courseId}
                        onChange={(e) => {
                          const course = courses.find((c: any) => c.id === e.target.value);
                          setFormData({
                            ...formData, 
                            courseId: e.target.value,
                            academicBranch: course?.academicBranch || '',
                            curriculumType: course?.curriculumType || ''
                          });
                        }}
                      >
                        <option value="">-- اختر المساق --</option>
                        {courses.map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.title} ({c.academicBranch === 'scientific' ? 'علمي' : 'أدبي'} - {c.curriculumType === 'governmental' ? 'حكومي' : 'أزهري'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">اسم الفوج</label>
                    <input 
                      type="text" 
                      placeholder="مثال: فوج الرياضيات - علمي - أ. محمد"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!formData.courseId || !formData.name}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50 mt-8"
                  >
                    التالي: إسناد الأستاذ
                  </button>
                </div>
              )}

              {/* STEP 2: Assign Teacher */}
              {step === 2 && (
                <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
                  <div className="text-center mb-8">
                    <UserPlus className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">إسناد أستاذ</h3>
                    <p className="text-slate-500 text-sm mt-1">اختر الأستاذ الذي سيتولى تدريس هذا الفوج</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {teachers.length === 0 && <p className="text-center col-span-2 text-slate-500">لا يوجد أساتذة مسجلين في مادتك بعد.</p>}
                    {teachers.map((t: any) => (
                      <div 
                        key={t.id} 
                        onClick={() => setFormData({...formData, teacherId: t.id})}
                        className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${formData.teacherId === t.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300'}`}
                      >
                        <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                          {t.firstName} {t.lastName}
                          {formData.teacherId === t.id && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                        </div>
                        <div className="text-sm text-slate-500 mt-1">{t.email}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl">رجوع</button>
                    <button 
                      onClick={() => setStep(3)} 
                      disabled={!formData.teacherId}
                      className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-xl disabled:opacity-50"
                    >
                      التالي: توزيع الطلبة
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Assign Students */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in flex flex-col h-full">
                  <div className="text-center mb-4">
                    <GraduationCap className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">تفويج الطلبة</h3>
                    <p className="text-slate-500 text-sm mt-1">تحديد الطلبة المنضمين لهذا الفوج. المعروض هم طلبة الفرع والمنهج المحددين للمساق.</p>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                    <div className="font-bold text-indigo-600">
                      تم تحديد {selectedStudents.length} طالب
                    </div>
                    <button 
                      onClick={handleSelectAllStudents}
                      className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                    >
                      {selectedStudents.length === students.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-96 border border-slate-200 dark:border-slate-800 rounded-xl">
                    {isLoadingStudents ? (
                      <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                        جاري جلب قائمة الطلبة...
                      </div>
                    ) : students.length === 0 ? (
                      <div className="p-8 text-center text-slate-500">
                        لا يوجد طلبة مطابقين للفرع والمنهج المطلوب.
                      </div>
                    ) : (
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="px-4 py-3 w-12"></th>
                            <th className="px-4 py-3 font-bold">اسم الطالب</th>
                            <th className="px-4 py-3 font-bold">البريد الإلكتروني</th>
                            <th className="px-4 py-3 font-bold">الفرع / المنهج</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {students.map((s: any) => (
                            <tr 
                              key={s.id} 
                              onClick={() => handleSelectStudent(s.id)}
                              className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedStudents.includes(s.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                            >
                              <td className="px-4 py-3">
                                <input 
                                  type="checkbox" 
                                  checked={selectedStudents.includes(s.id)}
                                  readOnly
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                />
                              </td>
                              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{s.firstName} {s.lastName}</td>
                              <td className="px-4 py-3 text-slate-500 dir-ltr text-right">{s.email}</td>
                              <td className="px-4 py-3 text-slate-600">
                                {s.academicBranch === 'scientific' ? 'علمي' : 'أدبي'} - {s.curriculumType === 'governmental' ? 'حكومي' : 'أزهري'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl">رجوع</button>
                    <button 
                      onClick={() => createCohortMutation.mutate()} 
                      disabled={createCohortMutation.isPending || selectedStudents.length === 0}
                      className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {createCohortMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      اعتماد الفوج وإنشاؤه ({selectedStudents.length} طلاب)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
