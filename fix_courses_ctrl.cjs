const fs = require('fs');
let code = fs.readFileSync('packages/backend/src/modules/curriculum/presentation/http/subject.controller.ts', 'utf8');

const newRoute = `
  @Get('/api/v1/curriculum/courses')
  async getAllCoursesAlt() {
    return this.subjectService.getAllCourses();
  }
`;
// Actually, since this controller is prefixed with 'curriculum/subjects', we can just use another controller or modify the root path.
// But NestJS route prefix is hard to override inside the controller unless we use absolute path? No, we can just add a global controller or modify app.module.ts? No, let's just create a quick course controller.

let newCtrl = `
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
`;
fs.writeFileSync('packages/backend/src/modules/curriculum/presentation/http/course.controller.ts', newCtrl);
