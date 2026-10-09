const fs = require('fs');
const path = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const tabButtonRegex = /<button\s*onClick=\{\(\) => setActiveTab\('activity'\)\}.*?<\/button>/s;
code = code.replace(tabButtonRegex, '');

const tabContentRegex = /\{activeTab === 'activity' && <ActivityLogsView \/>\}/g;
code = code.replace(tabContentRegex, '');

const importRegex = /import ActivityLogsView from '\.\.\/\.\.\/admin\/components\/ActivityLogsView';\n/g;
code = code.replace(importRegex, '');

const stateRegex = /const \[activeTab, setActiveTab\] = useState<'stats' \| 'teachers' \| 'students' \| 'activity' \| 'cohorts'>\(initialTab as any\);/;
const stateReplace = `const [activeTab, setActiveTab] = useState<'stats' | 'teachers' | 'students' | 'cohorts'>(initialTab as any);`;
code = code.replace(stateRegex, stateReplace);

fs.writeFileSync(path, code);
