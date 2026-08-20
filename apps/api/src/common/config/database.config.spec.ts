import { parseDatabaseConfig } from './database.config';

describe('parseDatabaseConfig', () => {
  it.each([
    'postgresql://assetnote:local-password@127.0.0.1:5432/assetnote?schema=public',
    'postgres://assetnote:local-password@localhost:5432/assetnote',
  ])('accepts a PostgreSQL URL using %s', (url) => {
    expect(parseDatabaseConfig(url)).toEqual({ url });
  });

  it.each([
    {
      caseName: 'an undefined value',
      value: undefined,
      expectedMessage: 'DATABASE_URL is required.',
    },
    {
      caseName: 'a blank value',
      value: '   ',
      expectedMessage: 'DATABASE_URL is required.',
    },
    {
      caseName: 'a malformed URL',
      value: 'not-a-url-secret-token',
      expectedMessage: 'DATABASE_URL must be a valid URL.',
    },
    {
      caseName: 'a non-PostgreSQL protocol',
      value: 'mysql://assetnote:secret-token@localhost:3306/assetnote',
      expectedMessage:
        'DATABASE_URL must use the postgresql:// or postgres:// protocol.',
    },
    {
      caseName: 'a missing host',
      value: 'postgresql:///assetnote-secret-token',
      expectedMessage: 'DATABASE_URL must include a host.',
    },
    {
      caseName: 'a missing database name',
      value: 'postgresql://assetnote:secret-token@localhost:5432/',
      expectedMessage: 'DATABASE_URL must include a database name.',
    },
  ])(
    'rejects $caseName without revealing the supplied value',
    ({ value, expectedMessage }) => {
      expect(() => parseDatabaseConfig(value)).toThrow(expectedMessage);

      try {
        parseDatabaseConfig(value);
      } catch (error) {
        if (!(error instanceof Error)) {
          throw error;
        }

        expect(error.message).toBe(expectedMessage);
        expect(error.message).not.toContain('secret-token');

        if (value) {
          expect(error.message).not.toContain(value);
        }
      }
    },
  );
});
