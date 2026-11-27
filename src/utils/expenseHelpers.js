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

export function getPeriodBounds({ period = 'today', todayStr = getLocalDateISO(), fromDate = '', toDate = '' } = {}) {
  if (period === 'today') return { startISO: todayStr, endISO: todayStr };
  if (period === 'week') return { startISO: shiftLocalDateISO(todayStr, -6), endISO: todayStr };
  if (period === 'fortnight') return { startISO: shiftLocalDateISO(todayStr, -14), endISO: todayStr };
  if (period === 'month') return { startISO: `${todayStr.slice(0, 7)}-01`, endISO: `${todayStr.slice(0, 7)}-31` };
  if (period === 'custom') return { startISO: fromDate || '', endISO: toDate || '' };
  return { startISO: '', endISO: '' };
}

/**
 * Checks whether a YYYY-MM-DD record date falls inside the active period filter.
 */
export function isDateInExpensePeriod(recordDate, options = {}) {
  const cleanDate = String(recordDate || '').slice(0, 10);
  if (options.period === 'all') return true;
  if (!cleanDate) return false;
  const { startISO, endISO } = getPeriodBounds(options);
  if (startISO && cleanDate < startISO) return false;
  if (endISO && cleanDate > endISO) return false;
  return true;
}

/**
 * Computes rolling cash drawer accounting across periods:
 * Opening Balance (prior days' net remaining cash) + Cash Received - Cash Returned - Expenses = Closing Balance.
 */
export function computeCashClosingSummary({
  expenseFunds = [],
  expenses = [],
  period = 'today',
  todayStr = getLocalDateISO(),
  fromDate = '',
  toDate = ''
} = {}) {
  const { startISO, endISO } = getPeriodBounds({ period, todayStr, fromDate, toDate });
  const bounds = { period, todayStr, fromDate, toDate };

  const signedFundAmount = (f) => {
    const amt = parseFloat(f.amount) || 0;
    return f.entryType === 'returned' ? -amt : amt;
  };

  let openingBalance = 0;
  if (period !== 'all' && startISO) {
    const priorCashNet = expenseFunds
      .filter((f) => {
        const d = String(f.fundDate || '').slice(0, 10);
        return Boolean(d) && d < startISO;
      })
      .reduce((sum, f) => sum + signedFundAmount(f), 0);

    const priorExpenses = expenses
      .filter((e) => {
        const d = String(e.expenseDate || '').slice(0, 10);
        return Boolean(d) && d < startISO;
      })
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    openingBalance = priorCashNet - priorExpenses;
  }

  const periodFunds = expenseFunds.filter((f) => isDateInExpensePeriod(f.fundDate, bounds));
  const periodExpenses = expenses.filter((e) => isDateInExpensePeriod(e.expenseDate, bounds));

  const periodCashReceived = periodFunds
    .filter((f) => f.entryType !== 'returned')
    .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

  const periodCashReturned = periodFunds
    .filter((f) => f.entryType === 'returned')
    .reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);

  const totalAvailableCash = openingBalance + periodCashReceived - periodCashReturned;
  const periodExpensesTotal = periodExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const closingBalance = totalAvailableCash - periodExpensesTotal;

  const allTimeCashNet = expenseFunds.reduce((sum, f) => sum + signedFundAmount(f), 0);
  const allTimeExpensesTotal = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const allTimeClosingBalance = allTimeCashNet - allTimeExpensesTotal;

  return {
    startISO,
    endISO,
    periodFunds,
    periodExpenses,
    openingBalance,
    periodCashReceived,
    periodCashReturned,
    totalAvailableCash,
    periodExpensesTotal,
    closingBalance,
    allTimeCashNet,
    allTimeExpensesTotal,
    allTimeClosingBalance
  };
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
