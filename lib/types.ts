// Shared domain types for ReviewGuard (demo mode).
// Production will replace the JSON store with Postgres and real GBP OAuth/PubSub.

export type ReviewStatus = "pending" | "draft" | "approved" | "discarded";

export interface ThreadEntry {
  type: "received" | "draft_generated" | "edit" | "approved" | "discarded";
  at: string; // ISO timestamp
  text?: string; // draft/reply text at that moment
  by?: string; // actor: "system" | "owner"
}

export interface Review {
  id: string;
  locationId: string;
  reviewerName: string;
  stars: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  status: ReviewStatus;
  draftText?: string;
  replyText?: string; // final owner-approved text
  thread: ThreadEntry[];
}

export interface Location {
  id: string;
  name: string;
  city: string;
}

export interface AlertLogEntry {
  at: string;
  reviewId: string;
  locationId: string;
  stars: number;
  reviewerName: string;
  sent: boolean; // always false in demo mode (stubbed, console.log only)
}

export interface DigestLogEntry {
  at: string;
  period: string;
  sent: boolean; // always false in demo mode
}

export interface Db {
  locations: Location[];
  reviews: Review[];
  alertLog: AlertLogEntry[];
  digestLog: DigestLogEntry[];
}
