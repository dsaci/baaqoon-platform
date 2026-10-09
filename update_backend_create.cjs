const fs = require('fs');
const path = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /return this\.prisma\.user\.create\(\{\s*data: \{\s*email: body\.email,\s*firstName: body\.firstName,\s*lastName: body\.lastName,\s*primaryRole: body\.primaryRole,\s*passwordHash,\s*status: 'active'\s*\}\s*\}\);/;

const replacement = `return this.prisma.user.create({
      data: {
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        primaryRole: body.primaryRole,
        passwordHash,
        status: 'active',
        academicBranch: body.academicBranch || null,
        curriculumType: body.curriculumType || null,
        supervisedSubjectId: body.supervisedSubjectId || null,
        roles: {
          create: {
            role: body.primaryRole
          }
        }
      }
    });`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(path, code);
    console.log('Backend createUser updated');
} else {
    console.log('Regex failed');
}
