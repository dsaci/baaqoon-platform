const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/import \{([^}]+)\} from '@nestjs\/common';/, (match, p1) => {
    if (p1.includes('Query')) return match;
    return `import {${p1}, Query } from '@nestjs/common';`;
});
fs.writeFileSync(path, code);
