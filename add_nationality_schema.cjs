const fs = require('fs');
const path = 'packages/backend/prisma/schema.prisma';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('nationality')) {
    code = code.replace(
        /locale\s+String\s+@default\("ar"\)\s+@db\.VarChar\(10\)/,
        `locale              String                    @default("ar") @db.VarChar(10)\n    nationality         String?                   @db.VarChar(100)`
    );
    fs.writeFileSync(path, code);
    console.log('Added nationality to schema');
} else {
    console.log('Already added');
}
