const fs = require('fs');
const path = 'packages/backend/src/modules/auth/presentation/http/users.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const searchStr = `select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        primaryRole: true,
        status: true,
        createdAt: true,
      }`;

const replaceStr = `select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        primaryRole: true,
        status: true,
        createdAt: true,
        nationality: true,
        academicBranch: true,
        curriculumType: true,
        supervisedSubjectId: true,
        lastLoginAt: true,
        emailVerified: true
      }`;

code = code.replace(searchStr, replaceStr);
fs.writeFileSync(path, code);
