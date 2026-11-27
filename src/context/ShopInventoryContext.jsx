import PropTypes from 'prop-types';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { StoreInventoryContext } from 'context/StoreInventoryContext';
import { defaultMasterItemNames } from 'data/factoryStoreData';
import { db } from 'api/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { getTodayISO, isRecordInDateRange } from 'utils/ledgerHelpers';

const STORAGE_KEYS = {
  items: 'rehmat_shop_items_v2',
  usageLogs: 'rehmat_shop_usage_logs_v2',
  vendors: 'rehmat_shop_vendors_v2',
  categories: 'rehmat_shop_categories_v2',
  masterItemNames: 'rehmat_shop_master_item_names_v2',
  sales: 'rehmat_shop_sales_v2',
  payments: 'rehmat_shop_customer_payments_v2',
  customers: 'rehmat_shop_customers_v1'
};

const DELETED_KEYS = {
  items: 'rehmat_deleted_shop_item_ids',
  usageLogs: 'rehmat_deleted_shop_log_ids',
  vendors: 'rehmat_deleted_shop_vendor_ids',
  sales: 'rehmat_deleted_shop_sale_ids',
  payments: 'rehmat_deleted_shop_payment_ids',
  customers: 'rehmat_deleted_shop_customer_ids'
};

const PENDING_KEYS = {
  sales: 'rehmat_pending_shop_sale_ids',
  payments: 'rehmat_pending_shop_payment_ids',
  customers: 'rehmat_pending_shop_customer_ids'
};

const safeParseJSON = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.error(`SafeJSON Error parsing ${key}:`, err);
    return fallback;
  }
};

const persistJSON = (key, value) => {
  try {
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(() => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.warn(`LocalStorage write warning (${key}):`, e);
        }
      });
    } else {
      setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
          console.warn(`LocalStorage write warning (${key}):`, e);
        }
      }, 0);
    }
  } catch (err) {
    console.warn(`LocalStorage write warning (${key}):`, err);
  }
};

const addTrackedId = (key, id) => {
  const existing = safeParseJSON(key, []).map(String);
  persistJSON(key, Array.from(new Set([...existing, String(id)])));
};

const removeTrackedId = (key, id) => {
  const existing = safeParseJSON(key, []).map(String);
  if (existing.length === 0) return;
  persistJSON(
    key,
    existing.filter((item) => item !== String(id))
  );
};

const syncWithTimeout = (promise, ms = 1200) => Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);

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

export const defaultShopCategories = [
  { id: 'SHOP-CAT-1', name: 'General', description: 'General Store & Counter Items' },
  { id: 'SHOP-CAT-2', name: 'Lawn Mowers', description: 'Complete Machines & Cutters' },
  { id: 'SHOP-CAT-3', name: 'Blades & Cutters', description: 'Cutting Blades & Rotors' },
  { id: 'SHOP-CAT-4', name: 'Engine Parts', description: 'Motors, Spark Plugs & Filters' },
  { id: 'SHOP-CAT-5', name: 'Oils & Lubricants', description: 'Engine Oils & Greases' },
  { id: 'SHOP-CAT-6', name: 'Spare Parts', description: 'Counter Spare Parts' },
  { id: 'SHOP-CAT-7', name: 'Accessories', description: 'Shop Accessories & Tools' }
];

export const defaultShopItems = [
  {
    id: 'SHP-ITEM-1',
    name: 'Honda HRJ216 Lawn Mower 5.5HP',
    itemCode: 'SHP-MOW-01',
    category: 'Lawn Mowers',
    unit: 'Unit',
    totalStock: 5,
    minLevel: 2,
    unitPrice: 145000,
    rackLocation: 'Shop Floor Display',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-2',
    name: 'Rehmat 20" Rotary Cutting Blade',
    itemCode: 'SHP-BLD-02',
    category: 'Blades & Cutters',
    unit: 'PCS',
    totalStock: 28,
    minLevel: 5,
    unitPrice: 3500,
    rackLocation: 'Shelf A-1',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-3',
    name: 'NGK Spark Plug BPR6ES',
    itemCode: 'SHP-ENG-03',
    category: 'Engine Parts',
    unit: 'PCS',
    totalStock: 45,
    minLevel: 10,
    unitPrice: 850,
    rackLocation: 'Counter Drawer 2',
    imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-4',
    name: '4-Stroke Lawn Mower Engine Oil 20W-50',
    itemCode: 'SHP-OIL-04',
    category: 'Oils & Lubricants',
    unit: 'Bottle',
    totalStock: 32,
    minLevel: 8,
    unitPrice: 1650,
    rackLocation: 'Oil Rack B',
    imageUrl: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-5',
    name: 'Heavy Duty 8" Rubber Ball-Bearing Wheel',
    itemCode: 'SHP-SPR-05',
    category: 'Spare Parts',
    unit: 'PCS',
    totalStock: 16,
    minLevel: 4,
    unitPrice: 2200,
    rackLocation: 'Shelf C-3',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-6',
    name: 'Air Filter Cartridge for Briggs & Stratton',
    itemCode: 'SHP-ENG-06',
    category: 'Engine Parts',
    unit: 'PCS',
    totalStock: 24,
    minLevel: 5,
    unitPrice: 1450,
    rackLocation: 'Shelf A-3',
    imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-7',
    name: 'Nylon Grass Trimmer Line 3.0mm (50m Roll)',
    itemCode: 'SHP-ACC-07',
    category: 'Accessories',
    unit: 'Roll',
    totalStock: 30,
    minLevel: 6,
    unitPrice: 1850,
    rackLocation: 'Counter Rack',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-8',
    name: 'Pull Starter Recoil Assembly Kit',
    itemCode: 'SHP-ENG-08',
    category: 'Engine Parts',
    unit: 'Set',
    totalStock: 12,
    minLevel: 3,
    unitPrice: 4200,
    rackLocation: 'Shelf B-2',
    imageUrl: 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-9',
    name: 'Rehmat Electric Lawn Cutter 18" 3HP',
    itemCode: 'SHP-MOW-09',
    category: 'Lawn Mowers',
    unit: 'Unit',
    totalStock: 6,
    minLevel: 2,
    unitPrice: 68000,
    rackLocation: 'Shop Floor Display',
    imageUrl: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'SHP-ITEM-10',
    name: 'Safety Grass Catcher Bag 60L',
    itemCode: 'SHP-ACC-10',
    category: 'Accessories',
    unit: 'PCS',
    totalStock: 14,
    minLevel: 3,
    unitPrice: 4800,
    rackLocation: 'Shelf D-1',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80'
  }
];

export function ShopInventoryProvider({ children }) {
  const [items, setItems] = useState(() => safeParseJSON(STORAGE_KEYS.items, []));
  const [usageLogs, setUsageLogs] = useState(() => safeParseJSON(STORAGE_KEYS.usageLogs, []));
  const [vendors, setVendors] = useState(() => safeParseJSON(STORAGE_KEYS.vendors, []));
  const [categories, setCategories] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.categories);
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch {
        return defaultShopCategories;
      }
    }
    return defaultShopCategories;
  });

  const [masterItemNames, setMasterItemNames] = useState(() => {
    const saved = safeParseJSON(STORAGE_KEYS.masterItemNames, null);
    if (Array.isArray(saved) && saved.length > 0) return saved;
    const storeMaster = safeParseJSON('rehmat_store_master_item_names_v2', null);
    if (Array.isArray(storeMaster) && storeMaster.length > 0) return storeMaster;
    return defaultMasterItemNames;
  });

  const [shopSales, setShopSales] = useState(() => safeParseJSON(STORAGE_KEYS.sales, []));
  const [shopCustomerPayments, setShopCustomerPayments] = useState(() => safeParseJSON(STORAGE_KEYS.payments, []));
  const [shopCustomers, setShopCustomers] = useState(() => safeParseJSON(STORAGE_KEYS.customers, []));

  const fetchShopFirebaseData = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const deletedItems = new Set(safeParseJSON(DELETED_KEYS.items, []).map(String));
      const deletedLogs = new Set(safeParseJSON(DELETED_KEYS.usageLogs, []).map(String));
      const deletedVendors = new Set(safeParseJSON(DELETED_KEYS.vendors, []).map(String));
      const deletedSales = new Set(safeParseJSON(DELETED_KEYS.sales, []).map(String));
      const deletedPayments = new Set(safeParseJSON(DELETED_KEYS.payments, []).map(String));
      const deletedCustomers = new Set(safeParseJSON(DELETED_KEYS.customers, []).map(String));

      // Flush any locally queued offline Shop sales, payments, or customers before fetching
      const flushPendingCollection = async (pendingKey, storageKey, deletedSet, colName) => {
        const pendingIds = safeParseJSON(pendingKey, []).map(String);
        if (pendingIds.length === 0) return;
        const localRows = safeParseJSON(storageKey, []);
        await Promise.allSettled(
          pendingIds.map(async (id) => {
            const row = localRows.find((r) => String(r.id) === id);
            if (!row || deletedSet.has(id)) {
              removeTrackedId(pendingKey, id);
              return;
            }
            await setDoc(doc(db, colName, id), row, { merge: true });
            removeTrackedId(pendingKey, id);
          })
        );
      };

      await Promise.allSettled([
        flushPendingCollection(PENDING_KEYS.sales, STORAGE_KEYS.sales, deletedSales, 'shop_sales'),
        flushPendingCollection(PENDING_KEYS.payments, STORAGE_KEYS.payments, deletedPayments, 'shop_customer_payments'),
        flushPendingCollection(PENDING_KEYS.customers, STORAGE_KEYS.customers, deletedCustomers, 'shop_customers')
      ]);

      const [itemsSnap, logsSnap, vendorsSnap, catsSnap, salesSnap, paySnap, custSnap] = await Promise.allSettled([
        getDocs(collection(db, 'shop_items')),
        getDocs(collection(db, 'shop_usage_logs')),
        getDocs(collection(db, 'shop_vendors')),
        getDocs(collection(db, 'shop_categories')),
        getDocs(collection(db, 'shop_sales')),
        getDocs(collection(db, 'shop_customer_payments')),
        getDocs(collection(db, 'shop_customers'))
      ]);

      const mergeWithPending = (remoteDocs, deletedSet, localStorageKey, pendingKey) => {
        const cleanRemote = remoteDocs.filter((docItem) => !deletedSet.has(String(docItem.id)));
        const remoteIdSet = new Set(cleanRemote.map((d) => String(d.id)));
        const pendingIds = pendingKey ? safeParseJSON(pendingKey, []).map(String) : [];
        const stillPending = pendingIds.filter((id) => !remoteIdSet.has(id) && !deletedSet.has(id));
        if (pendingKey && stillPending.length !== pendingIds.length) {
          persistJSON(pendingKey, stillPending);
        }
        const pendingSet = new Set(stillPending);
        const localRecords = safeParseJSON(localStorageKey, []);
        const unsyncedLocal = localRecords.filter((rec) => pendingSet.has(String(rec.id)) && !remoteIdSet.has(String(rec.id)));
        return [...unsyncedLocal, ...cleanRemote];
      };

      if (itemsSnap.status === 'fulfilled' && itemsSnap.value?.docs) {
        const fbItems = itemsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() })).filter((i) => !deletedItems.has(String(i.id)));
        if (fbItems.length > 0) {
          setItems(fbItems);
          persistJSON(STORAGE_KEYS.items, fbItems);
        }
      }

      if (logsSnap.status === 'fulfilled' && logsSnap.value?.docs) {
        const fbLogs = logsSnap.value.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((l) => !deletedLogs.has(String(l.id)))
          .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        if (fbLogs.length > 0) {
          setUsageLogs(fbLogs);
          persistJSON(STORAGE_KEYS.usageLogs, fbLogs);
        }
      }

      if (vendorsSnap.status === 'fulfilled' && vendorsSnap.value?.docs) {
        const fbVendors = vendorsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() })).filter((v) => !deletedVendors.has(String(v.id)));
        if (fbVendors.length > 0) {
          setVendors(fbVendors);
          persistJSON(STORAGE_KEYS.vendors, fbVendors);
        }
      }

      if (catsSnap.status === 'fulfilled' && !catsSnap.value.empty) {
        const fbCats = catsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategories(fbCats);
        persistJSON(STORAGE_KEYS.categories, fbCats);
      }

      if (salesSnap.status === 'fulfilled' && salesSnap.value?.docs) {
        const fbSales = salesSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
        const mergedSales = mergeWithPending(fbSales, deletedSales, STORAGE_KEYS.sales, PENDING_KEYS.sales).sort(
          (a, b) => new Date(b.dateISO || b.createdAt || 0) - new Date(a.dateISO || a.createdAt || 0)
        );
        if (mergedSales.length > 0) {
          setShopSales(mergedSales);
          persistJSON(STORAGE_KEYS.sales, mergedSales);
        }
      }

      if (paySnap.status === 'fulfilled' && paySnap.value?.docs) {
        const fbPay = paySnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
        const mergedPayments = mergeWithPending(fbPay, deletedPayments, STORAGE_KEYS.payments, PENDING_KEYS.payments).sort(
          (a, b) => new Date(b.createdAt || b.dateISO || 0) - new Date(a.createdAt || a.dateISO || 0)
        );
        if (mergedPayments.length > 0) {
          setShopCustomerPayments(mergedPayments);
          persistJSON(STORAGE_KEYS.payments, mergedPayments);
        }
      }

      if (custSnap.status === 'fulfilled' && custSnap.value?.docs) {
        const fbCustomers = custSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
        const mergedCustomers = mergeWithPending(fbCustomers, deletedCustomers, STORAGE_KEYS.customers, PENDING_KEYS.customers).sort((a, b) =>
          (a.name || '').localeCompare(b.name || '')
        );
        if (mergedCustomers.length > 0) {
          setShopCustomers(mergedCustomers);
          persistJSON(STORAGE_KEYS.customers, mergedCustomers);
        }
      }
    } catch (err) {
      console.warn('Firebase Shop Data Sync notice (falling back to local data):', err);
    }
  }, []);

  useEffect(() => {
    fetchShopFirebaseData();
    let lastFocusFetch = Date.now();
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusFetch > 120000) {
        lastFocusFetch = now;
        fetchShopFirebaseData();
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', fetchShopFirebaseData);
    const interval = setInterval(fetchShopFirebaseData, 90000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', fetchShopFirebaseData);
      clearInterval(interval);
    };
  }, [fetchShopFirebaseData]);

  // ── Receive Stock (Stock In) ───────────────────────────────────────────
  const receiveStock = async (
    itemIdOrObj,
    qtyReceivedParam,
    supplierNameParam = 'Vendor Shipment',
    refNoParam = '',
    unitPriceParam = 0,
    categoryParam = 'General',
    imageUrlParam = ''
  ) => {
    let targetItem = null;
    let itemId = itemIdOrObj;
    const qtyReceived = parseInt(qtyReceivedParam, 10) || 1;
    const supplierName = supplierNameParam || 'Vendor Shipment';
    const refNo = refNoParam || `PO-${Math.floor(1000 + Math.random() * 9000)}`;
    const unitPrice = parseFloat(unitPriceParam) || 0;
    let category = categoryParam || 'General';
    let imageUrl = imageUrlParam || '';

    if (typeof itemIdOrObj === 'object' && itemIdOrObj !== null) {
      targetItem = itemIdOrObj;
      itemId = targetItem.id || targetItem.itemCode || targetItem.name;
      category = targetItem.category || category;
      if (!imageUrl && targetItem.imageUrl) imageUrl = targetItem.imageUrl;
    } else {
      targetItem = items.find(
        (i) => i.id === itemId || i.itemCode === itemId || (i.name || '').toLowerCase() === (itemId || '').toLowerCase()
      );
    }

    const syncTasks = [];

    if (!targetItem) {
      targetItem = {
        id: generateUUID(),
        name: String(itemId),
        itemCode: `SHP-${Math.floor(100 + Math.random() * 900)}`,
        category,
        totalStock: 0,
        unitPrice,
        unit: 'PCS',
        minLevel: 5,
        rackLocation: 'Shop Counter',
        imageUrl
      };
      setItems((prev) => {
        const updated = [targetItem, ...prev];
        persistJSON(STORAGE_KEYS.items, updated);
        return updated;
      });
      syncTasks.push(
        setDoc(doc(db, 'shop_items', String(targetItem.id)), targetItem, { merge: true }).catch((e) =>
          console.warn('Firebase shop_items setDoc error:', e)
        )
      );
    }

    const priceToRecord = unitPrice > 0 ? unitPrice : targetItem.unitPrice || 0;
    const lineTotal = qtyReceived * priceToRecord;
    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const logId = generateUUID();

    const newLog = {
      id: logId,
      time: timeStr,
      timestamp: now.toISOString(),
      type: 'Stock In',
      itemName: targetItem.name,
      itemCode: targetItem.itemCode || `SHP-${Math.floor(100 + Math.random() * 900)}`,
      category: targetItem.category || category,
      qtyUsed: qtyReceived,
      usedBy: supplierName,
      department: 'Shop Counter',
      issuedBy: 'Shop Keeper',
      unitPrice: priceToRecord,
      lineTotal,
      notes: `Ref: ${refNo}`
    };

    const nextStock = (parseInt(targetItem.totalStock, 10) || 0) + qtyReceived;
    const nextPrice = priceToRecord > 0 ? priceToRecord : targetItem.unitPrice || 0;

    setItems((prev) => {
      const updated = prev.map((i) => {
        if (i.id === targetItem.id || i.name.toLowerCase() === targetItem.name.toLowerCase()) {
          return {
            ...i,
            totalStock: (parseInt(i.totalStock, 10) || 0) + qtyReceived,
            unitPrice: priceToRecord > 0 ? priceToRecord : i.unitPrice || 0,
            ...(imageUrl ? { imageUrl } : {})
          };
        }
        return i;
      });
      persistJSON(STORAGE_KEYS.items, updated);
      return updated;
    });

    setUsageLogs((prev) => {
      const updated = [newLog, ...prev];
      persistJSON(STORAGE_KEYS.usageLogs, updated);
      return updated;
    });

    syncTasks.push(
      setDoc(
        doc(db, 'shop_items', String(targetItem.id)),
        {
          ...targetItem,
          totalStock: nextStock,
          unitPrice: nextPrice,
          ...(imageUrl ? { imageUrl } : {})
        },
        { merge: true }
      ).catch((e) => console.warn('Firebase shop receiveStock item sync error:', e)),
      setDoc(doc(db, 'shop_usage_logs', String(logId)), newLog, { merge: true }).catch((e) =>
        console.warn('Firebase shop receiveStock log sync error:', e)
      )
    );

    await syncWithTimeout(Promise.allSettled(syncTasks));
    return true;
  };

  // ── Issue Stock (Stock Out / Sale Deduction) ───────────────────────────
  const issueStock = async (
    itemIdOrObj,
    qtyUsedParam,
    usedByParam,
    departmentParam = 'Sales / Counter',
    issuedByParam = 'Shop Keeper',
    notesParam = '',
    unitPriceParam = 0,
    categoryParam = 'General'
  ) => {
    let itemId = itemIdOrObj;
    let qtyUsed = parseInt(qtyUsedParam, 10) || 1;
    let usedBy = usedByParam || 'Walk-in Customer';
    let department = departmentParam || 'Sales / Counter';
    let issuedBy = issuedByParam || 'Shop Keeper';
    let notes = notesParam || '';
    let unitPrice = parseFloat(unitPriceParam) || 0;
    let category = categoryParam || 'General';

    if (typeof itemIdOrObj === 'object' && itemIdOrObj !== null) {
      itemId = itemIdOrObj.itemId || itemIdOrObj.id || itemIdOrObj.itemName || itemIdOrObj.itemCode;
      qtyUsed = parseInt(itemIdOrObj.qtyUsed, 10) || qtyUsed;
      usedBy = itemIdOrObj.usedBy || usedBy;
      department = itemIdOrObj.department || department;
      issuedBy = itemIdOrObj.issuedBy || issuedBy;
      notes = itemIdOrObj.notes || notes;
      unitPrice = parseFloat(itemIdOrObj.unitPrice) || unitPrice;
      category = itemIdOrObj.category || category;
    }

    const targetItem = items.find(
      (i) => i.id === itemId || i.itemCode === itemId || (i.name || '').toLowerCase() === (itemId || '').toLowerCase()
    );
    if (!targetItem) return false;

    const currentStock = parseInt(targetItem.totalStock, 10) || 0;
    if (currentStock < qtyUsed) return false;

    const newStock = Math.max(0, currentStock - qtyUsed);
    const finalPrice = unitPrice > 0 ? unitPrice : targetItem.unitPrice || 0;
    const lineTotal = qtyUsed * finalPrice;
    const now = new Date();
    const timeStr = `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const logId = generateUUID();

    const newLog = {
      id: logId,
      time: timeStr,
      timestamp: now.toISOString(),
      type: 'Stock Out',
      itemName: targetItem.name,
      itemCode: targetItem.itemCode || `SHP-${Math.floor(100 + Math.random() * 900)}`,
      category: targetItem.category || category,
      qtyUsed,
      usedBy,
      department,
      issuedBy,
      unitPrice: finalPrice,
      lineTotal,
      notes
    };

    setItems((prev) => {
      const updated = prev.map((i) => (i.id === targetItem.id ? { ...i, totalStock: newStock } : i));
      persistJSON(STORAGE_KEYS.items, updated);
      return updated;
    });

    setUsageLogs((prev) => {
      const updated = [newLog, ...prev];
      persistJSON(STORAGE_KEYS.usageLogs, updated);
      return updated;
    });

    await syncWithTimeout(
      Promise.allSettled([
        setDoc(doc(db, 'shop_items', String(targetItem.id)), { ...targetItem, totalStock: newStock }, { merge: true }),
        setDoc(doc(db, 'shop_usage_logs', String(logId)), newLog, { merge: true })
      ])
    ).catch((e) => console.warn('Firebase Shop issueStock sync error:', e));

    return true;
  };

  // ── Item Management ────────────────────────────────────────────────────
  const addNewItem = async (newItemData) => {
    const id = generateUUID();
    const itemCode = newItemData.itemCode || `SHP-${Math.floor(100 + Math.random() * 900)}`;
    const fullItem = {
      id,
      name: (newItemData.name || '').trim(),
      specification: (newItemData.specification || '').trim(),
      itemCode,
      category: newItemData.category || 'General',
      unit: newItemData.unit || 'PCS',
      totalStock: parseInt(newItemData.totalStock, 10) || 0,
      minLevel: parseInt(newItemData.minLevel, 10) || 5,
      unitPrice: parseFloat(newItemData.unitPrice) || 0,
      rackLocation: newItemData.rackLocation || 'Shop Shelf A',
      imageUrl: newItemData.imageUrl || ''
    };

    removeTrackedId(DELETED_KEYS.items, id);
    setItems((prev) => {
      const updated = [fullItem, ...prev];
      persistJSON(STORAGE_KEYS.items, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(doc(db, 'shop_items', String(id)), fullItem, { merge: true }).catch((e) =>
        console.warn('Firebase Shop addNewItem error:', e)
      )
    );

    return fullItem;
  };

  const updateItem = async (itemId, updatedData) => {
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === itemId ? { ...i, ...updatedData } : i));
      persistJSON(STORAGE_KEYS.items, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(doc(db, 'shop_items', String(itemId)), updatedData, { merge: true }).catch((e) =>
        console.warn('Firebase Shop updateItem error:', e)
      )
    );
  };

  const deleteItem = async (itemId) => {
    const strId = String(itemId);
    addTrackedId(DELETED_KEYS.items, strId);
    setItems((prev) => {
      const updated = prev.filter((i) => String(i.id) !== strId);
      persistJSON(STORAGE_KEYS.items, updated);
      return updated;
    });

    try {
      await syncWithTimeout(deleteDoc(doc(db, 'shop_items', strId)));
    } catch (e) {
      console.warn('Firebase Shop deleteItem error:', e);
    }
  };

  const cleanDuplicateItems = () => {};

  const seedShopDemoData = async () => {
    persistJSON(DELETED_KEYS.items, []);
    setItems(defaultShopItems);
    persistJSON(STORAGE_KEYS.items, defaultShopItems);
    try {
      await syncWithTimeout(Promise.allSettled(defaultShopItems.map((it) => setDoc(doc(db, 'shop_items', String(it.id)), it, { merge: true }))));
    } catch (e) {
      console.warn('Firebase seed error:', e);
    }
  };

  // ── Log Management ─────────────────────────────────────────────────────
  const deleteLog = async (logId) => {
    const strId = String(logId);
    addTrackedId(DELETED_KEYS.usageLogs, strId);
    setUsageLogs((prev) => {
      const updated = prev.filter((l) => String(l.id) !== strId);
      persistJSON(STORAGE_KEYS.usageLogs, updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'shop_usage_logs', strId));
    } catch (e) {
      console.warn('Firebase Shop deleteLog error:', e);
    }
  };

  const updateLog = async (logId, updatedData) => {
    setUsageLogs((prev) => {
      const updated = prev.map((l) => (l.id === logId ? { ...l, ...updatedData } : l));
      persistJSON(STORAGE_KEYS.usageLogs, updated);
      return updated;
    });
    try {
      await setDoc(doc(db, 'shop_usage_logs', String(logId)), updatedData, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop updateLog error:', e);
    }
  };

  const deleteMultipleLogs = async (logIds = []) => {
    const idSet = new Set(logIds.map(String));
    logIds.forEach((id) => addTrackedId(DELETED_KEYS.usageLogs, id));
    setUsageLogs((prev) => {
      const updated = prev.filter((l) => !idSet.has(String(l.id)));
      persistJSON(STORAGE_KEYS.usageLogs, updated);
      return updated;
    });
    try {
      await Promise.allSettled(logIds.map((id) => deleteDoc(doc(db, 'shop_usage_logs', String(id)))));
    } catch (e) {
      console.warn('Firebase Shop deleteMultipleLogs error:', e);
    }
  };

  // ── Vendor / Supplier Management ───────────────────────────────────────
  const addVendor = async (vendorData) => {
    const id = generateUUID();
    const newV = { id, ...vendorData };
    setVendors((prev) => {
      const updated = [newV, ...prev];
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });
    try {
      await syncWithTimeout(setDoc(doc(db, 'shop_vendors', String(id)), newV, { merge: true }));
    } catch (e) {
      console.warn('Firebase Shop addVendor error:', e);
    }
  };

  const updateVendor = async (id, updatedData) => {
    setVendors((prev) => {
      const updated = prev.map((v) => (v.id === id ? { ...v, ...updatedData } : v));
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });
    try {
      await syncWithTimeout(setDoc(doc(db, 'shop_vendors', String(id)), updatedData, { merge: true }));
    } catch (e) {
      console.warn('Firebase Shop updateVendor error:', e);
    }
  };

  const deleteVendor = async (id) => {
    const strId = String(id);
    addTrackedId(DELETED_KEYS.vendors, strId);
    setVendors((prev) => {
      const updated = prev.filter((v) => String(v.id) !== strId);
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'shop_vendors', strId));
    } catch (e) {
      console.warn('Firebase Shop deleteVendor error:', e);
    }
  };

  const deleteMultipleVendors = async (ids = []) => {
    const idSet = new Set(ids.map(String));
    ids.forEach((id) => addTrackedId(DELETED_KEYS.vendors, id));
    setVendors((prev) => {
      const updated = prev.filter((v) => !idSet.has(String(v.id)));
      persistJSON(STORAGE_KEYS.vendors, updated);
      return updated;
    });
    try {
      await Promise.allSettled(ids.map((id) => deleteDoc(doc(db, 'shop_vendors', String(id)))));
    } catch (e) {
      console.warn('Firebase Shop deleteMultipleVendors error:', e);
    }
  };

  // ── Category Management ────────────────────────────────────────────────
  const addCategory = async (catData) => {
    const id = generateUUID();
    const newCat = { id, ...catData };
    setCategories((prev) => {
      const updated = [...prev, newCat];
      persistJSON(STORAGE_KEYS.categories, updated);
      return updated;
    });
    try {
      await setDoc(doc(db, 'shop_categories', String(id)), newCat, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop addCategory error:', e);
    }
  };

  const updateCategory = async (id, updatedData) => {
    setCategories((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c));
      persistJSON(STORAGE_KEYS.categories, updated);
      return updated;
    });
    try {
      await setDoc(doc(db, 'shop_categories', String(id)), updatedData, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop updateCategory error:', e);
    }
  };

  const deleteCategory = async (id) => {
    setCategories((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      persistJSON(STORAGE_KEYS.categories, updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'shop_categories', String(id)));
    } catch (e) {
      console.warn('Firebase Shop deleteCategory error:', e);
    }
  };

  const deleteMultipleCategories = async (ids = []) => {
    const idSet = new Set(ids);
    setCategories((prev) => {
      const updated = prev.filter((c) => !idSet.has(c.id));
      persistJSON(STORAGE_KEYS.categories, updated);
      return updated;
    });
    try {
      await Promise.allSettled(ids.map((id) => deleteDoc(doc(db, 'shop_categories', String(id)))));
    } catch (e) {
      console.warn('Firebase Shop deleteMultipleCategories error:', e);
    }
  };

  // ── Shop Customer Directory CRUD ───────────────────────────────────────
  const addShopCustomer = async (customerData) => {
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

    removeTrackedId(DELETED_KEYS.customers, custId);
    addTrackedId(PENDING_KEYS.customers, custId);

    setShopCustomers((prev) => {
      const updated = [newCustomer, ...prev].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      persistJSON(STORAGE_KEYS.customers, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(doc(db, 'shop_customers', String(custId)), newCustomer, { merge: true })
        .then(() => removeTrackedId(PENDING_KEYS.customers, custId))
        .catch((e) => console.warn('Firebase shop_customers sync warning:', e))
    );

    return newCustomer;
  };

  const updateShopCustomer = async (id, updatedFields) => {
    let saved = null;
    setShopCustomers((prev) => {
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
      persistJSON(STORAGE_KEYS.customers, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(doc(db, 'shop_customers', String(id)), updatedFields, { merge: true }).catch((e) =>
        console.warn('Firebase updateShopCustomer warning:', e)
      )
    );
    return saved;
  };

  const deleteShopCustomer = async (id) => {
    const strId = String(id);
    addTrackedId(DELETED_KEYS.customers, strId);
    removeTrackedId(PENDING_KEYS.customers, strId);
    setShopCustomers((prev) => {
      const updated = prev.filter((c) => String(c.id) !== strId);
      persistJSON(STORAGE_KEYS.customers, updated);
      return updated;
    });

    try {
      await syncWithTimeout(deleteDoc(doc(db, 'shop_customers', strId)));
    } catch (e) {
      console.warn('Firebase deleteShopCustomer warning:', e);
    }
  };

  // ── Shop Sales & Invoices Actions ──────────────────────────────────────
  const addShopSale = async (saleData) => {
    const saleId = saleData.id || generateUUID();
    const now = new Date();
    const totalAmt = Math.max(0, parseFloat(saleData.totalAmount ?? saleData.grandTotal ?? saleData.subTotal) || 0);
    const pMethod = saleData.paymentMethod || 'Cash';
    const isCredit = String(pMethod).toLowerCase().includes('credit');
    const hasExplicitPaid = saleData.paidAmount !== undefined && saleData.paidAmount !== null && saleData.paidAmount !== '';
    const paidAmt = hasExplicitPaid ? Math.max(0, parseFloat(saleData.paidAmount) || 0) : isCredit ? 0 : totalAmt;
    const balanceAmt = Math.max(0, totalAmt - paidAmt);
    const paymentStatus = totalAmt > 0 && balanceAmt <= 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Unpaid';

    const newSale = {
      ...saleData,
      id: saleId,
      totalAmount: totalAmt,
      paidAmount: paidAmt,
      balanceAmount: balanceAmt,
      paymentStatus,
      createdAt: now.toISOString(),
      dateISO: saleData.dateISO || now.toISOString()
    };

    removeTrackedId(DELETED_KEYS.sales, saleId);
    addTrackedId(PENDING_KEYS.sales, saleId);

    setShopSales((prev) => {
      const updated = [newSale, ...prev];
      persistJSON(STORAGE_KEYS.sales, updated);
      return updated;
    });

    await syncWithTimeout(
      setDoc(doc(db, 'shop_sales', String(saleId)), newSale, { merge: true })
        .then(() => removeTrackedId(PENDING_KEYS.sales, saleId))
        .catch((err) => console.warn('Firebase shop_sales sync warning:', err))
    );

    return newSale;
  };

  const updateShopSale = async (saleId, updatedData) => {
    const stringId = String(saleId);
    const existing = shopSales.find((s) => String(s.id) === stringId);
    const now = new Date();

    const computeNext = (s) => {
      const merged = { ...s, ...updatedData, id: s.id, updatedAt: now.toISOString() };
      const totalAmt = Math.max(0, parseFloat(merged.totalAmount ?? merged.grandTotal ?? merged.subTotal) || 0);
      const paidAmt = Math.max(0, parseFloat(merged.paidAmount) || 0);
      const balanceAmt = Math.max(0, totalAmt - paidAmt);
      const paymentStatus = totalAmt > 0 && balanceAmt <= 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Unpaid';
      return { ...merged, totalAmount: totalAmt, paidAmount: paidAmt, balanceAmount: balanceAmt, paymentStatus };
    };

    const updatedRecord = existing ? computeNext(existing) : null;

    setShopSales((prev) => {
      const updated = prev.map((s) => (String(s.id) === stringId ? computeNext(s) : s));
      persistJSON(STORAGE_KEYS.sales, updated);
      return updated;
    });

    if (updatedRecord) {
      await syncWithTimeout(
        setDoc(doc(db, 'shop_sales', stringId), updatedRecord, { merge: true }).catch((err) =>
          console.warn('Firebase updateShopSale sync warning:', err)
        )
      );
    }
    return updatedRecord;
  };

  const deleteShopSale = async (saleId) => {
    const stringId = String(saleId);
    addTrackedId(DELETED_KEYS.sales, stringId);
    removeTrackedId(PENDING_KEYS.sales, stringId);
    setShopSales((prev) => {
      const updated = prev.filter((s) => String(s.id) !== stringId);
      persistJSON(STORAGE_KEYS.sales, updated);
      return updated;
    });
    try {
      await syncWithTimeout(deleteDoc(doc(db, 'shop_sales', stringId)));
    } catch (e) {
      console.warn('deleteShopSale error:', e);
    }
  };

  const deleteMultipleShopSales = async (saleIds = []) => {
    const idSet = new Set(saleIds.map(String));
    saleIds.forEach((id) => {
      addTrackedId(DELETED_KEYS.sales, id);
      removeTrackedId(PENDING_KEYS.sales, id);
    });
    setShopSales((prev) => {
      const updated = prev.filter((s) => !idSet.has(String(s.id)));
      persistJSON(STORAGE_KEYS.sales, updated);
      return updated;
    });
    try {
      await syncWithTimeout(Promise.allSettled(saleIds.map((id) => deleteDoc(doc(db, 'shop_sales', String(id))))));
    } catch (e) {
      console.warn('deleteMultipleShopSales error:', e);
    }
  };

  // ── Shop Customer Payment / Payout / Adjustment Vouchers ───────────────
  const addShopCustomerPayment = async (paymentData) => {
    const payId = paymentData.id || generateUUID();
    const voucherNo = paymentData.voucherNo || `SHP-PAY-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
    const entryType = paymentData.entryType || 'Receipt';
    const referenceType = paymentData.referenceType || (paymentData.invoiceId ? 'Sale' : 'Account');
    const amountNum = Math.max(0, parseFloat(paymentData.amountPaid) || 0);

    const newPay = {
      id: payId,
      voucherNo,
      entryType,
      referenceType,
      invoiceId: paymentData.invoiceId || '',
      repairId: '',
      referenceLabel: paymentData.referenceLabel || '',
      customerName: (paymentData.customerName || 'Walk-in Customer').trim(),
      amountPaid: amountNum,
      paymentMethod: paymentData.paymentMethod || 'Cash',
      referenceNo: paymentData.referenceNo || '',
      notes: paymentData.notes || '',
      time: formattedTime,
      date: paymentData.date || formattedTime,
      dateISO: now.toISOString(),
      createdAt: now.toISOString()
    };

    removeTrackedId(DELETED_KEYS.payments, payId);
    addTrackedId(PENDING_KEYS.payments, payId);

    setShopCustomerPayments((prev) => {
      const updated = [newPay, ...prev];
      persistJSON(STORAGE_KEYS.payments, updated);
      return updated;
    });

    const syncTasks = [];
    const deltaPaid = entryType === 'Payout' ? -amountNum : amountNum;

    if (paymentData.invoiceId) {
      const computeNextSale = (sale) => {
        const totalAmt = Math.max(0, parseFloat(sale.totalAmount ?? sale.grandTotal ?? sale.subTotal) || 0);
        const currentPaid =
          sale.paidAmount !== undefined && sale.paidAmount !== null
            ? parseFloat(sale.paidAmount) || 0
            : String(sale.paymentMethod || '').toLowerCase().includes('credit')
              ? 0
              : totalAmt;
        const nextPaid = Math.max(0, currentPaid + deltaPaid);
        const nextBal = Math.max(0, totalAmt - nextPaid);
        const nextStatus = totalAmt > 0 && nextBal <= 0 ? 'Paid' : nextPaid > 0 ? 'Partial' : 'Unpaid';
        return { ...sale, paidAmount: nextPaid, balanceAmount: nextBal, paymentStatus: nextStatus };
      };

      const targetSale = shopSales.find((s) => String(s.id) === String(paymentData.invoiceId));
      const syncedSale = targetSale ? computeNextSale(targetSale) : null;

      setShopSales((prevSales) => {
        const updated = prevSales.map((s) => (String(s.id) === String(paymentData.invoiceId) ? computeNextSale(s) : s));
        persistJSON(STORAGE_KEYS.sales, updated);
        return updated;
      });

      if (syncedSale) {
        syncTasks.push(
          setDoc(
            doc(db, 'shop_sales', String(syncedSale.id)),
            {
              paidAmount: syncedSale.paidAmount,
              balanceAmount: syncedSale.balanceAmount,
              paymentStatus: syncedSale.paymentStatus
            },
            { merge: true }
          ).catch((e) => console.warn('Firebase shop_sales payment sync warning:', e))
        );
      }
    }

    syncTasks.push(
      setDoc(doc(db, 'shop_customer_payments', String(payId)), newPay, { merge: true })
        .then(() => removeTrackedId(PENDING_KEYS.payments, payId))
        .catch((err) => console.warn('Firebase shop_customer_payments sync warning:', err))
    );

    await syncWithTimeout(Promise.allSettled(syncTasks));
    return newPay;
  };

  const deleteShopCustomerPayment = async (payId) => {
    const strId = String(payId);
    const target = shopCustomerPayments.find((p) => String(p.id) === strId);

    addTrackedId(DELETED_KEYS.payments, strId);
    removeTrackedId(PENDING_KEYS.payments, strId);

    setShopCustomerPayments((prev) => {
      const updated = prev.filter((p) => String(p.id) !== strId);
      persistJSON(STORAGE_KEYS.payments, updated);
      return updated;
    });

    if (target?.invoiceId) {
      const amt = Math.max(0, parseFloat(target.amountPaid) || 0);
      const reverseDelta = target.entryType === 'Payout' ? amt : -amt;

      const computeReversedSale = (sale) => {
        const totalAmt = Math.max(0, parseFloat(sale.totalAmount ?? sale.grandTotal ?? sale.subTotal) || 0);
        const nextPaid = Math.max(0, (parseFloat(sale.paidAmount) || 0) + reverseDelta);
        const nextBal = Math.max(0, totalAmt - nextPaid);
        const nextStatus = totalAmt > 0 && nextBal <= 0 ? 'Paid' : nextPaid > 0 ? 'Partial' : 'Unpaid';
        return { ...sale, paidAmount: nextPaid, balanceAmount: nextBal, paymentStatus: nextStatus };
      };

      const targetSale = shopSales.find((s) => String(s.id) === String(target.invoiceId));
      const syncedSale = targetSale ? computeReversedSale(targetSale) : null;

      setShopSales((prevSales) => {
        const updated = prevSales.map((s) => (String(s.id) === String(target.invoiceId) ? computeReversedSale(s) : s));
        persistJSON(STORAGE_KEYS.sales, updated);
        return updated;
      });

      if (syncedSale) {
        await syncWithTimeout(
          setDoc(
            doc(db, 'shop_sales', String(syncedSale.id)),
            {
              paidAmount: syncedSale.paidAmount,
              balanceAmount: syncedSale.balanceAmount,
              paymentStatus: syncedSale.paymentStatus
            },
            { merge: true }
          ).catch((e) => console.warn('Firebase reverse shop_sales payment warning:', e))
        );
      }
    }

    try {
      await syncWithTimeout(deleteDoc(doc(db, 'shop_customer_payments', strId)));
    } catch (e) {
      console.warn('deleteShopCustomerPayment error:', e);
    }
  };

  // ── Computed Shop Metrics ──────────────────────────────────────────────
  const todayISO = getTodayISO();

  const totalInventoryCount = useMemo(() => {
    return items.reduce((acc, item) => acc + (parseInt(item.totalStock, 10) || 0), 0);
  }, [items]);

  const totalValuation = useMemo(() => {
    return items.reduce((acc, item) => {
      const stock = parseInt(item.totalStock, 10) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return acc + stock * price;
    }, 0);
  }, [items]);

  const todayStockInQty = useMemo(() => {
    return usageLogs
      .filter((l) => isRecordInDateRange({ createdAt: l.timestamp, time: l.time }, todayISO, todayISO) && (l.type || '').toUpperCase().includes('IN'))
      .reduce((acc, l) => acc + (parseInt(l.qtyUsed, 10) || 0), 0);
  }, [usageLogs, todayISO]);

  const todayStockOutQty = useMemo(() => {
    return usageLogs
      .filter((l) => isRecordInDateRange({ createdAt: l.timestamp, time: l.time }, todayISO, todayISO) && (l.type || '').toUpperCase().includes('OUT'))
      .reduce((acc, l) => acc + (parseInt(l.qtyUsed, 10) || 0), 0);
  }, [usageLogs, todayISO]);

  const todaySalesAmount = useMemo(() => {
    if (shopSales.length > 0) {
      return shopSales
        .filter((s) => isRecordInDateRange({ dateISO: s.dateISO, createdAt: s.createdAt, time: s.date || s.time }, todayISO, todayISO))
        .reduce((acc, s) => acc + (parseFloat(s.totalAmount ?? s.grandTotal ?? s.subTotal) || 0), 0);
    }
    return usageLogs
      .filter((l) => isRecordInDateRange({ createdAt: l.timestamp, time: l.time }, todayISO, todayISO) && (l.type || '').toUpperCase().includes('OUT'))
      .reduce((acc, l) => {
        const lineVal = parseFloat(l.lineTotal) || (parseInt(l.qtyUsed, 10) || 0) * (parseFloat(l.unitPrice) || 0);
        return acc + lineVal;
      }, 0);
  }, [shopSales, usageLogs, todayISO]);

  const totalSalesAmount = useMemo(() => {
    if (shopSales.length > 0) {
      return shopSales.reduce((acc, s) => acc + (parseFloat(s.totalAmount ?? s.grandTotal ?? s.subTotal) || 0), 0);
    }
    return usageLogs
      .filter((l) => (l.type || '').toUpperCase().includes('OUT'))
      .reduce((acc, l) => {
        const lineVal = parseFloat(l.lineTotal) || (parseInt(l.qtyUsed, 10) || 0) * (parseFloat(l.unitPrice) || 0);
        return acc + lineVal;
      }, 0);
  }, [shopSales, usageLogs]);

  const lowStockAlerts = useMemo(() => {
    return items.filter((item) => (parseInt(item.totalStock, 10) || 0) <= (parseInt(item.minLevel, 10) || 5));
  }, [items]);

  // ── Factory Reset Shop Data to Zero ────────────────────────────────────
  const resetShopDataToZero = async () => {
    try {
      const collectionsToWipe = [
        'shop_items',
        'shop_usage_logs',
        'shop_vendors',
        'shop_categories',
        'shop_sales',
        'shop_customer_payments',
        'shop_customers',
        'shop_master_item_names'
      ];

      for (const colName of collectionsToWipe) {
        try {
          const snap = await getDocs(collection(db, colName));
          await Promise.allSettled(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch (wipeErr) {
          console.warn('Shop wipe collection warning:', colName, wipeErr);
        }
      }

      Object.values(STORAGE_KEYS).forEach((key) => persistJSON(key, []));
      Object.values(DELETED_KEYS).forEach((key) => persistJSON(key, []));
      Object.values(PENDING_KEYS).forEach((key) => persistJSON(key, []));

      setItems([]);
      setUsageLogs([]);
      setVendors([]);
      setCategories([]);
      setMasterItemNames([]);
      setShopSales([]);
      setShopCustomerPayments([]);
      setShopCustomers([]);

      return { success: true, message: 'All Shop Data & Metrics wiped successfully to 0!' };
    } catch (err) {
      console.error('Reset Shop Data Error:', err);
      return { success: false, message: 'Wipe error: ' + err.message };
    }
  };

  // Keep masterItemNames & addMasterItemName usable cleanly
  const addMasterItemName = async (nameData) => {
    const itemObj = typeof nameData === 'string' ? { name: nameData } : nameData;
    const newMaster = {
      id: `SHP-MST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: itemObj.name,
      category: itemObj.category || 'General',
      defaultUnit: itemObj.defaultUnit || 'PCS'
    };
    setMasterItemNames((prev) => {
      const updated = [newMaster, ...prev];
      persistJSON(STORAGE_KEYS.masterItemNames, updated);
      return updated;
    });
  };

  const contextValue = useMemo(
    () => ({
      isShop: true,
      items,
      usageLogs,
      vendors,
      categories,
      masterItemNames,
      shopSales,
      shopCustomerPayments,
      shopCustomers,
      machineCustomers: shopCustomers,
      machineSales: shopSales,
      customerPayments: shopCustomerPayments,
      resetShopDataToZero,
      resetAllDataToZero: resetShopDataToZero,
      addShopCustomer,
      updateShopCustomer,
      deleteShopCustomer,
      addMachineCustomer: addShopCustomer,
      updateMachineCustomer: updateShopCustomer,
      deleteMachineCustomer: deleteShopCustomer,
      addShopSale,
      updateShopSale,
      editShopSale: updateShopSale,
      deleteShopSale,
      deleteMultipleShopSales,
      deleteMultipleMachineSales: deleteMultipleShopSales,
      addShopCustomerPayment,
      deleteShopCustomerPayment,
      addCustomerPayment: addShopCustomerPayment,
      deleteCustomerPayment: deleteShopCustomerPayment,
      receiveStock,
      issueStock,
      addUsageLog: issueStock,
      addNewItem,
      updateItem,
      deleteItem,
      seedShopDemoData,
      cleanDuplicateItems,
      deleteLog,
      updateLog,
      deleteMultipleLogs,
      addVendor,
      updateVendor,
      deleteVendor,
      deleteMultipleVendors,
      addCategory,
      updateCategory,
      deleteCategory,
      deleteMultipleCategories,
      addMasterItemName,
      updateMasterItemName: () => {},
      deleteMasterItemName: () => {},
      deleteMultipleMasterItemNames: () => {},
      defaultMasterItemNames,
      defaultShopItems,
      restoreDefaultMasterItemNames: () => {},
      restoreDefaultShopItems: seedShopDemoData,
      addNotification: () => {},
      totalInventoryCount,
      totalValuation,
      todayStockInQty,
      todayStockOutQty,
      todaySalesAmount,
      totalSalesAmount,
      dailyUsageCount: todayStockOutQty,
      lowStockAlerts
    }),
    [
      items,
      usageLogs,
      vendors,
      categories,
      masterItemNames,
      shopSales,
      shopCustomerPayments,
      shopCustomers,
      totalInventoryCount,
      totalValuation,
      todayStockInQty,
      todayStockOutQty,
      todaySalesAmount,
      totalSalesAmount,
      lowStockAlerts
    ]
  );

  return <StoreInventoryContext.Provider value={contextValue}>{children}</StoreInventoryContext.Provider>;
}

ShopInventoryProvider.propTypes = {
  children: PropTypes.node
};
