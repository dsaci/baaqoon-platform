const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const target = `  @Get('admin/data')
  async getAdminData() {
    const teachers = await this.prisma.user.findMany({
      where: { primaryRole: 'teacher' },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    const courses = await this.prisma.course.findMany({
      include: {
        subject: { select: { nameAr: true } },
        versions: { where: { isDefault: true }, select: { id: true, versionTag: true } }
      }
    });
    return { teachers, courses };
  }`;

const replacement = `  @Get('admin/data')
  async getAdminData() {
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

code = code.replace(target, replacement);
fs.writeFileSync(path, code);
console.log('done');
