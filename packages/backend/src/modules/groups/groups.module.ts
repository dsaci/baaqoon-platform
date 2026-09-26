import { Module } from '@nestjs/common';
import { GroupsController } from './presentation/http/groups.controller';

@Module({
  controllers: [GroupsController],
})
export class GroupsModule {}
