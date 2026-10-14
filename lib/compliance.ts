// COMPLIANCE: no review gating, ever.
//
// Google's April 2026 review policy update explicitly bans pre-screening
// customers by sentiment before sending review links: every customer gets the
// SAME feedback link, routed to a private feedback form AND the public review
// links with equal prominence. No conditional routing, no NPS detour, no
// sentiment pre-screening, no rating-keyed query params.
//
// getFeedbackLink() is intentionally total and rating-blind: it takes a
// customer id and returns the one canonical link. The unit tests assert that
// links are identical across customers x star tiers x sentiment. If a future
// change branches on rating/sentiment anywhere in this path, those tests
// fail and the build must not ship.

const FEEDBACK_BASE_URL = process.env.REVIEWGUARD_FEEDBACK_URL || "https://demo.reviewguard.app/feedback";

export function getFeedbackLink(_customerId: string): string {
  // Deliberately ignores the customer id and any rating/sentiment context.
  return FEEDBACK_BASE_URL;
}

export const FEEDBACK_POLICY_NOTE =
  "Every customer receives the same feedback link with equal prominence of private " +
  "feedback and public review links. No sentiment or rating conditional routing.";
