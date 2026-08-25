import { normalizeEmail } from './normalize-email';

describe('normalizeEmail', () => {
  it('trims whitespace and converts the email to lowercase', () => {
    expect(normalizeEmail('  Tomoyo@Example.COM  ')).toBe('tomoyo@example.com');
  });

  it('does not apply provider-specific address rewriting', () => {
    expect(normalizeEmail('a.b+portfolio@gmail.com')).toBe(
      'a.b+portfolio@gmail.com',
    );
  });
});
