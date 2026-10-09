const fs = require('fs');
const path = 'packages/backend/src/modules/scheduling/presentation/http/sessions.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const monitoringEndpoint = `
  @Get('monitoring')
  async getMonitoringSessions(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(role)) {
      throw new Error('Unauthorized');
    }

    let cohortIds = [];
    if (role === 'subject_supervisor') {
      const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
      if (user?.supervisedSubjectId) {
        const courses = await this.prisma.course.findMany({ where: { subjectId: user.supervisedSubjectId }, select: { id: true } });
        const courseIds = courses.map(c => c.id);
        const cohorts = await this.prisma.cohort.findMany({ where: { courseId: { in: courseIds } }, select: { id: true } });
        cohortIds = cohorts.map(c => c.id);
      }
    }

    const now = new Date();
    // Live: in progress or starting very soon / started recently
    const liveSessions = await this.prisma.session.findMany({
      where: {
        ...(cohortIds.length > 0 ? { cohortId: { in: cohortIds } } : {}),
        status: { in: ['scheduled', 'in_progress'] },
        scheduledStartTime: { lte: new Date(now.getTime() + 30 * 60000) },
        scheduledEndTime: { gte: now }
      },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        cohort: { include: { course: { select: { nameAr: true } } } }
      },
      orderBy: { scheduledStartTime: 'asc' }
    });

    // Past: completed or passed scheduled end time
    const pastSessions = await this.prisma.session.findMany({
      where: {
        ...(cohortIds.length > 0 ? { cohortId: { in: cohortIds } } : {}),
        status: { in: ['completed', 'scheduled', 'cancelled'] },
        scheduledEndTime: { lt: now }
      },
      include: {
        teacher: { select: { firstName: true, lastName: true } },
        cohort: { include: { course: { select: { nameAr: true } }, enrollments: { select: { studentId: true } } } },
        attendances: true
      },
      orderBy: { scheduledStartTime: 'desc' },
      take: 20
    });

    return {
      live: liveSessions.map(s => ({
        id: s.id,
        courseName: s.cohort?.course?.nameAr || 'مادة غير محددة',
        cohortName: s.cohort?.name,
        teacherName: \`أ. \${s.teacher?.firstName} \${s.teacher?.lastName}\`,
        status: s.status,
        startTime: s.scheduledStartTime,
        endTime: s.scheduledEndTime
      })),
      past: pastSessions.map(s => {
        const totalStudents = s.cohort?.enrollments?.length || 0;
        const attended = s.attendances?.filter(a => ['present', 'late'].includes(a.status)).length || 0;
        const absent = totalStudents - attended;
        
        let teacherStatus = 'حضر بالموعد';
        if (s.status === 'cancelled') teacherStatus = 'ألغيت الحصة';
        else if (!s.actualStartTime) teacherStatus = 'لم يسجل دخول';
        else if (new Date(s.actualStartTime) > new Date(s.scheduledStartTime.getTime() + 10*60000)) teacherStatus = 'حضر متأخراً';

        let studentAttendanceText = 'لم يسجل بعد';
        if (s.attendances?.length > 0) {
           if (absent === 0) studentAttendanceText = 'حضور كامل';
           else studentAttendanceText = \`تغيب \${absent} طلاب\`;
        }

        return {
          id: s.id,
          courseName: s.cohort?.course?.nameAr || 'مادة غير محددة',
          cohortName: s.cohort?.name,
          teacherId: s.teacherId,
          teacherName: \`أ. \${s.teacher?.firstName} \${s.teacher?.lastName}\`,
          studentAttendanceText,
          teacherStatus,
          isAbsent: absent > 0
        };
      })
    };
  }
`;

// Inject into controller
const search = "export class SessionsController {";
code = code.replace(search, search + monitoringEndpoint);
fs.writeFileSync(path, code);
