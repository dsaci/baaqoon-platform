import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../../auth/infrastructure/jwt-auth.guard";
import { PrismaService } from "../../../../core/database/prisma.service";
import { ModerationWorkflowService } from "../../application/moderation-workflow.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationWorkflowService,
  ) {}

  async handleConnection(client: Socket) {
    // Authentication is handled via middleware normally. Simplified for scaffolding.
    console.log(`[ChatGateway] Client connected: ${client.id}`);
  }

  @SubscribeMessage("join_conversation")
  handleJoinConversation(
    @MessageBody() data: { conversationId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`conversation_${data.conversationId}`);
    return { event: "joined", data };
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    @MessageBody()
    data: { conversationId: string; senderId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    // 1. Save to DB as pending_scan
    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        content: data.content,
        status: "pending_scan",
      },
    });

    // 2. Run moderation pipeline synchronously (or async and emit later)
    const moderatedMessage = await this.moderationService.scanMessage(
      message.id,
      data.content,
    );

    // 3. Broadcast if safe or approved
    if (
      moderatedMessage.status === "safe" ||
      moderatedMessage.status === "approved"
    ) {
      this.server
        .to(`conversation_${data.conversationId}`)
        .emit("new_message", moderatedMessage);
    } else if (moderatedMessage.status === "flagged") {
      // Flagged messages might still be shown but with a warning to sender/admin
      client.emit("message_flagged", moderatedMessage);
    } else if (moderatedMessage.status === "blocked") {
      // Blocked messages are never broadcasted
      client.emit("message_blocked", {
        id: message.id,
        reason: moderatedMessage.moderationReason,
      });
    }

    return { event: "message_sent", data: moderatedMessage };
  }
}
