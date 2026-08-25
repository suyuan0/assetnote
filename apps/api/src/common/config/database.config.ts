import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  readonly url: string;
  readonly schema?: string;
}

const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

export function parseDatabaseConfig(
  databaseUrl: string | undefined,
): DatabaseConfig {
  const value = databaseUrl?.trim();

  if (!value) {
    throw new Error('必须配置 DATABASE_URL。');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error('DATABASE_URL 必须是有效的 URL。');
  }

  if (!POSTGRES_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error(
      'DATABASE_URL 必须使用 postgresql:// 或 postgres:// 协议。',
    );
  }

  if (!parsedUrl.hostname) {
    throw new Error('DATABASE_URL 必须包含主机地址。');
  }

  if (parsedUrl.pathname.length <= 1) {
    throw new Error('DATABASE_URL 必须包含数据库名称。');
  }

  const schema = parsedUrl.searchParams.get('schema')?.trim();

  return schema ? { url: value, schema } : { url: value };
}

export const databaseConfig = registerAs('database', () =>
  parseDatabaseConfig(process.env['DATABASE_URL']),
);

export default databaseConfig;
