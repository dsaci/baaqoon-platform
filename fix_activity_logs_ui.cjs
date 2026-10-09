const fs = require('fs');
const path = 'packages/frontend/src/features/admin/components/ActivityLogsView.tsx';
let code = fs.readFileSync(path, 'utf8');

const iconSearch = /const getActionIcon = \(action: string\) => \{\s*switch \(action\) \{/;
const iconReplace = `const getActionIcon = (action: string) => {
    switch (action) {
      case 'failed_login': return <AlertCircle className="w-4 h-4 text-red-500" />;`;
code = code.replace(iconSearch, iconReplace);

const importSearch = /import \{ ([^}]+) \} from 'lucide-react';/;
code = code.replace(importSearch, (match, p1) => {
    if (p1.includes('AlertCircle')) return match;
    return `import { ${p1}, AlertCircle } from 'lucide-react';`;
});

const actionTextSearch = /const getActionText = \(action: string\) => \{\s*switch \(action\) \{/;
const actionTextReplace = `const getActionText = (action: string) => {
    switch (action) {
      case 'failed_login': return 'محاولة دخول فاشلة';`;
if (code.includes('getActionText')) {
  code = code.replace(actionTextSearch, actionTextReplace);
}

fs.writeFileSync(path, code);
