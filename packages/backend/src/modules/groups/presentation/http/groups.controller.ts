import { Controller, Get, Req, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
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

  @Get('admin/database')
  async getAdminDatabase() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, primaryRole: true, status: true, createdAt: true }
    });
    const subjects = await this.prisma.subject.findMany({
      include: { courses: true }
    });
    const cohorts = await this.prisma.cohort.findMany({
      include: {
        instructors: true,
        enrollments: true
      }
    });
    const courses = await this.prisma.course.findMany({
      include: { subject: { select: { nameAr: true } } }
    });
    return { users, subjects, cohorts, courses };
  }

  @Get('admin/stats')
  async getAdminStats() {
    const teachers = await this.prisma.user.count({ where: { primaryRole: 'teacher' } });
    const students = await this.prisma.user.count({ where: { primaryRole: 'student' } });
    const cohorts = await this.prisma.cohort.count();
    const activeSessions = await this.prisma.session.count({ where: { status: 'scheduled' } });
    const pendingUsers = await this.prisma.user.count({ where: { status: 'pending' } });

    const recentCohorts = await this.prisma.cohort.findMany({
      orderBy: { createdAt: 'desc' },
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
      stats: { teachers, students, cohorts, activeSessions, pendingUsers },
      recentCohorts
    };
  }

  @Get('supervisor/hr')
  async getSupervisorHR(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const role = user?.primaryRole;
    
    let subjectFilter = {};
    if (role === 'subject_supervisor') {
      if (!user?.supervisedSubjectId) return { teachers: [], students: [] };
      subjectFilter = { subjectId: user.supervisedSubjectId };
    }

    const courses = await this.prisma.course.findMany({
      where: subjectFilter,
      select: { id: true }
    });
    const courseIds = courses.map(c => c.id);

    const cohorts = await this.prisma.cohort.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true }
    });
    const cohortIds = cohorts.map(c => c.id);

    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohortIds } },
      select: { teacherId: true }
    });
    const teacherIds = [...new Set(instructors.map(i => i.teacherId))];

    const enrollments = await this.prisma.cohortEnrollment.findMany({
      where: { cohortId: { in: cohortIds } },
      select: { studentId: true }
    });
    const studentIds = [...new Set(enrollments.map(e => e.studentId))];

    const teachers = await this.prisma.user.findMany({
      where: { id: { in: teacherIds }, primaryRole: 'teacher' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds }, primaryRole: 'student' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    return { teachers, students };
  }

  @Get('supervisor/stats')
  async getSupervisorStats(@Req() req: any) {
    const userId = req.user.id || req.user.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const role = user?.primaryRole;
    
    let subjectFilter = {};
    let supervisedSubject = null;

    if (role === 'subject_supervisor') {
      if (user?.supervisedSubjectId) {
        subjectFilter = { subjectId: user.supervisedSubjectId };
        supervisedSubject = await this.prisma.subject.findUnique({ where: { id: user.supervisedSubjectId } });
      }
    }

    const courses = await this.prisma.course.findMany({
      where: subjectFilter,
      select: { id: true }
    });
    const courseIds = courses.map(c => c.id);

    const totalCohorts = await this.prisma.cohort.count({ where: { courseId: { in: courseIds } } });
    
    const cohorts = await this.prisma.cohort.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true }
    });
    const cohortIds = cohorts.map(c => c.id);

    const totalStudents = await this.prisma.cohortEnrollment.count({ where: { cohortId: { in: cohortIds } } });
    
    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohortIds } },
      select: { teacherId: true }
    });
    const totalTeachers = new Set(instructors.map(i => i.teacherId)).size;

    const recentAssessments = await this.prisma.assessment.findMany({
      where: { cohortId: { in: cohortIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { cohort: true }
    });
    
    return {
      supervisedSubject,
      totalCohorts,
      totalStudents,
      totalTeachers,
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
    } else if (role === 'subject_supervisor') {
      const courses = await this.prisma.course.findMany({
        where: {
          subject: {
            supervisors: { some: { id: userId } }
          }
        },
        select: { id: true }
      });
      const courseIds = courses.map(c => c.id);
      whereClause = { courseId: { in: courseIds } };
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

  @Get('supervisor/progress')
  async getSupervisorProgress(@Req() req: any) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
      const role = user?.primaryRole;
      
      let subjectFilter = {};
      if (role === 'subject_supervisor') {
        if (!user?.supervisedSubjectId) return [];
        subjectFilter = { subjectId: user.supervisedSubjectId };
      } else if (role !== 'admin' && role !== 'super_admin') {
        return { error: 'Unauthorized' };
      }

      const courses = await this.prisma.course.findMany({
        where: subjectFilter,
        select: { id: true }
      });
      const courseIds = courses.map(c => c.id);

      const cohorts = await this.prisma.cohort.findMany({
        where: { courseId: { in: courseIds } },
        include: {
          instructors: true,
          sessions: {
            where: { lessonId: { not: null } }
          }
        }
      });

      const results = [];
      for (const cohort of cohorts) {
        const curriculumVersion = await this.prisma.curriculumVersion.findUnique({
          where: { id: cohort.curriculumVersionId },
          include: { units: { include: { lessons: true } } }
        });
        
        let totalLessons = 0;
        if (curriculumVersion) {
          curriculumVersion.units.forEach((u: any) => totalLessons += u.lessons.length);
        }

        const completedLessons = new Set(
          cohort.sessions
            .filter((s: any) => s.status === 'completed' || new Date(s.scheduledEndTime || s.scheduledStartTime) < new Date())
            .map((s: any) => s.lessonId)
        ).size;

        const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
        
        let teacherName = 'غير محدد';
        if (cohort.instructors.length > 0) {
          const teacher = await this.prisma.user.findUnique({
            where: { id: cohort.instructors[0].teacherId },
            select: { firstName: true, lastName: true }
          });
          if (teacher) {
            teacherName = `${teacher.firstName} ${teacher.lastName}`;
          }
        }

        results.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          teacherName,
          totalLessons,
          completedLessons,
          percentage
        });
      }

      return results;
    } catch (error) {
      console.error('Error in getSupervisorProgress:', error);
      throw error;
    }
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
        sessions: {
          where: { lessonId: { not: null } }
        }
      }
    });

    if (!cohort) return { units: [] };

    const curriculumVersion = await this.prisma.curriculumVersion.findUnique({
      where: { id: cohort.curriculumVersionId },
      include: {
        units: {
          include: {
            lessons: { orderBy: { orderIndex: 'asc' } }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!curriculumVersion) return { units: [] };

    // Calculate progress
    const completedLessonIds = new Set(
      cohort.sessions
        .filter(s => s.status === 'completed' || new Date(s.scheduledStartTime) < new Date())
        .map(s => s.lessonId)
    );

    const progress = curriculumVersion.units.map(unit => {
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
  @Post('requests')
  async createCohortRequest(@Req() req: any, @Body() body: any) {
    const userId = req.user.id || req.user.userId;
    return this.prisma.cohortRequest.create({
      data: {
        teacherId: userId,
        subjectId: body.subjectId,
        suggestedName: body.suggestedName,
        expectedStudents: parseInt(body.expectedStudents, 10),
        notes: body.notes,
        status: 'pending'
      }
    });
  }

  @Get('requests')
  async getCohortRequests(@Req() req: any) {
    const role = req.user.primaryRole;
    if (role === 'admin' || role === 'super_admin') {
      return this.prisma.cohortRequest.findMany({
        include: {
          teacher: { select: { firstName: true, lastName: true } },
          subject: { select: { nameAr: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const userId = req.user.id || req.user.userId;
      return this.prisma.cohortRequest.findMany({
        where: { teacherId: userId },
        include: { subject: { select: { nameAr: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
  }

  @Patch('requests/:id/status')
  async updateCohortRequestStatus(@Param('id') id: string, @Body() body: { status: string, rejectionReason?: string }) {
    return this.prisma.cohortRequest.update({
      where: { id },
      data: {
        status: body.status as any,
        rejectionReason: body.rejectionReason
      }
    });
  }

  @Delete('cohorts/:id')
  async deleteCohort(@Req() req: any, @Param('id') id: string) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    // Prisma cascade or manual delete
    await this.prisma.cohortInstructor.deleteMany({ where: { cohortId: id } });
    await this.prisma.cohortEnrollment.deleteMany({ where: { cohortId: id } });
    await this.prisma.session.deleteMany({ where: { cohortId: id } });
    await this.prisma.assessment.deleteMany({ where: { cohortId: id } });
    
    return this.prisma.cohort.delete({ where: { id } });
  }
}
