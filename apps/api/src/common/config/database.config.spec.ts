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
      expectedMessage: '必须配置 DATABASE_URL。',
    },
    {
      caseName: 'a blank value',
      value: '   ',
      expectedMessage: '必须配置 DATABASE_URL。',
    },
    {
      caseName: 'a malformed URL',
      value: 'not-a-url-secret-token',
      expectedMessage: 'DATABASE_URL 必须是有效的 URL。',
    },
    {
      caseName: 'a non-PostgreSQL protocol',
      value: 'mysql://assetnote:secret-token@localhost:3306/assetnote',
      expectedMessage:
        'DATABASE_URL 必须使用 postgresql:// 或 postgres:// 协议。',
    },
    {
      caseName: 'a missing host',
      value: 'postgresql:///assetnote-secret-token',
      expectedMessage: 'DATABASE_URL 必须包含主机地址。',
    },
    {
      caseName: 'a missing database name',
      value: 'postgresql://assetnote:secret-token@localhost:5432/',
      expectedMessage: 'DATABASE_URL 必须包含数据库名称。',
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
