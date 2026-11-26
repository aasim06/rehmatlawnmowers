/**
 * Pure utility functions and financial/grouping selectors for the Factory Store Stock In module.
 */

export function generateStoreVoucherNo(mode = 'in') {
  const prefix = mode === 'out' ? 'ISS' : 'SKU';
  return `${prefix}-${Math.floor(10000000 + Math.random() * 90000000)}`;
}

export const generateStockInVoucherNo = () => generateStoreVoucherNo('in');

/**
 * Combines unique category names across categories list and store items.
 */
export function resolveStockInCategories({ categories = [], items = [] } = {}) {
  const seen = new Set(['general']);
  const list = ['General'];

  const pushCat = (raw) => {
    const clean = (typeof raw === 'string' ? raw : raw?.name || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push(clean);
  };

  (categories || []).forEach(pushCat);
  (items || []).forEach((it) => pushCat(it?.category));

  return [list[0], ...list.slice(1).sort((a, b) => a.localeCompare(b))];
}

/**
 * Combines unique product/part names across store inventory and master directory.
 */
export function resolveStockInItemNames({ items = [], masterItemNames = [] } = {}) {
  const seen = new Set();
  const names = [];

  const pushName = (raw) => {
    const clean = (typeof raw === 'string' ? raw : raw?.name || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(clean);
  };

  (items || []).forEach(pushName);
  (masterItemNames || []).forEach(pushName);

  return names.sort((a, b) => a.localeCompare(b));
}

/**
 * Computes consistent quantity, unit rate, discount, and net line total for a Stock In entry.
 */
export function computeStockInLineMath({ qty, totalBillAmount, unitPrice, discount } = {}) {
  const qtyVal = Math.max(1, parseInt(qty, 10) || 1);
  const hasExplicitBill = totalBillAmount !== undefined && totalBillAmount !== null && totalBillAmount !== '';
  const billVal = hasExplicitBill ? Math.max(0, parseFloat(totalBillAmount) || 0) : qtyVal * Math.max(0, parseFloat(unitPrice) || 0);
  const priceVal = qtyVal > 0 ? billVal / qtyVal : billVal;
  const discountVal = Math.max(0, parseFloat(discount) || 0);
  const netTotal = Math.max(0, billVal - discountVal);

  return { qtyVal, billVal, priceVal, discountVal, netTotal };
}

/**
 * Summarizes live session invoice totals and settlement status.
 */
export function computeSessionInvoiceSummary(currentInvoiceItems = []) {
  const list = currentInvoiceItems || [];
  const totalQty = list.reduce((sum, it) => sum + (parseInt(it.qtyUsed, 10) || 1), 0);
  const totalAmount = list.reduce((sum, it) => sum + (parseFloat(it.lineTotal) || 0), 0);
  const paidAmount = list.reduce((max, it) => Math.max(max, parseFloat(it.amountPaid) || 0), 0);
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  let statusLabel = 'Full Credit (Unpaid)';
  let statusColor = 'error';
  if (totalAmount > 0 && balanceDue <= 0) {
    statusLabel = 'Paid in Full';
    statusColor = 'success';
  } else if (paidAmount > 0) {
    statusLabel = 'Partial Payment';
    statusColor = 'warning';
  }

  return { totalQty, totalAmount, paidAmount, balanceDue, statusLabel, statusColor };
}

/**
 * Groups Stock In or Stock Out logs by Party (Vendor or Recipient) and optionally reconciles vendor payments.
 */
export function groupStoreLogsByParty({ logs = [], vendorPayments = [], includeVendorPayments = true, defaultParty = 'Direct Supplier' } = {}) {
  const groups = {};

  (logs || []).forEach((log) => {
    const partyName = (log.usedBy || log.vendor || log.customer || log.department || defaultParty).trim() || defaultParty;
    if (!groups[partyName]) {
      groups[partyName] = {
        vendorName: partyName,
        partyName,
        items: [],
        totalQty: 0,
        totalBill: 0,
        latestTime: log.time || '',
        latestEpoch: 0,
        biltyNos: new Set()
      };
    }

    const qty = Math.max(1, parseInt(log.qtyUsed, 10) || 1);
    const logTotal =
      log.lineTotal !== undefined && Number(log.lineTotal) > 0 ? parseFloat(log.lineTotal) : qty * (parseFloat(log.unitPrice) || 0);

    groups[partyName].items.push(log);
    groups[partyName].totalQty += qty;
    groups[partyName].totalBill += logTotal;
    if (log.biltyNo) groups[partyName].biltyNos.add(log.biltyNo);

    const logEpoch = new Date(log.dateISO || log.created_at || log.time || 0).getTime() || 0;
    if (logEpoch >= (groups[partyName].latestEpoch || 0)) {
      groups[partyName].latestEpoch = logEpoch;
      groups[partyName].latestTime = log.time || '';
    }
  });

  return Object.values(groups)
    .map((group) => {
      group.items.sort(
        (a, b) => (new Date(b.dateISO || b.created_at || b.time || 0).getTime() || 0) - (new Date(a.dateISO || a.created_at || a.time || 0).getTime() || 0)
      );

      if (!includeVendorPayments) {
        return {
          ...group,
          biltyList: [],
          totalPaid: group.totalBill,
          remainingBalance: 0,
          paymentMethod: group.items[0]?.paymentMethod || 'Store Issuance'
        };
      }

      const vLower = group.vendorName.toLowerCase();
      const matchingPayments = (vendorPayments || []).filter((vp) => (vp.vendorName || '').trim().toLowerCase() === vLower);
      const totalPaidVal = matchingPayments.reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);
      const paidVal =
        matchingPayments.length > 0 ? totalPaidVal : group.items.reduce((max, it) => Math.max(max, parseFloat(it.amountPaid) || 0), 0);
      const balanceVal = Math.max(0, group.totalBill - paidVal);

      return {
        ...group,
        biltyList: Array.from(group.biltyNos),
        totalPaid: paidVal,
        remainingBalance: balanceVal,
        paymentMethod: matchingPayments[0]?.paymentMethod || group.items[0]?.paymentMethod || 'Cash'
      };
    })
    .sort((a, b) => (b.latestEpoch || 0) - (a.latestEpoch || 0));
}

export function groupStockInLogsByVendor({ stockInLogs = [], vendorPayments = [] } = {}) {
  return groupStoreLogsByParty({ logs: stockInLogs, vendorPayments, includeVendorPayments: true, defaultParty: 'Direct Supplier' });
}

/**
 * Computes top KPI totals from Stock In logs and grouped vendor summaries.
 */
export function computeStockInKpis({ stockInLogs = [], groupedLogs = [] } = {}) {
  const totalRecords = stockInLogs.length;
  const totalUnits = stockInLogs.reduce((sum, l) => sum + (Math.max(1, parseInt(l.qtyUsed, 10) || 1)), 0);
  const totalBilled = groupedLogs.reduce((sum, g) => sum + (g.totalBill || 0), 0);
  const totalPaid = groupedLogs.reduce((sum, g) => sum + Math.min(g.totalBill || 0, g.totalPaid || 0), 0);
  const totalPayable = groupedLogs.reduce((sum, g) => sum + (g.remainingBalance || 0), 0);
  const vendorsWithDue = groupedLogs.filter((g) => (g.remainingBalance || 0) > 0).length;

  return {
    totalRecords,
    totalUnits,
    totalBilled,
    totalPaid,
    totalPayable,
    vendorCount: groupedLogs.length,
    vendorsWithDue
  };
}

/**
 * Formats Stock In logs/items cleanly for UniversalPrintModal.
 */
export function formatStockInPrintPayload({
  voucherNo,
  type = 'Stock In Receipt',
  vendor = 'Market',
  biltyNo = '',
  itemsList = [],
  totalBill,
  amountPaid,
  remainingBalance,
  paymentMethod = 'Cash',
  time
} = {}) {
  const mappedItems = (itemsList || []).map((it) => {
    const qty = Math.max(1, parseInt(it.qtyUsed ?? it.qty, 10) || 1);
    const rate = parseFloat(it.unitPrice) || 0;
    const total = it.lineTotal !== undefined ? parseFloat(it.lineTotal) || 0 : qty * rate;
    return {
      name: (it.itemName || 'Store Item').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim(),
      subtitle: it.category || undefined,
      qty,
      rate,
      total
    };
  });

  const computedTotal =
    totalBill !== undefined ? parseFloat(totalBill) || 0 : mappedItems.reduce((sum, it) => sum + (it.total || 0), 0);
  const paidVal = parseFloat(amountPaid) || 0;
  const dueVal = remainingBalance !== undefined ? Math.max(0, parseFloat(remainingBalance) || 0) : Math.max(0, computedTotal - paidVal);

  return {
    id: voucherNo || 'PO-RECEIPT',
    type,
    vendor: (vendor || 'Supplier').trim(),
    biltyNo: biltyNo || '',
    paymentMethod,
    time: time || `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    items: mappedItems,
    summary: {
      totalAmount: computedTotal,
      paidAmount: paidVal,
      balanceAmount: dueVal,
      notes: `Payment Method: ${paymentMethod}`
    }
  };
}
