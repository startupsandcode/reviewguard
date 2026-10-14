// Demo seed: fictional contractor "Beacon Ridge Plumbing" with 2 locations
// and 8 mock reviews. NO real customer data. Timestamps are relative to "now"
// so digest trend math stays meaningful: 7 reviews in the last 7 days, 1 older
// for prior-week trend comparison.
// Plain JS (no TS) so `node scripts/write-seed.js` can run it directly.

const H = 60 * 60 * 1000;
const D = 24 * H;

function hoursAgo(h) {
  return new Date(Date.now() - h * H).toISOString();
}

export function seedDb() {
  const t = (days) => hoursAgo(days * 24);
  return {
    locations: [
      { id: "loc-main-st", name: "Beacon Ridge Plumbing - Main Street", city: "Ridgewood" },
      { id: "loc-riverside", name: "Beacon Ridge Plumbing - Riverside", city: "Ridgewood" },
    ],
    reviews: [
      {
        id: "rev-5a1",
        locationId: "loc-main-st",
        reviewerName: "Dana Whitfield",
        stars: 5,
        comment: "Tech arrived on time, found the leak under the sink fast, and left the kitchen cleaner than he found it. Highly recommend.",
        createdAt: t(0.5),
        updatedAt: t(0.5),
        status: "approved",
        replyText: "Hi Dana, thank you for the 5-star review! We're glad the team could find that leak fast and leave things spotless. We appreciate your business and look forward to helping you again.",
        thread: [
          { type: "received", at: t(0.5), by: "system" },
          { type: "draft_generated", at: t(0.5), by: "system", text: "Hi Dana, thank you for the 5-star review! ..." },
          { type: "approved", at: t(0.5), by: "owner", text: "Hi Dana, thank you for the 5-star review! We're glad the team could find that leak fast and leave things spotless. We appreciate your business and look forward to helping you again." },
        ],
      },
      {
        id: "rev-4b2",
        locationId: "loc-main-st",
        reviewerName: "Marcus Bell",
        stars: 4,
        comment: "Good work replacing our water heater. Took a day longer than quoted but the crew was professional.",
        createdAt: t(1),
        updatedAt: t(1),
        status: "approved",
        replyText: "Hi Marcus, thank you for the 4-star review! Glad the new water heater is in and the crew took good care of you. We appreciate your business.",
        thread: [
          { type: "received", at: t(1), by: "system" },
          { type: "draft_generated", at: t(1), by: "system", text: "Hi Marcus, thank you for the 4-star review! ..." },
          { type: "approved", at: t(1), by: "owner", text: "Hi Marcus, thank you for the 4-star review! Glad the new water heater is in and the crew took good care of you. We appreciate your business." },
        ],
      },
      {
        id: "rev-5c3",
        locationId: "loc-riverside",
        reviewerName: "Priya Natarajan",
        stars: 5,
        comment: "Emergency pipe burst at 10pm and they were here by 11. Lifesavers. Fair pricing too.",
        createdAt: t(2),
        updatedAt: t(2),
        status: "draft",
        draftText: "Hi Priya, thank you for the 5-star review! We're glad the team could get there fast for that emergency. We appreciate your business and look forward to helping you again.",
        thread: [
          { type: "received", at: t(2), by: "system" },
          { type: "draft_generated", at: t(2), by: "system", text: "Hi Priya, ..." },
        ],
      },
      {
        id: "rev-3d4",
        locationId: "loc-riverside",
        reviewerName: "Sam Okafor",
        stars: 3,
        comment: "Drain cleaning worked, but the tech left muddy footprints on my carpet and I had to ask for a shoe cover.",
        createdAt: t(3),
        updatedAt: t(3),
        status: "draft",
        draftText: "Hi Sam, thank you for your honest review. We're sorry your experience was not what it should have been. Please call the owner directly at the Beacon Ridge Plumbing - Riverside office (Ridgewood) so we can look into this personally. Your feedback helps us improve.",
        thread: [
          { type: "received", at: t(3), by: "system" },
          { type: "draft_generated", at: t(3), by: "system", text: "Hi Sam, ..." },
        ],
      },
      {
        id: "rev-2e5",
        locationId: "loc-main-st",
        reviewerName: "Karen Delacroix",
        stars: 2,
        comment: "Quoted one price over the phone, charged 40 percent more on site. Felt taken advantage of.",
        createdAt: t(4),
        updatedAt: t(4),
        status: "draft",
        draftText: "Hi Karen, thank you for your honest review. We're sorry your experience was not what it should have been. Please call the owner directly at the Beacon Ridge Plumbing - Main Street office (Ridgewood) so we can look into this personally. Your feedback helps us improve.",
        thread: [
          { type: "received", at: t(4), by: "system" },
          { type: "draft_generated", at: t(4), by: "system", text: "Hi Karen, ..." },
        ],
      },
      {
        id: "rev-1f6",
        locationId: "loc-main-st",
        reviewerName: "Anonymous",
        stars: 1,
        comment: "Nobody showed up during the appointment window and nobody called. Complete waste of a day off.",
        createdAt: t(5),
        updatedAt: t(5),
        status: "pending",
        thread: [{ type: "received", at: t(5), by: "system" }],
      },
      {
        id: "rev-1g7",
        locationId: "loc-riverside",
        reviewerName: "Tom Rivas",
        stars: 1,
        comment: "Water heater install leaked the next day and flooded my garage. Still waiting on a callback.",
        createdAt: t(9),
        updatedAt: t(9),
        status: "draft",
        draftText: "Hi Tom, thank you for your honest review. We're sorry your experience was not what it should have been. Please call the owner directly at the Beacon Ridge Plumbing - Riverside office (Ridgewood) so we can look into this personally. Your feedback helps us improve.",
        thread: [
          { type: "received", at: t(9), by: "system" },
          { type: "draft_generated", at: t(9), by: "system", text: "Hi Tom, ..." },
        ],
      },
      {
        id: "rev-5h8",
        locationId: "loc-riverside",
        reviewerName: "Lisa Tran",
        stars: 5,
        comment: "Second time using them. Consistent, tidy, honest. The only plumber I call now.",
        createdAt: t(6),
        updatedAt: t(6),
        status: "approved",
        replyText: "Hi Lisa, thank you for the 5-star review! It means a lot to the Beacon Ridge Plumbing - Riverside team that you keep calling us back. We appreciate your business and look forward to helping you again.",
        thread: [
          { type: "received", at: t(6), by: "system" },
          { type: "draft_generated", at: t(6), by: "system", text: "Hi Lisa, thank you for the 5-star review! ..." },
          { type: "approved", at: t(6), by: "owner", text: "Hi Lisa, thank you for the 5-star review! It means a lot to the Beacon Ridge Plumbing - Riverside team that you keep calling us back. We appreciate your business and look forward to helping you again." },
        ],
      },
    ],
    alertLog: [],
    digestLog: [],
  };
}
