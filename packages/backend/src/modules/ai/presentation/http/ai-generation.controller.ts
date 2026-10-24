import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/infrastructure/jwt-auth.guard';
import { EducationalGenerationService, GenerationRequest } from '../../application/educational-generation.service';
import { EducationalRagService } from '../../application/educational-rag.service';
import { AiProviderService } from '../../application/ai-provider.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiGenerationController {
  constructor(
    private readonly generationService: EducationalGenerationService,
    private readonly ragService: EducationalRagService,
    private readonly aiProvider: AiProviderService,
  ) {}

  /**
   * POST /ai/generate
   * Generates educational content for a given lesson and output type.
   * Accessible by teachers, supervisors, and admins only.
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(@Req() req: any, @Body() body: GenerationRequest) {
    const role = req.user?.primaryRole;
    const allowed = ['teacher', 'subject_supervisor', 'supervisor', 'admin', 'super_admin'];
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException('فقط الأساتذة والمشرفون يمكنهم استخدام ميزة التوليد الذكي');
    }

    if (!body.lessonId || !body.outputType) {
      throw new UnauthorizedException('يرجى تحديد الدرس ونوع المحتوى المطلوب توليده');
    }

    return this.generationService.generate(body);
  }

  /**
   * GET /ai/curriculum-tree
   * Returns the teacher's cohorts → units → lessons tree for the modal selector.
   */
  @Get('curriculum-tree')
  async getCurriculumTree(@Req() req: any) {
    const teacherId = req.user?.id || req.user?.userId;
    if (!teacherId) {
      throw new UnauthorizedException('يجب تسجيل الدخول');
    }
    return this.ragService.getTeacherCurriculumTree(teacherId);
  }

  /**
   * POST /ai/assist-assignment
   * Proposes, completes, or refines assignment content for a teacher in real time.
   */
  @Post('assist-assignment')
  @HttpCode(HttpStatus.OK)
  async assistAssignment(@Req() req: any, @Body() body: any) {
    const role = req.user?.primaryRole;
    const allowed = ['teacher', 'subject_supervisor', 'supervisor', 'admin', 'super_admin'];
    if (!role || !allowed.includes(role)) {
      throw new ForbiddenException('فقط الأساتذة والمشرفون يمكنهم استخدام المساعد الذكي');
    }

    return this.generationService.assistAssignment(body);
  }

  /**
   * GET /ai/status
   * Returns whether AI is configured and ready.
   */
  @Get('status')
  async getStatus() {
    return {
      configured: this.aiProvider.isConfigured(),
      message: this.aiProvider.isConfigured()
        ? 'الذكاء الاصطناعي جاهز للاستخدام'
        : 'لم يتم إعداد مزود الذكاء الاصطناعي — يعمل المولد بوضع قاعدة البيانات فقط',
    };
  }
}
