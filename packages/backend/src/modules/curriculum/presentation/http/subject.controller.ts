import { Controller, Get, Query, Req, UseGuards, Header } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { SubjectService } from '../../application/subject.service';

@Controller('curriculum/subjects')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Get()
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
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
        if (role === 'subject_supervisor') {
      if (supervisedSubjectId) filterId = supervisedSubjectId;
    }
    // Teachers and Admins can see the whole tree
    return this.subjectService.getCurriculumTree(filterId);
  }
}
