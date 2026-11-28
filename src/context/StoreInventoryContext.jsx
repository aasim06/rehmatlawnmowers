import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from 'context/AuthContext';
import { initialCategories, defaultMasterItemNames, defaultStoreItems } from 'data/factoryStoreData';
import { formatItemsSummaryLabel } from 'utils/machineLedgerHelpers';
import { db, CLOUD_SYNC_ENABLED, getDocs, setDoc, deleteDoc } from 'api/firebase';
import { collection, doc } from 'firebase/firestore';

// Modular Data Hooks
import {
  useExpensesModule,
  useRepairsModule,
  useVendorsModule,
  useAuditAndNotifications,
  useStoreFinanceModule
} from './modules';

export const StoreInventoryContext = createContext();

const safeParseJSON = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.error(`SafeJSON Error parsing ${key}:`, err);
    return fallback;
  }
};

const safeSetJSON = (key, value) => {
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        try {
          localStorage.setItem(key, serialized);
        } catch (e) {
          console.warn(`LocalStorage write warning for ${key}:`, e);
        }
      });
    } else {
      setTimeout(() => {
        try {
          localStorage.setItem(key, serialized);
        } catch (e) {
          console.warn(`LocalStorage write warning for ${key}:`, e);
        }
      }, 0);
    }
  } catch (err) {
    console.warn(`SafeSetJSON error for ${key}:`, err);
  }
};

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getNextCategoryId = (existingCategories = []) => {
  const nums = (existingCategories || [])
    .map((c) => {
      const idStr = String(c?.id || '');
      const match = idStr.match(/^CAT-(\d+)$/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `CAT-${max + 1}`;
};

const normalizeCategories = (cats = []) => {
  if (!Array.isArray(cats)) return [];
  let nextNum = 1;
  const existingNums = cats
    .map((c) => {
      const match = String(c?.id || '').match(/^CAT-(\d+)$/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  if (existingNums.length > 0) {
    nextNum = Math.max(...existingNums) + 1;
  }

  return cats.map((c) => {
    if (!c) return c;
    if (typeof c === 'string') {
      return { id: `CAT-${nextNum++}`, name: c, description: '' };
    }
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(c.id));
    if (!c.id || isUUID || !String(c.id).toUpperCase().startsWith('CAT-')) {
      return {
        ...c,
        id: `CAT-${nextNum++}`
      };
    }
    return c;
  });
};

export function StoreInventoryProvider({ children }) {
  const { user } = useAuth();

  // Clear old legacy demo cache on mount if present
  useEffect(() => {
    const legacyKeys = [
      'store_inventory_items',
      'store_usage_logs',
      'store_vendors',
      'store_machine_sales',
      'store_customer_payments',
      'store_vendor_payments'
    ];
    legacyKeys.forEach((key) => localStorage.removeItem(key));
  }, []);

  // 1. Inventory Items State (Clean Zero Start)
  const [items, setItems] = useState(() => safeParseJSON('rehmat_store_items_v2', []));

  // 2. Usage & Issue Logs State (Clean Zero Start)
  const [usageLogs, setUsageLogs] = useState(() => safeParseJSON('rehmat_store_usage_logs_v2', []));

  // Persistent Deleted Tracking Blacklists to prevent stale polling
  const [, setDeletedLogIds] = useState(() => safeParseJSON('rehmat_deleted_log_ids', []));
  const [, setDeletedItemIds] = useState(() => safeParseJSON('rehmat_deleted_item_ids', []));
  const [, setDeletedSaleIds] = useState(() => safeParseJSON('rehmat_deleted_sale_ids', []));
  const [, setDeletedCategoryIds] = useState(() => safeParseJSON('rehmat_deleted_category_ids', []));

  // 4. Categories State (Persistent Start with fallback to initialCategories only on uninitialized storage)
  const [categories, setCategories] = useState(() => {
    const rawCats = localStorage.getItem('rehmat_store_categories_v2');
    const saved = safeParseJSON('rehmat_store_categories_v2', null);
    const deletedCatList = safeParseJSON('rehmat_deleted_category_ids', []);
    const deletedCatSet = new Set(deletedCatList.map((x) => String(x).toLowerCase()));

    if (rawCats !== null && Array.isArray(saved)) {
      const clean = saved.filter((c) => !deletedCatSet.has(String(c.id).toLowerCase()) && !deletedCatSet.has(String(c.name || '').toLowerCase()));
      if (clean.length === 0) return [];
      const normalized = normalizeCategories(clean);
      safeSetJSON('rehmat_store_categories_v2', JSON.stringify(normalized));
      return normalized;
    }
    if (deletedCatList.length > 0) {
      return [];
    }
    return initialCategories;
  });

  // 7. Pre-saved Master Item Names List State
  const [masterItemNames, setMasterItemNames] = useState(() => {
    const saved = safeParseJSON('rehmat_store_master_item_names_v2', null);
    if (Array.isArray(saved) && saved.length > 0) return saved;
    return defaultMasterItemNames;
  });

  const initialMachineModels = [
    'Rehmat 20" Lawn Mower (Petrol Engine)',
    'Rehmat Electric Lawn Cutter 18"',
    'Rehmat Heavy Duty Lawn Mower 24"',
    'Rehmat Grass Trimmer & Cutter 2-Stroke',
    'Rehmat Hand Push Lawn Roller Mower'
  ];

  // 8. Customer Machine Sales State (Clean Zero Start)
  const [machineSales, setMachineSales] = useState(() => safeParseJSON('rehmat_store_machine_sales_v2', []));

  // 9. Master Machine Models Catalog State
  const [machineModels, setMachineModels] = useState(() => safeParseJSON('store_machine_models', initialMachineModels));

  // 10. Machine BOM Recipes State
  const [machineRecipes, setMachineRecipes] = useState(() => {
    const rawV2 = localStorage.getItem('rehmat_store_machine_recipes_v2');
    const parsed = safeParseJSON('rehmat_store_machine_recipes_v2', null) || safeParseJSON('store_machine_recipes', null);
    if (rawV2 !== null && Array.isArray(parsed)) {
      return parsed.filter(
        (r) =>
          !(r.modelName || '').toLowerCase().includes('emmami') &&
          r.id !== '__APP_SECURITY__' &&
          !r.modelName?.startsWith('__APP_')
      );
    }
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      // Filter out test entries like 'Emmami' and system security control records
      const clean = parsed.filter(
        (r) =>
          !(r.modelName || '').toLowerCase().includes('emmami') &&
          r.id !== '__APP_SECURITY__' &&
          !r.modelName?.startsWith('__APP_')
      );
      if (clean.length > 0) return clean;
    }
    return [
      {
        id: 'BOM-1',
        modelName: 'Rehmat 20" Lawn Mower (Petrol Engine)',
        description: 'Standard 20-Inch Heavy Duty Petrol Engine Lawn Mower Assembly Formula',
        ingredients: [
          { itemName: '3HP Electric Motor (3-Phase)', qty: 1, unit: 'pcs' },
          { itemName: 'SKF Ball Bearing 6205-2RS', qty: 2, unit: 'pcs' },
          { itemName: 'M8x50mm Stainless Steel Bolts', qty: 1, unit: 'boxes' }
        ]
      },
      {
        id: 'BOM-2',
        modelName: 'Rehmat Electric Lawn Cutter 18"',
        description: 'Compact 18-Inch Electric Cutter Assembly Formula',
        ingredients: [
          { itemName: '3HP Electric Motor (3-Phase)', qty: 1, unit: 'pcs' },
          { itemName: 'SKF Ball Bearing 6205-2RS', qty: 4, unit: 'pcs' },
          { itemName: 'M8x50mm Stainless Steel Bolts', qty: 2, unit: 'boxes' }
        ]
      }
    ];
  });

  // 11. Customer Payments & Machine Customer Directory State
  const [customerPayments, setCustomerPayments] = useState(() => safeParseJSON('rehmat_store_customer_payments_v2', []));
  const [machineCustomers, setMachineCustomers] = useState(() => safeParseJSON('rehmat_store_machine_customers_v1', []));

  // --- Modular Data Sub-systems (Expenses, Repairs, Vendors, Audit & Notifications) ---
  const {
    auditLogs,
    logActivity,
    deleteAuditLog,
    clearAuditLogs,
    syncAuditLogsFromCloud,
    notifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  } = useAuditAndNotifications();

  const {
    expenses,
    setExpenses,
    expenseFunds,
    setExpenseFunds,
    expenseCategories,
    setExpenseCategories,
    addExpense,
    deleteExpense,
    addExpenseFund,
    updateExpenseFund,
    deleteExpenseFund,
    addExpenseCategory,
    deleteExpenseCategory,
    syncExpensesFromCloud
  } = useExpensesModule({ logActivity });

  const {
    machineRepairs,
    setMachineRepairs,
    addMachineRepair,
    updateMachineRepair,
    deleteMachineRepair
  } = useRepairsModule();

  const {
    vendors,
    setVendors,
    vendorPayments,
    setVendorPayments,
    addVendor,
    updateVendor,
    deleteVendor,
    deleteMultipleVendors,
    addVendorPayment,
    deleteVendorPayment,
    syncVendorsFromCloud
  } = useVendorsModule();

  const updateLogRef = useRef(null);
  const {
    storeCustomers,
    setStoreCustomers,
    storePayments,
    setStorePayments,
    syncStoreFinanceFromCloud,
    addStoreCustomer,
    updateStoreCustomer,
    deleteStoreCustomer,
    addStorePayment,
    deleteStorePayment
  } = useStoreFinanceModule({
    usageLogs,
    updateLog: (...args) => updateLogRef.current?.(...args),
    vendorPayments,
    deleteVendorPayment
  });

  // Parallel Data Fetching via Firebase Firestore for zero-latency initial load & clean error handling
  const isFetchingRef = useRef(false);
  const fetchFirebaseData = async () => {
    if (!CLOUD_SYNC_ENABLED || isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return;
      }
      const activeUser = sessionStorage.getItem('rehmat_erp_active_user');
      if (!activeUser && !user) return;

      const deletedItemSet = new Set(safeParseJSON('rehmat_deleted_item_ids', []).map(String));
      const deletedLogSet = new Set(safeParseJSON('rehmat_deleted_log_ids', []).map(String));
      const deletedSaleSet = new Set(safeParseJSON('rehmat_deleted_sale_ids', []).map(String));
      const deletedRepairSet = new Set(safeParseJSON('rehmat_deleted_repair_ids', []).map(String));
      const deletedCustPaySet = new Set(safeParseJSON('rehmat_deleted_customer_payment_ids', []).map(String));
      const deletedMachineCustomerSet = new Set(safeParseJSON('rehmat_deleted_machine_customer_ids', []).map(String));
      const deletedCategorySet = new Set(safeParseJSON('rehmat_deleted_category_ids', []).map((x) => String(x).toLowerCase()));

      // Flush any offline pending customer payments to Firestore before fetching
      const pendingCustPayIds = safeParseJSON('rehmat_pending_customer_payment_ids', []).map(String);
      if (pendingCustPayIds.length > 0) {
        const localCustPays = safeParseJSON('rehmat_store_customer_payments_v2', []);
        await Promise.allSettled(
          pendingCustPayIds.map(async (id) => {
            const p = localCustPays.find((item) => String(item.id) === id);
            if (!p || deletedCustPaySet.has(id)) return;
            await setDoc(
              doc(db, 'customer_payments', id),
              {
                id: p.id,
                voucher_no: p.voucherNo,
                entry_type: p.entryType || 'Receipt',
                reference_type: p.referenceType || 'Account',
                invoice_id: p.invoiceId || '',
                repair_id: p.repairId || '',
                reference_label: p.referenceLabel || '',
                customer_name: p.customerName,
                payment_date: p.time,
                amount_paid: parseFloat(p.amountPaid) || 0,
                payment_method: p.paymentMethod || 'Cash',
                reference_no: p.referenceNo || '',
                notes: p.notes || '',
                created_at: p.createdAt
              },
              { merge: true }
            );
          })
        );
      }

      const [
        itemsSnap,
        logsSnap,
        salesSnap,
        catSnap,
        masterItemsSnap,
        custPaySnap,
        repairsSnap,
        recipesSnap,
        machineCustomersSnap
      ] = await Promise.allSettled([
        getDocs(collection(db, 'store_items')),
        getDocs(collection(db, 'usage_logs')),
        getDocs(collection(db, 'machine_sales')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'master_item_names')),
        getDocs(collection(db, 'customer_payments')),
        getDocs(collection(db, 'machine_repairs')),
        getDocs(collection(db, 'machine_recipes')),
        getDocs(collection(db, 'machine_customers'))
      ]);

      const toDocs = (res) => (res.status === 'fulfilled' && res.value?.docs ? res.value.docs.map((d) => ({ id: d.id, ...d.data() })) : []);
      const itemsList = toDocs(itemsSnap);
      const logsList = toDocs(logsSnap);
      const salesList = toDocs(salesSnap);
      const catList = toDocs(catSnap);
      const masterItemsList = toDocs(masterItemsSnap);
      const custPayList = toDocs(custPaySnap);
      const repairsList = toDocs(repairsSnap);
      const recipesList = toDocs(recipesSnap);
      const machineCustomersList = toDocs(machineCustomersSnap);

      if (itemsSnap.status === 'fulfilled') {
        const cleanItemsData = itemsList.filter(
          (i) => !deletedItemSet.has(String(i.id)) && !deletedItemSet.has(String(i.sku_code || i.item_code || i.itemCode))
        );
        cleanItemsData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        const mappedItems = cleanItemsData.map((i) => ({
          id: i.id,
          name: i.name,
          specification: i.specification || '',
          itemCode: i.sku_code || i.item_code || i.itemCode || i.id,
          category: i.category || 'General',
          unit: i.unit || 'PCS',
          totalStock: parseFloat(i.current_stock || i.total_stock || i.totalStock) || 0,
          usedToday: parseFloat(i.used_today || i.usedToday) || 0,
          remainingStock: parseFloat(i.remaining_stock !== undefined ? i.remaining_stock : i.remainingStock) || 0,
          unitPrice: parseFloat(i.unit_price !== undefined ? i.unit_price : i.unitPrice) || 0,
          minLevel: parseFloat(i.min_threshold || i.min_level || i.minLevel) || 10,
          rackLocation: i.location || i.rack_location || i.rackLocation || 'Main Store',
          status: parseFloat(i.remaining_stock !== undefined ? i.remaining_stock : i.remainingStock) <= 0 ? 2 : parseFloat(i.remaining_stock !== undefined ? i.remaining_stock : i.remainingStock) <= (parseFloat(i.min_threshold || i.min_level || i.minLevel) || 10) ? 0 : 1
        }));
        if (mappedItems.length > 0 || !itemsSnap.value.metadata?.fromCache) {
          setItems(mappedItems);
          safeSetJSON('rehmat_store_items_v2', JSON.stringify(mappedItems));
        }
      }

      if (logsSnap.status === 'fulfilled') {
        const cleanLogsData = logsList.filter(
          (l) => !deletedLogSet.has(String(l.id))
        );
        cleanLogsData.sort((a, b) => new Date(b.created_at || b.date_iso || b.dateISO || 0) - new Date(a.created_at || a.date_iso || a.dateISO || 0));

        // Preserve currently held logs in memory or localStorage to protect exact timestamps
        const localLogs = safeParseJSON('rehmat_store_usage_logs_v2', []);
        const localLogMap = new Map();
        localLogs.forEach((el) => {
          if (el.id && el.time) localLogMap.set(String(el.id), el);
        });

        const mappedLogs = cleanLogsData.map((l) => {
          const localItem = localLogMap.get(String(l.id));
          const isoTimestamp = l.created_at || l.date_iso || l.dateISO || localItem?.dateISO;

          let resolvedTime = l.time || localItem?.time;
          if (!resolvedTime) {
            if (isoTimestamp && !isoTimestamp.endsWith('T00:00:00.000Z')) {
              resolvedTime = new Date(isoTimestamp).toLocaleString();
            } else if (isoTimestamp) {
              resolvedTime = new Date(isoTimestamp).toLocaleDateString();
            } else {
              resolvedTime = new Date().toLocaleString();
            }
          }

          return {
            id: l.id,
            type: l.type || localItem?.type || 'Stock Out',
            itemCode: l.item_code || l.itemCode || localItem?.itemCode || 'N/A',
            itemName: l.item_name || l.itemName || localItem?.itemName || 'Item',
            category: l.category || localItem?.category || 'General',
            qtyUsed: parseFloat(l.qty_used !== undefined ? l.qty_used : (l.qtyUsed !== undefined ? l.qtyUsed : localItem?.qtyUsed)) || 1,
            unitPrice: parseFloat(l.unit_price !== undefined ? l.unit_price : (l.unitPrice !== undefined ? l.unitPrice : localItem?.unitPrice)) || 0,
            discountAmount: parseFloat(l.discount_amount !== undefined ? l.discount_amount : (l.discountAmount !== undefined ? l.discountAmount : localItem?.discountAmount)) || 0,
            lineTotal: parseFloat(l.line_total !== undefined ? l.line_total : (l.lineTotal !== undefined ? l.lineTotal : localItem?.lineTotal)) || 0,
            usedBy: (l.used_by || l.usedBy || localItem?.usedBy || 'Store').trim(),
            department: l.department || localItem?.department || 'Store',
            issuedBy: l.issued_by || l.issuedBy || localItem?.issuedBy || 'Store Manager',
            time: resolvedTime,
            dateISO: isoTimestamp || new Date().toISOString(),
            biltyNo: l.bilty_no || l.biltyNo || localItem?.biltyNo || '',
            amountPaid: parseFloat(l.amount_paid !== undefined ? l.amount_paid : (l.amountPaid !== undefined ? l.amountPaid : localItem?.amountPaid)) || 0,
            remainingBalance: parseFloat(l.remaining_balance !== undefined ? l.remaining_balance : (l.remainingBalance !== undefined ? l.remainingBalance : localItem?.remainingBalance)) || 0,
            paymentMethod: l.payment_method || l.paymentMethod || localItem?.paymentMethod || 'Cash',
            remainingStockAfter: l.remaining_stock_after !== undefined ? l.remaining_stock_after : (l.remainingStockAfter !== undefined ? l.remainingStockAfter : (localItem?.remainingStockAfter !== undefined ? localItem.remainingStockAfter : null)),
            notes: l.notes || localItem?.notes || ''
          };
        });
        if (mappedLogs.length > 0 || !logsSnap.value.metadata?.fromCache) {
          setUsageLogs(mappedLogs);
          safeSetJSON('rehmat_store_usage_logs_v2', JSON.stringify(mappedLogs));
        }
      }

      if (salesSnap.status === 'fulfilled') {
        const cleanSalesData = salesList.filter(
          (s) => !deletedSaleSet.has(String(s.id))
        );
        cleanSalesData.sort((a, b) => new Date(b.created_at || b.dateISO || 0) - new Date(a.created_at || a.dateISO || 0));
        const mappedSales = cleanSalesData.map((s) => {
          const rawSaleNo = s.sale_no || s.saleNo;
          const cleanSaleNo = (rawSaleNo && !rawSaleNo.includes('-') && rawSaleNo.length < 15) || (rawSaleNo && rawSaleNo.startsWith('MS-') && rawSaleNo.length < 15)
            ? rawSaleNo
            : `MS-${String(s.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}`;

          return {
            id: s.id,
            saleNo: cleanSaleNo,
            customerName: s.customer_name || s.customerName,
            customerPhone: s.customer_phone || s.customerPhone || 'N/A',
            cityAddress: s.city_address || s.cityAddress || 'Lahore',
            machineName: s.machine_name || s.machineName,
            serialNo: s.serial_no || s.serialNo,
            qty: parseFloat(s.qty) || 1,
            unitPrice: parseFloat(s.unit_price !== undefined ? s.unit_price : s.unitPrice) || 0,
            discountAmount: parseFloat(s.discount_amount !== undefined ? s.discount_amount : s.discountAmount) || 0,
            lineTotal: parseFloat(s.line_total !== undefined ? s.line_total : s.lineTotal) || 0,
            paidAmount: parseFloat(s.paid_amount !== undefined ? s.paid_amount : s.paidAmount) || 0,
            balanceAmount: Math.max(0, (parseFloat(s.line_total !== undefined ? s.line_total : s.lineTotal) || 0) - (parseFloat(s.paid_amount !== undefined ? s.paid_amount : s.paidAmount) || 0)),
            paymentStatus: (parseFloat(s.paid_amount !== undefined ? s.paid_amount : s.paidAmount) || 0) >= (parseFloat(s.line_total !== undefined ? s.line_total : s.lineTotal) || 0) && (parseFloat(s.line_total !== undefined ? s.line_total : s.lineTotal) || 0) > 0
              ? 'Paid'
              : (parseFloat(s.paid_amount !== undefined ? s.paid_amount : s.paidAmount) || 0) > 0
                ? 'Partial'
                : (s.payment_status || s.paymentStatus || 'Unpaid'),
            time: s.time || (s.created_at ? new Date(s.created_at).toLocaleString() : new Date().toLocaleString()),
            items: s.items || []
          };
        });
        if (mappedSales.length > 0 || !salesSnap.value.metadata?.fromCache) {
          setMachineSales(mappedSales);
          safeSetJSON('rehmat_store_machine_sales_v2', JSON.stringify(mappedSales));
        }
      }

      if (catSnap.status === 'fulfilled') {
        const cleanCatData = catList.filter(
          (c) => !deletedCategorySet.has(String(c.id).toLowerCase()) && !deletedCategorySet.has(String(c.name || '').toLowerCase())
        );
        cleanCatData.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        const mappedCats = cleanCatData.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || ''
        }));
        if (mappedCats.length > 0 || !catSnap.value.metadata?.fromCache) {
          setCategories(mappedCats);
          safeSetJSON('rehmat_store_categories_v2', JSON.stringify(mappedCats));
        }
      }

      if (masterItemsSnap.status === 'fulfilled') {
        const cleanMasterItems = (masterItemsList || []).map((m) => ({
          id: m.id,
          name: m.name,
          category: m.category || 'General',
          defaultUnit: m.default_unit || m.defaultUnit || 'PCS',
          skuCode: m.sku_code || m.skuCode || '',
          unitPrice: parseFloat(m.unit_price !== undefined ? m.unit_price : m.unitPrice) || 0
        }));
        if (cleanMasterItems.length > 0) {
          setMasterItemNames(cleanMasterItems);
          safeSetJSON('rehmat_store_master_item_names_v2', JSON.stringify(cleanMasterItems));
        } else {
          // If Firestore is empty (e.g. after factory reset), keep local or fall back to defaultMasterItemNames
          const existing = safeParseJSON('rehmat_store_master_item_names_v2', null);
          const toSet = Array.isArray(existing) && existing.length > 0 ? existing : defaultMasterItemNames;
          setMasterItemNames(toSet);
          safeSetJSON('rehmat_store_master_item_names_v2', JSON.stringify(toSet));
        }
      }

      if (custPaySnap.status === 'fulfilled') {
        const cleanCustPay = custPayList.filter((p) => !deletedCustPaySet.has(String(p.id)));
        cleanCustPay.sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        const mappedCustPay = cleanCustPay.map((p) => ({
          id: p.id,
          voucherNo: p.voucher_no || p.voucherNo || `PAY-${String(p.id).replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}`,
          invoiceId: p.invoice_id || p.invoiceId || '',
          repairId: p.repair_id || p.repairId || '',
          referenceType: p.reference_type || p.referenceType || (p.repair_id || p.repairId ? 'Repair' : p.invoice_id || p.invoiceId ? 'Sale' : 'Account'),
          referenceLabel: p.reference_label || p.referenceLabel || '',
          entryType: p.entry_type || p.entryType || 'Receipt',
          customerName: p.customer_name || p.customerName,
          amountPaid: parseFloat(p.amount_paid !== undefined ? p.amount_paid : p.amountPaid) || 0,
          paymentMethod: p.payment_method || p.paymentMethod || 'Cash',
          referenceNo: p.reference_no || p.referenceNo || '',
          notes: p.notes || '',
          time: p.payment_date || p.time || (p.created_at ? new Date(p.created_at).toLocaleString() : new Date().toLocaleString()),
          createdAt: p.created_at || p.createdAt
        }));

        // Preserve any locally created vouchers whose Firestore sync is still in flight
        const remoteIdSet = new Set(mappedCustPay.map((p) => String(p.id)));
        const pendingIds = safeParseJSON('rehmat_pending_customer_payment_ids', []).map(String);
        const stillPendingIds = pendingIds.filter((id) => !remoteIdSet.has(id) && !deletedCustPaySet.has(id));
        if (stillPendingIds.length !== pendingIds.length) {
          safeSetJSON('rehmat_pending_customer_payment_ids', JSON.stringify(stillPendingIds));
        }

        const localCustPay = safeParseJSON('rehmat_store_customer_payments_v2', []);
        const pendingSet = new Set(stillPendingIds);
        const unsyncedLocal = localCustPay.filter((p) => pendingSet.has(String(p.id)) && !remoteIdSet.has(String(p.id)));
        const mergedCustPay = [...unsyncedLocal, ...mappedCustPay];

        if (mergedCustPay.length > 0 || !custPaySnap.value.metadata?.fromCache) {
          setCustomerPayments(mergedCustPay);
          safeSetJSON('rehmat_store_customer_payments_v2', JSON.stringify(mergedCustPay));
        }
      }

      if (machineCustomersSnap.status === 'fulfilled') {
        const cleanCustDir = machineCustomersList.filter((c) => !deletedMachineCustomerSet.has(String(c.id)));
        cleanCustDir.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        const mappedCustDir = cleanCustDir.map((c) => ({
          id: c.id,
          name: (c.name || '').trim(),
          phone: c.phone || '',
          city: c.city || c.city_address || '',
          address: c.address || c.city_address || '',
          openingBalance: parseFloat(c.opening_balance !== undefined ? c.opening_balance : c.openingBalance) || 0,
          notes: c.notes || '',
          createdAt: c.created_at || c.createdAt || ''
        }));
        if (mappedCustDir.length > 0 || !machineCustomersSnap.value.metadata?.fromCache) {
          setMachineCustomers(mappedCustDir);
          safeSetJSON('rehmat_store_machine_customers_v1', JSON.stringify(mappedCustDir));
        }
      }

      if (repairsSnap.status === 'fulfilled') {
        const cleanRepairs = repairsList.filter((r) => !deletedRepairSet.has(String(r.id)));
        cleanRepairs.sort((a, b) => new Date(b.created_at || b.dateISO || 0) - new Date(a.created_at || a.dateISO || 0));
        const mappedRepairs = cleanRepairs.map((r) => {
          const partsCost = Math.max(0, parseFloat(r.parts_cost !== undefined ? r.parts_cost : r.partsCost) || 0);
          const laborCost = Math.max(0, parseFloat(r.labor_cost !== undefined ? r.labor_cost : r.laborCost) || 0);
          const discountAmount = Math.max(0, parseFloat(r.discount_amount !== undefined ? r.discount_amount : r.discountAmount) || 0);
          const grossCost = partsCost + laborCost;
          const rawTotal = parseFloat(r.total_cost !== undefined ? r.total_cost : r.totalCost);
          const totalCost =
            !Number.isNaN(rawTotal) && !(grossCost > 0 && discountAmount > 0 && Math.abs(rawTotal - grossCost) < 0.01)
              ? Math.max(0, rawTotal)
              : Math.max(0, grossCost - discountAmount);
          const paidAmount = Math.max(0, parseFloat(r.paid_amount !== undefined ? r.paid_amount : r.paidAmount) || 0);
          const balanceAmount = Math.max(0, totalCost - paidAmount);

          return {
            id: r.id,
            repairNo: r.repair_no || r.repairNo || `REP-${String(r.id).slice(0, 4)}`,
            customerName: r.customer_name || r.customerName,
            customerPhone: r.customer_phone || r.customerPhone || 'N/A',
            cityAddress: r.city_address || r.cityAddress || 'Lahore',
            machineName: r.machine_name || r.machineName,
            serialNo: r.serial_no || r.serialNo || 'N/A',
            faultDescription: r.fault_description || r.faultDescription || 'General Service',
            partsCost,
            laborCost,
            discountAmount,
            totalCost,
            paidAmount,
            balanceAmount,
            repairStatus: r.repair_status || r.repairStatus || 'Received',
            paymentStatus: totalCost > 0 && balanceAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending',
            receivedDate: r.received_date || r.receivedDate || (r.created_at ? new Date(r.created_at).toLocaleDateString() : new Date().toLocaleDateString()),
            promisedDate: r.promised_date || r.promisedDate || '1-2 Days',
            deliveredDate: r.delivered_date || r.deliveredDate || '',
            technicianNotes: r.technician_notes || r.technicianNotes || '',
            dateISO: r.created_at || r.dateISO || '',
            repairItems: r.repair_items || r.repairItems || []
          };
        });
        if (mappedRepairs.length > 0 || !repairsSnap.value.metadata?.fromCache) {
          setMachineRepairs(mappedRepairs);
          safeSetJSON('rehmat_store_machine_repairs_v1', JSON.stringify(mappedRepairs));
        }
      }

      if (recipesSnap.status === 'fulfilled') {
        const cleanRecipeData = recipesList.filter(
          (r) => r.id !== '__APP_SECURITY__' && !r.model_name?.startsWith('__APP_')
        );
        const mappedRecipes = cleanRecipeData.map((r) => ({
          id: r.id,
          modelName: r.model_name || r.modelName,
          description: r.description || '',
          ingredients: r.ingredients || []
        }));
        if (mappedRecipes.length > 0 || !recipesSnap.value.metadata?.fromCache) {
          setMachineRecipes(mappedRecipes);
          safeSetJSON('rehmat_store_machine_recipes_v2', JSON.stringify(mappedRecipes));
        }
      }

      await Promise.allSettled([
        syncStoreFinanceFromCloud(),
        syncVendorsFromCloud(),
        syncExpensesFromCloud(),
        syncAuditLogsFromCloud()
      ]);
    } catch {
      // Cloud fetch notification
    } finally {
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!user || !CLOUD_SYNC_ENABLED) return;

    fetchFirebaseData();

    // Refetch on window focus for prompt multi-device sync (throttled to 5s)
    let lastFocusFetch = Date.now();
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusFetch > 5000) {
        lastFocusFetch = now;
        fetchFirebaseData();
      }
    };
    const handleOnline = () => {
      fetchFirebaseData();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    // Periodic cloud poll every 30 seconds
    const interval = setInterval(fetchFirebaseData, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, [user]);

  // ==============================|| ACTIONS ||============================== //

  // Master Item Names Actions
  const addMasterItemName = async (nameData) => {
    const itemObj = typeof nameData === 'string' ? { name: nameData } : nameData;
    const newName = itemObj.name;
    const skuCode = itemObj.skuCode || `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const unitPrice = parseFloat(itemObj.unitPrice) || 0;
    const category = itemObj.category || 'General';
    const defaultUnit = itemObj.defaultUnit || 'PCS';
    const initialStock = parseInt(itemObj.initialStock) || 0;
    const minThreshold = parseInt(itemObj.minThreshold || itemObj.minLevel) || 10;

    const newMaster = {
      id: `MST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newName,
      skuCode,
      unitPrice,
      category,
      defaultUnit,
      initialStock,
      minThreshold
    };

    setMasterItemNames((prev) => [newMaster, ...prev]);

    try {
      await setDoc(doc(db, 'master_item_names', String(newMaster.id)), {
        id: newMaster.id,
        name: newName,
        category,
        default_unit: defaultUnit,
        created_at: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const updateMasterItemName = async (id, updatedData) => {
    setMasterItemNames((prev) => prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m)));

    try {
      await setDoc(doc(db, 'master_item_names', String(id)), {
        name: updatedData.name,
        category: updatedData.category,
        default_unit: updatedData.defaultUnit,
        updated_at: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMasterItemName = async (id) => {
    setMasterItemNames((prev) => prev.filter((m) => m.id !== id));

    try {
      await deleteDoc(doc(db, 'master_item_names', String(id)));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMultipleMasterItemNames = async (ids) => {
    const idsSet = new Set(ids);
    setMasterItemNames((prev) => prev.filter((m) => !idsSet.has(m.id)));

    try {
      await Promise.allSettled(ids.map((id) => deleteDoc(doc(db, 'master_item_names', String(id)))));
    } catch (e) {
      console.error(e);
    }
  };

  const restoreDefaultMasterItemNames = async () => {
    setMasterItemNames(defaultMasterItemNames);
    safeSetJSON('rehmat_store_master_item_names_v2', JSON.stringify(defaultMasterItemNames));
    safeSetJSON('rehmat_shop_master_item_names_v2', JSON.stringify(defaultMasterItemNames));
    try {
      for (const m of defaultMasterItemNames) {
        await setDoc(
          doc(db, 'master_item_names', String(m.id)),
          {
            id: m.id,
            name: m.name,
            category: m.category,
            sku_code: m.skuCode,
            unit_price: m.unitPrice,
            default_unit: m.defaultUnit,
            created_at: new Date().toISOString()
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Firebase master items sync warning:', e);
    }
    return { success: true, count: defaultMasterItemNames.length };
  };

  const restoreDefaultStoreItems = async () => {
    setItems(defaultStoreItems);
    safeSetJSON('rehmat_store_items_v2', JSON.stringify(defaultStoreItems));
    try {
      for (const it of defaultStoreItems) {
        await setDoc(doc(db, 'store_items', String(it.id)), it, { merge: true });
      }
    } catch (e) {
      console.warn('Firebase store items sync warning:', e);
    }
    return { success: true, count: defaultStoreItems.length };
  };

  // 1. Issue Stock / Daily Usage Action
  const issueStock = async (itemIdOrObj, qtyUsedParam, usedByParam, departmentParam = 'Production Line', issuedByParam = 'Store Keeper', notesParam = '', unitPriceParam = 0, categoryParam = 'General') => {
    let itemId = itemIdOrObj;
    let qtyUsed = qtyUsedParam;
    let usedBy = usedByParam;
    let department = departmentParam;
    let issuedBy = issuedByParam;
    let notes = notesParam;
    let unitPrice = unitPriceParam;
    let category = categoryParam;

    if (typeof itemIdOrObj === 'object' && itemIdOrObj !== null) {
      itemId = itemIdOrObj.itemId || itemIdOrObj.itemName || itemIdOrObj.itemCode;
      qtyUsed = itemIdOrObj.qtyUsed;
      usedBy = itemIdOrObj.usedBy;
      department = itemIdOrObj.department || 'Production Line';
      issuedBy = itemIdOrObj.issuedBy || 'Store Keeper';
      notes = itemIdOrObj.notes || '';
      unitPrice = itemIdOrObj.unitPrice || 0;
      category = itemIdOrObj.category || 'General';
    }

    const targetItem = items.find(
      (i) =>
        i.id === itemId ||
        i.itemCode === itemId ||
        (i.name || '').toLowerCase() === (itemId || '').toLowerCase()
    );
    if (!targetItem) return false;

    const actualQty = Math.abs(parseInt(qtyUsed) || 1);
    const price = parseFloat(unitPrice) > 0 ? parseFloat(unitPrice) : (targetItem.unitPrice || 0);
    const lineTotal = actualQty * price;
    const newRemainingStock = Math.max(0, targetItem.remainingStock - actualQty);
    const newUsedToday = targetItem.usedToday + actualQty;
    const isLowStock = newRemainingStock <= targetItem.minLevel;

    // Update Item State
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === targetItem.id) {
          return {
            ...item,
            usedToday: newUsedToday,
            remainingStock: newRemainingStock,
            status: newRemainingStock === 0 ? 2 : isLowStock ? 0 : 1
          };
        }
        return item;
      })
    );

    // Record Usage Log Entry
    const now = new Date();
    const logId = generateUUID();
    const dateISO = now.toISOString();
    const formattedTime = now.toLocaleString();

    const newLog = {
      id: logId,
      itemCode: targetItem.itemCode,
      itemName: targetItem.name,
      category: category || targetItem.category || 'General',
      qtyUsed: actualQty,
      unitPrice: price,
      lineTotal: lineTotal,
      usedBy,
      department,
      issuedBy,
      time: formattedTime,
      dateISO: dateISO,
      created_at: dateISO,
      type: 'OUT (Daily Usage)',
      remainingStockAfter: newRemainingStock,
      status: 1,
      notes
    };

    setUsageLogs((prev) => [newLog, ...prev]);
    logActivity('Stock Out', `Issued ${actualQty}x ${targetItem.name} to ${usedBy}`);

    try {
      await setDoc(doc(db, 'store_items', String(targetItem.id)), {
        used_today: newUsedToday,
        remaining_stock: newRemainingStock,
        unit_price: price > 0 ? price : targetItem.unitPrice
      }, { merge: true });

      await setDoc(doc(db, 'usage_logs', String(logId)), {
        id: logId,
        type: 'Stock Out',
        item_code: targetItem.itemCode || 'N/A',
        item_name: targetItem.name || 'Item',
        qty_used: actualQty,
        unit_price: price,
        line_total: lineTotal,
        used_by: usedBy,
        department: department || 'Production',
        issued_by: issuedBy || 'Store Keeper',
        date_iso: dateISO,
        created_at: dateISO,
        time: formattedTime,
        remaining_stock_after: newRemainingStock,
        status: 1,
        notes: notes || ''
      }, { merge: true });
      fetchFirebaseData();
    } catch (e) {
      console.error('Firebase issueStock error:', e);
    }

    return true;
  };

  // 2. Receive Stock / Store IN Action
  const receiveStock = async (itemIdOrObj, qtyReceivedParam, supplierNameParam = 'Vendor Shipment', refNoParam = '', unitPriceParam = 0, categoryParam = 'General', imageUrlParam = '', extraData = {}) => {
    let targetItem = null;
    let itemId = itemIdOrObj;
    let qtyReceived = qtyReceivedParam;
    let supplierName = supplierNameParam || 'Vendor Shipment';
    let refNo = refNoParam || 'PO-' + Math.floor(1000 + Math.random() * 9000);
    let unitPrice = unitPriceParam;

    if (typeof itemIdOrObj === 'object' && itemIdOrObj !== null) {
      targetItem = itemIdOrObj;
      itemId = targetItem.id || targetItem.itemCode || targetItem.name;
    } else {
      targetItem = items.find(
        (i) =>
          i.id === itemId ||
          i.itemCode === itemId ||
          (i.name || '').toLowerCase() === (itemId || '').toLowerCase()
      );
    }

    if (!targetItem) {
      targetItem = {
        id: generateUUID(),
        itemCode: typeof itemId === 'string' ? itemId : `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
        name: typeof itemId === 'string' ? itemId : 'Item',
        totalStock: 0,
        remainingStock: 0,
        minLevel: 10,
        unitPrice: parseFloat(unitPrice) || 0
      };
    }

    const actualQty = Math.abs(parseInt(qtyReceived) || 1);
    const price = parseFloat(unitPrice) > 0 ? parseFloat(unitPrice) : (targetItem.unitPrice || 0);
    const lineTotal = actualQty * price;
    const newTotalStock = (targetItem.totalStock || 0) + actualQty;
    const newRemainingStock = (targetItem.remainingStock || 0) + actualQty;
    const isLowStock = newRemainingStock <= (targetItem.minLevel || 10);

    setItems((prev) => {
      const exists = prev.some((i) => i.id === targetItem.id);
      if (exists) {
        return prev.map((item) => {
          if (item.id === targetItem.id) {
            return {
              ...item,
              totalStock: newTotalStock,
              remainingStock: newRemainingStock,
              unitPrice: price > 0 ? price : item.unitPrice,
              status: isLowStock ? 0 : 1
            };
          }
          return item;
        });
      }
      return [{
        ...targetItem,
        totalStock: newTotalStock,
        remainingStock: newRemainingStock,
        unitPrice: price > 0 ? price : targetItem.unitPrice,
        status: isLowStock ? 0 : 1
      }, ...prev];
    });

    const now = new Date();
    const logId = generateUUID();
    const paidVal = parseFloat(extraData?.amountPaid) || 0;
    const balanceVal = extraData?.remainingBalance !== undefined ? parseFloat(extraData?.remainingBalance) : Math.max(0, lineTotal - paidVal);

    // Compute exact timestamp down to the second
    let logDate = new Date();
    if (extraData?.receivedDate) {
      const parts = extraData.receivedDate.split('-');
      if (parts.length === 3) {
        const yr = parseInt(parts[0], 10);
        const mo = parseInt(parts[1], 10) - 1;
        const da = parseInt(parts[2], 10);
        logDate = new Date(yr, mo, da, now.getHours(), now.getMinutes(), now.getSeconds());
      }
    }
    const dateISO = logDate.toISOString();
    const formattedTime = logDate.toLocaleString(); // e.g. "11/5/2026, 9:05:36 PM"

    const newLog = {
      id: logId,
      itemCode: targetItem.itemCode || 'N/A',
      itemName: targetItem.name || 'Item',
      category: targetItem.category || categoryParam || 'General',
      qtyUsed: actualQty,
      unitPrice: price,
      lineTotal: lineTotal,
      usedBy: supplierName,
      department: 'Store Inward',
      issuedBy: 'Store Manager',
      time: formattedTime,
      dateISO: dateISO,
      created_at: dateISO,
      type: 'IN (Shipment Received)',
      remainingStockAfter: newRemainingStock,
      status: 1,
      notes: extraData?.biltyNo ? `Bill #${extraData.biltyNo} (${refNo})` : `Shipment Ref: ${refNo}`,
      biltyNo: extraData?.biltyNo || '',
      amountPaid: paidVal,
      remainingBalance: balanceVal,
      paymentMethod: extraData?.paymentMethod || 'Cash'
    };

    setUsageLogs((prev) => [newLog, ...prev]);

    try {
      await setDoc(doc(db, 'store_items', String(targetItem.id)), {
        id: targetItem.id,
        name: targetItem.name,
        item_code: targetItem.itemCode,
        category: targetItem.category || categoryParam || 'General',
        unit: targetItem.unit || 'PCS',
        total_stock: newTotalStock,
        used_today: targetItem.usedToday || 0,
        remaining_stock: newRemainingStock,
        unit_price: price > 0 ? price : (targetItem.unitPrice || 0)
      }, { merge: true });

      await setDoc(doc(db, 'usage_logs', String(logId)), {
        id: logId,
        type: 'Stock In',
        item_code: targetItem.itemCode || 'N/A',
        item_name: targetItem.name || 'Item',
        category: targetItem.category || categoryParam || 'General',
        qty_used: actualQty,
        unit_price: price,
        line_total: lineTotal,
        used_by: supplierName,
        department: 'Store Inward',
        issued_by: 'Store Manager',
        date_iso: dateISO,
        created_at: dateISO,
        time: formattedTime,
        remaining_stock_after: newRemainingStock,
        status: 1,
        notes: extraData?.biltyNo ? `Bill #${extraData.biltyNo} (${refNo})` : `Shipment Ref: ${refNo}`,
        bilty_no: extraData?.biltyNo || '',
        amount_paid: paidVal,
        remaining_balance: balanceVal,
        payment_method: extraData?.paymentMethod || 'Cash'
      }, { merge: true });

      if (paidVal > 0 && supplierName && supplierName !== 'Vendor Shipment' && supplierName !== 'Direct Supplier') {
        await addVendorPayment({
          vendorName: supplierName,
          amountPaid: paidVal,
          paymentMethod: extraData?.paymentMethod || 'Cash',
          referenceNo: extraData?.biltyNo ? `Bill #${extraData.biltyNo}` : refNo,
          items: [{ name: targetItem.name || 'Store Item', qty: actualQty }],
          notes: 'Paid at Stock In (1 item)'
        });
      }

      fetchFirebaseData();
    } catch (e) {
      console.error('receiveStock exception:', e);
    }

    return true;
  };

  // 3. Add New Inventory Item to Store
  const addNewItem = async (newItemData) => {
    const itemId = generateUUID();
    const itemCode = newItemData.itemCode || `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const priceVal = parseFloat(newItemData.unitPrice) || 0;
    const minLevelVal = parseFloat(newItemData.minLevel) || 10;
    const rackLocationVal = newItemData.rackLocation || 'Main Store';

    const newItem = {
      ...newItemData,
      id: itemId,
      itemCode: itemCode,
      unitPrice: priceVal,
      minLevel: minLevelVal,
      rackLocation: rackLocationVal,
      usedToday: 0,
      totalStock: parseFloat(newItemData.totalStock) || 0,
      remainingStock: parseFloat(newItemData.totalStock) || 0,
      status: 1
    };
    setItems((prev) => [newItem, ...prev]);

    try {
      await setDoc(doc(db, 'store_items', String(itemId)), {
        id: itemId,
        name: newItem.name,
        specification: newItem.specification || '',
        item_code: itemCode,
        category: newItem.category || 'General',
        unit: newItem.unit || 'PCS',
        total_stock: parseFloat(newItem.totalStock) || 0,
        used_today: 0,
        remaining_stock: parseFloat(newItem.totalStock) || 0,
        unit_price: priceVal,
        min_level: minLevelVal,
        rack_location: rackLocationVal,
        image_url: newItem.imageUrl || '',
        status: 1
      }, { merge: true });
      fetchFirebaseData();
    } catch (e) {
      console.error('Firebase store_items insert error:', e);
    }
    return newItem;
  };

  // 4. Update Item
  const updateItem = async (itemId, updatedData) => {
    const priceVal = updatedData.unitPrice !== undefined ? parseFloat(updatedData.unitPrice) || 0 : undefined;
    const minLevelVal = updatedData.minLevel !== undefined ? parseFloat(updatedData.minLevel) || 10 : undefined;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const newTotal = updatedData.totalStock !== undefined ? parseInt(updatedData.totalStock) || 0 : i.totalStock;
          const newRemaining = Math.max(0, newTotal - i.usedToday);
          return {
            ...i,
            ...updatedData,
            totalStock: newTotal,
            remainingStock: newRemaining
          };
        }
        return i;
      })
    );

    try {
      const updatePayload = {
        name: updatedData.name,
        category: updatedData.category,
        total_stock: updatedData.totalStock,
        remaining_stock: updatedData.totalStock,
        unit: updatedData.unit
      };
      if (updatedData.specification !== undefined) updatePayload.specification = updatedData.specification;
      if (updatedData.imageUrl !== undefined) updatePayload.image_url = updatedData.imageUrl;
      if (priceVal !== undefined) updatePayload.unit_price = priceVal;
      if (minLevelVal !== undefined) updatePayload.min_level = minLevelVal;
      if (updatedData.rackLocation) updatePayload.rack_location = updatedData.rackLocation;

      await setDoc(doc(db, 'store_items', String(itemId)), updatePayload, { merge: true });
      fetchFirebaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Delete Inventory Item
  const deleteItem = async (itemId) => {
    const stringId = String(itemId);
    const targetItem = items.find((i) => String(i.id) === stringId || (i.itemCode && String(i.itemCode) === stringId));

    const idsToAdd = [stringId];
    if (targetItem?.id) idsToAdd.push(String(targetItem.id));
    if (targetItem?.itemCode) idsToAdd.push(String(targetItem.itemCode));

    const existingDeleted = safeParseJSON('rehmat_deleted_item_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...idsToAdd]));
    safeSetJSON('rehmat_deleted_item_ids', JSON.stringify(updatedDeleted));
    setDeletedItemIds(updatedDeleted);

    const existingItems = safeParseJSON('rehmat_store_items_v2', []);
    const filteredItems = existingItems.filter((i) => String(i.id) !== stringId && String(i.itemCode) !== stringId);
    safeSetJSON('rehmat_store_items_v2', JSON.stringify(filteredItems));
    setItems((prev) => prev.filter((i) => String(i.id) !== stringId && String(i.itemCode) !== stringId));

    logActivity(
      'Inventory Item Deleted',
      `Deleted store item "${targetItem?.name || itemId}" (SKU: ${targetItem?.itemCode || 'N/A'})`
    );

    try {
      if (itemId) {
        await deleteDoc(doc(db, 'store_items', String(itemId)));
        if (targetItem?.itemCode && String(targetItem.itemCode) !== String(itemId)) {
          await deleteDoc(doc(db, 'store_items', String(targetItem.itemCode)));
        }
      }
    } catch (e) {
      console.error('Firebase deleteItem error:', e);
    }
  };

  // Bulk Delete Items
  const deleteMultipleItems = async (itemIds) => {
    const stringIds = itemIds.map(String);
    const idsSet = new Set(stringIds);

    const existingDeleted = safeParseJSON('rehmat_deleted_item_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...stringIds]));
    safeSetJSON('rehmat_deleted_item_ids', JSON.stringify(updatedDeleted));
    setDeletedItemIds(updatedDeleted);

    const existingItems = safeParseJSON('rehmat_store_items_v2', []);
    const filteredItems = existingItems.filter((i) => !idsSet.has(String(i.id)) && !idsSet.has(String(i.itemCode)));
    safeSetJSON('rehmat_store_items_v2', JSON.stringify(filteredItems));
    setItems((prev) => prev.filter((i) => !idsSet.has(String(i.id)) && !idsSet.has(String(i.itemCode))));

    logActivity(
      'Bulk Items Deleted',
      `Deleted ${itemIds.length} inventory items`
    );

    try {
      await Promise.allSettled(itemIds.map((id) => deleteDoc(doc(db, 'store_items', String(id)))));
    } catch (e) {
      console.error('Firebase deleteMultipleItems error:', e);
    }
  };

  // Clean Duplicate Test Items Action
  const cleanDuplicateItems = async () => {
    const seen = new Set();
    const cleaned = items.filter((item) => {
      if (item.totalStock === 0 && item.remainingStock === 0) {
        const key = `${(item.name || '').toLowerCase()}_zero`;
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    });

    setItems(cleaned);
    safeSetJSON('rehmat_store_items_v2', JSON.stringify(cleaned));

    try {
      // Firebase clean duplicate placeholder
    } catch (e) {
      console.error(e);
    }
  };

  // 7. Delete Logs Actions
  const deleteMultipleLogs = async (logIds) => {
    const stringIds = logIds.map(String);
    const idsSet = new Set(stringIds);

    const existingDeleted = safeParseJSON('rehmat_deleted_log_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...stringIds]));
    safeSetJSON('rehmat_deleted_log_ids', JSON.stringify(updatedDeleted));
    setDeletedLogIds(updatedDeleted);

    const existingLogs = safeParseJSON('rehmat_store_usage_logs_v2', []);
    const filteredLogs = existingLogs.filter((l) => !idsSet.has(String(l.id)));
    safeSetJSON('rehmat_store_usage_logs_v2', JSON.stringify(filteredLogs));
    setUsageLogs((prev) => prev.filter((l) => !idsSet.has(String(l.id))));

    logActivity(
      'Bulk Logs Deleted',
      `Deleted ${logIds.length} usage logs`
    );

    try {
      await Promise.allSettled(logIds.map((id) => deleteDoc(doc(db, 'usage_logs', String(id)))));
    } catch (e) {
      console.error('Firebase deleteMultipleLogs error:', e);
    }
  };

  // 8. Category Actions
  const addCategory = async (categoryData) => {
    let categoryId = categoryData.id;
    if (!categoryId || !String(categoryId).toUpperCase().startsWith('CAT-')) {
      categoryId = getNextCategoryId(categories);
    }
    const newCategory = {
      id: categoryId,
      name: (categoryData.name || '').trim(),
      description: (categoryData.description || '').trim()
    };

    // Remove from deleted categories blacklist if re-added
    const existingDeleted = safeParseJSON('rehmat_deleted_category_ids', []);
    const updatedDeleted = existingDeleted.filter((id) => id !== categoryId && id !== newCategory.name.toLowerCase());
    safeSetJSON('rehmat_deleted_category_ids', JSON.stringify(updatedDeleted));
    setDeletedCategoryIds(updatedDeleted);

    setCategories((prev) => {
      const exists = (prev || []).some((c) => (c.name || '').toLowerCase() === newCategory.name.toLowerCase());
      if (exists) return prev;
      const updated = [...(prev || []), newCategory];
      const normalized = normalizeCategories(updated);
      safeSetJSON('rehmat_store_categories_v2', JSON.stringify(normalized));
      return normalized;
    });

    logActivity('Category Added', `Added category "${newCategory.name}" (${categoryId})`);

    try {
      await setDoc(doc(db, 'categories', String(categoryId)), {
        id: categoryId,
        name: newCategory.name,
        description: newCategory.description
      }, { merge: true });
    } catch (e) {
      console.error('Firebase addCategory error:', e);
    }
  };

  const updateCategory = async (categoryId, updatedData) => {
    setCategories((prev) => {
      const updated = (prev || []).map((c) => (c.id === categoryId ? { ...c, ...updatedData } : c));
      safeSetJSON('rehmat_store_categories_v2', JSON.stringify(updated));
      return updated;
    });

    logActivity('Category Updated', `Updated category "${updatedData.name}"`);

    try {
      await setDoc(doc(db, 'categories', String(categoryId)), {
        name: updatedData.name,
        description: updatedData.description || ''
      }, { merge: true });
    } catch (e) {
      console.error('Firebase updateCategory error:', e);
    }
  };

  const deleteCategory = async (categoryId) => {
    const stringId = String(categoryId);
    const target = categories.find((c) => String(c.id) === stringId);

    const idsToAdd = [stringId];
    if (target?.name) idsToAdd.push(target.name.toLowerCase());

    const existingDeleted = safeParseJSON('rehmat_deleted_category_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...idsToAdd]));
    safeSetJSON('rehmat_deleted_category_ids', JSON.stringify(updatedDeleted));
    setDeletedCategoryIds(updatedDeleted);

    setCategories((prev) => {
      const updated = (prev || []).filter((c) => String(c.id) !== stringId);
      safeSetJSON('rehmat_store_categories_v2', JSON.stringify(updated));
      return updated;
    });

    logActivity('Category Deleted', `Deleted category "${target?.name || categoryId}"`);

    try {
      await deleteDoc(doc(db, 'categories', String(categoryId)));
    } catch (e) {
      console.error('Firebase deleteCategory error:', e);
    }
  };

  const deleteMultipleCategories = async (categoryIds) => {
    const idsSet = new Set(categoryIds.map(String));
    const targets = categories.filter((c) => idsSet.has(String(c.id)));
    const names = targets.map((c) => (c.name || '').toLowerCase());

    const existingDeleted = safeParseJSON('rehmat_deleted_category_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...categoryIds.map(String), ...names]));
    safeSetJSON('rehmat_deleted_category_ids', JSON.stringify(updatedDeleted));
    setDeletedCategoryIds(updatedDeleted);

    setCategories((prev) => {
      const updated = (prev || []).filter((c) => !idsSet.has(String(c.id)));
      safeSetJSON('rehmat_store_categories_v2', JSON.stringify(updated));
      return updated;
    });

    logActivity('Bulk Categories Deleted', `Deleted ${categoryIds.length} categories`);

    try {
      await Promise.allSettled(categoryIds.map((id) => deleteDoc(doc(db, 'categories', String(id)))));
    } catch (e) {
      console.error('Firebase deleteMultipleCategories error:', e);
    }
  };

  // Usage Logs Actions
  const deleteLog = async (logId) => {
    const stringId = String(logId);
    const targetLog = usageLogs.find(
      (l) => String(l.id) === stringId
    );

    const idsToAdd = [stringId];
    if (targetLog?.id) idsToAdd.push(String(targetLog.id));

    const existingDeleted = safeParseJSON('rehmat_deleted_log_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...idsToAdd]));
    safeSetJSON('rehmat_deleted_log_ids', JSON.stringify(updatedDeleted));
    setDeletedLogIds(updatedDeleted);

    const existingLogs = safeParseJSON('rehmat_store_usage_logs_v2', []);
    const filteredLogs = existingLogs.filter((l) => String(l.id) !== stringId);
    safeSetJSON('rehmat_store_usage_logs_v2', JSON.stringify(filteredLogs));
    setUsageLogs((prev) => prev.filter((l) => String(l.id) !== stringId));

    logActivity(
      'Stock Log Deleted',
      `Deleted voucher #${logId} (${targetLog?.itemName || 'Item'} - Qty: ${targetLog?.qtyUsed || 1})`
    );

    try {
      if (logId) {
        await deleteDoc(doc(db, 'usage_logs', String(logId)));
      }
    } catch (e) {
      console.error('Firebase deleteLog error:', e);
    }
  };

  const updateLog = async (logId, updatedData) => {
    const stringId = String(logId);
    const targetLog = usageLogs.find((l) => String(l.id) === stringId);
    const activeUser = user || safeParseJSON('rehmat_erp_active_user', null) || safeParseJSON('service_pos_user', null) || { name: 'Admin', role: 'Super Admin' };

    // 1. Immediately update React State AND LocalStorage
    setUsageLogs((prev) => {
      const updated = prev.map((l) => (String(l.id) === stringId ? { ...l, ...updatedData } : l));
      safeSetJSON('rehmat_store_usage_logs_v2', JSON.stringify(updated));
      return updated;
    });

    // 2. Log Activity and notifications safely
    try {
      logActivity(
        'Stock Log Edited',
        `Updated voucher #${logId} (${targetLog?.itemName || 'Item'} -> ${updatedData.itemName || targetLog?.itemName}, Qty: ${updatedData.qtyUsed || targetLog?.qtyUsed})`,
        activeUser
      );

      if (activeUser?.role === 'Store Keeper') {
        addNotification({
          title: 'Record Edited by Store Keeper',
          message: `${activeUser.name || 'Store Keeper'} edited voucher #${logId} (${updatedData.itemName || targetLog?.itemName}).`,
          type: 'request',
          senderName: activeUser.name || 'Store Keeper Ali',
          senderRole: 'Store Keeper'
        });
      }
    } catch (actErr) {
      console.warn('logActivity warning in updateLog:', actErr);
    }

    // 3. Save directly to Firestore usage_logs collection
    try {
      const payload = {};
      if (updatedData.itemName !== undefined) payload.item_name = updatedData.itemName;
      if (updatedData.usedBy !== undefined) payload.used_by = updatedData.usedBy;
      if (updatedData.category !== undefined) payload.category = updatedData.category;
      if (updatedData.notes !== undefined) payload.notes = updatedData.notes;
      if (updatedData.qtyUsed !== undefined) payload.qty_used = Number(updatedData.qtyUsed);
      if (updatedData.unitPrice !== undefined) payload.unit_price = Number(updatedData.unitPrice);
      if (updatedData.lineTotal !== undefined) payload.line_total = Number(updatedData.lineTotal);
      if (updatedData.biltyNo !== undefined) payload.bilty_no = updatedData.biltyNo;
      if (updatedData.amountPaid !== undefined) payload.amount_paid = Number(updatedData.amountPaid);
      if (updatedData.remainingBalance !== undefined) payload.remaining_balance = Number(updatedData.remainingBalance);
      if (updatedData.paymentMethod !== undefined) payload.payment_method = updatedData.paymentMethod;

      await setDoc(doc(db, 'usage_logs', stringId), payload, { merge: true });

      // 4. Update the item stock in store_items if qty changed
      if (targetLog && updatedData.qtyUsed !== undefined) {
        const oldQty = Number(targetLog.qtyUsed) || 0;
        const newQty = Number(updatedData.qtyUsed) || 0;
        const isStockIn = (targetLog.type || '').toUpperCase().includes('IN');
        const qtyDiff = isStockIn ? (newQty - oldQty) : (oldQty - newQty);

        if (qtyDiff !== 0) {
          const matchedItem = items.find(
            (it) => it.id === targetLog.itemCode || it.itemCode === targetLog.itemCode || (it.name || '').toLowerCase() === (targetLog.itemName || '').toLowerCase()
          );
          if (matchedItem) {
            const updatedStock = Math.max(0, (matchedItem.totalStock || 0) + qtyDiff);
            const updatedRemaining = Math.max(0, (matchedItem.remainingStock || 0) + qtyDiff);
            setItems((prev) =>
              prev.map((it) => (it.id === matchedItem.id ? { ...it, totalStock: updatedStock, remainingStock: updatedRemaining } : it))
            );
            await setDoc(doc(db, 'store_items', String(matchedItem.id)), {
              total_stock: updatedStock,
              remaining_stock: updatedRemaining
            }, { merge: true });
          }
        }
      }

      await fetchFirebaseData();
    } catch (e) {
      console.error('Firebase updateLog error:', e);
    }
  };
  updateLogRef.current = updateLog;

  // Machine Sales Actions
  const addMachineSale = async (newSaleData) => {
    const now = new Date();
    const saleId = (newSaleData.id && newSaleData.id.includes('-') && newSaleData.id.length > 20) ? newSaleData.id : generateUUID();
    const saleNo = `MS-${Math.floor(10000 + Math.random() * 90000)}`;

    const itemsList = (newSaleData.items && newSaleData.items.length > 0)
      ? newSaleData.items.map((i) => {
        const q = parseInt(i.qty) || 1;
        const p = parseFloat(i.unitPrice) || 0;
        const discPercent = parseFloat(i.discount) || 0;
        const gross = q * p;
        const discAmount = (gross * discPercent) / 100;
        const lineTotal = Math.max(0, gross - discAmount);
        return {
          machineName: i.machineName || 'Machine',
          serialNo: i.serialNo || '',
          qty: q,
          unitPrice: p,
          discount: discPercent,
          discountAmount: discAmount,
          lineTotal
        };
      })
      : [{
        machineName: newSaleData.machineName || 'Machine',
        serialNo: newSaleData.serialNo || '',
        qty: parseInt(newSaleData.qty) || 1,
        unitPrice: parseFloat(newSaleData.unitPrice) || 0,
        discount: parseFloat(newSaleData.discount) || 0,
        discountAmount: (((parseInt(newSaleData.qty) || 1) * (parseFloat(newSaleData.unitPrice) || 0)) * (parseFloat(newSaleData.discount) || 0)) / 100,
        lineTotal: Math.max(0, ((parseInt(newSaleData.qty) || 1) * (parseFloat(newSaleData.unitPrice) || 0)) - ((((parseInt(newSaleData.qty) || 1) * (parseFloat(newSaleData.unitPrice) || 0)) * (parseFloat(newSaleData.discount) || 0)) / 100))
      }];

    const subTotalVal = itemsList.reduce((sum, i) => sum + i.lineTotal, 0);
    const discountVal = parseFloat(newSaleData.discountAmount) || 0;
    const netTotalVal = Math.max(0, subTotalVal - discountVal);
    const totalQtySum = itemsList.reduce((sum, i) => sum + i.qty, 0);
    const paidVal = parseFloat(newSaleData.paidAmount) || 0;
    const balanceVal = Math.max(0, netTotalVal - paidVal);

    itemsList.forEach((i) => {
      if (i.machineName && i.machineName.trim()) {
        addMachineModel(i.machineName);
      }
    });

    const dateFormatted = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const fullDateString = `${dateFormatted}, ${timeFormatted}`;
    const firstMachine = itemsList[0] || {};

    const newEntry = {
      id: saleId,
      saleNo: saleNo,
      customerName: newSaleData.customerName || 'Customer',
      customerPhone: newSaleData.customerPhone || '',
      cityAddress: newSaleData.cityAddress || '',
      items: itemsList,
      machineName: formatItemsSummaryLabel(itemsList, 'Machine'),
      serialNo: firstMachine.serialNo || '',
      qty: totalQtySum,
      unitPrice: firstMachine.unitPrice,
      subTotal: subTotalVal,
      discountAmount: discountVal,
      lineTotal: netTotalVal,
      paidAmount: paidVal,
      balanceAmount: balanceVal,
      paymentStatus: newSaleData.paymentStatus || (paidVal >= netTotalVal ? 'Paid' : paidVal > 0 ? 'Partial' : 'Unpaid'),
      warrantyTerms: newSaleData.warrantyTerms || '1 Year Motor & Frame Free Service Warranty',
      time: fullDateString,
      dateISO: now.toISOString()
    };

    setMachineSales((prev) => {
      const updated = [newEntry, ...prev];
      safeSetJSON('rehmat_store_machine_sales_v2', JSON.stringify(updated));
      return updated;
    });

    try {
      const writePromise = setDoc(
        doc(db, 'machine_sales', String(saleId)),
        {
          id: saleId,
          sale_no: saleNo,
          customer_name: newEntry.customerName,
          customer_phone: newEntry.customerPhone,
          city_address: newEntry.cityAddress,
          machine_name: newEntry.machineName,
          serial_no: newEntry.serialNo,
          qty: newEntry.qty,
          unit_price: newEntry.unitPrice,
          discount_amount: newEntry.discountAmount,
          line_total: newEntry.lineTotal,
          paid_amount: newEntry.paidAmount,
          balance_amount: newEntry.balanceAmount,
          payment_status: newEntry.paymentStatus,
          time: newEntry.time,
          items: newEntry.items || []
        },
        { merge: true }
      ).catch((e) => {
        console.error('Firebase addMachineSale Exception:', e);
      });
      await Promise.race([writePromise, new Promise((resolve) => setTimeout(resolve, 1200))]);
    } catch (e) {
      console.error('Firebase addMachineSale Exception:', e);
    }
    return newEntry;
  };

  const updateMachineSale = async (id, updatedData) => {
    let updatedList = [];
    setMachineSales((prev) => {
      updatedList = prev.map((m) => (String(m.id) === String(id) ? { ...m, ...updatedData } : m));
      safeSetJSON('rehmat_store_machine_sales_v2', JSON.stringify(updatedList));
      return updatedList;
    });

    const firestorePayload = {};
    if (updatedData.customerName !== undefined) firestorePayload.customer_name = updatedData.customerName;
    if (updatedData.customerPhone !== undefined) firestorePayload.customer_phone = updatedData.customerPhone;
    if (updatedData.cityAddress !== undefined) firestorePayload.city_address = updatedData.cityAddress;
    if (updatedData.machineName !== undefined) firestorePayload.machine_name = updatedData.machineName;
    if (updatedData.serialNo !== undefined) firestorePayload.serial_no = updatedData.serialNo;
    if (updatedData.qty !== undefined) firestorePayload.qty = updatedData.qty;
    if (updatedData.unitPrice !== undefined) firestorePayload.unit_price = updatedData.unitPrice;
    if (updatedData.discountAmount !== undefined) firestorePayload.discount_amount = updatedData.discountAmount;
    if (updatedData.lineTotal !== undefined) firestorePayload.line_total = updatedData.lineTotal;
    if (updatedData.paidAmount !== undefined) firestorePayload.paid_amount = updatedData.paidAmount;
    if (updatedData.balanceAmount !== undefined) firestorePayload.balance_amount = updatedData.balanceAmount;
    if (updatedData.paymentStatus !== undefined) firestorePayload.payment_status = updatedData.paymentStatus;
    if (updatedData.warrantyTerms !== undefined) firestorePayload.warranty_terms = updatedData.warrantyTerms;
    if (updatedData.items !== undefined) firestorePayload.items = updatedData.items;

    try {
      await setDoc(doc(db, 'machine_sales', String(id)), firestorePayload, { merge: true });
    } catch (e) {
      console.error('Firebase updateMachineSale error:', e);
    }
  };

  const addMachineModel = (modelName) => {
    if (!modelName || !modelName.trim()) return;
    const trimmed = modelName.trim();
    if (!machineModels.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setMachineModels((prev) => [...prev, trimmed]);
    }
  };

  const saveMachineRecipe = async (recipeObj) => {
    const id = recipeObj.id || generateUUID();
    const recipeToSave = { id, ...recipeObj };
    setMachineRecipes((prev) => {
      const existingIdx = prev.findIndex((r) => r.modelName.toLowerCase() === recipeObj.modelName.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...recipeObj };
        return copy;
      }
      return [recipeToSave, ...prev];
    });

    try {
      await setDoc(doc(db, 'machine_recipes', String(recipeToSave.id)), {
        id: recipeToSave.id,
        model_name: recipeToSave.modelName,
        description: recipeToSave.description || '',
        ingredients: recipeToSave.ingredients || []
      }, { merge: true });
    } catch (e) {
      console.warn('Machine recipes cloud sync error:', e);
    }
  };

  const deleteMachineRecipe = async (id) => {
    setMachineRecipes((prev) => prev.filter((r) => r.id !== id));
    try {
      await deleteDoc(doc(db, 'machine_recipes', String(id)));
    } catch (e) {
      console.warn('Machine recipes delete error:', e);
    }
  };

  const deleteMachineSale = async (id) => {
    const stringId = String(id);
    const existingDeleted = safeParseJSON('rehmat_deleted_sale_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, stringId]));
    safeSetJSON('rehmat_deleted_sale_ids', JSON.stringify(updatedDeleted));
    setDeletedSaleIds(updatedDeleted);

    const existingSales = safeParseJSON('rehmat_store_machine_sales_v2', []);
    const filteredSales = existingSales.filter((m) => String(m.id) !== stringId);
    safeSetJSON('rehmat_store_machine_sales_v2', JSON.stringify(filteredSales));
    setMachineSales((prev) => prev.filter((m) => String(m.id) !== stringId));

    try {
      await deleteDoc(doc(db, 'machine_sales', String(id)));
    } catch (e) {
      console.error('Firebase deleteMachineSale error:', e);
    }
  };

  const deleteMultipleMachineSales = async (ids) => {
    const stringIds = ids.map(String);
    const idsSet = new Set(stringIds);

    const existingDeleted = safeParseJSON('rehmat_deleted_sale_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...stringIds]));
    safeSetJSON('rehmat_deleted_sale_ids', JSON.stringify(updatedDeleted));
    setDeletedSaleIds(updatedDeleted);

    const existingSales = safeParseJSON('rehmat_store_machine_sales_v2', []);
    const filteredSales = existingSales.filter((m) => !idsSet.has(String(m.id)));
    safeSetJSON('rehmat_store_machine_sales_v2', JSON.stringify(filteredSales));
    setMachineSales((prev) => prev.filter((m) => !idsSet.has(String(m.id))));

    try {
      await Promise.allSettled(ids.map((id) => deleteDoc(doc(db, 'machine_sales', String(id)))));
    } catch (e) {
      console.error('Firebase deleteMultipleMachineSales error:', e);
    }
  };

  // ----------------------------------------------------
  // BOM MACHINE RECIPES & PRODUCTION ASSEMBLY ACTIONS
  // ----------------------------------------------------

  // Batch Assemble Machine (Deducts all raw materials based on Recipe)
  const assembleMachine = (modelName, buildQty = 1) => {
    const recipe = machineRecipes.find((r) => r.modelName.toLowerCase() === modelName.toLowerCase());
    if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
      return { success: false, message: `No BOM Recipe formula found for ${modelName}. Please define recipe first.` };
    }

    const deductedList = [];
    recipe.ingredients.forEach((ing) => {
      const requiredQty = (parseFloat(ing.qty) || 1) * buildQty;
      // Deduct from store stock
      issueStock({
        itemName: ing.itemName,
        qtyUsed: requiredQty,
        usedBy: `Assembly: ${buildQty}x ${modelName}`,
        department: 'Assembly Floor (BOM Production)',
        unitPrice: 0
      });
      deductedList.push({ itemName: ing.itemName, qtyDeducted: requiredQty });
    });

    return { success: true, count: buildQty, deductedList };
  };

  // ----------------------------------------------------
  // MACHINE CUSTOMERS & KHATA VOUCHERS ACTIONS
  // ----------------------------------------------------
  const addMachineCustomer = async (customerData) => {
    const custId = generateUUID();
    const nowISO = new Date().toISOString();
    const newCustomer = {
      id: custId,
      name: (customerData.name || '').trim(),
      phone: (customerData.phone || '').trim(),
      city: (customerData.city || '').trim(),
      address: (customerData.address || customerData.city || '').trim(),
      openingBalance: parseFloat(customerData.openingBalance) || 0,
      notes: (customerData.notes || '').trim(),
      createdAt: nowISO
    };

    setMachineCustomers((prev) => {
      const updated = [newCustomer, ...prev].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      safeSetJSON('rehmat_store_machine_customers_v1', JSON.stringify(updated));
      return updated;
    });

    try {
      await setDoc(doc(db, 'machine_customers', String(custId)), {
        id: custId,
        name: newCustomer.name,
        phone: newCustomer.phone,
        city: newCustomer.city,
        address: newCustomer.address,
        opening_balance: newCustomer.openingBalance,
        notes: newCustomer.notes,
        created_at: nowISO
      }, { merge: true });
    } catch (e) {
      console.error('Firebase addMachineCustomer Exception:', e);
    }
    return newCustomer;
  };

  const updateMachineCustomer = async (id, updatedFields) => {
    let saved = null;
    setMachineCustomers((prev) => {
      const updated = prev.map((c) => {
        if (String(c.id) === String(id)) {
          saved = {
            ...c,
            ...updatedFields,
            openingBalance: updatedFields.openingBalance !== undefined ? parseFloat(updatedFields.openingBalance) || 0 : c.openingBalance
          };
          return saved;
        }
        return c;
      });
      safeSetJSON('rehmat_store_machine_customers_v1', JSON.stringify(updated));
      return updated;
    });

    try {
      const payload = {};
      if (updatedFields.name !== undefined) payload.name = updatedFields.name;
      if (updatedFields.phone !== undefined) payload.phone = updatedFields.phone;
      if (updatedFields.city !== undefined) payload.city = updatedFields.city;
      if (updatedFields.address !== undefined) payload.address = updatedFields.address;
      if (updatedFields.openingBalance !== undefined) payload.opening_balance = parseFloat(updatedFields.openingBalance) || 0;
      if (updatedFields.notes !== undefined) payload.notes = updatedFields.notes;
      await setDoc(doc(db, 'machine_customers', String(id)), payload, { merge: true });
    } catch (e) {
      console.error('Firebase updateMachineCustomer Exception:', e);
    }
    return saved;
  };

  const deleteMachineCustomer = async (id) => {
    const strId = String(id);
    const existingDeleted = safeParseJSON('rehmat_deleted_machine_customer_ids', []);
    safeSetJSON('rehmat_deleted_machine_customer_ids', JSON.stringify(Array.from(new Set([...existingDeleted, strId]))));

    setMachineCustomers((prev) => {
      const updated = prev.filter((c) => String(c.id) !== strId);
      safeSetJSON('rehmat_store_machine_customers_v1', JSON.stringify(updated));
      return updated;
    });

    try {
      await deleteDoc(doc(db, 'machine_customers', strId));
    } catch (e) {
      console.error('Firebase deleteMachineCustomer Exception:', e);
    }
  };

  const addCustomerPayment = async (paymentData) => {
    const paymentId = generateUUID();
    const voucherNo = paymentData.voucherNo || `PAY-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    const entryType = paymentData.entryType || 'Receipt';
    const referenceType = paymentData.referenceType || (paymentData.repairId ? 'Repair' : paymentData.invoiceId ? 'Sale' : 'Account');
    const amountNum = Math.max(0, parseFloat(paymentData.amountPaid) || 0);

    const newPayment = {
      id: paymentId,
      voucherNo,
      entryType,
      referenceType,
      invoiceId: paymentData.invoiceId || '',
      repairId: paymentData.repairId || '',
      referenceLabel: paymentData.referenceLabel || '',
      customerName: (paymentData.customerName || 'Walk-in Customer').trim(),
      amountPaid: amountNum,
      paymentMethod: paymentData.paymentMethod || 'Cash',
      referenceNo: paymentData.referenceNo || '',
      notes: paymentData.notes || '',
      time: formattedTime,
      createdAt: now.toISOString()
    };

    const existingPending = safeParseJSON('rehmat_pending_customer_payment_ids', []);
    safeSetJSON('rehmat_pending_customer_payment_ids', JSON.stringify(Array.from(new Set([...existingPending, String(paymentId)]))));

    setCustomerPayments((prev) => {
      const updated = [newPayment, ...prev];
      safeSetJSON('rehmat_store_customer_payments_v2', JSON.stringify(updated));
      safeSetJSON('rehmat_customer_payments_v2', JSON.stringify(updated));
      return updated;
    });

    const deltaPaid = entryType === 'Payout' ? -amountNum : amountNum;

    const computeNextSale = (sale) => {
      const currentPaid = parseFloat(sale.paidAmount) || 0;
      const updatedPaid = Math.max(0, currentPaid + deltaPaid);
      const netBill = parseFloat(sale.lineTotal || sale.subTotal) || 0;
      const updatedStatus = netBill > 0 && updatedPaid >= netBill ? 'Paid' : updatedPaid > 0 ? 'Partial' : 'Unpaid';
      const updatedBal = Math.max(0, netBill - updatedPaid);
      return {
        ...sale,
        paidAmount: updatedPaid,
        balanceAmount: updatedBal,
        paymentStatus: updatedStatus
      };
    };

    const syncTasks = [];

    // Auto-update linked Machine Sale invoice paid amount & status
    if (paymentData.invoiceId) {
      const targetSale = (machineSales || []).find((s) => String(s.id) === String(paymentData.invoiceId));
      const saleToSync = targetSale ? computeNextSale(targetSale) : null;

      setMachineSales((prevSales) => {
        const updated = prevSales.map((sale) => (String(sale.id) === String(paymentData.invoiceId) ? computeNextSale(sale) : sale));
        safeSetJSON('rehmat_store_machine_sales_v2', JSON.stringify(updated));
        return updated;
      });

      if (saleToSync) {
        syncTasks.push(
          setDoc(
            doc(db, 'machine_sales', String(paymentData.invoiceId)),
            {
              paid_amount: saleToSync.paidAmount,
              balance_amount: saleToSync.balanceAmount,
              payment_status: saleToSync.paymentStatus
            },
            { merge: true }
          ).catch((e) => console.error('Firebase updateMachineSale in addCustomerPayment error:', e))
        );
      }
    }

    // Auto-update linked Machine Repair Job Card paid amount & balance
    if (paymentData.repairId) {
      const targetRepair = (machineRepairs || []).find((r) => String(r.id) === String(paymentData.repairId));
      if (targetRepair) {
        const updatedPaid = Math.max(0, (parseFloat(targetRepair.paidAmount) || 0) + deltaPaid);
        syncTasks.push(updateMachineRepair(targetRepair.id, { paidAmount: updatedPaid }));
      }
    }

    const voucherWritePromise = setDoc(
      doc(db, 'customer_payments', String(paymentId)),
      {
        id: paymentId,
        voucher_no: voucherNo,
        entry_type: entryType,
        reference_type: referenceType,
        invoice_id: newPayment.invoiceId || '',
        repair_id: newPayment.repairId || '',
        reference_label: newPayment.referenceLabel || '',
        customer_name: newPayment.customerName,
        payment_date: newPayment.time,
        amount_paid: newPayment.amountPaid,
        payment_method: newPayment.paymentMethod,
        reference_no: newPayment.referenceNo,
        notes: newPayment.notes,
        created_at: newPayment.createdAt
      },
      { merge: true }
    )
      .then(() => {
        const currPending = safeParseJSON('rehmat_pending_customer_payment_ids', []);
        safeSetJSON(
          'rehmat_pending_customer_payment_ids',
          JSON.stringify(currPending.filter((id) => String(id) !== String(paymentId)))
        );
      })
      .catch((e) => {
        console.error('Firebase addCustomerPayment Exception:', e);
      });

    syncTasks.push(voucherWritePromise);

    // Never block UI indefinitely if Firebase network stream is slow or offline
    await Promise.race([Promise.allSettled(syncTasks), new Promise((resolve) => setTimeout(resolve, 1200))]);

    return newPayment;
  };

  const deleteCustomerPayment = async (paymentId) => {
    const strId = String(paymentId);
    const target = (customerPayments || []).find((p) => String(p.id) === strId);

    const existingDeleted = safeParseJSON('rehmat_deleted_customer_payment_ids', []);
    safeSetJSON('rehmat_deleted_customer_payment_ids', JSON.stringify(Array.from(new Set([...existingDeleted, strId]))));

    const currPending = safeParseJSON('rehmat_pending_customer_payment_ids', []);
    if (currPending.length > 0) {
      safeSetJSON(
        'rehmat_pending_customer_payment_ids',
        JSON.stringify(currPending.filter((id) => String(id) !== strId))
      );
    }

    setCustomerPayments((prev) => {
      const updated = prev.filter((p) => String(p.id) !== strId);
      safeSetJSON('rehmat_store_customer_payments_v2', JSON.stringify(updated));
      safeSetJSON('rehmat_customer_payments_v2', JSON.stringify(updated));
      return updated;
    });

    if (target) {
      const amt = Math.max(0, parseFloat(target.amountPaid) || 0);
      const reverseDelta = target.entryType === 'Payout' ? amt : -amt;

      if (target.invoiceId) {
        const computeReversedSale = (sale) => {
          const updatedPaid = Math.max(0, (parseFloat(sale.paidAmount) || 0) + reverseDelta);
          const netBill = parseFloat(sale.lineTotal || sale.subTotal) || 0;
          const updatedBal = Math.max(0, netBill - updatedPaid);
          const updatedStatus = netBill > 0 && updatedPaid >= netBill ? 'Paid' : updatedPaid > 0 ? 'Partial' : 'Unpaid';
          return { ...sale, paidAmount: updatedPaid, balanceAmount: updatedBal, paymentStatus: updatedStatus };
        };

        const targetSale = (machineSales || []).find((s) => String(s.id) === String(target.invoiceId));
        const saleToSync = targetSale ? computeReversedSale(targetSale) : null;

        setMachineSales((prevSales) => {
          const updated = prevSales.map((sale) => (String(sale.id) === String(target.invoiceId) ? computeReversedSale(sale) : sale));
          safeSetJSON('rehmat_store_machine_sales_v2', JSON.stringify(updated));
          return updated;
        });

        if (saleToSync) {
          try {
            await setDoc(
              doc(db, 'machine_sales', String(target.invoiceId)),
              {
                paid_amount: saleToSync.paidAmount,
                balance_amount: saleToSync.balanceAmount,
                payment_status: saleToSync.paymentStatus
              },
              { merge: true }
            );
          } catch (e) {
            console.error('Firebase reverse sale payment error:', e);
          }
        }
      }

      if (target.repairId) {
        const targetRepair = (machineRepairs || []).find((r) => String(r.id) === String(target.repairId));
        if (targetRepair) {
          const updatedPaid = Math.max(0, (parseFloat(targetRepair.paidAmount) || 0) + reverseDelta);
          await updateMachineRepair(targetRepair.id, { paidAmount: updatedPaid });
        }
      }
    }

    try {
      await deleteDoc(doc(db, 'customer_payments', strId));
    } catch (e) {
      console.error('Firebase deleteCustomerPayment Exception:', e);
    }
  };

  // ----------------------------------------------------
  // FULL BACKUP EXPORT & IMPORT & RESET ACTIONS
  // ----------------------------------------------------
  const exportFullBackupData = () => {
    const backupObj = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      items,
      usageLogs,
      vendors,
      categories,
      masterItemNames,
      machineSales,
      machineModels,
      machineRecipes,
      machineRepairs,
      machineCustomers,
      customerPayments,
      vendorPayments,
      storeCustomers,
      storePayments,
      expenses,
      expenseFunds,
      expenseCategories
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const importFullBackupData = async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.items && Array.isArray(data.items)) {
        setItems(data.items);
        const itemsToInsert = data.items.map((i) => ({
          id: i.id,
          name: i.name,
          item_code: i.itemCode || i.id,
          category: i.category || 'General',
          unit: i.unit || 'PCS',
          total_stock: i.totalStock || 0,
          used_today: i.usedToday || 0,
          remaining_stock: i.remainingStock !== undefined ? i.remainingStock : (i.totalStock || 0)
        }));
        await Promise.allSettled(itemsToInsert.map((item) => setDoc(doc(db, 'store_items', String(item.id)), item, { merge: true })));
      }
      if (data.usageLogs && Array.isArray(data.usageLogs)) {
        setUsageLogs(data.usageLogs);
        const logsToInsert = data.usageLogs.map((l) => ({
          id: l.id,
          type: l.type || 'Stock Out',
          item_id: l.itemCode || l.id,
          item_name: l.itemName || 'Item',
          item_code: l.itemCode,
          qty_used: parseFloat(l.qtyUsed) || 1,
          unit_price: parseFloat(l.unitPrice) || 0,
          line_total: parseFloat(l.lineTotal) || 0,
          used_by: l.usedBy || 'Store',
          department: l.department || 'Production',
          time: l.time || 'Today',
          timestamp: l.dateISO || new Date().toISOString()
        }));
        await Promise.allSettled(logsToInsert.map((log) => setDoc(doc(db, 'usage_logs', String(log.id)), log, { merge: true })));
      }
      if (data.machineSales && Array.isArray(data.machineSales)) {
        setMachineSales(data.machineSales);
        const salesToInsert = data.machineSales.map((s) => ({
          id: s.id,
          sale_no: s.saleNo || s.id,
          customer_name: s.customerName || 'Customer',
          customer_phone: s.customerPhone,
          city_address: s.cityAddress,
          machine_name: s.machineName,
          serial_no: s.serialNo,
          qty: parseFloat(s.qty) || 1,
          unit_price: parseFloat(s.unitPrice) || 0,
          discount_amount: parseFloat(s.discountAmount) || 0,
          line_total: parseFloat(s.lineTotal) || 0,
          paid_amount: parseFloat(s.paidAmount) || 0,
          balance_amount: parseFloat(s.balanceAmount) || 0,
          payment_status: s.paymentStatus || 'Paid',
          time: s.time,
          items: s.items || []
        }));
        await Promise.allSettled(salesToInsert.map((sale) => setDoc(doc(db, 'machine_sales', String(sale.id)), sale, { merge: true })));
      }
      if (data.vendors && Array.isArray(data.vendors)) {
        setVendors(data.vendors);
        await Promise.allSettled(data.vendors.map((v) => setDoc(doc(db, 'vendors', String(v.id)), v, { merge: true })));
      }
      if (data.vendorPayments && Array.isArray(data.vendorPayments)) {
        setVendorPayments(data.vendorPayments);
        await Promise.allSettled(data.vendorPayments.map((p) => setDoc(doc(db, 'vendor_payments', String(p.id)), p, { merge: true })));
      }
      if (data.storeCustomers && Array.isArray(data.storeCustomers)) {
        setStoreCustomers(data.storeCustomers);
        await Promise.allSettled(data.storeCustomers.map((c) => setDoc(doc(db, 'store_customers', String(c.id)), c, { merge: true })));
      }
      if (data.storePayments && Array.isArray(data.storePayments)) {
        setStorePayments(data.storePayments);
        await Promise.allSettled(data.storePayments.map((p) => setDoc(doc(db, 'store_payments', String(p.id)), p, { merge: true })));
      }
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
        await Promise.allSettled(data.categories.map((c) => setDoc(doc(db, 'categories', String(c.id)), c, { merge: true })));
      }
      if (data.expenses && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
        await Promise.allSettled(data.expenses.map((e) => setDoc(doc(db, 'expenses', String(e.id)), e, { merge: true })));
      }
      if (data.expenseFunds && Array.isArray(data.expenseFunds)) {
        setExpenseFunds(data.expenseFunds);
        await Promise.allSettled(data.expenseFunds.map((f) => setDoc(doc(db, 'expense_funds', String(f.id)), f, { merge: true })));
      }
      if (data.expenseCategories && Array.isArray(data.expenseCategories)) {
        setExpenseCategories(data.expenseCategories);
      }

      fetchFirebaseData();
      return { success: true, message: 'All Store Data Successfully Restored to Cloud Database!' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Invalid Backup JSON File format or database sync error.' };
    }
  };

  const resetAllDataToZero = async () => {
    try {
      // 1. Wipe store_items, usage_logs, and all operational collections from Firebase Firestore (including Shop)
      const collectionsToWipe = [
        'store_items',
        'usage_logs',
        'machine_sales',
        'machine_repairs',
        'machine_customers',
        'customer_payments',
        'vendor_payments',
        'store_customers',
        'store_payments',
        'vendors',
        'expenses',
        'expense_funds',
        'expense_categories',
        'audit_logs',
        'shop_items',
        'shop_usage_logs',
        'shop_vendors',
        'shop_categories',
        'shop_sales',
        'shop_customer_payments',
        'shop_master_item_names'
      ];
      for (const colName of collectionsToWipe) {
        try {
          const snap = await getDocs(collection(db, colName));
          await Promise.allSettled(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch (wipeErr) {
          console.warn('Wipe collection warning:', colName, wipeErr);
        }
      }

      // 2. Clear all local browser storage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Clear UI State immediately
      setItems([]);
      setUsageLogs([]);
      setVendors([]);
      setMachineSales([]);
      setMachineRepairs([]);
      setMachineCustomers([]);
      setCustomerPayments([]);
      setVendorPayments([]);
      setStoreCustomers([]);
      setStorePayments([]);
      setExpenses([]);
      setExpenseFunds([]);

      // 4. Refetch live state from Supabase immediately so the UI reflects an empty state across all browsers
      fetchFirebaseData();

      return { success: true, message: 'All Cloud Database records & Local Storage wiped successfully to 0!' };
    } catch (err) {
      console.error('Reset Data Error:', err);
      return { success: false, message: 'Wipe error: ' + err.message };
    }
  };

  // 13. Memoized Speed Optimizations & Computed Metrics
  const totalInventoryCount = useMemo(
    () => items.reduce((acc, i) => acc + (Number(i.remainingStock) || 0), 0),
    [items]
  );

  const totalValuation = useMemo(
    () => items.reduce((acc, i) => acc + ((Number(i.remainingStock) || 0) * (Number(i.unitPrice) || 0)), 0),
    [items]
  );

  const todayLogs = useMemo(() => {
    const todayStr = new Date().toDateString();
    return usageLogs.filter((log) => {
      if (!log) return false;
      if (log.time && String(log.time).toLowerCase().includes('today')) return true;
      const isoStr = log.dateISO || log.timestamp;
      if (isoStr) {
        const parsed = new Date(isoStr);
        if (!isNaN(parsed.getTime())) {
          return parsed.toDateString() === todayStr;
        }
      }
      return true;
    });
  }, [usageLogs]);

  const todayStockInQty = useMemo(
    () => todayLogs.filter((log) => log.type && log.type.toUpperCase().includes('IN')).reduce((acc, log) => acc + (parseInt(log.qtyUsed) || 0), 0),
    [todayLogs]
  );

  const todayStockOutQty = useMemo(
    () => todayLogs.filter((log) => log.type && log.type.toUpperCase().includes('OUT')).reduce((acc, log) => acc + (parseInt(log.qtyUsed) || 0), 0),
    [todayLogs]
  );

  const lowStockAlerts = useMemo(
    () => items.filter((i) => (Number(i.remainingStock) || 0) <= (Number(i.minLevel) || 0)),
    [items]
  );

  // 14. Memoized Context Provider Value (Prevents Unnecessary Cascade Re-renders)
  const contextValue = useMemo(
    () => ({
      items,
      usageLogs,
      vendors,
      categories,
      masterItemNames,
      machineSales,
      machineModels,
      machineRecipes,
      machineRepairs,
      machineCustomers,
      customerPayments,
      vendorPayments,
      storeCustomers,
      storePayments,
      addStoreCustomer,
      updateStoreCustomer,
      deleteStoreCustomer,
      addStorePayment,
      deleteStorePayment,
      addMachineModel,
      saveMachineRecipe,
      deleteMachineRecipe,
      assembleMachine,
      addMachineCustomer,
      updateMachineCustomer,
      deleteMachineCustomer,
      addCustomerPayment,
      deleteCustomerPayment,
      addVendorPayment,
      deleteVendorPayment,
      exportFullBackupData,
      importFullBackupData,
      resetAllDataToZero,
      totalInventoryCount,
      totalValuation,
      dailyUsageCount: todayStockOutQty,
      todayStockInQty,
      todayStockOutQty,
      lowStockAlerts,
      issueStock,
      receiveStock,
      addNewItem,
      updateItem,
      deleteItem,
      deleteMultipleItems,
      cleanDuplicateItems,
      addVendor,
      updateVendor,
      deleteVendor,
      deleteMultipleVendors,
      addCategory,
      updateCategory,
      deleteCategory,
      deleteMultipleCategories,
      deleteLog,
      updateLog,
      deleteMultipleLogs,
      addMasterItemName,
      updateMasterItemName,
      deleteMasterItemName,
      deleteMultipleMasterItemNames,
      defaultMasterItemNames,
      defaultStoreItems,
      restoreDefaultMasterItemNames,
      restoreDefaultStoreItems,
      addMachineSale,
      updateMachineSale,
      deleteMachineSale,
      deleteMultipleMachineSales,
      addMachineModel,
      addMachineRepair,
      updateMachineRepair,
      deleteMachineRepair,
      auditLogs,
      logActivity,
      deleteAuditLog,
      clearAuditLogs,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      expenses,
      expenseFunds,
      addExpense,
      deleteExpense,
      addExpenseFund,
      updateExpenseFund,
      deleteExpenseFund,
      expenseCategories,
      addExpenseCategory,
      deleteExpenseCategory,
      fetchFirebaseData,
      shopSales: machineSales,
      addShopSale: addMachineSale,
      updateShopSale: updateMachineSale,
      deleteShopSale: deleteMachineSale,
      deleteMultipleShopSales: deleteMultipleMachineSales
    }),
    [
      items,
      usageLogs,
      vendors,
      categories,
      masterItemNames,
      machineSales,
      machineModels,
      machineRecipes,
      machineRepairs,
      machineCustomers,
      customerPayments,
      vendorPayments,
      storeCustomers,
      storePayments,
      expenses,
      expenseFunds,
      expenseCategories,
      totalInventoryCount,
      totalValuation,
      todayStockInQty,
      todayStockOutQty,
      lowStockAlerts,
      auditLogs,
      notifications
    ]
  );

  return (
    <StoreInventoryContext.Provider value={contextValue}>
      {children}
    </StoreInventoryContext.Provider>
  );
}

StoreInventoryProvider.propTypes = {
  children: PropTypes.node
};

export const useStoreInventory = () => useContext(StoreInventoryContext);
