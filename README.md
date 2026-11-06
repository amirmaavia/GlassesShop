# Auré Optics

A premium Pakistani-market eyewear commerce demo built with Next.js App Router, strict TypeScript, Tailwind CSS, Lucide, Zustand, React Hook Form, Zod and Recharts. The visual system follows the workspace frontend-design skill.

## Run locally

Requires Node.js 20.9 or later.

This workspace already has a generated `.env.local` with a unique local admin password. Sign in with `admin@aure.demo` and the `DEMO_ADMIN_PASSWORD` value in that file. It is ignored by Git. Preserve it to keep sessions stable.

```powershell
npm install
Copy-Item .env.example .env.local
# Set SESSION_SECRET to at least 32 random characters.
# Set your own DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD.
npm run dev
```

Open http://localhost:3000. Create a customer through `/auth/signup`. The admin email/password come **only** from the server environment; sign in at `/auth/login`, then open `/admin`. There are no hardcoded public admin credentials. Accounts cannot promote themselves by changing browser state. When no SESSION_SECRET is configured, development sessions expire on process restart.

For a fresh checkout, `node scripts/setup-demo.mjs` generates a unique local configuration without overwriting an existing `.env.local`.

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

With the dev server running, `node scripts/smoke.mjs` checks the purchase and ownership flows. `node scripts/admin-smoke.mjs` reads local admin configuration and checks management workflows. These create synthetic QA records; admin tests remove their disposable products and restore storefront settings.

## Implemented flows

- Editorial home with swipeable carousel, collections, functional product tabs, FAQ and newsletter registration.
- 24 original illustrative eyewear products, shape/material/colour/price/stock filtering, sorting, load-more, search, quick look, saved favourites and recent views.
- Frame variant/gallery selection; five-step lens configuration; manual prescription validation, separate PD, progressive ADD, upload **metadata only**, deferred prescriptions and price review.
- Persistent bag with unique configurations, quantity limits, lens editing, promotion codes and centralised PKR pricing.
- Guest or customer demo checkout; server recalculates prices, validates stock, creates immutable order snapshots and records stock movement. COD and simulated payment only.
- Salted scrypt password hashes, signed HTTP-only sessions, protected customer and admin routes, customer order history, profile/address/password management and authenticated prescription summaries.
- Admin analytics from the same dataset, searchable/paginated product CRUD and duplication, collections, order/payment status management and internal notes, customer activation, discounts, stock adjustments/history, support messages, homepage copy and store settings.

## Architecture and persistence

`src/lib/types.ts` defines the domain. `src/data/demo.ts` seeds the demo. `src/lib/pricing.ts` owns lens and basket calculations. `src/lib/server/repository.ts` implements the replaceable `Repository` interface, with serialised atomic writes to `data/store.json`. `src/app/api/store/route.ts` validates mutations and checks identity/roles. UI code accesses the API through `src/lib/store.ts` and providers. Browser localStorage is limited to the bag, wishlist and recently viewed IDs; credentials never go there.

Demo coupons: `WELCOME10` (10%, minimum Rs. 5,000, one use per customer) and `FRAME15` (15% on Eyeglasses frames, minimum Rs. 6,000, two uses). Active dates, total limits and eligibility are enforced on the server at checkout. One coupon per order, no stacking, lens upgrades excluded. Compare-at prices are display-only; current frame prices are never discounted twice. Shipping uses the post-discount subtotal. The initial tax rate is configurable and zero, not a statement about applicable Pakistani tax law.

To reset demo records, stop the server and remove `data/store.json`. Seed orders belong to the illustrative Ayesha account and are visible to admins only; a new customer never inherits them.

## Demo limitations

This is a local, single-server demo, not a production commerce deployment. JSON persistence is unsuitable for multi-instance/serverless hosting. Configure a stable secret for persistent sessions. Rate limiting, security auditing, verified email recovery, transactional database stock locks and production policy review are needed before real use. Recovery/verification pages describe their unavailable email service rather than pretending to send email. Use synthetic personal and prescription data. Uploads save name and size only; no file contents are uploaded or retained. No real payments, emails, shipments or medical recommendations occur.

Inventory is product-level in this demo; colour variants share the frame stock. Product galleries are original code-native illustrations with front/angled views, not manufacturer photographs. Hero/editorial photography uses Unsplash remote URLs; product illustrations do not depend on third-party image availability. Source photos: `photo-1511499767150-a48a237f0083`, `photo-1572635196237-14b3f281503f`, `photo-1509695507497-903c140c43b0`, `photo-1473188588951-666fce8e7c68`. Google Fonts supplies DM Sans and Libre Caslon Display with local fallback fonts. This demo does not include verified testimonials or real brand affiliations.

Advanced production features still require integration: reusable private prescription vault, actual recovery/verification delivery, image upload management, per-variant stock, per-product lens compatibility rules, bulk product actions, visual homepage section reordering, review moderation and trusted role assignment. The present settings workflow manages announcement, hero copy, delivery, tax, contact and return text.

## Supabase handoff

`supabase/schema.sql` provides relational tables, indices and ownership/admin RLS policies as a starting migration. It is a reviewable draft and is **not applied**. Add Supabase Auth, replace the file repository with server-side query implementations, and adapt session helpers while preserving UI-facing response types. Provision admin roles through trusted server administration. Keep service-role credentials server-only.

Before production: implement checkout as one database transaction/RPC, revalidate current prices/promotions, lock inventory rows, record redemptions and audit sensitive actions. Use a private storage bucket for prescriptions with short-lived authorised URLs. Complete retention/deletion workflows, email verification, CSRF/rate-limit review, checkout idempotency, secure file content inspection and deployment-specific tests. Never expose service-role keys through `NEXT_PUBLIC_` variables.
