import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../../../core/database/prisma.service";
import { AttendanceStatus } from "@prisma/client";

@Injectable()
export class SessionStateChangedListener {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Listens to the domain event when a Session state changes.
   * If a session changes to "open" or "in_progress", we initialize attendance records
   * for all enrolled students in the cohort as "absent_unexcused" (default).
   */
  @OnEvent("session.state_changed", { async: true })
  async handleSessionStateChanged(payload: any) {
    // We only care when the session first opens or starts
    if (payload.toState !== "open" && payload.toState !== "in_progress") {
      return;
    }

    // Only do this once per session (check if records already exist)
    const existingRecords = await this.prisma.sessionAttendance.count({
      where: { sessionId: payload.sessionId },
    });

    if (existingRecords > 0) return;

    // Fetch all active enrollments for this cohort
    const enrollments = await this.prisma.cohortEnrollment.findMany({
      where: {
        cohortId: payload.cohortId,
        status: "enrolled",
      },
      select: { studentId: true },
    });

    if (enrollments.length === 0) return;

    // Bulk insert default attendance records
    const attendanceData = enrollments.map((e) => ({
      sessionId: payload.sessionId,
      studentId: e.studentId,
      status: AttendanceStatus.absent_unexcused,
    }));

    await this.prisma.sessionAttendance.createMany({
      data: attendanceData,
      skipDuplicates: true,
    });

    console.log(
      `[Attendance] Initialized ${attendanceData.length} attendance records for Session ${payload.sessionId}`,
    );
  }
}
