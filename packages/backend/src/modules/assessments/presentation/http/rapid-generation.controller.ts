import { Controller, Post, Get, Patch, Delete, Body, Req, Param, UseGuards, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { RapidGenerationService } from '../../application/rapid-generation.service';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(
    private readonly rapidGenService: RapidGenerationService,
    private readonly prisma: PrismaService
  ) {}

  @Post('generate')
  async generateAssessment(
    @Req() req: any,
    @Body() body: { cohortId: string; curriculumLessonId: string; questionCount?: number }
  ) {
    let teacherId = req.user?.id || req.user?.userId;
    if (!teacherId) {
      const teacher = await this.prisma.user.findFirst({ where: { primaryRole: 'teacher' } });
      teacherId = teacher?.id || 'demo-teacher-001';
    }
    return this.rapidGenService.generateAssessment(body.cohortId, body.curriculumLessonId, teacherId, body.questionCount);
  }

  @Post()
  async createManualAssessment(
    @Req() req: any,
    @Body() body: { title: string; cohortId?: string; description?: string; subject?: string; dueDate?: string; maxScore?: number; type?: string }
  ) {
    try {
      // 1. Resolve author / teacher ID
      let teacherId: string | undefined = req.user?.id || req.user?.userId;
      if (teacherId) {
        const userExists = await this.prisma.user.findUnique({ where: { id: teacherId } }).catch(() => null);
        if (!userExists) teacherId = undefined;
      }
      if (!teacherId) {
        const teacher = await this.prisma.user.findFirst({ where: { primaryRole: 'teacher', status: 'active' } });
        if (teacher) {
          teacherId = teacher.id;
        } else {
          const anyUser = await this.prisma.user.findFirst();
          teacherId = anyUser?.id;
        }
      }

      // 2. Resolve target cohort ID
      let cohortId: string | undefined = body.cohortId;
      if (cohortId) {
        const cohortExists = await this.prisma.cohort.findUnique({ where: { id: cohortId } }).catch(() => null);
        if (!cohortExists) cohortId = undefined;
      }
      if (!cohortId) {
        const teacherCohort = await this.prisma.cohort.findFirst({
          where: { instructors: { some: { teacherId } } }
        });
        cohortId = teacherCohort?.id;
      }

      if (!cohortId) {
        throw new BadRequestException('يرجى اختيار الفوج الدراسي المعتمد لإنشاء التقييم');
      }

      // 3. Map type to valid Postgres AssessmentType enum ('quiz', 'assignment', 'exam', 'project')
      let validAssessmentType: 'quiz' | 'assignment' | 'exam' | 'project' = 'assignment';
      const rawType = (body.type || '').toLowerCase();
      if (rawType === 'quiz') {
        validAssessmentType = 'quiz';
      } else if (rawType === 'exam') {
        validAssessmentType = 'exam';
      } else if (rawType === 'project' || rawType === 'activity') {
        validAssessmentType = 'project';
      } else {
        // 'homework', 'assignment' or any other string maps to 'assignment'
        validAssessmentType = 'assignment';
      }

      // 4. Resolve due date safely
      let dueDate: Date;
      try {
        dueDate = body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        if (isNaN(dueDate.getTime())) {
          dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }
      } catch {
        dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      return await this.prisma.assessment.create({
        data: {
          title: body.title || 'واجب جديد',
          description: body.subject ? "الموضوع: " + body.subject + "\n\n" + (body.description || "") : body.description,
          dueDate: dueDate,
          maxScore: body.maxScore ? Number(body.maxScore) : 20,
          type: validAssessmentType,
          cohortId: cohortId!,
          createdById: teacherId!
        }
      });
    } catch (err: any) {
      console.error('Error creating assessment:', err);
      throw err;
    }
  }

  @Post(':assessmentId/submit')
  async submitAssessment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() body: { answers?: Record<string, string>; solutionText?: string; notes?: string; fileUrl?: string }
  ) {
    const studentId = req.user?.id || req.user?.userId;
    if (!studentId) {
      throw new UnauthorizedException('يجب تسجيل الدخول لتسليم الواجب');
    }

    // Load assessment with questions and template
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: { include: { questionTemplate: true } } }
    });
    if (!assessment) {
      throw new BadRequestException('التقييم أو الواجب غير موجود');
    }

    const hasQuestions = assessment.questions && assessment.questions.length > 0;
    let finalScore: number | null = null;
    let status: 'submitted' | 'graded' = 'submitted';

    if (hasQuestions) {
      // Auto-grade MCQ and true_false
      let score = 0;
      const totalPoints = assessment.questions.reduce((sum: number, q: any) => sum + Number(q.scoreWeight || 1), 0);

      const answers = body.answers || {};
      for (const q of assessment.questions as any[]) {
        const studentAnswer = answers[q.id];
        if (!studentAnswer) continue;
        const correctAnswer = q.questionTemplate?.correctAnswer;
        if (correctAnswer && studentAnswer.trim() === correctAnswer.trim()) {
          score += Number(q.scoreWeight || 1);
        }
      }

      finalScore = totalPoints > 0 ? Math.round((score / totalPoints) * Number(assessment.maxScore || 100)) : 0;
      status = 'graded';
    } else {
      // Written assignment / homework: submitted for teacher grading
      finalScore = null;
      status = 'submitted';
    }

    const payloadFeedback = JSON.stringify({
      answers: body.answers || {},
      solutionText: body.solutionText || body.answers?.['solutionText'] || '',
      fileUrl: body.fileUrl || body.answers?.['fileUrl'] || '',
      notes: body.notes || ''
    });

    const submission = await this.prisma.assessmentSubmission.upsert({
      where: {
        assessmentId_studentId: {
          assessmentId,
          studentId
        }
      },
      update: {
        status,
        score: finalScore,
        feedback: payloadFeedback,
        submittedAt: new Date()
      },
      create: {
        assessmentId,
        studentId,
        status,
        score: finalScore,
        feedback: payloadFeedback,
        submittedAt: new Date()
      }
    });

    return { submission, score: finalScore, hasQuestions, status };
  }

  @Patch('submissions/:submissionId/grade')
  async gradeSubmission(
    @Req() req: any,
    @Param('submissionId') submissionId: string,
    @Body() body: { score: number; feedback: string }
  ) {
    const callerRole = req.user?.primaryRole;
    if (!['teacher', 'admin', 'super_admin', 'subject_supervisor'].includes(callerRole)) {
      throw new UnauthorizedException('فقط المعلمون والمشرفون يمكنهم تصحيح الإجابات');
    }
    const userId = req.user?.id || req.user?.userId;
    if (!userId) throw new UnauthorizedException('يجب تسجيل الدخول');

    const existing = await this.prisma.assessmentSubmission.findUnique({
      where: { id: submissionId }
    });

    let mergedFeedback = body.feedback;
    if (existing?.feedback) {
      try {
        const parsed = JSON.parse(existing.feedback);
        if (parsed && typeof parsed === 'object') {
          parsed.teacherComment = body.feedback;
          mergedFeedback = JSON.stringify(parsed);
        }
      } catch {}
    }

    return this.prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: body.score,
        feedback: mergedFeedback,
        status: 'graded',
        gradedById: userId,
        gradedAt: new Date()
      }
    });
  }

  @Get('student/me')
  async getStudentAssessments(@Req() req: any) {
    const studentId = req.user?.id || req.user?.userId || '33333333-3333-3333-3333-333333333333';
    
    const enrollments = await this.prisma.cohortEnrollment.findMany({
      where: { studentId }
    });
    const cohortIds = enrollments.map((e: any) => e.cohortId);

    // Also include assessments if student is not in any cohort for demo/fallback purposes
    if (cohortIds.length === 0) {
       return this.prisma.assessment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            cohort: true,
            questions: { include: { questionTemplate: true } },
            submissions: {
              where: { studentId }
            }
          }
       });
    }

    return this.prisma.assessment.findMany({
      where: { cohortId: { in: cohortIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        cohort: true,
        questions: { include: { questionTemplate: true } },
        submissions: {
          where: { studentId }
        }
      }
    });
  }

  @Get()
  async getAssessments(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId;
    const role = req.user?.primaryRole || 'teacher';

    let whereClause: any = {};
    if (role === 'teacher' && userId) {
      whereClause = {
        OR: [
          { createdById: userId },
          { cohort: { instructors: { some: { teacherId: userId } } } }
        ]
      };
    } else if ((role === 'supervisor' || role === 'subject_supervisor') && userId) {
      const supervisor = await this.prisma.user.findUnique({ where: { id: userId } });
      if (supervisor?.supervisedSubjectId) {
        const courses = await this.prisma.course.findMany({
          where: { subjectId: supervisor.supervisedSubjectId },
          select: { id: true }
        });
        const courseIds = courses.map(c => c.id);
        const cohorts = await this.prisma.cohort.findMany({
          where: { courseId: { in: courseIds } },
          select: { id: true }
        });
        const cohortIds = cohorts.map(c => c.id);
        whereClause = { cohortId: { in: cohortIds } };
      } else {
        whereClause = {};
      }
    } else {
      whereClause = {}; // Admin or fallback
    }

    return this.prisma.assessment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        cohort: true,
        questions: true,
        submissions: {
          include: { student: true }
        }
      }
    });
  }

  @Get(':id')
  async getAssessmentById(@Param('id') id: string) {
    return this.prisma.assessment.findUnique({
      where: { id },
      include: {
        cohort: true,
        questions: { include: { questionTemplate: true } },
        submissions: {
          include: { student: true }
        }
      }
    });
  }

  @Delete()
  async deleteAllAssessments(@Req() req: any) {
    const role = req.user?.primaryRole;
    if (role !== 'super_admin' && role !== 'admin') {
      throw new UnauthorizedException('غير مصرح لك بتنفيذ هذه العملية — يحتاج صلاحية مدير');
    }
    // For demo/testing purposes - only admins can reset assessments
    await this.prisma.assessment.deleteMany();
    return { message: 'تم حذف جميع الاختبارات' };
  }
}
