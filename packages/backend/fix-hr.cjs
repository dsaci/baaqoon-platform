const fs = require('fs');
let content = fs.readFileSync('src/modules/groups/presentation/http/groups.controller.ts', 'utf8');

const oldEndpointRegex = /@Get\('supervisor\/hr'\)[\s\S]*?(?=@Get\('supervisor\/stats'\))/;

const newEndpoint = `@Get('supervisor/hr')
  async getSupervisorHR(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const supervisedSubjectId = user?.supervisedSubjectId;

    if (!supervisedSubjectId) {
      return { teachers: [], students: [] };
    }

    const instructorRecords = await this.prisma.cohortInstructor.findMany({
      where: { cohort: { course: { subjectId: supervisedSubjectId } } }
    });
    const teacherIds = instructorRecords.map(r => r.teacherId);

    const teachers = await this.prisma.user.findMany({
      where: { id: { in: teacherIds }, primaryRole: 'teacher' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    const enrollmentRecords = await this.prisma.cohortEnrollment.findMany({
      where: { cohort: { course: { subjectId: supervisedSubjectId } } }
    });
    const studentIds = enrollmentRecords.map(r => r.studentId);

    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds }, primaryRole: 'student' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    return { teachers, students };
  }

  `;

content = content.replace(oldEndpointRegex, newEndpoint);

fs.writeFileSync('src/modules/groups/presentation/http/groups.controller.ts', content);
console.log('Fixed HR endpoint');
