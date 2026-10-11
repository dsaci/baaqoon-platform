import { Module } from "@nestjs/common";
import { SubjectService } from "./application/subject.service";
import { CourseService } from "./application/course.service";
import { CurriculumFacade } from "./curriculum.facade";
import { SubjectController } from "./presentation/http/subject.controller";
import { CourseController } from "./presentation/http/course.controller";
import { SyllabusController } from "./presentation/http/syllabus.controller";

@Module({
  controllers: [SubjectController, CourseController, SyllabusController],
  providers: [SubjectService, CourseService, CurriculumFacade],
  exports: [CurriculumFacade], // Only export the facade
})
export class CurriculumModule {}
