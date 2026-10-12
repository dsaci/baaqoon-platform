import { Controller, Get, Req, Post, Body, Param, Patch, Delete, UseGuards, Query, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  @Get('activity-logs')
  async getActivityLogs(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (role !== 'admin' && role !== 'super_admin' && role !== 'supervisor' && role !== 'subject_supervisor') {
      return [];
    }
    
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { firstName: true, lastName: true, primaryRole: true } }
      }
    });
  }


  @Get('admin/distribution')
  async getAdminDistribution() {
    const subjects = await this.prisma.subject.findMany({
      orderBy: { nameAr: 'asc' },
      include: {
        supervisors: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    const courses = await this.prisma.course.findMany({
      select: { id: true, subjectId: true }
    });

    const cohorts = await this.prisma.cohort.findMany({
      select: { id: true, courseId: true }
    });

    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohorts.map(c => c.id) } }
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: instructors.map(i => i.teacherId) } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    const formattedSubjects = subjects.map(subject => {
      const subjectCourses = courses.filter(c => c.subjectId === subject.id).map(c => c.id);
      const subjectCohorts = cohorts.filter(c => subjectCourses.includes(c.courseId)).map(c => c.id);
      
      const teachersMap = new Map();
      instructors.filter(inst => subjectCohorts.includes(inst.cohortId)).forEach(inst => {
        const teacher = users.find(u => u.id === inst.teacherId);
        if (teacher) teachersMap.set(teacher.id, teacher);
      });

      return {
        ...subject,
        teachers: Array.from(teachersMap.values())
      };
    });

    const supervisors = await this.prisma.user.findMany({
      where: { primaryRole: 'subject_supervisor' },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    return { subjects: formattedSubjects, supervisors };
  }

  @Patch('admin/distribution/:subjectId/supervisor/:userId')
  async assignSupervisor(@Req() req: any, @Param('subjectId') subjectId: string, @Param('userId') userId: string) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      return { error: 'Unauthorized' };
    }
    
    if (userId === 'none') {
      // Unassign all supervisors from this subject
      await this.prisma.user.updateMany({
        where: { supervisedSubjectId: subjectId, primaryRole: 'subject_supervisor' },
        data: { supervisedSubjectId: null }
      });
      return { success: true };
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { supervisedSubjectId: subjectId }
      });
      return { success: true };
    }
  }

  constructor(private readonly prisma: PrismaService) {}

  @Get('admin/data')
  async getAdminData() {
    const teachers = await this.prisma.user.findMany({
      where: { primaryRole: 'teacher' },
      select: { id: true, firstName: true, lastName: true, email: true, supervisedSubjectId: true }
    });
    const students = await this.prisma.user.findMany({
      where: { primaryRole: 'student' },
      select: { id: true, firstName: true, lastName: true, email: true, academicBranch: true, curriculumType: true, gradeLevel: true }
    });
    const courses = await this.prisma.course.findMany({
      include: {
        subject: { select: { nameAr: true } },
        versions: { where: { isDefault: true }, select: { id: true, versionTag: true } }
      }
    });
    return { teachers, students, courses };
  }

  @Get('admin/database')
  async getAdminDatabase() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, firstName: true, lastName: true, email: true, primaryRole: true, status: true, createdAt: true, supervisedSubjectId: true, academicBranch: true, curriculumType: true, gradeLevel: true }
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
    const supervisors = await this.prisma.user.count({ where: { primaryRole: 'subject_supervisor' } });
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
      stats: { teachers, students, supervisors, cohorts, activeSessions, pendingUsers },
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
      if (user?.supervisedSubjectId) {
        subjectFilter = { subjectId: user.supervisedSubjectId };
      }
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
    const cohortTeacherIds = instructors.map(i => i.teacherId);

    let teacherWhere: any = { primaryRole: 'teacher' };
    if (role === 'subject_supervisor' && user?.supervisedSubjectId) {
      teacherWhere = {
        primaryRole: 'teacher',
        OR: [
          { supervisedSubjectId: user.supervisedSubjectId },
          { id: { in: cohortTeacherIds } }
        ]
      };
    }

    const teachers = await this.prisma.user.findMany({
      where: teacherWhere,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });

    const students = await this.prisma.user.findMany({
      where: { primaryRole: 'student' },
      orderBy: { firstName: 'asc' },
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

    const totalStudents = await this.prisma.user.count({ where: { primaryRole: 'student' } });
    
    const instructors = await this.prisma.cohortInstructor.findMany({
      where: { cohortId: { in: cohortIds } },
      select: { teacherId: true }
    });
    const cohortTeacherIds = instructors.map(i => i.teacherId);

    let totalTeachers = 0;
    if (user?.supervisedSubjectId) {
      const subjectTeachers = await this.prisma.user.findMany({
        where: { primaryRole: 'teacher', supervisedSubjectId: user.supervisedSubjectId },
        select: { id: true }
      });
      totalTeachers = new Set([...subjectTeachers.map(t => t.id), ...cohortTeacherIds]).size;
    } else {
      totalTeachers = await this.prisma.user.count({ where: { primaryRole: 'teacher' } });
    }

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

  @Get('supervisor/subject-teachers')
  async getSupervisorSubjectTeachers(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const userId = req.user?.id || req.user?.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    // Ensure database tables exist
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users.teacher_evaluations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          supervisor_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          teacher_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          evaluation_type VARCHAR(100) NOT NULL DEFAULT 'survey',
          title VARCHAR(200) NOT NULL,
          syllabus_adherence_score INT NOT NULL DEFAULT 5,
          pedagogical_quality_score INT NOT NULL DEFAULT 5,
          student_interaction_score INT NOT NULL DEFAULT 5,
          assessment_quality_score INT NOT NULL DEFAULT 5,
          tech_platform_use_score INT NOT NULL DEFAULT 5,
          overall_score DECIMAL(5,2) NOT NULL DEFAULT 100,
          notes TEXT,
          recommendations TEXT,
          action_plan TEXT,
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS users.teacher_clarifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          supervisor_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          teacher_id UUID NOT NULL REFERENCES users.users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL DEFAULT 'clarification',
          title VARCHAR(200) NOT NULL,
          content TEXT NOT NULL,
          teacher_reply TEXT,
          teacher_replied_at TIMESTAMPTZ(6),
          is_urgent BOOLEAN NOT NULL DEFAULT false,
          status VARCHAR(32) NOT NULL DEFAULT 'sent',
          created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now()
        );
      `);
    } catch (_) {}

    const allSubjects = await this.prisma.subject.findMany({
      where: { isActive: true },
      orderBy: { nameAr: 'asc' },
      select: { id: true, nameAr: true, code: true, iconUrl: true }
    });

    const activeSubjectId = querySubjectId || user.supervisedSubjectId || (allSubjects[0]?.id || null);

    let subjectInfo = null;
    if (activeSubjectId) {
      subjectInfo = await this.prisma.subject.findUnique({
        where: { id: activeSubjectId },
        select: { id: true, nameAr: true, code: true, iconUrl: true }
      });
    }

    let subjectCohortIds: string[] = [];
    if (activeSubjectId) {
      const courses = await this.prisma.course.findMany({
        where: { subjectId: activeSubjectId },
        select: { id: true }
      });
      const cohorts = await this.prisma.cohort.findMany({
        where: { courseId: { in: courses.map(c => c.id) } },
        select: { id: true }
      });
      subjectCohortIds = cohorts.map(c => c.id);
    }

    const cohortInstructors = await this.prisma.cohortInstructor.findMany({
      where: subjectCohortIds.length > 0 ? { cohortId: { in: subjectCohortIds } } : undefined,
      select: { teacherId: true }
    });
    const instructorTeacherIds = cohortInstructors.map(ci => ci.teacherId);

    let teacherWhere: any = { primaryRole: 'teacher' };
    if (activeSubjectId) {
      teacherWhere = {
        primaryRole: 'teacher',
        OR: [
          { supervisedSubjectId: activeSubjectId },
          { id: { in: instructorTeacherIds } }
        ]
      };
    }

    const teachers = await this.prisma.user.findMany({
      where: teacherWhere,
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        nationality: true,
        academicBranch: true,
        curriculumType: true,
        gradeLevel: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        supervisedSubjectId: true,
        supervisedSubject: {
          select: { id: true, nameAr: true, code: true }
        }
      }
    });

    const teachersWithDetails = await Promise.all(teachers.map(async (t) => {
      const myCohortInstructors = await this.prisma.cohortInstructor.findMany({
        where: { teacherId: t.id },
        include: {
          cohort: {
            select: {
              id: true,
              name: true,
              code: true,
              status: true,
              enrollments: { select: { id: true } }
            }
          }
        }
      });
      const cohortsTaught = myCohortInstructors.map(ci => ({
        id: ci.cohort.id,
        name: ci.cohort.name,
        code: ci.cohort.code,
        status: ci.cohort.status,
        studentsCount: ci.cohort.enrollments.length
      }));

      const teacherSessions = await this.prisma.session.findMany({
        where: { teacherId: t.id },
        select: { id: true, status: true, scheduledStartTime: true }
      });
      const totalSessions = teacherSessions.length;
      const completedSessions = teacherSessions.filter(s => s.status === 'completed').length;
      const scheduledSessions = teacherSessions.filter(s => s.status === 'scheduled').length;
      const cancelledSessions = teacherSessions.filter(s => s.status === 'cancelled').length;

      const sessionIds = teacherSessions.map(s => s.id);
      let attendanceRate = 100;
      if (sessionIds.length > 0) {
        const totalAttendances = await this.prisma.sessionAttendance.count({
          where: { sessionId: { in: sessionIds } }
        });
        if (totalAttendances > 0) {
          const presentAttendances = await this.prisma.sessionAttendance.count({
            where: { sessionId: { in: sessionIds }, status: 'present' }
          });
          attendanceRate = Math.round((presentAttendances / totalAttendances) * 100);
        }
      }

      const createdAssessmentsCount = await this.prisma.assessment.count({
        where: { createdById: t.id }
      });
      const gradedSubmissionsCount = await this.prisma.assessmentSubmission.count({
        where: { gradedById: t.id }
      });

      let evaluations: any[] = [];
      try {
        evaluations = await this.prisma.$queryRawUnsafe(`
          SELECT e.id, e.title, e.evaluation_type AS "evaluationType",
                 e.syllabus_adherence_score AS "syllabusAdherenceScore",
                 e.pedagogical_quality_score AS "pedagogicalQualityScore",
                 e.student_interaction_score AS "studentInteractionScore",
                 e.assessment_quality_score AS "assessmentQualityScore",
                 e.tech_platform_use_score AS "techPlatformUseScore",
                 e.overall_score AS "overallScore",
                 e.notes, e.recommendations, e.action_plan AS "actionPlan",
                 e.created_at AS "createdAt",
                 u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
          FROM users.teacher_evaluations e
          LEFT JOIN users.users u ON u.id = e.supervisor_id
          WHERE e.teacher_id = $1::uuid
          ORDER BY e.created_at DESC
        `, t.id);
      } catch (_) {}

      const avgScore = evaluations.length > 0
        ? Math.round(evaluations.reduce((acc, curr) => acc + Number(curr.overallScore || 0), 0) / evaluations.length)
        : null;

      let clarifications: any[] = [];
      try {
        clarifications = await this.prisma.$queryRawUnsafe(`
          SELECT c.id, c.type, c.title, c.content,
                 c.teacher_reply AS "teacherReply",
                 c.teacher_replied_at AS "teacherRepliedAt",
                 c.is_urgent AS "isUrgent",
                 c.status,
                 c.created_at AS "createdAt",
                 u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
          FROM users.teacher_clarifications c
          LEFT JOIN users.users u ON u.id = c.supervisor_id
          WHERE c.teacher_id = $1::uuid
          ORDER BY c.created_at DESC
        `, t.id);
      } catch (_) {}

      return {
        ...t,
        cohortsTaught,
        totalCohorts: cohortsTaught.length,
        metrics: {
          totalSessions,
          completedSessions,
          scheduledSessions,
          cancelledSessions,
          attendanceRate,
          createdAssessmentsCount,
          gradedSubmissionsCount,
          evaluationScore: avgScore,
          evaluationsCount: evaluations.length,
          clarificationsCount: clarifications.length
        },
        recentEvaluations: evaluations.slice(0, 5),
        recentClarifications: clarifications.slice(0, 5)
      };
    }));

    return {
      activeSubject: subjectInfo,
      allSubjects,
      teachers: teachersWithDetails,
      totalCount: teachersWithDetails.length
    };
  }

  @Post('supervisor/teachers/:teacherId/evaluations')
  async createSupervisorEvaluation(
    @Req() req: any,
    @Param('teacherId') teacherId: string,
    @Body() body: any
  ) {
    const supervisorId = req.user?.id || req.user?.userId;
    const {
      evaluationType = 'survey',
      title,
      syllabusAdherenceScore = 5,
      pedagogicalQualityScore = 5,
      studentInteractionScore = 5,
      assessmentQualityScore = 5,
      techPlatformUseScore = 5,
      notes = '',
      recommendations = '',
      actionPlan = ''
    } = body;

    const overallScore = Math.round(
      ((Number(syllabusAdherenceScore) +
        Number(pedagogicalQualityScore) +
        Number(studentInteractionScore) +
        Number(assessmentQualityScore) +
        Number(techPlatformUseScore)) / 25) * 100
    );

    const result = await this.prisma.$queryRawUnsafe(`
      INSERT INTO users.teacher_evaluations (
        supervisor_id, teacher_id, evaluation_type, title,
        syllabus_adherence_score, pedagogical_quality_score,
        student_interaction_score, assessment_quality_score,
        tech_platform_use_score, overall_score, notes, recommendations, action_plan
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING id, title, created_at AS "createdAt"
    `, supervisorId, teacherId, evaluationType, title || 'استبيان تقييم أداء الأستاذ',
       Number(syllabusAdherenceScore), Number(pedagogicalQualityScore), Number(studentInteractionScore),
       Number(assessmentQualityScore), Number(techPlatformUseScore), overallScore, notes, recommendations, actionPlan
    );

    try {
      await this.prisma.notification.create({
        data: {
          userId: teacherId,
          title: `استبيان تقييم إشرافي جديد: ${title || 'تقييم الأداء والمرافقة'}`,
          body: `قام المشرف المنسق بتسجيل استبيان تقييم إشرافي لك بنتيجة ${overallScore}%. التوصيات: ${recommendations || 'متابعة طيبة'}`,
          type: 'system',
          actionUrl: '/teacher/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, result, overallScore };
  }

  @Get('supervisor/teachers/:teacherId/evaluations')
  async getSupervisorTeacherEvaluations(@Param('teacherId') teacherId: string) {
    return this.prisma.$queryRawUnsafe(`
      SELECT e.id, e.title, e.evaluation_type AS "evaluationType",
             e.syllabus_adherence_score AS "syllabusAdherenceScore",
             e.pedagogical_quality_score AS "pedagogicalQualityScore",
             e.student_interaction_score AS "studentInteractionScore",
             e.assessment_quality_score AS "assessmentQualityScore",
             e.tech_platform_use_score AS "techPlatformUseScore",
             e.overall_score AS "overallScore",
             e.notes, e.recommendations, e.action_plan AS "actionPlan",
             e.created_at AS "createdAt",
             u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
          FROM users.teacher_evaluations e
          LEFT JOIN users.users u ON u.id = e.supervisor_id
          WHERE e.teacher_id = $1::uuid
          ORDER BY e.created_at DESC
    `, teacherId);
  }

  @Post('supervisor/teachers/:teacherId/clarifications')
  async createSupervisorClarification(
    @Req() req: any,
    @Param('teacherId') teacherId: string,
    @Body() body: any
  ) {
    const supervisorId = req.user?.id || req.user?.userId;
    const { type = 'clarification', title, content, isUrgent = false } = body;

    const result = await this.prisma.$queryRawUnsafe(`
      INSERT INTO users.teacher_clarifications (
        supervisor_id, teacher_id, type, title, content, is_urgent, status
      ) VALUES (
        $1::uuid, $2::uuid, $3, $4, $5, $6, 'sent'
      ) RETURNING id, title, created_at AS "createdAt"
    `, supervisorId, teacherId, type, title || 'توضيح واستفسار إشرافي', content, isUrgent);

    try {
      await this.prisma.notification.create({
        data: {
          userId: teacherId,
          title: `رسالة/توضيح جديد من المشرف: ${title}`,
          body: content,
          type: 'system',
          actionUrl: '/teacher/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, result };
  }

  @Get('supervisor/teachers/:teacherId/clarifications')
  async getSupervisorTeacherClarifications(@Param('teacherId') teacherId: string) {
    return this.prisma.$queryRawUnsafe(`
      SELECT c.id, c.type, c.title, c.content,
             c.teacher_reply AS "teacherReply",
             c.teacher_replied_at AS "teacherRepliedAt",
             c.is_urgent AS "isUrgent",
             c.status,
             c.created_at AS "createdAt",
             u."firstName" AS "supervisorFirstName", u."lastName" AS "supervisorLastName"
      FROM users.teacher_clarifications c
      LEFT JOIN users.users u ON u.id = c.supervisor_id
      WHERE c.teacher_id = $1::uuid
      ORDER BY c.created_at DESC
    `, teacherId);
  }

  @Patch('supervisor/set-subject')
  async updateSupervisorSubject(@Req() req: any, @Body() body: { subjectId: string }) {
    const userId = req.user?.id || req.user?.userId;
    const { subjectId } = body;
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { supervisedSubjectId: subjectId },
      include: { supervisedSubject: true }
    });
    return updated;
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

  
  @Patch('cohorts/:id')
  async updateCohort(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req.user.primaryRole !== 'super_admin' && req.user.primaryRole !== 'admin') {
      throw new Error('Unauthorized');
    }
    
    const { name, code, teacherId, studentIds } = body;

    const cohort = await this.prisma.cohort.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(code && { code }),
      }
    });

    if (teacherId) {
      await this.prisma.cohortInstructor.deleteMany({ where: { cohortId: id } });
      await this.prisma.cohortInstructor.create({
        data: {
          cohortId: id,
          teacherId,
          role: 'primary_teacher'
        }
      });
    }

    if (studentIds && Array.isArray(studentIds)) {
      await this.prisma.cohortEnrollment.deleteMany({ where: { cohortId: id } });
      if (studentIds.length > 0) {
        await this.prisma.cohortEnrollment.createMany({
          data: studentIds.map((studentId: string) => ({
            cohortId: id,
            studentId,
            status: 'enrolled'
          }))
        });
      }
    }

    return cohort;
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

  // ==========================================
  // SUPERVISOR COHORT MANAGEMENT (DELEGATED)
  // ==========================================

  @Get('supervisor/delegated/courses')
  async getDelegatedCourses(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      return [];
    }

    const activeSubjectId = querySubjectId || user.supervisedSubjectId;
    let whereClause: any = {};
    if (activeSubjectId) {
      whereClause = { subjectId: activeSubjectId };
    }

    return this.prisma.course.findMany({
      where: whereClause,
      include: {
        subject: { select: { id: true, nameAr: true, code: true } },
        versions: { where: { isDefault: true }, select: { id: true } }
      }
    });
  }

  @Get('supervisor/delegated/teachers')
  async getDelegatedTeachers(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      return [];
    }

    const activeSubjectId = querySubjectId || user.supervisedSubjectId;
    let whereClause: any = { primaryRole: 'teacher', status: 'active' };
    if (activeSubjectId) {
      whereClause.supervisedSubjectId = activeSubjectId;
    }

    return this.prisma.user.findMany({
      where: whereClause,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });
  }

  @Get('supervisor/delegated/students')
  async getDelegatedStudents(@Req() req: any, @Query('branch') branch?: string, @Query('curriculum') curriculum?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      return [];
    }

    return this.prisma.user.findMany({
      where: { primaryRole: 'student', status: 'active' },
      orderBy: [
        { firstName: 'asc' }
      ],
      select: { id: true, firstName: true, lastName: true, academicBranch: true, curriculumType: true, email: true, phone: true }
    });
  }

  @Get('supervisor/delegated/cohorts-detailed')
  async getDelegatedCohortsDetailed(@Req() req: any, @Query('subjectId') querySubjectId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const activeSubjectId = querySubjectId || user.supervisedSubjectId;

    let courseFilter: any = {};
    if (activeSubjectId) {
      courseFilter = { subjectId: activeSubjectId };
    }

    const courses = await this.prisma.course.findMany({
      where: courseFilter,
      include: {
        subject: { select: { id: true, nameAr: true, code: true } }
      }
    });
    const courseIds = courses.map(c => c.id);
    const courseMap = new Map(courses.map(c => [c.id, c]));

    const cohorts = await this.prisma.cohort.findMany({
      where: courseIds.length > 0 ? { courseId: { in: courseIds } } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        instructors: true,
        enrollments: true
      }
    });

    const teacherIds = [...new Set(cohorts.flatMap(c => c.instructors.map(i => i.teacherId)))];
    const studentIds = [...new Set(cohorts.flatMap(c => c.enrollments.map(e => e.studentId)))];

    const [teachers, students] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, avatarUrl: true }
      }),
      this.prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, firstName: true, lastName: true, email: true, phone: true, status: true, academicBranch: true, curriculumType: true }
      })
    ]);

    const teacherMap = new Map(teachers.map(t => [t.id, t]));
    const studentMap = new Map(students.map(s => [s.id, s]));

    const detailedCohorts = cohorts.map(cohort => {
      const course = courseMap.get(cohort.courseId);
      const instructor = cohort.instructors[0] ? teacherMap.get(cohort.instructors[0].teacherId) : null;
      const enrolledStudents = cohort.enrollments
        .map(enr => {
          const st = studentMap.get(enr.studentId);
          if (!st) return null;
          return {
            ...st,
            enrollmentStatus: enr.status
          };
        })
        .filter(Boolean);

      const maxCapacity = cohort.maxStudents || 12;
      const enrolledCount = enrolledStudents.length;
      const availableSeats = Math.max(0, maxCapacity - enrolledCount);
      const isTeacherVacant = !instructor || instructor.status !== 'active';

      let capacityStatus = 'available';
      if (enrolledCount >= maxCapacity) {
        capacityStatus = 'full';
      } else if (isTeacherVacant) {
        capacityStatus = 'teacher_vacant';
      } else if (enrolledCount < (cohort.minStudents || 3)) {
        capacityStatus = 'under_minimum';
      }

      return {
        id: cohort.id,
        name: cohort.name,
        code: cohort.code,
        status: cohort.status,
        minStudents: cohort.minStudents || 3,
        maxStudents: maxCapacity,
        enrolledCount,
        availableSeats,
        capacityStatus,
        isTeacherVacant,
        course: {
          id: course?.id,
          title: course?.title,
          code: course?.code,
          curriculumType: course?.curriculumType,
          academicBranch: course?.academicBranch,
          subject: course?.subject
        },
        teacher: instructor || null,
        enrolledStudents
      };
    });

    const allActiveStudents = await this.prisma.user.findMany({
      where: { primaryRole: 'student', status: 'active' },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, academicBranch: true, curriculumType: true }
    });

    const enrolledStudentIdSet = new Set(studentIds);
    const unassignedStudents = allActiveStudents.filter(s => !enrolledStudentIdSet.has(s.id));

    return {
      cohorts: detailedCohorts,
      unassignedStudents,
      summary: {
        totalCohorts: detailedCohorts.length,
        totalEnrolledStudents: studentIds.length,
        totalAvailableSeats: detailedCohorts.reduce((acc, c) => acc + c.availableSeats, 0),
        teacherVacantCount: detailedCohorts.filter(c => c.isTeacherVacant).length,
        unassignedStudentsCount: unassignedStudents.length
      }
    };
  }

  @Post('supervisor/cohorts/:cohortId/enroll-student')
  async enrollStudentInCohort(
    @Req() req: any,
    @Param('cohortId') cohortId: string,
    @Body() body: { studentId: string; notes?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const { studentId } = body;
    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    if (!cohort) throw new Error('Cohort not found');

    const existing = await this.prisma.cohortEnrollment.findFirst({
      where: { cohortId, studentId }
    });
    if (existing) {
      return { ok: true, message: 'الطالب مسجل بالفعل في هذا الفوج' };
    }

    await this.prisma.cohortEnrollment.create({
      data: {
        cohortId,
        studentId,
        status: 'enrolled' as any
      }
    });

    try {
      await this.prisma.notification.create({
        data: {
          userId: studentId,
          title: `تم إسنادك إلى فوج جديد: ${cohort.name}`,
          body: `قام المشرف المنسق بضمك إلى فوج ${cohort.name}. يمكنك متابعة جدول حصصك الآن.`,
          type: 'enrollment',
          actionUrl: '/student/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, cohortId, studentId };
  }

  @Post('supervisor/transfer-student')
  async transferStudentBetweenCohorts(
    @Req() req: any,
    @Body() body: { studentId: string; fromCohortId: string; toCohortId: string; reason?: string }
  ) {
    const supervisorId = req.user.id || req.user.userId;
    const { studentId, fromCohortId, toCohortId, reason = 'نقل وتنسيق إشرافي' } = body;

    await this.prisma.cohortEnrollment.deleteMany({
      where: { cohortId: fromCohortId, studentId }
    });

    const existing = await this.prisma.cohortEnrollment.findFirst({
      where: { cohortId: toCohortId, studentId }
    });
    if (!existing) {
      await this.prisma.cohortEnrollment.create({
        data: {
          cohortId: toCohortId,
          studentId,
          status: 'enrolled' as any
        }
      });
    }

    try {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO users.student_cohort_transfers (supervisor_id, student_id, from_cohort_id, to_cohort_id, reason)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5)
      `, supervisorId, studentId, fromCohortId, toCohortId, reason);
    } catch (_) {}

    const toCohort = await this.prisma.cohort.findUnique({ where: { id: toCohortId } });
    try {
      await this.prisma.notification.create({
        data: {
          userId: studentId,
          title: `تم تغيير فوجك الدراسي إلى: ${toCohort?.name}`,
          body: `قام المشرف المنسق بنقلك إلى فوج ${toCohort?.name}. السبب: ${reason}`,
          type: 'enrollment',
          actionUrl: '/student/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, studentId, toCohortId };
  }

  @Delete('supervisor/cohorts/:cohortId/students/:studentId')
  async removeStudentFromCohort(
    @Req() req: any,
    @Param('cohortId') cohortId: string,
    @Param('studentId') studentId: string
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    await this.prisma.cohortEnrollment.deleteMany({
      where: { cohortId, studentId }
    });

    return { ok: true, cohortId, studentId };
  }

  @Post('supervisor/cohorts/:cohortId/assign-teacher')
  async assignTeacherToCohort(
    @Req() req: any,
    @Param('cohortId') cohortId: string,
    @Body() body: { teacherId: string; reason?: string }
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    const { teacherId } = body;
    await this.prisma.cohortInstructor.deleteMany({ where: { cohortId } });
    await this.prisma.cohortInstructor.create({
      data: {
        cohortId,
        teacherId,
        role: 'primary_teacher'
      }
    });

    const cohort = await this.prisma.cohort.findUnique({ where: { id: cohortId } });
    try {
      await this.prisma.notification.create({
        data: {
          userId: teacherId,
          title: `تم إسناد فوج دراسي جديد لك: ${cohort?.name}`,
          body: `قام المشرف المنسق بتعيينك معلماً رئيسياً لفوج ${cohort?.name}.`,
          type: 'system',
          actionUrl: '/teacher/dashboard'
        }
      });
    } catch (_) {}

    return { ok: true, cohortId, teacherId };
  }

  @Post('supervisor/cohorts/:fromCohortId/bulk-transfer')
  async bulkTransferCohortStudents(
    @Req() req: any,
    @Param('fromCohortId') fromCohortId: string,
    @Body() body: { toCohortId: string; studentIds?: string[]; reason?: string; archiveOldCohort?: boolean }
  ) {
    const supervisorId = req.user.id || req.user.userId;
    const { toCohortId, studentIds, reason = 'معالجة شغور أستاذ وضم الطلبة', archiveOldCohort = false } = body;

    const fromEnrollments = await this.prisma.cohortEnrollment.findMany({
      where: { cohortId: fromCohortId }
    });

    const targetStudentIds = studentIds && studentIds.length > 0 
      ? studentIds 
      : fromEnrollments.map(e => e.studentId);

    await this.prisma.cohortEnrollment.deleteMany({
      where: {
        cohortId: fromCohortId,
        studentId: { in: targetStudentIds }
      }
    });

    for (const sId of targetStudentIds) {
      const existing = await this.prisma.cohortEnrollment.findFirst({
        where: { cohortId: toCohortId, studentId: sId }
      });
      if (!existing) {
        await this.prisma.cohortEnrollment.create({
          data: {
            cohortId: toCohortId,
            studentId: sId,
            status: 'enrolled' as any
          }
        });
      }

      try {
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO users.student_cohort_transfers (supervisor_id, student_id, from_cohort_id, to_cohort_id, reason)
          VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5)
        `, supervisorId, sId, fromCohortId, toCohortId, reason);
      } catch (_) {}
    }

    if (archiveOldCohort) {
      await this.prisma.cohort.update({
        where: { id: fromCohortId },
        data: { status: 'suspended' as any }
      });
    }

    return { ok: true, transferredCount: targetStudentIds.length, toCohortId };
  }

  @Post('supervisor/delegated/cohorts')
  async createDelegatedCohort(@Req() req: any, @Body() body: { name: string, courseId: string, teacherId: string, studentIds: string[] }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || !['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(user.primaryRole)) {
      throw new UnauthorizedException();
    }

    // Find default curriculum version for course
    const course = await this.prisma.course.findUnique({
      where: { id: body.courseId },
      include: { versions: { where: { isDefault: true } } }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    const versionId = course.versions[0]?.id;
    if (!versionId) throw new Error('Course has no default curriculum version');

    // Create Cohort
    const cohortCode = 'COH-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const cohort = await this.prisma.cohort.create({
      data: {
        name: body.name,
        code: cohortCode,
        courseId: body.courseId,
        curriculumVersionId: versionId,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        createdById: user.id
      }
    });

    // Assign Teacher
    if (body.teacherId) {
      await this.prisma.cohortInstructor.create({
        data: {
          cohortId: cohort.id,
          teacherId: body.teacherId,
          role: 'primary_teacher'
        }
      });
    }

    // Assign Students
    if (body.studentIds && body.studentIds.length > 0) {
      const enrollments = body.studentIds.map(studentId => ({
        cohortId: cohort.id,
        studentId: studentId,
        status: 'enrolled' as any
      }));
      await this.prisma.cohortEnrollment.createMany({
        data: enrollments
      });
    }

    return { success: true, cohortId: cohort.id };
  }

  @Get('analytics/reports')
  async getAnalyticsReports(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (!['super_admin', 'admin', 'subject_supervisor', 'supervisor'].includes(role)) {
      throw new Error('Unauthorized');
    }

    const isSupervisor = role === 'subject_supervisor' || role === 'supervisor';
    let supervisedSubjectId: string | null = null;
    let supervisedSubjectName: string | null = null;

    if (role === 'subject_supervisor') {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        include: { supervisedSubject: true }
      });
      supervisedSubjectId = user?.supervisedSubjectId || null;
      supervisedSubjectName = user?.supervisedSubject?.nameAr || null;
    }

    const courses = await this.prisma.course.findMany({
      select: { id: true, title: true, curriculumType: true, subjectId: true }
    });

    const cohorts = await this.prisma.cohort.findMany({
      include: {
        enrollments: { select: { studentId: true } },
        instructors: { select: { teacherId: true } }
      }
    });

    const courseMap = new Map(courses.map(c => [c.id, c]));

    let governmentalCohortsCount = 0;
    let azhariCohortsCount = 0;
    let otherCurriculumCohortsCount = 0;

    let governmentalStudentsCount = 0;
    let azhariStudentsCount = 0;

    cohorts.forEach(coh => {
      const course = courseMap.get(coh.courseId);
      const studentCount = coh.enrollments.length;
      if (course?.curriculumType === 'governmental') {
        governmentalCohortsCount++;
        governmentalStudentsCount += studentCount;
      } else if (course?.curriculumType === 'azhari') {
        azhariCohortsCount++;
        azhariStudentsCount += studentCount;
      } else {
        otherCurriculumCohortsCount++;
      }
    });

    const totalCourses = courses.length;
    const governmentalCoursesCount = courses.filter(c => c.curriculumType === 'governmental').length;
    const azhariCoursesCount = courses.filter(c => c.curriculumType === 'azhari').length;

    const allUsers = await this.prisma.user.findMany({
      select: {
        id: true,
        primaryRole: true,
        status: true,
        nationality: true,
        curriculumType: true,
        academicBranch: true,
        gradeLevel: true
      }
    });

    const teachers = allUsers.filter(u => u.primaryRole === 'teacher');
    const students = allUsers.filter(u => u.primaryRole === 'student');
    const supervisors = allUsers.filter(u => u.primaryRole === 'subject_supervisor' || (u.primaryRole as string) === 'supervisor');

    const calculateNationalities = (userList: any[]) => {
      const map: Record<string, number> = {};
      userList.forEach(u => {
        const nat = u.nationality?.trim() || 'غير محدد';
        map[nat] = (map[nat] || 0) + 1;
      });
      const total = userList.length || 1;
      return Object.entries(map).map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / total) * 100)
      })).sort((a, b) => b.count - a.count);
    };

    const overallNationalities = calculateNationalities(allUsers);
    const studentNationalities = calculateNationalities(students);
    const teacherNationalities = calculateNationalities(teachers);

    const grade11Students = students.filter(s => s.gradeLevel === 'grade_11').length;
    const grade12Students = students.filter(s => s.gradeLevel === 'grade_12').length;

    const totalCohorts = cohorts.length;
    const activeCohorts = cohorts.filter(c => c.status === 'active' || (c.status as any) === 'in_progress').length;
    const totalEnrolledStudents = cohorts.reduce((acc, c) => acc + c.enrollments.length, 0);
    const totalMaxCapacity = cohorts.reduce((acc, c) => acc + (c.maxStudents || 12), 0);
    const averageStudentsPerCohort = totalCohorts > 0 ? (totalEnrolledStudents / totalCohorts).toFixed(1) : '0';
    const capacitySaturationRate = totalMaxCapacity > 0 ? Math.round((totalEnrolledStudents / totalMaxCapacity) * 100) : 0;

    const totalSessions = await this.prisma.session.count();
    const completedSessions = await this.prisma.session.count({ where: { status: 'completed' } });
    const scheduledSessions = await this.prisma.session.count({ where: { status: 'scheduled' } });
    const cancelledSessions = await this.prisma.session.count({ where: { status: 'cancelled' } });

    const attendances = await this.prisma.sessionAttendance.findMany({
      select: { status: true }
    });
    const presentAttendances = attendances.filter(a => a.status === 'present' || a.status === 'late').length;
    const totalAttendanceMarks = attendances.length || 1;
    const studentAttendanceRate = attendances.length > 0 ? Math.round((presentAttendances / totalAttendanceMarks) * 100) : 95;

    const recommendations = [];

    if (studentAttendanceRate < 85) {
      recommendations.push({
        type: 'pedagogical',
        level: 'high',
        title: 'انخفاض في نسبة الحضور العام للجلسات',
        description: `نسبة الحضور الحالية بلغت ${studentAttendanceRate}%. يُوصى المشرفون بتكثيف المتابعة مع الأساتذة ومراجعة أسباب تغيب الطلاب المتكررة، وتنظيم جلسات دعم تعويضية.`
      });
    } else {
      recommendations.push({
        type: 'pedagogical',
        level: 'info',
        title: 'استقرار الالتزام الصفي والتربوي',
        description: `نسبة الحضور المباشر ممتازة (${studentAttendanceRate}%). يُوصى بتعزيز التفاعل عبر الأنشطة التكوينية وتكليف الطلاب بمهام إثرائية للمحافظة على هذا المستوى.`
      });
    }

    recommendations.push({
      type: 'pedagogical',
      level: 'medium',
      title: 'التوزيع الفصلي المتوازن للمنهاج',
      description: 'التأكد من التزام الأساتذة بالخطة الشهرية للفصلين (4 أشهر لكل فصل)، ومراجعة استيفاء الوحدات التدريسية قبل بدء فترات الامتحانات في شهري ديسمبر ومايو.'
    });

    if (capacitySaturationRate > 85) {
      recommendations.push({
        type: 'administrative',
        level: 'high',
        title: 'اقتراب الطاقة الاستيعابية للأفواج من الحد الأقصى',
        description: `بلغت نسبة إشغال الأفواج ${capacitySaturationRate}%. يُنصح الإدارة بفتح أفواج دراسية جديدة لتجنب الاكتظاظ وضمان جودة المتابعة الفردية.`
      });
    } else if (capacitySaturationRate < 40 && totalCohorts > 0) {
      recommendations.push({
        type: 'administrative',
        level: 'medium',
        title: 'فرصة لضم وتوسيع التسجيل في الأفواج القائمة',
        description: `نسبة استيعاب الأفواج الحالية ${capacitySaturationRate}% فقط. يمكن للإدارة قبول المزيد من الطلاب المسجلين دون الحاجة لفتح أفواج إضافية.`
      });
    }

    const unassignedCohorts = cohorts.filter(c => c.instructors.length === 0).length;
    if (unassignedCohorts > 0) {
      recommendations.push({
        type: 'administrative',
        level: 'high',
        title: `تنبيه إسناد: يوجد ${unassignedCohorts} أفواج بدون معلم رئيسي`,
        description: 'يُرجى من إدارة المنظمة والمشرفين إتمام الإسناد الأكاديمي لهذه الأفواج لضمان بدء الحصص في مواعيدها.'
      });
    }

    const subjectsWithoutSupervisor = await this.prisma.subject.count({
      where: { supervisors: { none: {} } }
    });
    if (subjectsWithoutSupervisor > 0) {
      recommendations.push({
        type: 'administrative',
        level: 'medium',
        title: `مواد دراسية بحاجة لإسناد إشرافي (${subjectsWithoutSupervisor} مواد)`,
        description: 'يُنصح بتعيين مشرفين متخصصين للمواد المتبقية لضمان توجيه وتقييم المعلمين وفق المعايير المعتمدة.'
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      scope: {
        role,
        isSupervisor,
        supervisedSubjectId,
        supervisedSubjectName
      },
      curriculum: {
        totalCourses,
        governmental: {
          coursesCount: governmentalCoursesCount,
          cohortsCount: governmentalCohortsCount,
          studentsCount: governmentalStudentsCount,
          percentage: totalCohorts > 0 ? Math.round((governmentalCohortsCount / totalCohorts) * 100) : 100
        },
        azhari: {
          coursesCount: azhariCoursesCount,
          cohortsCount: azhariCohortsCount,
          studentsCount: azhariStudentsCount,
          percentage: totalCohorts > 0 ? Math.round((azhariCohortsCount / totalCohorts) * 100) : 0
        }
      },
      gradeLevels: {
        grade11: {
          count: grade11Students,
          percentage: students.length > 0 ? Math.round((grade11Students / students.length) * 100) : 0
        },
        grade12: {
          count: grade12Students,
          percentage: students.length > 0 ? Math.round((grade12Students / students.length) * 100) : 0
        }
      },
      nationalities: {
        overall: overallNationalities,
        students: studentNationalities,
        teachers: teacherNationalities
      },
      cohorts: {
        total: totalCohorts,
        active: activeCohorts,
        totalEnrolledStudents,
        totalMaxCapacity,
        averageStudentsPerCohort,
        capacitySaturationRate,
        unassignedCohorts
      },
      users: {
        totalUsers: allUsers.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalSupervisors: supervisors.length,
        teacherToStudentRatio: teachers.length > 0 ? `1 : ${Math.round(students.length / teachers.length)}` : '0'
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        scheduled: scheduledSessions,
        cancelled: cancelledSessions,
        attendanceRate: studentAttendanceRate
      },
      recommendations
    };
  }
}
