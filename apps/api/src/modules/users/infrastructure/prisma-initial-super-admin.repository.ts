import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
import type {
  CreateInitialSuperAdminInput,
  InitialSuperAdminRepository,
} from '../application/initial-super-admin.repository';
import type { User } from '../domain/user';

const MAX_INITIAL_SUPER_ADMIN_ATTEMPTS = 3;
const USERS_EMAIL_UNIQUE_CONSTRAINT = 'users_email_key';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isEmailFieldList(value: unknown): boolean {
  return Array.isArray(value) && value.length === 1 && value[0] === 'email';
}

function isUsersEmailConstraint(value: unknown): boolean {
  if (value === USERS_EMAIL_UNIQUE_CONSTRAINT || isEmailFieldList(value)) {
    return true;
  }

  if (!isRecord(value)) {
    return false;
  }

  return (
    value['index'] === USERS_EMAIL_UNIQUE_CONSTRAINT ||
    isEmailFieldList(value['fields'])
  );
}

function isSerializableTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

export function isUsersEmailUniqueConstraintConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== 'P2002' ||
    !isRecord(error.meta)
  ) {
    return false;
  }

  if (
    isUsersEmailConstraint(error.meta['target']) ||
    isUsersEmailConstraint(error.meta['constraint'])
  ) {
    return true;
  }

  const driverAdapterError = error.meta['driverAdapterError'];

  if (!isRecord(driverAdapterError)) {
    return false;
  }

  const cause = driverAdapterError['cause'];

  return isRecord(cause) && isUsersEmailConstraint(cause['constraint']);
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
      if (isSerializableTransactionConflict(error)) {
        if (attempt >= MAX_INITIAL_SUPER_ADMIN_ATTEMPTS) {
          throw error;
        }

        return this.createWithSerializableRetry(input, attempt + 1);
      }

      if (isUsersEmailUniqueConstraintConflict(error)) {
        return this.resolveUsersEmailUniqueConflict(input, attempt, error);
      }

      throw error;
    }
  }

  private async resolveUsersEmailUniqueConflict(
    input: CreateInitialSuperAdminInput,
    attempt: number,
    originalError: unknown,
  ): Promise<User | null> {
    const existingUser = await this.prisma.user.findFirst({
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return null;
    }

    if (attempt >= MAX_INITIAL_SUPER_ADMIN_ATTEMPTS) {
      throw originalError;
    }

    return this.createWithSerializableRetry(input, attempt + 1);
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
