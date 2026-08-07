# Supabase migrations (CLI)

Run database migrations from the terminal instead of copy-pasting into the SQL Editor.

## Commands cheat sheet

| Command | Purpose |
|---------|---------|
| `npx supabase login` | Log in (not `npm supabase login`) |
| `npm run db:link` | Link repo to remote project |
| `npm run db:status` | List local vs remote migrations |
| `npm run db:new my_change` | Create new migration file |
| `npm run db:push` | Apply pending migrations to remote |

---

## One-time setup (you’re mostly done)

You already completed:

- [x] `npm install`
- [x] `npx supabase login`
- [x] `npm run db:link`

### Register migrations already applied manually

`migration repair` can fail with `Connection error` / `Failed to execute statement` (known CLI quirk with the login role). Use this instead:

1. Open **Supabase → SQL Editor**
2. Run the file: `supabase/scripts/register_cli_migrations.sql`
3. Verify in terminal:

```powershell
npm run db:status
```

Both migrations should show as **applied** on remote:

- `20250606120000_initial_schema.sql`
- `20250606130000_event_creator_catalogs.sql`

---

## Optional: link with database password (more reliable pushes)

If `db:push` ever fails to connect, re-link with your DB password:

```powershell
npx supabase link --project-ref wjhprjfvyyesygftoqhh -p YOUR_DATABASE_PASSWORD
```

Password: Supabase → **Project Settings → Database**.

---

## Day-to-day workflow

```powershell
npm run db:new add_whatsapp_templates
# Edit supabase/migrations/<timestamp>_add_whatsapp_templates.sql
npm run db:push
```

No SQL Editor copy-paste needed for new migrations.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Unknown command: supabase` with npm | Use `npx supabase`, not `npm supabase` |
| `migration repair` fails | Run `supabase/scripts/register_cli_migrations.sql` in SQL Editor |
| `db:push` wants to re-apply old migrations | Run register script, then `npm run db:status` |
| Connection errors on push | Re-link with `-p YOUR_DATABASE_PASSWORD` |

Dashboard: [https://supabase.com/dashboard/project/wjhprjfvyyesygftoqhh](https://supabase.com/dashboard/project/wjhprjfvyyesygftoqhh)

---

## Local dev + Google sign-in

If signing in on **localhost** sends you to **Vercel**, Supabase is rejecting the localhost callback and falling back to the production Site URL.

### Fix (one time)

1. Ensure redirect URLs include localhost — run from the repo root:

```powershell
npm run auth:sync-urls
```

This pushes `supabase/config.toml` auth settings to the linked project, including:

- `http://localhost:3000/auth/callback`
- `http://127.0.0.1:3000/auth/callback`
- `https://marasim-ten.vercel.app/auth/callback`
- `com.marasim.app://auth/callback` (Capacitor Android in-app Google sign-in)

2. In [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/wjhprjfvyyesygftoqhh/auth/url-configuration), confirm **Redirect URLs** lists the localhost entries above.

3. In `.env.local`, keep:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Use **`http://localhost:3000`** in the browser (not `127.0.0.1`) unless you also add that origin to Google Cloud **Authorized JavaScript origins**.

### Google Cloud (optional for localhost)

Under your OAuth client → **Authorized JavaScript origins**, add:

- `http://localhost:3000`

(Redirect URIs stay as Supabase only: `https://wjhprjfvyyesygftoqhh.supabase.co/auth/v1/callback`.)
