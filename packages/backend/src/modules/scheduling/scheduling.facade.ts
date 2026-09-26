import { Injectable } from "@nestjs/common";
import { SessionWorkflowService } from "./application/session-workflow.service";
import { JitsiService } from "./application/jitsi.service";
import { User } from "@prisma/client";

/**
 * Scheduling Facade
 * Provides strict interfaces for module interactions.
 */
@Injectable()
export class SchedulingFacade {
  constructor(
    private readonly sessionWorkflowService: SessionWorkflowService,
    private readonly jitsiService: JitsiService,
  ) {}

  async generateJitsiToken(user: User, roomName: string) {
    return this.jitsiService.generateToken(user, roomName);
  }

  // To be called by cron jobs (SessionOpenerCron)
  async openSession(sessionId: string) {
    return this.sessionWorkflowService.transitionSession(sessionId, {
      type: "OPEN",
    });
  }
}
