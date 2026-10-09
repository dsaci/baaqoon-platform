const fs = require('fs');

let adminPath = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let adminCode = fs.readFileSync(adminPath, 'utf8');

if (!adminCode.includes('ActivityLogsView')) {
    adminCode = adminCode.replace(
        "import HrManagementAdminView from '../components/HrManagementAdminView';",
        "import HrManagementAdminView from '../components/HrManagementAdminView';\nimport ActivityLogsView from '../components/ActivityLogsView';"
    );
    
    adminCode = adminCode.replace(
        /\{ id: 'requests' as const, label: '.*? \},/,
        `{ id: 'requests' as const, label: 'طلبات فتح أفواج', badge: pendingRequests.length > 0 ? pendingRequests.length : undefined },
    { id: 'activity' as const, label: 'سجل النشاط المباشر', badge: undefined },`
    );
    
    adminCode = adminCode.replace(
        /useState<'hr' \| 'cohorts' \| 'requests'>\('hr'\)/,
        "useState<'hr' | 'cohorts' | 'requests' | 'activity'>('hr')"
    );
    
    adminCode = adminCode.replace(
        /activeTab === 'requests' && <CohortRequestsAdminView \/>\}/,
        `activeTab === 'requests' && <CohortRequestsAdminView />}\n        {activeTab === 'activity' && <ActivityLogsView />}`
    );

    fs.writeFileSync(adminPath, adminCode);
}

let supPath = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let supCode = fs.readFileSync(supPath, 'utf8');

if (!supCode.includes('ActivityLogsView')) {
    supCode = supCode.replace(
        "import SupervisorHrView from '../components/SupervisorHrView';",
        "import SupervisorHrView from '../components/SupervisorHrView';\nimport ActivityLogsView from '../../admin/components/ActivityLogsView';"
    );
    
    supCode = supCode.replace(
        /useState<'stats' \| 'teachers' \| 'students'>\(initialTab\)/,
        "useState<'stats' | 'teachers' | 'students' | 'activity'>(initialTab as any)"
    );
    
    supCode = supCode.replace(
        /activeTab === 'students' \? '.*? : '.*?'\}\\n\s*>\\n\s*.*?\\n\s*<\/button>/,
        `$&\n          <button 
            onClick={() => setActiveTab('activity')}
            className={\`pb-3 font-bold transition-all border-b-2 \${activeTab === 'activity' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}\`}
          >
            سجل النشاط
          </button>`
    );

    supCode = supCode.replace(
        /\{activeTab === 'students' && <SupervisorHrView role="student" \/>\}/,
        `{activeTab === 'students' && <SupervisorHrView role="student" />}\n        {activeTab === 'activity' && <ActivityLogsView />}`
    );
    
    fs.writeFileSync(supPath, supCode);
}
console.log('ActivityLogsView added to dashboards');
