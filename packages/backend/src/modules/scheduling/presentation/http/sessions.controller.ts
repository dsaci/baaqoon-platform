import { Controller, Post, Body, Req, Get, Param, Delete, Patch } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('sessions')
export class SessionsController {
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
