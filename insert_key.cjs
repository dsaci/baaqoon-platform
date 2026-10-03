const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

const keyButton = `
                      <button
                        onClick={() => { setSelectedUserForReset(u); setIsResetPasswordOpen(true); }}
                        title="تغيير كلمة المرور"
                        className="p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors ml-1"
                      >
                        <Key className="w-5 h-5" />
                      </button>
`;

if (!code.includes('<Key className="w-5 h-5" />')) {
  // Find the exact delete button start
  const target = /<button[\s\S]*?onClick=\{\(\) => \{\s*if \(window\.confirm/;
  const match = code.match(target);
  if (match) {
    code = code.replace(match[0], keyButton + match[0]);
    fs.writeFileSync(path, code);
    console.log('Successfully inserted Key button');
  } else {
    console.log('Could not find the target to insert the Key button');
  }
} else {
  console.log('Key button already inserted');
}
