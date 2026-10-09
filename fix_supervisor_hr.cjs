const fs = require('fs');
const path = 'packages/frontend/src/features/supervisor/pages/SupervisorDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("import SupervisorHrView from '../components/SupervisorHrView';", "import HrManagementAdminView from '../../admin/components/HrManagementAdminView';");
code = code.replace("{activeTab === 'teachers' && <SupervisorHrView role=\"teacher\" />}", "{activeTab === 'teachers' && <HrManagementAdminView />}");
code = code.replace("{activeTab === 'students' && <SupervisorHrView role=\"student\" />}", "{activeTab === 'students' && <HrManagementAdminView />}");

fs.writeFileSync(path, code);
