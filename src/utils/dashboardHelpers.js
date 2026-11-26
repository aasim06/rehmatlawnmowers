import { formatCategoryLabel } from 'utils/formatText';

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats PKR amounts consistently for KPI values and subtitles.
 */
export function formatPKR(amount) {
  return `Rs. ${Math.round(Number(amount) || 0).toLocaleString()}`;
}

/**
 * Resolves a JS Date from mixed log/sale time strings and ISO fields.
 */
export function parseRecordDate(record) {
  if (!record) return null;
  const iso = record.dateISO || record.createdAt;
  if (iso) {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const timeStr = String(record.time || '');
  const now = new Date();
  if (timeStr.includes('Today')) return now;
  if (timeStr.includes('Yesterday')) {
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    return y;
  }
  return null;
}

/**
 * Formats timestamps cleanly into human-readable dates without squashing SKU codes.
 */
export function formatFriendlyDateTime(record) {
  const parsed = parseRecordDate(record);
  if (parsed) {
    const d = parsed.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const t = parsed.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d}, ${t}`;
  }
  return record?.receivedDate || record?.time || 'Recent';
}

/**
 * Aggregates Stock In vs Stock Out logs into weekly and monthly chart series.
 */
export function buildInventoryTimeSeries(usageLogs = []) {
  const now = new Date();
  const currentDayIdx = (now.getDay() + 6) % 7;
  const currentMonthIdx = now.getMonth();

  const weeklyIn = Array(7).fill(0);
  const weeklyOut = Array(7).fill(0);
  const monthlyIn = Array(12).fill(0);
  const monthlyOut = Array(12).fill(0);

  usageLogs.forEach((log) => {
    const qty = Math.abs(parseInt(log.qtyUsed, 10) || 0);
    if (qty <= 0) return;

    const isIn = String(log.type || '')
      .toUpperCase()
      .includes('IN');
    const date = parseRecordDate(log);
    const dayIdx = date ? (date.getDay() + 6) % 7 : currentDayIdx;
    const monthIdx = date ? date.getMonth() : currentMonthIdx;

    if (isIn) {
      weeklyIn[dayIdx] += qty;
      monthlyIn[monthIdx] += qty;
    } else {
      weeklyOut[dayIdx] += qty;
      monthlyOut[monthIdx] += qty;
    }
  });

  return {
    weeklyLabels: WEEK_LABELS,
    monthlyLabels: MONTH_LABELS,
    weeklyIn,
    weeklyOut,
    monthlyIn,
    monthlyOut
  };
}

/**
 * Builds top-5 category stock breakdown rows for overview panels.
 */
export function buildCategoryBreakdown(items = [], getStockCount) {
  const map = {};
  items.forEach((item) => {
    const rawCat = item.category || 'General';
    const label = formatCategoryLabel(rawCat);
    const stock = getStockCount(item);
    if (!map[label]) map[label] = { count: 0, stock: 0 };
    map[label].count += 1;
    map[label].stock += stock;
  });

  const sorted = Object.entries(map)
    .map(([label, val]) => ({ label, ...val }))
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5);

  const maxStock = Math.max(...sorted.map((c) => c.stock), 1);

  return sorted.map((entry, idx) => ({
    label: entry.label,
    valueText: `${entry.count} items • ${entry.stock.toLocaleString()} units`,
    percent: Math.round((entry.stock / maxStock) * 100),
    tone: idx === 0 ? 'primary' : 'neutral'
  }));
}

/**
 * Computes percentage of items above minimum threshold.
 */
export function computeStockHealthPct(items = [], lowStockAlerts = []) {
  if (!items || items.length === 0) return 100;
  return Math.round(((items.length - (lowStockAlerts?.length || 0)) / items.length) * 100);
}

/**
 * Resolves total sold units from a sale document (supporting single-line and multi-item carts).
 */
export function resolveSaleUnitCount(sale) {
  if (Array.isArray(sale?.items) && sale.items.length > 0) {
    return sale.items.reduce((sum, it) => sum + (Math.max(1, parseInt(it?.qty, 10) || 1)), 0);
  }
  return Math.max(1, parseInt(sale?.qty, 10) || 1);
}

/**
 * Aggregates customer billing metrics consistently across financial departments (Machine & Shop).
 */
export function buildBillingSummaryMetrics({
  ledgers = [],
  sales = [],
  repairs = [],
  payments = [],
  resolveSale,
  resolveRepair
} = {}) {
  const totalSalesRevenue = (sales || []).reduce((acc, s) => acc + (resolveSale ? resolveSale(s, payments).billTotal : 0), 0);
  const totalRepairRevenue = (repairs || []).reduce((acc, r) => acc + (resolveRepair ? resolveRepair(r, payments).netTotal : 0), 0);
  const totalUnitsSold = (sales || []).reduce((acc, s) => acc + resolveSaleUnitCount(s), 0);

  const totalBilledAll = (ledgers || []).reduce((acc, c) => acc + (c.totalDebit || 0), 0);
  const totalCollected = (ledgers || []).reduce((acc, c) => acc + (c.totalCredit || 0), 0);
  const totalReceivables = (ledgers || []).reduce((acc, c) => acc + (c.balanceVal || 0), 0);
  const unpaidAccountsCount = (ledgers || []).filter((c) => (c.balanceVal || 0) > 0).length;
  const collectionPct = totalBilledAll > 0 ? Math.min(100, Math.round((totalCollected / totalBilledAll) * 100)) : 100;

  return {
    totalSalesRevenue,
    totalRepairRevenue,
    totalCombinedBilling: totalSalesRevenue + totalRepairRevenue,
    totalUnitsSold,
    totalCollected,
    totalReceivables,
    unpaidAccountsCount,
    collectionPct
  };
}

/**
 * Aggregates Billed Amount vs Cash Collected across sales, optional repairs, and payment vouchers.
 */
export function buildBillingTimeSeries({ sales = [], repairs = [], payments = [], resolveSale, resolveRepair } = {}) {
  const now = new Date();
  const curDay = (now.getDay() + 6) % 7;
  const curMonth = now.getMonth();

  const weeklyBilled = Array(7).fill(0);
  const weeklyPaid = Array(7).fill(0);
  const monthlyBilled = Array(12).fill(0);
  const monthlyPaid = Array(12).fill(0);

  (sales || []).forEach((sale) => {
    const fin = resolveSale ? resolveSale(sale, payments) : { billTotal: 0, paidAmount: 0, linkedCredits: 0 };
    const dt = parseRecordDate({ dateISO: sale.dateISO || sale.createdAt, time: sale.date || sale.time });
    const dayIdx = dt ? (dt.getDay() + 6) % 7 : curDay;
    const monthIdx = dt ? dt.getMonth() : curMonth;
    const directPaid = Math.max(0, (fin.paidAmount || 0) - (fin.linkedCredits || 0));

    weeklyBilled[dayIdx] += fin.billTotal || 0;
    weeklyPaid[dayIdx] += directPaid;
    monthlyBilled[monthIdx] += fin.billTotal || 0;
    monthlyPaid[monthIdx] += directPaid;
  });

  (repairs || []).forEach((repair) => {
    const fin = resolveRepair ? resolveRepair(repair, payments) : { netTotal: 0, paidAmount: 0, linkedCredits: 0 };
    const dt = parseRecordDate({ dateISO: repair.dateISO, time: repair.receivedDate });
    const dayIdx = dt ? (dt.getDay() + 6) % 7 : curDay;
    const monthIdx = dt ? dt.getMonth() : curMonth;
    const directPaid = Math.max(0, (fin.paidAmount || 0) - (fin.linkedCredits || 0));

    weeklyBilled[dayIdx] += fin.netTotal || 0;
    weeklyPaid[dayIdx] += directPaid;
    monthlyBilled[monthIdx] += fin.netTotal || 0;
    monthlyPaid[monthIdx] += directPaid;
  });

  (payments || []).forEach((pay) => {
    const amt = parseFloat(pay.amountPaid) || 0;
    if (amt <= 0) return;
    const dt = parseRecordDate({ dateISO: pay.dateISO || pay.createdAt, time: pay.time });
    const dayIdx = dt ? (dt.getDay() + 6) % 7 : curDay;
    const monthIdx = dt ? dt.getMonth() : curMonth;

    if (pay.entryType === 'Payout') {
      weeklyBilled[dayIdx] += amt;
      monthlyBilled[monthIdx] += amt;
    } else {
      weeklyPaid[dayIdx] += amt;
      monthlyPaid[monthIdx] += amt;
    }
  });

  return {
    weeklyLabels: WEEK_LABELS,
    monthlyLabels: MONTH_LABELS,
    weeklyBilled,
    weeklyPaid,
    monthlyBilled,
    monthlyPaid
  };
}
