import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { config as loadEnvironment } from 'dotenv';
import { Client } from 'pg';

import { PrismaService } from '../../src/common/database/prisma.service';
import { parsePostgreSqlTestDatabaseUrl } from './postgresql-test-database-url';

const API_ROOT = resolve(__dirname, '..', '..');
const MIGRATIONS_DIRECTORY = resolve(API_ROOT, 'prisma', 'migrations');
const TEST_SCHEMA_NAME_PATTERN = /^assetnote_test_[a-f0-9]{32}$/;

export interface PostgreSqlTestSchema {
  readonly prisma: PrismaService;
  close(): Promise<void>;
}

function createTestSchemaName(): string {
  return `assetnote_test_${randomUUID().replaceAll('-', '')}`;
}

function quoteTestSchemaName(schemaName: string): string {
  if (!TEST_SCHEMA_NAME_PATTERN.test(schemaName)) {
    throw new Error('临时测试 schema 名称不安全。');
  }

  return `"${schemaName}"`;
}

function readTestDatabaseUrl(): string {
  loadEnvironment({
    path: resolve(API_ROOT, '.env'),
    quiet: true,
  });

  return parsePostgreSqlTestDatabaseUrl({
    databaseUrl: process.env['DATABASE_URL'],
    nodeEnvironment: process.env['NODE_ENV'],
    testDatabaseUrl: process.env['TEST_DATABASE_URL'],
  }).url;
}

async function readMigrationScripts(): Promise<readonly string[]> {
  const entries = await readdir(MIGRATIONS_DIRECTORY, {
    withFileTypes: true,
  });
  const migrationDirectories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (migrationDirectories.length === 0) {
    throw new Error('没有可用于 PostgreSQL 仓储测试的迁移。');
  }

  return Promise.all(
    migrationDirectories.map((directory) =>
      readFile(
        resolve(MIGRATIONS_DIRECTORY, directory, 'migration.sql'),
        'utf8',
      ),
    ),
  );
}

export async function createPostgreSqlTestSchema(): Promise<PostgreSqlTestSchema> {
  const databaseUrl = readTestDatabaseUrl();
  const schemaName = createTestSchemaName();
  const quotedSchemaName = quoteTestSchemaName(schemaName);
  const migrationScripts = await readMigrationScripts();
  const maintenanceClient = new Client({ connectionString: databaseUrl });
  let schemaCreated = false;

  try {
    await maintenanceClient.connect();
    await maintenanceClient.query(`CREATE SCHEMA ${quotedSchemaName}`);
    schemaCreated = true;
    await maintenanceClient.query(`SET search_path TO ${quotedSchemaName}`);

    for (const migrationScript of migrationScripts) {
      await maintenanceClient.query(migrationScript);
    }
  } catch (error) {
    if (schemaCreated) {
      await maintenanceClient
        .query(`DROP SCHEMA ${quotedSchemaName} CASCADE`)
        .catch(() => undefined);
    }

    await maintenanceClient.end().catch(() => undefined);
    throw error;
  }

  const prisma = new PrismaService({
    url: databaseUrl,
    schema: schemaName,
  });

  try {
    await prisma.$connect();
    await prisma.user.count();
  } catch (error) {
    await prisma.$disconnect().catch(() => undefined);
    await maintenanceClient
      .query(`DROP SCHEMA ${quotedSchemaName} CASCADE`)
      .catch(() => undefined);
    await maintenanceClient.end().catch(() => undefined);
    throw error;
  }

  let closed = false;

  return {
    prisma,
    async close(): Promise<void> {
      if (closed) {
        return;
      }

      closed = true;

      try {
        await prisma.$disconnect();
      } finally {
        try {
          await maintenanceClient.query(
            `DROP SCHEMA ${quotedSchemaName} CASCADE`,
          );
        } finally {
          await maintenanceClient.end();
        }
      }
    },
  };
}
