# Prisma Schema and Migration Instructions

These rules apply to `apps/api/prisma` in addition to the repository and API instructions. Read ADR 0001 and the `assetnote-prisma` project Skill before changing this directory.

## Schema baseline

- `schema.prisma` is the source of truth for the PostgreSQL database model.
- Keep `provider = "postgresql"`. Changing the database engine requires a new architecture decision.
- Keep the `prisma-client` generator output at `../src/generated/prisma` with `moduleFormat = "cjs"` and `importFileExtension = ""`.
- Prisma 7 does not require migrating the NestJS API to ESM. Treat an API module-system change as a separate architecture change.
- Keep connection URLs and credentials out of the schema, migrations, command arguments, commits, and logs.
- Prisma models describe persistence only; they are not HTTP DTOs, domain entities, or shared contracts.

## Migrations

- Every database-shape change must have a named, committed migration reviewed together with the schema change.
- Review the complete generated SQL for destructive operations, unintended defaults, missing constraints, indexes, and PostgreSQL-specific behavior.
- Do not rewrite a migration that has already been applied outside an isolated disposable database. Correct it with a new migration.
- Before any database command, verify the exact environment, host, database name, and whether the target is disposable.
- `migrate dev --create-only` still connects to the database and may apply pending migrations; do not treat it as a file-only command.
- Never run production migrations during application startup.

## Generated Client

- `apps/api/src/generated/prisma` is ignored derived output. Never edit or commit it.
- Inspect all configured generators before running `prisma generate`.
- Regenerate the Client after an accepted schema change.

## Verification

After a Prisma schema or generator change, run:

```bash
pnpm --filter api prisma:generate
git diff --check
```
