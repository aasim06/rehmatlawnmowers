import { isRecordInDateRange } from 'utils/ledgerHelpers';
import { formatCleanVoucherNotes, formatFullDate, formatInvoiceNo, resolveRecordTimestamp } from 'utils/machineLedgerHelpers';

const cleanStoreItemName = (name) => String(name || 'Store Item').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim() || 'Store Item';

/**
 * Formats a concise document reference for Factory Store Stock In (GRN/Bilty) and Stock Out (ISS) rows.
 */
export function formatStoreDocNo(log) {
  if (!log) return 'ISS-0001';
  if (log.biltyNo) return `Bill #${log.biltyNo}`;
  const isIn = String(log.type || '').toUpperCase().includes('IN');
  const short = String(log.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || '0001';
  return `${isIn ? 'GRN' : 'ISS'}-${short}`;
}

/**
 * Normalizes Stock In vendor_payments rows into the unified Payment Voucher shape.
 */
export function normalizeVendorPaymentsAsVouchers(vendorPayments = []) {
  return (vendorPayments || []).map((vp) => ({
    id: vp.id,
    source: 'vendor_payment',
    voucherNo: vp.voucherNo || `VP-${String(vp.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase() || '1001'}`,
    entryType: 'Payout',
    referenceType: 'Purchase',
    invoiceId: vp.invoiceId || '',
    referenceLabel: vp.referenceNo || 'Vendor Shipment Payment',
    customerName: (vp.vendorName || 'Vendor').trim() || 'Vendor',
    amountPaid: Math.max(0, parseFloat(vp.amountPaid) || 0),
    paymentMethod: vp.paymentMethod || 'Cash',
    referenceNo: vp.referenceNo || '',
    items: Array.isArray(vp.items) ? vp.items : [],
    notes: vp.notes || '',
    time: vp.time || vp.paymentDate || '',
    createdAt: vp.createdAt || vp.dateISO || vp.time || ''
  }));
}

/**
 * Combines Factory Store receipts/payouts (`storePayments`) with vendor payouts (`vendorPayments`)
 * sorted newest-first so Cashbook & All Vouchers show complete incoming & outgoing cash flow.
 */
export function buildUnifiedStoreCashbook({ storePayments = [], vendorPayments = [] } = {}) {
  const normalizedStore = (storePayments || []).map((p) => ({
    ...p,
    source: p.source || 'store_payment',
    voucherNo: p.voucherNo || formatInvoiceNo(p)
  }));
  const normalizedVendor = normalizeVendorPaymentsAsVouchers(vendorPayments);

  return [...normalizedStore, ...normalizedVendor].sort((a, b) => resolveRecordTimestamp(b) - resolveRecordTimestamp(a));
}

/**
 * Builds combined directory suggestions across registered Store Parties, Vendors & Suppliers,
 * Stock In / Stock Out logs, and payment vouchers.
 */
export function getStorePartyDirectorySuggestions({
  storeCustomers = [],
  vendors = [],
  usageLogs = [],
  storePayments = [],
  vendorPayments = []
} = {}) {
  const map = new Map();

  const upsert = (rawName, rawPhone = '', rawCity = '', extra = {}) => {
    const name = (rawName || '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const cleanPhone = (rawPhone && rawPhone !== 'N/A' ? rawPhone : '').trim();
    const cleanCity = (rawCity && rawCity !== 'Local' ? rawCity : '').trim();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        key,
        id: extra.customerId || null,
        vendorId: extra.vendorId || null,
        name,
        phone: cleanPhone,
        city: cleanCity,
        partyType: extra.partyType || '',
        openingBalance: extra.openingBalance || 0,
        registered: Boolean(extra.registered)
      });
    } else {
      if (!existing.phone && cleanPhone) existing.phone = cleanPhone;
      if (!existing.city && cleanCity) existing.city = cleanCity;
      if (!existing.partyType && extra.partyType) existing.partyType = extra.partyType;
      if (extra.vendorId && !existing.vendorId) existing.vendorId = extra.vendorId;
      if (extra.customerId) {
        existing.id = extra.customerId;
        existing.openingBalance = extra.openingBalance || 0;
        existing.registered = true;
      }
    }
  };

  (storeCustomers || []).forEach((c) =>
    upsert(c.name, c.phone, c.city || c.address, { customerId: c.id, openingBalance: parseFloat(c.openingBalance) || 0, registered: true })
  );
  (vendors || []).forEach((v) =>
    upsert(v.name, v.phone, v.address, { vendorId: v.id, partyType: v.partyType || 'Supplier (Vendor)', registered: false })
  );
  (usageLogs || []).forEach((l) => {
    if (String(l.department || '').includes('BOM Production') && (parseFloat(l.lineTotal) || 0) <= 0) return;
    upsert(l.usedBy || l.customer, '', l.department);
  });
  (storePayments || []).forEach((p) => upsert(p.customerName));
  (vendorPayments || []).forEach((vp) => upsert(vp.vendorName));

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Computes comprehensive dual-direction A-to-Z Khata ledgers for Factory Store:
 * - Receivable / Lena (netBalance > 0): Stock Out issuances/sales + opening receivables + payouts - receipts
 * - Payable / Dena (netBalance < 0): Stock In vendor purchase bills + advance credits - vendor payouts
 * Zero double-counting across Stock In, Vendor Payables, Stock Out, Store Payments & Store Ledger.
 */
export function buildFactoryStoreLedgers({
  storeCustomers = [],
  vendors = [],
  usageLogs = [],
  storePayments = [],
  vendorPayments = [],
  startDate = '',
  endDate = ''
} = {}) {
  const partyMap = new Map();
  const unifiedVouchers = buildUnifiedStoreCashbook({ storePayments, vendorPayments });

  const vendorVoucherSet = new Set(
    (vendorPayments || []).map((vp) => (vp.vendorName || '').trim().toLowerCase()).filter(Boolean)
  );

  const ensureParty = (rawName, defaults = {}) => {
    const cleanName = (rawName || 'Store Counter').trim() || 'Store Counter';
    const key = cleanName.toLowerCase();
    if (!partyMap.has(key)) {
      partyMap.set(key, {
        key,
        customerId: defaults.customerId || null,
        vendorId: defaults.vendorId || null,
        customerName: cleanName,
        phone: (defaults.phone && defaults.phone !== 'N/A' ? defaults.phone : '').trim(),
        city: (defaults.city && defaults.city !== 'Local' ? defaults.city : '').trim(),
        partyType: defaults.partyType || '',
        notes: defaults.notes || '',
        registered: Boolean(defaults.registered),
        openingBalance: parseFloat(defaults.openingBalance) || 0,
        totalInvoicesCount: 0,
        totalRepairsCount: 0,
        totalMachinesCount: 0,
        totalSalesBilled: 0,
        totalPurchasesBilled: 0,
        totalCollected: 0,
        totalPaidOut: 0,
        totalPurchasesVal: 0,
        totalPaidVal: 0,
        totalDebit: 0,
        totalCredit: 0,
        balanceVal: 0,
        payableVal: 0,
        netBalance: 0,
        invoices: [],
        vouchers: [],
        ledgerEntries: [],
        lastActivityTime: 0
      });
    }

    const party = partyMap.get(key);
    if (defaults.customerId && !party.customerId) party.customerId = defaults.customerId;
    if (defaults.vendorId && !party.vendorId) party.vendorId = defaults.vendorId;
    if (defaults.registered) {
      party.registered = true;
      party.openingBalance = parseFloat(defaults.openingBalance) || 0;
      if (defaults.notes) party.notes = defaults.notes;
    }
    if (!party.partyType && defaults.partyType) party.partyType = defaults.partyType;
    if (!party.phone && defaults.phone && defaults.phone !== 'N/A') party.phone = defaults.phone.trim();
    if (!party.city && defaults.city && defaults.city !== 'Local') party.city = defaults.city.trim();
    return party;
  };

  // 1. Seed Registered Store Party Accounts & Opening Balances
  (storeCustomers || []).forEach((custDoc) => {
    const party = ensureParty(custDoc.name, {
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
      party.totalDebit += debit;
      party.totalCredit += credit;
      party.ledgerEntries.push({
        id: `opening-${custDoc.id}`,
        sortTime: ts - 1000,
        dateLabel: formatFullDate(null, custDoc.createdAt),
        voucherNo: 'OPENING',
        type: 'Opening Balance',
        particulars: openBal > 0 ? 'Opening Balance Receivable' : 'Opening Payable / Advance Credit',
        paymentMethod: 'Ledger',
        debit,
        credit,
        raw: custDoc
      });
    }
  });

  // 2. Seed Vendors & Suppliers Directory (merges metadata without adding zero-activity clutter?
  // Note: Only emit Vendor metadata if they are already in storeCustomers or have transactions, OR keep directory seeded cleanly)
  const vendorMetaMap = new Map();
  (vendors || []).forEach((v) => {
    const key = (v.name || '').trim().toLowerCase();
    if (key) vendorMetaMap.set(key, v);
  });

  // 3. Process Stock Out (Sales / Issuances -> Debit / Lena) and Stock In (Vendor Bills -> Credit / Dena)
  (usageLogs || []).forEach((log) => {
    if (!isRecordInDateRange(log, startDate, endDate)) return;

    const isIn = String(log.type || '').toUpperCase().includes('IN');
    const qty = Math.max(1, parseInt(log.qtyUsed, 10) || 1);
    const rate = Math.max(0, parseFloat(log.unitPrice) || 0);
    const billTotal =
      log.lineTotal !== undefined && !Number.isNaN(Number(log.lineTotal)) && Number(log.lineTotal) > 0
        ? parseFloat(log.lineTotal)
        : qty * rate;

    // Skip zero-rupee internal BOM assembly deductions so party Ledgers stay strictly financial
    if (!isIn && billTotal <= 0 && String(log.department || '').includes('BOM Production')) {
      return;
    }

    const partyName = (log.usedBy || log.vendor || log.customer || log.department || (isIn ? 'Direct Supplier' : 'Store Counter')).trim();
    const vMeta = vendorMetaMap.get(partyName.toLowerCase());
    const party = ensureParty(partyName, {
      vendorId: vMeta?.id,
      phone: vMeta?.phone,
      city: vMeta?.address,
      partyType: vMeta?.partyType || (isIn ? 'Supplier (Vendor)' : 'Customer / Party')
    });

    const ts = resolveRecordTimestamp(log);
    const docNo = formatStoreDocNo(log);
    const cleanName = cleanStoreItemName(log.itemName);
    const summaryLabel = qty > 1 ? `${cleanName} (x${qty})` : cleanName;
    const lineItemObj = {
      name: cleanName,
      subtitle: log.biltyNo ? `Bill #${log.biltyNo}` : log.category || '',
      qty,
      rate: qty > 0 ? billTotal / qty : rate,
      amount: billTotal
    };

    party.totalInvoicesCount += 1;
    party.totalMachinesCount += qty;
    party.lastActivityTime = Math.max(party.lastActivityTime, ts);

    if (isIn) {
      // Stock In Bill = We owe the vendor (Credit / Payable)
      party.totalPurchasesBilled += billTotal;
      party.totalCredit += billTotal;

      const linkedVouchers = unifiedVouchers.filter(
        (v) => v.invoiceId && String(v.invoiceId) === String(log.id) && v.entryType === 'Payout'
      );
      const linkedPaid = linkedVouchers.reduce((s, v) => s + (parseFloat(v.amountPaid) || 0), 0);
      const hasLegacyDirectPaid = !vendorVoucherSet.has(party.key) && (parseFloat(log.amountPaid) || 0) > 0;
      const directPaid = hasLegacyDirectPaid ? Math.max(0, parseFloat(log.amountPaid) || 0) : 0;
      const paidAmt = Math.max(directPaid, linkedPaid);
      const balanceAmt = Math.max(0, billTotal - paidAmt);

      party.invoices.push({
        ...log,
        id: log.id,
        recordType: 'Purchase',
        saleNo: docNo,
        customerName: party.customerName,
        customerPhone: party.phone,
        cityAddress: party.city || 'Supplier',
        machineName: summaryLabel,
        items: [lineItemObj],
        lineTotal: billTotal,
        paidAmount: paidAmt,
        balanceAmount: balanceAmt,
        paymentStatus: billTotal > 0 && balanceAmt <= 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Unpaid'
      });

      party.ledgerEntries.push({
        id: `in-${log.id}`,
        sortTime: ts,
        dateLabel: formatFullDate(log.time, log.dateISO),
        voucherNo: docNo,
        type: 'Stock In Purchase',
        particulars: `Purchased: ${summaryLabel}`,
        items: [lineItemObj],
        paymentMethod: log.biltyNo ? `Bill #${log.biltyNo}` : 'Supplier Bill',
        debit: 0,
        credit: billTotal,
        recordType: 'Purchase',
        raw: { ...log, customerName: party.customerName, items: [lineItemObj], lineTotal: billTotal }
      });

      // Synthesize legacy Stock In cash payout only if no vendor_payments voucher exists for this vendor
      const unlinkedDirectCash = Math.max(0, directPaid - linkedPaid);
      if (unlinkedDirectCash > 0) {
        party.totalDebit += unlinkedDirectCash;
        party.totalPaidOut += unlinkedDirectCash;
        party.ledgerEntries.push({
          id: `in-paid-${log.id}`,
          sortTime: ts + 1,
          dateLabel: formatFullDate(log.time, log.dateISO),
          voucherNo: docNo,
          type: 'Paid at Stock In',
          particulars: `Cash paid on delivery (${docNo})`,
          paymentMethod: log.paymentMethod || 'Cash',
          debit: unlinkedDirectCash,
          credit: 0,
          isAutoAdvance: true,
          raw: log
        });
      }
    } else {
      // Stock Out Issuance / Sale = Party owes Factory Store (Debit / Receivable)
      party.totalSalesBilled += billTotal;
      party.totalPurchasesVal += billTotal;
      party.totalDebit += billTotal;

      const linkedVouchers = unifiedVouchers.filter(
        (v) => v.invoiceId && String(v.invoiceId) === String(log.id) && v.entryType !== 'Payout'
      );
      const linkedCredits = linkedVouchers.reduce((s, v) => s + (parseFloat(v.amountPaid) || 0), 0);
      const directPaid = Math.max(0, parseFloat(log.amountPaid) || 0);
      const paidAmt = Math.max(directPaid, linkedCredits);
      const balanceAmt = Math.max(0, billTotal - paidAmt);

      party.invoices.push({
        ...log,
        id: log.id,
        recordType: 'Sale',
        saleNo: docNo,
        customerName: party.customerName,
        customerPhone: party.phone,
        cityAddress: party.city || log.department || 'Store Issuance',
        machineName: summaryLabel,
        items: [lineItemObj],
        lineTotal: billTotal,
        paidAmount: paidAmt,
        balanceAmount: balanceAmt,
        paymentStatus: billTotal > 0 && balanceAmt <= 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Unpaid'
      });

      party.ledgerEntries.push({
        id: `out-${log.id}`,
        sortTime: ts,
        dateLabel: formatFullDate(log.time, log.dateISO),
        voucherNo: docNo,
        type: 'Stock Out',
        particulars: `Issued / Sold: ${summaryLabel}`,
        items: [lineItemObj],
        paymentMethod: log.department || 'Store Issuance',
        debit: billTotal,
        credit: 0,
        recordType: 'Sale',
        raw: { ...log, customerName: party.customerName, items: [lineItemObj], lineTotal: billTotal }
      });

      const directCash = Math.max(0, directPaid - linkedCredits);
      if (directCash > 0) {
        party.totalCredit += directCash;
        party.totalPaidVal += directCash;
        party.totalCollected += directCash;
        party.ledgerEntries.push({
          id: `out-adv-${log.id}`,
          sortTime: ts + 1,
          dateLabel: formatFullDate(log.time, log.dateISO),
          voucherNo: docNo,
          type: 'Cash Collected',
          particulars: `Cash received on issuance (${docNo})`,
          paymentMethod: log.paymentMethod || 'Cash',
          debit: 0,
          credit: directCash,
          isAutoAdvance: true,
          raw: log
        });
      }
    }
  });

  // 4. Unified Store Receipts, Payouts, Vendor Payments & Adjustments
  unifiedVouchers.forEach((pay) => {
    if (!isRecordInDateRange(pay, startDate, endDate)) return;
    const vMeta = vendorMetaMap.get((pay.customerName || '').trim().toLowerCase());
    const party = ensureParty(pay.customerName, {
      vendorId: vMeta?.id,
      phone: vMeta?.phone,
      city: vMeta?.address,
      partyType: vMeta?.partyType || (pay.source === 'vendor_payment' ? 'Supplier (Vendor)' : '')
    });

    const amt = Math.max(0, parseFloat(pay.amountPaid) || 0);
    if (amt <= 0) return;

    const eType = pay.entryType || 'Receipt';
    const ts = resolveRecordTimestamp(pay);
    const vNo = formatInvoiceNo(pay);

    const refSuffix = pay.referenceLabel ? ` — Ref: ${pay.referenceLabel}` : ' — General Account';
    const cleanNote = formatCleanVoucherNotes(pay.notes);
    const noteText = cleanNote ? ` • ${cleanNote}` : '';

    let debit = 0;
    let credit = 0;
    let displayType = 'Payment Received';

    if (eType === 'Payout') {
      debit = amt;
      party.totalPaidOut += amt;
      displayType = pay.source === 'vendor_payment' ? 'Paid to Vendor' : 'Cash Paid / Payout';
    } else if (eType === 'Adjustment') {
      credit = amt;
      displayType = 'Discount / Adjustment';
    } else {
      credit = amt;
      party.totalPaidVal += amt;
      party.totalCollected += amt;
      displayType = 'Payment Received';
    }

    party.totalDebit += debit;
    party.totalCredit += credit;
    party.lastActivityTime = Math.max(party.lastActivityTime, ts);
    party.vouchers.push(pay);

    party.ledgerEntries.push({
      id: `vch-${pay.id}`,
      sortTime: ts + 2,
      dateLabel: formatFullDate(pay.time, pay.createdAt),
      voucherNo: vNo,
      type: displayType,
      entryType: eType,
      particulars: `${displayType}${refSuffix}${noteText}`,
      paymentMethod: pay.referenceNo ? `${pay.paymentMethod || 'Cash'} (${pay.referenceNo})` : pay.paymentMethod || 'Cash',
      debit,
      credit,
      isVoucher: true,
      raw: pay
    });
  });

  // 5. Reconcile FIFO Open Balances per Invoice + Chronological Running Balance
  return Array.from(partyMap.values())
    .map((party) => {
      const sortedEntries = [...party.ledgerEntries].sort((a, b) => a.sortTime - b.sortTime);
      let running = 0;
      const withRunning = sortedEntries.map((entry) => {
        running = running + (entry.debit || 0) - (entry.credit || 0);
        return { ...entry, runningBalance: running };
      });

      // FIFO allocation for unlinked Receipts on Sales (Stock Out) and unlinked Payouts on Purchases (Stock In)
      let unlinkedReceiptPool = party.openingBalance < 0 ? Math.abs(party.openingBalance) : 0;
      let unlinkedPayoutPool = 0;
      party.vouchers.forEach((v) => {
        if (v.invoiceId) return;
        const amt = Math.max(0, parseFloat(v.amountPaid) || 0);
        if (v.entryType === 'Payout') {
          unlinkedPayoutPool += amt;
        } else {
          unlinkedReceiptPool += amt;
        }
      });

      const reconciledInvoices = [...party.invoices]
        .sort((a, b) => resolveRecordTimestamp(a) - resolveRecordTimestamp(b))
        .map((inv) => {
          const remainingRaw = Math.max(0, inv.lineTotal - inv.paidAmount);
          if (inv.recordType === 'Purchase') {
            const alloc = remainingRaw > 0 && unlinkedPayoutPool > 0 ? Math.min(remainingRaw, unlinkedPayoutPool) : 0;
            unlinkedPayoutPool = Math.max(0, unlinkedPayoutPool - alloc);
            const effPaid = inv.paidAmount + alloc;
            const effBal = Math.max(0, inv.lineTotal - effPaid);
            return {
              ...inv,
              paidAmount: effPaid,
              balanceAmount: effBal,
              paymentStatus: inv.lineTotal > 0 && effBal <= 0 ? 'Paid' : effPaid > 0 ? 'Partial' : 'Unpaid'
            };
          }
          const alloc = remainingRaw > 0 && unlinkedReceiptPool > 0 ? Math.min(remainingRaw, unlinkedReceiptPool) : 0;
          unlinkedReceiptPool = Math.max(0, unlinkedReceiptPool - alloc);
          const effPaid = inv.paidAmount + alloc;
          const effBal = Math.max(0, inv.lineTotal - effPaid);
          return {
            ...inv,
            paidAmount: effPaid,
            balanceAmount: effBal,
            paymentStatus: inv.lineTotal > 0 && effBal <= 0 ? 'Paid' : effPaid > 0 ? 'Partial' : 'Unpaid'
          };
        })
        .sort((a, b) => resolveRecordTimestamp(b) - resolveRecordTimestamp(a));

      const signedBalance = party.totalDebit - party.totalCredit;
      return {
        ...party,
        invoices: reconciledInvoices,
        ledgerEntries: withRunning,
        netBalance: signedBalance,
        balanceVal: Math.max(0, signedBalance),
        payableVal: Math.max(0, -signedBalance)
      };
    })
    .sort((a, b) => b.balanceVal - a.balanceVal || b.payableVal - a.payableVal || b.totalDebit + b.totalCredit - (a.totalDebit + a.totalCredit));
}

/**
 * Computes top-level Factory Store Lena-Dena financial KPIs for Dashboards & Ledgers.
 */
export function summarizeFactoryStoreFinance(ledgers = [], unifiedCashbook = [], todayISO = '') {
  const totalSalesBilled = ledgers.reduce((s, p) => s + (p.totalSalesBilled || 0), 0);
  const totalPurchasesBilled = ledgers.reduce((s, p) => s + (p.totalPurchasesBilled || 0), 0);
  const totalCollected = ledgers.reduce((s, p) => s + (p.totalCollected || 0), 0);
  const totalPaidOut = ledgers.reduce((s, p) => s + (p.totalPaidOut || 0), 0);
  const totalReceivable = ledgers.reduce((s, p) => s + (p.balanceVal || 0), 0);
  const totalPayable = ledgers.reduce((s, p) => s + (p.payableVal || 0), 0);
  const receivableAccountsCount = ledgers.filter((p) => (p.balanceVal || 0) > 0).length;
  const payableAccountsCount = ledgers.filter((p) => (p.payableVal || 0) > 0).length;

  let collectedToday = 0;
  let paidOutToday = 0;
  if (todayISO) {
    (unifiedCashbook || []).forEach((v) => {
      if (!isRecordInDateRange({ createdAt: v.createdAt, dateISO: v.dateISO, time: v.time }, todayISO, todayISO)) return;
      const amt = parseFloat(v.amountPaid) || 0;
      if (v.entryType === 'Payout') paidOutToday += amt;
      else if (v.entryType !== 'Adjustment') collectedToday += amt;
    });
  }

  return {
    totalParties: ledgers.length,
    totalSalesBilled,
    totalPurchasesBilled,
    totalCollected,
    totalPaidOut,
    totalReceivable,
    totalPayable,
    receivableAccountsCount,
    payableAccountsCount,
    collectedToday,
    paidOutToday
  };
}
