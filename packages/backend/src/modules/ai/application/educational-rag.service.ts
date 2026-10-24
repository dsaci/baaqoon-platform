import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';

export interface CurriculumContext {
  lesson: {
    id: string;
    title: string;
    domain: string | null;
    lessonType: string | null;
    estimatedDurationMinutes: number | null;
    learningObjectives: string[];
    learningSequence: any;
    teacherGuide: string | null;
  };
  unit: {
    id: string;
    title: string;
    unitNumber: number | null;
    pdfStartPage: number | null;
    pdfEndPage: number | null;
    competencies: string[];
  };
  course: {
    id: string;
    title: string;
    gradeLevel: string;
    academicBranch: string;
    curriculumType: string;
  };
  subject: {
    id: string;
    nameAr: string;
    code: string;
  };
  textbook: {
    title: string | null;
    pdfUrl: string | null;
  } | null;
  existingQuestions: Array<{
    id: string;
    content: string;
    type: string;
    difficulty: string | null;
    options: any;
    correctAnswer: string | null;
  }>;
}

@Injectable()
export class EducationalRagService {
  private readonly logger = new Logger(EducationalRagService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCurriculumContext(lessonId: string): Promise<CurriculumContext> {
    const lesson = await this.prisma.curriculumLesson.findUnique({
      where: { id: lessonId },
      include: {
        unit: {
          include: {
            textbook: true,
            version: {
              include: {
                course: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
          },
        },
        questionTemplates: {
          take: 20,
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`الدرس بالمعرف ${lessonId} غير موجود`);
    }

    const unit = lesson.unit;
    const version = unit?.version;
    const course = version?.course;
    const subject = course?.subject;
    const textbook = unit?.textbook || null;

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        domain: (lesson as any).domain || null,
        lessonType: (lesson as any).lessonType || null,
        estimatedDurationMinutes: (lesson as any).estimatedDurationMinutes || null,
        learningObjectives: (lesson as any).learningObjectives || [],
        learningSequence: (lesson as any).learningSequence || null,
        teacherGuide: (lesson as any).teacherGuide || null,
      },
      unit: {
        id: unit?.id || '',
        title: unit?.title || '',
        unitNumber: (unit as any)?.orderIndex ?? null,
        pdfStartPage: (unit as any)?.pdfStartPage || null,
        pdfEndPage: (unit as any)?.pdfEndPage || null,
        competencies: (unit as any)?.competencies || [],
      },
      course: {
        id: course?.id || '',
        title: course?.title || '',
        gradeLevel: (course as any)?.gradeLevel || '',
        academicBranch: (course as any)?.academicBranch || '',
        curriculumType: (course as any)?.curriculumType || '',
      },
      subject: {
        id: subject?.id || '',
        nameAr: subject?.nameAr || '',
        code: subject?.code || '',
      },
      textbook: textbook
        ? {
            title: (textbook as any)?.title || null,
            pdfUrl: (textbook as any)?.pdfUrl || null,
          }
        : null,
      existingQuestions: (lesson.questionTemplates || []).map((q: any) => ({
        id: q.id,
        content: q.content,
        type: q.type,
        difficulty: q.difficulty || null,
        options: q.options || null,
        correctAnswer: q.correctAnswer || null,
      })),
    };
  }

  /** Get a curriculum tree for the modal selector (teacher cohorts + all published courses fallback) */
  async getTeacherCurriculumTree(teacherId: string) {
    // 1. Get cohorts teacher is assigned to
    const cohortInstructors = await this.prisma.cohortInstructor.findMany({
      where: { teacherId },
      include: {
        cohort: true,
      },
    });

    const cohortList: any[] = [];

    for (const ci of cohortInstructors) {
      const cohort = ci.cohort;
      const course = await this.prisma.course.findUnique({
        where: { id: cohort.courseId },
        include: {
          subject: true,
          versions: {
            where: { status: 'published' },
            take: 1,
            include: {
              units: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (course) {
        cohortList.push({
          cohortId: cohort.id,
          cohortName: cohort.name,
          course: {
            id: course.id,
            title: course.title,
            subject: course.subject,
            gradeLevel: course.gradeLevel,
            academicBranch: course.academicBranch,
          },
          units: (course.versions[0]?.units || []).map((unit: any) => ({
            id: unit.id,
            title: unit.title,
            lessons: unit.lessons,
          })),
        });
      }
    }

    // 2. Fallback: If teacher has no cohorts, or cohorts have empty units, return courses directly
    if (cohortList.length === 0) {
      const courses = await this.prisma.course.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: true,
          versions: {
            where: { status: 'published' },
            take: 1,
            include: {
              units: {
                orderBy: { orderIndex: 'asc' },
                include: {
                  lessons: {
                    orderBy: { orderIndex: 'asc' },
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      for (const course of courses) {
        const units = course.versions[0]?.units || [];
        if (units.length > 0) {
          cohortList.push({
            cohortId: course.id,
            cohortName: `مقرر: ${course.title}`,
            course: {
              id: course.id,
              title: course.title,
              subject: course.subject,
              gradeLevel: course.gradeLevel,
              academicBranch: course.academicBranch,
            },
            units: units.map((unit: any) => ({
              id: unit.id,
              title: unit.title,
              lessons: unit.lessons,
            })),
          });
        }
      }
    }

    return cohortList;
  }
}
