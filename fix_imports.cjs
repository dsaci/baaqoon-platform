const fs = require('fs');
const path = 'packages/frontend/src/features/admin/pages/AdminDashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const importRegex = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]lucide-react['"];/;
const match = code.match(importRegex);
if (match) {
    let imports = match[1];
    if (!imports.includes('Edit')) imports += ', Edit';
    if (!imports.includes('Trash2')) imports += ', Trash2';
    code = code.replace(importRegex, `import { ${imports} } from 'lucide-react';`);
    fs.writeFileSync(path, code);
    console.log('Fixed imports');
} else {
    console.log('lucide-react not found');
}
