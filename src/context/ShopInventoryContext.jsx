import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StoreInventoryContext } from 'context/StoreInventoryContext';
import { db } from 'api/firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from 'firebase/firestore';

const safeParseJSON = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.error(`SafeJSON Error parsing ${key}:`, err);
    return fallback;
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
  // 1. Shop Inventory Items State (Clean Zero Start)
  const [items, setItems] = useState(() => safeParseJSON('rehmat_shop_items_v2', []));

  // 2. Shop Usage & Stock Movement Logs State
  const [usageLogs, setUsageLogs] = useState(() => safeParseJSON('rehmat_shop_usage_logs_v2', []));

  // 3. Shop Vendors / Parties / Suppliers State
  const [vendors, setVendors] = useState(() => safeParseJSON('rehmat_shop_vendors_v2', []));

  // 4. Shop Categories State
  const [categories, setCategories] = useState(() => {
    const raw = localStorage.getItem('rehmat_shop_categories_v2');
    if (raw !== null) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return defaultShopCategories;
      }
    }
    return defaultShopCategories;
  });

  // 5. Shop Master Item Names
  const [masterItemNames, setMasterItemNames] = useState(() => safeParseJSON('rehmat_shop_master_item_names_v2', []));

  // 6. Shop Sales & Invoices State (for Shop Ledger & Udhaar Tracking)
  const [shopSales, setShopSales] = useState(() => safeParseJSON('rehmat_shop_sales_v2', []));

  // 7. Shop Customer Payments State (for Khata Wasooli / Recovery)
  const [shopCustomerPayments, setShopCustomerPayments] = useState(() => safeParseJSON('rehmat_shop_customer_payments_v2', []));

  // 6. Persistence to localStorage
  useEffect(() => {
    localStorage.setItem('rehmat_shop_items_v2', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('rehmat_shop_usage_logs_v2', JSON.stringify(usageLogs));
  }, [usageLogs]);

  useEffect(() => {
    localStorage.setItem('rehmat_shop_vendors_v2', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('rehmat_shop_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('rehmat_shop_master_item_names_v2', JSON.stringify(masterItemNames));
  }, [masterItemNames]);

  useEffect(() => {
    localStorage.setItem('rehmat_shop_sales_v2', JSON.stringify(shopSales));
  }, [shopSales]);

  useEffect(() => {
    localStorage.setItem('rehmat_shop_customer_payments_v2', JSON.stringify(shopCustomerPayments));
  }, [shopCustomerPayments]);

  // 7. Initial Fetch from Firebase Firestore for Shop
  useEffect(() => {
    let isMounted = true;
    const fetchShopFirebaseData = async () => {
      try {
        const [itemsSnap, logsSnap, vendorsSnap, catsSnap, salesSnap, paySnap] = await Promise.allSettled([
          getDocs(collection(db, 'shop_items')),
          getDocs(collection(db, 'shop_usage_logs')),
          getDocs(collection(db, 'shop_vendors')),
          getDocs(collection(db, 'shop_categories')),
          getDocs(collection(db, 'shop_sales')),
          getDocs(collection(db, 'shop_customer_payments'))
        ]);

        if (!isMounted) return;

        if (itemsSnap.status === 'fulfilled') {
          const fbItems = itemsSnap.value.docs ? itemsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
          setItems(fbItems);
          localStorage.setItem('rehmat_shop_items_v2', JSON.stringify(fbItems));
        }
        if (logsSnap.status === 'fulfilled') {
          const fbLogs = logsSnap.value.docs ? logsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
          setUsageLogs(fbLogs);
          localStorage.setItem('rehmat_shop_usage_logs_v2', JSON.stringify(fbLogs));
        }
        if (vendorsSnap.status === 'fulfilled') {
          const fbVendors = vendorsSnap.value.docs ? vendorsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
          setVendors(fbVendors);
          localStorage.setItem('rehmat_shop_vendors_v2', JSON.stringify(fbVendors));
        }
        if (catsSnap.status === 'fulfilled' && !catsSnap.value.empty) {
          const fbCats = catsSnap.value.docs.map((d) => ({ id: d.id, ...d.data() }));
          setCategories(fbCats);
          localStorage.setItem('rehmat_shop_categories_v2', JSON.stringify(fbCats));
        }
        if (salesSnap && salesSnap.status === 'fulfilled') {
          const fbSales = salesSnap.value.docs ? salesSnap.value.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
          setShopSales(fbSales);
          localStorage.setItem('rehmat_shop_sales_v2', JSON.stringify(fbSales));
        }
        if (paySnap && paySnap.status === 'fulfilled') {
          const fbPay = paySnap.value.docs ? paySnap.value.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
          setShopCustomerPayments(fbPay);
          localStorage.setItem('rehmat_shop_customer_payments_v2', JSON.stringify(fbPay));
        }
      } catch (err) {
        console.warn('Firebase Shop Data Sync notice (falling back to local data):', err);
      }
    };

    fetchShopFirebaseData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 8. Shop Operations: Receive Stock (Stock In)
  const receiveStock = async (itemIdOrObj, qtyReceivedParam, supplierNameParam = 'Vendor Shipment', refNoParam = '', unitPriceParam = 0, categoryParam = 'General', imageUrlParam = '') => {
    let targetItem = null;
    let itemId = itemIdOrObj;
    let qtyReceived = parseInt(qtyReceivedParam, 10) || 1;
    let supplierName = supplierNameParam || 'Vendor Shipment';
    let refNo = refNoParam || 'PO-' + Math.floor(1000 + Math.random() * 9000);
    let unitPrice = parseFloat(unitPriceParam) || 0;
    let category = categoryParam || 'General';
    let imageUrl = imageUrlParam || '';

    if (typeof itemIdOrObj === 'object' && itemIdOrObj !== null) {
      targetItem = itemIdOrObj;
      itemId = targetItem.id || targetItem.itemCode || targetItem.name;
      category = targetItem.category || category;
      if (!imageUrl && targetItem.imageUrl) imageUrl = targetItem.imageUrl;
    } else {
      targetItem = items.find(
        (i) =>
          i.id === itemId ||
          i.itemCode === itemId ||
          (i.name || '').toLowerCase() === (itemId || '').toLowerCase()
      );
    }

    if (!targetItem) {
      // Auto-create item in shop
      targetItem = {
        id: generateUUID(),
        name: String(itemId),
        itemCode: `SHP-${Math.floor(100 + Math.random() * 900)}`,
        category: category,
        totalStock: 0,
        unitPrice: unitPrice,
        unit: 'PCS',
        minLevel: 5,
        rackLocation: 'Shop Counter',
        imageUrl: imageUrl
      };
      setItems((prev) => [targetItem, ...prev]);
      try {
        await setDoc(doc(db, 'shop_items', String(targetItem.id)), targetItem, { merge: true });
      } catch (e) {
        console.warn('Firebase shop_items setDoc error:', e);
      }
    }

    const priceToRecord = unitPrice > 0 ? unitPrice : (targetItem.unitPrice || 0);
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
      lineTotal: lineTotal,
      notes: `Ref: ${refNo}`
    };

    // Update Shop Items State
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === targetItem.id || i.name.toLowerCase() === targetItem.name.toLowerCase()) {
          const updatedStock = (parseInt(i.totalStock, 10) || 0) + qtyReceived;
          const updatedPrice = priceToRecord > 0 ? priceToRecord : (i.unitPrice || 0);
          return {
            ...i,
            totalStock: updatedStock,
            unitPrice: updatedPrice,
            ...(imageUrl ? { imageUrl } : {})
          };
        }
        return i;
      })
    );

    // Update Shop Usage Logs State
    setUsageLogs((prev) => [newLog, ...prev]);

    // Save to Firestore in background
    try {
      await Promise.allSettled([
        setDoc(doc(db, 'shop_items', String(targetItem.id)), {
          ...targetItem,
          totalStock: (parseInt(targetItem.totalStock, 10) || 0) + qtyReceived,
          unitPrice: priceToRecord > 0 ? priceToRecord : (targetItem.unitPrice || 0),
          ...(imageUrl ? { imageUrl } : {})
        }, { merge: true }),
        setDoc(doc(db, 'shop_usage_logs', String(logId)), newLog, { merge: true })
      ]);
    } catch (e) {
      console.warn('Firebase Shop receiveStock sync error:', e);
    }

    return true;
  };

  // 9. Shop Operations: Issue Stock (Stock Out / Sale)
  const issueStock = async (itemIdOrObj, qtyUsedParam, usedByParam, departmentParam = 'Sales / Counter', issuedByParam = 'Shop Keeper', notesParam = '', unitPriceParam = 0, categoryParam = 'General') => {
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
      (i) =>
        i.id === itemId ||
        i.itemCode === itemId ||
        (i.name || '').toLowerCase() === (itemId || '').toLowerCase()
    );

    if (!targetItem) {
      alert('Shop item not found in stock!');
      return false;
    }

    const currentStock = parseInt(targetItem.totalStock, 10) || 0;
    if (currentStock < qtyUsed) {
      return false; // Insufficient quantity
    }

    const newStock = Math.max(0, currentStock - qtyUsed);
    const finalPrice = unitPrice > 0 ? unitPrice : (targetItem.unitPrice || 0);
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
      qtyUsed: qtyUsed,
      usedBy: usedBy,
      department: department,
      issuedBy: issuedBy,
      unitPrice: finalPrice,
      lineTotal: lineTotal,
      notes: notes
    };

    // Update Shop Items State
    setItems((prev) =>
      prev.map((i) => (i.id === targetItem.id ? { ...i, totalStock: newStock } : i))
    );

    // Update Shop Usage Logs State
    setUsageLogs((prev) => [newLog, ...prev]);

    // Save to Firestore
    try {
      await Promise.allSettled([
        setDoc(doc(db, 'shop_items', String(targetItem.id)), {
          ...targetItem,
          totalStock: newStock
        }, { merge: true }),
        setDoc(doc(db, 'shop_usage_logs', String(logId)), newLog, { merge: true })
      ]);
    } catch (e) {
      console.warn('Firebase Shop issueStock sync error:', e);
    }

    return true;
  };

  // 10. Add New Item in Shop
  const addNewItem = async (newItemData) => {
    const id = generateUUID();
    const itemCode = newItemData.itemCode || `SHP-${Math.floor(100 + Math.random() * 900)}`;
    const fullItem = {
      id,
      name: (newItemData.name || '').trim(),
      itemCode,
      category: newItemData.category || 'General',
      unit: newItemData.unit || 'PCS',
      totalStock: parseInt(newItemData.totalStock, 10) || 0,
      minLevel: parseInt(newItemData.minLevel, 10) || 5,
      unitPrice: parseFloat(newItemData.unitPrice) || 0,
      rackLocation: newItemData.rackLocation || 'Shop Shelf A',
      imageUrl: newItemData.imageUrl || ''
    };

    setItems((prev) => [fullItem, ...prev]);

    try {
      await setDoc(doc(db, 'shop_items', String(id)), fullItem, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop addNewItem error:', e);
    }

    return fullItem;
  };

  const updateItem = async (itemId, updatedData) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...updatedData } : i)));
    try {
      await setDoc(doc(db, 'shop_items', String(itemId)), updatedData, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop updateItem error:', e);
    }
  };

  const deleteItem = async (itemId) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await deleteDoc(doc(db, 'shop_items', String(itemId)));
    } catch (e) {
      console.warn('Firebase Shop deleteItem error:', e);
    }
  };

  const cleanDuplicateItems = () => {};

  const seedShopDemoData = async () => {
    setItems(defaultShopItems);
    localStorage.setItem('rehmat_shop_items_v2', JSON.stringify(defaultShopItems));
    try {
      for (const it of defaultShopItems) {
        await setDoc(doc(db, 'shop_items', String(it.id)), it, { merge: true });
      }
    } catch (e) {
      console.warn('Firebase seed error:', e);
    }
  };

  // 11. Log Management
  const deleteLog = async (logId) => {
    setUsageLogs((prev) => prev.filter((l) => l.id !== logId));
    try {
      await deleteDoc(doc(db, 'shop_usage_logs', String(logId)));
    } catch (e) {
      console.warn('Firebase Shop deleteLog error:', e);
    }
  };

  const updateLog = async (logId, updatedData) => {
    setUsageLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...updatedData } : l)));
    try {
      await setDoc(doc(db, 'shop_usage_logs', String(logId)), updatedData, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop updateLog error:', e);
    }
  };

  const deleteMultipleLogs = async (logIds = []) => {
    const idSet = new Set(logIds);
    setUsageLogs((prev) => prev.filter((l) => !idSet.has(l.id)));
    try {
      await Promise.allSettled(logIds.map((id) => deleteDoc(doc(db, 'shop_usage_logs', String(id)))));
    } catch (e) {
      console.warn('Firebase Shop deleteMultipleLogs error:', e);
    }
  };

  // 12. Vendor / Party Management
  const addVendor = async (vendorData) => {
    const id = generateUUID();
    const newV = { id, ...vendorData };
    setVendors((prev) => [newV, ...prev]);
    try {
      await setDoc(doc(db, 'shop_vendors', String(id)), newV, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop addVendor error:', e);
    }
  };

  const updateVendor = async (id, updatedData) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updatedData } : v)));
    try {
      await setDoc(doc(db, 'shop_vendors', String(id)), updatedData, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop updateVendor error:', e);
    }
  };

  const deleteVendor = async (id) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    try {
      await deleteDoc(doc(db, 'shop_vendors', String(id)));
    } catch (e) {
      console.warn('Firebase Shop deleteVendor error:', e);
    }
  };

  const deleteMultipleVendors = async (ids = []) => {
    const idSet = new Set(ids);
    setVendors((prev) => prev.filter((v) => !idSet.has(v.id)));
    try {
      await Promise.allSettled(ids.map((id) => deleteDoc(doc(db, 'shop_vendors', String(id)))));
    } catch (e) {
      console.warn('Firebase Shop deleteMultipleVendors error:', e);
    }
  };

  // 13. Category Management
  const addCategory = async (catData) => {
    const id = generateUUID();
    const newCat = { id, ...catData };
    setCategories((prev) => [...prev, newCat]);
    try {
      await setDoc(doc(db, 'shop_categories', String(id)), newCat, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop addCategory error:', e);
    }
  };

  const updateCategory = async (id, updatedData) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c)));
    try {
      await setDoc(doc(db, 'shop_categories', String(id)), updatedData, { merge: true });
    } catch (e) {
      console.warn('Firebase Shop updateCategory error:', e);
    }
  };

  const deleteCategory = async (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteDoc(doc(db, 'shop_categories', String(id)));
    } catch (e) {
      console.warn('Firebase Shop deleteCategory error:', e);
    }
  };

  const deleteMultipleCategories = async (ids = []) => {
    const idSet = new Set(ids);
    setCategories((prev) => prev.filter((c) => !idSet.has(c.id)));
    try {
      await Promise.allSettled(ids.map((id) => deleteDoc(doc(db, 'shop_categories', String(id)))));
    } catch (e) {
      console.warn('Firebase Shop deleteMultipleCategories error:', e);
    }
  };

  // Master Items Dummy handlers
  const addMasterItemName = (name) => setMasterItemNames((p) => [...p, { id: generateUUID(), name }]);
  const updateMasterItemName = () => {};
  const deleteMasterItemName = () => {};
  const deleteMultipleMasterItemNames = () => {};
  const addNotification = () => {};

  // ── Shop Sales & Ledger Actions ──────────────────────────────────
  const addShopSale = async (saleData) => {
    const saleId = saleData.id || generateUUID();
    const now = new Date();
    const newSale = {
      ...saleData,
      id: saleId,
      createdAt: now.toISOString(),
      dateISO: saleData.dateISO || now.toISOString()
    };

    setShopSales((prev) => [newSale, ...prev]);

    try {
      setDoc(doc(db, 'shop_sales', String(saleId)), newSale, { merge: true })
        .catch((err) => console.warn('Firebase shop_sales sync warning:', err));
    } catch (e) {
      console.warn('Firebase addShopSale exception:', e);
    }
    return newSale;
  };

  const deleteShopSale = async (saleId) => {
    setShopSales((prev) => prev.filter((s) => s.id !== saleId));
    try {
      deleteDoc(doc(db, 'shop_sales', String(saleId))).catch(() => {});
    } catch (e) {
      console.warn('deleteShopSale error:', e);
    }
  };

  const addShopCustomerPayment = async (paymentData) => {
    const payId = paymentData.id || generateUUID();
    const now = new Date();
    const newPay = {
      ...paymentData,
      id: payId,
      date: paymentData.date || now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }),
      dateISO: now.toISOString(),
      createdAt: now.toISOString()
    };

    setShopCustomerPayments((prev) => [newPay, ...prev]);

    try {
      setDoc(doc(db, 'shop_customer_payments', String(payId)), newPay, { merge: true })
        .catch((err) => console.warn('Firebase shop_customer_payments sync warning:', err));
    } catch (e) {
      console.warn('Firebase addShopCustomerPayment exception:', e);
    }
    return newPay;
  };

  const deleteShopCustomerPayment = async (payId) => {
    setShopCustomerPayments((prev) => prev.filter((p) => p.id !== payId));
    try {
      deleteDoc(doc(db, 'shop_customer_payments', String(payId))).catch(() => {});
    } catch (e) {
      console.warn('deleteShopCustomerPayment error:', e);
    }
  };

  // 14. Computed Shop Metrics
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
      .filter((l) => (l.time || '').includes('Today') && (l.type || '').toUpperCase().includes('IN'))
      .reduce((acc, l) => acc + (parseInt(l.qtyUsed, 10) || 0), 0);
  }, [usageLogs]);

  const todayStockOutQty = useMemo(() => {
    return usageLogs
      .filter((l) => (l.time || '').includes('Today') && (l.type || '').toUpperCase().includes('OUT'))
      .reduce((acc, l) => acc + (parseInt(l.qtyUsed, 10) || 0), 0);
  }, [usageLogs]);

  const todaySalesAmount = useMemo(() => {
    return usageLogs
      .filter((l) => (l.time || '').includes('Today') && (l.type || '').toUpperCase().includes('OUT'))
      .reduce((acc, l) => {
        const lineVal = parseFloat(l.lineTotal) || (parseInt(l.qtyUsed, 10) || 0) * (parseFloat(l.unitPrice) || 0);
        return acc + lineVal;
      }, 0);
  }, [usageLogs]);

  const totalSalesAmount = useMemo(() => {
    return usageLogs
      .filter((l) => (l.type || '').toUpperCase().includes('OUT'))
      .reduce((acc, l) => {
        const lineVal = parseFloat(l.lineTotal) || (parseInt(l.qtyUsed, 10) || 0) * (parseFloat(l.unitPrice) || 0);
        return acc + lineVal;
      }, 0);
  }, [usageLogs]);

  const lowStockAlerts = useMemo(() => {
    return items.filter((item) => (parseInt(item.totalStock, 10) || 0) <= (parseInt(item.minLevel, 10) || 5));
  }, [items]);

  // 15. Factory Reset Shop Data to Zero
  const resetShopDataToZero = async () => {
    try {
      // 1. Wipe all shop collections from Firebase Firestore
      const collectionsToWipe = [
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
          console.warn('Shop wipe collection warning:', colName, wipeErr);
        }
      }

      // 2. Clear and set all shop-specific localStorage keys to empty array
      const shopKeys = [
        'rehmat_shop_items_v2',
        'rehmat_shop_usage_logs_v2',
        'rehmat_shop_vendors_v2',
        'rehmat_shop_categories_v2',
        'rehmat_shop_master_item_names_v2',
        'rehmat_shop_sales_v2',
        'rehmat_shop_customer_payments_v2'
      ];
      shopKeys.forEach((key) => localStorage.setItem(key, JSON.stringify([])));

      // 3. Clear UI State immediately to 0 / empty
      setItems([]);
      setUsageLogs([]);
      setVendors([]);
      setCategories([]);
      setMasterItemNames([]);
      setShopSales([]);
      setShopCustomerPayments([]);

      return { success: true, message: 'All Shop Data & Metrics wiped successfully to 0!' };
    } catch (err) {
      console.error('Reset Shop Data Error:', err);
      return { success: false, message: 'Wipe error: ' + err.message };
    }
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
      machineSales: shopSales,
      customerPayments: shopCustomerPayments,
      resetShopDataToZero,
      resetAllDataToZero: resetShopDataToZero,
      addShopSale,
      deleteShopSale,
      addShopCustomerPayment,
      deleteShopCustomerPayment,
      addCustomerPayment: addShopCustomerPayment,
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
      updateMasterItemName,
      deleteMasterItemName,
      deleteMultipleMasterItemNames,
      addNotification,
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
      totalInventoryCount,
      totalValuation,
      todayStockInQty,
      todayStockOutQty,
      todaySalesAmount,
      totalSalesAmount,
      lowStockAlerts
    ]
  );

  return (
    <StoreInventoryContext.Provider value={contextValue}>
      {children}
    </StoreInventoryContext.Provider>
  );
}

ShopInventoryProvider.propTypes = {
  children: PropTypes.node
};

export const useShopInventory = () => useContext(StoreInventoryContext);

