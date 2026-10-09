const fs = require('fs');
const path = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
    /async updateMyProfile\(@Req\(\) req: any, @Body\(\) body: \{ firstName\?: string; lastName\?: string; email\?: string; phone\?: string \}\) \{/,
    `async updateMyProfile(@Req() req: any, @Body() body: { firstName?: string; lastName?: string; email?: string; phone?: string; nationality?: string }) {`
);

code = code.replace(
    /if \(body\.phone !== undefined\) updateData\.phone = body\.phone \|\| null;/,
    `if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.nationality !== undefined) updateData.nationality = body.nationality || null;`
);

fs.writeFileSync(path, code);
