import { NodeSessionTokenService } from './node-session-token.service';

describe('NodeSessionTokenService', () => {
  const sessionTokenService = new NodeSessionTokenService();

  it('generates a 256-bit opaque token and its SHA-256 hash', () => {
    const result = sessionTokenService.generate();

    expect(result.rawToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(result.rawToken, 'base64')).toHaveLength(32);
    expect(result.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionTokenService.hash(result.rawToken)).toBe(result.tokenHash);
  });

  it('generates a different token each time', () => {
    const first = sessionTokenService.generate();
    const second = sessionTokenService.generate();

    expect(first.rawToken).not.toBe(second.rawToken);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it('hashes existing tokens with SHA-256', () => {
    expect(sessionTokenService.hash('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
