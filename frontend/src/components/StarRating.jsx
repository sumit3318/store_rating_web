import { useState } from 'react';

// Five stars.
//  - with onChange: clickable buttons (used when giving or changing a rating)
//  - without onChange: plain display, announced to screen readers as "4 out of 5 stars"
export default function StarRating({ value = 0, onChange, size = 'md' }) {
  const [hover, setHover] = useState(0);
  const editable = typeof onChange === 'function';
  const shown = hover || value;

  if (!editable) {
    return (
      <span className={`stars stars-${size}`} role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`star ${star <= value ? 'filled' : ''}`} aria-hidden="true">★</span>
        ))}
      </span>
    );
  }

  return (
    <span className={`stars stars-${size}`} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= shown ? 'filled' : ''}`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
