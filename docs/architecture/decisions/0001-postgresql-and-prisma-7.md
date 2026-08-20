# ADR 0001: PostgreSQL and Prisma ORM 7

- Status: Accepted
- Date: 2026-08-20

## Context

AssetNote needs a persistent relational database owned by the NestJS API. The persistence stack must provide stable migrations, type-safe data access, and clear boundaries for AI-assisted development.

## Decision

- PostgreSQL is the product relational database. Application code remains independent of a specific PostgreSQL hosting provider.
- The project uses Prisma ORM 7 with Prisma Client.
- The Prisma schema is authored in PSL and is the source of truth for the database model.
- Prisma CLI and Prisma Client use the same Prisma 7 release.
- PostgreSQL connections use the official Prisma PostgreSQL driver adapter.
- Prisma configuration, schema, migrations, generated client, database lifecycle code, and persistence adapters belong only to `apps/api`.
- No `packages/database` workspace will be introduced.
- Application and domain code depend on repository interfaces or ports, not Prisma runtime types.
- Prisma models and generated types must not be exposed as HTTP DTOs, domain entities, or shared transport contracts.
- Feature-specific Prisma queries belong in the owning feature's infrastructure layer.
- Generated Prisma Client code is derived output, must not be edited manually, and is regenerated from the schema.
- Prisma schema and migration files are reviewed and committed together.
- Versioned schema changes use committed migrations rather than untracked database changes.
- Production migrations never run automatically during application startup.
- Database credentials are supplied through environment variables and are never committed.
- Local, test, shared, and production databases use isolated connection strings.
- Persistence behavior is verified against PostgreSQL rather than substituting SQLite.

## Consequences

The API must use an ESM-compatible Prisma 7 integration and a Node.js version supported by Prisma 7.

Database changes require migration review and explicit application. Prisma upgrades are deliberate dependency changes followed by full repository verification.

Changing the database engine, ORM major version, or persistence ownership requires a new architecture decision.

## Deferred decisions

The following decisions remain deferred until deployment requirements exist:

- PostgreSQL hosting provider
- Connection pooling strategy
- High availability, backups, and disaster recovery
- PostgreSQL extensions
- Production deployment and migration automation

## References

- [Prisma ORM](https://www.prisma.io/docs/orm)
- [Prisma with NestJS](https://www.prisma.io/docs/guides/frameworks/nestjs)
- [Prisma system requirements](https://www.prisma.io/docs/orm/reference/system-requirements)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
