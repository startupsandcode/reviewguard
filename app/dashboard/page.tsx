import Link from "next/link";
import { loadDb, reviewsForLocation } from "@/lib/store";
import type { Location, Review, ReviewStatus } from "@/lib/types";
import InjectForm from "./InjectForm";

import { isDemoMode } from "@/lib/demo";

const DEMO_ENABLED = isDemoMode();

function badge(status: ReviewStatus) {
  return <span className={`badge badge-${status}`}>{status.toUpperCase()}</span>;
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ location?: string }>;
}) {
  const { location: locParam } = await searchParams;
  const db = loadDb();
  const activeLocId = locParam || db.locations[0]?.id || "";
  const activeLoc: Location | undefined = db.locations.find((l) => l.id === activeLocId);
  const reviews: Review[] = activeLocId ? reviewsForLocation(db, activeLocId) : [];

  const total = reviews.length;
  const replied = reviews.filter((r) => r.status === "approved").length;
  const avg = total ? reviews.reduce((s, r) => s + r.stars, 0) / total : null;
  const urgent = reviews.filter((r) => r.stars <= 2 && r.status !== "approved" && r.status !== "discarded").length;
  const pending = reviews.filter((r) => r.status === "pending" || r.status === "draft").length;

  return (
    <>
      <h1>Review inbox</h1>
      <div className="btn-row" style={{ marginBottom: 12 }}>
        {db.locations.map((l: Location) => (
          <Link
            key={l.id}
            href={`/dashboard?location=${l.id}`}
            className="btn"
            style={{ background: l.id === activeLocId ? "#0d968b" : "#eee", color: l.id === activeLocId ? "#fff" : "#333" }}
          >
            {l.name}
          </Link>
        ))}
        {DEMO_ENABLED && <InjectForm locations={db.locations} />}
      </div>

      <div className="stat-grid">
        <div className="stat"><div className="label">Reviews</div><div className="value">{total}</div></div>
        <div className="stat"><div className="label">Avg rating</div><div className="value">{avg == null ? "n/a" : avg.toFixed(1)}</div></div>
        <div className="stat"><div className="label">Reply rate</div><div className="value">{total ? `${Math.round((replied / total) * 100)}%` : "n/a"}</div></div>
        <div className="stat"><div className="label">Urgent (1-2 star)</div><div className="value" style={{ color: urgent ? "#c0392b" : undefined }}>{urgent}</div></div>
        <div className="stat"><div className="label">Awaiting action</div><div className="value">{pending}</div></div>
      </div>

      <div className="card">
        <table className="inbox">
          <thead>
            <tr><th>Stars</th><th>Reviewer</th><th>Review</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id}>
                <td className="stars">{"★".repeat(r.stars)}{"☆".repeat(5 - r.stars)}</td>
                <td>{r.reviewerName}</td>
                <td>{r.comment.length > 80 ? r.comment.slice(0, 80) + "..." : r.comment}</td>
                <td>{badge(r.status)}</td>
                <td><Link href={`/reviews/${r.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <p>No reviews for this location yet.</p>}
        {activeLoc && <p style={{ fontSize: 12, color: "#888" }}>Location: {activeLoc.name} ({activeLoc.city})</p>}
      </div>
    </>
  );
}
