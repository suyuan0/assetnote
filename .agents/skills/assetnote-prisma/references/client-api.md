# Prisma Client and Repository Guidance

Use this reference only for Prisma Client, NestJS database lifecycle, feature repositories, queries, transactions, logging, or raw SQL in AssetNote. It is a project-specific, PostgreSQL-only companion to the official Prisma ORM 7 documentation.

## Client lifecycle and configuration

- Construct Prisma Client in API-owned infrastructure and expose it through Nest dependency injection. Do not create a Client in `apps/web`, use a `globalThis` singleton, or create one Client per request.
- Use the official PostgreSQL driver adapter and the API's centralized, runtime-validated configuration. Do not read `process.env` throughout persistence code or silence missing configuration with a non-null assertion.
- Keep pool ownership and shutdown in the Nest lifecycle. Do not register independent process signal handlers or call `process.exit()` from a database provider.
- Do not add Accelerate, Prisma Postgres Query Insights, tracing extensions, or another external service as an incidental Client setup change.
- With the PostgreSQL adapter, constructing the pool or calling `$connect()` alone may not prove the database is reachable. A health check must execute a bounded, read-only database query and return a sanitized result.
- Never log connection strings, SQL parameters, query results, credentials, tokens, or personal data. Enabling verbose query logging is a deliberate observability change, not a development default.

## Repository boundary

- Put feature-specific queries in `src/modules/<feature>/infrastructure`. Keep a shared database provider limited to connection lifecycle and genuinely cross-cutting technical behavior.
- Implement application or domain-owned ports and map Prisma records to application/domain models inside infrastructure. Generated Prisma types, delegates, inputs, and transaction clients do not cross that boundary.
- Select only the fields required by the use case. Bound relation depth and collection size; avoid broad or deeply nested `include` trees.
- Treat `findUnique` and `findFirst` results as nullable and `findMany` results as arrays. Handle an empty page before deriving its next cursor.
- Prisma `omit` and TypeScript types do not implement authorization, data ownership, secret filtering, or runtime validation. Enforce those concerns at their owning boundaries.

## Reads, writes, and relations

- Application/domain code establishes authorization and business invariants before a repository mutation. Infrastructure must still scope each mutation to the intended tenant, owner, aggregate, or identifier and check meaningful affected-row results.
- Never introduce an unscoped `deleteMany({})` or `updateMany({})` as ordinary application behavior. A deliberate maintenance operation requires an explicit target, authorization, impact review, and focused tests.
- Apply a maximum page size. Prefer cursor pagination with a stable, unique order for deep or user-facing lists; reserve offset pagination for bounded shallow navigation.
- Prisma `distinct` may fetch rows and de-duplicate them in memory. Review selected columns and expected cardinality before using it on a large result set.
- Do not rely on `createManyAndReturn` result order. `connectOrCreate` and database upserts can race on unique keys; handle the documented unique-conflict case with a bounded, operation-specific retry when the use case is idempotent.
- For nullable to-one relations, use PostgreSQL-supported relation filters such as `is: null` for a missing relation. Do not use MongoDB-only operators such as `isSet`.
- A to-many `every` filter also matches a parent with zero related rows. Combine it with `some: {}` when the rule means “at least one related row and all rows match.”
- PostgreSQL full-text search is version-sensitive. Verify the pinned Prisma 7 requirements before enabling it; do not assume `@@fulltext` alone enables PostgreSQL search.

## Transactions and concurrency

- The application layer owns the transaction boundary through an explicit port or unit-of-work abstraction. Keep Prisma's transaction client inside infrastructure by exposing transaction-scoped repositories or port implementations instead of leaking `Prisma.TransactionClient` upward.
- Prefer a nested write when it expresses one atomic aggregate change. Use an interactive transaction when later reads or writes depend on earlier results.
- Keep interactive transactions short and database-only. Do not perform HTTP calls, message delivery, user interaction, or other slow external work while holding a transaction.
- Do not assume that an exception from `findUniqueOrThrow` inside sequential `$transaction([...])` rolls back earlier operations. Use an interactive transaction when that rollback behavior is required.
- PostgreSQL treats `ReadUncommitted` as `ReadCommitted`. `Serializable` does not execute transactions one at a time; serialization failures and deadlocks can still occur. Add a bounded retry only for recognized transient errors and only when the complete operation is safe to repeat.
- Enforce invariants such as positive amounts, sufficient balances, ownership, and expected affected-row counts inside the atomic operation. A transaction does not make incomplete business checks correct.

## Raw SQL

- Prefer Prisma's model query API. Use raw SQL only for a documented capability or performance requirement that the query API cannot meet.
- Use tagged-template `$queryRaw` or `$executeRaw` with value parameters. Do not use the `Unsafe` variants.
- SQL placeholders represent values, not table names, column names, keywords, or clauses. Never pass untrusted input to `Prisma.raw`. If a dynamic identifier is unavoidable, map a closed allowlist to fixed, code-authored SQL fragments and reject every unknown value.
- `$queryRaw<T>` is a compile-time assertion, not runtime validation. Verify and map raw result shapes at the infrastructure boundary, including database-specific scalar representations.
- Do not coerce `bigint` to `number` unless the value has been proven to be within JavaScript's safe integer range.
- Raw mutations follow the same authorization, target scoping, invariant, transaction, affected-row, and migration rules as model queries.

## Primary references

- [Prisma Client API](https://www.prisma.io/docs/orm/reference/prisma-client-reference)
- [Relations](https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries)
- [Pagination](https://www.prisma.io/docs/orm/prisma-client/queries/pagination)
- [Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- [Raw SQL](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries)
- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
