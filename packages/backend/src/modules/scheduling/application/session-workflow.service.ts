import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { createActor } from "xstate";
import { sessionMachine, SessionEvent } from "../domain/session.machine";
import { SessionStatus } from "@prisma/client";

@Injectable()
export class SessionWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async transitionSession(sessionId: string, event: SessionEvent) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Fetch current session state
      const session = await tx.session.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new NotFoundException("الحصة غير موجودة");
      }

      // 2. Rehydrate XState Actor
      const actor = createActor(sessionMachine, {
        snapshot: {
          status: "active",
          value: session.status,
          context: {
            sessionId: session.id,
            cohortId: session.cohortId,
            teacherId: session.teacherId,
            jitsiRoomName: session.jitsiRoomName || undefined,
          },
        } as any,
      });

      actor.start();

      // 3. Validate transition
      if (!actor.getSnapshot().can(event)) {
        throw new BadRequestException(
          `لا يمكن تنفيذ الإجراء [${event.type}] لأن حالة الحصة الحالية هي [${session.status}]`,
        );
      }

      // 4. Execute transition
      actor.send(event);
      const nextSnapshot = actor.getSnapshot();
      const nextState = String(nextSnapshot.value) as SessionStatus;

      // 5. Persist safely with Optimistic Locking
      const updated = await tx.session.update({
        where: {
          id: sessionId,
          version: session.version,
        },
        data: {
          status: nextState,
          jitsiRoomName: nextSnapshot.context.jitsiRoomName,
          cancellationReason: nextSnapshot.context.cancellationReason,
          version: { increment: 1 },
          ...(nextState === "in_progress"
            ? { actualStartTime: new Date() }
            : {}),
          ...(nextState === "completed" ? { actualEndTime: new Date() } : {}),
        },
      });

      // 6. Emit Domain Event for Attendance and Notifications
      this.eventEmitter.emit("session.state_changed", {
        sessionId: updated.id,
        cohortId: updated.cohortId,
        teacherId: updated.teacherId,
        fromState: session.status,
        toState: nextState,
      });

      return updated;
    });
  }
}
