import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/database/prisma.service';
import type { UserRepository } from '../application/user.repository';
import type { AuthenticatableUser } from '../domain/user';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findForAuthenticationByEmail(
    normalizedEmail: string,
  ): Promise<AuthenticatableUser | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      status: user.status,
    };
  }
}
