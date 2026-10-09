const fs = require('fs');
const path = 'packages/backend/src/modules/groups/presentation/http/groups.controller.ts';
let code = fs.readFileSync(path, 'utf8');

const newEndpoints = `
  // ==========================================
  // SUPERVISOR COHORT MANAGEMENT (DELEGATED)
  // ==========================================

  @Get('supervisor/delegated/courses')
  async getDelegatedCourses(@Req() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || user.primaryRole !== 'subject_supervisor' || !user.supervisedSubjectId) {
      return { error: 'Unauthorized or missing supervised subject' };
    }

    return this.prisma.course.findMany({
      where: { subjectId: user.supervisedSubjectId },
      include: {
        subject: { select: { nameAr: true } },
        versions: { where: { isDefault: true }, select: { id: true } }
      }
    });
  }

  @Get('supervisor/delegated/teachers')
  async getDelegatedTeachers(@Req() req: any) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || user.primaryRole !== 'subject_supervisor' || !user.supervisedSubjectId) {
      return { error: 'Unauthorized' };
    }

    return this.prisma.user.findMany({
      where: { 
        primaryRole: 'teacher',
        supervisedSubjectId: user.supervisedSubjectId,
        status: 'active'
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });
  }

  @Get('supervisor/delegated/students')
  async getDelegatedStudents(@Req() req: any, @Query('branch') branch?: string, @Query('curriculum') curriculum?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || user.primaryRole !== 'subject_supervisor') {
      return { error: 'Unauthorized' };
    }

    const whereClause: any = { primaryRole: 'student', status: 'active' };
    if (branch) whereClause.academicBranch = branch;
    if (curriculum) whereClause.curriculumType = curriculum;

    return this.prisma.user.findMany({
      where: whereClause,
      select: { id: true, firstName: true, lastName: true, academicBranch: true, curriculumType: true, email: true }
    });
  }

  @Post('supervisor/delegated/cohorts')
  async createDelegatedCohort(@Req() req: any, @Body() body: { name: string, courseId: string, teacherId: string, studentIds: string[] }) {
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id || req.user.userId } });
    if (!user || user.primaryRole !== 'subject_supervisor' || !user.supervisedSubjectId) {
      throw new Error('Unauthorized');
    }

    // Find default curriculum version for course
    const course = await this.prisma.course.findUnique({
      where: { id: body.courseId },
      include: { versions: { where: { isDefault: true } } }
    });

    if (!course || course.subjectId !== user.supervisedSubjectId) {
      throw new Error('Invalid course or not authorized for this subject');
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
`;

// Insert before the last closing brace
const lastBraceIndex = code.lastIndexOf('}');
code = code.substring(0, lastBraceIndex) + newEndpoints + '\n}\n';

fs.writeFileSync(path, code);
