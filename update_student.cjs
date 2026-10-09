const fs = require('fs');
const path = 'packages/frontend/src/features/student/pages/StudentDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const target = '<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">';
const cohortsUI = `
      {/* مساري الأكاديمي - أفواجي */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          مساري الأكاديمي (أفواجي)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentCohorts.length === 0 ? (
            <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm text-slate-500 font-bold">
              لم يتم تفويجك في أي فوج بعد. ستظهر هنا المواد التي تم تسجيلك بها فور اعتمادك.
            </div>
          ) : (
            studentCohorts.map((cohort: any) => (
              <div key={cohort.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{cohort.name}</h3>
                  <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-md shrink-0">
                    {cohort.code}
                  </span>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><CheckSquare className="w-4 h-4 text-emerald-500" /> نشط</span>
                  <span>{cohort.course?.title || 'مساق معتمد'}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>\n\n      `;

if(code.includes(target)) {
    code = code.replace(target, cohortsUI + target);
    fs.writeFileSync(path, code);
    console.log('StudentDashboard updated');
} else {
    console.log('Target not found');
}
