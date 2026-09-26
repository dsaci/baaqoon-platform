import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { createActor } from "xstate";
import {
  messageModerationMachine,
  MessageEvent,
} from "../domain/message-moderation.machine";
import { MessageStatus } from "@prisma/client";

@Injectable()
export class ModerationWorkflowService {
  // Simple regex for Palestinian phone numbers as per requirement
  private readonly phoneRegex = /(?:(?:\+|00)970|0?59|0?56)\d{7}/g;
  private readonly blockedDomains = [
    "facebook.com",
    "instagram.com",
    "tiktok.com",
    "t.me",
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Scans a newly created message and transitions it through the pipeline
   */
  async scanMessage(messageId: string, content: string) {
    let event: MessageEvent = { type: "MARK_SAFE" };

    if (this.phoneRegex.test(content)) {
      event = {
        type: "FLAG",
        reason: "يحتوي على رقم هاتف (احتمالية مشاركة معلومات شخصية)",
      };
    } else if (this.blockedDomains.some((domain) => content.includes(domain))) {
      event = {
        type: "BLOCK",
        reason: "يحتوي على رابط لمنصة تواصل اجتماعي محظورة",
      };
    }

    return this.transitionMessage(messageId, event);
  }

  async transitionMessage(messageId: string, event: MessageEvent) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.findUnique({ where: { id: messageId } });
      if (!message) throw new NotFoundException("الرسالة غير موجودة");

      const actor = createActor(messageModerationMachine, {
        snapshot: {
          status: "active",
          value: message.status,
          context: {
            messageId: message.id,
            moderationReason: message.moderationReason || undefined,
          },
        } as any,
      });

      actor.start();

      if (!actor.getSnapshot().can(event)) return message; // Skip if invalid

      actor.send(event);
      const nextSnapshot = actor.getSnapshot();
      const nextState = String(nextSnapshot.value) as MessageStatus;

      const updated = await tx.message.update({
        where: { id: messageId, version: message.version },
        data: {
          status: nextState,
          moderationReason: nextSnapshot.context.moderationReason,
          version: { increment: 1 },
        },
      });

      this.eventEmitter.emit("chat.message_moderated", updated);

      // If it was blocked, automatically escalate to manual review
      if (nextState === "blocked" || nextState === "flagged") {
        // Escalate asynchronously
        this.eventEmitter.emit("chat.message_escalated", updated);
      }

      return updated;
    });
  }
}
