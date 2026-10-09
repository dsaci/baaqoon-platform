const fs = require('fs');
const path = 'packages/backend/src/modules/scheduling/presentation/http/sessions.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const newEndpoints = `
  @Get(':id/attendance')
  async getSessionAttendance(@Param('id') sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        cohort: {
          include: {
            enrollments: {
              include: {
                student: { select: { id: true, firstName: true, lastName: true } }
              }
            }
          }
        }
      }
    });

    if (!session || !session.cohort) throw new Error('Session not found');

    const attendances = await this.prisma.sessionAttendance.findMany({
      where: { sessionId }
    });

    const students = session.cohort.enrollments.map(e => e.student);
    
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

  @Patch(':id/attendance')
  async saveSessionAttendance(@Req() req: any, @Param('id') sessionId: string, @Body() body: { records: { studentId: string; status: any }[] }) {
    const teacherId = req.user?.id || req.user?.userId;
    
    // Upsert each record
    for (const record of body.records) {
      await this.prisma.sessionAttendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: sessionId,
            studentId: record.studentId
          }
        },
        update: {
          status: record.status,
          markedById: teacherId
        },
        create: {
          sessionId: sessionId,
          studentId: record.studentId,
          status: record.status,
          markedById: teacherId
        }
      });
    }

    return { success: true };
  }
`;

if (!code.includes("getSessionAttendance")) {
    code = code.replace(
        "export class SessionsController {",
        "export class SessionsController {" + newEndpoints
    );
    fs.writeFileSync(path, code);
    console.log('Attendance endpoints added to SessionsController');
} else {
    console.log('Already added');
}
