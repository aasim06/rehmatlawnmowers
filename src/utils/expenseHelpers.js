import { getLocalDateISO } from 'context/modules/useExpensesModule';

/**
 * Period presets for Daily, Weekly, 15-Day, Monthly, Custom, and All-Time Expense Closing Sheets.
 */
export const EXPENSE_PERIOD_OPTIONS = [
  { key: 'today', label: 'Daily (Today)', days: 1 },
  { key: 'week', label: 'Weekly (7 Days)', days: 7 },
  { key: 'fortnight', label: '15 Days', days: 15 },
  { key: 'month', label: 'This Month', days: null },
  { key: 'custom', label: 'Custom Dates', days: null },
  { key: 'all', label: 'All Records', days: null }
];

export const shiftLocalDateISO = (baseISO, deltaDays) => {
  const parts = String(baseISO || getLocalDateISO()).split('-').map(Number);
  const dt = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  dt.setDate(dt.getDate() + deltaDays);
  return getLocalDateISO(dt);
};

/**
 * Checks whether a YYYY-MM-DD record date falls inside the active period filter.
 */
export function isDateInExpensePeriod(recordDate, { period = 'today', todayStr = getLocalDateISO(), fromDate = '', toDate = '' } = {}) {
  const cleanDate = String(recordDate || '').slice(0, 10);
  if (period === 'all') return true;
  if (!cleanDate) return false;

  if (period === 'today') return cleanDate === todayStr;
  if (period === 'week') {
    const start = shiftLocalDateISO(todayStr, -6);
    return cleanDate >= start && cleanDate <= todayStr;
  }
  if (period === 'fortnight') {
    const start = shiftLocalDateISO(todayStr, -14);
    return cleanDate >= start && cleanDate <= todayStr;
  }
  if (period === 'month') {
    return cleanDate.startsWith(todayStr.slice(0, 7));
  }
  if (period === 'custom') {
    if (fromDate && cleanDate < fromDate) return false;
    if (toDate && cleanDate > toDate) return false;
    return true;
  }
  return true;
}

/**
 * Returns human-readable label and date range string for UI headers & closing statements.
 */
export function describeExpensePeriod({ period = 'today', todayStr = getLocalDateISO(), fromDate = '', toDate = '' } = {}) {
  const match = EXPENSE_PERIOD_OPTIONS.find((p) => p.key === period) || EXPENSE_PERIOD_OPTIONS[0];
  if (period === 'today') return { label: 'Today', shortLabel: 'Today', rangeText: todayStr };
  if (period === 'week') return { label: 'Weekly (7 Days)', shortLabel: '7 Days', rangeText: `${shiftLocalDateISO(todayStr, -6)} to ${todayStr}` };
  if (period === 'fortnight') return { label: '15 Days Cycle', shortLabel: '15 Days', rangeText: `${shiftLocalDateISO(todayStr, -14)} to ${todayStr}` };
  if (period === 'month') return { label: 'This Month', shortLabel: 'Month', rangeText: todayStr.slice(0, 7) };
  if (period === 'custom') {
    const range = fromDate || toDate ? `${fromDate || '...'} to ${toDate || '...'}` : 'Custom Range';
    return { label: 'Custom Period', shortLabel: 'Custom', rangeText: range };
  }
  return { label: match.label, shortLabel: 'All Time', rangeText: 'All Records' };
}
