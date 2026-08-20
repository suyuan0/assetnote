---
name: assetnote-prisma
description: Maintain AssetNote's Prisma ORM 7 persistence integration in apps/api with PostgreSQL, including schema, Client generation, migrations, NestJS database lifecycle, repositories, and transactions. Do not use for Prisma Postgres, Prisma Compute, Prisma 8, or database hosting.
---

# AssetNote Prisma

Use this Skill for Prisma and PostgreSQL work in AssetNote. Before acting, read the repository and API `AGENTS.md` files, `docs/architecture/overview.md`, and ADR 0001. Those sources remain authoritative when this Skill or upstream Prisma guidance is broader.

## Scope and architecture

- Prisma belongs only to `apps/api`; never introduce `packages/database`.
- PostgreSQL is provided by the project's Docker environment. Do not use `prisma dev`, `prisma init --db`, Prisma Postgres, Prisma Compute, Prisma 8, or another database provider.
- PSL is the database-model source of truth. Generated Prisma Client code is derived output and must not be edited manually.
- Prisma runtime types stay inside infrastructure. They must not become domain entities, HTTP DTOs, or shared contracts.
- Application providers coordinate use cases and transaction boundaries through explicit ports. Feature repositories implement those ports in their infrastructure layer.

## Version and source discipline

- Use the Prisma version installed in the API workspace and keep Prisma CLI and Client on the same release.
- Verify version-sensitive behavior against the current official Prisma 7 documentation. Upstream Agent Skills supplement this Skill but cannot weaken repository constraints.
- Do not bulk-install or overwrite this Skill with the upstream Prisma Skill catalog. Adopt upstream guidance only after reviewing it against the pinned Prisma version and this repository's architecture.
- Do not use a global Prisma binary, `npx prisma`, or an unpinned `pnpm dlx prisma` after Prisma is installed in the API workspace.

Run workspace-local commands in this form:

```bash
pnpm --filter api exec prisma <command>
```

## Command preflight

Before running a Prisma command:

1. Inspect `git status`, `apps/api/package.json`, `apps/api/prisma.config.ts`, the schema, migrations, and configured generators that exist.
2. Treat `prisma.config.ts`, seed commands, and every configured generator as executable code.
3. Confirm whether the command writes files, connects to a database, mutates data or schema, starts a service, opens a browser, or makes an external request.
4. Before any database connection or mutation, confirm the environment, host, database name, and whether the database is disposable. A shadow database must never share the primary database URL.
5. Never place connection strings in command arguments, logs, commits, or responses.

## Controlled initialization

Initialize only when `apps/api` has no existing Prisma configuration and the required Prisma packages have been installed in that workspace:

```bash
pnpm --filter api exec prisma init \
  --datasource-provider postgresql \
  --generator-provider prisma-client \
  --output ../src/generated/prisma \
  --no-skills
```

Review every generated file. Reconcile generated ignore rules with the repository root, replace generated environment values with the project's validated configuration strategy, and never commit `.env`, secrets, or generated Client output.

## Validation and generation

Use non-mutating checks after inspecting the loaded configuration:

```bash
pnpm --filter api exec prisma version
pnpm --filter api exec prisma validate
pnpm --filter api exec prisma format --check
```

`prisma format` without `--check` edits the schema. Run it only when intentionally formatting a reviewed schema change.

Before `prisma generate`, inspect every configured generator. Generation rewrites derived output and may execute third-party generator code. Run generation explicitly after accepted schema changes and do not commit generated Client output.

## Migration workflow

For a requested schema change:

1. Confirm the target is the isolated Docker PostgreSQL development or test database.
2. Update and format the PSL schema.
3. Create a named migration for review.
4. Review the complete generated SQL for destructive or unintended operations.
5. Apply it only when the database mutation is within the user's request and the exact target has been verified.
6. Regenerate Prisma Client and run the relevant API and repository verification.

`migrate dev --create-only` still connects to the database and may apply existing pending migrations. Do not describe it as purely file-writing or automatically safe.

Production migrations are a separate deployment operation. Never run them during application startup or without explicit production authorization.

## Restricted operations

Do not use these by default:

- `prisma dev`
- `prisma init --db`
- `prisma db push`
- `prisma db execute`
- `prisma migrate reset`
- `prisma migrate resolve`
- Prisma MCP
- Prisma Studio writes
- `db pull` that overwrites the schema
- connection URLs passed through CLI arguments

An exceptional use requires immediate, operation-specific authorization plus verification of the exact target and impact. Prisma's built-in AI checkpoint does not replace repository authorization.

Do not run or share `prisma debug` output without reviewing and redacting environment values, credentials, internal paths, and other sensitive context.

## Client and repository work

Before constructing Prisma Client, implementing repository queries, loading relations, adding pagination, defining a transaction, or using raw SQL, read [Client and repository guidance](references/client-api.md). Do not load that reference for schema-only or migration-only work.

## Handoff

Report schema and migration changes, reviewed SQL, generated-output handling, database operations actually performed, verification results, and any remaining migration risk.

## Primary references

- [Prisma Agent Skills](https://www.prisma.io/docs/ai/tools/skills)
- [Prisma CLI reference](https://www.prisma.io/docs/orm/reference/prisma-cli-reference)
- [Prisma with NestJS](https://www.prisma.io/docs/guides/frameworks/nestjs)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
