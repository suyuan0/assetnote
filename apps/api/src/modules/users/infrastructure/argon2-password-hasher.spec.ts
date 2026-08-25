import { Argon2PasswordHasher } from './argon2-password-hasher';

describe('Argon2PasswordHasher', () => {
  const passwordHasher = new Argon2PasswordHasher();

  it('hashes and verifies a password using Argon2id', async () => {
    const password = 'correct horse battery staple';
    const passwordHash = await passwordHasher.hash(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toMatch(/^\$argon2id\$/);
    await expect(passwordHasher.verify(password, passwordHash)).resolves.toBe(
      true,
    );
  });

  it('rejects an incorrect password', async () => {
    const passwordHash = await passwordHasher.hash('correct password');

    await expect(
      passwordHasher.verify('incorrect password', passwordHash),
    ).resolves.toBe(false);
  });
});
