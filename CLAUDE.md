# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Next.js dev server (http://localhost:3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint

npx convex dev    # Start Convex backend dev server (run alongside next dev)
```

The app requires both `npm run dev` and `npx convex dev` running simultaneously during development.

## Architecture

This is a **Next.js 16 + Convex** full-stack app using the App Router.

- **`app/`** — Next.js App Router pages and layouts
- **`convex/`** — Convex backend functions (queries, mutations, actions) and schema
- **`convex/_generated/`** — Auto-generated types/API from `npx convex dev` — never edit manually

### Convex Integration

`ConvexClientProvider` ([app/ConvexClientProvider.tsx](app/ConvexClientProvider.tsx)) wraps the entire app and connects to the Convex backend via `NEXT_PUBLIC_CONVEX_URL` (set in `.env.local`).

Convex functions defined in `convex/` are referenced in the frontend via the auto-generated `api` object from `convex/_generated/api`. Use `useQuery`, `useMutation`, and `useAction` hooks from `convex/react` to call them.

### Payment Flow (TossPayments)

1. **Checkout** (`app/checkout/page.tsx`) — creates a Convex order (status: `pending`), then calls `loadTossPayments` from `@tosspayments/tosspayments-sdk` to open the payment UI.
2. **Success** (`app/success/page.tsx`) — receives `paymentKey`, `orderId`, `amount` as URL params, calls `/api/confirm-payment` (server route) to verify with TossPayments, then updates the Convex order to `completed` and clears the cart.
3. **Fail** (`app/fail/page.tsx`) — marks the Convex order as `failed`.

Server-side confirmation happens in `app/api/confirm-payment/route.ts` using `TOSS_SECRET_KEY` (never exposed to the client).

### Cart / Session

Cart items are stored in Convex's `carts` table keyed by `sessionId`. The session ID is generated with `getOrCreateSessionId()` from `lib/session.ts` and persisted in `localStorage`.

### Environment Variables

- `NEXT_PUBLIC_CONVEX_URL` — Convex deployment URL (set automatically by `npx convex dev`)
- `NEXT_PUBLIC_TOSS_CLIENT_KEY` — TossPayments client key (get from https://developers.tosspayments.com)
- `TOSS_SECRET_KEY` — TossPayments secret key (server-side only, never expose to client)
