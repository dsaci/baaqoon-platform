import { Injectable } from "@nestjs/common";
import { UsersService } from "./application/users.service";

/**
 * Users Facade
 * This is the ONLY public interface exported by the Users module.
 * Other modules must inject UsersFacade, NEVER UsersService directly.
 */
@Injectable()
export class UsersFacade {
  constructor(private readonly usersService: UsersService) {}

  async getUserById(id: string) {
    return this.usersService.findById(id);
  }

  async getUserByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }

  async getUserByIdentifier(identifier: string) {
    return this.usersService.findByIdentifier(identifier);
  }
}
