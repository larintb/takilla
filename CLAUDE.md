# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow rules

1. Think before acting. Read existing files before writing code.
2. Be concise in output but thorough in reasoning.
3. Prefer editing over rewriting whole files.
4. Do not re-read files you have already read unless the file may have changed.
5. Test your code before declaring done.
6. No sycophantic openers or closing fluff.
7. Keep solutions simple and direct.
8. User instructions always override this file.
9. Use **pnpm** exclusively — never `npm install`. Running `npm install` will corrupt `pnpm-lock.yaml` and break Render production builds (`ERR_PNPM_OUTDATED_LOCKFILE`). Always commit `pnpm-lock.yaml` after adding packages.

@AGENTS.md

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm lint         # eslint
pnpm cap:sync     # sync web assets to iOS (Capacitor)
pnpm cap:open     # open Xcode project
```

No test suite is configured in this project.

## Tech stack

- **Next.js 16** (App Router) + **React 19** — params/searchParams are async Promises, always `await` them
- **Supabase** — auth + database + storage
- **Stripe** — payments (via Server Actions and Stripe Checkout)
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css`, no config file
- **Capacitor 8** — wraps the Next.js app as a native iOS app
- **Resend** — transactional email (`utils/email/`)
- **Lucide React** — icons

## Architecture

### Data flow pattern

Pages are async Server Components that fetch from Supabase directly. Mutations go through **Next.js Server Actions** (files named `actions.ts` co-located with each route). Interactive UI is split into `_components/` subdirectories as `'use client'` components.

### Supabase client variants

| File | Use when |
|------|----------|
| `utils/supabase/server.ts` | Server Components and Server Actions (reads `cookies()`) |
| `utils/supabase/client.ts` | Client Components |
| `utils/supabase/middleware.ts` | `middleware.ts` — session refresh |
| `utils/supabase/admin.ts` | Privileged operations (service role key) |

### Route structure

```
app/
  (auth)/          # sign-up, login — grouped, no shared layout
  auth/            # Supabase OAuth callback + return
  events/[id]/     # Public event detail — TicketPanel for purchase
  checkout/        # Stripe/free ticket flow (requires auth)
  tickets/         # User's purchased tickets (QR codes)
  dashboard/
    events/new/    # Create event (organizer/admin only)
    events/[id]/   # Manage event — TierForm, TierList, StatusActions
    onboarding/    # Stripe Connect setup for paid events
  staff/           # QR scanner for ticket validation
  aplicar/         # Apply to become organizer
```

### Ticket tier effects (visual system)

Each `ticket_tier` row has an `effect` column: `'none' | 'gold' | 'diamond'`.

- **gold** — animated warm shimmer gradient, set in `ticket-panel.tsx` as `goldBase`/`goldStyle`/`goldActiveStyle`
- **diamond** — animated blue shimmer gradient, as `diamondBase`/`diamondStyle`/`diamondActiveStyle`
- **none** — uses `var(--accent-gradient)` (orange→pink→purple)

The effect is chosen by organizers in `tier-form.tsx` when creating a tier and flows through to `TicketPanel` (public event page) and the purchased ticket display. Any new ticket UI must respect this `effect` prop.

### Design system

CSS variables defined in `globals.css` and expected everywhere:
- `--background: #140a2a`, `--foreground: #f4f1ff`, `--surface-panel: #1b1233`
- `--accent-gradient: linear-gradient(90deg, #ff6e01 0%, #fa1492 55%, #720d98 100%)`
- `--color-orange / --color-pink / --color-purple / --color-deep-purple`
- Animations: `.animate-fade-in-up`, `.animate-fade-in`, `.drum-pop` (defined in globals or inline `<style>`)

Font: **Poppins** loaded via `next/font/google`, available as `var(--font-poppins)`.

### Auth & roles

User roles live in the `profiles` table: `'user' | 'organizer' | 'admin'`. Organizers must also have `stripe_onboarding_complete = true` to create paid tiers. Server-side auth checks: read `profiles.role` from Supabase after `supabase.auth.getUser()`.

### Pricing

Fee calculation is centralized in `utils/pricing.ts` (`calculateFees`). Always use this function — never inline fee math.

### Component scoping

- `components/` — app-wide shared components (Navbar, DomeGallery, FormButton, etc.)
- `app/**/_components/` — route-local client components, co-located with their page

### DomeGallery

`components/dome-gallery.tsx` renders the 3D rotating sphere on the home page hero. It accepts an optional `images` prop (`string[] | {src,alt}[]`); when omitted it falls back to `DEFAULT_IMAGES` (Unsplash stock photos). Pass event image URLs here to promote events in the hero background.

### Image storage

Event images live in the `event-images` Supabase Storage bucket. Always use `resolveEventImageUrl(supabase, image_url)` from `utils/supabase/storage.ts` — it normalises full URLs, storage paths, and bare filenames into a signed public URL.

### Maps

Event location maps use **Mapbox GL** (`mapbox-gl`). The map component lives at `app/events/[id]/_components/event-map.tsx`. Requires `NEXT_PUBLIC_MAPBOX_TOKEN` env var.

### API routes

```
app/api/
  email/    # Resend inbound webhook — receives and forwards emails
  stripe/   # Stripe webhook handler
app/actions/auth.ts  # Shared auth server actions
```

### Capacitor / iOS

`utils/capacitor.ts` detects the native context. `utils/push-notifications.ts` handles Capacitor Push Notification registration. After any web asset change that needs to reach the native app, run `pnpm cap:sync`.