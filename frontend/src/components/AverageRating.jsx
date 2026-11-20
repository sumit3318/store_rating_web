import StarRating from './StarRating';

// Shows an average like "4.0 ★★★★☆ (3)" or "No ratings yet".
export default function AverageRating({ average, count }) {
  if (average === null || average === undefined) {
    return <span className="muted">No ratings yet</span>;
  }
  return (
    <span className="average-rating">
      <strong>{Number(average).toFixed(1)}</strong>
      <StarRating value={Math.round(Number(average))} size="sm" />
      {count !== undefined && <span className="muted">({count})</span>}
    </span>
  );
}
