# Using Neon (PostgreSQL) with Fairytale Farms

The app is set up to use **PostgreSQL** (e.g. [Neon](https://neon.tech)) instead of MySQL.

## 1. Create a Neon database

1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the **connection string** (e.g. `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`).

## 2. Set your environment variable

Set `DATABASE_URL` to the Neon connection string:

```bash
# .env or your host's environment
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

Neon often provides a pooled connection string; either pooled or direct is fine.

## 3. Create tables (first time)

From the project root, with `DATABASE_URL` set:

```bash
pnpm install
pnpm drizzle-kit push
```

`drizzle-kit push` creates all tables (and enums) in your Neon database from the current schema. No migration files are applied; the schema in `drizzle/schema.ts` is the source of truth.

**If you get an error like `type "chat_role" does not exist`:** the database is in a partial state. Reset it:

1. In the Neon dashboard, open **SQL Editor** for your branch.
2. Copy the contents of **`drizzle/drop-all-neon.sql`** into the editor and run it (this drops all app tables and enums).
3. Run `pnpm drizzle-kit push` again.

To generate a migration file instead (e.g. for version control):

```bash
pnpm drizzle-kit generate
# then apply it (if your workflow uses migrate)
pnpm drizzle-kit migrate
```

## 4. Seed data (optional)

If you're starting from scratch, you need to seed categories and products. The existing seed scripts (`seed-db.mjs`, `seed-valentines.mjs`, etc.) were written for **MySQL**. Options:

- **Option A:** Use the TypeScript seed if you have one that uses the same Drizzle schema and Postgres:
  ```bash
  DATABASE_URL="postgresql://..." pnpm db:seed
  ```
  (Update `server/scripts/seed.ts` to use the Postgres client if it still references MySQL.)

- **Option B:** Manually insert data via SQL or a small script that uses `drizzle-orm/node-postgres` and the same `drizzle/schema.ts`.

- **Option C:** Export data from your current MySQL DB and import into Neon using a tool or one-off script (MySQL → Postgres data migration).

## 5. Run the app

```bash
pnpm dev
# or
pnpm build && pnpm start
```

The server uses `pg` and `drizzle-orm/node-postgres`; as long as `DATABASE_URL` points to Neon, the app will use Neon.

## Switching from MySQL (TiDB, etc.)

- **Schema:** Already converted to PostgreSQL in `drizzle/schema.ts` (pgTable, serial, pgEnum).
- **App code:** `server/db.ts` uses `drizzle-orm/node-postgres` and `pg`; inserts use `.returning()` for generated IDs; upsert uses `onConflictDoUpdate`.
- **Scripts:** `seed-db.mjs`, `update-valentines-pricing.mjs`, `update-prices.mjs`, and similar still use `mysql2` and the old MySQL schema. To run them against Neon, switch them to `pg` + `drizzle-orm/node-postgres` and the current `drizzle/schema.ts`, or run them once against MySQL to export data, then import into Neon.

## Summary

| Step              | Command / action                                      |
|-------------------|--------------------------------------------------------|
| Create DB         | Neon dashboard → new project → copy connection string  |
| Set env           | `DATABASE_URL=postgresql://...`                        |
| Create tables     | `pnpm drizzle-kit push`                                |
| Seed (if needed)  | Adapt seed script to Postgres or migrate data from MySQL |
| Run app           | `pnpm dev` or `pnpm start`                             |
