import { Module } from "@nestjs/common";
import { ModerationWorkflowService } from "./application/moderation-workflow.service";
import { ChatGateway } from "./infrastructure/gateways/chat.gateway";

@Module({
  providers: [ModerationWorkflowService, ChatGateway],
  exports: [ModerationWorkflowService],
})
export class ChatModule {}
