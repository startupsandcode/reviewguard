# ReviewGuard — demo-mode MVP v1

Google review triage for trade contractors: instant alerts, AI-drafted replies, owner approval before anything posts.

**Status: DEMO MODE.** Everything runs on mock data in a local JSON store (`data/reviews.json`). There is no Google connection, no emails are sent, no SMS is sent, and no replies are posted anywhere.

## The full loop (mock data)

1. A mock review arrives via the demo "Inject demo review" button (dev-only `POST /api/simulate`; 403 unless `REVIEWGUARD_DEMO=true`).
2. An instant alert is logged. Email via Resend is **stubbed to console.log only** (`lib/alerts.ts`); nothing sends.
3. An AI draft reply is generated from deterministic templates keyed on star tier (`lib/drafts.ts`): gracious for 4-5 stars, de-escalating and specific for 1-3 stars, never defensive, never fabricating job facts, never disclosing PII, never promising compensation. The **LLM integration seam** is documented in `lib/drafts.ts`: implement `LlmDraftProvider` against your provider's chat API and pass it to `generateReplyDraft()`.
4. The owner approves, edits, or discards in the dashboard (`/dashboard`, `/reviews/[id]`). Nothing posts without approval (approval-only MVP). The GBP reply POST is stubbed in `postReplyToGbp()`; reply bursts are paced at 10 approvals/min per location (see comment citing Google's per-location edit cap).
5. Weekly digest at `/digest` and `GET/POST /api/digest`: review volume, average rating trend, reply rate per location. Email delivery stubbed.

## Compliance invariant (unit-tested)

`lib/compliance.ts` — every customer receives the **identical** feedback link (private feedback + public review links with equal prominence). No sentiment or rating conditional routing anywhere in the codebase, per the April 2026 Google review-gating policy. `tests/compliance.test.ts` asserts link equality across customers × star tiers × 100 synthetic customers.

## Data store

JSON file at `data/reviews.json`. Idempotent upserts keyed on review id. **Production needs Postgres** (reviews, threads, locations, alert/digest audit) plus real GBP OAuth/PubSub before launch.

## Run

```bash
npm install
npm run seed      # write fresh mock data to data/reviews.json
npm run dev       # dev server (REVIEWGUARD_DEMO=true enables the inject button)
npm run build && npm start   # production build + serve
npm test          # vitest: lifecycle, no-gating, ingest flow, digest
```

Inject a review in the built app: start with `REVIEWGUARD_DEMO=true npm start` (demo flag only; never in real production).

## Deferred gates for production (need John's org identity — do NOT attempt without him)

1. **GBP API access-request form** (~14-day review per Cloud project; requires valid business email, live website, legitimate business reason).
2. **OAuth verification** for the `business.manage` sensitive scope (no read-only variant; brand verification, privacy policy/ToS, demo video; weeks, not days).

## Spend

$0. No purchases, no paid APIs, no credentialed calls, no accounts created.
