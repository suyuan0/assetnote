import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import type {
  CreateInitialSuperAdminInput,
  InitialSuperAdminRepository,
} from '../application/initial-super-admin.repository';
import type { User } from '../domain/user';

const MAX_SERIALIZABLE_TRANSACTION_ATTEMPTS = 3;

function isSerializableTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

@Injectable()
export class PrismaInitialSuperAdminRepository implements InitialSuperAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  createIfNoUsersExist(
    input: CreateInitialSuperAdminInput,
  ): Promise<User | null> {
    return this.createWithSerializableRetry(input, 1);
  }

  private async createWithSerializableRetry(
    input: CreateInitialSuperAdminInput,
    attempt: number,
  ): Promise<User | null> {
    try {
      return await this.createWithinSerializableTransaction(input);
    } catch (error) {
      if (
        !isSerializableTransactionConflict(error) ||
        attempt >= MAX_SERIALIZABLE_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }

      return this.createWithSerializableRetry(input, attempt + 1);
    }
  }

  private createWithinSerializableTransaction(
    input: CreateInitialSuperAdminInput,
  ): Promise<User | null> {
    return this.prisma.$transaction(
      async (transaction) => {
        const existingUser = await transaction.user.findFirst({
          select: {
            id: true,
          },
        });

        if (existingUser) {
          return null;
        }

        const user = await transaction.user.create({
          data: {
            email: input.normalizedEmail,
            passwordHash: input.passwordHash,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
          },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }
}
