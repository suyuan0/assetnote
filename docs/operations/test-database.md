# Dedicated PostgreSQL test database

Repository verification runs the API persistence tests against PostgreSQL. The
tests intentionally create a temporary schema, apply every committed migration,
write test records, and drop that schema with `CASCADE` when the suite finishes.

## Required isolation

Configure both connection strings in `apps/api/.env`:

- `DATABASE_URL` points to the ordinary local development database.
- `TEST_DATABASE_URL` points to a separate, disposable test database. Its
  database name must contain an independent `test` segment, such as
  `assetnote_test`.

`TEST_DATABASE_URL` is mandatory for persistence tests and never falls back to
`DATABASE_URL`. The two variables must use different database names. Changing
the user, password, host spelling, or schema while retaining the same database
name does not count as isolation.

Create the empty test database deliberately with your PostgreSQL administration
tool before running the suite. Do not point `TEST_DATABASE_URL` at a development,
shared, staging, or production database. Keep real credentials only in the
ignored `apps/api/.env`; the committed `.env.example` contains local examples.

## Verification behavior

Run the persistence tests through:

```bash
pnpm --filter api test:e2e
```

Each run creates a randomly named `assetnote_test_*` schema inside the dedicated
test database. Setup and cleanup reject schema names outside that generated
pattern. A failed or interrupted process may leave a temporary schema in the
test database; inspect and remove it deliberately before reusing that database.
