# Marasim — Project Architecture

```
marasim/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Supabase Auth sign-in
│   ├── (admin)/admin/            # Super Admin panel
│   │   ├── events/               # Event CRUD + guest import
│   │   └── settings/
│   ├── (host)/dashboard/         # Host/client analytics & distribution
│   │   └── [eventId]/
│   ├── (public)/e/[slug]/[token] # Guest invitation pages
│   ├── scanner/                  # Check-in staff QR scanner
│   └── api/                      # Route handlers (media, import, export)
├── components/
│   ├── admin/                    # Admin-specific UI
│   ├── host/                     # Host dashboard UI
│   ├── invitation/               # Standard & VIP template renderers
│   ├── scanner/                  # QR scanner UI
│   ├── shared/                   # Cross-cutting components
│   └── ui/                       # Primitives (buttons, inputs, etc.)
├── hooks/                        # Client data hooks
├── lib/
│   ├── cloudflare/               # R2, Images, Stream helpers
│   ├── constants/                # Routes, enums
│   ├── supabase/                 # Browser, server, admin clients
│   └── utils/                    # cn, URLs, import/export
├── supabase/migrations/          # PostgreSQL schema + RLS
├── types/                        # Database & domain TypeScript types
└── middleware.ts                 # Auth + role-based route guards
```

## Route Access Matrix

| Route | Super Admin | Host | Check-in Staff | Guest (anon) |
|-------|-------------|------|----------------|--------------|
| `/admin/*` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard/*` | ✅ | ✅ (own events) | ❌ | ❌ |
| `/scanner` | ✅ | ❌ | ✅ | ❌ |
| `/e/[slug]/[token]` | — | — | — | ✅ (token) |

## Database

Run `supabase/migrations/001_initial_schema.sql` in your Supabase project.

Guest-facing reads/writes use SECURITY DEFINER RPCs (`get_guest_invitation`, `submit_guest_rsvp`, `check_in_guest`) so anonymous users never get direct table access.

## Environment

Copy `.env.example` to `.env.local` and fill in Supabase + Cloudflare credentials.
