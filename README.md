# Riddhi Siddhi Jewellery — Business ERP

A full-stack ERP web app for running a jewellery business: sales and purchase invoicing
with Indian GST calculation, inventory and stock tracking, party (customer/supplier)
ledgers, bank accounts and transfers, expenses, payments, and business reports — with an
optional Android app shell via Capacitor.

## Features

- **Sales & purchases** — create sale/purchase invoices with line items, discounts, and
  GST (CGST/SGST/IGST) computed per item via a dedicated calculation engine
  (`lib/gst-utils.ts`); sale and purchase **returns** are tracked as their own documents
  linked back to the original invoice.
- **Inventory** — item categories, stock-in/stock-out adjustments, and a stock movement
  history/audit trail per item (`StockMovement` model).
- **Party ledgers** — customers and suppliers share a `Party` model with running balances,
  an aging view, and per-party transaction history.
- **Banking** — multiple bank accounts, inter-account transfers, and account history.
- **Payments** — payment-in and payment-out flows against parties, with configurable
  payment modes.
- **Expenses** — categorized expense entries with summary and trend charts.
- **Dashboard & reports** — KPI cards, sales/purchase charts, profit & loss, top customers,
  and a payment-method breakdown (Recharts).
- **GST number verification** — server action (`lib/actions/gst.ts`) that looks up a GSTIN
  against a third-party verification API, with automatic fallback across two API keys if
  one runs out of credits.
- **PDF invoices** — invoice PDFs rendered with `@react-pdf/renderer`, downloadable from
  the UI (`lib/pdf-download.ts`).
- **Auth** — email/password login via Auth.js (NextAuth v5) credentials provider, passwords
  hashed with bcrypt, JWT sessions.
- **i18n** — English and Hindi locales (`locales/en`, `locales/hi`) via i18next.
- **Android app shell** — the same Next.js UI wrapped with Capacitor
  (`capacitor.config.ts`, `android/`) for building a native Android package.

## Tech stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** PostgreSQL via Prisma ORM (designed for Supabase Postgres)
- **Auth:** Auth.js / NextAuth v5 (credentials provider, JWT sessions)
- **File storage:** Supabase Storage (business logo/signature uploads)
- **UI:** Tailwind CSS, Radix UI / shadcn components, Framer Motion, Recharts
- **Forms/validation:** React Hook Form + Zod
- **Mobile packaging:** Capacitor (Android)

## Data model

Defined in `prisma/schema.prisma`: `User`, `BusinessProfile`, `Party`, `BankAccount`,
`ItemCategory`, `Item`, `SaleInvoice` / `SaleInvoiceItem`, `PurchaseInvoice` /
`PurchaseInvoiceItem`, `SaleReturn` / `SaleReturnItem`, `PurchaseReturn` /
`PurchaseReturnItem`, `Payment`, `PaymentMode`, `Expense`, `StockMovement`,
`AccountTransfer`.

## Getting started

**Prerequisites:** Node.js, a PostgreSQL database (e.g. a Supabase project), and a
Supabase project if you want file uploads to work.

```bash
git clone https://github.com/KrishTrivedi025/riddhi-siddhi-jewellery.git
cd riddhi-siddhi-jewellery
npm install
cp .env.example .env
# fill in DATABASE_URL, DIRECT_URL, AUTH_SECRET, and the Supabase vars
npx prisma migrate deploy   # or `npx prisma db push` for a fresh dev database
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First run redirects to `/setup` to
create the business profile.

### Environment variables

See `.env.example`. In short:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Postgres connection strings (Prisma) |
| `AUTH_SECRET` | JWT signing secret for Auth.js — generate with `npx auth secret` |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project for file uploads |
| `GST_API_KEY` / `GST_API_KEY_FALLBACK` | Optional — GSTIN verification lookup; feature degrades gracefully if unset |

### Android build

```bash
npm run cap:sync   # sync web build into the Android project
npm run cap:open   # open android/ in Android Studio
```

The Android signing keystore is **not** included in this repo (see `.gitignore`) — supply
your own via a local `key.properties` / keystore when building a release APK.

## Scripts

- `npm run dev` — start the Next.js dev server
- `npm run build` — `prisma generate` then `next build`
- `npm run lint` — ESLint
- `npx tsx prisma/seed.ts` — seed script (configured as the Prisma seed command)
