const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace("import { api } from '../../../lib/axios';", "import { api } from '../../../lib/axios';\nimport PasswordRequestsModal from './PasswordRequestsModal';");

const addBtnStr = `<button 
            onClick={() => setIsAddUserOpen(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
          >
            <UserPlus className="w-5 h-5" />
            إضافة مستخدم جديد
          </button>`;
const reqBtnStr = `<div className="flex gap-2">
          <button onClick={() => setIsPasswordRequestsOpen(true)} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all">
            <Key className="w-5 h-5" /> طلبات كلمات المرور
          </button>
          ` + addBtnStr + `
          </div>`;

code = code.replace(addBtnStr, reqBtnStr);

fs.writeFileSync(path, code);
console.log('done');
