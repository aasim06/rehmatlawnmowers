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

  // Persistent Deleted Tracking Blacklists to prevent Supabase polling from restoring deleted items/logs/sales/vendors
  const [deletedLogIds, setDeletedLogIds] = useState(() => safeParseJSON('rehmat_deleted_log_ids', []));
  const [deletedItemIds, setDeletedItemIds] = useState(() => safeParseJSON('rehmat_deleted_item_ids', []));
  const [deletedSaleIds, setDeletedSaleIds] = useState(() => safeParseJSON('rehmat_deleted_sale_ids', []));
  const [deletedVendorIds, setDeletedVendorIds] = useState(() => safeParseJSON('rehmat_deleted_vendor_ids', []));

  useEffect(() => {
    localStorage.setItem('rehmat_deleted_log_ids', JSON.stringify(deletedLogIds));
  }, [deletedLogIds]);

  useEffect(() => {
    localStorage.setItem('rehmat_deleted_item_ids', JSON.stringify(deletedItemIds));
  }, [deletedItemIds]);

  useEffect(() => {
    localStorage.setItem('rehmat_deleted_sale_ids', JSON.stringify(deletedSaleIds));
  }, [deletedSaleIds]);

  useEffect(() => {
    localStorage.setItem('rehmat_deleted_vendor_ids', JSON.stringify(deletedVendorIds));
  }, [deletedVendorIds]);

  const [deletedCategoryIds, setDeletedCategoryIds] = useState(() => safeParseJSON('rehmat_deleted_category_ids', []));

  useEffect(() => {
    localStorage.setItem('rehmat_deleted_category_ids', JSON.stringify(deletedCategoryIds));
  }, [deletedCategoryIds]);

  // 3. Vendors / Suppliers State (Clean Zero Start)
  const [vendors, setVendors] = useState(() => safeParseJSON('rehmat_store_vendors_v2', []));

  // 4. Categories State (Persistent Start with fallback to initialCategories)
  const [categories, setCategories] = useState(() => {
    const saved = safeParseJSON('rehmat_store_categories_v2', null);
    const deletedCatList = safeParseJSON('rehmat_deleted_category_ids', []);
    const deletedCatSet = new Set(deletedCatList.map((x) => String(x).toLowerCase()));

    if (Array.isArray(saved) && saved.length > 0) {
      const clean = saved.filter((c) => !deletedCatSet.has(String(c.id).toLowerCase()) && !deletedCatSet.has(String(c.name || '').toLowerCase()));
      if (clean.length > 0) return clean;
    }
    if (deletedCatList.length > 0) {
      return [];
    }
    return initialCategories;
  });

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

  // 14. Expenses State
  const [expenses, setExpenses] = useState(() => safeParseJSON('rehmat_store_expenses_v1', []));

  useEffect(() => {
    localStorage.setItem('rehmat_store_expenses_v1', JSON.stringify(expenses));
  }, [expenses]);

  // 15. Audit Logs State
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

  // Parallel Data Fetching via Supabase for zero-latency initial load & clean error handling
  const fetchSupabaseData = async () => {
    try {
      const deletedItemSet = new Set(safeParseJSON('rehmat_deleted_item_ids', []).map(String));
      const deletedLogSet = new Set(safeParseJSON('rehmat_deleted_log_ids', []).map(String));
      const deletedSaleSet = new Set(safeParseJSON('rehmat_deleted_sale_ids', []).map(String));
      const deletedVendorSet = new Set(safeParseJSON('rehmat_deleted_vendor_ids', []).map(String));
      const deletedCategorySet = new Set(safeParseJSON('rehmat_deleted_category_ids', []).map((x) => String(x).toLowerCase()));

      const [
        itemsRes,
        logsRes,
        vendorsRes,
        salesRes,
        catRes,
        masterItemsRes
      ] = await Promise.allSettled([
        supabase.from('store_items').select('*').order('name', { ascending: true }),
        supabase.from('usage_logs').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('vendors').select('*').order('name', { ascending: true }),
        supabase.from('machine_sales').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('master_item_names').select('*').order('name', { ascending: true })
      ]);

      if (itemsRes.status === 'fulfilled' && Array.isArray(itemsRes.value?.data)) {
        const cleanItemsData = itemsRes.value.data.filter(
          (i) => !deletedItemSet.has(String(i.id)) && !deletedItemSet.has(String(i.sku_code || i.item_code))
        );
        const mappedItems = cleanItemsData.map((i) => ({
          id: i.id,
          name: i.name,
          itemCode: i.sku_code || i.item_code || i.id,
          category: i.category || 'General',
          unit: i.unit || 'PCS',
          totalStock: parseFloat(i.current_stock || i.total_stock) || 0,
          usedToday: 0,
          remainingStock: parseFloat(i.remaining_stock) || 0,
          unitPrice: parseFloat(i.unit_price) || 0,
          minLevel: parseFloat(i.min_threshold || i.min_level) || 10,
          rackLocation: i.location || i.rack_location || 'Main Store',
          status: parseFloat(i.remaining_stock) <= 0 ? 2 : parseFloat(i.remaining_stock) <= (parseFloat(i.min_threshold || i.min_level) || 10) ? 0 : 1
        }));
        setItems((prev) => {
          const cleanLocal = prev.filter((i) => !deletedItemSet.has(String(i.id)) && !deletedItemSet.has(String(i.itemCode)));
          const fetchedMap = new Map(mappedItems.map((i) => [String(i.id), i]));
          const combined = [...mappedItems];
          cleanLocal.forEach((loc) => {
            if (!fetchedMap.has(String(loc.id)) && !fetchedMap.has(String(loc.itemCode)) && !deletedItemSet.has(String(loc.id)) && !deletedItemSet.has(String(loc.itemCode))) {
              combined.push(loc);
            }
          });
          localStorage.setItem('rehmat_store_items_v2', JSON.stringify(combined));
          return combined;
        });
      }

      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value?.data)) {
        const cleanLogsData = logsRes.value.data.filter(
          (l) => !deletedLogSet.has(String(l.id))
        );
        const mappedLogs = cleanLogsData.map((l) => ({
          id: l.id,
          type: l.type || 'Stock Out',
          itemCode: l.item_code || 'N/A',
          itemName: l.item_name || 'Item',
          qtyUsed: parseFloat(l.qty_used) || 1,
          unitPrice: parseFloat(l.unit_price) || 0,
          discountAmount: parseFloat(l.discount_amount) || 0,
          lineTotal: parseFloat(l.line_total) || 0,
          usedBy: l.used_by || 'Store',
          department: l.department || 'Store',
          issuedBy: l.issued_by || 'Store Manager',
          time: l.time || new Date(l.created_at).toLocaleString(),
          dateISO: l.created_at || new Date().toISOString()
        }));
        setUsageLogs((prev) => {
          const cleanLocal = prev.filter((l) => !deletedLogSet.has(String(l.id)));
          const fetchedMap = new Map(mappedLogs.map((l) => [String(l.id), l]));
          const combined = [...mappedLogs];
          cleanLocal.forEach((loc) => {
            if (!fetchedMap.has(String(loc.id)) && !deletedLogSet.has(String(loc.id))) {
              combined.push(loc);
            }
          });
          localStorage.setItem('rehmat_store_usage_logs_v2', JSON.stringify(combined));
          return combined;
        });
      }

      if (vendorsRes.status === 'fulfilled' && Array.isArray(vendorsRes.value?.data)) {
        const cleanVendorsData = vendorsRes.value.data.filter(
          (v) => !deletedVendorSet.has(String(v.id))
        );
        const mappedVendors = cleanVendorsData.map((v) => ({
          id: v.id,
          name: v.name,
          contactPerson: v.company_name || v.name,
          companyName: v.company_name || v.name,
          phone: v.phone || 'N/A',
          email: v.email || 'N/A',
          address: v.city_address || v.address || 'Local',
          suppliedCategory: v.supplied_category || 'General',
          openingBalance: parseFloat(v.opening_balance) || 0,
          currentBalance: parseFloat(v.current_balance) || 0
        }));
        setVendors((prev) => {
          const cleanLocal = prev.filter((v) => !deletedVendorSet.has(String(v.id)));
          const fetchedMap = new Map(mappedVendors.map((v) => [String(v.id), v]));
          const combined = [...mappedVendors];
          cleanLocal.forEach((loc) => {
            if (!fetchedMap.has(String(loc.id)) && !deletedVendorSet.has(String(loc.id))) {
              combined.push(loc);
            }
          });
          localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(combined));
          return combined;
        });
      }

      if (salesRes.status === 'fulfilled' && Array.isArray(salesRes.value?.data)) {
        const cleanSalesData = salesRes.value.data.filter(
          (s) => !deletedSaleSet.has(String(s.id))
        );
        const mappedSales = cleanSalesData.map((s) => {
          const rawSaleNo = s.sale_no;
          const cleanSaleNo = (rawSaleNo && !rawSaleNo.includes('-') && rawSaleNo.length < 15) || (rawSaleNo && rawSaleNo.startsWith('MS-') && rawSaleNo.length < 15)
            ? rawSaleNo
            : `MS-${String(s.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}`;

          return {
            id: s.id,
            saleNo: cleanSaleNo,
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
          };
        });
        setMachineSales((prev) => {
          const cleanLocal = prev.filter((s) => !deletedSaleSet.has(String(s.id)));
          const fetchedMap = new Map(mappedSales.map((s) => [String(s.id), s]));
          const combined = [...mappedSales];
          cleanLocal.forEach((loc) => {
            if (!fetchedMap.has(String(loc.id)) && !deletedSaleSet.has(String(loc.id))) {
              combined.push(loc);
            }
          });
          localStorage.setItem('rehmat_store_machine_sales_v2', JSON.stringify(combined));
          return combined;
        });
      }

      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value?.data)) {
        const cleanCatData = catRes.value.data.filter(
          (c) => !deletedCategorySet.has(String(c.id).toLowerCase()) && !deletedCategorySet.has(String(c.name || '').toLowerCase())
        );
        const mappedCats = cleanCatData.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description || ''
        }));
        setCategories((prev) => {
          const cleanLocal = (prev || []).filter((c) => !deletedCategorySet.has(String(c.id).toLowerCase()) && !deletedCategorySet.has(String(c.name || '').toLowerCase()));
          const fetchedMap = new Map(mappedCats.map((c) => [String(c.id), c]));
          const combined = [...mappedCats];
          cleanLocal.forEach((loc) => {
            if (!fetchedMap.has(String(loc.id)) && !deletedCategorySet.has(String(loc.id).toLowerCase()) && !deletedCategorySet.has(String(loc.name || '').toLowerCase())) {
              combined.push(loc);
            }
          });
          if (combined.length > 0) {
            localStorage.setItem('rehmat_store_categories_v2', JSON.stringify(combined));
            return combined;
          }
          if (deletedCategorySet.size === 0) {
            localStorage.setItem('rehmat_store_categories_v2', JSON.stringify(initialCategories));
            return initialCategories;
          }
          return [];
        });
      }

      if (masterItemsRes.status === 'fulfilled' && Array.isArray(masterItemsRes.value?.data)) {
        setMasterItemNames((prev) => {
          const fetchedMap = new Map((masterItemsRes.value.data || []).map((m) => [String(m.id), m]));
          const combined = [...(masterItemsRes.value.data || [])];
          (prev || []).forEach((loc) => {
            if (!fetchedMap.has(String(loc.id))) {
              combined.push(loc);
            }
          });
          localStorage.setItem('rehmat_store_master_item_names_v2', JSON.stringify(combined));
          return combined;
        });
      }
    } catch (err) {
      // Background sync notification
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
        remaining_stock: newRemainingStock,
        unit_price: price > 0 ? price : targetItem.unitPrice
      }).eq('id', targetItem.id);

      const { error } = await supabase.from('usage_logs').insert([{
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
        remaining_stock: newRemainingStock,
        unit_price: price > 0 ? price : (targetItem.unitPrice || 0)
      }]);

      const { error } = await supabase.from('usage_logs').insert([{
        id: logId,
        type: 'Stock In',
        item_code: targetItem.itemCode || 'N/A',
        item_name: targetItem.name || 'Item',
        qty_used: actualQty,
        unit_price: price,
        line_total: lineTotal,
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
    const stringId = String(itemId);
    const targetItem = items.find((i) => String(i.id) === stringId || (i.itemCode && String(i.itemCode) === stringId));

    const idsToAdd = [stringId];
    if (targetItem?.id) idsToAdd.push(String(targetItem.id));
    if (targetItem?.itemCode) idsToAdd.push(String(targetItem.itemCode));

    const existingDeleted = safeParseJSON('rehmat_deleted_item_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...idsToAdd]));
    localStorage.setItem('rehmat_deleted_item_ids', JSON.stringify(updatedDeleted));
    setDeletedItemIds(updatedDeleted);

    const existingItems = safeParseJSON('rehmat_store_items_v2', []);
    const filteredItems = existingItems.filter((i) => String(i.id) !== stringId && String(i.itemCode) !== stringId);
    localStorage.setItem('rehmat_store_items_v2', JSON.stringify(filteredItems));
    setItems((prev) => prev.filter((i) => String(i.id) !== stringId && String(i.itemCode) !== stringId));

    logActivity(
      'Inventory Item Deleted',
      `Deleted store item "${targetItem?.name || itemId}" (SKU: ${targetItem?.itemCode || 'N/A'})`
    );

    try {
      if (itemId) {
        await supabase.from('store_items').delete().eq('id', itemId);
        const numId = parseInt(itemId);
        if (!isNaN(numId)) {
          await supabase.from('store_items').delete().eq('id', numId);
        }
        if (targetItem?.itemCode) {
          await supabase.from('store_items').delete().eq('item_code', targetItem.itemCode);
        }
      }
    } catch (e) {
      console.error('deleteItem error:', e);
    }
  };

  // Bulk Delete Items
  const deleteMultipleItems = async (itemIds) => {
    const stringIds = itemIds.map(String);
    const idsSet = new Set(stringIds);

    const existingDeleted = safeParseJSON('rehmat_deleted_item_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...stringIds]));
    localStorage.setItem('rehmat_deleted_item_ids', JSON.stringify(updatedDeleted));
    setDeletedItemIds(updatedDeleted);

    const existingItems = safeParseJSON('rehmat_store_items_v2', []);
    const filteredItems = existingItems.filter((i) => !idsSet.has(String(i.id)) && !idsSet.has(String(i.itemCode)));
    localStorage.setItem('rehmat_store_items_v2', JSON.stringify(filteredItems));
    setItems((prev) => prev.filter((i) => !idsSet.has(String(i.id)) && !idsSet.has(String(i.itemCode))));

    logActivity(
      'Bulk Items Deleted',
      `Deleted ${itemIds.length} inventory items`
    );

    try {
      await supabase.from('store_items').delete().in('id', itemIds);
      await supabase.from('store_items').delete().in('item_code', itemIds);
    } catch (e) {
      console.error('deleteMultipleItems error:', e);
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
    localStorage.setItem('rehmat_store_items_v2', JSON.stringify(cleaned));

    try {
      await supabase.from('store_items').delete().eq('remaining_stock', 0);
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
    } catch (e) {
      console.error(e);
    }
  };

  const deleteVendor = async (vendorId) => {
    const stringId = String(vendorId);
    const existingDeleted = safeParseJSON('rehmat_deleted_vendor_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, stringId]));
    localStorage.setItem('rehmat_deleted_vendor_ids', JSON.stringify(updatedDeleted));
    setDeletedVendorIds(updatedDeleted);

    const existingVendors = safeParseJSON('rehmat_store_vendors_v2', []);
    const filteredVendors = existingVendors.filter((v) => String(v.id) !== stringId);
    localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(filteredVendors));
    setVendors((prev) => prev.filter((v) => String(v.id) !== stringId));

    try {
      await supabase.from('vendors').delete().eq('id', vendorId);
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Delete Vendors
  const deleteMultipleVendors = async (vendorIds) => {
    const stringIds = vendorIds.map(String);
    const idsSet = new Set(stringIds);

    const existingDeleted = safeParseJSON('rehmat_deleted_vendor_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...stringIds]));
    localStorage.setItem('rehmat_deleted_vendor_ids', JSON.stringify(updatedDeleted));
    setDeletedVendorIds(updatedDeleted);

    const existingVendors = safeParseJSON('rehmat_store_vendors_v2', []);
    const filteredVendors = existingVendors.filter((v) => !idsSet.has(String(v.id)));
    localStorage.setItem('rehmat_store_vendors_v2', JSON.stringify(filteredVendors));
    setVendors((prev) => prev.filter((v) => !idsSet.has(String(v.id))));

    try {
      await supabase.from('vendors').delete().in('id', vendorIds);
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
    localStorage.setItem('rehmat_deleted_log_ids', JSON.stringify(updatedDeleted));
    setDeletedLogIds(updatedDeleted);

    const existingLogs = safeParseJSON('rehmat_store_usage_logs_v2', []);
    const filteredLogs = existingLogs.filter((l) => !idsSet.has(String(l.id)));
    localStorage.setItem('rehmat_store_usage_logs_v2', JSON.stringify(filteredLogs));
    setUsageLogs((prev) => prev.filter((l) => !idsSet.has(String(l.id))));

    logActivity(
      'Bulk Logs Deleted',
      `Deleted ${logIds.length} usage logs`
    );

    try {
      await supabase.from('usage_logs').delete().in('id', logIds);
    } catch (e) {
      console.error(e);
    }
  };

  // 8. Category Actions
  const addCategory = async (categoryData) => {
    const categoryId = generateUUID();
    const newCategory = {
      id: categoryId,
      name: (categoryData.name || '').trim(),
      description: (categoryData.description || '').trim()
    };

    // Remove from deleted categories blacklist if re-added
    const existingDeleted = safeParseJSON('rehmat_deleted_category_ids', []);
    const updatedDeleted = existingDeleted.filter((id) => id !== categoryId && id !== newCategory.name.toLowerCase());
    localStorage.setItem('rehmat_deleted_category_ids', JSON.stringify(updatedDeleted));
    setDeletedCategoryIds(updatedDeleted);

    setCategories((prev) => {
      const exists = (prev || []).some((c) => (c.name || '').toLowerCase() === newCategory.name.toLowerCase());
      if (exists) return prev;
      const updated = [newCategory, ...(prev || [])];
      localStorage.setItem('rehmat_store_categories_v2', JSON.stringify(updated));
      return updated;
    });

    logActivity('Category Added', `Added category "${newCategory.name}"`);

    try {
      await supabase.from('categories').insert([{
        id: categoryId,
        name: newCategory.name,
        description: newCategory.description
      }]);
    } catch (e) {
      console.error('addCategory Supabase error:', e);
    }
  };

  const updateCategory = async (categoryId, updatedData) => {
    setCategories((prev) => {
      const updated = (prev || []).map((c) => (c.id === categoryId ? { ...c, ...updatedData } : c));
      localStorage.setItem('rehmat_store_categories_v2', JSON.stringify(updated));
      return updated;
    });

    logActivity('Category Updated', `Updated category "${updatedData.name}"`);

    try {
      await supabase.from('categories').update({
        name: updatedData.name,
        description: updatedData.description || ''
      }).eq('id', categoryId);
    } catch (e) {
      console.error('updateCategory Supabase error:', e);
    }
  };

  const deleteCategory = async (categoryId) => {
    const stringId = String(categoryId);
    const target = categories.find((c) => String(c.id) === stringId);

    const idsToAdd = [stringId];
    if (target?.name) idsToAdd.push(target.name.toLowerCase());

    const existingDeleted = safeParseJSON('rehmat_deleted_category_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...idsToAdd]));
    localStorage.setItem('rehmat_deleted_category_ids', JSON.stringify(updatedDeleted));
    setDeletedCategoryIds(updatedDeleted);

    setCategories((prev) => {
      const updated = (prev || []).filter((c) => String(c.id) !== stringId);
      localStorage.setItem('rehmat_store_categories_v2', JSON.stringify(updated));
      return updated;
    });

    logActivity('Category Deleted', `Deleted category "${target?.name || categoryId}"`);

    try {
      await supabase.from('categories').delete().eq('id', categoryId);
    } catch (e) {
      console.error('deleteCategory Supabase error:', e);
    }
  };

  const deleteMultipleCategories = async (categoryIds) => {
    const idsSet = new Set(categoryIds.map(String));
    const targets = categories.filter((c) => idsSet.has(String(c.id)));
    const names = targets.map((c) => (c.name || '').toLowerCase());

    const existingDeleted = safeParseJSON('rehmat_deleted_category_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...categoryIds.map(String), ...names]));
    localStorage.setItem('rehmat_deleted_category_ids', JSON.stringify(updatedDeleted));
    setDeletedCategoryIds(updatedDeleted);

    setCategories((prev) => {
      const updated = (prev || []).filter((c) => !idsSet.has(String(c.id)));
      localStorage.setItem('rehmat_store_categories_v2', JSON.stringify(updated));
      return updated;
    });

    logActivity('Bulk Categories Deleted', `Deleted ${categoryIds.length} categories`);

    try {
      await supabase.from('categories').delete().in('id', categoryIds);
    } catch (e) {
      console.error('deleteMultipleCategories Supabase error:', e);
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
    localStorage.setItem('rehmat_deleted_log_ids', JSON.stringify(updatedDeleted));
    setDeletedLogIds(updatedDeleted);

    const existingLogs = safeParseJSON('rehmat_store_usage_logs_v2', []);
    const filteredLogs = existingLogs.filter((l) => String(l.id) !== stringId);
    localStorage.setItem('rehmat_store_usage_logs_v2', JSON.stringify(filteredLogs));
    setUsageLogs((prev) => prev.filter((l) => String(l.id) !== stringId));

    logActivity(
      'Stock Log Deleted',
      `Deleted voucher #${logId} (${targetLog?.itemName || 'Item'} - Qty: ${targetLog?.qtyUsed || 1})`
    );

    try {
      if (logId) {
        await supabase.from('usage_logs').delete().eq('id', logId);
        const numId = parseInt(logId);
        if (!isNaN(numId)) {
          await supabase.from('usage_logs').delete().eq('id', numId);
        }
      }
    } catch (e) {
      console.error('deleteLog error:', e);
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
        qty_used: updatedData.qtyUsed,
        unit_price: updatedData.unitPrice,
        line_total: updatedData.lineTotal
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
    const stringId = String(id);
    const existingDeleted = safeParseJSON('rehmat_deleted_sale_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, stringId]));
    localStorage.setItem('rehmat_deleted_sale_ids', JSON.stringify(updatedDeleted));
    setDeletedSaleIds(updatedDeleted);

    const existingSales = safeParseJSON('rehmat_store_machine_sales_v2', []);
    const filteredSales = existingSales.filter((m) => String(m.id) !== stringId);
    localStorage.setItem('rehmat_store_machine_sales_v2', JSON.stringify(filteredSales));
    setMachineSales((prev) => prev.filter((m) => String(m.id) !== stringId));

    try {
      await supabase.from('machine_sales').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteMultipleMachineSales = async (ids) => {
    const stringIds = ids.map(String);
    const idsSet = new Set(stringIds);

    const existingDeleted = safeParseJSON('rehmat_deleted_sale_ids', []);
    const updatedDeleted = Array.from(new Set([...existingDeleted, ...stringIds]));
    localStorage.setItem('rehmat_deleted_sale_ids', JSON.stringify(updatedDeleted));
    setDeletedSaleIds(updatedDeleted);

    const existingSales = safeParseJSON('rehmat_store_machine_sales_v2', []);
    const filteredSales = existingSales.filter((m) => !idsSet.has(String(m.id)));
    localStorage.setItem('rehmat_store_machine_sales_v2', JSON.stringify(filteredSales));
    setMachineSales((prev) => prev.filter((m) => !idsSet.has(String(m.id))));

    try {
      await supabase.from('machine_sales').delete().in('id', ids);
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
      await sql`
        INSERT INTO machine_repairs (
          id, repair_no, customer_name, customer_phone, city_address,
          machine_name, serial_no, fault_description, parts_cost,
          labor_cost, discount_amount, total_cost, paid_amount,
          balance_amount, repair_status, received_date, promised_date,
          repair_items, created_at
        ) VALUES (
          ${repairId}, ${repairNo}, ${repairData.customerName || 'Walk-in Customer'},
          ${repairData.customerPhone || 'N/A'}, ${repairData.cityAddress || 'Lahore'},
          ${repairData.machineName || 'Lawn Mower Machine'}, ${repairData.serialNo || 'N/A'},
          ${repairData.faultDescription || 'General Service & Repair'},
          ${partsCost}, ${laborCost}, ${parseFloat(repairData.discountAmount) || 0},
          ${totalCost}, ${paidAmount}, ${balanceAmount},
          ${repairData.repairStatus || 'Received'}, ${formattedDate},
          ${repairData.promisedDate || '1-2 Days'},
          ${JSON.stringify(repairData.repairItems || [])}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          customer_phone = EXCLUDED.customer_phone,
          city_address = EXCLUDED.city_address,
          repair_status = EXCLUDED.repair_status,
          paid_amount = EXCLUDED.paid_amount,
          balance_amount = EXCLUDED.balance_amount;
      `;
    } catch (e) {
      console.error('Neon addMachineRepair Exception:', e);
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
      if (updatedFields.repairStatus && updatedFields.paidAmount !== undefined) {
        await sql`
          UPDATE machine_repairs
          SET repair_status = ${updatedFields.repairStatus},
              paid_amount = ${parseFloat(updatedFields.paidAmount) || 0}
          WHERE id = ${repairId};
        `;
      } else if (updatedFields.repairStatus) {
        await sql`
          UPDATE machine_repairs
          SET repair_status = ${updatedFields.repairStatus}
          WHERE id = ${repairId};
        `;
      } else if (updatedFields.paidAmount !== undefined) {
        await sql`
          UPDATE machine_repairs
          SET paid_amount = ${parseFloat(updatedFields.paidAmount) || 0}
          WHERE id = ${repairId};
        `;
      }
    } catch (e) {
      console.error('Neon updateMachineRepair Exception:', e);
    }
  };

  const deleteMachineRepair = async (repairId) => {
    setMachineRepairs((prev) => prev.filter((r) => r.id !== repairId));
    try {
      await sql`DELETE FROM machine_repairs WHERE id = ${repairId};`;
    } catch (e) {
      console.error('Neon deleteMachineRepair Exception:', e);
    }
  };

  const addExpense = async (expenseData) => {
    const newId = expenseData.id || `exp-${Date.now()}`;
    const newExpense = {
      id: newId,
      title: expenseData.title,
      category: expenseData.category || 'General',
      amount: parseFloat(expenseData.amount) || 0,
      paymentMethod: expenseData.paymentMethod || expenseData.payment_method || 'Cash',
      paidTo: expenseData.paidTo || expenseData.paid_to || 'N/A',
      expenseDate: expenseData.expenseDate || expenseData.expense_date || new Date().toISOString().split('T')[0],
      notes: expenseData.notes || '',
      createdAt: new Date().toISOString()
    };

    setExpenses((prev) => [newExpense, ...prev]);
    logActivity('Expense Added', `Added expense: PKR ${newExpense.amount} for ${newExpense.title}`);

    try {
      await sql`
        INSERT INTO expenses (
          id, title, category, amount, payment_method,
          paid_to, expense_date, notes, created_at
        ) VALUES (
          ${newExpense.id}, ${newExpense.title}, ${newExpense.category},
          ${newExpense.amount}, ${newExpense.paymentMethod},
          ${newExpense.paidTo}, ${newExpense.expenseDate}, ${newExpense.notes}, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          category = EXCLUDED.category,
          amount = EXCLUDED.amount,
          payment_method = EXCLUDED.payment_method,
          paid_to = EXCLUDED.paid_to,
          expense_date = EXCLUDED.expense_date,
          notes = EXCLUDED.notes;
      `;
    } catch (e) {
      console.error('Neon addExpense error:', e);
    }
    return newExpense;
  };

  const deleteExpense = async (expenseId) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    logActivity('Expense Deleted', `Deleted expense ID ${expenseId}`);
    try {
      await sql`DELETE FROM expenses WHERE id = ${expenseId};`;
    } catch (e) {
      console.error('Neon deleteExpense error:', e);
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
      clearNotifications,
      expenses,
      addExpense,
      deleteExpense
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
      expenses,
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
