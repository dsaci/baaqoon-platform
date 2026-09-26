import { Module } from '@nestjs/common';
import { SessionsController } from './presentation/http/sessions.controller';

@Module({
  controllers: [SessionsController],
  providers: [],
})
export class SchedulingModule {}
