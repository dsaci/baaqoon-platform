import { Controller, Get, Param, UseGuards, Query, Req, Post, Body } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';

function getCurrentAcademicPacing() {
  const now = new Date();
  const m = now.getMonth();
  let semester = 1;
  let monthIndex = 2; // Default to October (month 2 of semester 1)
  let monthNameAr = 'أكتوبر';

  if (m === 8) {
    semester = 1; monthIndex = 1; monthNameAr = 'سبتمبر';
  } else if (m === 9) {
    semester = 1; monthIndex = 2; monthNameAr = 'أكتوبر';
  } else if (m === 10) {
    semester = 1; monthIndex = 3; monthNameAr = 'نوفمبر';
  } else if (m === 11) {
    semester = 1; monthIndex = 4; monthNameAr = 'ديسمبر';
  } else if (m === 1) {
    semester = 2; monthIndex = 1; monthNameAr = 'فبراير';
  } else if (m === 2) {
    semester = 2; monthIndex = 2; monthNameAr = 'مارس';
  } else if (m === 3) {
    semester = 2; monthIndex = 3; monthNameAr = 'إبريل';
  } else if (m === 4) {
    semester = 2; monthIndex = 4; monthNameAr = 'مايو';
  } else {
    semester = 1; monthIndex = 2; monthNameAr = 'أكتوبر';
  }

  const weekOfMonth = Math.min(4, Math.max(1, Math.ceil(now.getDate() / 7)));
  const expectedSessions = ((monthIndex - 1) * 4) + weekOfMonth;

  return { semester, monthIndex, monthNameAr, weekOfMonth, expectedSessions };
}

@Controller('syllabus')
@UseGuards(JwtAuthGuard)
export class SyllabusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDistributions(@Query('courseId') courseId?: string, @Query('academicYear') academicYear?: string) {
    const whereClause: any = {};
    if (courseId) whereClause.courseId = courseId;
    if (academicYear) whereClause.academicYear = academicYear;
    
    const distributions = await this.prisma.syllabusDistribution.findMany({
      where: whereClause,
      include: {
        course: {
          select: { title: true, code: true, curriculumType: true, gradeLevel: true, subjectId: true }
        },
        months: {
          orderBy: [
            { semester: 'asc' },
            { monthIndex: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return distributions;
  }

  @Get('accountability/teacher')
  async getTeacherAccountability(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const pacing = getCurrentAcademicPacing();

    // Find cohorts taught by this teacher
    let cohorts = await this.prisma.cohort.findMany({
      where: {
        instructors: { some: { teacherId: userId } }
      },
      include: {
        enrollments: { select: { studentId: true } }
      }
    });

    // Fallback if teacher is newly created or viewing demo
    if (cohorts.length === 0) {
      cohorts = await this.prisma.cohort.findMany({
        take: 2,
        include: {
          enrollments: { select: { studentId: true } }
        }
      });
    }

    const cohortReports = [];

    for (const cohort of cohorts) {
      const course = await this.prisma.course.findUnique({
        where: { id: cohort.courseId },
        include: {
          distributions: {
            include: {
              months: true
            }
          }
        }
      });

      const dist = course?.distributions?.[0];
      const currentMonthPlan = dist?.months?.find(
        m => m.semester === pacing.semester && m.monthIndex === pacing.monthIndex
      );

      // Sessions in this cohort
      const sessions = await this.prisma.session.findMany({
        where: { cohortId: cohort.id }
      });

      const completedCount = sessions.filter(s => s.status === 'completed').length;
      const scheduledCount = sessions.filter(s => s.status === 'scheduled').length;
      
      const delay = pacing.expectedSessions - completedCount;
      let status: 'on_track' | 'ahead' | 'slight_delay' | 'delayed' = 'on_track';
      let statusText = 'ملتزم بالخطة الزمنية الرسمية';
      let statusColor = 'text-emerald-600 dark:text-emerald-400';
      let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300';

      if (delay > 2) {
        status = 'delayed';
        statusText = `متأخر بـ ${delay} حصص عن الخطة الشهرية المعتمدة`;
        statusColor = 'text-rose-600 dark:text-rose-400';
        badgeBg = 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300';
      } else if (delay > 0) {
        status = 'slight_delay';
        statusText = `تأخر طفيف (متبقي ${delay} حصة للوصول للمعدل المطلوب)`;
        statusColor = 'text-amber-600 dark:text-amber-400';
        badgeBg = 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300';
      } else if (delay < 0) {
        status = 'ahead';
        statusText = `متقدم في المنهاج بمقدار ${Math.abs(delay)} حصة`;
        statusColor = 'text-blue-600 dark:text-blue-400';
        badgeBg = 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300';
      }

      cohortReports.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        courseId: course?.id,
        courseTitle: course?.title || 'مادة غير محددة',
        totalStudents: cohort.enrollments.length,
        currentPacing: {
          semester: pacing.semester,
          monthNameAr: pacing.monthNameAr,
          weekOfMonth: pacing.weekOfMonth,
          expectedSessions: pacing.expectedSessions,
          completedSessions: completedCount,
          scheduledSessions: scheduledCount,
          delaySessions: delay > 0 ? delay : 0,
          status,
          statusText,
          statusColor,
          badgeBg,
          currentMonthTopics: currentMonthPlan?.topics || 'مراجعة وتطبيقات مستمرة للمنهاج',
          isExamPeriod: currentMonthPlan?.isExamPeriod || false
        },
        actionRequired: delay > 0 
          ? `يجب برمجة حصة في جدول هذا الأسبوع لتعويض الدروس المستهدفة في شهر ${pacing.monthNameAr}.`
          : `أنت تسير وفق الخطة المقررة تماماً لشهر ${pacing.monthNameAr}. واصل المتابعة والتطبيق.`
      });
    }

    return {
      pacingInfo: pacing,
      reports: cohortReports
    };
  }

  @Get('accountability/supervisor')
  async getSupervisorAccountability(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(role)) {
      throw new Error('Unauthorized');
    }

    const pacing = getCurrentAcademicPacing();
    let supervisedSubjectId: string | null = null;

    if (role === 'subject_supervisor') {
      const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
      supervisedSubjectId = user?.supervisedSubjectId || null;
    }

    let cohorts = await this.prisma.cohort.findMany({
      include: {
        instructors: {
          include: {
            cohort: false
          }
        },
        enrollments: { select: { studentId: true } }
      }
    });

    // If supervisor, filter cohorts by their subject
    if (supervisedSubjectId) {
      const subjectCourses = await this.prisma.course.findMany({
        where: { subjectId: supervisedSubjectId },
        select: { id: true }
      });
      const validCourseIds = subjectCourses.map(c => c.id);
      cohorts = cohorts.filter(c => validCourseIds.includes(c.courseId));
    }

    const allTeachers = await this.prisma.user.findMany({
      where: { primaryRole: 'teacher' },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    const teacherMap = new Map(allTeachers.map(t => [t.id, t]));

    const reports = [];

    for (const cohort of cohorts) {
      const course = await this.prisma.course.findUnique({
        where: { id: cohort.courseId },
        include: {
          distributions: {
            include: { months: true }
          }
        }
      });

      const dist = course?.distributions?.[0];
      const currentMonthPlan = dist?.months?.find(
        m => m.semester === pacing.semester && m.monthIndex === pacing.monthIndex
      );

      const teacherId = cohort.instructors[0]?.teacherId;
      const teacher = teacherId ? teacherMap.get(teacherId) : null;

      const sessions = await this.prisma.session.findMany({
        where: { cohortId: cohort.id }
      });

      const completedCount = sessions.filter(s => s.status === 'completed').length;
      const delay = pacing.expectedSessions - completedCount;

      let status: 'on_track' | 'ahead' | 'slight_delay' | 'delayed' = 'on_track';
      if (delay > 2) status = 'delayed';
      else if (delay > 0) status = 'slight_delay';
      else if (delay < 0) status = 'ahead';

      reports.push({
        cohortId: cohort.id,
        cohortName: cohort.name,
        courseTitle: course?.title || 'مادة غير محددة',
        teacherId: teacher?.id || null,
        teacherName: teacher ? `أ. ${teacher.firstName} ${teacher.lastName}` : 'غير مسند',
        teacherEmail: teacher?.email || '',
        studentCount: cohort.enrollments.length,
        expectedSessions: pacing.expectedSessions,
        completedSessions: completedCount,
        delaySessions: delay > 0 ? delay : 0,
        status,
        currentMonthTopics: currentMonthPlan?.topics || 'الموضوعات المقررة',
        monthNameAr: pacing.monthNameAr
      });
    }

    const totalCohorts = reports.length;
    const delayedCount = reports.filter(r => r.status === 'delayed' || r.status === 'slight_delay').length;
    const onTrackCount = totalCohorts - delayedCount;
    const adherenceRate = totalCohorts > 0 ? Math.round((onTrackCount / totalCohorts) * 100) : 100;

    return {
      pacingInfo: pacing,
      summary: {
        totalCohorts,
        onTrackCount,
        delayedCount,
        adherenceRate
      },
      reports
    };
  }

  @Post('accountability/warn-teacher')
  async sendAccountabilityWarning(@Req() req: any, @Body() body: { teacherId: string; cohortId: string; cohortName: string; delaySessions: number; monthNameAr: string }) {
    const sender = req.user;
    const { teacherId, cohortId, cohortName, delaySessions, monthNameAr } = body;
    if (!teacherId) throw new Error('Teacher ID is required');

    const warningTitle = `إنذار إشرافي: تأخر في خطة المنهاج لشهر ${monthNameAr}`;
    const warningBody = `نلفت عنايتكم إلى وجود تأخر بـ ${delaySessions} حصص عن الخطة المعتمدة في فوج "${cohortName}". يرجى إدراج الحصص المستحقة في جدولك الأسبوعي لتعويض الخطة وتجنب تراكم الدروس على الطلاب.`;

    const notification = await this.prisma.notification.create({
      data: {
        userId: teacherId,
        title: warningTitle,
        body: warningBody,
        actionUrl: '/teacher/schedule',
        type: 'system'
      }
    });

    if (sender?.id) {
      await this.prisma.activityLog.create({
        data: {
          userId: sender.id,
          action: 'SUPERVISOR_SYLLABUS_WARNING',
          details: JSON.stringify({ teacherId, cohortId, delaySessions, monthNameAr })
        }
      }).catch(() => {});
    }

    return { success: true, notificationId: notification.id };
  }
}
