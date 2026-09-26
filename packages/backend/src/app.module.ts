import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";

// We will import core and feature modules here as we build them
import { DatabaseModule } from "./core/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CurriculumModule } from "./modules/curriculum/curriculum.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AssessmentsModule } from "./modules/assessments/assessments.module";
import { ChatModule } from "./modules/chat/chat.module";
import { StorageModule } from "./modules/storage/storage.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";

import { SchedulingModule } from "./modules/scheduling/scheduling.module";
import { GroupsModule } from "./modules/groups/groups.module";

@Module({
  imports: [
    // 1. Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // 2. Global Event Emitter (for domain events)
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: ".",
    }),

    // 3. Core Modules (Database, Logger, AuthZ)
    DatabaseModule,
    StorageModule,

    // 4. Feature Modules (Modular Monolith Boundaries)
    AuthModule,
    UsersModule,
    CurriculumModule,
    AttendanceModule,
    AssessmentsModule,
    ChatModule,
    NotificationsModule,
    SchedulingModule,
    GroupsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
