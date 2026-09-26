import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { AttendanceEventType, AttendanceStatus } from "@prisma/client";

@Injectable()
export class AttendanceTelemetryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processes a telemetry event (e.g. from Jitsi Webhooks or WebSocket)
   */
  async recordEvent(
    sessionId: string,
    studentId: string,
    eventType: AttendanceEventType,
    clientInfo?: any,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Find the parent attendance record
      const record = await tx.sessionAttendance.findUnique({
        where: {
          sessionId_studentId: { sessionId, studentId },
        },
      });

      if (!record) {
        throw new NotFoundException("سجل الحضور غير موجود لهذا الطالب");
      }

      // 2. Insert raw telemetry event (Tier 1)
      await tx.attendanceEvent.create({
        data: {
          sessionAttendanceId: record.id,
          sessionId,
          studentId,
          eventType,
          clientDeviceInfo: clientInfo ? JSON.stringify(clientInfo) : undefined,
        },
      });

      // 3. Aggregate logic (Tier 2)
      let { firstEntryTime, lastExitTime, status } = record;
      const now = new Date();

      if (eventType === "joined") {
        if (!firstEntryTime) firstEntryTime = now;
        status = AttendanceStatus.present; // Change from absent to present
      } else if (eventType === "left") {
        lastExitTime = now;
      }

      // Calculate new duration (rough estimation: if heartbeat, add 1 minute)
      // A more complex aggregation would run asynchronously, but for realtime:
      let durationIncrement = 0;
      if (eventType === "heartbeat") {
        durationIncrement = 60; // Assuming heartbeats are sent every 60s
      } else if (eventType === "left" && lastExitTime && firstEntryTime) {
        // Fallback calculation if needed
      }

      // Update parent record
      await tx.sessionAttendance.update({
        where: { id: record.id },
        data: {
          firstEntryTime,
          lastExitTime,
          status,
          totalDurationSeconds: { increment: durationIncrement },
        },
      });
    });
  }
}
