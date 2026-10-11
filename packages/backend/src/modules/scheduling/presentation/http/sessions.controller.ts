import { Controller, Post, Body, Req, Get, Param, Delete, Patch } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('sessions')
export class SessionsController {
    @Get('monitoring')
  async getMonitoringSessions(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(role)) {
      throw new Error('Unauthorized');
    }

    let cohortIds: string[] = [];
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
        cohort: true
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
        cohort: { include: { enrollments: { select: { studentId: true } } } },
        attendances: true
      },
      orderBy: { scheduledStartTime: 'desc' },
      take: 20
    });

    const allCourseIds = Array.from(new Set([
      ...liveSessions.map(s => s.cohort?.courseId).filter(Boolean),
      ...pastSessions.map(s => s.cohort?.courseId).filter(Boolean)
    ])) as string[];

    const courses = await this.prisma.course.findMany({
      where: { id: { in: allCourseIds } },
      select: { id: true, title: true }
    });
    const courseMap = new Map(courses.map(c => [c.id, c.title]));

    return {
      live: liveSessions.map(s => ({
        id: s.id,
        courseName: (s.cohort?.courseId ? courseMap.get(s.cohort.courseId) : null) || 'مادة غير محددة',
        cohortName: s.cohort?.name,
        teacherName: `أ. ${s.teacher?.firstName || ''} ${s.teacher?.lastName || ''}`.trim(),
        status: s.status,
        startTime: s.scheduledStartTime,
        endTime: s.scheduledEndTime
      })),
      past: pastSessions.map(s => {
        const totalStudents = s.cohort?.enrollments?.length || 0;
        const attended = s.attendances?.filter((a: any) => ['present', 'late'].includes(a.status)).length || 0;
        const absent = totalStudents - attended;
        
        let teacherStatus = 'حضر بالموعد';
        if (s.status === 'cancelled') teacherStatus = 'ألغيت الحصة';
        else if (!s.actualStartTime) teacherStatus = 'لم يسجل دخول';
        else if (new Date(s.actualStartTime) > new Date(s.scheduledStartTime.getTime() + 10*60000)) teacherStatus = 'حضر متأخراً';

        let studentAttendanceText = 'لم يسجل بعد';
        if (s.attendances && s.attendances.length > 0) {
           if (absent === 0) studentAttendanceText = 'حضور كامل';
           else studentAttendanceText = `تغيب ${absent} طلاب`;
        }

        return {
          id: s.id,
          courseName: (s.cohort?.courseId ? courseMap.get(s.cohort.courseId) : null) || 'مادة غير محددة',
          cohortName: s.cohort?.name,
          teacherId: s.teacherId,
          teacherName: `أ. ${s.teacher?.firstName || ''} ${s.teacher?.lastName || ''}`.trim(),
          studentAttendanceText,
          teacherStatus,
          isAbsent: absent > 0
        };
      })
    };
  }

  @Get(':id/attendance')
  async getSessionAttendance(@Param('id') sessionId: string) {
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

  constructor(private readonly prisma: PrismaService) {}

  @Post('bulk-schedule')
  async bulkScheduleSessions(@Req() req: any, @Body() body: { cohortId: string; lessonIds: string[]; daysOfWeek: number[]; startTime: string; startDate: string }) {
    const teacherId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    
    const { cohortId, lessonIds, daysOfWeek, startTime, startDate } = body;
    if (!cohortId || !lessonIds?.length || !daysOfWeek?.length || !startTime || !startDate) {
        throw new Error('Missing required fields');
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    let currentDate = new Date(startDate);
    currentDate.setHours(hours, minutes, 0, 0);

    const sessions = [];
    
    for (const lessonId of lessonIds) {
      while (!daysOfWeek.includes(currentDate.getDay())) {
         currentDate.setDate(currentDate.getDate() + 1);
      }
      
      const lesson = await this.prisma.curriculumLesson.findUnique({ where: { id: lessonId } });
      const title = lesson ? lesson.title : 'جلسة مجدولة';

      const scheduledStartTime = new Date(currentDate);
      const scheduledEndTime = new Date(currentDate.getTime() + 45 * 60 * 1000);

      sessions.push(await this.prisma.session.create({
        data: {
          title: 'جلسة مباشرة: ' + title,
          lessonId,
          cohortId,
          teacherId,
          status: 'scheduled',
          scheduledStartTime,
          scheduledEndTime
        }
      }));

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return sessions;
  }

  @Post()
  async createSession(
    @Req() req: any,
    @Body() body: { lessonId: string; title: string; cohortId?: string; scheduledStartTime?: string }
  ) {
    const teacherId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';

    let cohortId = body.cohortId;
    if (!cohortId) {
      const cohort = await this.prisma.cohort.findFirst();
      if (cohort) cohortId = cohort.id;
    }
    if (!cohortId) cohortId = '22222222-2222-2222-2222-222222222222'; // mock

    return this.prisma.session.create({
      data: {
        title: body.title || 'حصة ذكية جديدة',
        lessonId: body.lessonId,
        curriculumSessionId: null,
        cohortId,
        teacherId,
        status: 'scheduled',
        scheduledStartTime: body.scheduledStartTime ? new Date(body.scheduledStartTime) : new Date(),
        scheduledEndTime: body.scheduledStartTime ? new Date(new Date(body.scheduledStartTime).getTime() + 45 * 60 * 1000) : new Date(Date.now() + 45 * 60 * 1000) // 45 min
      }
    });
  }

  @Get('student/me')
  async getStudentSessions(@Req() req: any) {
    const studentId = req.user?.id || req.user?.userId || '33333333-3333-3333-3333-333333333333';
    
    const enrollments = await this.prisma.cohortEnrollment.findMany({
      where: { studentId }
    });
    const cohortIds = enrollments.map((e: any) => e.cohortId);

    if (cohortIds.length === 0) {
       return this.prisma.session.findMany({
          orderBy: { scheduledStartTime: 'desc' },
          take: 3,
          include: { cohort: true }
       });
    }

    return this.prisma.session.findMany({
      where: { cohortId: { in: cohortIds } },
      orderBy: { scheduledStartTime: 'desc' },
      include: { cohort: true }
    });
  }

  @Get()
  async getSessions(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    const role = req.user?.primaryRole || 'teacher';

    let whereClause: any = {};
    if (role === 'teacher') {
      whereClause = { teacherId: userId };
    } else if (role === 'supervisor' || role === 'subject_supervisor') {
      whereClause = {
        cohort: {
          course: {
            subject: {
              supervisors: { some: { id: userId } }
            }
          }
        }
      };
    } else if (role === 'super_admin' || role === 'admin') {
      whereClause = {};
    } else {
       whereClause = { id: 'none' };
    }

    return this.prisma.session.findMany({
      where: whereClause,
      orderBy: { scheduledStartTime: 'desc' },
      include: { cohort: true, teacher: true }
    });
  }

  @Post('clear/:cohortId')
  async clearSessions(@Req() req: any, @Param('cohortId') cohortId: string) {
    const userId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    let whereClause: any = { cohortId };
    
    if (cohortId === 'all') {
      whereClause = { teacherId: userId };
    } else {
      whereClause.teacherId = userId;
    }

    return this.prisma.session.deleteMany({
      where: whereClause
    });
  }

  @Delete(':id')
  async deleteSession(@Req() req: any, @Param('id') id: string) {
    return this.prisma.session.delete({
      where: { id }
    });
  }

  @Patch(':id')
  async updateSession(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const data: any = {};
    if (body.title) data.title = body.title;
    if (body.scheduledStartTime) {
      data.scheduledStartTime = new Date(body.scheduledStartTime);
      data.scheduledEndTime = new Date(new Date(body.scheduledStartTime).getTime() + 45 * 60 * 1000);
    }

    return this.prisma.session.update({
      where: { id },
      data
    });
  }
}
