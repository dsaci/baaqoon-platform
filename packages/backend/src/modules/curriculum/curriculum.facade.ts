import { Injectable } from "@nestjs/common";
import { SubjectService } from "./application/subject.service";
import { CourseService } from "./application/course.service";

/**
 * Curriculum Facade
 * Provides a strictly typed interface for other modules (e.g., Scheduling, Groups)
 * to interact with Curriculum data without importing internal services.
 */
@Injectable()
export class CurriculumFacade {
  constructor(
    private readonly subjectService: SubjectService,
    private readonly courseService: CourseService,
  ) {}

  async getCourseById(courseId: string) {
    return this.courseService.findById(courseId);
  }

  async getActiveCourses() {
    return this.courseService.findActiveCourses();
  }

  async getSubjectById(subjectId: string) {
    return this.subjectService.findById(subjectId);
  }
}
