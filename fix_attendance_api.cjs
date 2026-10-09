const fs = require('fs');
const path = 'packages/backend/src/modules/scheduling/presentation/http/sessions.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const regex = /async getSessionAttendance[\s\S]*?async saveSessionAttendance/m;

const replacement = `async getSessionAttendance(@Param('id') sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) throw new Error('Session not found');

    const enrollments = await this.prisma.cohortEnrollment.findMany({
      where: { cohortId: session.cohortId }
    });

    const studentIds = enrollments.map(e => e.studentId);
    
    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true }
    });

    const attendances = await this.prisma.sessionAttendance.findMany({
      where: { sessionId }
    });

    return students.map(student => {
      const attendance = attendances.find(a => a.studentId === student.id);
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        status: attendance?.status || 'absent_unexcused',
        id: attendance?.id
      };
    });
  }

  async saveSessionAttendance`;

if (code.match(regex)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(path, code);
    console.log('Fixed TS errors in getSessionAttendance');
} else {
    console.log('Regex did not match');
}
