import { registerAs } from '@nestjs/config';

export interface DatabaseConfig {
  readonly url: string;
}

const POSTGRES_PROTOCOLS = new Set(['postgres:', 'postgresql:']);

export const parseDatabaseConfig = (
  databaseUrl: string | undefined,
): DatabaseConfig => {
  const value = databaseUrl?.trim();

  if (!value) {
    throw new Error('DATABASE_URL is required.');
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(value);
  } catch {
    throw new Error('DATABASE_URL must be a valid URL.');
  }

  if (!POSTGRES_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error(
      'DATABASE_URL must use the postgresql:// or postgres:// protocol.',
    );
  }

  if (!parsedUrl.hostname) {
    throw new Error('DATABASE_URL must include a host.');
  }

  if (parsedUrl.pathname.length <= 1) {
    throw new Error('DATABASE_URL must include a database name.');
  }

  return { url: value };
};

export const databaseConfig = registerAs('database', () =>
  parseDatabaseConfig(process.env['DATABASE_URL']),
);

export default databaseConfig;
