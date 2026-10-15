# ReviewGuard

ReviewGuard is a demo application for triaging Google Business Profile reviews for local service businesses. It shows a review inbox, suggested replies, an owner approval flow, and a weekly performance digest.

## Current status

This repository contains a local prototype. It uses synthetic review data and a JSON file at `data/reviews.json`. Google Business Profile is not connected. Email and SMS alerts are logged locally, and replies are not posted to Google. Do not use it with real customer data or deploy it as a production service.

## How it works

1. The dashboard loads sample reviews from the local JSON store.
2. When demo mode is enabled, a simulated review can be added through `POST /api/simulate`.
3. ReviewGuard creates a suggested reply using deterministic templates selected by rating. The templates avoid inventing job details, disclosing personal information, or promising compensation.
4. An owner can review, edit, approve, or discard the draft. Approval is recorded in the local review thread; it does not publish a reply.
5. The digest summarizes review volume, average rating, and reply rate. Its email delivery is also a local log only.

The app is built with Next.js, React, and TypeScript. Key code is organized as follows:

- `app/`: dashboard, review detail pages, digest page, and API routes
- `lib/drafts.ts`: deterministic reply templates and the documented interface for a future language-model provider
- `lib/compliance.ts`: shared customer feedback links and review link handling
- `lib/store.ts`: JSON-file persistence for the demo
- `data/seed.js`: synthetic sample locations and reviews
- `tests/`: lifecycle, ingestion, digest, and feedback-link checks

## Run locally

Requirements: Node.js and npm.

```bash
npm install
npm run seed
npm run dev
```

The app is available at http://localhost:3000. Demo review injection is disabled by default. To enable it during local development:

**macOS / Linux / Git Bash**

```bash
REVIEWGUARD_DEMO=true npm run dev
```

**PowerShell**

```powershell
$env:REVIEWGUARD_DEMO = "true"
npm run dev
```

The demo flag enables mock data injection only. Keep it off in any deployed environment.

## Checks

```bash
npm test
npm run build
```

## Routes

- `/`: project overview
- `/dashboard`: review inbox
- `/reviews/[id]`: review details and draft actions
- `/digest`: weekly digest
- `/api/reviews`: list and ingest reviews
- `/api/reviews/[id]`: retrieve a review
- `/api/reviews/[id]/draft`: create a suggested reply
- `/api/reviews/[id]/edit`: edit a draft
- `/api/reviews/[id]/approve`: record owner approval
- `/api/reviews/[id]/discard`: discard a draft
- `/api/simulate`: add a mock review when demo mode is enabled
- `/api/digest`: read or generate the digest

## Before using real data

A production version would need authenticated user accounts, per-business data isolation, durable database storage, verified Google Business Profile access, and real alert delivery. Every outbound reply should remain behind an explicit owner approval. ReviewGuard's feedback links must be presented consistently to all customers; do not route people based on sentiment or rating.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.
