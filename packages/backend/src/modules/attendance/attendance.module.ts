import { Module } from "@nestjs/common";
import { AttendanceTelemetryService } from "./application/attendance-telemetry.service";
import { SessionStateChangedListener } from "./infrastructure/listeners/session-state-changed.listener";

@Module({
  providers: [AttendanceTelemetryService, SessionStateChangedListener],
  exports: [AttendanceTelemetryService],
})
export class AttendanceModule {}
