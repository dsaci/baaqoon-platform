const fs = require('fs');
const path = 'packages/frontend/src/features/teacher/pages/TeacherDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = '{/* Curriculum Progress Tracker */}';
const cohortsSection = `        {/* الأفواج التي أُدرسها */}
        <div className="lg:col-span-3 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-slate-700/50 rounded-[2rem] shadow-lg p-8 mt-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-6">
            <span className="w-2 h-6 bg-gradient-to-b from-fuchsia-500 to-pink-600 rounded-full"></span>
            الأفواج التي أُدرسها
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {!myCohorts || myCohorts.length === 0 ? (
              <div className="col-span-3 text-center text-slate-500 font-bold py-8">لم يتم إسنادك لأي فوج بعد.</div>
            ) : (
              myCohorts.map((cohort: any) => (
                <div key={cohort.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-black text-slate-800 dark:text-slate-100">{cohort.name}</h3>
                    <span className="text-xs font-bold font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{cohort.code}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-bold">
                    <Users className="w-4 h-4" />
                    عدد الطلبة: {cohort.enrollments?.length || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Curriculum Progress Tracker */}`;

if (code.includes(targetStr) && !code.includes('الأفواج التي أُدرسها')) {
    code = code.replace(targetStr, cohortsSection);
    fs.writeFileSync(path, code);
    console.log('Teacher cohorts section added!');
} else {
    console.log('Could not find target or already added.');
}
