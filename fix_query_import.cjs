const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');
if (!code.includes('Query')) {
    code = code.replace(/import \{([^}]+)\} from '@nestjs\/common';/, (match, p1) => {
        return `import {${p1}, Query } from '@nestjs/common';`;
    });
    fs.writeFileSync(path, code);
}
