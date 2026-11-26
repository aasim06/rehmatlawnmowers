/**
 * Formats a category identifier (e.g. "RACE_GRIP", "BEARING_DOUBI") into clean Title Case ("Race Grip", "Bearing Doubi")
 * or returns "All Categories" if given "All" or an empty string.
 */
export function formatCategoryLabel(cat) {
  if (!cat || cat === 'All') return 'All Categories';
  return String(cat)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

