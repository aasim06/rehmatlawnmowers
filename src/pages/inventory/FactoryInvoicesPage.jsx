import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Snackbar,
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
import {
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  FileTextOutlined,
  ImportOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';
import {
  AppButton,
  ConfirmDialog,
  MasterKpiGrid,
  PageHeader,
  UniversalPrintModal
} from 'components/common';
import PaymentVoucherDialog from 'components/machine/PaymentVoucherDialog';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import { formatPKR } from 'utils/dashboardHelpers';
import { formatFullDate, formatInvoiceNo, resolveRecordTimestamp } from 'utils/machineLedgerHelpers';
import { buildFactoryStoreLedgers, formatStoreDocNo, getStorePartyDirectorySuggestions } from 'utils/storeLedgerHelpers';
import { getSubSurfaceSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Easypaisa / JazzCash', 'Cheque', 'Credit'];

const getStatusColor = (status) => {
  if (status === 'Paid') return 'success';
  if (status === 'Partial') return 'warning';
  return 'error';
};

/**
 * Factory Invoices Registry & Billing Counter
 * Reuses PageHeader, MasterKpiGrid, MainCard, PaymentVoucherDialog, UniversalPrintModal & ConfirmDialog
 * backed by buildFactoryStoreLedgers FIFO reconciliation for Stock Out (Sales) and Stock In (Purchases).
 */
export default function FactoryInvoicesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { canEditPrice, canDelete } = usePermission();

  const primaryTone = getToneColors(theme, 'primary');
  const successTone = getToneColors(theme, 'success');
  const errorTone = getToneColors(theme, 'error');
  const tableHeadCellSx = getTableHeadCellSx();

  const {
    items = [],
    vendors = [],
    storeCustomers = [],
    usageLogs = [],
    storePayments = [],
    vendorPayments = [],
    addStorePayment,
    issueStock,
    receiveStock,
    updateLog,
    deleteLog
  } = useStoreInventory();

  // Filter & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'Sale' | 'Purchase'
  const [filterPayment, setFilterPayment] = useState('all'); // 'all' | 'Paid' | 'Partial' | 'Unpaid'
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [filterMethod, setFilterMethod] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Payment Voucher State (reuses PaymentVoucherDialog)
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherInitialData, setVoucherInitialData] = useState(null);
  const [printVoucherData, setPrintVoucherData] = useState(null);

  // Create New Factory Invoice Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [formDirection, setFormDirection] = useState('out'); // 'out' | 'in'
  const [formPartyName, setFormPartyName] = useState('');
  const [formRefNo, setFormRefNo] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formPaidAmount, setFormPaidAmount] = useState('0');
  const [formPaidEdited, setFormPaidEdited] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState(1);
  const [selectedItemPrice, setSelectedItemPrice] = useState('');
  const [formItems, setFormItems] = useState([]);
  const [savingNew, setSavingNew] = useState(false);

  // Edit Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  // Delete & Print Invoice Modal State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printPreviewBill, setPrintPreviewBill] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  // Build Factory Store FIFO Ledgers & Party Directory
  const partyLedgers = useMemo(
    () =>
      buildFactoryStoreLedgers({
        storeCustomers,
        vendors,
        usageLogs,
        storePayments,
        vendorPayments
      }),
    [storeCustomers, vendors, usageLogs, storePayments, vendorPayments]
  );

  const partyDirectory = useMemo(
    () =>
      getStorePartyDirectorySuggestions({
        storeCustomers,
        vendors,
        usageLogs,
        storePayments,
        vendorPayments
      }),
    [storeCustomers, vendors, usageLogs, storePayments, vendorPayments]
  );

  // Flatten & Normalize all Stock Out ('Sale') & Stock In ('Purchase') Bills from reconciled Ledgers
  const allFactoryBills = useMemo(() => {
    const bills = [];

    (partyLedgers || []).forEach((ledger) => {
      (ledger.invoices || []).forEach((inv) => {
        const lineItems = Array.isArray(inv.items) && inv.items.length > 0
          ? inv.items
          : [
              {
                name: inv.machineName || 'Store Item',
                subtitle: inv.category ? `Category: ${inv.category}` : '',
                qty: Number(inv.qtyUsed) || 1,
                rate: Number(inv.unitPrice) || Number(inv.lineTotal) || 0,
                amount: Number(inv.lineTotal) || 0
              }
            ];

        const itemsSummary = lineItems
          .map((it) => `${it.name || 'Item'} (×${Number(it.qty) || 1})`)
          .join(', ');

        const rawLog = inv.raw || inv;
        const ts = resolveRecordTimestamp({
          createdAt: inv.createdAt || rawLog.created_at || rawLog.dateISO,
          dateISO: inv.dateISO || rawLog.dateISO,
          saleDate: inv.date || rawLog.time
        });

        bills.push({
          uid: `${inv.recordType}-${inv.id}`,
          id: inv.id,
          recordType: inv.recordType, // 'Sale' | 'Purchase'
          docNo: inv.saleNo || formatStoreDocNo(rawLog),
          customerName: inv.customerName || ledger.customerName || 'Factory Party',
          customerPhone: inv.customerPhone || ledger.phone || '',
          cityAddress: inv.cityAddress || ledger.cityAddress || '',
          paymentMethod: inv.paymentMethod || rawLog.paymentMethod || 'Cash',
          biltyNo: inv.biltyNo || rawLog.biltyNo || '',
          notes: inv.notes || rawLog.notes || '',
          dateLabel: formatFullDate(inv.date || rawLog.time, inv.createdAt || rawLog.dateISO || rawLog.created_at),
          timestamp: ts,
          items: lineItems,
          itemsSummary,
          itemsCount: lineItems.length,
          billTotal: Number(inv.lineTotal) || 0,
          paidAmount: Number(inv.paidAmount) || 0,
          allocatedFromAccount: Number(inv.allocatedFromAccount) || 0,
          balanceAmount: Number(inv.balanceAmount) || 0,
          paymentStatus: inv.paymentStatus || 'Paid',
          raw: rawLog,
          ledger
        });
      });
    });

    return bills.sort((a, b) => b.timestamp - a.timestamp);
  }, [partyLedgers]);

  // Period filtering
  const periodMatchedBills = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return allFactoryBills.filter((bill) => {
      if (filterPeriod === 'today') return bill.timestamp >= startOfToday;
      if (filterPeriod === 'week') return bill.timestamp >= sevenDaysAgo;
      if (filterPeriod === 'month') return bill.timestamp >= startOfMonth;
      return true;
    });
  }, [allFactoryBills, filterPeriod]);

  // KPI Metrics across Stock Out & Stock In
  const kpiSummary = useMemo(() => {
    const stockOutBills = allFactoryBills.filter((b) => b.recordType === 'Sale');
    const stockInBills = allFactoryBills.filter((b) => b.recordType === 'Purchase');

    const totalBilled = allFactoryBills.reduce((sum, b) => sum + b.billTotal, 0);
    const totalSettled = allFactoryBills.reduce((sum, b) => sum + b.paidAmount, 0);
    const pendingReceivables = stockOutBills.reduce((sum, b) => sum + b.balanceAmount, 0);
    const pendingPayables = stockInBills.reduce((sum, b) => sum + b.balanceAmount, 0);
    const totalPending = allFactoryBills.reduce((sum, b) => sum + b.balanceAmount, 0);
    const openCount = allFactoryBills.filter((b) => b.balanceAmount > 0).length;

    return {
      totalCount: allFactoryBills.length,
      stockOutCount: stockOutBills.length,
      stockInCount: stockInBills.length,
      totalBilled,
      totalSettled,
      pendingReceivables,
      pendingPayables,
      totalPending,
      openCount
    };
  }, [allFactoryBills]);

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Factory Invoices',
        value: kpiSummary.totalCount.toLocaleString(),
        helper: `${kpiSummary.stockOutCount} Stock Out • ${kpiSummary.stockInCount} Stock In`,
        tone: 'primary',
        icon: <FileTextOutlined />
      },
      {
        label: 'Total Billed Value',
        value: formatPKR(kpiSummary.totalBilled),
        helper: 'Combined Stock Out & In volume',
        tone: 'primary',
        icon: <DollarOutlined />
      },
      {
        label: 'Paid & Settled',
        value: formatPKR(kpiSummary.totalSettled),
        helper: 'Reconciled cash & ledger vouchers',
        tone: 'success',
        highlightValue: true,
        icon: <CheckCircleOutlined />
      },
      {
        label: 'Open / Due Balances',
        value: formatPKR(kpiSummary.totalPending),
        helper: `${kpiSummary.openCount} open bill${kpiSummary.openCount === 1 ? '' : 's'} (Recv ${formatPKR(kpiSummary.pendingReceivables)})`,
        tone: kpiSummary.totalPending > 0 ? 'error' : 'success',
        highlightValue: kpiSummary.totalPending > 0,
        icon: <ExclamationCircleOutlined />
      }
    ],
    [kpiSummary]
  );

  // Filtered list for table
  const filteredBills = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return periodMatchedBills.filter((bill) => {
      if (sourceFilter !== 'all' && bill.recordType !== sourceFilter) return false;
      if (filterPayment !== 'all' && bill.paymentStatus !== filterPayment) return false;
      if (filterMethod !== 'all' && (bill.paymentMethod || 'Cash') !== filterMethod) return false;
      if (!q) return true;
      return (
        (bill.docNo || '').toLowerCase().includes(q) ||
        (bill.customerName || '').toLowerCase().includes(q) ||
        (bill.customerPhone || '').toLowerCase().includes(q) ||
        (bill.biltyNo || '').toLowerCase().includes(q) ||
        (bill.itemsSummary || '').toLowerCase().includes(q)
      );
    });
  }, [periodMatchedBills, sourceFilter, filterPayment, filterMethod, searchTerm]);

  const paginatedBills = useMemo(
    () => filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredBills, page, rowsPerPage]
  );

  // Open Receive / Pay Voucher Dialog
  const handleOpenVoucher = (bill) => {
    setVoucherInitialData({
      customerName: bill.customerName,
      entryType: bill.recordType === 'Purchase' ? 'Payout' : 'Receipt',
      refSelection: `${bill.recordType}:${bill.id}`,
      amountPaid: bill.balanceAmount > 0 ? String(bill.balanceAmount) : '',
      paymentMethod: bill.paymentMethod === 'Credit' ? 'Cash' : bill.paymentMethod || 'Cash'
    });
    setVoucherModalOpen(true);
  };

  // Save Payment Voucher
  const handleSavePaymentVoucher = async (voucherData) => {
    const saved = await addStorePayment({
      customerName: voucherData.customerName,
      entryType: voucherData.entryType,
      referenceType: voucherData.referenceType,
      invoiceId: voucherData.invoiceId,
      referenceLabel: voucherData.referenceLabel,
      amountPaid: voucherData.amountPaid,
      paymentMethod: voucherData.paymentMethod,
      referenceNo: voucherData.referenceNo,
      notes: voucherData.notes
    });

    setVoucherModalOpen(false);
    showToast(
      `${voucherData.entryType === 'Payout' ? 'Vendor payout' : 'Payment receipt'} of ${formatPKR(voucherData.amountPaid)} recorded for ${voucherData.customerName}.`
    );

    if (voucherData.shouldPrint && saved) {
      setPrintVoucherData({
        ...saved,
        customerPhone: voucherData.customerLedger?.phone || '',
        cityAddress: voucherData.customerLedger?.cityAddress || '',
        billTotal:
          (voucherData.customerLedger?.totalDebit || 0) > 0
            ? voucherData.customerLedger.totalDebit
            : voucherData.amountPaid,
        previousPaid: voucherData.customerLedger?.totalCredit || 0,
        newBalance: voucherData.remainingAccountBalance ?? 0
      });
    }
  };

  // Create New Factory Invoice Helpers
  const openCreateModal = () => {
    setFormDirection('out');
    setFormPartyName('');
    setFormRefNo('');
    setFormPaymentMethod('Cash');
    setFormPaidAmount('0');
    setFormPaidEdited(false);
    setFormNotes('');
    setSelectedItemId('');
    setSelectedItemQty(1);
    setSelectedItemPrice('');
    setFormItems([]);
    setCreateModalOpen(true);
  };

  const formGrandTotal = useMemo(
    () => formItems.reduce((sum, row) => sum + (Number(row.lineTotal) || 0), 0),
    [formItems]
  );

  const effectivePaidDisplay = formPaidEdited
    ? formPaidAmount
    : formPaymentMethod === 'Credit'
      ? '0'
      : String(formGrandTotal);

  const handleAddItemToCreate = () => {
    if (!selectedItemId) return;
    const found = items.find((it) => String(it.id) === String(selectedItemId));
    if (!found) return;

    const qty = Math.max(1, parseInt(selectedItemQty, 10) || 1);
    const rate = parseFloat(selectedItemPrice) >= 0 && selectedItemPrice !== ''
      ? parseFloat(selectedItemPrice)
      : Number(found.unitPrice) || 0;

    if (formDirection === 'out') {
      const existingQty = formItems
        .filter((row) => String(row.id) === String(found.id))
        .reduce((s, r) => s + r.qty, 0);
      const available = Number(found.remainingStock ?? found.totalStock) || 0;
      if (existingQty + qty > available) {
        showToast(`Only ${available} unit(s) available in stock for "${found.name}".`, 'warning');
        return;
      }
    }

    setFormItems((prev) => {
      const idx = prev.findIndex((r) => String(r.id) === String(found.id) && Number(r.unitPrice) === rate);
      if (idx >= 0) {
        const next = [...prev];
        const mergedQty = next[idx].qty + qty;
        next[idx] = { ...next[idx], qty: mergedQty, lineTotal: mergedQty * rate };
        return next;
      }
      return [
        ...prev,
        {
          id: found.id,
          itemCode: found.itemCode,
          name: found.name,
          category: found.category || 'General',
          imageUrl: found.imageUrl || '',
          qty,
          unitPrice: rate,
          lineTotal: qty * rate
        }
      ];
    });
    setSelectedItemId('');
    setSelectedItemQty(1);
    setSelectedItemPrice('');
  };

  const handleSaveNewInvoice = async (shouldPrint = false) => {
    if (formItems.length === 0 || savingNew) return;
    const cleanParty = formPartyName.trim() || (formDirection === 'out' ? 'Factory Walk-in Buyer' : 'Direct Vendor');
    const parsedPaid = formPaidEdited
      ? Math.max(0, parseFloat(formPaidAmount) || 0)
      : formPaymentMethod === 'Credit'
        ? 0
        : formGrandTotal;
    const paidNow = Math.min(formGrandTotal, parsedPaid);

    setSavingNew(true);
    try {
      const refCode = formRefNo.trim() || `${formDirection === 'out' ? 'ISS' : 'GRN'}-${Math.floor(10000 + Math.random() * 90000)}`;

      if (formDirection === 'out') {
        for (const row of formItems) {
          await issueStock(
            row.id,
            row.qty,
            cleanParty,
            'Factory Invoice',
            'Store Manager',
            formNotes.trim() || `Invoice Ref: ${refCode}`,
            row.unitPrice,
            row.category
          );
        }

        if (paidNow > 0) {
          await addStorePayment({
            customerName: cleanParty,
            entryType: 'Receipt',
            referenceType: 'Account',
            referenceLabel: refCode,
            amountPaid: paidNow,
            paymentMethod: formPaymentMethod === 'Credit' ? 'Cash' : formPaymentMethod,
            referenceNo: refCode,
            notes: formNotes.trim() || `Paid on Factory Invoice (${refCode})`
          });
        }
      } else {
        let remainingToPay = paidNow;
        for (const row of formItems) {
          const linePaid = Math.min(row.lineTotal, remainingToPay);
          remainingToPay = Math.max(0, remainingToPay - linePaid);
          await receiveStock(
            row.id,
            row.qty,
            cleanParty,
            refCode,
            row.unitPrice,
            row.category,
            row.imageUrl || '',
            {
              biltyNo: formRefNo.trim(),
              amountPaid: linePaid,
              paymentMethod: formPaymentMethod === 'Credit' ? 'Cash' : formPaymentMethod
            }
          );
        }
      }

      setCreateModalOpen(false);
      showToast(
        `${formDirection === 'out' ? 'Stock Out Invoice' : 'Stock In Bill'} saved (${formItems.length} item${formItems.length === 1 ? '' : 's'})!`
      );

      if (shouldPrint) {
        const bal = Math.max(0, formGrandTotal - paidNow);
        setPrintPreviewBill({
          recordType: formDirection === 'out' ? 'Sale' : 'Purchase',
          docNo: refCode,
          customerName: cleanParty,
          customerPhone: 'N/A',
          cityAddress: 'Factory Store',
          dateLabel: formatFullDate('', new Date().toISOString()),
          paymentStatus: bal <= 0 ? 'Paid' : paidNow > 0 ? 'Partial' : 'Unpaid',
          items: formItems.map((it) => ({
            name: it.name,
            subtitle: it.category ? `Category: ${it.category}` : '',
            qty: it.qty,
            rate: it.unitPrice,
            amount: it.lineTotal
          })),
          billTotal: formGrandTotal,
          paidAmount: paidNow,
          balanceAmount: bal,
          notes: formNotes.trim() || undefined
        });
        setSelectedBill(null);
        setPrintModalOpen(true);
      }
    } catch (err) {
      console.error('Error saving Factory Invoice:', err);
      showToast(err?.message || 'Unable to save Factory Invoice.', 'error');
    } finally {
      setSavingNew(false);
    }
  };

  // Edit Drawer Handlers
  const handleOpenEdit = (bill) => {
    const raw = bill.raw || {};
    setEditingBill({
      id: bill.id,
      docNo: bill.docNo,
      recordType: bill.recordType,
      usedBy: bill.customerName,
      itemName: raw.itemName || bill.items[0]?.name || '',
      qtyUsed: Number(raw.qtyUsed) || Number(bill.items[0]?.qty) || 1,
      unitPrice: Number(raw.unitPrice) || Number(bill.items[0]?.rate) || 0,
      paymentMethod: bill.paymentMethod || 'Cash',
      biltyNo: bill.biltyNo || '',
      notes: bill.notes || '',
      paidAmount: bill.paidAmount
    });
    setEditDrawerOpen(true);
  };

  const handleSaveEditedBill = async (e) => {
    e.preventDefault();
    if (!editingBill) return;

    const qty = Math.max(1, parseInt(editingBill.qtyUsed, 10) || 1);
    const rate = Math.max(0, parseFloat(editingBill.unitPrice) || 0);
    const newTotal = qty * rate;

    await updateLog(editingBill.id, {
      usedBy: (editingBill.usedBy || '').trim() || 'Factory Party',
      itemName: (editingBill.itemName || '').trim() || 'Store Item',
      qtyUsed: qty,
      unitPrice: rate,
      lineTotal: newTotal,
      remainingBalance: Math.max(0, newTotal - (Number(editingBill.paidAmount) || 0)),
      paymentMethod: editingBill.paymentMethod || 'Cash',
      biltyNo: (editingBill.biltyNo || '').trim(),
      notes: (editingBill.notes || '').trim()
    });

    setEditDrawerOpen(false);
    setEditingBill(null);
    showToast(`Invoice ${editingBill.docNo} updated & synchronized.`);
  };

  // Delete Confirmation Handler
  const handleConfirmDelete = async () => {
    if (!selectedBill) return;
    await deleteLog(selectedBill.id);
    showToast(`${selectedBill.docNo} deleted successfully!`);
    setDeleteDialogOpen(false);
    setSelectedBill(null);
  };

  const activePrintTarget = printPreviewBill || selectedBill;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <PageHeader
          title="Factory Invoices"
          count={kpiSummary.totalCount}
          countLabel="Invoices"
          subtitle="Manage Factory Stock Out issuances, Vendor Stock In bills, due collections/payouts, edits, and official receipts."
          actions={
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <AppButton intent="secondary" startIcon={<ImportOutlined />} onClick={() => navigate('/inventory/stock-in')}>
                Stock In
              </AppButton>
              <AppButton intent="secondary" startIcon={<ExportOutlined />} onClick={() => navigate('/inventory/stock-out')}>
                Stock Out
              </AppButton>
              <AppButton intent="primary" startIcon={<PlusOutlined />} onClick={openCreateModal}>
                New Invoice
              </AppButton>
            </Box>
          }
          sx={{ mb: 2 }}
        />

        <MasterKpiGrid kpis={kpiCards} />
      </Box>

      <MainCard content={false}>
        <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          {/* Segmented Source Tabs + Record Counter */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              mb: 2
            }}
          >
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', p: 0.5, borderRadius: 2, gap: 0.5, flexWrap: 'wrap' })}>
              {[
                { key: 'all', label: `All Invoices (${kpiSummary.totalCount})` },
                { key: 'Sale', label: `Stock Out (${kpiSummary.stockOutCount})` },
                { key: 'Purchase', label: `Stock In (${kpiSummary.stockInCount})` }
              ].map((tab) => {
                const isActive = sourceFilter === tab.key;
                return (
                  <Box
                    key={tab.key}
                    component="button"
                    type="button"
                    onClick={() => {
                      setSourceFilter(tab.key);
                      setPage(0);
                    }}
                    sx={{
                      border: 0,
                      px: 1.5,
                      py: 0.65,
                      borderRadius: 1.5,
                      fontSize: '0.8125rem',
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

            <Typography variant="body2" color="text.secondary">
              Showing <strong>{filteredBills.length}</strong> factory invoice{filteredBills.length === 1 ? '' : 's'}
            </Typography>
          </Box>

          {/* Search & Dropdown Filters */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <OutlinedInput
              size="small"
              placeholder="Search by invoice #, party, phone, bilty, or store item..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 240 } }}
            />

            <TextField
              select
              size="small"
              label="Time Period"
              value={filterPeriod}
              onChange={(e) => {
                setFilterPeriod(e.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: '48%', sm: 150 } }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">Past 7 Days</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Payment Status"
              value={filterPayment}
              onChange={(e) => {
                setFilterPayment(e.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: '48%', sm: 155 } }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Partial">Partial</MenuItem>
              <MenuItem value="Unpaid">Unpaid / Credit</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Payment Method"
              value={filterMethod}
              onChange={(e) => {
                setFilterMethod(e.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: '48%', sm: 165 } }}
            >
              <MenuItem value="all">All Methods</MenuItem>
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>

            <AppButton
              intent="cancel"
              size="small"
              startIcon={<ReloadOutlined />}
              onClick={() => {
                setSearchTerm('');
                setSourceFilter('all');
                setFilterPeriod('all');
                setFilterPayment('all');
                setFilterMethod('all');
                setPage(0);
              }}
            >
              Reset
            </AppButton>
          </Box>
        </Box>

        {/* Invoices Table */}
        <TableContainer>
          <Table sx={{ minWidth: 940 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: getSubSurfaceSx(theme).bgcolor,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <TableCell sx={{ ...tableHeadCellSx, pl: 2.5 }}>Invoice #</TableCell>
                <TableCell sx={tableHeadCellSx}>Date &amp; Time</TableCell>
                <TableCell sx={tableHeadCellSx}>Party / Vendor</TableCell>
                <TableCell sx={tableHeadCellSx}>Items Summary</TableCell>
                <TableCell align="center" sx={tableHeadCellSx}>
                  Status
                </TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>
                  Total Bill
                </TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>
                  Paid / Due
                </TableCell>
                <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <FileTextOutlined
                      style={{
                        fontSize: 38,
                        color: theme.palette.text.disabled,
                        display: 'block',
                        margin: '0 auto 8px'
                      }}
                    />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No factory invoices found
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Click &ldquo;New Invoice&rdquo; above or record Stock In / Stock Out entries to manage factory bills here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBills.map((bill) => {
                  const isPurchase = bill.recordType === 'Purchase';
                  return (
                    <TableRow key={bill.uid} hover sx={{ '& td': { py: 1.75 } }}>
                      <TableCell sx={{ pl: 2.5 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="text.primary"
                            sx={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {bill.docNo}
                          </Typography>
                          <Chip
                            label={isPurchase ? 'Stock In' : 'Stock Out'}
                            size="small"
                            color={isPurchase ? 'warning' : 'primary'}
                            variant="light"
                            sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                          />
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                          {bill.dateLabel}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {bill.customerName}
                        </Typography>
                        {(bill.customerPhone || bill.biltyNo) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {bill.customerPhone}
                            {bill.customerPhone && bill.biltyNo ? ' • ' : ''}
                            {bill.biltyNo ? `Bilty: ${bill.biltyNo}` : ''}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" color="text.primary" sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
                          {bill.itemsSummary}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {bill.itemsCount} {bill.itemsCount === 1 ? 'line item' : 'line items'} • {bill.paymentMethod}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={bill.paymentStatus}
                          size="small"
                          color={getStatusColor(bill.paymentStatus)}
                          variant="light"
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="text.primary"
                          sx={{ fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatPKR(bill.billTotal)}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}
                        >
                          Paid: {formatPKR(bill.paidAmount)}
                        </Typography>
                        {bill.allocatedFromAccount > 0 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            Incl. {formatPKR(bill.allocatedFromAccount)} on-account
                          </Typography>
                        )}
                        {bill.balanceAmount > 0 && (
                          <Typography
                            variant="caption"
                            display="block"
                            fontWeight={700}
                            sx={{ color: errorTone.main, fontVariantNumeric: 'tabular-nums' }}
                          >
                            Due: {formatPKR(bill.balanceAmount)}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center" sx={{ pr: 2.5 }}>
                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                          <AppButton
                            intent="primary"
                            size="small"
                            startIcon={<DollarOutlined />}
                            onClick={() => handleOpenVoucher(bill)}
                            disabled={bill.balanceAmount <= 0}
                          >
                            {bill.balanceAmount <= 0 ? 'Settled' : isPurchase ? 'Pay' : 'Receive'}
                          </AppButton>

                          <Tooltip title="View & Print Invoice">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setPrintPreviewBill(null);
                                setSelectedBill(bill);
                                setPrintModalOpen(true);
                              }}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                color: 'text.secondary',
                                '&:hover': { bgcolor: primaryTone.bg, color: primaryTone.main, borderColor: primaryTone.border }
                              }}
                            >
                              <PrinterOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Invoice">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(bill)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                color: 'text.secondary',
                                '&:hover': { bgcolor: primaryTone.bg, color: primaryTone.main, borderColor: primaryTone.border }
                              }}
                            >
                              <EditOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>

                          {canDelete && (
                            <Tooltip title="Delete Invoice">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1.5,
                                  color: 'text.secondary',
                                  '&:hover': { bgcolor: errorTone.bg, color: errorTone.main, borderColor: errorTone.border }
                                }}
                              >
                                <DeleteOutlined style={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredBills.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </MainCard>

      {/* Reusable Payment / Payout Voucher Dialog */}
      <PaymentVoucherDialog
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        initialData={voucherInitialData}
        customerDirectory={partyDirectory}
        customerLedgers={partyLedgers}
        onSaveVoucher={handleSavePaymentVoucher}
      />

      {/* Create New Factory Invoice Dialog */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileTextOutlined style={{ color: primaryTone.main }} /> New Factory Invoice
          </Box>
          <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1.3fr 0.9fr 1fr' }, gap: 1.5 }}>
              <TextField
                select
                size="small"
                label="Invoice Type"
                value={formDirection}
                onChange={(e) => {
                  setFormDirection(e.target.value);
                  setFormItems([]);
                }}
              >
                <MenuItem value="out">Stock Out (Sale / Issue)</MenuItem>
                <MenuItem value="in">Stock In (Vendor Bill)</MenuItem>
              </TextField>

              <Autocomplete
                freeSolo
                size="small"
                options={partyDirectory.map((p) => p.name)}
                value={formPartyName || null}
                inputValue={formPartyName}
                onChange={(_, val) => setFormPartyName(val || '')}
                onInputChange={(_, val, reason) => {
                  if (reason !== 'reset') setFormPartyName(val || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={formDirection === 'out' ? 'Customer / Party Name' : 'Vendor / Supplier Name'}
                    placeholder="Select or type party..."
                  />
                )}
              />

              <TextField
                size="small"
                label="Bill / Bilty # (Opt.)"
                placeholder="e.g. BL-402"
                value={formRefNo}
                onChange={(e) => setFormRefNo(e.target.value)}
              />

              <TextField
                select
                size="small"
                label="Payment Method"
                value={formPaymentMethod}
                onChange={(e) => {
                  setFormPaymentMethod(e.target.value);
                  setFormPaidEdited(false);
                }}
              >
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Add Factory Store Item Row */}
            <Box sx={getSubSurfaceSx(theme, { p: 2 })}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.25 }}>
                Add Factory Store Item
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 85px 120px auto' }, gap: 1.25, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Select Store Item"
                  value={selectedItemId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedItemId(id);
                    const found = items.find((it) => String(it.id) === String(id));
                    if (found) setSelectedItemPrice(String(found.unitPrice || 0));
                  }}
                >
                  <MenuItem value="">-- Choose Factory Item --</MenuItem>
                  {items.map((it) => (
                    <MenuItem key={it.id} value={it.id}>
                      {it.name} (Stock: {it.remainingStock ?? it.totalStock ?? 0} • {formatPKR(it.unitPrice)})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  size="small"
                  type="number"
                  label="Qty"
                  inputProps={{ min: 1 }}
                  value={selectedItemQty}
                  onChange={(e) => setSelectedItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />

                <TextField
                  size="small"
                  type="number"
                  label="Rate"
                  inputProps={{ min: 0 }}
                  value={selectedItemPrice}
                  disabled={!canEditPrice && selectedItemPrice !== ''}
                  onChange={(e) => setSelectedItemPrice(e.target.value)}
                />

                <AppButton
                  intent="secondary"
                  size="small"
                  startIcon={<PlusOutlined />}
                  onClick={handleAddItemToCreate}
                  disabled={!selectedItemId}
                >
                  Add
                </AppButton>
              </Box>
            </Box>

            {formItems.length > 0 && (
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
                      <TableCell sx={tableHeadCellSx}>Store Item</TableCell>
                      <TableCell align="center" sx={tableHeadCellSx}>
                        Qty
                      </TableCell>
                      <TableCell align="right" sx={tableHeadCellSx}>
                        Rate
                      </TableCell>
                      <TableCell align="right" sx={tableHeadCellSx}>
                        Total
                      </TableCell>
                      <TableCell align="center" sx={tableHeadCellSx} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {formItems.map((it) => (
                      <TableRow key={`${it.id}-${it.unitPrice}`}>
                        <TableCell sx={{ fontWeight: 600 }}>{it.name}</TableCell>
                        <TableCell align="center">{it.qty}</TableCell>
                        <TableCell align="right">{formatPKR(it.unitPrice)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatPKR(it.lineTotal)}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setFormItems((prev) =>
                                prev.filter((row) => !(row.id === it.id && row.unitPrice === it.unitPrice))
                              )
                            }
                          >
                            <DeleteOutlined style={{ fontSize: 13 }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 1.5 }}>
              <TextField
                size="small"
                type="number"
                label="Paid Amount (PKR)"
                inputProps={{ min: 0 }}
                value={effectivePaidDisplay}
                onChange={(e) => {
                  setFormPaidAmount(e.target.value);
                  setFormPaidEdited(true);
                }}
              />
              <TextField
                size="small"
                label="Notes / Remarks"
                placeholder="Optional invoice remarks..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </Box>

            <Box
              sx={getSubSurfaceSx(theme, {
                p: 1.75,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5
              })}
            >
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Paid: {formatPKR(Math.min(formGrandTotal, parseFloat(effectivePaidDisplay) || 0))} • Balance Due:{' '}
                <Box component="span" sx={{ fontWeight: 700, color: errorTone.main }}>
                  {formatPKR(Math.max(0, formGrandTotal - (parseFloat(effectivePaidDisplay) || 0)))}
                </Box>
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                Total Bill: {formatPKR(formGrandTotal)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: getSubSurfaceSx(theme).bgcolor }}>
          <AppButton intent="cancel" onClick={() => setCreateModalOpen(false)} disabled={savingNew}>
            Cancel
          </AppButton>
          <AppButton
            intent="secondary"
            startIcon={<PrinterOutlined />}
            onClick={() => handleSaveNewInvoice(true)}
            disabled={formItems.length === 0 || savingNew}
          >
            Save &amp; Print
          </AppButton>
          <AppButton
            intent="primary"
            onClick={() => handleSaveNewInvoice(false)}
            disabled={formItems.length === 0 || savingNew}
          >
            {savingNew ? 'Saving...' : 'Save Invoice'}
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Edit Factory Invoice Drawer */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100vw', sm: 440 }, p: 3 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            Edit Invoice {editingBill?.docNo}
          </Typography>
          <IconButton size="small" onClick={() => setEditDrawerOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingBill && (
          <Box component="form" onSubmit={handleSaveEditedBill} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={editingBill.recordType === 'Purchase' ? 'Vendor / Supplier' : 'Customer / Party Name'}
              size="small"
              fullWidth
              required
              value={editingBill.usedBy}
              onChange={(e) => setEditingBill({ ...editingBill, usedBy: e.target.value })}
            />

            <TextField
              label="Store Item Name"
              size="small"
              fullWidth
              required
              value={editingBill.itemName}
              onChange={(e) => setEditingBill({ ...editingBill, itemName: e.target.value })}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Quantity"
                type="number"
                size="small"
                required
                inputProps={{ min: 1 }}
                value={editingBill.qtyUsed}
                onChange={(e) => setEditingBill({ ...editingBill, qtyUsed: e.target.value })}
              />
              <TextField
                label="Unit Rate (PKR)"
                type="number"
                size="small"
                required
                disabled={!canEditPrice}
                inputProps={{ min: 0, step: 'any' }}
                value={editingBill.unitPrice}
                onChange={(e) => setEditingBill({ ...editingBill, unitPrice: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                select
                label="Payment Method"
                size="small"
                value={editingBill.paymentMethod}
                onChange={(e) => setEditingBill({ ...editingBill, paymentMethod: e.target.value })}
              >
                {PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Bilty / Ref #"
                size="small"
                value={editingBill.biltyNo}
                onChange={(e) => setEditingBill({ ...editingBill, biltyNo: e.target.value })}
              />
            </Box>

            <TextField
              label="Notes / Remarks"
              size="small"
              multiline
              rows={2}
              value={editingBill.notes}
              onChange={(e) => setEditingBill({ ...editingBill, notes: e.target.value })}
            />

            <Box sx={getSubSurfaceSx(theme, { p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Recomputed Bill Total
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                {formatPKR((Math.max(1, parseInt(editingBill.qtyUsed, 10) || 1)) * (Math.max(0, parseFloat(editingBill.unitPrice) || 0)))}
              </Typography>
            </Box>

            <AppButton type="submit" intent="primary" fullWidth>
              Save Changes
            </AppButton>
          </Box>
        )}
      </Drawer>

      {/* Print Factory Invoice Modal */}
      {activePrintTarget && (
        <UniversalPrintModal
          open={printModalOpen}
          onClose={() => {
            setPrintModalOpen(false);
            setPrintPreviewBill(null);
          }}
          title={
            activePrintTarget.recordType === 'Purchase'
              ? 'Official Factory Stock In Vendor Bill'
              : 'Official Factory Stock Out Invoice'
          }
          typeTag={activePrintTarget.recordType === 'Purchase' ? 'Stock In Bill' : 'Factory Sales Invoice'}
          badgeColor={activePrintTarget.recordType === 'Purchase' ? 'warning' : 'success'}
          partyLabel={activePrintTarget.recordType === 'Purchase' ? 'Vendor / Supplier' : 'Customer / Party'}
          party={{
            name: activePrintTarget.customerName,
            phone: activePrintTarget.customerPhone || 'N/A',
            city: activePrintTarget.cityAddress || 'Factory Store'
          }}
          invoiceLabel="Invoice No:"
          invoiceNo={activePrintTarget.docNo}
          date={activePrintTarget.dateLabel}
          status={activePrintTarget.paymentStatus}
          items={(activePrintTarget.items || []).map((it) => ({
            name: it.name,
            subtitle: it.subtitle,
            qty: it.qty,
            rate: it.rate,
            total: it.amount ?? it.lineTotal ?? (Number(it.qty) || 1) * (Number(it.rate) || 0)
          }))}
          summary={{
            totalAmount: activePrintTarget.billTotal,
            paidAmount: activePrintTarget.paidAmount,
            balanceAmount: activePrintTarget.balanceAmount,
            notes: activePrintTarget.notes || undefined
          }}
          receiverSignatureLabel={activePrintTarget.recordType === 'Purchase' ? 'Authorized Signature' : 'Receiver / Party Signature'}
        />
      )}

      {/* Print Payment Voucher Receipt Modal */}
      {printVoucherData && (
        <UniversalPrintModal
          open={Boolean(printVoucherData)}
          onClose={() => setPrintVoucherData(null)}
          title={printVoucherData.entryType === 'Payout' ? 'Official Factory Vendor Payout Receipt' : 'Official Factory Payment Receipt'}
          typeTag={printVoucherData.entryType === 'Adjustment' ? 'Discount Voucher' : printVoucherData.entryType === 'Payout' ? 'Payment Voucher' : 'Payment Receipt'}
          badgeColor={printVoucherData.entryType === 'Payout' ? 'warning' : 'success'}
          partyLabel={printVoucherData.entryType === 'Payout' ? 'Paid To' : 'Received From'}
          party={{
            name: printVoucherData.customerName,
            phone: printVoucherData.customerPhone || undefined,
            city: printVoucherData.cityAddress || undefined
          }}
          invoiceLabel="Voucher No:"
          invoiceNo={formatInvoiceNo(printVoucherData)}
          date={printVoucherData.time}
          status={printVoucherData.paymentMethod || 'Cash'}
          items={[
            {
              name: `${printVoucherData.entryType === 'Payout' ? 'Payment issued against' : 'Payment received against'} ${printVoucherData.referenceLabel || 'Factory Account'}`,
              subtitle: printVoucherData.referenceNo ? `Ref: ${printVoucherData.referenceNo}` : printVoucherData.notes || '',
              qty: 1,
              rate: printVoucherData.amountPaid,
              total: printVoucherData.amountPaid
            }
          ]}
          summary={{
            totalAmount: printVoucherData.billTotal,
            paidAmount: (printVoucherData.previousPaid || 0) + (printVoucherData.amountPaid || 0),
            balanceAmount: printVoucherData.newBalance,
            notes: printVoucherData.notes || `Method: ${printVoucherData.paymentMethod}`
          }}
          receiverSignatureLabel="Party Signature"
        />
      )}

      {/* Reusable Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete Invoice ${selectedBill?.docNo || ''}?`}
        message={
          selectedBill ? (
            <>
              Are you sure you want to delete <strong>{selectedBill.docNo}</strong> for{' '}
              <strong>{selectedBill.customerName}</strong>?
            </>
          ) : (
            'Are you sure you want to delete this invoice?'
          )
        }
        confirmText="Delete Invoice"
        intent="danger"
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
