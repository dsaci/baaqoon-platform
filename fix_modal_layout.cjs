const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Make Add User modal wider and use a grid layout
const addModalSearch = /<div className="bg-white dark:bg-slate-900 rounded-\[2rem\] w-full max-w-md shadow-2xl p-6">\s*<h2 className="text-xl font-black mb-4 dark:text-white">إضافة مستخدم جديد<\/h2>\s*<div className="space-y-4">/s;

const addModalReplace = `<div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6 dark:text-white flex items-center gap-3">
              <UserPlus className="w-7 h-7 text-violet-500" /> إضافة مستخدم جديد
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">`;
code = code.replace(addModalSearch, addModalReplace);

// 2. Fix the inputs container div closing tag since we changed space-y-4 to grid
// Need to find where the inputs end and buttons begin.
const buttonsSearch = /<\/div>\s*<\/div>\s*<div className="flex gap-3 mt-6">/s;
const buttonsReplace = `</div>\n            <div className="flex gap-3 mt-8">`;
code = code.replace(buttonsSearch, buttonsReplace);


fs.writeFileSync(path, code);
