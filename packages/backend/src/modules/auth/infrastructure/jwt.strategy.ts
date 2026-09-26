import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UsersFacade } from "../../../modules/users/users.facade";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersFacade: UsersFacade,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>("JWT_SECRET") ||
        "baaqoon_super_secret_dev_key",
    });
  }

  async validate(payload: any) {
    const user = await this.usersFacade.getUserById(payload.sub);

    if (!user) {
      throw new UnauthorizedException("المستخدم غير موجود أو تم حذفه");
    }

    if (user.status !== "active") {
      throw new UnauthorizedException("الحساب غير مفعل");
    }

    return user; // Attached to request.user
  }
}
