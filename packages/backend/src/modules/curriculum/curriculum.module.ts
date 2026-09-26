import { Module } from "@nestjs/common";
import { SubjectService } from "./application/subject.service";
import { CourseService } from "./application/course.service";
import { CurriculumFacade } from "./curriculum.facade";
import { SubjectController } from "./presentation/http/subject.controller";

@Module({
  controllers: [SubjectController],
  providers: [SubjectService, CourseService, CurriculumFacade],
  exports: [CurriculumFacade], // Only export the facade
})
export class CurriculumModule {}
