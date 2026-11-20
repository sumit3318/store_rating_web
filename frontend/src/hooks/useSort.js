import { useState } from 'react';

// Keeps track of which column is sorted and in which direction.
// Clicking the same column again flips asc <-> desc.
export default function useSort(initialColumn, initialOrder = 'asc') {
  const [sort, setSort] = useState({ sortBy: initialColumn, order: initialOrder });

  function toggleSort(column) {
    setSort((current) =>
      current.sortBy === column
        ? { sortBy: column, order: current.order === 'asc' ? 'desc' : 'asc' }
        : { sortBy: column, order: 'asc' }
    );
  }

  return { sort, toggleSort };
}
