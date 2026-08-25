import { BootstrapSuperAdminService } from './bootstrap-super-admin.service';
import { InitialSuperAdminAlreadyExistsError } from './initial-super-admin-already-exists.error';
import type { InitialSuperAdminRepository } from './initial-super-admin.repository';
import type { PasswordHasher } from './password-hasher';

const PASSWORD_HASH = 'encoded-password-hash';

const SUPER_ADMIN = {
  id: '8a5c15a2-a356-4c7a-9107-d79f73330742',
  email: 'owner@example.com',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
} as const;

describe('BootstrapSuperAdminService', () => {
  let createInitialSuperAdmin: jest.Mock<
    ReturnType<InitialSuperAdminRepository['createIfNoUsersExist']>,
    Parameters<InitialSuperAdminRepository['createIfNoUsersExist']>
  >;
  let hashPassword: jest.Mock<
    ReturnType<PasswordHasher['hash']>,
    Parameters<PasswordHasher['hash']>
  >;
  let service: BootstrapSuperAdminService;

  beforeEach(() => {
    createInitialSuperAdmin = jest.fn<
      ReturnType<InitialSuperAdminRepository['createIfNoUsersExist']>,
      Parameters<InitialSuperAdminRepository['createIfNoUsersExist']>
    >();
    hashPassword = jest.fn<
      ReturnType<PasswordHasher['hash']>,
      Parameters<PasswordHasher['hash']>
    >();

    const initialSuperAdminRepository: InitialSuperAdminRepository = {
      createIfNoUsersExist: createInitialSuperAdmin,
    };
    const passwordHasher: PasswordHasher = {
      hash: hashPassword,
      verify: jest.fn<
        ReturnType<PasswordHasher['verify']>,
        Parameters<PasswordHasher['verify']>
      >(),
    };

    hashPassword.mockResolvedValue(PASSWORD_HASH);
    service = new BootstrapSuperAdminService(
      initialSuperAdminRepository,
      passwordHasher,
    );
  });

  it('normalizes the email, preserves the password, and creates the first super administrator', async () => {
    createInitialSuperAdmin.mockResolvedValue(SUPER_ADMIN);

    const result = await service.execute({
      email: '  Owner@Example.COM  ',
      password: '  exact bootstrap password  ',
    });

    expect(hashPassword).toHaveBeenCalledWith('  exact bootstrap password  ');
    expect(createInitialSuperAdmin).toHaveBeenCalledWith({
      normalizedEmail: 'owner@example.com',
      passwordHash: PASSWORD_HASH,
    });
    expect(result).toEqual(SUPER_ADMIN);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('refuses initialization when any user already exists', async () => {
    createInitialSuperAdmin.mockResolvedValue(null);

    await expect(
      service.execute({
        email: SUPER_ADMIN.email,
        password: 'bootstrap password',
      }),
    ).rejects.toBeInstanceOf(InitialSuperAdminAlreadyExistsError);
  });
});
