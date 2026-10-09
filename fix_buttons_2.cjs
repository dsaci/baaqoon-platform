const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("action: () => navigate('/supervisor/dashboard')", "action: () => setActiveTab('hr')");
code = code.replace("action: () => navigate('/supervisor/dashboard?tab=teachers')", "action: () => setActiveTab('hr')");
code = code.replace("action: () => navigate('/supervisor/dashboard?tab=students')", "action: () => setActiveTab('hr')");
code = code.replace("action: () => navigate('/supervisor/schedule')", "action: () => setActiveTab('cohorts')");

fs.writeFileSync(path, code);
