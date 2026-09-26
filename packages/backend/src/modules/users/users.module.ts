import { Module } from "@nestjs/common";
import { UsersService } from "./application/users.service";
import { UsersFacade } from "./users.facade";

@Module({
  providers: [UsersService, UsersFacade],
  exports: [UsersFacade], // Only export the facade!
})
export class UsersModule {}
