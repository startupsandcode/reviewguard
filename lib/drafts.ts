// Deterministic AI reply drafts, keyed on star tier.
//
// Tone policy (per spec):
//   4-5 stars -> gracious, warm, thanks the reviewer by name, invites them back.
//   1-3 stars -> de-escalating and specific: acknowledges their experience,
//     apologizes for the experience (not for disputed facts), invites the issue
//     offline to the owner, never defensive, never fabricates job facts,
//     never discloses PII, never promises compensation.
// Only facts from the review itself (reviewer's own words, location name, star
// tier) may appear in a draft. No invented job details, dates, or technician
// names. Owner approval is the backstop in the MVP.

// ---------------------------------------------------------------------------
// LLM INTEGRATION SEAM
// ---------------------------------------------------------------------------
// generateReplyDraft() is the ONLY entry point used by the pipeline. It
// delegates to an LlmDraftProvider. In demo mode the DeterministicDraftProvider
// below is wired in (zero cost, zero credentials).
//
// TO PLUG A REAL MODEL:
//   1. Implement LlmDraftProvider against your provider's chat API (e.g.
//      OpenAI chat completions, Anthropic messages API). Prompt: system
//      instructions enforcing the tone policy + hard rules above (never
//      fabricate facts, never defensive, no compensation promises); user
//      payload: { reviewerName, stars, comment, locationName, businessName }.
//      Instruct the model to reference ONLY fields present in the payload.
//   2. Pass your provider into generateReplyDraft(review, { provider: new
//      MyOpenAiDraftProvider() }) and enforce the provider via env flag.
//   3. Keep the deterministic provider as fallback when the API errors.
// ---------------------------------------------------------------------------

import type { Location, Review } from "./types";

export type StarTier = "gracious" | "deescalating";

export function starTier(stars: number): StarTier {
  return stars >= 4 ? "gracious" : "deescalating";
}

export interface LlmDraftProvider {
  name: string;
  generateDraft(review: Review, tier: StarTier, location: Location): Promise<string>;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "there";
}

// A short, verbatim echo of the reviewer's own words (<= 8 words) so the
// draft is specific without inventing anything.
function reviewerEcho(comment: string): string {
  const words = comment.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  return words.slice(0, 8).join(" ");
}

function graciousDraft(review: Review, location: Location): string {
  const echo = reviewerEcho(review.comment);
  const specifics = echo ? ` We're glad you were happy with ${echo.toLowerCase()}...` : "";
  return (
    `Hi ${firstName(review.reviewerName)}, thank you for the ${review.stars}-star review!` +
    specifics +
    ` It means a lot to the ${location.name} team when customers take the time to share their experience.` +
    ` We appreciate your business and look forward to helping you again.`
  );
}

function deescalatingDraft(review: Review, location: Location): string {
  const echo = reviewerEcho(review.comment);
  const specifics = echo
    ? ` You mentioned "${echo}"... we take that seriously.`
    : "";
  return (
    `Hi ${firstName(review.reviewerName)}, thank you for your honest review.` +
    ` We're sorry your experience was not what it should have been.` +
    specifics +
    ` We would like the chance to make this right.` +
    ` Please call the owner directly at the ${location.name} office` +
    ` (${location.city}) so we can look into this personally.` +
    ` Your feedback helps us improve.`
  );
}

export class DeterministicDraftProvider implements LlmDraftProvider {
  name = "deterministic-template-v1";

  async generateDraft(review: Review, tier: StarTier, location: Location): Promise<string> {
    return tier === "gracious" ? graciousDraft(review, location) : deescalatingDraft(review, location);
  }
}

export async function generateReplyDraft(
  review: Review,
  location: Location,
  opts: { provider?: LlmDraftProvider } = {}
): Promise<{ tier: StarTier; draftText: string; provider: string }> {
  const tier = starTier(review.stars);
  const provider = opts.provider ?? new DeterministicDraftProvider();
  const draftText = await provider.generateDraft(review, tier, location);
  return { tier, draftText, provider: provider.name };
}
