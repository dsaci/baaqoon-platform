import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { Subject, AcademicBranch } from "@prisma/client";

@Injectable()
export class SubjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    code: string;
    nameAr: string;
    nameEn?: string;
    description?: string;
    applicableBranches: AcademicBranch[];
  }): Promise<Subject> {
    return this.prisma.subject.create({
      data,
    });
  }

  async findAll(activeOnly: boolean = true): Promise<Subject[]> {
    return this.prisma.subject.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { nameAr: "asc" },
    });
  }

  async findById(id: string): Promise<Subject> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) throw new NotFoundException('المبحث غير موجود');

    return subject;
  }

  async getCurriculumTree(subjectIdFilter?: string) {
    return this.prisma.subject.findMany({
      where: subjectIdFilter ? { id: subjectIdFilter } : undefined,
      include: {
        courses: {
          include: {
            versions: {
              where: { status: 'published' },
              include: {
                units: {
                  orderBy: { orderIndex: 'asc' },
                  include: {
                    lessons: {
                      orderBy: { orderIndex: 'asc' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  }
}
