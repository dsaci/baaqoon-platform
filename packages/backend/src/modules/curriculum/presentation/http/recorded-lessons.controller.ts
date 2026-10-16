import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('curriculum/recorded-lessons')
@UseGuards(JwtAuthGuard)
export class RecordedLessonsController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: extract client IP
   */
  private getClientIp(req: any): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || '127.0.0.1';
  }

  /**
   * Get cascaded form options for teacher/supervisor to publish a recorded lesson
   */
  @Get('form-options')
  async getFormOptions(@Req() req: any) {
    const user = req.user;
    const role = user.primaryRole;
    const isStaff = ['teacher', 'subject_supervisor', 'admin', 'super_admin'].includes(role);
    if (!isStaff) {
      throw new ForbiddenException('غير مصرح لك بالوصول لخيارات رفع الدروس المسجلة');
    }

    // 1. Fetch available subjects
    let subjects: any[] = [];
    if (role === 'super_admin' || role === 'admin') {
      subjects = await this.prisma.subject.findMany({
        where: { isActive: true },
        orderBy: { nameAr: 'asc' },
        select: { id: true, nameAr: true, code: true }
      });
    } else if (role === 'subject_supervisor') {
      // Get all subjects this supervisor coordinates
      const supervisorSubjects: any[] = await this.prisma.$queryRawUnsafe(`
        SELECT DISTINCT s.id, s."nameAr", s.code
        FROM curriculum.subjects s
        JOIN users.supervisor_subjects ss ON ss.subject_id = s.id
        WHERE ss.user_id = $1::uuid AND s."isActive" = true
      `, user.id);

      if (supervisorSubjects.length > 0) {
        subjects = supervisorSubjects;
      } else if (user.supervisedSubjectId) {
        const sub = await this.prisma.subject.findUnique({
          where: { id: user.supervisedSubjectId },
          select: { id: true, nameAr: true, code: true }
        });
        if (sub) subjects = [sub];
      }
    } else {
      // Regular teacher: their teaching subject
      if (user.supervisedSubjectId) {
        const sub = await this.prisma.subject.findUnique({
          where: { id: user.supervisedSubjectId },
          select: { id: true, nameAr: true, code: true }
        });
        if (sub) subjects = [sub];
      }
    }

    const subjectIds = subjects.map(s => s.id);

    // 2. Fetch cohorts
    let cohorts: any[] = [];
    if (role === 'super_admin' || role === 'admin') {
      cohorts = await this.prisma.cohort.findMany({
        where: { status: 'active' },
        select: { id: true, name: true, code: true, courseId: true },
        orderBy: { name: 'asc' }
      });
    } else if (role === 'subject_supervisor') {
      const courses = await this.prisma.course.findMany({
        where: { subjectId: { in: subjectIds } },
        select: { id: true }
      });
      cohorts = await this.prisma.cohort.findMany({
        where: { courseId: { in: courses.map(c => c.id) }, status: 'active' },
        select: { id: true, name: true, code: true, courseId: true },
        orderBy: { name: 'asc' }
      });
    } else {
      // Teacher: cohorts they instruct
      const myInstructed = await this.prisma.cohortInstructor.findMany({
        where: { teacherId: user.id },
        select: { cohortId: true }
      });
      cohorts = await this.prisma.cohort.findMany({
        where: { id: { in: myInstructed.map(i => i.cohortId) } },
        select: { id: true, name: true, code: true, courseId: true },
        orderBy: { name: 'asc' }
      });
    }

    // Map course to subject so frontend can filter cohorts by subject
    const courseIds = Array.from(new Set(cohorts.map(c => c.courseId).filter(Boolean)));
    const courses = await this.prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, subjectId: true }
    });
    const courseSubjectMap = new Map(courses.map(c => [c.id, c.subjectId]));
    const cohortsWithSubject = cohorts.map(c => ({
      ...c,
      subjectId: courseSubjectMap.get(c.courseId) || null
    }));

    // 3. Fetch Units & Lessons for these subjects
    const curriculumCourses = await this.prisma.course.findMany({
      where: { subjectId: { in: subjectIds } },
      include: {
        versions: {
          include: {
            units: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lessons: {
                  orderBy: { orderIndex: 'asc' },
                  select: { id: true, title: true, orderIndex: true, unitId: true }
                }
              }
            }
          }
        }
      }
    });

    const curriculumTree: any[] = [];
    for (const c of curriculumCourses) {
      for (const cv of c.versions) {
        for (const u of cv.units) {
          curriculumTree.push({
            unitId: u.id,
            unitTitle: u.title,
            subjectId: c.subjectId,
            lessons: u.lessons
          });
        }
      }
    }

    // 4. Recent sessions
    let recentSessions: any[] = [];
    if (role === 'teacher') {
      recentSessions = await this.prisma.session.findMany({
        where: { teacherId: user.id },
        select: { id: true, title: true, scheduledStartTime: true, cohortId: true },
        orderBy: { scheduledStartTime: 'desc' },
        take: 15
      });
    }

    return {
      subjects,
      cohorts: cohortsWithSubject,
      curriculumTree,
      recentSessions
    };
  }

  /**
   * Create & Publish a recorded lesson with instant student notification
   */
  @Post()
  async createRecordedLesson(@Req() req: any, @Body() body: any) {
    const user = req.user;
    const role = user.primaryRole;
    const isStaff = ['teacher', 'subject_supervisor', 'admin', 'super_admin'].includes(role);
    if (!isStaff) {
      throw new ForbiddenException('غير مصرح لك بنشر دروس مسجلة');
    }

    if (!body.title || !body.title.trim()) {
      throw new BadRequestException('عنوان الدرس مطلوب');
    }
    if (!body.subjectId) {
      throw new BadRequestException('المادة الدراسية مطلوبة');
    }
    if (!body.mediaUrl || !body.mediaUrl.trim()) {
      throw new BadRequestException('رابط المحتوى أو الفيديو مطلوب');
    }

    const isGlobalSubject = !body.cohortId || body.cohortId === 'all';
    const cohortId = isGlobalSubject ? null : body.cohortId;

    const recordedLesson = await this.prisma.recordedLesson.create({
      data: {
        title: body.title.trim(),
        description: body.description?.trim() || null,
        subjectId: body.subjectId,
        cohortId,
        lessonId: body.lessonId || null,
        sessionId: body.sessionId || null,
        createdById: user.id,
        mediaType: body.mediaType || 'youtube',
        mediaUrl: body.mediaUrl.trim(),
        attachmentUrl: body.attachmentUrl?.trim() || null,
        attachmentName: body.attachmentName?.trim() || null,
        isGlobalSubject
      },
      include: {
        subject: { select: { id: true, nameAr: true } },
        cohort: { select: { id: true, name: true } },
        lesson: { select: { id: true, title: true } }
      }
    });

    // 1. Activity Log
    try {
      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'CREATE_RECORDED_LESSON',
          details: `نشر درس مسجل جديد: "${body.title}" (${recordedLesson.subject?.nameAr || ''})`
        }
      });
    } catch (_) {}

    // 2. Automated Student Notification Engine
    let notifiedCount = 0;
    if (body.notifyStudents !== false) {
      try {
        let targetStudentIds: string[] = [];

        if (cohortId) {
          // Specific cohort: notify all enrolled students
          const enrollments = await this.prisma.cohortEnrollment.findMany({
            where: { cohortId, status: 'enrolled' },
            select: { studentId: true }
          });
          targetStudentIds = enrollments.map(e => e.studentId);
        } else {
          // Global subject scope: find all students enrolled in cohorts for this subject
          const courses = await this.prisma.course.findMany({
            where: { subjectId: body.subjectId },
            select: { id: true }
          });
          const cohorts = await this.prisma.cohort.findMany({
            where: { courseId: { in: courses.map(c => c.id) }, status: 'active' },
            select: { id: true }
          });
          const enrollments = await this.prisma.cohortEnrollment.findMany({
            where: { cohortId: { in: cohorts.map(c => c.id) }, status: 'enrolled' },
            select: { studentId: true }
          });
          targetStudentIds = enrollments.map(e => e.studentId);
        }

        // Deduplicate and filter out creator
        const uniqueStudentIds = Array.from(new Set(targetStudentIds)).filter(id => id !== user.id);

        if (uniqueStudentIds.length > 0) {
          const teacherName = `${user.firstName} ${user.lastName}`;
          const subjectName = recordedLesson.subject?.nameAr || 'المادة';
          const notifTitle = `🎥 درس مسجل جديد: ${body.title.trim()}`;
          const notifBody = `نشر الأستاذ(ة) ${teacherName} تسجيلاً ومحتوى إثرائياً جديداً لمادة ${subjectName}: "${body.title.trim()}". اضغط هنا للمشاهدة وتعويض ما فاتك!`;
          const actionUrl = `/student/dashboard?tab=recorded&lessonId=${recordedLesson.id}`;

          await this.prisma.notification.createMany({
            data: uniqueStudentIds.map(studentId => ({
              userId: studentId,
              title: notifTitle,
              body: notifBody,
              actionUrl,
              type: 'system' as any
            }))
          });

          notifiedCount = uniqueStudentIds.length;
        }
      } catch (notifErr: any) {
        console.error('Error dispatching recorded lesson notifications:', notifErr.message);
      }
    }

    return {
      success: true,
      message: `تم نشر الدرس المسجل بنجاح! وتم إشعار ${notifiedCount} طالباً.`,
      lesson: recordedLesson,
      notifiedCount
    };
  }

  /**
   * List recorded lessons
   */
  @Get()
  async getRecordedLessons(@Req() req: any, @Query() query: any) {
    const user = req.user;
    const role = user.primaryRole;

    if (role === 'student') {
      // Find student's cohorts
      const myEnrollments = await this.prisma.cohortEnrollment.findMany({
        where: { studentId: user.id, status: 'enrolled' },
        select: { cohortId: true }
      });
      const cohortIds = myEnrollments.map(e => e.cohortId);

      // Find subjects of those cohorts
      const cohorts = await this.prisma.cohort.findMany({
        where: { id: { in: cohortIds } },
        select: { courseId: true }
      });
      const courses = await this.prisma.course.findMany({
        where: { id: { in: cohorts.map(c => c.courseId) } },
        select: { subjectId: true }
      });
      const subjectIds = Array.from(new Set(courses.map(c => c.subjectId)));

      const whereClause: any = {
        OR: [
          ...(cohortIds.length > 0 ? [{ cohortId: { in: cohortIds } }] : []),
          ...(subjectIds.length > 0 ? [{ isGlobalSubject: true, subjectId: { in: subjectIds } }] : [])
        ]
      };

      if (query.subjectId) {
        whereClause.subjectId = query.subjectId;
      }

      const lessons = await this.prisma.recordedLesson.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: { select: { id: true, nameAr: true, code: true } },
          cohort: { select: { id: true, name: true, code: true } },
          lesson: { select: { id: true, title: true } },
          creator: { select: { id: true, firstName: true, lastName: true } },
          views: {
            where: { studentId: user.id },
            select: { id: true, pledgeAccepted: true, pledgedAt: true, viewCount: true }
          }
        }
      });

      return lessons.map(l => ({
        ...l,
        isViewed: l.views.length > 0,
        hasAcceptedPledge: l.views.length > 0 && l.views[0].pledgeAccepted,
        viewCount: l.views[0]?.viewCount || 0
      }));
    }

    // Teachers, Supervisors, Admins
    const whereClause: any = {};
    if (query.subjectId) {
      whereClause.subjectId = query.subjectId;
    } else if (role === 'teacher' && user.supervisedSubjectId) {
      whereClause.OR = [
        { createdById: user.id },
        { subjectId: user.supervisedSubjectId }
      ];
    } else if (role === 'subject_supervisor' && user.supervisedSubjectId) {
      whereClause.subjectId = user.supervisedSubjectId;
    }

    if (query.cohortId) {
      whereClause.cohortId = query.cohortId;
    }

    const lessons = await this.prisma.recordedLesson.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: { select: { id: true, nameAr: true, code: true } },
        cohort: { select: { id: true, name: true, code: true } },
        lesson: { select: { id: true, title: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { views: true } }
      }
    });

    return lessons.map(l => ({
      ...l,
      viewsCount: l._count.views
    }));
  }

  /**
   * Record student view and honor pledge agreement
   */
  @Post(':id/view')
  async recordView(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { pledgeAccepted: boolean }
  ) {
    const user = req.user;
    if (user.primaryRole !== 'student') {
      return { success: true };
    }

    const lesson = await this.prisma.recordedLesson.findUnique({
      where: { id }
    });
    if (!lesson) {
      throw new NotFoundException('الدرس المسجل غير موجود');
    }

    const clientIp = this.getClientIp(req);

    const viewRecord = await this.prisma.recordedLessonView.upsert({
      where: {
        recordedLessonId_studentId: {
          recordedLessonId: id,
          studentId: user.id
        }
      },
      create: {
        recordedLessonId: id,
        studentId: user.id,
        pledgeAccepted: body.pledgeAccepted !== false,
        pledgedAt: new Date(),
        ipAddress: clientIp,
        viewCount: 1,
        lastViewedAt: new Date()
      },
      update: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
        ipAddress: clientIp
      }
    });

    return {
      success: true,
      view: viewRecord
    };
  }

  /**
   * Delete recorded lesson (creator, supervisor of subject, or admin)
   */
  @Delete(':id')
  async deleteRecordedLesson(@Req() req: any, @Param('id') id: string) {
    const user = req.user;
    const lesson = await this.prisma.recordedLesson.findUnique({
      where: { id }
    });
    if (!lesson) {
      throw new NotFoundException('الدرس المسجل غير موجود');
    }

    const isCreator = lesson.createdById === user.id;
    const isAdmin = ['admin', 'super_admin'].includes(user.primaryRole);
    const isSubjectSupervisor = user.primaryRole === 'subject_supervisor' && user.supervisedSubjectId === lesson.subjectId;

    if (!isCreator && !isAdmin && !isSubjectSupervisor) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذا الدرس المسجل');
    }

    await this.prisma.recordedLesson.delete({
      where: { id }
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_RECORDED_LESSON',
          details: `حذف الدرس المسجل: "${lesson.title}"`
        }
      });
    } catch (_) {}

    return {
      success: true,
      message: 'تم حذف الدرس المسجل بنجاح'
    };
  }
}
