const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');
code = code.replace(/\} from 'lucide-react';/, ", UserPlus } from 'lucide-react';");
fs.writeFileSync(path, code);
console.log('Fixed import');
