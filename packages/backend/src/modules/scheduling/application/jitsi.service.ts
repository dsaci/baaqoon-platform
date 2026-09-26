import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { User } from "@prisma/client";

@Injectable()
export class JitsiService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates a Jitsi JWT to securely authenticate a user into a meeting room.
   * Disables recording globally via token features.
   */
  generateToken(user: User, roomName: string): string {
    const appId = this.configService.get<string>("JITSI_APP_ID") || "baaqoon";
    const appSecret =
      this.configService.get<string>("JITSI_APP_SECRET") || "dev_jitsi_secret";

    // Check if user is a teacher (moderator)
    const isModerator = user.primaryRole === "teacher";

    const payload = {
      context: {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          avatar: user.avatarUrl || "",
        },
        features: {
          // Strictly disable recording and livestreaming
          recording: false,
          livestreaming: false,
          "screen-sharing": isModerator,
        },
      },
      moderator: isModerator,
      room: roomName,
      aud: "jitsi",
      iss: appId,
      sub: this.configService.get<string>("JITSI_DOMAIN") || "meet.baaqoon.org",
    };

    // Token expires in 2 hours
    return jwt.sign(payload, appSecret, { expiresIn: "2h" });
  }
}
