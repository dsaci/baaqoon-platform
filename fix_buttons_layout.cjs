const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

// Separate the buttons inside HrManagementAdminView
const layoutSearch = /<div className="flex justify-between items-center mb-4">\s*<div className="flex gap-2">\s*<button onClick=\{\(\) => setIsPasswordRequestsOpen\(true\)\}/s;
const layoutReplace = `<div className="flex justify-between items-center mb-4 gap-4 flex-wrap">
          <button onClick={() => setIsPasswordRequestsOpen(true)}`;
code = code.replace(layoutSearch, layoutReplace);

const closingDivSearch = /<\/button>\s*<\/div>\s*<\/div>\s*\{\/\* Sub-tabs/s;
const closingDivReplace = `</button>\n      </div>\n      {/* Sub-tabs`;
code = code.replace(closingDivSearch, closingDivReplace);

fs.writeFileSync(path, code);
