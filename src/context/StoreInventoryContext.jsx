import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { initialStoreItems, initialUsageLogs, initialVendors, initialCategories, initialMachineSales } from 'data/factoryStoreData';
import { supabase } from 'api/supabase';

const StoreInventoryContext = createContext();

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

const initialMasterItemNames = [];

export function StoreInventoryProvider({ children }) {
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

  // 3. Vendors / Suppliers State (Clean Zero Start)
  const [vendors, setVendors] = useState(() => safeParseJSON('rehmat_store_vendors_v2', []));

  // 4. Categories State
  const [categories, setCategories] = useState(() => safeParseJSON('rehmat_store_categories_v2', initialCategories));

  // 7. Pre-saved Master Item Names List State (Clean Zero Start)
  const [masterItemNames, setMasterItemNames] = useState(() => {
    const saved = safeParseJSON('rehmat_store_master_item_names_v2', []);
    return (saved || []).filter((m) => !m.id?.startsWith('MST-') && !m.name?.includes('3HP Electric Motor'));
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
    const parsed = safeParseJSON('store_machine_recipes', null);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      // Filter out test entries like 'Emmami' if user wants real lawn mower recipe
      const clean = parsed.filter(r => !(r.modelName || '').toLowerCase().includes('emmami'));
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

  // 11. Customer Payments & Ledger Entries State (Clean Zero Start)
  const [customerPayments, setCustomerPayments] = useState(() => safeParseJSON('rehmat_store_customer_payments_v2', []));

  // 12. Vendor Payments & Ledger Entries State (Clean Zero Start)
  const [vendorPayments, setVendorPayments] = useState(() => safeParseJSON('rehmat_store_vendor_payments_v2', []));

  // 13. Machine Repairs & Job Cards State (Clean Zero Start)
  const [machineRepairs, setMachineRepairs] = useState(() => safeParseJSON('rehmat_store_machine_repairs_v1', []));

  // 14. Audit Logs State
  const initialAuditLogs = [
    {
      id: 'LOG-1',
      userEmail: 'storekeeper@rehmat.com',
      userName: 'Store Keeper Ali',
      userRole: 'Store Keeper',
      actionType: 'Stock Out',
      details: 'Issued 2 Pcs - Rehmat 20" Lawn Mower Blade to Customer',
      timestamp: new Date(Date.now() - 3600000).toLocaleString()
    },
    {
      id: 'LOG-2',
      userEmail: 'admin@rehmat.com',
      userName: 'Sabeel (Admin)',
      userRole: 'Super Admin',
      actionType: 'Stock In',
      details: 'Added Received Stock +10 Pcs SKF Ball Bearing',
      timestamp: new Date(Date.now() - 7200000).toLocaleString()
    }
  ];

  const [auditLogs, setAuditLogs] = useState(() => safeParseJSON('rehmat_store_audit_logs', initialAuditLogs));

  useEffect(() => {
    localStorage.setItem('rehmat_store_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logActivity = (actionType, details, userOverride = null) => {
    const savedUser = safeParseJSON('factory_store_user', null);
    const activeUser = userOverride || savedUser || { name: 'Admin', email: 'admin@rehmat.com', role: 'Super Admin' };

    const newLog = {
      id: 'LOG-' + Date.now(),
      userEmail: activeUser.email || 'user@rehmat.com',
      userName: activeUser.name || activeUser.email?.split('@')[0] || 'Staff User',
      userRole: activeUser.role || 'Staff',
      actionType,
      details,
      timestamp: new Date().toLocaleString()
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const deleteAuditLog = (id) => {
    setAuditLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  // 🔔 Real-time Super Admin Notifications State
  const initialNotifications = [
    {
      id: 'notif-1',
      senderName: 'Store Keeper Ali',
      senderRole: 'Store Keeper',
      title: '📦 Stock Out Issued',
      message: 'Issued 25x SKF Ball Bearings for Worker Aslam',
      type: 'stock-out',
      timestamp: '10 mins ago',
      read: false
    },
    {
      id: 'notif-2',
      senderName: 'Store Keeper Ali',
      senderRole: 'Store Keeper',
      title: '⚠️ Low Stock Reorder Request',
      message: '3HP Electric Motor stock is below 5 units. Please reorder.',
      type: 'alert',
      timestamp: '1 hour ago',
      read: false
    }
  ];

  const [notifications, setNotifications] = useState(() => safeParseJSON('rehmat_store_notifications_v1', initialNotifications));

  useEffect(() => {
    localStorage.setItem('rehmat_store_notifications_v1', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = ({ title, message, type = 'alert', senderName = 'Store Keeper Ali', senderRole = 'Store Keeper' }) => {
    const newNotif = {
      id: 'notif-' + Date.now(),
      senderName,
      senderRole,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Sync state to LocalStorage as secondary backup
  useEffect(() => {
    localStorage.setItem('rehmat_store_items_v2', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_machine_sales_v2', JSON.stringify(machineSales));
  }, [machineSales]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_machine_repairs_v1', JSON.stringify(machineRepairs));
  }, [machineRepairs]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_usage_logs_v2', JSON.stringify(usageLogs));
  }, [usageLogs]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_master_item_names_v2', JSON.stringify(masterItemNames));
  }, [masterItemNames]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_machine_recipes_v2', JSON.stringify(machineRecipes));
  }, [machineRecipes]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_customer_payments_v2', JSON.stringify(customerPayments));
  }, [customerPayments]);

  useEffect(() => {
    localStorage.setItem('rehmat_store_vendor_payments_v2', JSON.stringify(vendorPayments));
  }, [vendorPayments]);

  // Parallel Data Fetching via Promise.allSettled for zero-latency initial load
  const fetchSupabaseData = async () => {
    try {
      const [
        itemsRes,
        logsRes,
        vendorsRes,
        salesRes,
        custPayRes,
        vndPayRes,
        catRes,
        repairsRes
      ] = await Promise.allSettled([
        supabase.from('store_items').select('*'),
        supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('vendors').select('*'),
        supabase.from('machine_sales').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('customer_payments').select('*'),
        supabase.from('vendor_payments').select('*'),
        supabase.from('categories').select('*'),
        supabase.from('machine_repairs').select('*').order('created_at', { ascending: false }).limit(500)
      ]);

      if (itemsRes.status === 'fulfilled' && !itemsRes.value.error && itemsRes.value.data) {
        const mappedItems = itemsRes.value.data.map((i) => ({
          id: i.id,
          name: i.name,
          itemCode: i.item_code || i.id,
          category: i.category || 'General',
          unit: i.unit || 'PCS',
          totalStock: parseFloat(i.total_stock) || 0,
          usedToday: parseFloat(i.used_today) || 0,
          remainingStock: parseFloat(i.remaining_stock) || 0,
          unitPrice: parseFloat(i.unit_price) || 0,
          minLevel: parseFloat(i.min_level) || 10,
          rackLocation: i.rack_location || 'Main Store',
          status: parseFloat(i.remaining_stock) <= 0 ? 2 : parseFloat(i.remaining_stock) <= (parseFloat(i.min_level) || 10) ? 0 : 1
        }));
        setItems(mappedItems);
      }

      if (logsRes.status === 'fulfilled' && !logsRes.value.error && logsRes.value.data) {
        setUsageLogs(logsRes.value.data.map(l => ({
          id: l.id,
          type: l.type || 'Stock Out',
          itemCode: l.item_code || 'N/A',
          itemName: l.item_name || 'Item',
          qtyUsed: parseFloat(l.qty_used) || 1,
          unitPrice: 0,
          lineTotal: 0,
          usedBy: l.used_by || 'Store',
          department: l.department || 'Store',
          issuedBy: l.issued_by || 'Store Manager',
          time: l.date_iso ? new Date(l.date_iso).toLocaleString() : 'Today',
          dateISO: l.date_iso || l.created_at || new Date().toISOString()
        })));
      }

      if (vendorsRes.status === 'fulfilled' && !vendorsRes.value.error && vendorsRes.value.data) {
        setVendors(vendorsRes.value.data.map(v => ({
          id: v.id,
          name: v.name,
          contactPerson: v.contact_person || v.name,
          companyName: v.name,
          phone: v.phone || 'N/A',
          email: v.email || 'N/A',
          address: v.address || 'Local',
          suppliedCategory: v.supplied_category || 'General',
          openingBalance: 0,
          currentBalance: 0
        })));
      }

      if (salesRes.status === 'fulfilled' && !salesRes.value.error && salesRes.value.data) {
        setMachineSales(salesRes.value.data.map(s => ({
          id: s.id,
          saleNo: s.sale_no || s.id,
          customerName: s.customer_name,
          customerPhone: s.customer_phone || 'N/A',
          cityAddress: s.city_address || 'Lahore',
          machineName: s.machine_name,
          serialNo: s.serial_no,
          qty: parseFloat(s.qty) || 1,
          unitPrice: parseFloat(s.unit_price) || 0,
          discountAmount: parseFloat(s.discount_amount) || 0,
          lineTotal: parseFloat(s.line_total) || 0,
          paidAmount: parseFloat(s.paid_amount) || 0,
          balanceAmount: parseFloat(s.balance_amount) || 0,
          paymentStatus: s.payment_status || 'Paid',
          time: s.time || new Date(s.created_at).toLocaleString(),
          items: s.items || []
        })));
      }

      if (custPayRes.status === 'fulfilled' && custPayRes.value.data) {
        setCustomerPayments(custPayRes.value.data.map(cp => ({
          id: cp.id,
          customerName: cp.customer_name,
          date: cp.payment_date,
          amountPaid: parseFloat(cp.amount_paid) || 0,
          paymentMethod: cp.payment_method || 'Cash',
          referenceNo: cp.reference_no,
          notes: cp.notes
        })));
      }

      if (vndPayRes.status === 'fulfilled' && vndPayRes.value.data) {
        setVendorPayments(vndPayRes.value.data.map(vp => ({
          id: vp.id,
          vendorName: vp.vendor_name,
          date: vp.payment_date,
          amountPaid: parseFloat(vp.amount_paid) || 0,
          paymentMethod: vp.payment_method || 'Cash',
          referenceNo: vp.reference_no,
          notes: vp.notes
        })));
      }

      if (catRes.status === 'fulfilled' && !catRes.value.error && catRes.value.data) {
        setCategories(catRes.value.data.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description
        })));
      }

      if (repairsRes.status === 'fulfilled' && !repairsRes.value.error && repairsRes.value.data) {
        setMachineRepairs(repairsRes.value.data.map(r => ({
          id: r.id,
          repairNo: r.repair_no || r.id,
          customerName: r.customer_name,
          customerPhone: r.customer_phone || 'N/A',
          cityAddress: r.city_address || 'Lahore',
          machineName: r.machine_name,
          serialNo: r.serial_no || 'N/A',
          faultDescription: r.fault_description || 'General Service',
          partsCost: parseFloat(r.parts_cost) || 0,
          laborCost: parseFloat(r.labor_cost) || 0,
          totalCost: parseFloat(r.total_cost) || 0,
          paidAmount: parseFloat(r.paid_amount) || 0,
          balanceAmount: parseFloat(r.balance_amount) || 0,
          repairStatus: r.repair_status || 'Received',
          paymentStatus: r.payment_status || 'Pending',
          receivedDate: r.received_date || new Date().toLocaleDateString(),
          promisedDate: r.promised_date || '1-2 Days',
          technicianNotes: r.technician_notes || ''
        })));
      }
    } catch (err) {
      console.log('Supabase Sync Notice:', err.message);
    }
  };

  useEffect(() => {
    fetchSupabaseData();

    // Auto-refetch on window focus for multi-device sync
    const handleFocus = () => fetchSupabaseData();
    window.addEventListener('focus', handleFocus);

    // Periodic cloud poll every 15 seconds
    const interval = setInterval(fetchSupabaseData, 15000);

    // Supabase Realtime Listener across all operational tables
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          fetchSupabaseData();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

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
      await supabase.from('master_item_names').insert([{
        name: newName,
        category,
        default_unit: defaultUnit
      }]);
    } catch (e) {
      console.error(e);
    }
  };

  const updateMasterItemName = async (id, updatedData) => {
    setMasterItemNames((prev) => prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m)));

    try {
      await supabase.from('master_item_names').update({
        name: updatedData.name,
        category: updatedData.category,
        default_unit: updatedData.defaultUnit
      }).eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMasterItemName = async (id) => {
    setMasterItemNames((prev) => prev.filter((m) => m.id !== id));

    try {
      await supabase.from('master_item_names').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMultipleMasterItemNames = async (ids) => {
    const idsSet = new Set(ids);
    setMasterItemNames((prev) => prev.filter((m) => !idsSet.has(m.id)));

    try {
      await supabase.from('master_item_names').delete().in('id', ids);
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Issue Stock / Daily Usage Action
  const issueStock = async (itemIdOrObj, qtyUsedParam, usedByParam, departmentParam = 'Production Line', issuedByParam = 'Store Keeper', notesParam = '', unitPriceParam = 0) => {
    let itemId = itemIdOrObj;
    let qtyUsed = qtyUsedParam;
    let usedBy = usedByParam;
    let department = departmentParam;
    let issuedBy = issuedByParam;
    let notes = notesParam;
    let unitPrice = unitPriceParam;

    if (typeof itemIdOrObj === 'object' && itemIdOrObj !== null) {
      itemId = itemIdOrObj.itemId || itemIdOrObj.itemName || itemIdOrObj.itemCode;
      qtyUsed = itemIdOrObj.qtyUsed;
      usedBy = itemIdOrObj.usedBy;
      department = itemIdOrObj.department || 'Production Line';
      issuedBy = itemIdOrObj.issuedBy || 'Store Keeper';
      notes = itemIdOrObj.notes || '';
      unitPrice = itemIdOrObj.unitPrice || 0;
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
    const newLog = {
      id: logId,
      itemCode: targetItem.itemCode,
      itemName: targetItem.name,
      qtyUsed: actualQty,
      unitPrice: price,
      lineTotal: lineTotal,
      usedBy,
      department,
      issuedBy,
      time: `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      dateISO: now.toISOString(),
      type: 'OUT (Daily Usage)',
      remainingStockAfter: newRemainingStock,
      status: 1,
      notes
    };

    setUsageLogs((prev) => [newLog, ...prev]);
    logActivity('Stock Out', `Issued ${actualQty}x ${targetItem.name} to ${usedBy}`);

    try {
      await supabase.from('store_items').update({
        used_today: newUsedToday,
        remaining_stock: newRemainingStock
      }).eq('id', targetItem.id);

      const { error } = await supabase.from('usage_logs').insert([{
        id: logId,
        type: 'Stock Out',
        item_code: targetItem.itemCode || 'N/A',
        item_name: targetItem.name || 'Item',
        qty_used: actualQty,
        used_by: usedBy,
        department: department || 'Production',
        issued_by: issuedBy || 'Store Keeper',
        date_iso: now.toISOString(),
        remaining_stock_after: newRemainingStock,
        status: 1,
        notes: notes || ''
      }]);
      if (error) console.error('usage_logs insert error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }

    return true;
  };

  // 2. Receive Stock / Store IN Action
  const receiveStock = async (itemIdOrObj, qtyReceivedParam, supplierNameParam = 'Vendor Shipment', refNoParam = '', unitPriceParam = 0) => {
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
    const newLog = {
      id: logId,
      itemCode: targetItem.itemCode || 'N/A',
      itemName: targetItem.name || 'Item',
      qtyUsed: actualQty,
      unitPrice: price,
      lineTotal: lineTotal,
      usedBy: supplierName,
      department: 'Store Inward',
      issuedBy: 'Store Manager',
      time: `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      dateISO: now.toISOString(),
      type: 'IN (Shipment Received)',
      remainingStockAfter: newRemainingStock,
      status: 1,
      notes: `Shipment Ref: ${refNo}`
    };

    setUsageLogs((prev) => [newLog, ...prev]);

    try {
      await supabase.from('store_items').upsert([{
        id: targetItem.id,
        name: targetItem.name,
        item_code: targetItem.itemCode,
        category: targetItem.category || 'General',
        unit: targetItem.unit || 'PCS',
        total_stock: newTotalStock,
        used_today: targetItem.usedToday || 0,
        remaining_stock: newRemainingStock
      }]);

      const { error } = await supabase.from('usage_logs').insert([{
        id: logId,
        type: 'Stock In',
        item_code: targetItem.itemCode || 'N/A',
        item_name: targetItem.name || 'Item',
        qty_used: actualQty,
        used_by: supplierName,
        department: 'Store Inward',
        issued_by: 'Store Manager',
        date_iso: now.toISOString(),
        remaining_stock_after: newRemainingStock,
        status: 1,
        notes: `Shipment Ref: ${refNo}`
      }]);
      if (error) console.error('usage_logs insert error:', error);
      else await fetchSupabaseData();
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
      const { error } = await supabase.from('store_items').upsert([{
        id: itemId,
        name: newItem.name,
        item_code: itemCode,
        category: newItem.category || 'General',
        unit: newItem.unit || 'PCS',
        total_stock: parseFloat(newItem.totalStock) || 0,
        used_today: 0,
        remaining_stock: parseFloat(newItem.totalStock) || 0,
        unit_price: priceVal,
        min_level: minLevelVal,
        rack_location: rackLocationVal,
        status: 1
      }]);
      if (error) {
        console.error('Supabase store_items insert error:', error);
      } else {
        await fetchSupabaseData();
      }
    } catch (e) {
      console.error(e);
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
      if (priceVal !== undefined) updatePayload.unit_price = priceVal;
      if (minLevelVal !== undefined) updatePayload.min_level = minLevelVal;
      if (updatedData.rackLocation) updatePayload.rack_location = updatedData.rackLocation;

      await supabase.from('store_items').update(updatePayload).eq('id', itemId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Delete Inventory Item
  const deleteItem = async (itemId) => {
    const targetItem = items.find((i) => i.id === itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));

    logActivity(
      'Inventory Item Deleted',
      `Deleted store item "${targetItem?.name || itemId}" (SKU: ${targetItem?.itemCode || 'N/A'})`,
      activeUser
    );

    if (activeUser?.role === 'Store Keeper') {
      addNotification({
        title: '🚨 Store Item Deleted by Store Keeper',
        message: `${activeUser.name || 'Store Keeper'} deleted item "${targetItem?.name || itemId}" (SKU: ${targetItem?.itemCode || 'N/A'}).`,
        type: 'alert',
        senderName: activeUser.name || 'Store Keeper Ali',
        senderRole: 'Store Keeper'
      });
    }

    try {
      await supabase.from('store_items').delete().eq('id', itemId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Delete Items
  const deleteMultipleItems = async (itemIds) => {
    const idsSet = new Set(itemIds);
    setItems((prev) => prev.filter((i) => !idsSet.has(i.id)));

    logActivity(
      'Bulk Items Deleted',
      `Deleted ${itemIds.length} inventory items`,
      activeUser
    );

    if (activeUser?.role === 'Store Keeper') {
      addNotification({
        title: '🚨 Bulk Items Deleted by Store Keeper',
        message: `${activeUser.name || 'Store Keeper'} deleted ${itemIds.length} inventory items.`,
        type: 'alert',
        senderName: activeUser.name || 'Store Keeper Ali',
        senderRole: 'Store Keeper'
      });
    }

    try {
      await supabase.from('store_items').delete().in('id', itemIds);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
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

    try {
      await supabase.from('store_items').delete().eq('remaining_stock', 0);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Vendor Actions
  const addVendor = async (vendorData) => {
    const vendorId = generateUUID();
    const newVendor = {
      ...vendorData,
      id: vendorId
    };
    setVendors((prev) => [newVendor, ...prev]);

    try {
      const { error } = await supabase.from('vendors').insert([{
        id: vendorId,
        name: vendorData.name || 'Vendor',
        contact_person: vendorData.contactPerson || vendorData.name,
        phone: vendorData.phone || 'N/A',
        email: vendorData.email || 'N/A',
        address: vendorData.address || 'Local',
        supplied_category: vendorData.suppliedCategory || 'General',
        status: 1,
        rating: 5.0
      }]);
      if (error) console.error('Supabase addVendor error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateVendor = async (vendorId, updatedData) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, ...updatedData } : v))
    );

    try {
      const { error } = await supabase.from('vendors').update({
        name: updatedData.name,
        contact_person: updatedData.contactPerson || updatedData.name,
        phone: updatedData.phone,
        email: updatedData.email,
        address: updatedData.address,
        supplied_category: updatedData.suppliedCategory
      }).eq('id', vendorId);
      if (error) console.error('Supabase updateVendor error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteVendor = async (vendorId) => {
    setVendors((prev) => prev.filter((v) => v.id !== vendorId));

    try {
      await supabase.from('vendors').delete().eq('id', vendorId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Delete Vendors
  const deleteMultipleVendors = async (vendorIds) => {
    const idsSet = new Set(vendorIds);
    setVendors((prev) => prev.filter((v) => !idsSet.has(v.id)));

    try {
      await supabase.from('vendors').delete().in('id', vendorIds);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // 7. Delete Logs Actions
  const deleteMultipleLogs = async (logIds) => {
    const idsSet = new Set(logIds);
    setUsageLogs((prev) => prev.filter((l) => !idsSet.has(l.id)));

    logActivity(
      'Bulk Logs Deleted',
      `Deleted ${logIds.length} usage logs`,
      activeUser
    );

    if (activeUser?.role === 'Store Keeper') {
      addNotification({
        title: '🚨 Bulk Logs Deleted by Store Keeper',
        message: `${activeUser.name || 'Store Keeper'} deleted ${logIds.length} stock vouchers.`,
        type: 'alert',
        senderName: activeUser.name || 'Store Keeper Ali',
        senderRole: 'Store Keeper'
      });
    }

    try {
      await supabase.from('usage_logs').delete().in('id', logIds);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // 8. Category Actions
  const addCategory = async (categoryData) => {
    const categoryId = generateUUID();
    const newCategory = {
      id: categoryId,
      name: categoryData.name,
      description: categoryData.description || ''
    };
    setCategories((prev) => [newCategory, ...prev]);

    try {
      const { error } = await supabase.from('categories').insert([{
        id: categoryId,
        name: categoryData.name,
        description: categoryData.description || ''
      }]);
      if (error) console.error('Supabase addCategory error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateCategory = async (categoryId, updatedData) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, ...updatedData } : c))
    );

    try {
      await supabase.from('categories').update({
        name: updatedData.name,
        description: updatedData.description || ''
      }).eq('id', categoryId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCategory = async (categoryId) => {
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));

    try {
      await supabase.from('categories').delete().eq('id', categoryId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMultipleCategories = async (categoryIds) => {
    const idsSet = new Set(categoryIds);
    setCategories((prev) => prev.filter((c) => !idsSet.has(c.id)));

    try {
      await supabase.from('categories').delete().in('id', categoryIds);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  // Usage Logs Actions
  const deleteLog = async (logId) => {
    const targetLog = usageLogs.find((l) => l.id === logId);
    setUsageLogs((prev) => prev.filter((l) => l.id !== logId));

    logActivity(
      'Stock Log Deleted',
      `Deleted voucher #${logId} (${targetLog?.itemName || 'Item'} - Qty: ${targetLog?.qtyUsed || 1})`,
      activeUser
    );

    if (activeUser?.role === 'Store Keeper') {
      addNotification({
        title: '⚠️ Record Deleted by Store Keeper',
        message: `${activeUser.name || 'Store Keeper'} deleted voucher #${logId} (${targetLog?.itemName || 'Item'}).`,
        type: 'alert',
        senderName: activeUser.name || 'Store Keeper Ali',
        senderRole: 'Store Keeper'
      });
    }

    try {
      await supabase.from('usage_logs').delete().eq('id', logId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateLog = async (logId, updatedData) => {
    const targetLog = usageLogs.find((l) => l.id === logId);
    setUsageLogs((prev) =>
      prev.map((l) => (l.id === logId ? { ...l, ...updatedData } : l))
    );

    logActivity(
      'Stock Log Edited',
      `Updated voucher #${logId} (${targetLog?.itemName || 'Item'} -> ${updatedData.itemName || targetLog?.itemName}, Qty: ${updatedData.qtyUsed || targetLog?.qtyUsed})`,
      activeUser
    );

    if (activeUser?.role === 'Store Keeper') {
      addNotification({
        title: '✏️ Record Edited by Store Keeper',
        message: `${activeUser.name || 'Store Keeper'} edited voucher #${logId} (${updatedData.itemName || targetLog?.itemName}).`,
        type: 'request',
        senderName: activeUser.name || 'Store Keeper Ali',
        senderRole: 'Store Keeper'
      });
    }

    try {
      await supabase.from('usage_logs').update({
        item_name: updatedData.itemName,
        used_by: updatedData.usedBy,
        qty_used: updatedData.qtyUsed
      }).eq('id', logId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

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
      machineName: itemsList.length > 1 ? `${firstMachine.machineName} (+${itemsList.length - 1} more)` : firstMachine.machineName,
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

    setMachineSales((prev) => [newEntry, ...prev]);

    try {
      const { error } = await supabase.from('machine_sales').upsert([{
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
      }]);
      if (error) console.error('Supabase addMachineSale Error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error('Supabase addMachineSale Exception:', e);
    }
    return newEntry;
  };

  const updateMachineSale = async (id, updatedData) => {
    setMachineSales((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedData } : m))
    );
    try {
      await supabase.from('machine_sales').update({
        customer_name: updatedData.customerName,
        customer_phone: updatedData.customerPhone,
        city_address: updatedData.cityAddress,
        machine_name: updatedData.machineName,
        serial_no: updatedData.serialNo,
        qty: updatedData.qty,
        unit_price: updatedData.unitPrice,
        line_total: updatedData.lineTotal,
        paid_amount: updatedData.paidAmount,
        balance_amount: updatedData.balanceAmount,
        payment_status: updatedData.paymentStatus
      }).eq('id', id);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const addMachineModel = (modelName) => {
    if (!modelName || !modelName.trim()) return;
    const trimmed = modelName.trim();
    if (!machineModels.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      setMachineModels((prev) => [...prev, trimmed]);
    }
  };

  const saveMachineRecipe = (recipeObj) => {
    setMachineRecipes((prev) => {
      const existingIdx = prev.findIndex((r) => r.modelName.toLowerCase() === recipeObj.modelName.toLowerCase());
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = { ...copy[existingIdx], ...recipeObj };
        return copy;
      }
      return [{ id: generateUUID(), ...recipeObj }, ...prev];
    });
  };

  const deleteMachineRecipe = (id) => {
    setMachineRecipes((prev) => prev.filter((r) => r.id !== id));
  };

  const deleteMachineSale = async (id) => {
    setMachineSales((prev) => prev.filter((m) => m.id !== id));
    try {
      await supabase.from('machine_sales').delete().eq('id', id);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMultipleMachineSales = async (ids) => {
    const idsSet = new Set(ids);
    setMachineSales((prev) => prev.filter((m) => !idsSet.has(m.id)));
    try {
      await supabase.from('machine_sales').delete().in('id', ids);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
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
  // CUSTOMER LEDGER & PAYMENTS ACTIONS
  // ----------------------------------------------------
  const addCustomerPayment = async (paymentData) => {
    const paymentId = generateUUID();
    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const newPayment = {
      id: paymentId,
      invoiceId: paymentData.invoiceId || '',
      customerName: paymentData.customerName || 'Walk-in Customer',
      amountPaid: parseFloat(paymentData.amountPaid) || 0,
      paymentMethod: paymentData.paymentMethod || 'Cash',
      referenceNo: paymentData.referenceNo || '',
      notes: paymentData.notes || '',
      time: formattedTime,
      createdAt: now.toISOString()
    };

    setCustomerPayments((prev) => [newPayment, ...prev]);

    // Auto-update machine sales invoice paid amount & status if matching invoiceId
    if (paymentData.invoiceId) {
      setMachineSales((prevSales) =>
        prevSales.map((sale) => {
          if (sale.id === paymentData.invoiceId) {
            const updatedPaid = (sale.paidAmount || 0) + newPayment.amountPaid;
            const netBill = sale.lineTotal || 0;
            const updatedStatus = updatedPaid >= netBill ? 'Paid' : updatedPaid > 0 ? 'Partial' : 'Unpaid';
            return {
              ...sale,
              paidAmount: updatedPaid,
              paymentStatus: updatedStatus
            };
          }
          return sale;
        })
      );
    }

    try {
      const { error } = await supabase.from('customer_payments').upsert([{
        id: paymentId,
        customer_name: newPayment.customerName,
        payment_date: newPayment.time,
        amount_paid: newPayment.amountPaid,
        payment_method: newPayment.paymentMethod,
        reference_no: newPayment.referenceNo,
        notes: newPayment.notes
      }]);
      if (error) console.error('Supabase addCustomerPayment Error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error('Supabase addCustomerPayment Exception:', e);
    }
  };

  // ----------------------------------------------------
  // VENDOR LEDGER & PAYABLE ACTIONS
  // ----------------------------------------------------
  const addVendorPayment = async (paymentData) => {
    const paymentId = generateUUID();
    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    const newPayment = {
      id: paymentId,
      vendorName: paymentData.vendorName || 'Supplier',
      amountPaid: parseFloat(paymentData.amountPaid) || 0,
      paymentMethod: paymentData.paymentMethod || 'Cash',
      referenceNo: paymentData.referenceNo || '',
      notes: paymentData.notes || '',
      time: formattedTime,
      createdAt: now.toISOString()
    };

    setVendorPayments((prev) => [newPayment, ...prev]);

    try {
      const { error } = await supabase.from('vendor_payments').upsert([{
        id: paymentId,
        vendor_name: newPayment.vendorName,
        payment_date: newPayment.time,
        amount_paid: newPayment.amountPaid,
        payment_method: newPayment.paymentMethod,
        reference_no: newPayment.referenceNo,
        notes: newPayment.notes
      }]);
      if (error) console.error('Supabase addVendorPayment Error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error('Supabase addVendorPayment Exception:', e);
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
      customerPayments,
      vendorPayments
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
        await supabase.from('store_items').upsert(itemsToInsert);
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
        await supabase.from('usage_logs').upsert(logsToInsert);
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
        await supabase.from('machine_sales').upsert(salesToInsert);
      }
      if (data.vendors && Array.isArray(data.vendors)) setVendors(data.vendors);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);

      await fetchSupabaseData();
      return { success: true, message: 'All Store Data Successfully Restored to Cloud Database!' };
    } catch (err) {
      console.error(err);
      return { success: false, message: 'Invalid Backup JSON File format or database sync error.' };
    }
  };

  // ----------------------------------------------------
  // MACHINE REPAIR & SERVICE JOB CARDS ACTIONS
  // ----------------------------------------------------
  const addMachineRepair = async (repairData) => {
    const repairId = generateUUID();
    const repairNo = repairData.repairNo || `REP-${Math.floor(1000 + Math.random() * 9000)}`;
    const partsCost = parseFloat(repairData.partsCost) || 0;
    const laborCost = parseFloat(repairData.laborCost) || 0;
    const totalCost = partsCost + laborCost;
    const paidAmount = parseFloat(repairData.paidAmount) || 0;
    const balanceAmount = Math.max(0, totalCost - paidAmount);
    const paymentStatus = balanceAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';
    const now = new Date();
    const formattedDate = repairData.receivedDate || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const newRepair = {
      ...repairData,
      id: repairId,
      repairNo,
      partsCost,
      laborCost,
      totalCost,
      paidAmount,
      balanceAmount,
      paymentStatus,
      repairStatus: repairData.repairStatus || 'Received',
      receivedDate: formattedDate,
      promisedDate: repairData.promisedDate || '1-2 Days',
      technicianNotes: repairData.technicianNotes || ''
    };

    setMachineRepairs((prev) => [newRepair, ...prev]);

    try {
      const { error } = await supabase.from('machine_repairs').upsert([{
        id: repairId,
        repair_no: repairNo,
        customer_name: repairData.customerName || 'Walk-in Customer',
        customer_phone: repairData.customerPhone || 'N/A',
        city_address: repairData.cityAddress || 'Lahore',
        machine_name: repairData.machineName || 'Lawn Mower Machine',
        serial_no: repairData.serialNo || 'N/A',
        fault_description: repairData.faultDescription || 'General Service & Repair',
        parts_cost: partsCost,
        labor_cost: laborCost,
        total_cost: totalCost,
        paid_amount: paidAmount,
        balance_amount: balanceAmount,
        repair_status: repairData.repairStatus || 'Received',
        payment_status: paymentStatus,
        received_date: formattedDate,
        promised_date: repairData.promisedDate || '1-2 Days',
        technician_notes: repairData.technicianNotes || ''
      }]);
      if (error) console.error('Supabase addMachineRepair Error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error('Supabase addMachineRepair Exception:', e);
    }
    return newRepair;
  };

  const updateMachineRepair = async (repairId, updatedFields) => {
    setMachineRepairs((prev) =>
      prev.map((r) => {
        if (r.id === repairId) {
          const partsCost = updatedFields.partsCost !== undefined ? parseFloat(updatedFields.partsCost) || 0 : r.partsCost;
          const laborCost = updatedFields.laborCost !== undefined ? parseFloat(updatedFields.laborCost) || 0 : r.laborCost;
          const totalCost = partsCost + laborCost;
          const paidAmount = updatedFields.paidAmount !== undefined ? parseFloat(updatedFields.paidAmount) || 0 : r.paidAmount;
          const balanceAmount = Math.max(0, totalCost - paidAmount);
          const paymentStatus = balanceAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending';

          return {
            ...r,
            ...updatedFields,
            partsCost,
            laborCost,
            totalCost,
            paidAmount,
            balanceAmount,
            paymentStatus
          };
        }
        return r;
      })
    );

    try {
      const dbFields = {};
      if (updatedFields.repairStatus) dbFields.repair_status = updatedFields.repairStatus;
      if (updatedFields.partsCost !== undefined) dbFields.parts_cost = parseFloat(updatedFields.partsCost) || 0;
      if (updatedFields.laborCost !== undefined) dbFields.labor_cost = parseFloat(updatedFields.laborCost) || 0;
      if (updatedFields.paidAmount !== undefined) dbFields.paid_amount = parseFloat(updatedFields.paidAmount) || 0;
      if (updatedFields.technicianNotes) dbFields.technician_notes = updatedFields.technicianNotes;

      const { error } = await supabase.from('machine_repairs').update(dbFields).eq('id', repairId);
      if (error) console.error('Supabase updateMachineRepair Error:', error);
      else await fetchSupabaseData();
    } catch (e) {
      console.error('Supabase updateMachineRepair Exception:', e);
    }
  };

  const deleteMachineRepair = async (repairId) => {
    setMachineRepairs((prev) => prev.filter((r) => r.id !== repairId));
    try {
      await supabase.from('machine_repairs').delete().eq('id', repairId);
      await fetchSupabaseData();
    } catch (e) {
      console.error(e);
    }
  };

  const resetAllDataToZero = async () => {
    try {
      // 1. Wipe store_items, usage_logs, and all operational tables from Supabase Database
      await Promise.allSettled([
        supabase.from('store_items').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('usage_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('machine_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('machine_repairs').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('customer_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('vendor_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('vendors').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      // 2. Clear all local browser storage
      localStorage.clear();
      sessionStorage.clear();

      // 3. Clear UI State immediately
      setItems([]);
      setUsageLogs([]);
      setVendors([]);
      setMachineSales([]);
      setMachineRepairs([]);
      setCustomerPayments([]);
      setVendorPayments([]);

      // 4. Refetch live state from Supabase immediately so the UI reflects an empty state across all browsers
      await fetchSupabaseData();

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

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);

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
      customerPayments,
      vendorPayments,
      addMachineModel,
      saveMachineRecipe,
      deleteMachineRecipe,
      assembleMachine,
      addCustomerPayment,
      addVendorPayment,
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
      clearNotifications
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
      customerPayments,
      vendorPayments,
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
