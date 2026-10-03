const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const lines = code.split('\n');
const startIndex = lines.findIndex(l => l.includes('<div className="flex justify-between items-start mb-4">'));

if (startIndex !== -1) {
    const h4Index = startIndex + 2; // this is where <h4 className="font-black text-slate-900 dark:text-white text-base mb-1">{cohort.name}</h4> is
    
    // Check if it's already modified
    if (!lines[h4Index].includes('setEditingCohort')) {
        lines[h4Index] = `                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-slate-900 dark:text-white text-base">{cohort.name}</h4>
                              <div className="flex items-center gap-1">
                                <button onClick={() => setEditingCohort(cohort)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-violet-600 transition-colors" title="تعديل الفوج">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteCohort(cohort.id, cohort.name)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-rose-600 transition-colors" title="حذف الفوج">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>`;
        
        fs.writeFileSync(path, lines.join('\n'));
        console.log('replaced buttons successfully');
    } else {
        console.log('already modified');
    }
}
