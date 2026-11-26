import { isRecordInDateRange } from 'utils/ledgerHelpers';

/**
 * Formats an invoice, job card, or voucher reference cleanly for display and printing.
 */
export function formatInvoiceNo(inv) {
  if (!inv) return 'MS-10001';
  if (typeof inv === 'string') return inv;
  const num = inv.voucherNo || inv.invoiceNo || inv.slipNo || inv.saleNo || inv.sale_no || inv.repairNo || inv.repair_no || inv.id;
  if (!num) return 'MS-10001';
  const str = String(num).trim();
  if (
    (str.startsWith('MS-') ||
      str.startsWith('PO-') ||
      str.startsWith('REP-') ||
      str.startsWith('INV-') ||
      str.startsWith('PAY-') ||
      str.startsWith('SLIP-') ||
      str.startsWith('SHP-') ||
      str.startsWith('STR-') ||
      str.startsWith('VP-') ||
      str.startsWith('GRN-') ||
      str.startsWith('ISS-') ||
      str.startsWith('SKU-')) &&
    str.length <= 18
  ) {
    return str;
  }
  const cleanHex = str
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 5)
    .toUpperCase();
  if (inv.recordType === 'Repair' || inv.repairStatus) return `REP-${cleanHex || '1001'}`;
  if (inv.entryType) return `PAY-${cleanHex || '10001'}`;
  return `MS-${cleanHex || '10001'}`;
}

/**
 * Formats record dates consistently for tables and printable receipts.
 */
export function formatFullDate(timeStr, dateISO) {
  if (dateISO) {
    const d = new Date(dateISO);
    if (!Number.isNaN(d.getTime())) {
      const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateFormatted}, ${timeFormatted}`;
    }
  }
  if (timeStr && String(timeStr).includes('Today,')) {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return String(timeStr).replace('Today,', `${todayStr},`);
  }
  return timeStr || 'N/A';
}

/**
 * Resolves a numeric epoch timestamp for reliable chronological sorting across sales, repairs & vouchers.
 */
export function resolveRecordTimestamp(record) {
  if (!record) return 0;
  const iso = record.dateISO || record.createdAt || record.created_at;
  if (iso) {
    const t = Date.parse(iso);
    if (!Number.isNaN(t)) return t;
  }
  const raw = record.receivedDate || record.time || '';
  if (raw) {
    const cleaned = String(raw).replace('Today,', '');
    const t = Date.parse(cleaned);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

/**
 * Normalizes line items for both Machine Sales invoices and Workshop Repair job cards.
 */
export function normalizeMachineItems(inv) {
  if (!inv) return [];
  if (inv.recordType === 'Repair' || inv.repairNo || Array.isArray(inv.repairItems)) {
    if (Array.isArray(inv.repairItems) && inv.repairItems.length > 0) {
      return inv.repairItems.map((it) => {
        const qty = Math.max(1, parseInt(it.qnty ?? it.qty ?? 1, 10) || 1);
        const rate = Math.max(0, parseFloat(it.rate ?? it.cost ?? it.price ?? 0) || 0);
        const amount = parseFloat(it.totalAmount ?? it.amount ?? qty * rate) || qty * rate;
        return {
          name: it.specification || it.itemName || it.model || inv.machineName || 'Repair Service',
          subtitle: inv.machineName && it.specification ? inv.machineName : it.faultDescription || '',
          qty,
          rate,
          amount
        };
      });
    }
    const repairNet = resolveRepairFinancials(inv).netTotal;
    return [
      {
        name: inv.machineName || 'Machine Repair Service',
        subtitle: inv.faultDescription || 'General Repair',
        qty: 1,
        rate: repairNet,
        amount: repairNet
      }
    ];
  }

  if (Array.isArray(inv.items) && inv.items.length > 0) {
    return inv.items.map((it) => {
      const name = it.machineName || it.name || inv.machineName || 'Machine';
      const subtitle = it.serialNo ? `S/N: ${it.serialNo}` : '';
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      const rate = Math.max(0, parseFloat(it.unitPrice ?? it.price ?? 0) || 0);
      const discPercent = Math.min(100, Math.max(0, parseFloat(it.discount) || 0));
      const gross = qty * rate;
      const computed = Math.max(0, gross - (gross * discPercent) / 100);
      const amount = it.lineTotal !== undefined && !Number.isNaN(Number(it.lineTotal)) ? parseFloat(it.lineTotal) : computed;
      return { name, subtitle, qty, rate, amount };
    });
  }

  const lineTotal = parseFloat(inv.lineTotal ?? inv.subTotal) || 0;
  const qty = Math.max(1, parseInt(inv.qty, 10) || 1);
  const unitPrice = parseFloat(inv.unitPrice) || (qty > 0 ? lineTotal / qty : lineTotal);
  return [
    {
      name: inv.machineName || 'Machine',
      subtitle: inv.serialNo ? `S/N: ${inv.serialNo}` : '',
      qty,
      rate: unitPrice,
      amount: lineTotal
    }
  ];
}

/**
 * Formats all line items into a readable comma-separated list without hiding extra items behind "(+N more)".
 */
export function formatItemsSummaryLabel(items = [], fallback = 'Sale') {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  const formatted = items
    .map((it) => {
      const name = (it?.name || it?.machineName || it?.itemName || it?.specification || '').trim();
      if (!name) return '';
      const qty = Math.max(1, parseInt(it?.qty ?? it?.qnty ?? 1, 10) || 1);
      return items.length > 1 || qty > 1 ? `${name} (x${qty})` : name;
    })
    .filter(Boolean);
  return formatted.length > 0 ? formatted.join(', ') : fallback;
}

/**
 * Splits a comma-separated list while ignoring commas inside parentheses (e.g. "Motor (3-Phase, 2HP)").
 */
function splitOutsideParens(str) {
  const parts = [];
  let buf = '';
  let depth = 0;
  for (let i = 0; i < str.length; i += 1) {
    const ch = str[i];
    if (ch === '(') depth += 1;
    else if (ch === ')' && depth > 0) depth -= 1;
    if (ch === ',' && depth === 0) {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts;
}

/**
 * Replaces verbose inline "(N items: item1, item2, ...)" suffixes in payment notes
 * with a compact "(N items)" summary so ledger statements and tables stay readable on large invoices.
 */
export function formatCleanVoucherNotes(notes = '') {
  const raw = String(notes || '').trim();
  if (!raw) return '';
  const match = raw.match(/\(\s*(\d+)\s*items?\s*:\s*([^)]+(?:\([^)]*\)[^)]*)*)\)\s*$/i);
  if (!match) return raw;
  const count = parseInt(match[1], 10) || 0;
  const prefix = raw.slice(0, match.index).trim();
  const countTag = count > 0 ? `${count} ${count === 1 ? 'item' : 'items'}` : '';
  if (!prefix) return countTag;
  return countTag ? `${prefix} (${countTag})` : prefix;
}

/**
 * Resolves itemized line rows and clean header/notes metadata for Official Payment/Payout Voucher prints.
 */
export function resolveVoucherPrintBreakdown(voucher = {}) {
  const matchedInvoices = Array.isArray(voucher.matchedInvoices) ? voucher.matchedInvoices : [];
  const rawNotes = String(voucher.notes || '').trim();
  const isPayout = voucher.entryType === 'Payout';
  const isAdj = voucher.entryType === 'Adjustment';

  const typeLabel = isPayout ? 'Cash paid / refund' : isAdj ? 'Discount / settlement' : 'Payment received';

  // Extract inline "(3 items: A, B, C)" suffix if present in Stock In / vendor payment notes
  const itemsMatch = rawNotes.match(/\(\s*\d+\s*items?\s*:\s*([^)]+(?:\([^)]*\)[^)]*)*)\)\s*$/i);
  const cleanNotes = itemsMatch ? rawNotes.slice(0, itemsMatch.index).trim() : rawNotes;

  let items = [];
  if (Array.isArray(voucher.items) && voucher.items.length > 0) {
    items = voucher.items.map((it) => ({
      name: (it.name || it.itemName || it.machineName || 'Store Item').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim(),
      qty: Math.max(1, parseInt(it.qty ?? it.qtyUsed ?? 1, 10) || 1),
      rate: it.rate !== undefined && Number(it.rate) > 0 ? Number(it.rate) : null,
      amount: it.amount !== undefined && Number(it.amount) > 0 ? Number(it.amount) : null
    }));
  } else if (voucher.invoiceId && matchedInvoices.length > 0) {
    const linked = matchedInvoices.find((inv) => String(inv.id) === String(voucher.invoiceId));
    if (linked && Array.isArray(linked.items) && linked.items.length > 0) {
      items = linked.items.map((it) => ({
        name: (it.name || it.itemName || it.machineName || 'Item').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim(),
        qty: Math.max(1, parseInt(it.qty ?? it.qtyUsed ?? 1, 10) || 1),
        rate: null,
        amount: null
      }));
    }
  } else if (itemsMatch && itemsMatch[1]) {
    const parsedNames = splitOutsideParens(itemsMatch[1]);
    items = parsedNames.map((entry) => {
      const qtyTag = entry.match(/\(\s*x(\d+)\s*\)$/i);
      const itemName = (qtyTag ? entry.slice(0, qtyTag.index) : entry).trim();
      const matchedInv = matchedInvoices.find((inv) =>
        (inv.items || []).some((it) => (it.name || it.itemName || '').trim().toLowerCase() === itemName.toLowerCase())
      );
      const matchedLine = matchedInv?.items?.find(
        (it) => (it.name || it.itemName || '').trim().toLowerCase() === itemName.toLowerCase()
      );
      return {
        name: itemName,
        qty: qtyTag ? Math.max(1, parseInt(qtyTag[1], 10) || 1) : Math.max(1, parseInt(matchedLine?.qty, 10) || 1),
        rate: null,
        amount: null
      };
    });
  } else if ((voucher.referenceNo || voucher.referenceLabel) && matchedInvoices.length > 0) {
    const refRaw = String(voucher.referenceNo || voucher.referenceLabel || '').trim().toLowerCase();
    const biltyNum = refRaw.replace(/^bill\s*#/i, '').replace(/^#/, '').trim();
    const matchedBills = matchedInvoices.filter(
      (inv) =>
        (inv.poCode && String(inv.poCode).toLowerCase() === refRaw) ||
        (inv.saleNo && String(inv.saleNo).toLowerCase() === refRaw) ||
        (biltyNum && inv.biltyNo && String(inv.biltyNo).trim().toLowerCase() === biltyNum)
    );
    if (matchedBills.length > 0) {
      items = matchedBills.flatMap((b) =>
        (b.items || []).map((it) => ({
          name: (it.name || it.itemName || 'Store Item').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim(),
          qty: Math.max(1, parseInt(it.qty ?? 1, 10) || 1),
          rate: null,
          amount: null
        }))
      );
    }
  }

  const refText = voucher.referenceNo || (voucher.referenceLabel && voucher.referenceLabel !== 'General Account' ? voucher.referenceLabel : '');
  const bannerMeta = [refText ? `Ref: ${refText}` : '', cleanNotes].filter(Boolean).join(' • ');

  return {
    typeLabel,
    bannerMeta,
    cleanNotes,
    items
  };
}

/**
 * Computes consistent paid / balance / status values for a Machine Sale invoice.
 */
export function resolveSaleFinancials(sale, customerPayments = []) {
  const billTotal = Math.max(0, parseFloat(sale?.lineTotal ?? sale?.subTotal) || 0);
  const directPaid = Math.max(0, parseFloat(sale?.paidAmount) || 0);

  const linkedVouchers = (customerPayments || []).filter((p) => String(p.invoiceId || '') === String(sale?.id));
  const linkedCredits = linkedVouchers.filter((p) => p.entryType !== 'Payout').reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);

  const paidAmount = Math.max(directPaid, linkedCredits);
  const balanceAmount = Math.max(0, billTotal - paidAmount);
  const paymentStatus = billTotal > 0 && paidAmount >= billTotal ? 'Paid' : paidAmount > 0 ? 'Partial' : sale?.paymentStatus || 'Unpaid';

  return { billTotal, paidAmount, balanceAmount, paymentStatus, linkedVouchers, linkedCredits };
}

/**
 * Computes net bill, discount, paid advance and balance due for a Repair Job Card.
 * Also corrects legacy repair records where totalCost missed discountAmount subtraction.
 */
export function resolveRepairFinancials(repair, customerPayments = []) {
  const partsCost = Math.max(0, parseFloat(repair?.partsCost) || 0);
  const laborCost = Math.max(0, parseFloat(repair?.laborCost) || 0);
  const grossCost = partsCost + laborCost;
  const discount = Math.max(0, parseFloat(repair?.discountAmount) || 0);
  const rawTotal = parseFloat(repair?.totalCost);

  let netTotal;
  if (!Number.isNaN(rawTotal)) {
    // Recompute if legacy record saved grossCost instead of grossCost - discount
    if (grossCost > 0 && discount > 0 && Math.abs(rawTotal - grossCost) < 0.01) {
      netTotal = Math.max(0, grossCost - discount);
    } else {
      netTotal = Math.max(0, rawTotal);
    }
  } else {
    netTotal = Math.max(0, grossCost - discount);
  }

  const directPaid = Math.max(0, parseFloat(repair?.paidAmount) || 0);
  const linkedVouchers = (customerPayments || []).filter((p) => p.repairId && String(p.repairId) === String(repair?.id));
  const linkedCredits = linkedVouchers.filter((p) => p.entryType !== 'Payout').reduce((sum, p) => sum + (parseFloat(p.amountPaid) || 0), 0);

  const paidAmount = Math.max(directPaid, linkedCredits);
  const balanceAmount = Math.max(0, netTotal - paidAmount);
  const paymentStatus = netTotal > 0 && paidAmount >= netTotal ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';

  return { grossCost, discount, netTotal, paidAmount, balanceAmount, paymentStatus, linkedVouchers, linkedCredits };
}

/**
 * Allocates customer-level unlinked ("On Account") receipts and opening advance credits
 * chronologically across open Sales & Repair bills (FIFO) so Machine Invoices,
 * Machine Sales, Machine Repairs, Machine Payments & Customer Ledgers never disagree.
 */
export function resolveAllocatedInvoiceMap({
  machineCustomers = [],
  machineSales = [],
  machineRepairs = [],
  customerPayments = []
}) {
  const byCustomer = new Map();

  const ensureBucket = (rawName) => {
    const key = (rawName || 'Walk-in Customer').trim().toLowerCase() || 'walk-in customer';
    if (!byCustomer.has(key)) {
      byCustomer.set(key, {
        openingDue: 0,
        unlinkedCredits: 0,
        bills: []
      });
    }
    return byCustomer.get(key);
  };

  (machineCustomers || []).forEach((c) => {
    const open = parseFloat(c.openingBalance) || 0;
    const bucket = ensureBucket(c.name);
    if (open > 0) bucket.openingDue += open;
    if (open < 0) bucket.unlinkedCredits += Math.abs(open);
  });

  (customerPayments || []).forEach((p) => {
    if (p.invoiceId || p.repairId) return;
    const amt = Math.max(0, parseFloat(p.amountPaid) || 0);
    if (amt <= 0) return;
    const bucket = ensureBucket(p.customerName);
    if (p.entryType === 'Payout') {
      bucket.openingDue += amt;
    } else {
      bucket.unlinkedCredits += amt;
    }
  });

  (machineSales || []).forEach((sale) => {
    const fin = resolveSaleFinancials(sale, customerPayments);
    const bucket = ensureBucket(sale.customerName);
    bucket.bills.push({
      mapKey: `Sale:${sale.id}`,
      sortTime: resolveRecordTimestamp(sale),
      billTotal: fin.billTotal,
      directPaid: fin.paidAmount,
      rawBalance: fin.balanceAmount,
      rawStatus: fin.paymentStatus
    });
  });

  (machineRepairs || []).forEach((repair) => {
    const fin = resolveRepairFinancials(repair, customerPayments);
    const bucket = ensureBucket(repair.customerName);
    bucket.bills.push({
      mapKey: `Repair:${repair.id}`,
      sortTime: resolveRecordTimestamp(repair),
      billTotal: fin.netTotal,
      directPaid: fin.paidAmount,
      rawBalance: fin.balanceAmount,
      rawStatus: fin.paymentStatus === 'Pending' ? 'Unpaid' : fin.paymentStatus
    });
  });

  const result = new Map();

  byCustomer.forEach((bucket) => {
    // Unlinked customer-level credits first cover opening receivables / payouts
    let availableCredit = Math.max(0, bucket.unlinkedCredits - bucket.openingDue);

    const sortedBills = [...bucket.bills].sort((a, b) => a.sortTime - b.sortTime);
    sortedBills.forEach((bill) => {
      const fromAccount = bill.rawBalance > 0 && availableCredit > 0 ? Math.min(bill.rawBalance, availableCredit) : 0;
      availableCredit = Math.max(0, availableCredit - fromAccount);
      const effectivePaid = bill.directPaid + fromAccount;
      const effectiveBalance = Math.max(0, bill.billTotal - effectivePaid);
      const effectiveStatus =
        bill.billTotal > 0 && effectiveBalance <= 0 ? 'Paid' : effectivePaid > 0 ? 'Partial' : bill.rawStatus;

      result.set(bill.mapKey, {
        billTotal: bill.billTotal,
        directPaid: bill.directPaid,
        allocatedFromAccount: fromAccount,
        paidAmount: effectivePaid,
        balanceAmount: effectiveBalance,
        paymentStatus: effectiveStatus
      });
    });
  });

  return result;
}

/**
 * Builds unique autocomplete directory entries across Registered Customers, Sales and Repairs.
 */
export function getCustomerDirectorySuggestions({
  machineCustomers = [],
  machineSales = [],
  machineRepairs = [],
  customerPayments = []
}) {
  const map = new Map();

  const upsert = (rawName, rawPhone, rawCity, customerRecord = null) => {
    const name = (rawName || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const existing = map.get(key);
    const cleanPhone = (rawPhone && rawPhone !== 'N/A' ? rawPhone : '').trim();
    const cleanCity = (rawCity || '').trim();

    if (!existing) {
      map.set(key, {
        key,
        id: customerRecord?.id || null,
        name,
        phone: cleanPhone,
        city: cleanCity,
        openingBalance: customerRecord ? parseFloat(customerRecord.openingBalance) || 0 : 0,
        registered: Boolean(customerRecord)
      });
    } else {
      if (!existing.phone && cleanPhone) existing.phone = cleanPhone;
      if (!existing.city && cleanCity) existing.city = cleanCity;
      if (customerRecord) {
        existing.id = customerRecord.id;
        existing.openingBalance = parseFloat(customerRecord.openingBalance) || 0;
        existing.registered = true;
      }
    }
  };

  (machineCustomers || []).forEach((c) => upsert(c.name, c.phone, c.city || c.address, c));
  (machineSales || []).forEach((s) => upsert(s.customerName, s.customerPhone, s.cityAddress));
  (machineRepairs || []).forEach((r) => upsert(r.customerName, r.customerPhone, r.cityAddress));
  (customerPayments || []).forEach((p) => upsert(p.customerName));

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Aggregates every Machine Division Customer's complete A-to-Z Khata (Purchases, Repairs,
 * Opening Balances, Payment Receipts, Refunds/Payouts, Adjustments & Running Chronological Statement).
 */
export function buildCustomerLedgers({
  machineCustomers = [],
  machineSales = [],
  machineRepairs = [],
  customerPayments = [],
  startDate = '',
  endDate = ''
}) {
  const customerMap = new Map();

  const ensureCustomer = (rawName, defaults = {}) => {
    const cleanName = (rawName || 'Walk-in Customer').trim() || 'Walk-in Customer';
    const key = cleanName.toLowerCase();
    if (!customerMap.has(key)) {
      customerMap.set(key, {
        key,
        customerId: defaults.customerId || null,
        customerName: cleanName,
        phone: (defaults.phone && defaults.phone !== 'N/A' ? defaults.phone : '').trim(),
        city: (defaults.city || '').trim(),
        notes: defaults.notes || '',
        registered: Boolean(defaults.registered),
        openingBalance: parseFloat(defaults.openingBalance) || 0,
        totalInvoicesCount: 0,
        totalRepairsCount: 0,
        totalMachinesCount: 0,
        totalPurchasesVal: 0,
        totalPaidVal: 0,
        totalDebit: 0,
        totalCredit: 0,
        balanceVal: 0,
        netBalance: 0,
        invoices: [],
        vouchers: [],
        ledgerEntries: [],
        lastActivityTime: 0
      });
    }
    const cust = customerMap.get(key);
    if (defaults.customerId && !cust.customerId) cust.customerId = defaults.customerId;
    if (defaults.registered) {
      cust.registered = true;
      cust.openingBalance = parseFloat(defaults.openingBalance) || 0;
      if (defaults.notes) cust.notes = defaults.notes;
    }
    if (!cust.phone && defaults.phone && defaults.phone !== 'N/A') cust.phone = defaults.phone.trim();
    if (!cust.city && defaults.city) cust.city = defaults.city.trim();
    return cust;
  };

  // 1. Seed Registered Customers Directory (so parties added upfront appear in Khata even before first invoice)
  (machineCustomers || []).forEach((custDoc) => {
    const cust = ensureCustomer(custDoc.name, {
      customerId: custDoc.id,
      phone: custDoc.phone,
      city: custDoc.city || custDoc.address,
      notes: custDoc.notes,
      openingBalance: custDoc.openingBalance,
      registered: true
    });

    const openBal = parseFloat(custDoc.openingBalance) || 0;
    if (!startDate && openBal !== 0) {
      const ts = resolveRecordTimestamp(custDoc) || 1;
      const debit = openBal > 0 ? openBal : 0;
      const credit = openBal < 0 ? Math.abs(openBal) : 0;
      cust.totalDebit += debit;
      cust.totalCredit += credit;
      cust.ledgerEntries.push({
        id: `opening-${custDoc.id}`,
        sortTime: ts - 1000,
        dateLabel: formatFullDate(null, custDoc.createdAt),
        voucherNo: 'OPENING',
        type: 'Opening Balance',
        particulars: openBal > 0 ? 'Opening Balance Receivable' : 'Opening Advance Credit',
        paymentMethod: 'Ledger',
        debit,
        credit,
        raw: custDoc
      });
    }
  });

  // 2. Machine Sales Invoices
  (machineSales || []).forEach((sale) => {
    if (!isRecordInDateRange(sale, startDate, endDate)) return;
    const cust = ensureCustomer(sale.customerName, {
      phone: sale.customerPhone,
      city: sale.cityAddress
    });

    const fin = resolveSaleFinancials(sale, customerPayments);
    const mItems = normalizeMachineItems(sale);
    const machineCount = mItems.reduce((acc, i) => acc + i.qty, 0);
    const ts = resolveRecordTimestamp(sale);
    const invNo = formatInvoiceNo(sale);
    const resolvedItemsLabel =
      mItems.length > 0 ? formatItemsSummaryLabel(mItems, sale.machineName || 'Machine Sale') : sale.machineName || 'Machine Sale';

    cust.totalInvoicesCount += 1;
    cust.totalMachinesCount += machineCount;
    cust.totalPurchasesVal += fin.billTotal;
    cust.totalDebit += fin.billTotal;
    cust.lastActivityTime = Math.max(cust.lastActivityTime, ts);

    cust.invoices.push({
      ...sale,
      machineName: resolvedItemsLabel,
      paidAmount: fin.paidAmount,
      balanceAmount: fin.balanceAmount,
      paymentStatus: fin.paymentStatus,
      recordType: 'Sale'
    });

    cust.ledgerEntries.push({
      id: `sale-${sale.id}`,
      sortTime: ts,
      dateLabel: formatFullDate(sale.time, sale.dateISO),
      voucherNo: invNo,
      type: 'Machine Sale',
      particulars: resolvedItemsLabel,
      items: mItems,
      paymentMethod: 'Invoice',
      debit: fin.billTotal,
      credit: 0,
      recordType: 'Sale',
      raw: sale
    });

    // Any cash settled directly at invoice creation (not covered by linked voucher docs)
    const directAdvance = Math.max(0, fin.paidAmount - fin.linkedCredits);
    if (directAdvance > 0) {
      cust.totalCredit += directAdvance;
      cust.totalPaidVal += directAdvance;
      cust.ledgerEntries.push({
        id: `sale-adv-${sale.id}`,
        sortTime: ts + 1,
        dateLabel: formatFullDate(sale.time, sale.dateISO),
        voucherNo: invNo,
        type: 'Advance Paid',
        particulars: `Advance received with invoice ${invNo}`,
        paymentMethod: 'Cash / On Bill',
        debit: 0,
        credit: directAdvance,
        isAutoAdvance: true,
        raw: sale
      });
    }
  });

  // 3. Workshop Repair Job Cards
  (machineRepairs || []).forEach((repair) => {
    if (!isRecordInDateRange(repair, startDate, endDate)) return;
    const cust = ensureCustomer(repair.customerName, {
      phone: repair.customerPhone,
      city: repair.cityAddress
    });

    const fin = resolveRepairFinancials(repair, customerPayments);
    const rItems = normalizeMachineItems({ ...repair, recordType: 'Repair' });
    const jobNo = formatInvoiceNo(repair);
    const ts = resolveRecordTimestamp(repair);

    cust.totalRepairsCount += 1;
    cust.totalInvoicesCount += 1;
    cust.totalMachinesCount += Math.max(1, rItems.length);
    cust.totalPurchasesVal += fin.netTotal;
    cust.totalDebit += fin.netTotal;
    cust.lastActivityTime = Math.max(cust.lastActivityTime, ts);

    cust.invoices.push({
      ...repair,
      id: repair.id, // preserve true Firestore UUID (never overwrite with repairNo!)
      repairNo: jobNo,
      time: repair.receivedDate || repair.time,
      lineTotal: fin.netTotal,
      paidAmount: fin.paidAmount,
      balanceAmount: fin.balanceAmount,
      paymentStatus: fin.paymentStatus,
      recordType: 'Repair'
    });

    cust.ledgerEntries.push({
      id: `rep-${repair.id}`,
      sortTime: ts,
      dateLabel: formatFullDate(repair.receivedDate, repair.dateISO),
      voucherNo: jobNo,
      type: 'Repair Job',
      particulars: `${repair.machineName || 'Machine Repair'} — ${rItems.length > 0 ? formatItemsSummaryLabel(rItems, 'Service') : 'General Repair'} (${repair.repairStatus || 'Received'})`,
      items: rItems,
      paymentMethod: 'Job Card',
      debit: fin.netTotal,
      credit: 0,
      recordType: 'Repair',
      raw: repair
    });

    const directAdvance = Math.max(0, fin.paidAmount - fin.linkedCredits);
    if (directAdvance > 0) {
      cust.totalCredit += directAdvance;
      cust.totalPaidVal += directAdvance;
      cust.ledgerEntries.push({
        id: `rep-adv-${repair.id}`,
        sortTime: ts + 1,
        dateLabel: formatFullDate(repair.receivedDate, repair.dateISO),
        voucherNo: jobNo,
        type: 'Repair Advance',
        particulars: `Advance / payment on job card ${jobNo}`,
        paymentMethod: 'Cash / Desk',
        debit: 0,
        credit: directAdvance,
        isAutoAdvance: true,
        raw: repair
      });
    }
  });

  // 4. Customer Payment Receipts, Payouts/Refunds & Adjustments
  (customerPayments || []).forEach((pay) => {
    if (!isRecordInDateRange(pay, startDate, endDate)) return;
    const cust = ensureCustomer(pay.customerName);
    const amt = Math.max(0, parseFloat(pay.amountPaid) || 0);
    if (amt <= 0) return;

    const entryType = pay.entryType || 'Receipt';
    const ts = resolveRecordTimestamp(pay);
    const vNo = formatInvoiceNo(pay);

    const refSuffix = pay.referenceLabel
      ? ` — Ref: ${pay.referenceLabel}`
      : pay.invoiceId
        ? ' — Against Invoice'
        : pay.repairId
          ? ' — Against Repair Job'
          : ' — General Account';
    const cleanNote = formatCleanVoucherNotes(pay.notes);
    const noteText = cleanNote ? ` • ${cleanNote}` : '';

    let debit = 0;
    let credit = 0;
    let displayType = 'Payment Received';

    if (entryType === 'Payout') {
      debit = amt;
      displayType = 'Cash Paid / Refund';
    } else if (entryType === 'Adjustment') {
      credit = amt;
      displayType = 'Discount / Adjustment';
    } else {
      credit = amt;
      displayType = 'Payment Received';
      cust.totalPaidVal += amt;
    }

    cust.totalDebit += debit;
    cust.totalCredit += credit;
    cust.lastActivityTime = Math.max(cust.lastActivityTime, ts);
    cust.vouchers.push(pay);

    cust.ledgerEntries.push({
      id: `vch-${pay.id}`,
      sortTime: ts + 2,
      dateLabel: formatFullDate(pay.time, pay.createdAt),
      voucherNo: vNo,
      type: displayType,
      entryType,
      particulars: `${displayType}${refSuffix}${noteText}`,
      paymentMethod: pay.referenceNo ? `${pay.paymentMethod || 'Cash'} (${pay.referenceNo})` : pay.paymentMethod || 'Cash',
      debit,
      credit,
      isVoucher: true,
      raw: pay
    });
  });

  // Reconcile per-invoice paid/due with any unlinked On-Account credits
  const allocationMap = resolveAllocatedInvoiceMap({
    machineCustomers,
    machineSales,
    machineRepairs,
    customerPayments
  });

  // 5. Finalize chronological running balance for every customer
  return Array.from(customerMap.values())
    .map((cust) => {
      const sortedEntries = [...cust.ledgerEntries].sort((a, b) => a.sortTime - b.sortTime);
      let running = 0;
      const withRunning = sortedEntries.map((entry) => {
        running = running + (entry.debit || 0) - (entry.credit || 0);
        return { ...entry, runningBalance: running };
      });
      const signedBalance = cust.totalDebit - cust.totalCredit;

      const reconciledInvoices = (cust.invoices || []).map((inv) => {
        const key = `${inv.recordType === 'Repair' ? 'Repair' : 'Sale'}:${inv.id}`;
        const alloc = allocationMap.get(key);
        if (!alloc) return inv;
        return {
          ...inv,
          paidAmount: alloc.paidAmount,
          balanceAmount: alloc.balanceAmount,
          paymentStatus: alloc.paymentStatus,
          allocatedFromAccount: alloc.allocatedFromAccount
        };
      });

      return {
        ...cust,
        invoices: reconciledInvoices,
        ledgerEntries: withRunning,
        netBalance: signedBalance,
        balanceVal: Math.max(0, signedBalance)
      };
    })
    .sort((a, b) => b.balanceVal - a.balanceVal || b.totalDebit - a.totalDebit);
}
