
import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';

@Controller('curriculum/courses')
export class CourseController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getCourses() {
    return this.prisma.course.findMany({ include: { subject: true } });
  }
}
