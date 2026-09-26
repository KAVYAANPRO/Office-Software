# Garment ERP - Backend

Node.js/TypeScript backend (NestJS) on **MongoDB**, covering `plan.md` **Phase 0
(Foundations)** and **Phase 1 (Identity, master data, party isolation)**.

## Why this differs from `tech.md`

`tech.md` was written for PostgreSQL and leans on things Postgres has that MongoDB does not:
row-level security for factory/artisan isolation, `CHECK` constraints, foreign keys, and
triggers that make the stock ledger and audit log append-only *at the database layer*
(`tech.md` principle #1: "the database is the last line of defence").

This build uses MongoDB throughout, per explicit instruction. Every guarantee tech.md assigns
to Postgres has been reimplemented in the application layer instead:

| tech.md mechanism (Postgres) | This codebase (Mongo) | Where |
|---|---|---|
| Row-level security (party isolation) | `PartyScopeService`, checked in every party-scoped service/controller | `src/common/services/party-scope.service.ts` |
| `forbid_mutation()` trigger + `REVOKE` (append-only ledger/audit) | Mongoose `pre` hooks on the schema throw on update/delete | `src/audit/schemas/audit-log.schema.ts` |
| `audit_row()` trigger (automatic audit capture) | A Mongoose plugin (`auditPlugin`) attached to every business schema | `src/common/plugins/audit.plugin.ts` |
| `SET LOCAL app.*` request context | `AsyncLocalStorage`-based `RequestContextStore`, populated by middleware + the auth guard | `src/common/context/request-context.ts` |
| `NUMERIC` columns | `decimal.js`, rounded to a fixed precision at every persistence boundary - never native `number` for money/quantity | `src/common/utils/decimal.ts` |
| One Postgres transaction per business command | Mongo multi-document transactions via `session.withTransaction()` (requires a replica set - see below) | e.g. `src/master/job-workers.service.ts` |

**Important caveat, stated plainly:** app-layer enforcement is real code that can have bugs,
and unlike a Postgres `REVOKE` it can theoretically be bypassed by a raw MongoDB driver call
that skips Mongoose entirely. Every service in this codebase goes through the Mongoose model,
so that bypass does not exist *in this codebase today*, but it is a weaker guarantee than
tech.md's original design and worth keeping in mind as the system grows (see `AGENT-NOTES` at
the bottom of `src/common/plugins/audit.plugin.ts` and `party-scope.service.ts`).

`tech.md`'s portal hardening (§9.3: separate route prefix, separate cookie, a least-privilege
database role with no grants on business tables) is only partially built in this pass - see
the note at the top of `src/portal/portal.controller.ts`.

## What's built (Phase 0 + Phase 1)

- **Foundations**: config validation at startup (fails closed on a bad `.env`), structured
  JSON logging with a request ID on every line, a `problem+json` error model, health check,
  gapless document numbering, `Idempotency-Key` support, a startup audit that refuses to boot
  if any route has no declared permission.
- **Identity**: sessions (Argon2id, sliding + absolute timeout, admin force-logout), login
  throttling, permission keys + role bundles + per-user overrides (`prd.md` §2.2 encoded as
  data in `src/identity/roles.seed-data.ts`), the nine default roles.
- **Master data**: suppliers, customers, job workers (factories/artisans, with an
  auto-created custody location), materials + variants + UoM conversions, colours, sizes,
  product categories, processing types, locations, tax rules, company settings, number
  series, and a CSV dry-run/commit import framework (suppliers, customers, materials, job
  workers).
- **Party isolation, demonstrated end-to-end**: a minimal `/portal/v1` surface
  (`GET /me`, `GET /job-workers/:id`) proves a factory user sees only its own row and gets
  `NOT_FOUND` (not `FORBIDDEN`) for another party's id - the plan.md Phase 1 exit criterion.

Everything from Phase 2 onward (the stock ledger, purchasing, job work, costing, sales, GST)
is **not built yet** - it is scoped for later phases per `plan.md`.

## Running it

```bash
cp .env.example .env      # edit COOKIE_SECRET etc.
docker compose up -d      # starts a single-node Mongo replica set (required for transactions)
npm install
npm run seed               # permissions, roles, a Super Admin, starter masters and locations
npm run start:dev
```

The seed script creates a Super Admin (`SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`, default
`admin` / `ChangeMe123!`) - change the password immediately in any shared environment.

```bash
npm test        # unit tests (src/**/*.spec.ts)
npm run test:e2e  # end-to-end tests against a real in-memory Mongo replica set (test/*.e2e-spec.ts)
```

The e2e suite is the closest thing this pass has to `plan.md`'s Phase 0/1 exit-criteria
checklist as executable tests: login/logout/throttling, permission denial vs. Super Admin
bypass, an audit row appearing after a write, append-only enforcement on `audit_log`,
`Idempotency-Key` replay, gapless concurrent numbering, and the party-isolation scenario
above.

## Layout

Mirrors `tech.md` §16's module boundaries where they apply to Phase 0/1:

```
src/
  config/       env validation + typed configuration
  common/       cross-cutting: context, guards, filters, interceptors, decorators,
                the audit plugin, party scoping, number series, idempotency, decimal helpers
  audit/        append-only audit log (read-only service + controller)
  identity/     users, sessions, roles, permissions, auth
  master/       suppliers, customers, job workers, materials, uoms, sizes, categories,
                processing types, locations, tax rules, company settings, CSV import
  portal/       the minimal factory/artisan-facing surface (Phase 1 slice; grows in Phase 4)
  seed/         idempotent seed script
test/           e2e tests (mongodb-memory-server + supertest)
```
