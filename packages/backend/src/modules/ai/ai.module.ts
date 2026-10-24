import { Module } from '@nestjs/common';
import { AiProviderService } from './application/ai-provider.service';
import { EducationalRagService } from './application/educational-rag.service';
import { EducationalGenerationService } from './application/educational-generation.service';
import { AiGenerationController } from './presentation/http/ai-generation.controller';

@Module({
  controllers: [AiGenerationController],
  providers: [AiProviderService, EducationalRagService, EducationalGenerationService],
  exports: [EducationalGenerationService, EducationalRagService, AiProviderService],
})
export class AiModule {}
