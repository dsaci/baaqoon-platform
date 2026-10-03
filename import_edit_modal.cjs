const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');
if (!code.includes('import EditCohortModal')) {
    code = code.replace(/import \{ useAuthStore \} from '\.\.\/\.\.\/\.\.\/store\/useAuthStore';/, "import { useAuthStore } from '../../../store/useAuthStore';\nimport EditCohortModal from '../components/EditCohortModal';");
    fs.writeFileSync(path, code);
    console.log('imported modal');
}
