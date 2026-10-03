import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../core/database/prisma.service";
import { User, UserRole, UserStatus } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });

    if (!user) {
      throw new NotFoundException(`المستخدم غير موجود`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    const id = (identifier || '').trim();
    if (!id) return null;
    const digits = id.replace(/\D/g, '');
    const tail = digits.length >= 9 ? digits.slice(-9) : null;
    const OR: any[] = [
      { email: { equals: id, mode: 'insensitive' } },
      { phone: id },
    ];
    if (tail && !id.includes('@')) OR.push({ phone: { endsWith: tail } });
    return this.prisma.user.findFirst({
      where: { OR },
      include: { roles: true },
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }
}
