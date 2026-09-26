import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthService } from "../../application/auth.service";
import { JwtAuthGuard } from "../../infrastructure/jwt-auth.guard";
// Note: Validation DTOs should be added here later

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() registerDto: any) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  getProfile(@Request() req: any) {
    // req.user is populated by JwtStrategy
    const user = req.user;

    // Remove sensitive data before returning
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
