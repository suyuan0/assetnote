import { parsePostgreSqlTestDatabaseUrl } from './support/postgresql-test-database-url';

const DATABASE_URL =
  'postgresql://assetnote:development-password@localhost:5432/assetnote?schema=public';
const TEST_DATABASE_URL =
  'postgresql://assetnote:test-password@127.0.0.1:5432/assetnote_test?schema=public';

describe('parsePostgreSqlTestDatabaseUrl', () => {
  it('accepts a separately named PostgreSQL test database', () => {
    expect(
      parsePostgreSqlTestDatabaseUrl({
        databaseUrl: DATABASE_URL,
        nodeEnvironment: 'test',
        testDatabaseUrl: TEST_DATABASE_URL,
      }),
    ).toEqual({
      url: 'postgresql://assetnote:test-password@127.0.0.1:5432/assetnote_test',
    });
  });

  it('requires TEST_DATABASE_URL without falling back to DATABASE_URL', () => {
    expect(() =>
      parsePostgreSqlTestDatabaseUrl({
        databaseUrl: DATABASE_URL,
        nodeEnvironment: 'test',
        testDatabaseUrl: undefined,
      }),
    ).toThrow('必须配置 TEST_DATABASE_URL。');
  });

  it('rejects the application database even when other URL parts differ', () => {
    expect(() =>
      parsePostgreSqlTestDatabaseUrl({
        databaseUrl:
          'postgresql://development:password@localhost:5432/assetnote_test?schema=public',
        nodeEnvironment: 'test',
        testDatabaseUrl:
          'postgresql://test:other-password@127.0.0.1:5432/ASSETNOTE_TEST?schema=isolated',
      }),
    ).toThrow('TEST_DATABASE_URL 不得与 DATABASE_URL 指向同一个数据库。');
  });

  it('requires an explicit test marker in the database name', () => {
    expect(() =>
      parsePostgreSqlTestDatabaseUrl({
        databaseUrl: DATABASE_URL,
        nodeEnvironment: 'test',
        testDatabaseUrl:
          'postgresql://assetnote:password@localhost:5432/assetnote_validation',
      }),
    ).toThrow(
      'TEST_DATABASE_URL 必须指向名称包含独立 test 标识的专用测试数据库。',
    );
  });

  it('does not run outside the test process environment', () => {
    expect(() =>
      parsePostgreSqlTestDatabaseUrl({
        databaseUrl: DATABASE_URL,
        nodeEnvironment: 'development',
        testDatabaseUrl: TEST_DATABASE_URL,
      }),
    ).toThrow('PostgreSQL 仓储测试只能在 NODE_ENV=test 时运行。');
  });

  it('rejects an invalid URL without exposing its supplied value', () => {
    const invalidUrl = 'not-a-url-secret-token';

    expect(() =>
      parsePostgreSqlTestDatabaseUrl({
        databaseUrl: DATABASE_URL,
        nodeEnvironment: 'test',
        testDatabaseUrl: invalidUrl,
      }),
    ).toThrow('TEST_DATABASE_URL 必须是有效的 PostgreSQL URL。');

    try {
      parsePostgreSqlTestDatabaseUrl({
        databaseUrl: DATABASE_URL,
        nodeEnvironment: 'test',
        testDatabaseUrl: invalidUrl,
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      expect(error.message).not.toContain(invalidUrl);
      expect(error.message).not.toContain('secret-token');
    }
  });
});
