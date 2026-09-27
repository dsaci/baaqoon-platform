import { Module } from "@nestjs/common";
import { ModerationWorkflowService } from "./application/moderation-workflow.service";
import { ChatGateway } from "./infrastructure/gateways/chat.gateway";
import { ChatController } from "./presentation/http/chat.controller";

@Module({
  controllers: [ChatController],
  providers: [ModerationWorkflowService, ChatGateway],
  exports: [ModerationWorkflowService],
})
export class ChatModule {}
