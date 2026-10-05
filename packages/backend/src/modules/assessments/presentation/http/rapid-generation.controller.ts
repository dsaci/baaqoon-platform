import { Controller, Post, Get, Patch, Delete, Body, Req, Param, UseGuards } from '@nestjs/common';
import { RapidGenerationService } from '../../application/rapid-generation.service';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('assessments')
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
    const teacherId = req.user?.id || req.user?.userId || 'demo-teacher-001'; // Mock ID for testing
    return this.rapidGenService.generateAssessment(body.cohortId, body.curriculumLessonId, teacherId, body.questionCount);
  }

  @Post()
  async createManualAssessment(
    @Req() req: any,
    @Body() body: { title: string; cohortId?: string }
  ) {
    const teacherId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    
    // Find a default cohort if none is provided
    let cohortId = body.cohortId;
    if (!cohortId) {
      const cohort = await this.prisma.cohort.findFirst();
      if (cohort) cohortId = cohort.id;
    }
    if (!cohortId) cohortId = '22222222-2222-2222-2222-222222222222'; // fallback mock

    return this.prisma.assessment.create({
      data: {
        title: body.title,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        maxScore: 100,
        type: 'assignment',
        cohortId,
        createdById: teacherId
      }
    });
  }

  @Post(':assessmentId/submit')
  async submitAssessment(
    @Req() req: any,
    @Param('assessmentId') assessmentId: string,
    @Body() body: { answers: Record<string, string> }
  ) {
    const studentId = req.user?.id || req.user?.userId;

    // Load assessment with questions
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: { include: { questionTemplate: true } } }
    });
    if (!assessment) throw new Error('Assessment not found');

    // Auto-grade MCQ and true_false
    let score = 0;
    const totalPoints = assessment.questions.reduce((sum: number, q: any) => sum + Number(q.scoreWeight || 1), 0);

    for (const q of assessment.questions as any[]) {
      const studentAnswer = body.answers[q.id];
      if (!studentAnswer) continue;
      const correctAnswer = q.questionTemplate?.correctAnswer;
      if (correctAnswer && studentAnswer.trim() === correctAnswer.trim()) {
        score += Number(q.scoreWeight || 1);
      }
    }

    // Create submission
    const finalScore = totalPoints > 0 ? Math.round((score / totalPoints) * Number(assessment.maxScore || 100)) : 0;
    const submission = await this.prisma.assessmentSubmission.create({
      data: {
        assessmentId,
        studentId,
        status: 'submitted',
        submittedAt: new Date(),
        score: finalScore,
        feedback: JSON.stringify(body.answers),
      }
    });

    return { submission, score, totalPoints };
  }

  @Patch('submissions/:submissionId/grade')
  async gradeSubmission(
    @Req() req: any,
    @Param('submissionId') submissionId: string,
    @Body() body: { score: number; feedback: string }
  ) {
    const userId = req.user?.id || '11111111-1111-1111-1111-111111111111'; // fallback teacher ID
    return this.prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: body.score,
        feedback: body.feedback,
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

    // Also include 'fake' assessments if student is not in any cohort for demo purposes
    if (cohortIds.length === 0) {
       return this.prisma.assessment.findMany({
          orderBy: { createdAt: 'desc' },
          take: 3
       });
    }

    return this.prisma.assessment.findMany({
      where: { cohortId: { in: cohortIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        cohort: true,
        submissions: {
          where: { studentId }
        }
      }
    });
  }

  @Get()
  async getAssessments(@Req() req: any) {
    const userId = req.user?.id || req.user?.userId || '11111111-1111-1111-1111-111111111111';
    const role = req.user?.primaryRole || 'teacher';

    let whereClause: any = {};
    if (role === 'teacher') {
      whereClause = { createdById: userId };
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
      whereClause = {}; // Admin sees all
    } else {
       whereClause = { id: 'none' }; // Fallback
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
  async deleteAllAssessments() {
    // For demo purposes, we will delete all assessments to reset the environment
    await this.prisma.assessment.deleteMany();
    return { message: 'All assessments deleted successfully' };
  }
}
