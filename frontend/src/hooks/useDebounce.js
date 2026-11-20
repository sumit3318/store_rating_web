import { useEffect, useState } from 'react';

// Returns `value` only after it stopped changing for `delay` ms.
// Used so typing in a search box does not call the API on every keystroke.
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
