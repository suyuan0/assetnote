# Bootstrap the initial super administrator

Use this operation exactly once to create AssetNote's first user. It writes one
`ACTIVE` user with the `SUPER_ADMIN` role and refuses to run after any user
already exists.

## Preconditions

- Confirm that `apps/api/.env` points to the intended PostgreSQL database.
- Apply and review the committed migrations before running the command.
- Confirm that this is the database in which the first AssetNote user should be
  created. The operation mutates user data and is not a database-health check.

You can inspect migration state without changing the schema:

```bash
pnpm --filter api exec prisma migrate status
```

## Run the operation

From the repository root, run:

```bash
pnpm --filter api bootstrap:super-admin
```

The command prompts for an email address, password, and password confirmation.
Password input is hidden. Passwords must contain 8 to 128 characters and are
never accepted through command-line arguments, printed, or written to a
configuration file.

The 8-character minimum is the current local bootstrap rule, not an accepted
production password policy. Before production, complete the password-policy and
multi-factor-authentication decision recorded in ADR 0002.

The email address is trimmed and lowercased before storage. Password text is
not trimmed or otherwise rewritten before Argon2id hashing.

## Safety and reruns

The check for an empty user table and creation of the initial user happen in a
Serializable PostgreSQL transaction. A concurrent transaction conflict is
retried a bounded number of times. If any user already exists, the command
exits without changing that user or creating another one.

After a successful run, use the configured Web application origin to call the
login API. Do not use this command for invitations, account recovery, role
changes, or creating additional administrators.
