# Admin Notification Command — Step-by-Step Guide

This guide shows how to use `notification:admin-send` to deliver admin notifications via database and Firebase (mail is accepted but skipped in v1). It includes copy‑paste examples for inline JSON and JSON files, multi-user runs, and all flags/behaviors.

---

## 1) Quick Start

Send to a single user with default channels (database, firebase):

```sh
docker compose exec app node ace notification:admin-send --user-id 16 --payload '{"title":"Test","body":"Hello from admin"}'
```

What happens:
- Validates payload; sets analyticLabel if missing.
- Pre-inserts a database notification for the user; its id is injected into `data.notificationId`.
- Sends a Firebase push to the user’s devices (if any).
- Prints a JSON summary plus a friendly log line.

---

## 2) Provide Payload — Inline vs File

- **Inline JSON** (quote safely in zsh using single quotes, escape inner single quotes if needed):

    ```sh
    docker compose exec app node ace notification:admin-send --user-id 16 --payload '{"title":"Test","body":"Hello"}'
    ```

- **From a file** (recommended for complex payloads):

    ```sh
    docker compose exec app node ace notification:admin-send --user-id 16 --payload-file /app/payloads/admin.json
    ```

**Tips:**
- Prefer absolute container paths like `/app/...` to avoid ENOENT.
- Relative paths (e.g., `payloads/foo.json`) are also tried with fallbacks to `/app/payloads/foo.json`.

## 3) Target One or Many Users

- Single user:
  ```sh
  --user-id 16
  ```

- Multiple users (comma-separated; duplicates are auto-deduped):
  ```sh
  --user-id 16,8,10
  ```

The output includes `results[]` with a per-user breakdown for multi-user runs.

---

## 4) Choose Channels

- Default: `database,firebase`
- All (mail is skipped in v1 but included in summary as skipped):
  ```sh
  --channels all
  # or
  --channels database,firebase,mail
  ```
- Only one:
  ```sh
  --channels database
  # or
  --channels firebase
  ```

Note: When requested, the database channel is pre-inserted first and its id is added to `payload.data.notificationId` before other channels send.

---

## 5) Helpful Flags

- Dry run (don’t send; mark all requested channels as skipped and show the plan):
  ```sh
  --dry-run
  ```

- JSON-only output (no human logs):
  ```sh
  --json
  ```

- Strict mode (exit 1 if any channel fails):
  ```sh
  --strict
  ```

- Custom analytic label for pushes:
  ```sh
  --analytic-label urgent_alert
  ```

- Concurrency for multi-user runs (default 10):
  ```sh
  --concurrency 20
  ```

---

## 6) Example Commands

Single user — inline payload:
```sh
docker compose exec app node ace notification:admin-send --user-id 16 --payload '{"title":"Test","body":"Hello from admin"}'
```

Single user — payload file:
```sh
docker compose exec app node ace notification:admin-send --user-id 16 --payload-file /app/payloads/admin.json
```

Multi-user — inline payload:
```sh
docker compose exec app node ace notification:admin-send --user-id 16,8,10 --payload '{"title":"Test","body":"Hello","data":{"type":"announcement"}}'
```

Multi-user — payload file (showdown champion):
```sh
docker compose exec app node ace notification:admin-send --user-id 16,8,10 --payload-file /app/payloads/showdown_champion.json --channels all
```

Dry run + JSON + strict (safe preview for CI):
```sh
docker compose exec app node ace notification:admin-send --user-id 16,8 --payload '{"title":"Preview","body":"Dry run"}' --dry-run --json --strict
```

Send with image (inline):
```sh
docker compose exec app node ace notification:admin-send --user-id 16 --payload '{"title":"Cashback Showdown","body":"Don'\''t miss it.","imageUrl":"https://img.appchaching.com/guides/cashback-showdown.jpg"}'
```

---

## 7) Example Payloads

### showdown_champion.json
Path: `/app/src/payloads/showdown_champion.json`

```json
{
  "title": "\ud83c\udfc6 You Did It! You're a Cashback Showdown Champion!",
  "body": "Congratulations on making it to the top of the leaderboard! Your savvy cashback moves earned you a winning spot in the Cashback Showdown.\ud83d\udcb0\n\nYour prize is being processed and will be credited soon. You'll be able to see it in your Earnings page once ready. Enjoy the rewards! \ud83d\udd25",
  "data": { "type": "announcement" },
  "imageUrl": "https://img.appchaching.com/guides/cashback-showdown.jpg"
}
```

### Minimal payload
```json
{ "title": "Admin Alert!", "body": "This is a test notification from admin." }
```

### Payload with analytics and image
```json
{
  "title": "Big Sale",
  "body": "Up to 50% off!",
  "data": { "type": "promo", "discount": "20%" },
  "analyticLabel": "urgent_alert",
  "imageUrl": "https://example.com/sale.jpg"
}
```

---

## 8) Behavior Details

- Database channel is inserted first (unless `--dry-run`), and its id is injected into `data.notificationId` before other channels send.
- Mail channel is accepted but currently skipped (reported as `skipped`).
- Firebase requires at least one device token; if none found, it’s reported as `failed` but other channels proceed.
- Multi-user: users are processed in batches (controlled by `--concurrency`), users are de-duplicated, and the summary includes totals and per-user results.
- Exit codes: `0` = all success; `2` = partial success; `1` = validation error or (with `--strict`) any failure.

---

## 9) Troubleshooting

- Invalid JSON: quote carefully in zsh; prefer `--payload-file` for complex payloads.
- ENOENT for files: use absolute container paths like `/app/...`.
- No device tokens: firebase will be `failed`; check your device token table.
- Need only preview: use `--dry-run` (all channels are marked `skipped`).

---

## See Also
- [notification-admin-command-spec.md](./notification-admin-command-spec.md)
- [notification-admin-command-implementation.md](./notification-admin-command-implementation.md)
