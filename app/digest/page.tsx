import { computeDigest, renderDigestText } from "@/lib/digest";
import { loadDb } from "@/lib/store";

export default async function DigestPage() {
  const db = loadDb();
  const digest = computeDigest(db);
  return (
    <>
      <h1>Weekly digest</h1>
      <div className="stat-grid">
        <div className="stat"><div className="label">Reviews this week</div><div className="value">{digest.totalReviews}</div></div>
        <div className="stat"><div className="label">Reply rate</div><div className="value">{Math.round(digest.overallReplyRate * 100)}%</div></div>
      </div>
      {digest.locations.map((l) => (
        <div className="card" key={l.locationId}>
          <h2>{l.locationName}</h2>
          <div className="stat-grid">
            <div className="stat"><div className="label">Reviews</div><div className="value">{l.reviewCount}</div></div>
            <div className="stat"><div className="label">Avg rating</div><div className="value">{l.avgRating == null ? "n/a" : l.avgRating.toFixed(1)}</div></div>
            <div className="stat"><div className="label">Trend</div><div className="value">{l.ratingTrend}</div></div>
            <div className="stat"><div className="label">Reply rate</div><div className="value">{Math.round(l.replyRate * 100)}%</div></div>
            <div className="stat"><div className="label">Needs reply (1-3 star)</div><div className="value" style={{ color: l.needsAttention ? "#c0392b" : undefined }}>{l.needsAttention}</div></div>
          </div>
        </div>
      ))}
      <div className="card">
        <h2>Digest text preview</h2>
        <pre className="digest">{renderDigestText(digest)}</pre>
        <p style={{ fontSize: 12, color: "#888" }}>
          Weekly digest email is stubbed in demo mode (console.log only; nothing sent).
          POST /api/digest to record a digest run.
        </p>
      </div>
    </>
  );
}
