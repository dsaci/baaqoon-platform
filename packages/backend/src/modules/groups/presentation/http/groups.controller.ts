import { Controller, Get, Req, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('groups')
export class GroupsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('admin/data')
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
  }

  @Get('admin/stats')
  async getAdminStats() {
    const teachers = await this.prisma.user.count({ where: { primaryRole: 'teacher' } });
    const students = await this.prisma.user.count({ where: { primaryRole: 'student' } });
    const cohorts = await this.prisma.cohort.count();
    const activeSessions = await this.prisma.session.count({ where: { status: 'scheduled' } });

    const recentTeachers = await this.prisma.user.findMany({
      where: { primaryRole: 'teacher' },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const recentCohorts = await this.prisma.cohort.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        instructors: true,
        enrollments: true
      }
    });

    for (const cohort of recentCohorts) {
      for (const instructor of cohort.instructors) {
        const teacher = await this.prisma.user.findUnique({ where: { id: instructor.teacherId }, select: { firstName: true, lastName: true } });
        (instructor as any).teacher = teacher;
      }
    }

    return {
      stats: { teachers, students, cohorts, activeSessions },
      recentTeachers,
      recentCohorts
    };
  }

  @Get('supervisor/stats')
  async getSupervisorStats(@Req() req: any) {
    const totalCohorts = await this.prisma.cohort.count();
    const totalStudents = await this.prisma.cohortEnrollment.count();
    const recentAssessments = await this.prisma.assessment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { cohort: true }
    });
    return {
      totalCohorts,
      totalStudents,
      totalTeachers: 5,
      recentAssessments
    };
  }

  @Get('cohorts/me')
  async getMyCohorts(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    const role = req.user?.primaryRole || 'teacher';

    let whereClause: any = {};
    if (role === 'teacher') {
      whereClause = { instructors: { some: { teacherId: userId } } };
    } else if (role === 'supervisor' || role === 'subject_supervisor') {
      whereClause = {
        course: {
          subject: {
            supervisors: { some: { id: userId } }
          }
        }
      };
    } else if (role === 'super_admin' || role === 'admin') {
      whereClause = {}; // Admin gets all cohorts
    } else if (role === 'student') {
      whereClause = { enrollments: { some: { studentId: userId } } };
    }

    return this.prisma.cohort.findMany({
      where: whereClause,
      include: {
        enrollments: true
      }
    });
  }

  @Post('cohorts')
  async createCohort(@Body() body: any, @Req() req: any) {
    const userId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    const { name, code, courseId, curriculumVersionId, studentIds, teacherId } = body;

    const assignedTeacherId = teacherId || userId;

    const cohort = await this.prisma.cohort.create({
      data: {
        name,
        code,
        courseId,
        curriculumVersionId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdById: userId,
        instructors: {
          create: [{ teacherId: assignedTeacherId, role: 'primary_teacher' }]
        }
      }
    });

    if (studentIds && studentIds.length > 0) {
      await this.prisma.cohortEnrollment.createMany({
        data: studentIds.map((id: string) => ({
          cohortId: cohort.id,
          studentId: id,
          status: 'active'
        }))
      });
    }

    return cohort;
  }
  @Get('cohorts/:id/progress')
  async getCohortProgress(@Param('id') id: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id },
      include: {
        curriculumVersion: {
          include: {
            units: {
              include: {
                lessons: { orderBy: { orderIndex: 'asc' } }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        },
        sessions: {
          where: { lessonId: { not: null } }
        }
      }
    });

    if (!cohort || !cohort.curriculumVersion) return { units: [] };

    // Calculate progress
    const completedLessonIds = new Set(
      cohort.sessions
        .filter(s => s.status === 'completed' || new Date(s.scheduledStartTime) < new Date())
        .map(s => s.lessonId)
    );

    const progress = cohort.curriculumVersion.units.map(unit => {
      const lessons = unit.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        isCompleted: completedLessonIds.has(lesson.id)
      }));
      const isFullyCompleted = lessons.length > 0 && lessons.every(l => l.isCompleted);
      const isPartiallyCompleted = lessons.some(l => l.isCompleted) && !isFullyCompleted;

      return {
        id: unit.id,
        title: unit.title,
        status: isFullyCompleted ? 'completed' : isPartiallyCompleted ? 'in_progress' : 'pending',
        lessons
      };
    });

    return { 
      cohortId: cohort.id,
      cohortName: cohort.name,
      units: progress 
    };
  }
}
