const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('EditCohortModal')) {
  // Import modal and icons
  code = code.replace("import { Users, UserPlus, BookOpen, Clock, Plus, X, Search, FileText, CheckCircle, Shield, Settings, PlayCircle, BarChart3, TrendingUp, AlertCircle, Calendar, GraduationCap, Video, MoreHorizontal, UserCheck, Phone, Mail, Activity, Eye, FileVideo, BookText, FileCheck2, Filter, Key } from 'lucide-react';", "import { Users, UserPlus, BookOpen, Clock, Plus, X, Search, FileText, CheckCircle, Shield, Settings, PlayCircle, BarChart3, TrendingUp, AlertCircle, Calendar, GraduationCap, Video, MoreHorizontal, UserCheck, Phone, Mail, Activity, Eye, FileVideo, BookText, FileCheck2, Filter, Key, Edit, Trash2 } from 'lucide-react';\nimport EditCohortModal from '../components/EditCohortModal';");

  // Add state for modal
  code = code.replace("const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);", "const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);\n  const [editingCohort, setEditingCohort] = useState<any>(null);");

  // Add delete handler
  const deleteHandler = `
  const handleDeleteCohort = async (id: string, name: string) => {
    if (confirm(\`هل أنت متأكد من حذف الفوج "\${name}"؟ هذه العملية لا يمكن التراجع عنها.\`)) {
      try {
        await api.delete(\`/groups/admin/cohorts/\${id}\`);
        queryClient.invalidateQueries({ queryKey: ['adminData'] });
        queryClient.invalidateQueries({ queryKey: ['adminStats'] });
      } catch (err) {
        alert("حدث خطأ أثناء الحذف");
      }
    }
  };
  `;
  code = code.replace("const handleCreateCohortSubmit =", deleteHandler + "\n  const handleCreateCohortSubmit =");

  // Update cohort card to add edit/delete buttons
  const targetCardHeader = `<div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-black text-slate-900 dark:text-white text-base mb-1">{cohort.name}</h4>
                              <p className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded inline-block">{cohort.code}</p>
                            </div>
                            <span className={\`text-xs font-black px-2.5 py-1 rounded-lg \${isFull ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}\`}>
                              {enrolled}/{maxStudents}
                            </span>
                          </div>`;

  const newCardHeader = `<div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-black text-slate-900 dark:text-white text-base">{cohort.name}</h4>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => setEditingCohort(cohort)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-violet-600 transition-colors" title="تعديل الفوج">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteCohort(cohort.id, cohort.name)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-rose-600 transition-colors" title="حذف الفوج">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded inline-block">{cohort.code}</p>
                            </div>
                            <span className={\`text-xs font-black px-2.5 py-1 rounded-lg \${isFull ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}\`}>
                              {enrolled}/{maxStudents}
                            </span>
                          </div>`;

  code = code.replace(targetCardHeader, newCardHeader);

  // Add modal at bottom
  code = code.replace("</div>\n    </div>\n  );\n}", "</div>\n    <EditCohortModal isOpen={!!editingCohort} onClose={() => setEditingCohort(null)} cohort={editingCohort} adminData={adminData} />\n    </div>\n  );\n}");

  fs.writeFileSync(path, code);
  console.log('done');
}
