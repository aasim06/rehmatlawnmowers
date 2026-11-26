import { useState, useRef, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Stack
} from '@mui/material';

import { useStoreInventory } from 'context/StoreInventoryContext';
import { AppButton, UniversalPrintModal } from 'components/common';
import {
  StockInEntryForm,
  StockInHistorySection,
  StockInLiveInvoiceCard,
  StockInVendorPaymentDialog
} from 'components/stock-in';
import StockOutLogsPanel from 'sections/inventory/StockOutLogsPanel';
import PaymentVoucherDialog from 'components/machine/PaymentVoucherDialog';
import usePermission from 'hooks/usePermission';
import { formatPKR } from 'utils/dashboardHelpers';
import { getSubSurfaceSx } from 'utils/themeSurface';
import { buildFactoryStoreLedgers, getStorePartyDirectorySuggestions } from 'utils/storeLedgerHelpers';
import {
  computeSessionInvoiceSummary,
  computeStockInLineMath,
  formatStockInPrintPayload,
  generateStoreVoucherNo,
  groupStoreLogsByParty,
  resolveStockInCategories,
  resolveStockInItemNames
} from 'utils/stockInHelpers';

const createInitialFormState = (defaultParty = '') => ({
  vendor: defaultParty,
  itemName: '',
  category: 'General',
  qty: 1,
  totalBillAmount: '',
  unitPrice: 0,
  discount: 0,
  imageUrl: ''
});

/**
 * Unified reusable Store Stock Workspace powering both Factory Store Stock In
 * (/inventory/stock-in) and Stock Out (/inventory/stock-out), sharing form inputs,
 * item auto-fill, validation, delete confirmations, and print modal while preserving
 * each page's distinct layout and content.
 */
export default function StoreStockWorkspace({ mode = 'in' }) {
  const theme = useTheme();
  const isOut = mode === 'out';
  const { canDelete, canEditPrice, isStoreKeeper } = usePermission();

  const {
    isShop,
    items = [],
    vendors = [],
    masterItemNames = [],
    categories = [],
    usageLogs = [],
    vendorPayments = [],
    storeCustomers = [],
    storePayments = [],
    receiveStock,
    issueStock,
    addNewItem,
    deleteLog,
    updateLog,
    deleteMultipleLogs,
    addVendorPayment,
    addStorePayment
  } = useStoreInventory();

  const partyOptions = useMemo(() => (vendors || []).map((v) => v.name).filter(Boolean), [vendors]);
  const categoryOptions = useMemo(() => resolveStockInCategories({ categories, items }), [categories, items]);
  const itemOptions = useMemo(() => resolveStockInItemNames({ items, masterItemNames }), [items, masterItemNames]);

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  const vendorRef = useRef(null);
  const itemSelectRef = useRef(null);
  const categoryRef = useRef(null);
  const qtyRef = useRef(null);
  const priceRef = useRef(null);
  const discountRef = useRef(null);

  // Stock In session state (unused when mode === 'out')
  const [currentVoucherNo, setCurrentVoucherNo] = useState(() => {
    try {
      return localStorage.getItem('current_stock_in_voucher_no') || generateStoreVoucherNo('in');
    } catch {
      return generateStoreVoucherNo('in');
    }
  });

  const [currentInvoiceItems, setCurrentInvoiceItems] = useState(() => {
    try {
      const saved = localStorage.getItem('current_stock_in_session_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isOut) return;
    try {
      localStorage.setItem('current_stock_in_session_items', JSON.stringify(currentInvoiceItems));
      localStorage.setItem('current_stock_in_voucher_no', currentVoucherNo);
    } catch (e) {
      console.warn('Could not persist stock-in session:', e);
    }
  }, [isOut, currentInvoiceItems, currentVoucherNo]);

  const [form, setForm] = useState(() => createInitialFormState());
  const [editingLog, setEditingLog] = useState(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // Stock In Vendor Settlement Dialog
  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);
  const [paymentPopupData, setPaymentPopupData] = useState({
    vendor: '',
    totalAmount: 0,
    alreadyPaid: 0,
    cashPaid: '',
    paymentMethod: 'Cash',
    biltyNo: '',
    items: [],
    itemsCount: 0
  });

  const [logToDelete, setLogToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [collectVoucherOpen, setCollectVoucherOpen] = useState(false);
  const [collectVoucherInit, setCollectVoucherInit] = useState(null);

  const storeLedgers = useMemo(
    () =>
      isOut
        ? buildFactoryStoreLedgers({ storeCustomers, vendors, usageLogs, storePayments, vendorPayments })
        : [],
    [isOut, storeCustomers, vendors, usageLogs, storePayments, vendorPayments]
  );

  const storeDirectory = useMemo(
    () =>
      isOut
        ? getStorePartyDirectorySuggestions({ storeCustomers, vendors, usageLogs, storePayments, vendorPayments })
        : [],
    [isOut, storeCustomers, vendors, usageLogs, storePayments, vendorPayments]
  );

  useEffect(() => {
    if (!isOut && activeTab !== 0) return undefined;
    const timer = setTimeout(() => {
      if (!form.vendor && vendorRef.current) vendorRef.current.focus();
      else if (itemSelectRef.current) itemSelectRef.current.focus();
    }, 120);
    return () => clearTimeout(timer);
  }, [isOut, activeTab]);

  // Filter IN or OUT logs
  const modeLogs = useMemo(
    () =>
      (usageLogs || []).filter((log) => {
        const up = String(log.type || '').toUpperCase();
        return isOut ? up.includes('OUT') : up.includes('IN');
      }),
    [usageLogs, isOut]
  );

  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return modeLogs.filter((log) => {
      const matchedItem = items.find((i) => i.name.toLowerCase() === (log.itemName || '').toLowerCase());
      const logCat = log.category || matchedItem?.category || 'General';
      const matchesCat = selectedCategory === 'All' || logCat.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCat) return false;
      if (isOut || !q) return true;
      return [log.itemName, log.itemCode, log.usedBy, log.department, log.notes, logCat]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [modeLogs, items, searchTerm, selectedCategory, isOut]);

  const groupedLogs = useMemo(
    () => (isOut ? [] : groupStoreLogsByParty({ logs: filteredLogs, vendorPayments, includeVendorPayments: true, defaultParty: 'Direct Supplier' })),
    [filteredLogs, vendorPayments, isOut]
  );

  const { netTotal: lineTotal } = useMemo(() => computeStockInLineMath(form), [form]);

  const handleItemNameChange = (_, newInputValue) => {
    const val = typeof newInputValue === 'string' ? newInputValue : newInputValue?.name || '';
    const matchedItem = items.find((i) => i.name.toLowerCase() === val.toLowerCase());
    if (matchedItem) {
      const q = parseInt(form.qty, 10) || 1;
      const uPrice = matchedItem.unitPrice || 0;
      setForm((prev) => ({
        ...prev,
        itemName: val,
        category: matchedItem.category || prev.category || 'General',
        unitPrice: uPrice,
        totalBillAmount: uPrice > 0 ? uPrice * q : prev.totalBillAmount,
        imageUrl: matchedItem.imageUrl || prev.imageUrl || ''
      }));
      return;
    }

    const matchedMaster = (masterItemNames || []).find((m) => m.name.toLowerCase() === val.toLowerCase());
    const mPrice = matchedMaster?.unitPrice || 0;
    const q = parseInt(form.qty, 10) || 1;
    setForm((prev) => ({
      ...prev,
      itemName: val,
      category: matchedMaster?.category || prev.category || 'General',
      unitPrice: isOut ? 0 : mPrice > 0 ? mPrice : prev.unitPrice,
      totalBillAmount: isOut ? '' : mPrice > 0 ? mPrice * q : prev.totalBillAmount
    }));
  };

  const resetItemInputs = () => {
    setForm((prev) => ({ ...createInitialFormState(prev.vendor), category: 'General' }));
    setTimeout(() => itemSelectRef.current?.focus(), 50);
  };

  // Stock Out rapid issue handler (Enter on Qty or before Print)
  const issueStockOutEntry = async () => {
    const cleanName = form.itemName.trim();
    if (!cleanName || saving) return false;

    const targetItem = items.find((i) => i.name.toLowerCase() === cleanName.toLowerCase());
    if (!targetItem) {
      showToast('Selected item is not in store inventory!', 'error');
      return false;
    }

    const qtyVal = Math.max(1, parseInt(form.qty, 10) || 1);
    const available = parseInt(targetItem.remainingStock ?? targetItem.totalStock, 10) || 0;
    if (available < qtyVal) {
      showToast(`Cannot issue stock. Only ${available} available for "${targetItem.name}"!`, 'warning');
      return false;
    }

    const priceVal = parseFloat(form.unitPrice) > 0 ? parseFloat(form.unitPrice) : targetItem.unitPrice || 0;
    const category = form.category || targetItem.category || 'General';
    const recipient = (form.vendor || '').trim();

    setSaving(true);
    try {
      const success = await issueStock(
        targetItem.id,
        qtyVal,
        recipient,
        'Sales / Issuance',
        'Store Keeper',
        `Unit Price: ${priceVal}`,
        priceVal,
        category
      );
      if (success) {
        showToast(`Issued "${targetItem.name}" (×${qtyVal})${recipient ? ` to ${recipient}` : ''}.`);
        resetItemInputs();
        return { ok: true, targetItem, qtyVal, priceVal, recipient };
      }
      showToast('Cannot issue stock. Insufficient available quantity!', 'warning');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStockOutInvoice = async () => {
    let fallbackItem = null;
    if (form.itemName.trim()) {
      const res = await issueStockOutEntry();
      if (!res) return;
      fallbackItem = {
        id: res.targetItem.id,
        itemName: res.targetItem.name,
        qtyUsed: res.qtyVal,
        unitPrice: res.priceVal,
        lineTotal: res.qtyVal * res.priceVal
      };
    }

    const recipient = (form.vendor || '').trim() || 'Customer';
    const recipientLogs = filteredLogs.filter(
      (log) => (log.usedBy || log.department || '').toLowerCase() === recipient.toLowerCase()
    );
    const itemsToPrint = recipientLogs.length > 0 ? recipientLogs : fallbackItem ? [fallbackItem] : [];

    setPrintData({
      id: `#INV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'Stock Out (Sales Invoice)',
      vendor: recipient,
      time: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      items: itemsToPrint.map((it) => ({
        name: (it.itemName || '').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim(),
        qty: it.qtyUsed || 1,
        rate: it.unitPrice || 0,
        total: it.lineTotal || (it.qtyUsed || 1) * (it.unitPrice || 0)
      }))
    });
    setPrintModalOpen(true);
  };

  // Stock In Add to Live Invoice handler
  const handleAddStockInToInvoice = async () => {
    const cleanName = form.itemName.trim();
    if (!cleanName || saving) return;

    setSaving(true);
    try {
      const matchedItem = items.find((i) => i.name.toLowerCase() === cleanName.toLowerCase());
      const { qtyVal, billVal, priceVal, netTotal } = computeStockInLineMath(form);
      const poCode = currentVoucherNo || generateStoreVoucherNo('in');
      const activeVendor = (form.vendor || partyOptions[0] || 'Market').trim();
      const category = form.category || matchedItem?.category || 'General';
      const imageUrl = form.imageUrl || matchedItem?.imageUrl || '';

      if (matchedItem) {
        await receiveStock(matchedItem, qtyVal, activeVendor, poCode, priceVal, category, imageUrl, { biltyNo: '' });
      } else {
        const newCode = `RM-${Math.floor(100 + Math.random() * 900)}`;
        const createdItem = await addNewItem({
          name: cleanName,
          itemCode: newCode,
          category,
          unit: 'PCS',
          totalStock: 0,
          minLevel: 10,
          unitPrice: priceVal,
          totalBillAmount: billVal,
          rackLocation: 'Main Store',
          imageUrl
        });
        await receiveStock(createdItem || newCode, qtyVal, activeVendor, poCode, priceVal, category, imageUrl, { biltyNo: '' });
      }

      setCurrentInvoiceItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          itemName: cleanName,
          itemCode: matchedItem?.itemCode || poCode,
          category,
          qtyUsed: qtyVal,
          unitPrice: priceVal,
          lineTotal: netTotal,
          vendor: activeVendor,
          poCode,
          time: new Date().toLocaleString()
        }
      ]);

      showToast(`Added "${cleanName}" (×${qtyVal}) to receiving invoice!`);
      resetItemInputs();
    } finally {
      setSaving(false);
    }
  };

  // Stock In Inline Update handler
  const handleUpdateStockInSubmit = async () => {
    if (!editingLog || saving) return;
    setSaving(true);
    try {
      const { qtyVal, priceVal, discountVal, netTotal } = computeStockInLineMath(form);
      const category = form.category || 'General';
      const cleanVendor = (form.vendor || 'Market').trim();

      await updateLog(editingLog.id, {
        itemName: form.itemName.trim(),
        usedBy: cleanVendor,
        category,
        qtyUsed: qtyVal,
        unitPrice: priceVal,
        lineTotal: netTotal,
        discount: discountVal,
        imageUrl: form.imageUrl || ''
      });

      setCurrentInvoiceItems((prev) =>
        prev.map((it) =>
          it.id === editingLog.id
            ? { ...it, itemName: form.itemName.trim(), qtyUsed: qtyVal, unitPrice: priceVal, lineTotal: netTotal, category, vendor: cleanVendor }
            : it
        )
      );

      showToast(`Updated Stock In entry for "${form.itemName.trim()}"!`);
      setEditingLog(null);
      resetItemInputs();
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (log) => {
    if (isOut) {
      setEditingLog({
        ...log,
        customer: log.usedBy || partyOptions[0] || '',
        qty: log.qtyUsed || 1,
        unitPrice: log.unitPrice || 0,
        amountPaid: log.amountPaid || 0
      });
      setEditDrawerOpen(true);
      return;
    }

    const qty = parseInt(log.qtyUsed, 10) || 1;
    const unitPrice = parseFloat(log.unitPrice) || 0;
    const totalBill = log.lineTotal !== undefined ? parseFloat(log.lineTotal) || 0 : qty * unitPrice;

    setEditingLog(log);
    setForm({
      vendor: log.usedBy || log.vendor || log.department || partyOptions[0] || '',
      itemName: log.itemName || '',
      category: log.category || 'General',
      qty,
      unitPrice,
      totalBillAmount: Math.round(totalBill * 100) / 100,
      discount: log.discount || 0,
      imageUrl: log.imageUrl || ''
    });

    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      qtyRef.current?.focus();
      qtyRef.current?.select?.();
    }, 150);
  };

  const handleSubmitStockOutDrawer = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    const qtyVal = Math.max(1, parseInt(editingLog.qty, 10) || 1);
    const priceVal = parseFloat(editingLog.unitPrice) || 0;
    const lineVal = qtyVal * priceVal;
    const paidVal = Math.max(0, parseFloat(editingLog.amountPaid) || 0);

    await updateLog(editingLog.id, {
      itemName: editingLog.itemName,
      usedBy: editingLog.customer,
      qtyUsed: qtyVal,
      unitPrice: priceVal,
      lineTotal: lineVal,
      amountPaid: paidVal,
      remainingBalance: Math.max(0, lineVal - paidVal)
    });
    setEditDrawerOpen(false);
    setEditingLog(null);
    showToast(`Updated Stock Out record for "${editingLog.itemName}".`);
  };

  const handleOpenStockOutCollect = (log) => {
    const customerName = (log.usedBy || log.customer || log.department || '').trim();
    const lineVal =
      log.lineTotal !== undefined && Number(log.lineTotal) > 0
        ? parseFloat(log.lineTotal)
        : (parseInt(log.qtyUsed, 10) || 1) * (parseFloat(log.unitPrice) || 0);
    const dueVal = Math.max(0, lineVal - (parseFloat(log.amountPaid) || 0));

    setCollectVoucherInit({
      customerName,
      entryType: 'Receipt',
      refSelection: `Sale:${log.id}`,
      amountPaid: dueVal > 0 ? String(dueVal) : ''
    });
    setCollectVoucherOpen(true);
  };

  const handleStartNewInvoice = () => {
    setCurrentVoucherNo(generateStoreVoucherNo('in'));
    setCurrentInvoiceItems([]);
    try {
      localStorage.removeItem('current_stock_in_session_items');
      localStorage.removeItem('current_stock_in_voucher_no');
    } catch (e) {
      console.warn(e);
    }
    setEditingLog(null);
    setForm(createInitialFormState());
    setActiveTab(0);
  };

  const handleOpenPaymentForVendorLogs = (targetVendor, itemsToUse, defaultVoucherId) => {
    const matchingPayments = vendorPayments.filter((p) => (p.vendorName || '').trim().toLowerCase() === targetVendor.toLowerCase());
    const sumPaid = matchingPayments.reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0);
    const totalShipmentBill = itemsToUse.reduce((s, it) => {
      const lt =
        it.lineTotal && Number(it.lineTotal) > 0 ? parseFloat(it.lineTotal) : (parseInt(it.qtyUsed, 10) || 1) * (parseFloat(it.unitPrice) || 0);
      return s + lt;
    }, 0);
    const alreadyPaidVal =
      matchingPayments.length > 0 ? sumPaid : itemsToUse.reduce((max, it) => Math.max(max, parseFloat(it.amountPaid) || 0), 0);
    const currentRemaining = Math.max(0, totalShipmentBill - alreadyPaidVal);

    setPaymentPopupData({
      logId: defaultVoucherId,
      vendor: targetVendor,
      items: itemsToUse,
      totalAmount: totalShipmentBill,
      alreadyPaid: alreadyPaidVal,
      cashPaid: currentRemaining > 0 ? String(currentRemaining) : '',
      paymentMethod: matchingPayments[0]?.paymentMethod || itemsToUse[0]?.paymentMethod || 'Cash',
      biltyNo: matchingPayments[0]?.referenceNo ? matchingPayments[0].referenceNo.replace('Bill #', '').replace('#', '') : itemsToUse[0]?.biltyNo || '',
      itemsCount: itemsToUse.length
    });
    setPaymentPopupOpen(true);
  };

  const handleOpenPaymentFromLog = (log) => {
    const targetVendor = (log.usedBy || log.department || 'Vendor').trim();
    const targetDate = log.time ? log.time.split(',')[0].trim() : '';
    const vendorLogs = modeLogs.filter(
      (l) => (l.usedBy || '').trim().toLowerCase() === targetVendor.toLowerCase() && (!targetDate || !l.time || l.time.startsWith(targetDate))
    );
    const itemsToUse = vendorLogs.length > 0 ? vendorLogs : [log];
    handleOpenPaymentForVendorLogs(targetVendor, itemsToUse, log.id);
  };

  const handleConfirmPayment = async (shouldPrint = true) => {
    const newPaidVal = Math.max(0, parseFloat(paymentPopupData.cashPaid) || 0);
    const vendorName = (paymentPopupData.vendor || 'Supplier').trim();
    const total = parseFloat(paymentPopupData.totalAmount) || 0;
    const alreadyPaid = parseFloat(paymentPopupData.alreadyPaid) || 0;
    const totalPaidCombined = alreadyPaid + newPaidVal;
    const remaining = Math.max(0, total - totalPaidCombined);
    const poNumber = paymentPopupData.biltyNo
      ? `Bill #${paymentPopupData.biltyNo}`
      : paymentPopupData.logId
        ? String(paymentPopupData.logId).startsWith('PO-')
          ? paymentPopupData.logId
          : `PO-${paymentPopupData.logId}`
        : `PO-${Math.floor(1000 + Math.random() * 9000)}`;

    if (newPaidVal > 0 && vendorName !== 'Vendor Shipment' && vendorName !== 'Direct Supplier') {
      const structuredItems = (paymentPopupData.items || [])
        .filter((it) => it?.itemName)
        .map((it) => ({
          name: String(it.itemName).replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim(),
          qty: Math.max(1, parseInt(it.qtyUsed, 10) || 1)
        }));
      const itemCount = structuredItems.length || paymentPopupData.itemsCount || 1;
      await addVendorPayment({
        vendorName,
        amountPaid: newPaidVal,
        paymentMethod: paymentPopupData.paymentMethod || 'Cash',
        referenceNo: poNumber,
        items: structuredItems,
        notes: `Paid at Stock In (${itemCount} ${itemCount === 1 ? 'item' : 'items'})`
      });
    }

    if (paymentPopupData.items?.length > 0) {
      paymentPopupData.items.forEach((item) => {
        if (usageLogs.some((l) => l.id === item.id)) {
          updateLog(item.id, {
            amountPaid: totalPaidCombined,
            remainingBalance: remaining,
            biltyNo: paymentPopupData.biltyNo || '',
            paymentMethod: paymentPopupData.paymentMethod || 'Cash'
          });
        }
      });
    }

    setCurrentInvoiceItems((prev) =>
      prev.map((it) => ({
        ...it,
        amountPaid: totalPaidCombined,
        remainingBalance: remaining,
        biltyNo: paymentPopupData.biltyNo || '',
        paymentMethod: paymentPopupData.paymentMethod || 'Cash'
      }))
    );

    showToast(newPaidVal > 0 ? `Recorded ${formatPKR(newPaidVal)} payment to ${vendorName}!` : `Saved credit terms for ${vendorName}.`);
    setPaymentPopupOpen(false);

    if (shouldPrint) {
      setPrintData(
        formatStockInPrintPayload({
          voucherNo: poNumber,
          type: 'Stock In (Receiving Invoice)',
          vendor: vendorName,
          biltyNo: paymentPopupData.biltyNo || '',
          itemsList: paymentPopupData.items || [],
          totalBill: total,
          amountPaid: totalPaidCombined,
          remainingBalance: remaining,
          paymentMethod: paymentPopupData.paymentMethod || 'Cash'
        })
      );
      setPrintModalOpen(true);
    }

    // Auto-clear active session so completed invoice moves to history and leaves the workspace ready for next invoice
    handleStartNewInvoice();
  };

  const handleOpenStockOutRowPrint = (log) => {
    const customerName = log.usedBy || log.department || 'Customer';
    const customerLogs = filteredLogs.filter((l) => (l.usedBy || l.department || '').toLowerCase() === customerName.toLowerCase());
    const matchedItem = items.find((i) => i.name.toLowerCase() === (log.itemName || '').toLowerCase());
    const unitPriceVal = log.unitPrice && log.unitPrice > 0 ? log.unitPrice : matchedItem?.unitPrice || 0;
    const rows =
      customerLogs.length > 0
        ? customerLogs
        : [{ ...log, unitPrice: unitPriceVal, lineTotal: log.lineTotal || (log.qtyUsed || 1) * unitPriceVal }];

    setPrintData({
      id: `#${log.itemCode || `INV-${log.id}`}`,
      type: 'Sales Invoice Receipt',
      vendor: customerName,
      time: log.time,
      items: rows.map((it) => ({
        name: (it.itemName || '').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim(),
        qty: it.qtyUsed || 1,
        rate: it.unitPrice || 0,
        total: it.lineTotal || (it.qtyUsed || 1) * (it.unitPrice || 0)
      }))
    });
    setPrintModalOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: isOut ? 3 : 2.5 }}>
      {isOut ? (
        /* STOCK OUT LAYOUT (Preserved original vertical flow: Top Single-Row Card -> AppDataTable) */
        <>
          <StockInEntryForm
            mode="out"
            isShop={isShop}
            form={form}
            onChangeForm={setForm}
            onItemNameChange={handleItemNameChange}
            vendorOptions={partyOptions}
            itemOptions={itemOptions}
            categoryOptions={categoryOptions}
            saving={saving}
            refs={{ vendorRef, itemSelectRef, categoryRef, qtyRef }}
            onSubmit={issueStockOutEntry}
            onSaveInvoice={handleSaveStockOutInvoice}
          />

          <StockOutLogsPanel
            isShop={isShop}
            logs={filteredLogs}
            categoryOptions={categoryOptions}
            partyOptions={partyOptions}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selected={selected}
            onSelectChange={setSelected}
            onBulkDeleteClick={() => setBulkDeleteDialogOpen(true)}
            onCollectPayment={isStoreKeeper ? null : handleOpenStockOutCollect}
            onOpenPrint={handleOpenStockOutRowPrint}
            onOpenEdit={handleOpenEdit}
            onOpenDelete={setLogToDelete}
            canDelete={canDelete}
            canEditPrice={canEditPrice}
            isStoreKeeper={isStoreKeeper}
            editDrawerOpen={editDrawerOpen}
            editingLog={editingLog}
            onChangeEditingLog={setEditingLog}
            onCloseEditDrawer={() => setEditDrawerOpen(false)}
            onSubmitEdit={handleSubmitStockOutDrawer}
          />
        </>
      ) : (
        /* STOCK IN LAYOUT (Receiving Invoice / History tabs -> Multi-field Entry -> Live Invoice / Grouped History) */
        <>
          <Box>
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', p: 0.5, borderRadius: 2, gap: 0.5 })}>
              {[
                { key: 0, label: 'Receiving Invoice' },
                { key: 1, label: `History (Receiving Logs) (${modeLogs.length})` }
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Box
                    key={tab.key}
                    component="button"
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    sx={{
                      border: 0,
                      px: 1.75,
                      py: 0.7,
                      borderRadius: 1.5,
                      fontSize: '0.82rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      bgcolor: isActive ? 'background.paper' : 'transparent',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      boxShadow: isActive ? theme.shadows[1] : 'none'
                    }}
                  >
                    {tab.label}
                  </Box>
                );
              })}
            </Box>
          </Box>

          {activeTab === 0 ? (
            <Stack spacing={3}>
              <StockInEntryForm
                mode="in"
                form={form}
                onChangeForm={setForm}
                onItemNameChange={handleItemNameChange}
                vendorOptions={partyOptions}
                itemOptions={itemOptions}
                categoryOptions={categoryOptions}
                lineTotal={lineTotal}
                editingLog={editingLog}
                canEditPrice={canEditPrice}
                saving={saving}
                refs={{ vendorRef, itemSelectRef, categoryRef, qtyRef, priceRef, discountRef }}
                onSubmit={editingLog ? handleUpdateStockInSubmit : handleAddStockInToInvoice}
                onClear={() => {
                  setEditingLog(null);
                  setForm(createInitialFormState());
                }}
                onCancelEdit={() => {
                  setEditingLog(null);
                  resetItemInputs();
                }}
              />

              <StockInLiveInvoiceCard
                voucherNo={currentVoucherNo}
                vendorName={form.vendor || currentInvoiceItems[0]?.vendor || partyOptions[0] || 'Market'}
                items={currentInvoiceItems}
                onNewInvoice={handleStartNewInvoice}
                onOpenPayment={() => {
                  const targetVendor = (form.vendor || currentInvoiceItems[0]?.vendor || partyOptions[0] || 'Market').trim();
                  handleOpenPaymentForVendorLogs(targetVendor, currentInvoiceItems, currentVoucherNo);
                }}
                onPrintInvoice={() => {
                  const targetVendor = form.vendor || currentInvoiceItems[0]?.vendor || partyOptions[0] || 'Market';
                  const invSummary = computeSessionInvoiceSummary(currentInvoiceItems);
                  setPrintData(
                    formatStockInPrintPayload({
                      voucherNo: currentVoucherNo,
                      type: 'Stock In (Receiving Invoice)',
                      vendor: targetVendor,
                      biltyNo: currentInvoiceItems[0]?.biltyNo || '',
                      itemsList: currentInvoiceItems,
                      totalBill: invSummary.totalAmount,
                      amountPaid: invSummary.paidAmount,
                      remainingBalance: invSummary.balanceDue,
                      paymentMethod: currentInvoiceItems[0]?.paymentMethod || 'Cash'
                    })
                  );
                  setPrintModalOpen(true);
                }}
                onEditItem={handleOpenEdit}
                onDeleteItem={(itemId) => {
                  if (usageLogs.some((l) => l.id === itemId)) deleteLog(itemId);
                  setCurrentInvoiceItems((prev) => prev.filter((it) => it.id !== itemId));
                  showToast('Removed line item from invoice.', 'info');
                }}
              />
            </Stack>
          ) : (
            <StockInHistorySection
              stockInLogs={filteredLogs}
              groupedLogs={groupedLogs}
              categoryOptions={categoryOptions}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onResetFilters={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              selected={selected}
              onSelectChange={setSelected}
              canDelete={canDelete}
              onOpenPayment={handleOpenPaymentFromLog}
              onPrintGroup={(group) => {
                setPrintData(
                  formatStockInPrintPayload({
                    voucherNo: group.items[0]?.itemCode || `INV-${group.vendorName}`,
                    type: 'Stock In Shipment Receipt',
                    vendor: group.vendorName,
                    biltyNo: group.biltyList[0] || '',
                    itemsList: group.items,
                    totalBill: group.totalBill,
                    amountPaid: group.totalPaid,
                    remainingBalance: group.remainingBalance,
                    paymentMethod: group.paymentMethod,
                    time: group.latestTime
                  })
                );
                setPrintModalOpen(true);
              }}
              onPrintLog={(log) => {
                const lineVal =
                  log.lineTotal !== undefined && Number(log.lineTotal) > 0
                    ? parseFloat(log.lineTotal)
                    : (parseInt(log.qtyUsed, 10) || 1) * (parseFloat(log.unitPrice) || 0);
                setPrintData(
                  formatStockInPrintPayload({
                    voucherNo: log.itemCode || `INV-${log.id}`,
                    type: 'Stock In Receipt',
                    vendor: log.usedBy || 'Vendor',
                    biltyNo: log.biltyNo || '',
                    itemsList: [log],
                    totalBill: lineVal,
                    amountPaid: log.amountPaid,
                    remainingBalance: log.remainingBalance,
                    paymentMethod: log.paymentMethod || 'Cash',
                    time: log.time
                  })
                );
                setPrintModalOpen(true);
              }}
              onEditLog={handleOpenEdit}
              onDeleteLog={setLogToDelete}
              onBulkDeleteClick={() => setBulkDeleteDialogOpen(true)}
            />
          )}

          <StockInVendorPaymentDialog
            open={paymentPopupOpen}
            onClose={() => setPaymentPopupOpen(false)}
            data={paymentPopupData}
            onChangeData={setPaymentPopupData}
            onConfirm={handleConfirmPayment}
          />
        </>
      )}

      {/* Shared Universal Print Modal */}
      {printData && (
        <UniversalPrintModal
          open={printModalOpen}
          onClose={() => {
            setPrintModalOpen(false);
            setTimeout(() => itemSelectRef.current?.focus(), 50);
          }}
          title={isOut ? 'Stock Out Sales Invoice & Statement' : 'Vendor Stock Receiving Invoice & Statement'}
          typeTag={printData.type}
          partyLabel={isOut ? 'Customer / Party Details' : 'Vendor / Supplier Details'}
          party={{
            name: printData.vendor,
            subText: isOut ? `Issuance Category: ${printData.type}` : `Entry Type: ${printData.type}`
          }}
          invoiceLabel={isOut ? 'Voucher / Invoice No:' : 'PO / Voucher No:'}
          invoiceNo={printData.id}
          date={printData.time}
          status={isOut ? 'Dispatched' : printData.summary?.balanceAmount > 0 ? 'Balance Due' : 'Received'}
          extraMeta={!isOut && printData.biltyNo ? [{ label: 'Vendor Bill / Bilty #', value: printData.biltyNo }] : []}
          items={printData.items || []}
          summary={printData.summary}
          receiverSignatureLabel={isOut ? 'Customer / Receiver Signature' : 'Vendor Signature'}
        />
      )}

      {/* Shared Single Delete Confirm Dialog */}
      <Dialog open={Boolean(logToDelete)} onClose={() => setLogToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete {isOut ? 'Stock Out' : 'Stock In'} Record?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the {isOut ? 'Stock Out' : 'Stock In'} record for{' '}
            <strong>{logToDelete?.itemName}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setLogToDelete(null)}>
            Cancel
          </AppButton>
          <AppButton
            intent="danger"
            onClick={() => {
              deleteLog(logToDelete.id);
              setSelected((prev) => prev.filter((id) => id !== logToDelete.id));
              showToast(`Deleted record for ${logToDelete.itemName}.`, 'info');
              setLogToDelete(null);
            }}
          >
            Delete Record
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Shared Bulk Delete Confirm Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete {selected.length} Selected Records?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selected.length}</strong> selected {isOut ? 'Stock Out' : 'Stock In'} records?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setBulkDeleteDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton
            intent="danger"
            onClick={() => {
              deleteMultipleLogs(selected);
              showToast(`Deleted ${selected.length} selected records.`, 'info');
              setSelected([]);
              setBulkDeleteDialogOpen(false);
            }}
          >
            Delete {selected.length} Selected
          </AppButton>
        </DialogActions>
      </Dialog>

      {isOut && addStorePayment && (
        <PaymentVoucherDialog
          open={collectVoucherOpen}
          onClose={() => setCollectVoucherOpen(false)}
          initialData={collectVoucherInit}
          customerDirectory={storeDirectory}
          customerLedgers={storeLedgers}
          onSaveVoucher={async (payload) => {
            await addStorePayment({
              customerName: payload.customerName,
              entryType: payload.entryType,
              referenceType: payload.referenceType,
              invoiceId: payload.invoiceId,
              referenceLabel: payload.referenceLabel,
              amountPaid: payload.amountPaid,
              paymentMethod: payload.paymentMethod,
              referenceNo: payload.referenceNo,
              notes: payload.notes
            });
            showToast(`Recorded ${formatPKR(payload.amountPaid)} for ${payload.customerName} in Store Ledger!`);
            setCollectVoucherOpen(false);
          }}
        />
      )}

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

StoreStockWorkspace.propTypes = {
  mode: PropTypes.oneOf(['in', 'out'])
};
