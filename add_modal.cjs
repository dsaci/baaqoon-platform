const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/HrManagementAdminView.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace('const [isAddUserOpen, setIsAddUserOpen] = useState(false);', 'const [isPasswordRequestsOpen, setIsPasswordRequestsOpen] = useState(false);\n  const [isAddUserOpen, setIsAddUserOpen] = useState(false);');

const reqModalCode = `
      {isPasswordRequestsOpen && (
        <PasswordRequestsModal onClose={() => setIsPasswordRequestsOpen(false)} />
      )}
`;

code = code.replace("</div>\n    </div>\n  );\n}", reqModalCode + "\n      </div>\n    </div>\n  );\n}");

fs.writeFileSync(path, code);
console.log('done');
