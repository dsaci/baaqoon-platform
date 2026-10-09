const fs = require('fs');
const path = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add import
code = code.replace(
  /import ActivityLogsView from '..\/..\/admin\/components\/ActivityLogsView';/,
  `import ActivityLogsView from '../../admin/components/ActivityLogsView';\nimport SupervisorCohortsView from '../components/SupervisorCohortsView';`
);

// Allow 'cohorts' as activeTab
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<'overview' \| 'activity'>\('overview'\);/,
  `const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'cohorts'>('overview');`
);

// Add tab button
const tabSearch = `<button 
            onClick={() => setActiveTab('activity')}
            className={\`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${activeTab === 'activity' ? 'bg-white dark:bg-slate-800 shadow-sm text-baaqoon-accent' : 'text-slate-600 hover:bg-white/50'}\`}
          >
            <Activity className="w-5 h-5" />
            سجل النشاط
          </button>`;
const tabReplace = `<button 
            onClick={() => setActiveTab('activity')}
            className={\`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${activeTab === 'activity' ? 'bg-white dark:bg-slate-800 shadow-sm text-baaqoon-accent' : 'text-slate-600 hover:bg-white/50'}\`}
          >
            <Activity className="w-5 h-5" />
            سجل النشاط
          </button>
          <button 
            onClick={() => setActiveTab('cohorts')}
            className={\`flex-1 py-3 px-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 \${activeTab === 'cohorts' ? 'bg-white dark:bg-slate-800 shadow-sm text-baaqoon-accent' : 'text-slate-600 hover:bg-white/50'}\`}
          >
            <Users className="w-5 h-5" />
            الأفواج والإسناد
          </button>`;
code = code.replace(tabSearch, tabReplace);

// Add content rendering
const renderSearch = `{activeTab === 'activity' && <ActivityLogsView />}`;
const renderReplace = `{activeTab === 'activity' && <ActivityLogsView />}
        {activeTab === 'cohorts' && <SupervisorCohortsView />}`;
code = code.replace(renderSearch, renderReplace);

fs.writeFileSync(path, code);
