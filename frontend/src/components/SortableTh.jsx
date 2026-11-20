// Table header cell that sorts when clicked and shows an arrow for the active column.
export default function SortableTh({ label, column, sort, onSort }) {
  const active = sort.sortBy === column;
  const arrow = active ? (sort.order === 'asc' ? '▲' : '▼') : '↕';

  return (
    <th className="sortable" onClick={() => onSort(column)} aria-sort={active ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {label} <span className={active ? 'sort-arrow active' : 'sort-arrow'}>{arrow}</span>
    </th>
  );
}
