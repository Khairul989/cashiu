## Project Commands Cheat Sheet

All commands below assume Docker. Copy and paste as-is.

Tip: Without Docker, drop `docker compose exec app` and run `node ace ...` from the app container directory.

---

## Quickstart

```bash
# start containers (or restart to apply changes)
docker compose up -d

# run migrations (create/update tables)
docker compose exec app node ace migration:run

# seed base data (choose what you need)
docker compose exec app node ace db:seed
# docker compose exec app node ace db:seed --files database/seeders/001_master_lookup_seeder.ts

# generate API docs (optional)
docker compose exec app node ace docs:generate
```

---

## Data sync and services

Shopee products
```bash
# import/update products (default region=my)
docker compose exec app node ace sync:shopee-products
# only active sellers
docker compose exec app node ace sync:shopee-products --active
```
Flags: `--region=my|...` (default my), `--active` (only active sellers), `--type=delete` (delete products for inactive sellers).

Shopee categories
```bash
# fetch and store category tree
docker compose exec app node ace sync:shopee-categories
```

Shopee shops
```bash
# pull shops (default region=my; categories 1,2,4)
docker compose exec app node ace pull:shopee-shops
```
Flags: `--region=my|...`, `--categories=1,2,4`. Use `pull:shopee-shops`.

Conversions (Involve Asia)
```bash
# sync recent conversions (last 7 days)
docker compose exec app node ace sync:conversion
# sync all conversions (can be heavy)
docker compose exec app node ace sync:conversion --all
```
Flags: `--start-date=YYYY-MM-DD`, `--end-date=YYYY-MM-DD`, `--limit=200`, `--all`.

Ingest CSVs from S3 (datafeed)
```bash
# run full sequence (PRODUCT_PATCH -> SELLER_INSERT -> PRODUCT_INSERT)
docker compose exec app node ace ingest:datafeed-from-s3 --sequence=PRODUCT_PATCH,SELLER_INSERT,PRODUCT_INSERT
# dry run (no DB writes)
docker compose exec app node ace ingest:datafeed-from-s3 --dry-run
```
Flags: `--region=ap-southeast-1`, `--bucket=involve-data`, `--batch-size=1000`, `--dry-run`, `--sequence=...`.

---

## Notifications

Admin notification (multi-channel)
```bash
# single user, inline payload
docker compose exec app node ace notification:admin-send --user-id=16 --payload '{"title":"Hi","body":"Hello"}'
# multi-user, payload file, all channels, strict
docker compose exec app node ace notification:admin-send --user-id=1,2,3 --payload-file /app/payloads/showdown_champion.json --channels=all --strict
```
Flags: `--user-id=1[,2,...]` (required), `--channels=database,firebase,mail|all` (default database,firebase), `--payload` or `--payload-file`, `--analytic-label=admin_notification`, `--dry-run`, `--json`, `--strict`, `--concurrency=10`.

Firebase notification (direct)
```bash
# to a specific user
docker compose exec app node ace notification:send-firebase --title "Test" --body "Hello" --user-id=16
# broadcast to all users
docker compose exec app node ace notification:send-firebase --title "Broadcast" --body "Hi all"
```
Flags: `--title` (required), `--body` (required), `--user-id=<id>` (optional), `--data='{...}'`, `--analytic-label=admin_notification`.

---

## Admin & maintenance

Attach/sync roles to users
```bash
docker compose exec app node ace attach:role-permission-to-user --email=user@example.com --roles=finance
# sync (replace roles)
docker compose exec app node ace attach:role-permission-to-user --email=user@example.com --roles=default,finance --sync
```
Flags: `--email=a@b.com[,c@d.com]`, `--roles=superadmin,default,finance`, `--sync`.

Map conversion statuses
```bash
docker compose exec app node ace map:conversion-status
```

Backfill user bank details in withdrawals
```bash
docker compose exec app node ace sync:user-bank-details
```

Patch notification types (one-off)
```bash
docker compose exec app node ace patch:notification_type_id
```
Note: Run only if instructed (schema/seed changes related to notification types).

---

## Database

Create migration
```bash
docker compose exec app node ace make:migration banks_table
docker compose exec app node ace make:migration add_type_in_notifications_table
```

Run migrations / reset
```bash
docker compose exec app node ace migration:run
# drop all tables then migrate + seed
docker compose exec app node ace migration:fresh --seed
```

Seed data
```bash
docker compose exec app node ace db:seed
# specific seeder
docker compose exec app node ace db:seed --files database/seeders/001_master_lookup_seeder.ts
```

---

## Queue workers

Process raw conversion jobs
```bash
docker compose exec app node ace queue:listen --queue=process_raw_conversion
```

---

## Build & docs

```bash
# build the app (compile TS, etc.)
docker compose exec app node ace build
# (re)generate swagger docs
docker compose exec app node ace docs:generate
```

---

## Docker & env helpers

```bash
# restart containers (apply changes)
docker compose down && docker compose up -d
# restart only app container
docker compose restart app
# check env (inside container)
docker compose exec app env | grep HOST
```

---

## NPM helpers (inside container)

```bash
# install deps (examples from history)
docker compose exec app npm install ua-parser-js @types/ua-parser-js --save
# audit quick fix
docker compose exec app npm audit fix
```

---

## Notes

- Prefer Docker-prefixed commands in shared environments.
- Use `--all` (not `-all`) for conversion sync.
- Use `pull:shopee-shops` (not `pull:shopee:shops`).

