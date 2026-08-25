const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);
const TEST_DATABASE_NAME_PATTERN = /(^|[_-])test($|[_-])/i;

type DatabaseUrlEnvironmentName = 'DATABASE_URL' | 'TEST_DATABASE_URL';

interface PostgreSqlTestDatabaseUrlInput {
  readonly databaseUrl: string | undefined;
  readonly nodeEnvironment: string | undefined;
  readonly testDatabaseUrl: string | undefined;
}

export interface PostgreSqlTestDatabaseUrl {
  readonly url: string;
}

function parseDatabaseUrl(
  value: string | undefined,
  environmentName: DatabaseUrlEnvironmentName,
): URL {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`必须配置 ${environmentName}。`);
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalizedValue);
  } catch {
    throw new Error(`${environmentName} 必须是有效的 PostgreSQL URL。`);
  }

  if (
    !POSTGRES_PROTOCOLS.has(parsedUrl.protocol) ||
    !parsedUrl.hostname ||
    parsedUrl.pathname.length <= 1
  ) {
    throw new Error(`${environmentName} 必须是有效的 PostgreSQL URL。`);
  }

  return parsedUrl;
}

function readDatabaseName(
  parsedUrl: URL,
  environmentName: DatabaseUrlEnvironmentName,
): string {
  try {
    return decodeURIComponent(parsedUrl.pathname.slice(1));
  } catch {
    throw new Error(`${environmentName} 必须包含有效的数据库名称。`);
  }
}

export function parsePostgreSqlTestDatabaseUrl(
  input: PostgreSqlTestDatabaseUrlInput,
): PostgreSqlTestDatabaseUrl {
  if (input.nodeEnvironment !== 'test') {
    throw new Error('PostgreSQL 仓储测试只能在 NODE_ENV=test 时运行。');
  }

  const applicationUrl = parseDatabaseUrl(input.databaseUrl, 'DATABASE_URL');
  const testUrl = parseDatabaseUrl(input.testDatabaseUrl, 'TEST_DATABASE_URL');
  const applicationDatabaseName = readDatabaseName(
    applicationUrl,
    'DATABASE_URL',
  );
  const testDatabaseName = readDatabaseName(testUrl, 'TEST_DATABASE_URL');

  if (!TEST_DATABASE_NAME_PATTERN.test(testDatabaseName)) {
    throw new Error(
      'TEST_DATABASE_URL 必须指向名称包含独立 test 标识的专用测试数据库。',
    );
  }

  if (
    applicationDatabaseName.toLocaleLowerCase('en-US') ===
    testDatabaseName.toLocaleLowerCase('en-US')
  ) {
    throw new Error('TEST_DATABASE_URL 不得与 DATABASE_URL 指向同一个数据库。');
  }

  testUrl.searchParams.delete('schema');

  return { url: testUrl.toString() };
}
