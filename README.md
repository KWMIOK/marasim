# Marasim

**Marasim** (Arabic: *marāsīm* — ceremonies) is a full-stack digital invitation and event operations platform built for the Kuwait/GCC market. Hosts design branded invitations, distribute personalized guest links, manage RSVPs, and run on-site reception with QR check-in — from the web or a native Android shell.

Built as a production-grade side project demonstrating end-to-end product engineering: Next.js App Router, Supabase (Postgres + Auth + RLS), Capacitor mobile packaging, bilingual UI, and automated CI/CD.

---

## Live demo

| Environment | URL |
|-------------|-----|
| **Production web app** | [marasim-ten.vercel.app](https://marasim-ten.vercel.app) |
| **Android APK (latest)** | [Download `marasim-prod-latest.apk`](https://github.com/KWMIOK/marasim/releases/download/apk-latest/marasim-prod-latest.apk) |
| **APK releases** | [github.com/KWMIOK/marasim/releases/tag/apk-latest](https://github.com/KWMIOK/marasim/releases/tag/apk-latest) |

The Android app is a Capacitor shell that loads the deployed web app. UI updates ship via Vercel; reinstall the APK only when native plugins or Android config change.

---

## What it does

### For event hosts
- Browse and customize invitation templates (colors, event details, location, bilingual copy)
- **Guest distribution hub** — add guests manually, from phone contacts, Excel/CSV import, or a public registration link
- Per-guest personalized invitation URLs and WhatsApp share flows
- Host dashboard: guest roster, pending registration approvals, staff and vendor management
- Duplicate phone detection across all guest entry paths

### For guests
- Mobile-friendly invitation pages with RSVP
- QR codes for venue entrance
- Public self-registration with host approval workflow

### For reception & check-in
- Dedicated reception workspace per event (token-based access)
- Staff registration via SMS OTP or emergency PIN fallback
- Guest search, check-in logging, duplicate-entry detection, arrival analytics
- QR scanner mode for check-in staff

### For platform admins
- Event catalog management (templates, pricing tiers, bilingual content)
- Super-admin console for events, settings, and catalog CRUD

---

## Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| **Backend / DB** | Supabase (PostgreSQL, Auth, Row Level Security, RPC functions) |
| **Mobile** | Capacitor 8 (Android), in-app OAuth, contacts, filesystem, share |
| **Auth** | Supabase Auth (Google OAuth + deep-link callback on native) |
| **i18n** | Custom EN/AR dictionary system with RTL layout support |
| **Integrations** | Google Maps, WhatsApp deep links, Excel/CSV parsing (SheetJS, PapaParse) |
| **QR** | QR generation + html5-qrcode scanner |
| **Deploy** | Vercel (web), GitHub Actions (Android APK on every `main` push) |

---

## Architecture highlights

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App (Vercel)                                       │
│  ├─ App Router pages + Server Actions                       │
│  ├─ Middleware: session refresh, role-based route guards    │
│  └─ Client components: host flow, reception, scanner        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Supabase                                                   │
│  ├─ 22+ SQL migrations (schema, RPC, RLS policies)          │
│  ├─ SECURITY DEFINER functions for guest bulk ops, check-in │
│  └─ Auth: Google OAuth, native deep link com.marasim.app:// │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Capacitor Android shell                                      │
│  ├─ Remote URL mode → loads production/staging/dev server     │
│  ├─ Native: Browser (OAuth), Contacts, Filesystem, Share      │
│  └─ CI builds APK → GitHub Release on push to main            │
└───────────────────────────────────────────────────────────────┘
```

**Design decisions worth noting:**

- **Server Actions + RPC** — sensitive guest and reception operations run through Supabase RPC with service-role calls from server actions, not exposed client-side keys for bulk writes.
- **Phone normalization** — Kuwait mobile validation and deduplication at both app and database layers (`normalize_phone_digits`).
- **Hybrid mobile strategy** — one Next.js codebase serves web and Android; native APIs used only where WebView falls short (OAuth, contacts picker, file download).
- **Performance** — middleware skips expensive `getUser()` round-trips on public routes; bottom-nav route prefetching for snappier mobile navigation.
- **Migrations as source of truth** — schema, functions, and grants versioned under `supabase/migrations/`.

---

## Project structure

```
marasim/
├── app/                    # Next.js App Router (pages, layouts, route groups)
├── components/             # UI by domain (auth, host, reception, templates, admin)
├── lib/
│   ├── actions/            # Server Actions (auth, guests, reception, catalog)
│   ├── supabase/           # Client, server, middleware helpers
│   ├── i18n/               # EN/AR dictionaries and locale utilities
│   └── ...                 # Domain logic (phone, guests, reception, templates)
├── supabase/migrations/    # PostgreSQL migrations + RPC functions
├── android/                # Capacitor Android project
├── scripts/                # Capacitor sync, APK build, ProGuard patches
└── .github/workflows/      # APK CI pipeline
```

---

## User roles

| Role | Access |
|------|--------|
| `host` | Create invitations, manage guests, share links, reception setup |
| `check_in_staff` | QR scanner and check-in flows |
| `super_admin` | Platform catalog, events, pricing, settings |

Route protection is enforced in Next.js middleware with Supabase session validation on protected paths.

---

## Getting started (local development)

### Prerequisites

- Node.js 22+
- npm
- Supabase project (or local Supabase CLI)
- For Android: JDK 17+, Android SDK

### Web app

```bash
git clone https://github.com/KWMIOK/marasim.git
cd marasim
npm install

# Copy env template and fill in Supabase keys
cp .env.example .env.local   # if present; otherwise create .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Required environment variables (typical):

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Database

```bash
npm run db:push      # apply migrations to linked Supabase project
npm run db:status    # list migration state
```

### Android (USB dev — app loads local Next.js)

```bash
npm run dev                    # terminal 1
npm run cap:prepare:usb        # adb reverse + sync to 127.0.0.1:3000
npm run cap:apk:usb            # build debug APK
```

### Android (standalone prod shell)

```bash
npm run cap:apk:prod         # sync to https://marasim-ten.vercel.app + build APK
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## CI/CD

| Trigger | Result |
|---------|--------|
| Push to `main` | Vercel production deploy (web) |
| Push to `main` | GitHub Actions builds Android APK → [apk-latest release](https://github.com/KWMIOK/marasim/releases/tag/apk-latest) |

Workflow: [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml)

---

## Key features implemented

- Template browse, preview, customize, and share-method flows
- Guest import with column guide, preview table, and sample Excel template
- Public guest registration with host approval drawer and polling
- Reception session with staff OTP, emergency PIN, guest roster, and reports
- Vendor/crew pass links and counter tracking
- VIP occasion request flow with pricing tiers
- Bilingual UI (English / Arabic) with RTL support
- Google sign-in with native in-app OAuth on Android
- Guest phone deduplication (manual, contacts, import, registration)

---

## Scripts reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push Supabase migrations |
| `npm run cap:apk:prod` | Build production Android APK shell |
| `npm run cap:sync:usb` | Sync Capacitor for USB dev against localhost |

---

## Author

**[KWMIOK](https://github.com/KWMIOK)** — full-stack developer

This repository is part of a portfolio demonstrating real-world product development: requirements → schema design → full-stack implementation → mobile packaging → production deployment and QA.

For questions about this project, open an issue or reach out via GitHub.

---

## License

Private / portfolio project. All rights reserved unless otherwise noted.
