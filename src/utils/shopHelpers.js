import {
  buildCustomerLedgers,
  formatItemsSummaryLabel,
  getCustomerDirectorySuggestions,
  resolveAllocatedInvoiceMap,
  resolveSaleFinancials
} from 'utils/machineLedgerHelpers';

/**
 * Shared pure helpers, image optimization, normalization, and accounting adapters
 * reused across the Retail Shop Mart module.
 */

export const SHOP_UNITS = ['PCS', 'Set', 'Unit', 'KG', 'Liter', 'Meter', 'Roll', 'Bottle'];

export const SHOP_PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Easypaisa / JazzCash', 'Credit'];

/**
 * Compresses an uploaded image file client-side into an optimized JPEG data URL.
 */
export function compressImageFile(file, maxWidth = 500, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Builds unique category suggestions dynamically from stored Shop categories & products.
 */
export function resolveShopCategories({ categories = [], items = [], includeAll = false } = {}) {
  const seen = new Set();
  const list = [];

  const pushCat = (raw) => {
    const clean = (typeof raw === 'string' ? raw : raw?.name || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    list.push(clean);
  };

  (categories || []).forEach(pushCat);
  (items || []).forEach((item) => pushCat(item?.category));

  if (list.length === 0) {
    list.push('General');
  }

  list.sort((a, b) => a.localeCompare(b));
  return includeAll ? ['All', ...list] : list;
}

/**
 * Builds customer/party autocomplete suggestions across shop customers, sales, vendors & payments.
 */
export function buildShopCustomerOptions({ shopCustomers = [], vendors = [], shopSales = [], shopCustomerPayments = [] } = {}) {
  const seen = new Set(['walk-in customer']);
  const names = [];

  const pushName = (raw) => {
    const clean = (raw || '').trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    names.push(clean);
  };

  (shopCustomers || []).forEach((c) => pushName(c?.name));
  (shopSales || []).forEach((s) => pushName(s?.customerName || s?.customer));
  (shopCustomerPayments || []).forEach((p) => pushName(p?.customerName));
  (vendors || []).forEach((v) => pushName(v?.name));

  return ['Walk-in Customer', ...names.sort((a, b) => a.localeCompare(b))];
}

/**
 * Calculates POS cart sub-total, discount amount, tax amount, grand total, and item count.
 */
export function computePosTotals({ cart = [], discountValue = '', discountType = 'flat', taxValue = '' } = {}) {
  const subTotal = (cart || []).reduce((sum, entry) => sum + entry.qty * (parseFloat(entry.item?.unitPrice) || 0), 0);
  const itemCount = (cart || []).reduce((sum, entry) => sum + entry.qty, 0);

  const rawDisc = parseFloat(discountValue) || 0;
  const discountAmount =
    discountType === 'percent'
      ? (subTotal * Math.min(100, Math.max(0, rawDisc))) / 100
      : Math.min(subTotal, Math.max(0, rawDisc));

  const taxAmount = Math.max(0, parseFloat(taxValue) || 0);
  const grandTotal = Math.max(0, subTotal - discountAmount + taxAmount);

  return { subTotal, discountAmount, taxAmount, grandTotal, itemCount };
}

/**
 * Normalizes a Retail Shop Mart sale/slip record into standard bill shape for unified
 * invoice & customer ledger reconciliation (supporting both legacy cash slips & partial-credit bills).
 */
export function normalizeShopSaleRecord(sale) {
  const totalBill = Math.max(
    0,
    parseFloat(sale?.totalAmount ?? sale?.grandTotal ?? sale?.lineTotal ?? sale?.subTotal) || 0
  );
  const pMethod = sale?.paymentMethod || 'Cash';
  const isCredit = String(pMethod).toLowerCase().includes('credit');
  const hasExplicitPaid = sale?.paidAmount !== undefined && sale?.paidAmount !== null && sale?.paidAmount !== '';
  const paidVal = hasExplicitPaid ? Math.max(0, parseFloat(sale.paidAmount) || 0) : isCredit ? 0 : totalBill;

  const rawItems = Array.isArray(sale?.items) && sale.items.length > 0 ? sale.items : Array.isArray(sale?.cart) ? sale.cart : [];
  const normalizedItems = rawItems.map((it) => {
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    const rate = Math.max(0, parseFloat(it.unitPrice ?? it.price ?? 0) || 0);
    const lineTotal = it.lineTotal !== undefined && !Number.isNaN(Number(it.lineTotal)) ? parseFloat(it.lineTotal) : qty * rate;
    return {
      ...it,
      machineName: it.name || it.itemName || 'Shop Item',
      name: it.name || it.itemName || 'Shop Item',
      qty,
      unitPrice: rate,
      lineTotal
    };
  });

  const itemSummaryLabel = formatItemsSummaryLabel(normalizedItems, 'Counter Sale');

  return {
    ...sale,
    id: sale?.id || sale?.invoiceNo || sale?.saleNo,
    saleNo: sale?.invoiceNo || sale?.saleNo || sale?.id,
    customerName: (sale?.customerName || sale?.customer || sale?.issuedTo || 'Walk-in Customer').trim() || 'Walk-in Customer',
    customerPhone: (sale?.customerPhone || sale?.phone || '').trim(),
    cityAddress: (sale?.cityAddress || sale?.department || 'Retail Counter').trim(),
    machineName: itemSummaryLabel,
    items: normalizedItems,
    subTotal: Math.max(0, parseFloat(sale?.subTotal) || totalBill),
    lineTotal: totalBill,
    paidAmount: paidVal,
    time: sale?.date || sale?.time || '',
    dateISO: sale?.dateISO || sale?.createdAt || ''
  };
}

/**
 * Reconciles Shop Invoices with direct vouchers & customer On-Account credits (FIFO).
 */
export function resolveShopAllocatedInvoiceMap({ shopCustomers = [], shopSales = [], shopCustomerPayments = [] } = {}) {
  const normalizedSales = (shopSales || []).map(normalizeShopSaleRecord);
  return resolveAllocatedInvoiceMap({
    machineCustomers: shopCustomers,
    machineSales: normalizedSales,
    machineRepairs: [],
    customerPayments: shopCustomerPayments
  });
}

/**
 * Computes financials for a single Shop Sale invoice (without on-account allocation).
 */
export function resolveShopSaleFinancials(sale, shopCustomerPayments = []) {
  return resolveSaleFinancials(normalizeShopSaleRecord(sale), shopCustomerPayments);
}

/**
 * Aggregates every Shop Customer's complete A-to-Z Khata (Invoices, Opening Balances,
 * Payment Receipts, Cash Refunds/Payouts, Adjustments & chronological running balance).
 */
export function buildShopCustomerLedgers({
  shopCustomers = [],
  shopSales = [],
  shopCustomerPayments = [],
  startDate = '',
  endDate = ''
} = {}) {
  const normalizedSales = (shopSales || []).map(normalizeShopSaleRecord);
  return buildCustomerLedgers({
    machineCustomers: shopCustomers,
    machineSales: normalizedSales,
    machineRepairs: [],
    customerPayments: shopCustomerPayments,
    startDate,
    endDate
  });
}

/**
 * Builds rich directory suggestions across registered Shop Customers, Sales, Payments & Vendors.
 */
export function getShopCustomerDirectorySuggestions({
  shopCustomers = [],
  shopSales = [],
  shopCustomerPayments = [],
  vendors = []
} = {}) {
  const normalizedSales = (shopSales || []).map(normalizeShopSaleRecord);
  const vendorAsCust = (vendors || []).map((v) => ({ name: v.name, phone: v.phone, city: v.address }));
  return getCustomerDirectorySuggestions({
    machineCustomers: [...(shopCustomers || []), ...vendorAsCust],
    machineSales: normalizedSales,
    machineRepairs: [],
    customerPayments: shopCustomerPayments
  });
}
