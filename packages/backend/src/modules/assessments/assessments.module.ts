import { Module } from "@nestjs/common";
import { AssessmentWorkflowService } from "./application/assessment-workflow.service";
import { RapidGenerationService } from "./application/rapid-generation.service";
import { AssessmentsController } from "./presentation/http/rapid-generation.controller";

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentWorkflowService, RapidGenerationService],
  exports: [AssessmentWorkflowService, RapidGenerationService],
})
export class AssessmentsModule {}
