const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('const supervisors =')) {
    code = code.replace(
        "const students = await this.prisma.user.count({ where: { primaryRole: 'student' } });",
        "const students = await this.prisma.user.count({ where: { primaryRole: 'student' } });\n    const supervisors = await this.prisma.user.count({ where: { primaryRole: 'subject_supervisor' } });"
    );
    code = code.replace(
        "stats: { teachers, students, cohorts, activeSessions, pendingUsers }",
        "stats: { teachers, students, supervisors, cohorts, activeSessions, pendingUsers }"
    );
    fs.writeFileSync(path, code);
    console.log('Backend updated');
} else {
    console.log('Already updated');
}
