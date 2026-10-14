// JSON-file store for demo mode.
// DEMO: data lives in data/reviews.json inside the repo. Idempotent writes,
// synchronous fs access. PRODUCTION: replace with Postgres (reviews, threads,
// locations, alert/digest audit) before launch; add row-level customer scoping.

import fs from "fs";
import path from "path";
import type { AlertLogEntry, Db, DigestLogEntry, Review } from "./types";

const DEFAULT_DATA_PATH = path.join(process.cwd(), "data", "reviews.json");

function dataPath(): string {
  // Tests can point at a temp file via REVIEWGUARD_DATA_PATH.
  return process.env.REVIEWGUARD_DATA_PATH || DEFAULT_DATA_PATH;
}

export function loadDb(): Db {
  const raw = fs.readFileSync(dataPath(), "utf8");
  return JSON.parse(raw) as Db;
}

export function saveDb(db: Db): void {
  fs.writeFileSync(dataPath(), JSON.stringify(db, null, 2) + "\n", "utf8");
}

export function getReview(db: Db, id: string): Review | undefined {
  return db.reviews.find((r) => r.id === id);
}

export function addReview(db: Db, review: Review): void {
  // Idempotent upsert keyed on review id (Pub/Sub redelivers in production).
  const i = db.reviews.findIndex((r) => r.id === review.id);
  if (i >= 0) db.reviews[i] = review;
  else db.reviews.push(review);
}

export function logAlert(db: Db, entry: AlertLogEntry): void {
  db.alertLog.push(entry);
}

export function logDigest(db: Db, entry: DigestLogEntry): void {
  db.digestLog.push(entry);
}

export function reviewsForLocation(db: Db, locationId: string): Review[] {
  return db.reviews
    .filter((r) => r.locationId === locationId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
