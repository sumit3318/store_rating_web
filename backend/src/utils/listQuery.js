// Helpers for safe sorting. Column names cannot be sent as SQL parameters,
// so we only accept values from a fixed whitelist (prevents SQL injection).
function buildOrderBy(sortBy, order, allowedColumns, defaultColumn) {
  const column = allowedColumns[sortBy] || allowedColumns[defaultColumn];
  const direction = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  return `ORDER BY ${column} ${direction}, 1 ASC`;
}

// Escapes % and _ so a search like "50%" is treated as plain text.
function likePattern(value) {
  const escaped = String(value).trim().replace(/[\\%_]/g, '\\$&');
  return `%${escaped}%`;
}

module.exports = { buildOrderBy, likePattern };
