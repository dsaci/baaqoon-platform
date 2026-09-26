import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import {
  Course,
  CurriculumType,
  AcademicBranch,
  GradeLevel,
} from "@prisma/client";

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    subjectId: string;
    code: string;
    title: string;
    slug: string;
    curriculumType: CurriculumType;
    academicBranch: AcademicBranch;
    gradeLevel: GradeLevel;
    academicYear: string;
    description?: string;
  }): Promise<Course> {
    const existing = await this.prisma.course.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException(`الدورة بالرمز ${data.code} موجودة مسبقاً`);
    }

    return this.prisma.course.create({
      data,
    });
  }

  async findActiveCourses(): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { isActive: true },
      include: {
        subject: true,
        versions: {
          where: { status: "published" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  async findById(id: string): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { subject: true, versions: true },
    });

    if (!course) throw new NotFoundException("الدورة غير موجودة");
    return course;
  }
}
