import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class RapidGenerationService {
  constructor(private readonly prisma: PrismaService) {}

  async generateAssessment(cohortId: string, curriculumLessonId: string | undefined, teacherId: string, questionCount: number = 5) {
    const teacherUuid = '11111111-1111-1111-1111-111111111111';
    let user = await this.prisma.user.findUnique({ where: { id: teacherUuid } });
    if (!user) {
       user = await this.prisma.user.create({
         data: { id: teacherUuid, email: 'demo@baaqoon.ps', firstName: 'Demo', lastName: 'Teacher', passwordHash: 'xx', primaryRole: 'teacher' }
       });
    }

    const cohortUuid = '22222222-2222-2222-2222-222222222222';
    let cohort = await this.prisma.cohort.findFirst();
    if (!cohort) {
      const subject = await this.prisma.subject.findFirst() || await this.prisma.subject.create({ data: { code: 'SUB2', nameAr: 'Sub2', curriculumType: 'governmental' } });
      const course = await this.prisma.course.findFirst() || await this.prisma.course.create({ data: { subjectId: subject.id, code: 'C2', title: 'Course2', slug: 'c2', curriculumType: 'governmental', academicBranch: 'scientific', gradeLevel: 'grade_12', academicYear: '2025' } });
      const version = await this.prisma.curriculumVersion.findFirst() || await this.prisma.curriculumVersion.create({ data: { courseId: course.id, versionTag: 'v1', status: 'published' } });
      cohort = await this.prisma.cohort.create({
        data: { 
          id: cohortUuid, 
          courseId: course.id, 
          curriculumVersionId: version.id,
          name: 'فوج غزة 2', 
          code: 'F-GAZA-2',
          maxStudents: 15,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30*24*60*60*1000)
        }
      });
    }

    // 3. Get Lesson
    const lesson = curriculumLessonId 
      ? await this.prisma.curriculumLesson.findUnique({
          where: { id: curriculumLessonId },
          include: { questionTemplates: true }
        })
      : await this.prisma.curriculumLesson.findFirst({
          include: { questionTemplates: true }
        });

    if (!lesson) {
      throw new NotFoundException('الدرس غير موجود');
    }

    let selectedQuestions = [];
    if (!lesson.questionTemplates || !lesson.questionTemplates.length) {
      // Create 5 dummy questions on the fly
      for(let i=1; i<=questionCount; i++) {
         selectedQuestions.push({
            id: 'dummy-q-' + Date.now() + '-' + i, text: 'سؤال افتراضي رقم ' + i + ' حول ' + lesson.title,
            type: 'multiple_choice',
            options: ['خيار أ', 'خيار ب', 'خيار ج', 'خيار د'],
            correctAnswer: 'خيار أ',
            points: 2
         });
      }
    } else {
      const shuffled = lesson.questionTemplates.sort(() => 0.5 - Math.random());
      selectedQuestions = shuffled.slice(0, questionCount);
    }

    // Ensure we have some mock students in the cohort
    let students = await this.prisma.user.findMany({ where: { primaryRole: 'student' }, take: 3 });
    if (students.length === 0) {
      for (let i = 1; i <= 3; i++) {
        students.push(await this.prisma.user.create({
          data: { email: `student${i}@baaqoon.ps`, firstName: `طالب`, lastName: `${i}`, passwordHash: 'xx', primaryRole: 'student', status: 'active' }
        }));
      }
    }

    // Create the assessment with submissions
    const assessment = await this.prisma.assessment.create({
      data: {
        title: `اختبار ذكي: ${lesson.title}`,
        type: 'quiz',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Due in 24 hours
        maxScore: selectedQuestions.length * 2, // 2 points per question
        cohortId: cohort.id,
        curriculumLessonId: lesson.id,
        createdById: user.id,
        questions: {
          create: selectedQuestions.map((qt, idx) => ({
            questionTemplateId: qt.id,
            orderIndex: idx,
            scoreWeight: 2.0
          }))
        },
        submissions: {
          create: students.map((s, idx) => ({
            student: { connect: { id: s.id } },
            status: idx === 0 ? 'graded' : (idx === 1 ? 'submitted' : 'draft'),
            score: idx === 0 ? (selectedQuestions.length * 2) - 1 : null,
            feedback: idx === 0 ? 'عمل ممتاز وإجابات دقيقة.' : null,
            submittedAt: idx < 2 ? new Date() : null,
            gradedAt: idx === 0 ? new Date() : null,
            gradedBy: idx === 0 ? { connect: { id: user.id } } : undefined,
          }))
        }
      },
      include: {
        questions: {
          include: {
            questionTemplate: true
          }
        },
        submissions: {
          include: {
            student: true
          }
        }
      }
    });

    return assessment;
  }
}
