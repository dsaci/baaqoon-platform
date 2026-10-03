const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /async getAdminData\(\) \{[\s\S]*?return \{ teachers, courses \};\s*\}/;

const replacement = `async getAdminData() {
    const teachers = await this.prisma.user.findMany({
      where: { primaryRole: 'teacher' },
      select: { id: true, firstName: true, lastName: true, email: true, supervisedSubjectId: true }
    });
    const students = await this.prisma.user.findMany({
      where: { primaryRole: 'student' },
      select: { id: true, firstName: true, lastName: true, email: true, academicBranch: true, curriculumType: true }
    });
    const courses = await this.prisma.course.findMany({
      include: {
        subject: { select: { nameAr: true } },
        versions: { where: { isDefault: true }, select: { id: true, versionTag: true } }
      }
    });
    return { teachers, students, courses };
  }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(path, code);
    console.log('done');
} else {
    console.log('not found');
}
