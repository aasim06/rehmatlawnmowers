import React, { useState, useRef, useMemo, Fragment, useEffect } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import CeoSignature from 'components/CeoSignature';

// material-ui
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

// icons
import {
  ImportOutlined,
  SearchOutlined,
  ArrowUpOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  UploadOutlined,
  DollarOutlined,
  DownOutlined,
  RightOutlined,
  ShopOutlined,
  FolderOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import usePermission from 'hooks/usePermission';

export default function StockInPage() {
  const { canDelete, canEditPrice } = usePermission();
  const { isShop, items = [], vendors = [], masterItemNames = [], categories = [], usageLogs = [], vendorPayments = [], receiveStock, addNewItem, deleteLog, updateLog, deleteMultipleLogs, addVendorPayment } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selected, setSelected] = useState([]);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    setPage(0);
  }, [searchTerm, selectedCategory]);
  const itemSelectRef = useRef(null);
  const qtyRef = useRef(null);
  const priceRef = useRef(null);

  // Vendor options list (Only from real Vendors & Parties added by user)
  const vendorList = (vendors || []).map((v) => v.name).filter(Boolean);

  // Category options list from StoreInventoryContext
  const categoryOptions = Array.from(
    new Set([
      'General',
      ...(categories || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    ])
  );

  // Add Drawer Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    vendor: '',
    itemName: '',
    category: 'General',
    qty: 1,
    totalBillAmount: '',
    unitPrice: 0,
    discount: 0,
    imageUrl: ''
  });

  // Cash Payment Popup State (Triggered on "+ Save Stock In Invoice")
  const [paymentPopupOpen, setPaymentPopupOpen] = useState(false);
  const [paymentPopupData, setPaymentPopupData] = useState({
    vendor: '',
    totalAmount: 0,
    cashPaid: '',
    paymentMethod: 'Cash',
    biltyNo: '',
    notes: '',
    itemsCount: 0
  });

  // Edit Drawer Form State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Print Invoice Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Local File Upload for Item Image
  const handleLocalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const scale = Math.min(1, MAX_WIDTH / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setForm((prev) => ({ ...prev, imageUrl: dataUrl }));
        };
        img.onerror = () => setForm((prev) => ({ ...prev, imageUrl: event.target.result }));
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Combine all items list from store items and master item names for complete dropdown options
  const existingNamesList = Array.from(
    new Set([
      ...items.map((i) => i.name),
      ...(masterItemNames || []).map((m) => m.name)
    ])
  ).filter(Boolean);

  // Auto-fill unit price when selecting item name
  const handleItemNameChange = (event, newInputValue) => {
    const val = typeof newInputValue === 'string' ? newInputValue : (newInputValue?.name || '');
    const matchedItem = items.find((i) => i.name.toLowerCase() === val.toLowerCase());
    if (matchedItem) {
      const q = parseInt(form.qty) || 1;
      const uPrice = matchedItem.unitPrice || 0;
      setForm((prev) => ({
        ...prev,
        itemName: val,
        category: matchedItem.category || prev.category || 'General',
        unitPrice: uPrice,
        totalBillAmount: uPrice > 0 ? (uPrice * q) : prev.totalBillAmount,
        imageUrl: matchedItem.imageUrl || prev.imageUrl || ''
      }));
    } else {
      const matchedMaster = (masterItemNames || []).find((m) => m.name.toLowerCase() === val.toLowerCase());
      const mPrice = matchedMaster?.unitPrice || 0;
      const q = parseInt(form.qty) || 1;
      setForm((prev) => ({
        ...prev,
        itemName: val,
        category: matchedMaster?.category || prev.category || 'General',
        unitPrice: mPrice > 0 ? mPrice : prev.unitPrice,
        totalBillAmount: mPrice > 0 ? (mPrice * q) : prev.totalBillAmount
      }));
    }
  };

  // Add Quick Item to Table below (triggered when pressing Enter on QTY field)
  const handleQuickAddToList = async () => {
    if (!form.itemName.trim()) return;

    const matchedItem = items.find((i) => i.name.toLowerCase() === form.itemName.trim().toLowerCase());
    const qtyVal = parseInt(form.qty) || 1;
    const billVal = form.totalBillAmount !== undefined && form.totalBillAmount !== '' ? (parseFloat(form.totalBillAmount) || 0) : (qtyVal * (parseFloat(form.unitPrice) || 0));
    const priceVal = qtyVal > 0 ? (billVal / qtyVal) : billVal;
    const discountVal = parseFloat(form.discount) || 0;
    const netTotal = Math.max(0, billVal - discountVal);
    const poCode = `PO-${Math.floor(1000 + Math.random() * 9000)}`;

    if (matchedItem) {
      await receiveStock(matchedItem, qtyVal, form.vendor, poCode, priceVal, form.category || matchedItem.category || 'General', form.imageUrl || matchedItem.imageUrl || '');
    } else {
      const newCode = isShop ? `SHP-${Math.floor(100 + Math.random() * 900)}` : `RM-${Math.floor(100 + Math.random() * 900)}`;
      const createdItem = await addNewItem({
        name: form.itemName.trim(),
        itemCode: newCode,
        category: form.category || 'General',
        unit: 'PCS',
        totalStock: 0,
        minLevel: 10,
        unitPrice: priceVal,
        totalBillAmount: billVal,
        rackLocation: isShop ? 'Shop Counter' : 'Main Store',
        imageUrl: form.imageUrl || ''
      });
      await receiveStock(createdItem || newCode, qtyVal, form.vendor, poCode, priceVal, form.category || 'General', form.imageUrl || '');
    }

    setForm((prev) => ({
      ...prev,
      itemName: '',
      qty: 1,
      unitPrice: 0,
      totalBillAmount: '',
      discount: 0,
      imageUrl: ''
    }));

    // Auto-focus back to ITEM SELECT for non-stop typing
    setTimeout(() => {
      if (itemSelectRef.current) {
        itemSelectRef.current.focus();
      }
    }, 50);
  };

  // Mouse Click Handler on Green "+ Save Stock In Invoice" Button (Adds item & opens Print Invoice Modal directly)
  const handleSaveButtonClick = async () => {
    const qtyVal = parseInt(form.qty) || 1;
    const billVal = form.totalBillAmount !== undefined && form.totalBillAmount !== '' ? (parseFloat(form.totalBillAmount) || 0) : (qtyVal * (parseFloat(form.unitPrice) || 0));
    const priceVal = qtyVal > 0 ? (billVal / qtyVal) : billVal;
    const discountVal = parseFloat(form.discount) || 0;
    const netTotal = Math.max(0, billVal - discountVal);
    const activeVendor = form.vendor || stockInLogs[0]?.usedBy || 'Vendor Shipment';

    if (form.itemName.trim()) {
      await handleQuickAddToList();
    }

    setPrintData({
      id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Stock In (Receiving Invoice)',
      vendor: activeVendor,
      itemName: form.itemName,
      qty: qtyVal,
      unitPrice: priceVal,
      totalBillAmount: billVal,
      discount: discountVal,
      lineTotal: netTotal,
      time: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    });

    setPrintModalOpen(true);
  };

  // Open Cash Payment Popup for a vendor's entire shipment (aggregates all items for this vendor)
  const handleOpenPaymentPopup = (log) => {
    const targetVendor = (log.usedBy || log.department || 'Vendor').trim();
    const targetDate = log.time ? log.time.split(',')[0].trim() : '';

    // Find all items belonging to this vendor from this receiving shipment / day
    const vendorLogs = stockInLogs.filter(
      (l) =>
        (l.usedBy || '').trim().toLowerCase() === targetVendor.toLowerCase() &&
        (!targetDate || !l.time || l.time.startsWith(targetDate))
    );

    const itemsToUse = vendorLogs.length > 0 ? vendorLogs : [log];

    const totalShipmentBill = itemsToUse.reduce((sum, item) => {
      const lineTotal = (item.lineTotal && item.lineTotal > 0) ? item.lineTotal : ((item.qtyUsed || 1) * (parseFloat(item.unitPrice) || 0));
      return sum + lineTotal;
    }, 0);

    // Look up ALL payments recorded for this vendor
    const matchingPayments = vendorPayments.filter(
      (p) => (p.vendorName || '').trim().toLowerCase() === targetVendor.toLowerCase()
    );
    const sumAlreadyPaid = matchingPayments.reduce(
      (sum, p) => sum + (parseFloat(p.amountPaid) || 0),
      0
    );

    const alreadyPaidVal = matchingPayments.length > 0
      ? sumAlreadyPaid
      : itemsToUse.reduce((max, it) => Math.max(max, parseFloat(it.amountPaid) || 0), 0);
    const currentRemaining = Math.max(0, totalShipmentBill - alreadyPaidVal);

    setPaymentPopupData({
      logId: log.id,
      vendor: targetVendor,
      items: itemsToUse,
      totalAmount: totalShipmentBill,
      alreadyPaid: alreadyPaidVal,
      cashPaid: currentRemaining > 0 ? String(currentRemaining) : '',
      paymentMethod: matchingPayments[0]?.paymentMethod || log.paymentMethod || 'Cash',
      biltyNo: matchingPayments[0]?.referenceNo ? matchingPayments[0].referenceNo.replace('Bill #', '').replace('#', '') : (log.biltyNo || ''),
      notes: '',
      itemsCount: itemsToUse.length
    });
    setPaymentPopupOpen(true);
  };

  // Confirm handler from Cash Payment Popup
  const handleConfirmPaymentAndPrint = async (shouldPrint = true) => {
    const newPaidVal = parseFloat(paymentPopupData.cashPaid) || 0;
    const vendorName = (paymentPopupData.vendor || 'Supplier').trim();
    const total = paymentPopupData.totalAmount;
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

    if (newPaidVal > 0 && vendorName && vendorName !== 'Vendor Shipment' && vendorName !== 'Direct Supplier') {
      try {
        const itemNamesSummary = paymentPopupData.items?.map((it) => it.itemName).filter(Boolean).join(', ') || 'Shipment';
        await addVendorPayment({
          vendorName: vendorName,
          amountPaid: newPaidVal,
          paymentMethod: paymentPopupData.paymentMethod || 'Cash',
          referenceNo: poNumber,
          notes: `Paid at Stock In (${paymentPopupData.itemsCount || 1} items: ${itemNamesSummary})`
        });
      } catch (err) {
        console.error('Failed to record vendor payment:', err);
      }
    }

    // Update all matching shipment logs with totalPaidCombined, remaining, biltyNo, paymentMethod
    if (paymentPopupData.items && paymentPopupData.items.length > 0) {
      paymentPopupData.items.forEach((item) => {
        updateLog(item.id, {
          amountPaid: totalPaidCombined,
          remainingBalance: remaining,
          biltyNo: paymentPopupData.biltyNo || '',
          paymentMethod: paymentPopupData.paymentMethod || 'Cash'
        });
      });
    }

    setPaymentPopupOpen(false);

    if (shouldPrint) {
      setPrintData({
        id: poNumber,
        type: 'Stock In (Receiving Invoice)',
        vendor: vendorName,
        biltyNo: paymentPopupData.biltyNo || '',
        lineTotal: total,
        amountPaid: totalPaidCombined,
        remainingBalance: remaining,
        paymentMethod: paymentPopupData.paymentMethod || 'Cash',
        time: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      });
      setPrintModalOpen(true);
    }
  };

  // Open Print Modal for Row Log
  const handleOpenPrint = (log) => {
    setPrintData({
      id: log.itemCode || `INV-${log.id}`,
      type: 'Stock In Receipt',
      vendor: log.usedBy || 'Vendor',
      biltyNo: log.biltyNo || '',
      receivedDate: log.time || '',
      itemName: log.itemName,
      qty: log.qtyUsed,
      unitPrice: log.unitPrice || 0,
      lineTotal: log.lineTotal || log.qtyUsed * (log.unitPrice || 0),
      amountPaid: log.amountPaid,
      remainingBalance: log.remainingBalance,
      paymentMethod: log.paymentMethod || 'Cash',
      time: log.time
    });
    setPrintModalOpen(true);
  };

  // Close Print Modal & Focus Item Select Input
  const handleClosePrintModal = () => {
    setPrintModalOpen(false);
    setTimeout(() => {
      if (itemSelectRef.current) {
        itemSelectRef.current.focus();
      }
    }, 50);
  };

  // Trigger System Print Window
  const handlePrint = () => {
    window.print();
  };

  // Open Edit Drawer
  const handleOpenEdit = (log) => {
    const qty = Number(log.qtyUsed) || 1;
    const unitPrice = Number(log.unitPrice) || 0;
    const totalBill = log.lineTotal !== undefined ? log.lineTotal : (qty * unitPrice);

    setEditingLog({
      ...log,
      vendor: log.usedBy || vendorList[0],
      qty: qty,
      unitPrice: unitPrice,
      totalBillAmount: Math.round(totalBill * 100) / 100,
      biltyNo: log.biltyNo || ''
    });
    setEditDrawerOpen(true);
  };

  // Edit Submit Handler
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    const qtyVal = parseInt(editingLog.qty) || 1;
    const billVal = parseFloat(editingLog.totalBillAmount) || 0;
    const priceVal = qtyVal > 0 ? (billVal / qtyVal) : (parseFloat(editingLog.unitPrice) || 0);

    await updateLog(editingLog.id, {
      itemName: editingLog.itemName,
      usedBy: editingLog.vendor,
      qtyUsed: qtyVal,
      unitPrice: priceVal,
      lineTotal: billVal > 0 ? billVal : (qtyVal * priceVal),
      biltyNo: (editingLog.biltyNo || '').trim()
    });
    setEditDrawerOpen(false);
  };

  // Single Delete Handlers
  const handleOpenDelete = (log) => {
    setLogToDelete(log);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (logToDelete) {
      deleteLog(logToDelete.id);
      setSelected((prev) => prev.filter((id) => id !== logToDelete.id));
      setDeleteDialogOpen(false);
      setLogToDelete(null);
    }
  };

  // Bulk Delete Handler
  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleLogs(selected);
      setSelected([]);
      setBulkDeleteDialogOpen(false);
    }
  };

  // Filter logs for IN transactions
  const stockInLogs = usageLogs.filter((log) => {
    const isIN = log.type && log.type.toUpperCase().includes('IN');
    const matchedItem = items.find((i) => i.name.toLowerCase() === (log.itemName || '').toLowerCase());
    const logCat = log.category || matchedItem?.category || 'General';

    const matchesSearch =
      (log.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.usedBy && log.usedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.department && log.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      logCat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || logCat.toLowerCase() === selectedCategory.toLowerCase();

    return isIN && matchesSearch && matchesCategory;
  });

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = stockInLogs.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Group filtered logs by Vendor Name (Collapsible separation)
  const groupedStockInLogs = useMemo(() => {
    const groups = {};
    stockInLogs.forEach((log) => {
      const vName = (log.usedBy || log.vendor || log.department || 'Direct Supplier').trim();
      if (!groups[vName]) {
        groups[vName] = {
          vendorName: vName,
          items: [],
          totalQty: 0,
          totalBill: 0,
          latestTime: log.time || '',
          latestEpoch: 0,
          biltyNos: new Set()
        };
      }
      const logTotal =
        log.lineTotal && log.lineTotal > 0
          ? log.lineTotal
          : (parseInt(log.qtyUsed) || 1) * (parseFloat(log.unitPrice) || 0);

      groups[vName].items.push(log);
      groups[vName].totalQty += parseInt(log.qtyUsed) || 1;
      groups[vName].totalBill += logTotal;
      if (log.biltyNo) groups[vName].biltyNos.add(log.biltyNo);

      const logEpoch = new Date(log.dateISO || log.created_at || log.time || 0).getTime();
      if (logEpoch >= (groups[vName].latestEpoch || 0)) {
        groups[vName].latestEpoch = logEpoch;
        groups[vName].latestTime = log.time || '';
      }
    });

    return Object.values(groups).map((group) => {
      // Sort line items newest first
      group.items.sort(
        (a, b) => new Date(b.dateISO || b.created_at || b.time || 0) - new Date(a.dateISO || a.created_at || a.time || 0)
      );

      const vLower = group.vendorName.toLowerCase();
      const matchingPayments = vendorPayments.filter(
        (vp) => (vp.vendorName || '').trim().toLowerCase() === vLower
      );
      const totalPaidVal = matchingPayments.reduce(
        (sum, p) => sum + (parseFloat(p.amountPaid) || 0),
        0
      );
      const paidVal =
        matchingPayments.length > 0
          ? totalPaidVal
          : group.items.reduce((max, it) => Math.max(max, parseFloat(it.amountPaid) || 0), 0);
      const balanceVal = Math.max(0, group.totalBill - paidVal);

      return {
        ...group,
        biltyList: Array.from(group.biltyNos),
        totalPaid: paidVal,
        remainingBalance: balanceVal,
        paymentMethod: matchingPayments[0]?.paymentMethod || group.items[0]?.paymentMethod || 'Cash'
      };
    });
  }, [stockInLogs, vendorPayments]);

  // Expansion State
  const [expandedVendors, setExpandedVendors] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const isSearching = Boolean(searchTerm.trim() || selectedCategory !== 'All');

  const isVendorExpanded = (vName) => {
    if (isSearching) return true;
    if (expandedVendors[vName] !== undefined) return expandedVendors[vName];
    return allExpanded;
  };

  const toggleVendorExpand = (vName) => {
    setExpandedVendors((prev) => {
      const current = isVendorExpanded(vName);
      return { ...prev, [vName]: !current };
    });
  };

  const handleToggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated = {};
    groupedStockInLogs.forEach((g) => {
      updated[g.vendorName] = nextState;
    });
    setExpandedVendors(updated);
  };

  // Group Checkbox Selection Handlers
  const isGroupSelected = (group) => {
    const groupIds = group.items.map((i) => i.id);
    return groupIds.length > 0 && groupIds.every((id) => selected.includes(id));
  };

  const isGroupIndeterminate = (group) => {
    const groupIds = group.items.map((i) => i.id);
    const someSelected = groupIds.some((id) => selected.includes(id));
    const allSelected = groupIds.every((id) => selected.includes(id));
    return someSelected && !allSelected;
  };

  const handleSelectGroup = (e, group) => {
    e.stopPropagation();
    const groupIds = group.items.map((i) => i.id);
    const allGroupSelected = groupIds.every((id) => selected.includes(id));
    if (allGroupSelected) {
      setSelected((prev) => prev.filter((id) => !groupIds.includes(id)));
    } else {
      setSelected((prev) => Array.from(new Set([...prev, ...groupIds])));
    }
  };

  const lineTotal = Math.max(0, (form.totalBillAmount !== undefined && form.totalBillAmount !== '' ? (parseFloat(form.totalBillAmount) || 0) : ((parseInt(form.qty) || 0) * (parseFloat(form.unitPrice) || 0))) - (parseFloat(form.discount) || 0));

  return (
    <Stack spacing={3}>
      {/* 1. TOP SECTION: Record Stock In Form Card */}
      <MainCard
        title={isShop ? "Shop - Record Stock In (Receiving Invoice)" : "Record Stock In (Receiving Invoice)"}
        sx={{
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)'),
          borderRadius: 2
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleQuickAddToList(); }}>
          <Grid container spacing={2.5} alignItems="center">
            {/* ROW 1: Vendor, Item Select, Category, Image */}
            {/* 1. SELECT VENDOR / SUPPLIER */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Autocomplete
                freeSolo
                options={vendorList}
                value={form.vendor}
                onChange={(event, newValue) => {
                  const val = typeof newValue === 'string' ? newValue : (newValue || '');
                  setForm((prev) => ({ ...prev, vendor: val }));
                }}
                onInputChange={(event, newInputValue) => {
                  setForm((prev) => ({ ...prev, vendor: newInputValue }));
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px',
                    py: 0
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="SELECT VENDOR / SUPPLIER *"
                    required
                    placeholder="Select or Type Vendor"
                  />
                )}
              />
            </Grid>

            {/* 2. ITEM SELECT */}
            <Grid size={{ xs: 12, md: 3.5 }}>
              <Autocomplete
                freeSolo
                options={existingNamesList}
                value={form.itemName}
                onChange={(event, newValue) => handleItemNameChange(event, newValue)}
                onInputChange={(event, newInputValue) => handleItemNameChange(event, newInputValue)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px',
                    py: 0
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    inputRef={itemSelectRef}
                    label="ITEM SELECT *"
                    required
                    placeholder="Select Item"
                  />
                )}
              />
            </Grid>

            {/* 3. CATEGORY SELECT */}
            <Grid size={{ xs: 12, md: 2.5 }}>
              <Autocomplete
                freeSolo
                options={categoryOptions}
                value={form.category}
                onChange={(event, newValue) => {
                  const val = typeof newValue === 'string' ? newValue : (newValue || 'General');
                  setForm((prev) => ({ ...prev, category: val }));
                }}
                onInputChange={(event, newInputValue) => {
                  setForm((prev) => ({ ...prev, category: newInputValue || 'General' }));
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px',
                    py: 0
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="CATEGORY"
                    placeholder="Category"
                  />
                )}
              />
            </Grid>

            {/* 4. IMAGE URL / UPLOAD FROM PC */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="IMAGE (URL OR PC UPLOAD)"
                placeholder="Paste link or click icon ->"
                value={form.imageUrl ? (form.imageUrl.startsWith('data:') ? 'Local file selected' : form.imageUrl) : ''}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Upload local image from computer">
                        <IconButton component="label" size="small" edge="end">
                          <UploadOutlined style={{ fontSize: '1rem', color: '#005F56' }} />
                          <input type="file" hidden accept="image/*" onChange={handleLocalImageUpload} />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            {/* ROW 2: Qty, Total Bill, Discount, Line Total, Save Button */}
            {/* 5. QTY */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="QTY *"
                type="number"
                fullWidth
                required
                inputRef={qtyRef}
                inputProps={{ min: 1 }}
                value={form.qty}
                onChange={(e) => {
                  const val = e.target.value;
                  const qtyNum = parseInt(val) || 0;
                  const billNum = parseFloat(form.totalBillAmount) || 0;
                  const unitPrice = qtyNum > 0 ? (billNum / qtyNum) : billNum;
                  setForm((prev) => ({
                    ...prev,
                    qty: val === '' ? '' : qtyNum,
                    unitPrice
                  }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (priceRef.current) {
                      priceRef.current.focus();
                      priceRef.current.select();
                    }
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            {/* 6. TOTAL BILL AMOUNT (PKR) */}
            <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
              <TextField
                label="TOTAL BILL AMOUNT (PKR) *"
                type="number"
                fullWidth
                disabled={!canEditPrice}
                inputRef={priceRef}
                inputProps={{ min: 0, step: 'any' }}
                value={form.totalBillAmount !== undefined ? form.totalBillAmount : (form.unitPrice ? ((parseInt(form.qty) || 1) * form.unitPrice) : '')}
                onChange={(e) => {
                  const val = e.target.value;
                  const billNum = parseFloat(val) || 0;
                  const qtyNum = parseInt(form.qty) || 1;
                  const unitPrice = qtyNum > 0 ? (billNum / qtyNum) : billNum;
                  setForm((prev) => ({
                    ...prev,
                    totalBillAmount: val,
                    unitPrice
                  }));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddToList();
                  }
                }}
                helperText={
                  Number(form.qty) > 0 && Number(form.totalBillAmount) > 0
                    ? `Rate: Rs. ${(Number(form.totalBillAmount) / Number(form.qty)).toFixed(2)} / unit`
                    : 'Calculates rate per unit'
                }
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            {/* 7. DISCOUNT (PKR) */}
            <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
              <TextField
                label="DISCOUNT (PKR)"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 'any' }}
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddToList();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            {/* 8. LINE TOTAL (PKR) */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Box
                sx={{
                  height: '44px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  px: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#bbf7d0'),
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#f0fdf4')
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', lineHeight: 1 }}>
                  LINE TOTAL (PKR)
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#10b981', mt: 0.2, lineHeight: 1.2 }}>
                  Rs. {lineTotal.toLocaleString()}
                </Typography>
              </Box>
            </Grid>

            {/* 9. SAVE BUTTON */}
            <Grid size={{ xs: 12, sm: 12, md: 3.2 }}>
              <Button
                variant="contained"
                type="button"
                onClick={handleSaveButtonClick}
                fullWidth
                startIcon={<PlusOutlined />}
                sx={{
                  height: '44px',
                  bgcolor: '#10b981',
                  '&:hover': { bgcolor: '#059669' },
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                + Save Stock In Invoice
              </Button>
            </Grid>
          </Grid>
        </form>
      </MainCard>

      {/* 2. BOTTOM SECTION: Stock In Logs Table Card */}
      <MainCard
        title={isShop ? "Shop Stock In (Receiving Logs)" : "Stock In (Receiving Logs)"}
        secondary={
          selected.length > 0 && canDelete && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={() => setBulkDeleteDialogOpen(true)}
              size="small"
              sx={{ fontWeight: 700 }}
            >
              Delete Selected ({selected.length})
            </Button>
          )
        }
      >
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <OutlinedInput
              fullWidth
              size="small"
              placeholder="Search Stock In logs by Item Name, SKU, Supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              }
            />
          </Grid>

          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Category Filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {categoryOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 6, sm: 2 }}>
            <Button
              variant="outlined"
              size="medium"
              fullWidth
              onClick={handleToggleAll}
              startIcon={allExpanded ? <FolderOutlined /> : <FolderOpenOutlined />}
              sx={{
                fontWeight: 700,
                height: '40px',
                borderColor: 'divider',
                color: 'text.primary',
                textTransform: 'none',
                bgcolor: 'background.paper'
              }}
            >
              {allExpanded ? 'Collapse All' : 'Expand All'}
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 3 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" color="textSecondary">
              {selected.length > 0 ? (
                <strong style={{ color: '#ff4d4f' }}>{selected.length} records selected for deletion</strong>
              ) : (
                `Total ${stockInLogs.length} Records in ${groupedStockInLogs.length} ${groupedStockInLogs.length === 1 ? 'Vendor' : 'Vendors'}`
              )}
            </Typography>
          </Grid>
        </Grid>

        {/* Mobile Collapsible Cards (Visible on xs & sm viewports) */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {groupedStockInLogs.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No Stock In shipment records found.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {groupedStockInLogs.map((group) => {
                const expanded = isVendorExpanded(group.vendorName);
                const groupChecked = isGroupSelected(group);
                const groupIndeterminate = isGroupIndeterminate(group);

                return (
                  <Paper
                    key={group.vendorName}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1.5px solid',
                      borderColor: expanded ? '#10b981' : 'divider',
                      boxShadow: expanded ? '0 3px 12px rgba(16, 185, 129, 0.12)' : 'none'
                    }}
                  >
                    {/* Vendor Summary Header */}
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: (theme) =>
                          theme.palette.mode === 'dark'
                            ? expanded
                              ? 'rgba(16, 185, 129, 0.12)'
                              : 'grey.900'
                            : expanded
                            ? '#f0fdf4'
                            : '#fafafa',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleVendorExpand(group.vendorName)}
                    >
                      <Stack spacing={1.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1} alignItems="center">
                            {canDelete && (
                              <Checkbox
                                color="primary"
                                size="small"
                                checked={groupChecked}
                                indeterminate={groupIndeterminate}
                                onChange={(e) => handleSelectGroup(e, group)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <Box
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: 1.5,
                                bgcolor: '#10b981',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <ShopOutlined style={{ fontSize: '1rem' }} />
                            </Box>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={800} color="textPrimary">
                                {group.vendorName}
                              </Typography>
                              {group.biltyList.length > 0 && (
                                <Typography variant="caption" sx={{ color: '#096dd9', fontWeight: 700, display: 'block' }}>
                                  Bilty: #{group.biltyList.join(', #')}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                          <IconButton
                            size="small"
                            sx={{
                              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                              transition: 'transform 0.2s ease',
                              color: expanded ? '#10b981' : 'text.secondary'
                            }}
                          >
                            <DownOutlined style={{ fontSize: '0.75rem' }} />
                          </IconButton>
                        </Stack>

                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
                          <Chip
                            label={`${group.items.length} ${group.items.length === 1 ? 'Item' : 'Items'} (${group.totalQty} Total Qty)`}
                            size="small"
                            color="primary"
                            variant="light"
                            sx={{ fontWeight: 700 }}
                          />
                          <Typography variant="subtitle1" fontWeight={800} color="success.main">
                            Rs. {group.totalBill.toLocaleString()}
                          </Typography>
                        </Stack>

                        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {group.totalPaid > 0 ? (
                            <>
                              <Chip
                                label={`Paid: Rs. ${group.totalPaid.toLocaleString()}`}
                                size="small"
                                color="success"
                                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                              />
                              {group.remainingBalance > 0 ? (
                                <Chip
                                  label={`Due: Rs. ${group.remainingBalance.toLocaleString()}`}
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                />
                              ) : (
                                <Chip
                                  label="Cleared"
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                />
                              )}
                            </>
                          ) : (
                            <Chip
                              label="Udhaar (Unpaid)"
                              size="small"
                              color="error"
                              variant="outlined"
                              sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                            />
                          )}
                        </Stack>

                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ pt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outlined"
                            color="success"
                            size="small"
                            startIcon={<DollarOutlined />}
                            onClick={() => handleOpenPaymentPopup(group.items[0])}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          >
                            Pay
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<PrinterOutlined />}
                            onClick={() => handleOpenPrint(group.items[0])}
                            sx={{ fontWeight: 700, borderRadius: 1.5 }}
                          >
                            Print Invoice
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>

                    {/* Collapsible Inner Item List */}
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Divider />
                      <Box sx={{ p: 1.5, bgcolor: 'background.paper' }}>
                        <Stack spacing={1.25}>
                          {group.items.map((log) => {
                            const isItemSelected = isSelected(log.id);
                            const logLineTotal = (log.lineTotal && log.lineTotal > 0) ? log.lineTotal : ((log.qtyUsed || 1) * (parseFloat(log.unitPrice) || 0));
                            return (
                              <Paper
                                key={log.id}
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  borderRadius: 1.5,
                                  bgcolor: isItemSelected ? 'action.selected' : 'inherit'
                                }}
                              >
                                <Stack spacing={1}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Stack direction="row" spacing={1} alignItems="center">
                                      {canDelete && (
                                        <Checkbox
                                          color="primary"
                                          size="small"
                                          checked={isItemSelected}
                                          onChange={(e) => handleSelectOne(e, log.id)}
                                        />
                                      )}
                                      <Box>
                                        <Typography variant="subtitle2" fontWeight={700}>
                                          {log.itemName}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                          {log.itemCode || log.id}
                                        </Typography>
                                      </Box>
                                    </Stack>
                                    <Chip label={`+${log.qtyUsed}`} size="small" color="success" variant="light" sx={{ fontWeight: 700 }} />
                                  </Stack>

                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle2" fontWeight={800} color="success.main">
                                      Rs. {logLineTotal.toLocaleString()}
                                    </Typography>
                                  </Stack>

                                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
                                    <Typography variant="caption" color="textSecondary">
                                      {log.time}
                                    </Typography>
                                    <Stack direction="row" spacing={0.5}>
                                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(log)}>
                                        <EditOutlined style={{ fontSize: '0.85rem' }} />
                                      </IconButton>
                                      {canDelete && (
                                        <IconButton size="small" color="error" onClick={() => handleOpenDelete(log)}>
                                          <DeleteOutlined style={{ fontSize: '0.85rem' }} />
                                        </IconButton>
                                      )}
                                    </Stack>
                                  </Stack>
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Desktop Collapsible Stock In Table (Visible on md and up) */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Table sx={{ minWidth: 700 }}>
              <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : '#f8fafc') }}>
                <TableRow>
                  {canDelete && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < stockInLogs.length}
                        checked={stockInLogs.length > 0 && selected.length === stockInLogs.length}
                        onChange={handleSelectAllClick}
                        inputProps={{ 'aria-label': 'select all stock in' }}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={{ width: 44, pr: 0 }} />
                  <TableCell><strong>VENDOR / SUPPLIER</strong></TableCell>
                  <TableCell align="center"><strong>TOTAL ITEMS</strong></TableCell>
                  <TableCell align="center"><strong>TOTAL QTY</strong></TableCell>
                  <TableCell align="right"><strong>TOTAL BILL AMOUNT</strong></TableCell>
                  <TableCell align="center"><strong>PAYMENT STATUS</strong></TableCell>
                  <TableCell align="right"><strong>LATEST DATE</strong></TableCell>
                  <TableCell align="center"><strong>ACTIONS</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupedStockInLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canDelete ? 9 : 8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No Stock In shipment records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  groupedStockInLogs
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((group) => {
                    const expanded = isVendorExpanded(group.vendorName);
                    const groupChecked = isGroupSelected(group);
                    const groupIndeterminate = isGroupIndeterminate(group);

                    return (
                      <Fragment key={group.vendorName}>
                        {/* Parent Vendor Row */}
                        <TableRow
                          hover
                          onClick={() => toggleVendorExpand(group.vendorName)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: (theme) =>
                              expanded
                                ? theme.palette.mode === 'dark'
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : '#f0fdf4'
                                : 'inherit',
                            borderBottom: expanded ? 'none' : '1px solid',
                            borderColor: 'divider',
                            transition: 'background-color 0.2s ease',
                            '&:hover': {
                              bgcolor: (theme) =>
                                theme.palette.mode === 'dark'
                                  ? 'rgba(16, 185, 129, 0.18)'
                                  : '#ecfdf5'
                            }
                          }}
                        >
                          {canDelete && (
                            <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                color="primary"
                                checked={groupChecked}
                                indeterminate={groupIndeterminate}
                                onChange={(e) => handleSelectGroup(e, group)}
                              />
                            </TableCell>
                          )}
                          <TableCell sx={{ width: 44, pr: 0 }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVendorExpand(group.vendorName);
                              }}
                              sx={{
                                color: expanded ? '#10b981' : 'text.secondary',
                                transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                transition: 'transform 0.2s ease'
                              }}
                            >
                              <DownOutlined style={{ fontSize: '0.75rem' }} />
                            </IconButton>
                          </TableCell>

                          {/* Vendor Name */}
                          <TableCell>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7'),
                                  color: '#10b981',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.9rem'
                                }}
                              >
                                <ShopOutlined />
                              </Box>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.2 }}>
                                  {group.vendorName}
                                </Typography>
                                {group.biltyList.length > 0 && (
                                  <Typography variant="caption" sx={{ color: '#096dd9', fontWeight: 600, display: 'block', mt: 0.2 }}>
                                    Bilty: #{group.biltyList.join(', #')}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>

                          {/* Total Items Count */}
                          <TableCell align="center">
                            <Chip
                              label={`${group.items.length} ${group.items.length === 1 ? 'Item' : 'Items'}`}
                              size="small"
                              variant="light"
                              color="primary"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>

                          {/* Total Qty */}
                          <TableCell align="center">
                            <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#10b981' }}>
                              +{group.totalQty}
                            </Typography>
                          </TableCell>

                          {/* Total Bill Amount */}
                          <TableCell align="right">
                            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#111827' }}>
                              Rs. {group.totalBill.toLocaleString()}
                            </Typography>
                          </TableCell>

                          {/* Payment Status */}
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            {group.totalPaid > 0 ? (
                              <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                <Chip
                                  label={`Paid: Rs. ${group.totalPaid.toLocaleString()}`}
                                  size="small"
                                  color="success"
                                  sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                />
                                {group.remainingBalance > 0 ? (
                                  <Chip
                                    label={`Due: Rs. ${group.remainingBalance.toLocaleString()}`}
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                  />
                                ) : (
                                  <Chip
                                    label="Cleared"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                                  />
                                )}
                              </Stack>
                            ) : (
                              <Chip
                                label="Udhaar (Unpaid)"
                                size="small"
                                color="error"
                                variant="outlined"
                                sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                              />
                            )}
                          </TableCell>

                          {/* Latest Date */}
                          <TableCell align="right">
                            <Typography variant="caption" color="textSecondary" fontWeight={600}>
                              {group.latestTime}
                            </Typography>
                          </TableCell>

                          {/* Vendor Group Actions */}
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <Stack direction="row" spacing={0.75} justifyContent="center" alignItems="center">
                              <Tooltip title={`Record Cash Payment for ${group.vendorName}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPaymentPopup(group.items[0])}
                                  sx={{
                                    color: '#10b981',
                                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#e6f7ff'),
                                    '&:hover': { bgcolor: '#10b981', color: '#fff' }
                                  }}
                                >
                                  <DollarOutlined />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={`Print Combined Invoice (${group.items.length} items)`}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenPrint(group.items[0])}
                                  sx={{
                                    color: '#1890ff',
                                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(24, 144, 255, 0.2)' : '#f0f5ff'),
                                    '&:hover': { bgcolor: '#1890ff', color: '#fff' }
                                  }}
                                >
                                  <PrinterOutlined />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Inner Item Rows */}
                        <TableRow key={`${group.vendorName}-inner`}>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={canDelete ? 9 : 8}>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box
                                sx={{
                                  py: 1.5,
                                  px: 2,
                                  my: 1,
                                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.900' : '#f8fafc'),
                                  borderRadius: 2,
                                  border: '1px solid',
                                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : '#e2e8f0'),
                                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
                                }}
                              >
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                                  <Typography variant="subtitle2" fontWeight={800} color="text.secondary">
                                    Line Items Received from {group.vendorName} ({group.items.length})
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Click pencil to edit or trash to delete individual line items
                                  </Typography>
                                </Stack>

                                <Table size="small" sx={{ minWidth: 600 }}>
                                  <TableHead>
                                    <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', bgcolor: 'transparent', borderBottom: '1.5px solid #cbd5e1' } }}>
                                      {canDelete && <TableCell padding="checkbox" sx={{ width: 40 }}></TableCell>}
                                      <TableCell>ITEM SELECT</TableCell>
                                      <TableCell>CATEGORY</TableCell>
                                      <TableCell align="center">QTY</TableCell>
                                      <TableCell align="right">LINE TOTAL</TableCell>
                                      <TableCell align="center">BILTY / REF</TableCell>
                                      <TableCell align="right">DATE & TIME</TableCell>
                                      <TableCell align="center">ACTIONS</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {group.items.map((log) => {
                                      const isItemSelected = isSelected(log.id);
                                      const matchedItem = items.find((i) => i.name.toLowerCase() === (log.itemName || '').toLowerCase());
                                      const logCat = log.category || matchedItem?.category || 'General';
                                      const logLineTotal = (log.lineTotal && log.lineTotal > 0) ? log.lineTotal : ((log.qtyUsed || 1) * (parseFloat(log.unitPrice) || 0));

                                      return (
                                        <TableRow
                                          key={log.id}
                                          hover
                                          selected={isItemSelected}
                                          sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            bgcolor: isItemSelected ? 'action.selected' : 'inherit'
                                          }}
                                        >
                                          {canDelete && (
                                            <TableCell padding="checkbox">
                                              <Checkbox
                                                color="primary"
                                                size="small"
                                                checked={isItemSelected}
                                                onChange={(e) => handleSelectOne(e, log.id)}
                                              />
                                            </TableCell>
                                          )}
                                          <TableCell>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                              {log.itemName}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                              {log.itemCode || log.id}
                                            </Typography>
                                          </TableCell>
                                          <TableCell>
                                            <Chip label={logCat} size="small" variant="light" color="primary" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                                          </TableCell>
                                          <TableCell align="center">
                                            <Typography variant="subtitle2" fontWeight={700} color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                              <ArrowUpOutlined style={{ fontSize: '0.7rem' }} /> +{log.qtyUsed}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography variant="subtitle2" fontWeight={800} color="success.dark">
                                              Rs. {logLineTotal.toLocaleString()}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="center">
                                            {log.biltyNo ? (
                                              <Chip label={`#${log.biltyNo}`} size="small" variant="outlined" color="info" sx={{ fontWeight: 600, fontSize: '0.7rem' }} />
                                            ) : (
                                              <Typography variant="caption" color="textSecondary">—</Typography>
                                            )}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Typography variant="caption" color="textSecondary">
                                              {log.time}
                                            </Typography>
                                          </TableCell>
                                          <TableCell align="center">
                                            <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                                              <Tooltip title="Print single item receipt">
                                                <IconButton
                                                  size="small"
                                                  color="info"
                                                  onClick={() => handleOpenPrint(log)}
                                                >
                                                  <PrinterOutlined style={{ fontSize: '0.85rem' }} />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Edit item line">
                                                <IconButton
                                                  size="small"
                                                  color="primary"
                                                  onClick={() => handleOpenEdit(log)}
                                                >
                                                  <EditOutlined style={{ fontSize: '0.85rem' }} />
                                                </IconButton>
                                              </Tooltip>
                                              {canDelete && (
                                                <Tooltip title="Delete item line">
                                                  <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleOpenDelete(log)}
                                                  >
                                                    <DeleteOutlined style={{ fontSize: '0.85rem' }} />
                                                  </IconButton>
                                                </Tooltip>
                                              )}
                                            </Stack>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={groupedStockInLogs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </MainCard>

      {/* Edit Stock In Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 440 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
            Edit Stock In Record
          </Typography>

          {editingLog && (
            <form onSubmit={handleEditSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  select
                  label="SELECT VENDOR / SUPPLIER *"
                  fullWidth
                  required
                  value={editingLog.vendor}
                  onChange={(e) => setEditingLog({ ...editingLog, vendor: e.target.value })}
                >
                  {vendorList.map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="ITEM SELECT *"
                  fullWidth
                  required
                  value={editingLog.itemName}
                  onChange={(e) => setEditingLog({ ...editingLog, itemName: e.target.value })}
                />

                <TextField
                  label="QTY *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  value={editingLog.qty}
                  onChange={(e) => {
                    const val = e.target.value;
                    const qtyNum = parseInt(val) || 0;
                    const billNum = parseFloat(editingLog.totalBillAmount) || 0;
                    const unitPrice = qtyNum > 0 ? (billNum / qtyNum) : billNum;
                    setEditingLog((prev) => ({
                      ...prev,
                      qty: val === '' ? '' : qtyNum,
                      unitPrice
                    }));
                  }}
                />

                <TextField
                  label="TOTAL BILL AMOUNT (RS) *"
                  type="number"
                  fullWidth
                  disabled={!canEditPrice}
                  inputProps={{ min: 0, step: 'any' }}
                  value={editingLog.totalBillAmount !== undefined ? editingLog.totalBillAmount : ((parseInt(editingLog.qty) || 1) * (parseFloat(editingLog.unitPrice) || 0))}
                  onChange={(e) => {
                    const val = e.target.value;
                    const billNum = parseFloat(val) || 0;
                    const qtyNum = parseInt(editingLog.qty) || 1;
                    const unitPrice = qtyNum > 0 ? (billNum / qtyNum) : billNum;
                    setEditingLog((prev) => ({
                      ...prev,
                      totalBillAmount: val,
                      unitPrice
                    }));
                  }}
                  helperText={
                    Number(editingLog.qty) > 0 && Number(editingLog.totalBillAmount) > 0
                      ? `Rate: Rs. ${(Number(editingLog.totalBillAmount) / Number(editingLog.qty)).toFixed(2)} / unit`
                      : 'Calculates rate per unit automatically'
                  }
                />

                <TextField
                  label="LINE TOTAL"
                  fullWidth
                  disabled
                  value={`Rs. ${(editingLog.totalBillAmount !== undefined && editingLog.totalBillAmount !== '' ? (parseFloat(editingLog.totalBillAmount) || 0) : ((parseInt(editingLog.qty) || 0) * (parseFloat(editingLog.unitPrice) || 0))).toLocaleString()}`}
                />

                <TextField
                  label="BILTY / REF NO"
                  fullWidth
                  placeholder="e.g. 4550, BL-1092"
                  value={editingLog.biltyNo || ''}
                  onChange={(e) => setEditingLog({ ...editingLog, biltyNo: e.target.value })}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" color="primary" type="submit">
                    Update Record
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Stock In Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the Stock In record for <strong>{logToDelete?.itemName}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selected.length}</strong> selected Stock In records?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} color="error" variant="contained">
            Delete {selected.length} Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* CASH PAYMENT POPUP MODAL (Opens on table action button click) */}
      <Dialog
        open={paymentPopupOpen}
        onClose={() => setPaymentPopupOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2.5,
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.16)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            py: 2,
            px: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#ffffff')
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DollarOutlined style={{ fontSize: '1.2rem', color: '#10b981' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Record Cash Payment
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Vendor Receiving Settlement
              </Typography>
            </Box>
          </Stack>
          <Chip label="Vendor Settlement" color="success" size="small" variant="light" sx={{ fontWeight: 700 }} />
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'inherit' : '#ffffff') }}>
          <Stack spacing={2.5}>
            {/* Vendor & Total Bill Display */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4'),
                border: '1px solid #bbf7d0'
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, sm: 6.5 }}>
                  <Typography variant="caption" color="textSecondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.5px">
                    Vendor / Supplier
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="textPrimary" sx={{ mt: 0.3 }}>
                    {paymentPopupData.vendor || 'Supplier'}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                    {paymentPopupData.items && paymentPopupData.items.length > 1
                      ? `Total Shipment: ${paymentPopupData.items.length} Items Received`
                      : `Item: ${paymentPopupData.items?.[0]?.itemName || paymentPopupData.itemName || 'Shipment'}`}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 5.5 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="caption" color="textSecondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.5px">
                    Total Shipment Bill
                  </Typography>
                  <Typography variant="h3" fontWeight={900} color="#10b981" sx={{ mt: 0.3 }}>
                    Rs. {Number(paymentPopupData.totalAmount || 0).toLocaleString()}
                  </Typography>
                  {Number(paymentPopupData.alreadyPaid) > 0 && (
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 800, display: 'block', mt: 0.5 }}>
                      Paid to Date: Rs. {Number(paymentPopupData.alreadyPaid).toLocaleString()}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              {/* Items Breakdown list if multiple items */}
              {paymentPopupData.items && paymentPopupData.items.length > 1 && (
                <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #bbf7d0' }}>
                  <Typography variant="caption" color="textSecondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.5px" display="block" sx={{ mb: 1 }}>
                    Shipment Items Breakdown ({paymentPopupData.items.length} Items)
                  </Typography>
                  <Stack spacing={0.75}>
                    {paymentPopupData.items.map((it, idx) => {
                      const itTotal = (it.lineTotal && it.lineTotal > 0) ? it.lineTotal : ((it.qtyUsed || 1) * (parseFloat(it.unitPrice) || 0));
                      return (
                        <Stack
                          key={it.id || idx}
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255, 255, 255, 0.85)',
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 1,
                            border: '1px solid #e5e7eb'
                          }}
                        >
                          <Typography variant="body2" fontWeight={700}>
                            {it.itemName} <span style={{ color: '#6b7280', fontWeight: 500 }}>(Qty: {it.qtyUsed || 1})</span>
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={800} color="textPrimary">
                            Rs. {itTotal.toLocaleString()}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Cash Paid Input */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Payment Amount to Pay (PKR) *
              </Typography>
              <TextField
                autoFocus
                fullWidth
                type="number"
                placeholder="Enter amount to pay in PKR..."
                value={paymentPopupData.cashPaid}
                onChange={(e) => setPaymentPopupData((prev) => ({ ...prev, cashPaid: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleConfirmPaymentAndPrint(true);
                  }
                }}
                inputProps={{ min: 0, step: 'any' }}
                helperText={
                  parseFloat(paymentPopupData.cashPaid) > 0
                    ? `Rs. ${parseFloat(paymentPopupData.cashPaid).toLocaleString()} will be recorded as payment for ${paymentPopupData.vendor}.`
                    : 'Enter 0 or leave empty if no payment is being made right now.'
                }
              />
            </Box>

            {/* Payment Method & Optional Bilty # */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Payment Method
                </Typography>
                <TextField
                  select
                  fullWidth
                  value={paymentPopupData.paymentMethod || 'Cash'}
                  onChange={(e) => setPaymentPopupData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer / Online</MenuItem>
                  <MenuItem value="Cheque">Cheque</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Vendor Bill / Bilty # (Optional)
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. Bill # 1045 / Bilty 99"
                  value={paymentPopupData.biltyNo}
                  onChange={(e) => setPaymentPopupData((prev) => ({ ...prev, biltyNo: e.target.value }))}
                />
              </Grid>
            </Grid>

            {/* Remaining Balance Summary Card */}
            {(() => {
              const alreadyPaid = parseFloat(paymentPopupData.alreadyPaid) || 0;
              const newPaid = parseFloat(paymentPopupData.cashPaid) || 0;
              const totalPaidCombined = alreadyPaid + newPaid;
              const remaining = Math.max(0, paymentPopupData.totalAmount - totalPaidCombined);
              const isCredit = totalPaidCombined === 0;

              return (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: remaining > 0 ? '#fef2f2' : '#f0fdf4',
                    border: '1px solid',
                    borderColor: remaining > 0 ? '#fca5a5' : '#86efac',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <Typography variant="caption" color="textSecondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.5px">
                      Payment Status
                    </Typography>
                    <Typography variant="subtitle1" fontWeight={800} color={remaining > 0 ? 'error.dark' : 'success.dark'}>
                      {remaining === 0 ? 'Fully Cleared (Rs. 0 Balance)' : isCredit ? 'Full Credit (Udhaar)' : 'Partial Payment'}
                    </Typography>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="textSecondary" fontWeight={700} textTransform="uppercase" letterSpacing="0.5px">
                      Remaining Balance Due
                    </Typography>
                    <Typography variant="h4" fontWeight={900} color={remaining > 0 ? 'error.main' : 'success.main'}>
                      Rs. {remaining.toLocaleString()}
                    </Typography>
                  </div>
                </Box>
              );
            })()}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2.5,
            px: 3,
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
            borderTop: '1px solid',
            borderColor: 'divider',
            justifyContent: 'space-between'
          }}
        >
          <Button variant="outlined" color="secondary" onClick={() => setPaymentPopupOpen(false)}>
            Cancel
          </Button>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="success"
              onClick={() => handleConfirmPaymentAndPrint(false)}
              sx={{ fontWeight: 700, px: 2.5 }}
            >
              Save Only
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<PrinterOutlined />}
              onClick={() => handleConfirmPaymentAndPrint(true)}
              sx={{
                fontWeight: 800,
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                px: 3
              }}
            >
              Save & Print Receipt
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Print Invoice Receipt Modal Dialog */}
      <Dialog open={printModalOpen} onClose={handleClosePrintModal} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 4mm 5mm;
              }
            #root { display: none !important; }
                body * {
                visibility: hidden !important;
              }
              #printable-invoice-stockin, #printable-invoice-stockin * {
                visibility: visible !important;
              }
              #printable-invoice-stockin {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 60px 4px 6px 4px !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .MuiDialog-root,
              .MuiDialog-container,
              .MuiDialog-paper,
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                overflow: visible !important;
                box-shadow: none !important;
              }
              .MuiBackdrop-root,
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>Vendor Stock Receiving Invoice & Statement</Typography>
          <Chip label={printData?.type || 'Stock In'} color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {printData && (() => {
            const activeVendorLogs = stockInLogs.filter(
              (log) => (log.usedBy || '').toLowerCase() === (printData.vendor || '').toLowerCase()
            );

            const displayLogs = activeVendorLogs.length > 0 ? activeVendorLogs : [
              {
                id: printData.id,
                itemName: printData.itemName,
                itemCode: printData.id,
                qtyUsed: printData.qty,
                unitPrice: printData.unitPrice,
                lineTotal: printData.lineTotal
              }
            ];

            const grandTotalSum = displayLogs.reduce((sum, item) => {
              const total = item.lineTotal || (item.qtyUsed * (item.unitPrice || 0));
              return sum + total;
            }, 0);

            return (
              <Box id="printable-invoice-stockin" sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 5, sm: 7 }, px: { xs: 1, sm: 1.5 }, pb: { xs: 1, sm: 1.5 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  {/* Structured Professional Vendor & PO Metadata Card */}
                  <div style={{
                    border: '1.5px solid #111827',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                      {/* Left Column: Vendor Details */}
                      <div style={{ flex: '1.2', padding: '6px 10px', borderRight: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                          Vendor / Supplier Details
                        </div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                          {printData.vendor || 'Supplier'}
                        </div>
                        <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                          <div><strong>Stock In Entry Type:</strong> {printData.type || 'Stock Receiving'}</div>
                        </div>
                      </div>

                      {/* Right Column: PO Meta */}
                      <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 700 }}>PO / Voucher No:</span>
                          <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>{printData.id}</span>
                        </div>
                        {printData.biltyNo && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Vendor Bill / Bilty #:</span>
                            <span style={{ fontWeight: 800, color: '#111827' }}>{printData.biltyNo}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                          <span style={{ fontWeight: 700, color: '#374151' }}>{printData.time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Status:</span>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>Received</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '10px', backgroundColor: 'transparent' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                        <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontSize: '0.82rem' }}>
                          <strong>Sr</strong>
                        </th>
                        <th style={{ width: '62%', borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                          <strong>Specification / Item Name</strong>
                        </th>
                        <th style={{ width: '14%', borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontSize: '0.82rem' }}>
                          <strong>QTY</strong>
                        </th>
                        <th style={{ width: '16%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                          <strong>Total Amount</strong>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayLogs.map((item, idx) => {
                        const itemUnitPrice = item.unitPrice || 0;
                        const itemLineTotal = item.lineTotal || (item.qtyUsed * itemUnitPrice);
                        const itemQty = item.qtyUsed || 1;

                        return (
                          <tr key={item.id || idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.25 }}>
                              {item.itemName} {item.itemCode ? `(${item.itemCode})` : ''}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                              {String(itemQty).padStart(2, '0')}
                            </td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                              {itemLineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total Amount Bottom Row */}
                      <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                        <td colSpan={2} style={{ borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'center', fontWeight: 800, fontSize: '0.88rem' }}>
                          Total amount
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, fontSize: '0.92rem', color: '#111827' }}>
                          {grandTotalSum.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Financial Summary Box */}
                  <Box sx={{ bgcolor: 'transparent', py: 0.8, px: 1.2, borderRadius: 1, border: '1px solid #86efac', mb: 1.2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                          TOTAL RECEIVING ITEMS: {displayLogs.length}
                        </Typography>
                        {printData.amountPaid !== undefined && Number(printData.amountPaid) > 0 ? (
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', display: 'block', mt: 0.3 }}>
                            Paid on Delivery: Rs. {Number(printData.amountPaid).toLocaleString()} ({printData.paymentMethod || 'Cash'})
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mt: 0.3 }}>
                            Payment: Full Udhaar (Credit Purchase)
                          </Typography>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Typography variant="subtitle1" fontWeight={800} color="success.dark" sx={{ lineHeight: 1.2 }}>
                          NET TOTAL: Rs. {grandTotalSum.toLocaleString()}
                        </Typography>
                        {printData.amountPaid !== undefined && Number(printData.amountPaid) > 0 && (
                          <Typography variant="caption" sx={{ fontWeight: 800, color: Number(printData.remainingBalance) > 0 ? '#dc2626' : '#16a34a', display: 'block', mt: 0.3 }}>
                            Remaining Balance Due: Rs. {Number(printData.remainingBalance || 0).toLocaleString()}
                          </Typography>
                        )}
                      </div>
                    </div>
                  </Box>

                  {/* Signatures Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', marginTop: '16px', paddingTop: '8px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 170 }}>
                        Vendor Signature
                      </Typography>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                        <CeoSignature />
                      </Box>
                    </div>
                  </div>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions className="no-print" sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={handleClosePrintModal} size="large" className="no-print">
            Close & Continue
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={handlePrint}
            size="large"
            className="no-print"
            sx={{ px: 3, fontWeight: 700 }}
          >
            Print Vendor Invoice ({stockInLogs.filter(log => (log.usedBy || '').toLowerCase() === (printData?.vendor || '').toLowerCase()).length || 1} Items)
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
