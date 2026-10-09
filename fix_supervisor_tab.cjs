const fs = require('fs');
let supPath = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let supCode = fs.readFileSync(supPath, 'utf8');

supCode = supCode.replace(
    /<\/button>\s*<\/div>\s*<\/>\s*\)\}/,
    `</button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={\`pb-3 font-bold transition-all border-b-2 \${activeTab === 'activity' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}\`}
          >
            سجل النشاط
          </button>
        </div>
        </>
        )}`
);

fs.writeFileSync(supPath, supCode);
