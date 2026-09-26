import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { SubjectService } from '../../application/subject.service';

@Controller('curriculum/subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  async getSubjects(@Query('activeOnly') activeOnly?: string) {
    const isActive = activeOnly !== 'false';
    return this.subjectService.findAll(isActive);
  }

  @Get('tree')
  @UseGuards(JwtAuthGuard)
  async getCurriculumTree(@Req() req: any) {
    const role = req.user?.primaryRole;
    const supervisedSubjectId = req.user?.supervisedSubjectId;
    let filterId = undefined;
    if (role === 'teacher' || role === 'subject_supervisor') {
      if (supervisedSubjectId) filterId = supervisedSubjectId;
      else return []; // if teacher has no subject, return empty
    }
    return this.subjectService.getCurriculumTree(filterId);
  }
}
