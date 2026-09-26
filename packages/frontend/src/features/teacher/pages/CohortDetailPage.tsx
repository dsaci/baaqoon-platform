import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Calendar, 
  Search, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Clock,
  Eye,
  Award
} from 'lucide-react';
import RapidGeneratorModal from '../../assessments/components/RapidGeneratorModal';

// Mock Data
const mockStudents = [
  { id: 1, name: 'أحمد محمود رضوان', status: 'active', attendance: 95, lastActivity: 'قبل ساعتين' },
  { id: 2, name: 'سارة خالد المصري', status: 'active', attendance: 88, lastActivity: 'اليوم' },
  { id: 3, name: 'محمد يوسف النجار', status: 'pending', attendance: 0, lastActivity: '-' },
  { id: 4, name: 'ليلى سمير عودة', status: 'active', attendance: 75, lastActivity: 'أمس' },
  { id: 5, name: 'محمود عبد الرؤوف', status: 'active', attendance: 65, lastActivity: 'منذ 3 أيام' },
  { id: 6, name: 'فاطمة سعد الخالدي', status: 'active', attendance: 92, lastActivity: 'قبل ساعة' },
  { id: 7, name: 'عمر طارق الشريف', status: 'active', attendance: 45, lastActivity: 'منذ أسبوع' },
  { id: 8, name: 'نور الدين ياسين', status: 'active', attendance: 82, lastActivity: 'أمس' },
  { id: 9, name: 'هبة جمال حمدان', status: 'pending', attendance: 0, lastActivity: '-' },
  { id: 10, name: 'يوسف إبراهيم صيام', status: 'active', attendance: 98, lastActivity: 'الآن' },
  { id: 11, name: 'ريم مصطفى الهنيدي', status: 'active', attendance: 70, lastActivity: 'منذ 5 أيام' },
  { id: 12, name: 'كريم حسن عليوة', status: 'active', attendance: 85, lastActivity: 'أمس' },
];

const getInitials = (name: string) => {
  const parts = name.split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
  return name.substring(0, 2);
};

export const CohortDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { cohortId } = useParams();
  const [activeTab, setActiveTab] = useState<'students' | 'schedule' | 'assignments'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

  // Stats calculation
  const activeStudents = mockStudents.filter(s => s.status === 'active');
  const avgAttendance = Math.round(
    activeStudents.reduce((acc, curr) => acc + curr.attendance, 0) / (activeStudents.length || 1)
  );
  const atRiskStudents = activeStudents.filter(s => s.attendance < 70).length;

  const topStudents = [...activeStudents].sort((a, b) => b.attendance - a.attendance).slice(0, 3);

  const filteredStudents = mockStudents.filter(s => 
    s.name.includes(searchQuery)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col p-6 font-sans text-baaqoon-900 dark:text-white" dir="rtl">
      
      {/* 1. Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-700 dark:text-baaqoon-300 transition-colors"
            title="عودة"
          >
            <ArrowRight size={24} />
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-baaqoon-900 dark:text-white">فوج غزة (علمي) — فيزياء</h1>
              <span className="bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-accentDark text-xs px-2 py-1 rounded-full border border-baaqoon-200 dark:border-baaqoon-700">
                نشط
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-baaqoon-500 dark:text-baaqoon-400">
              <div className="flex items-center gap-1.5">
                <Users size={16} />
                <span>12/15 طالب</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={16} />
                <span>حصة قادمة: اليوم 4م</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setIsGeneratorOpen(true)}
            className="flex items-center justify-center gap-2 bg-white hover:bg-baaqoon-50 text-baaqoon-accentDark border border-baaqoon-200 px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
          >
            <span>توليد اختبار / حصة</span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-baaqoon-accent hover:bg-baaqoon-accentDark text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
            <Calendar size={18} />
            <span>بدء الحصة</span>
          </button>
        </div>
      </div>

      {/* 2. Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-6">
          {[
            { id: 'students', label: 'الطلاب' },
            { id: 'schedule', label: 'الحصص والجدول' },
            { id: 'assignments', label: 'الواجبات' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-baaqoon-accent text-baaqoon-accent'
                  : 'border-transparent text-baaqoon-500 dark:text-baaqoon-400 hover:text-baaqoon-700 dark:text-baaqoon-300 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 3. Students Tab Content */}
      {activeTab === 'students' && (
        <div className="flex flex-col gap-6 flex-1">
          
          {/* Aggregate Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800 shadow-sm flex items-center gap-4">
              <div className="bg-baaqoon-50 dark:bg-baaqoon-950 p-3 rounded-lg text-baaqoon-700 dark:text-baaqoon-300">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-baaqoon-500 dark:text-baaqoon-400 mb-1">متوسط الحضور</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-baaqoon-900 dark:text-white">{avgAttendance}%</span>
                </div>
              </div>
            </div>
            
            <div className="glass-panel p-4 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800 shadow-sm flex items-center gap-4">
              <div className="bg-red-50 p-3 rounded-lg text-red-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-sm text-baaqoon-500 dark:text-baaqoon-400 mb-1">طلاب بحاجة لمتابعة (حضور أقل من 70%)</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-red-600">{atRiskStudents} طلاب</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white dark:bg-baaqoon-900 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="p-4 border-b border-baaqoon-50 flex justify-between items-center bg-gray-50/50">
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-baaqoon-500 dark:text-baaqoon-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="ابحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-baaqoon-200 dark:border-baaqoon-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-baaqoon-accent/50 bg-white dark:bg-baaqoon-900"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-baaqoon-50 dark:bg-baaqoon-950 text-baaqoon-700 dark:text-baaqoon-300 border-b border-baaqoon-100 dark:border-baaqoon-800">
                  <tr>
                    <th className="px-6 py-3 font-semibold">الطالب</th>
                    <th className="px-6 py-3 font-semibold">حالة التسجيل</th>
                    <th className="px-6 py-3 font-semibold">الحضور</th>
                    <th className="px-6 py-3 font-semibold">آخر نشاط</th>
                    <th className="px-6 py-3 font-semibold text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-baaqoon-50">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-baaqoon-50 dark:bg-baaqoon-950/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-700 dark:text-baaqoon-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {getInitials(student.name)}
                          </div>
                          <span className="font-medium text-baaqoon-900 dark:text-white">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-baaqoon-100 dark:bg-baaqoon-900/50 text-baaqoon-accentDark">
                            <CheckCircle size={12} />
                            مسجل
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-baaqoon-red">
                            <AlertCircle size={12} />
                            معلق
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-48">
                        {student.status === 'active' ? (
                          <div className="flex items-center gap-3">
                            <span className="w-8 font-medium">{student.attendance}%</span>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  student.attendance >= 80 ? 'bg-baaqoon-100 dark:bg-baaqoon-900/500' : 
                                  student.attendance >= 60 ? 'bg-baaqoon-red' : 'bg-red-500'
                                }`}
                                style={{ width: `${student.attendance}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-baaqoon-500 dark:text-baaqoon-400">
                        {student.lastActivity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button className="inline-flex items-center gap-1.5 text-baaqoon-accent hover:text-baaqoon-accentDark font-medium text-xs bg-baaqoon-50 dark:bg-baaqoon-950 hover:bg-baaqoon-100 dark:bg-baaqoon-900/50 px-3 py-1.5 rounded transition-colors">
                          <Eye size={14} />
                          عرض التقدم
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-baaqoon-500 dark:text-baaqoon-400">
                        لا يوجد طلاب يطابقون بحثك.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Bottom Summary Card */}
          <div className="bg-gradient-to-r from-baaqoon-50 to-white p-5 rounded-xl border border-baaqoon-100 dark:border-baaqoon-800 shadow-sm mt-2">
            <h3 className="flex items-center gap-2 font-bold text-baaqoon-900 dark:text-white mb-4">
              <Award className="text-baaqoon-red" size={20} />
              متميزون هذا الشهر
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topStudents.map((student, idx) => (
                <div key={student.id} className="flex items-center gap-3 bg-white dark:bg-baaqoon-900 p-3 rounded-lg border border-baaqoon-50">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-baaqoon-red flex items-center justify-center font-bold text-xs shrink-0">
                    #{idx + 1}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium text-sm text-baaqoon-900 dark:text-white truncate">{student.name}</p>
                    <p className="text-xs text-baaqoon-500 dark:text-baaqoon-400">نسبة الحضور: {student.attendance}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Placeholders for other tabs */}
      {activeTab === 'schedule' && (
        <div className="flex-1 flex items-center justify-center text-baaqoon-500 dark:text-baaqoon-400 border-2 border-dashed border-baaqoon-100 dark:border-baaqoon-800 rounded-xl">
          محتوى الحصص والجدول قيد التطوير...
        </div>
      )}
      
      {activeTab === 'assignments' && (
        <div className="flex-1 flex items-center justify-center text-baaqoon-500 dark:text-baaqoon-400 border-2 border-dashed border-baaqoon-100 dark:border-baaqoon-800 rounded-xl">
          محتوى الواجبات قيد التطوير...
        </div>
      )}
      <RapidGeneratorModal 
        isOpen={isGeneratorOpen} 
        onClose={() => setIsGeneratorOpen(false)} 
        cohortId={cohortId || ''} 
      />
    </div>
  );
};

export default CohortDetailPage;
