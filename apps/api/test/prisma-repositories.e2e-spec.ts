import { PrismaAuthSessionRepository } from '../src/modules/auth/infrastructure/prisma-auth-session.repository';
import { PrismaInitialSuperAdminRepository } from '../src/modules/users/infrastructure/prisma-initial-super-admin.repository';
import { PrismaUserRepository } from '../src/modules/users/infrastructure/prisma-user.repository';
import {
  createPostgreSqlTestSchema,
  type PostgreSqlTestSchema,
} from './support/postgresql-test-schema';

jest.setTimeout(30_000);

describe('Prisma repositories (PostgreSQL integration)', () => {
  let testSchema: PostgreSqlTestSchema | undefined;

  function getTestSchema(): PostgreSqlTestSchema {
    if (!testSchema) {
      throw new Error('PostgreSQL 临时测试 schema 尚未创建。');
    }

    return testSchema;
  }

  beforeAll(async () => {
    testSchema = await createPostgreSqlTestSchema();
  });

  beforeEach(async () => {
    const { prisma } = getTestSchema();

    await prisma.authSession.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await testSchema?.close();
  });

  it('atomically creates only one initial super administrator', async () => {
    const { prisma } = getTestSchema();
    const repository = new PrismaInitialSuperAdminRepository(prisma);
    const results = await Promise.all([
      repository.createIfNoUsersExist({
        normalizedEmail: 'first-super-admin@example.com',
        passwordHash: 'first-password-hash',
      }),
      repository.createIfNoUsersExist({
        normalizedEmail: 'second-super-admin@example.com',
        passwordHash: 'second-password-hash',
      }),
    ]);
    const createdUsers = results.filter((user) => user !== null);

    expect(createdUsers).toHaveLength(1);
    expect(createdUsers[0]).toMatchObject({
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    });
    expect([
      'first-super-admin@example.com',
      'second-super-admin@example.com',
    ]).toContain(createdUsers[0]?.email);
    await expect(
      repository.createIfNoUsersExist({
        normalizedEmail: 'third-super-admin@example.com',
        passwordHash: 'third-password-hash',
      }),
    ).resolves.toBeNull();
    await expect(prisma.user.count()).resolves.toBe(1);
  });

  it('loads the authentication fields for a user by normalized email', async () => {
    const { prisma } = getTestSchema();
    const repository = new PrismaUserRepository(prisma);
    const storedUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        passwordHash: 'stored-password-hash',
        role: 'ADMIN',
        status: 'DISABLED',
      },
    });

    await expect(
      repository.findForAuthenticationByEmail(storedUser.email),
    ).resolves.toEqual({
      id: storedUser.id,
      email: storedUser.email,
      passwordHash: storedUser.passwordHash,
      role: storedUser.role,
      status: storedUser.status,
    });
    await expect(
      repository.findForAuthenticationByEmail('missing@example.com'),
    ).resolves.toBeNull();
  });

  it('creates, resolves, and revokes an active authentication session', async () => {
    const { prisma } = getTestSchema();
    const repository = new PrismaAuthSessionRepository(prisma);
    const authenticatedAt = new Date('2026-08-25T08:00:00.000Z');
    const expiresAt = new Date('2026-08-26T08:00:00.000Z');
    const revokedAt = new Date('2026-08-25T09:00:00.000Z');
    const tokenHash = 'a'.repeat(64);
    const storedUser = await prisma.user.create({
      data: {
        email: 'user@example.com',
        passwordHash: 'stored-password-hash',
        role: 'USER',
        status: 'ACTIVE',
      },
    });

    await repository.createForSuccessfulLogin({
      userId: storedUser.id,
      tokenHash,
      expiresAt,
      authenticatedAt,
    });

    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: storedUser.id },
      select: { lastLoginAt: true },
    });
    const storedSession = await prisma.authSession.findUniqueOrThrow({
      where: { tokenHash },
    });

    expect(updatedUser.lastLoginAt).toEqual(authenticatedAt);
    expect(storedSession).toMatchObject({
      userId: storedUser.id,
      tokenHash,
      expiresAt,
      revokedAt: null,
    });
    await expect(
      repository.findActiveByTokenHash(
        tokenHash,
        new Date('2026-08-25T08:30:00.000Z'),
      ),
    ).resolves.toEqual({
      id: storedSession.id,
      expiresAt,
      user: {
        id: storedUser.id,
        email: storedUser.email,
        role: storedUser.role,
        status: storedUser.status,
      },
    });

    await expect(
      repository.revokeByTokenHash(tokenHash, revokedAt),
    ).resolves.toBe(true);
    await expect(
      repository.revokeByTokenHash(tokenHash, revokedAt),
    ).resolves.toBe(false);
    await expect(
      repository.findActiveByTokenHash(
        tokenHash,
        new Date('2026-08-25T08:30:00.000Z'),
      ),
    ).resolves.toBeNull();
  });

  it('does not resolve expired, revoked, or disabled-user sessions', async () => {
    const { prisma } = getTestSchema();
    const repository = new PrismaAuthSessionRepository(prisma);
    const now = new Date('2026-08-25T08:00:00.000Z');
    const expiredTokenHash = 'b'.repeat(64);
    const revokedTokenHash = 'c'.repeat(64);
    const disabledUserTokenHash = 'd'.repeat(64);

    await prisma.user.create({
      data: {
        email: 'active-user@example.com',
        passwordHash: 'stored-password-hash',
        status: 'ACTIVE',
        sessions: {
          create: [
            {
              tokenHash: expiredTokenHash,
              expiresAt: new Date('2026-08-25T07:59:59.999Z'),
            },
            {
              tokenHash: revokedTokenHash,
              expiresAt: new Date('2026-08-26T08:00:00.000Z'),
              revokedAt: new Date('2026-08-25T07:00:00.000Z'),
            },
          ],
        },
      },
    });
    await prisma.user.create({
      data: {
        email: 'disabled-user@example.com',
        passwordHash: 'stored-password-hash',
        status: 'DISABLED',
        sessions: {
          create: {
            tokenHash: disabledUserTokenHash,
            expiresAt: new Date('2026-08-26T08:00:00.000Z'),
          },
        },
      },
    });

    await expect(
      repository.findActiveByTokenHash(expiredTokenHash, now),
    ).resolves.toBeNull();
    await expect(
      repository.findActiveByTokenHash(revokedTokenHash, now),
    ).resolves.toBeNull();
    await expect(
      repository.findActiveByTokenHash(disabledUserTokenHash, now),
    ).resolves.toBeNull();
    await expect(
      repository.findActiveByTokenHash('e'.repeat(64), now),
    ).resolves.toBeNull();
  });
});
