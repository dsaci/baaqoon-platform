import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';

@Controller('syllabus')
@UseGuards(JwtAuthGuard)
export class SyllabusController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getDistributions(@Query('courseId') courseId?: string, @Query('academicYear') academicYear?: string) {
    const whereClause: any = {};
    if (courseId) whereClause.courseId = courseId;
    if (academicYear) whereClause.academicYear = academicYear;
    
    // We just want to get all courses with their latest distribution for simplicity
    const distributions = await this.prisma.syllabusDistribution.findMany({
      where: whereClause,
      include: {
        course: {
          select: { title: true, code: true, curriculumType: true }
        },
        months: {
          orderBy: [
            { semester: 'asc' },
            { monthIndex: 'asc' }
          ]
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return distributions;
  }
}
