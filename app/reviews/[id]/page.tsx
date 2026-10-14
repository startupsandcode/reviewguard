import { notFound } from "next/navigation";
import { getReview, loadDb } from "@/lib/store";
import ReviewActions from "./ReviewActions";

export default async function ReviewDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = loadDb();
  const review = getReview(db, id);
  if (!review) notFound();
  const location = db.locations.find((l) => l.id === review.locationId);

  return (
    <>
      <h1>Review detail</h1>
      <div className="card">
        <p className="stars">{"★".repeat(review.stars)}{"☆".repeat(5 - review.stars)} — {review.stars} star{review.stars === 1 ? "" : "s"}</p>
        <p><strong>{review.reviewerName}</strong> at {location?.name}</p>
        <p>{review.comment}</p>
        <p style={{ fontSize: 12, color: "#888" }}>
          Received {new Date(review.createdAt).toLocaleString()} · Status: {review.status.toUpperCase()}
        </p>
      </div>

      <ReviewActions review={review} />

      <div className="card">
        <h2>Thread history</h2>
        <ul className="thread">
          {review.thread.map((t, i) => (
            <li key={i}>
              <strong>{t.type.replace(/_/g, " ")}</strong>{" "}
              <span className="t">{new Date(t.at).toLocaleString()} · {t.by}</span>
              {t.text && <div style={{ marginTop: 4 }}>{t.text}</div>}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
