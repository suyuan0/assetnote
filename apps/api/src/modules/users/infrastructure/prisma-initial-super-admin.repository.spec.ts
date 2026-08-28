import { Prisma } from '../../../generated/prisma/client';
import {
  isSerializableTransactionConflict,
  isUsersEmailUniqueConstraintConflict,
} from './prisma-initial-super-admin.repository';

function createKnownRequestError(
  code: string,
  meta: Record<string, unknown>,
): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test error', {
    clientVersion: '7.9.1',
    code,
    meta,
  });
}

describe('isUsersEmailUniqueConstraintConflict', () => {
  it.each([
    { target: ['email'] },
    { target: 'users_email_key' },
    {
      driverAdapterError: {
        cause: {
          constraint: {
            fields: ['email'],
          },
        },
      },
    },
  ])('accepts users.email P2002 metadata', (meta) => {
    expect(
      isUsersEmailUniqueConstraintConflict(
        createKnownRequestError('P2002', meta),
      ),
    ).toBe(true);
  });

  it('does not accept a P2002 for another unique field', () => {
    expect(
      isUsersEmailUniqueConstraintConflict(
        createKnownRequestError('P2002', { target: ['tokenHash'] }),
      ),
    ).toBe(false);
  });

  it('does not accept another Prisma error code', () => {
    expect(
      isUsersEmailUniqueConstraintConflict(
        createKnownRequestError('P2034', { target: ['email'] }),
      ),
    ).toBe(false);
  });
});

describe('isSerializableTransactionConflict', () => {
  it('accepts a Prisma P2034 error', () => {
    expect(
      isSerializableTransactionConflict(createKnownRequestError('P2034', {})),
    ).toBe(true);
  });

  it('accepts the Prisma PostgreSQL adapter transaction conflict', () => {
    expect(
      isSerializableTransactionConflict({
        name: 'DriverAdapterError',
        cause: {
          kind: 'TransactionWriteConflict',
        },
      }),
    ).toBe(true);
  });

  it('does not accept another driver adapter failure', () => {
    expect(
      isSerializableTransactionConflict({
        name: 'DriverAdapterError',
        cause: {
          kind: 'UniqueConstraintViolation',
        },
      }),
    ).toBe(false);
  });
});
