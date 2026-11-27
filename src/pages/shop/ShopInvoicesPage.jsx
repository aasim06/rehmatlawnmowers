import { useState, useMemo, useEffect } from 'react';
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
  FileTextOutlined,
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';
import { AppButton, ConfirmDialog, FilterBar, MasterKpiGrid, PageHeader, UniversalPrintModal } from 'components/common';
import PaymentVoucherDialog from 'components/machine/PaymentVoucherDialog';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import { formatFullDate, formatInvoiceNo } from 'utils/machineLedgerHelpers';
import {
  SHOP_PAYMENT_METHODS,
  buildShopCustomerLedgers,
  getShopCustomerDirectorySuggestions,
  normalizeShopSaleRecord,
  resolveShopAllocatedInvoiceMap
} from 'utils/shopHelpers';

const tableHeadCellSx = getTableHeadCellSx();

const getPaymentStatusColor = (status) => {
  if (status === 'Paid') return 'success';
  if (status === 'Partial') return 'warning';
  return 'error';
};

/**
 * Retail Shop Mart Invoices & Payment Collections page.
 * Displays all Shop Mart counter slips & invoices with Paid / Partial / Unpaid reconciliation,
 * inline voucher collection, invoice editing, deletion, and A4 receipt printing.
 */
export default function ShopInvoicesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { canDelete } = usePermission();

  const {
    shopSales = [],
    shopCustomers = [],
    shopCustomerPayments = [],
    items = [],
    vendors = [],
    addShopSale,
    updateShopSale,
    deleteShopSale,
    addShopCustomerPayment,
    issueStock
  } = useStoreInventory();

  // Filters & Pagination
  const [statusTab, setStatusTab] = useState('all'); // 'all' | 'Paid' | 'Partial' | 'Unpaid'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // 'all' | 'today' | 'week' | 'month'
  const [filterMethod, setFilterMethod] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Payment Collection Modal (reuses shared PaymentVoucherDialog)
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherInitData, setVoucherInitData] = useState(null);

  // Create / Edit / Delete / Print States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  // Create Invoice Form State
  const [formCustomerName, setFormCustomerName] = useState('Walk-in Customer');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formPaidAmount, setFormPaidAmount] = useState('');
  const [formPaidEdited, setFormPaidEdited] = useState(false);
  const [formDiscount, setFormDiscount] = useState('');
  const [formTax, setFormTax] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState(1);
  const [selectedItemPrice, setSelectedItemPrice] = useState('');

  // Feedback Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    setPage(0);
  }, [statusTab, searchTerm, filterPeriod, filterMethod]);

  const customerLedgers = useMemo(
    () => buildShopCustomerLedgers({ shopCustomers, shopSales, shopCustomerPayments }),
    [shopCustomers, shopSales, shopCustomerPayments]
  );

  const customerDirectory = useMemo(
    () => getShopCustomerDirectorySuggestions({ shopCustomers, shopSales, shopCustomerPayments, vendors }),
    [shopCustomers, shopSales, shopCustomerPayments, vendors]
  );

  const allocationMap = useMemo(
    () => resolveShopAllocatedInvoiceMap({ shopCustomers, shopSales, shopCustomerPayments }),
    [shopCustomers, shopSales, shopCustomerPayments]
  );

  const normalizedInvoices = useMemo(() => {
    return (shopSales || [])
      .map((rawInv) => {
        const norm = normalizeShopSaleRecord(rawInv);
        const alloc = allocationMap.get(`Sale:${norm.id}`);
        const billTotal = alloc ? alloc.billTotal : norm.lineTotal;
        const paidAmount = alloc ? alloc.paidAmount : norm.paidAmount;
        const balanceAmount = alloc ? alloc.balanceAmount : Math.max(0, billTotal - paidAmount);
        const allocatedFromAccount = alloc ? alloc.allocatedFromAccount : 0;
        const paymentStatus = billTotal > 0 && balanceAmount <= 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
        const ts = norm.dateISO ? new Date(norm.dateISO).getTime() : 0;

        return {
          ...norm,
          docNo: formatInvoiceNo(norm),
          billTotal,
          paidAmount,
          balanceAmount,
          allocatedFromAccount,
          paymentStatus,
          paymentMethod: rawInv.paymentMethod || 'Cash',
          sortTime: Number.isNaN(ts) ? 0 : ts,
          dateLabel: formatFullDate(norm.time, norm.dateISO),
          itemsSummary: norm.machineName,
          itemsCount: norm.items.length || 1,
          raw: rawInv
        };
      })
      .sort((a, b) => b.sortTime - a.sortTime);
  }, [shopSales, allocationMap]);

  const kpiSummary = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let dueCount = 0;

    normalizedInvoices.forEach((inv) => {
      totalBilled += inv.billTotal;
      totalPaid += inv.paidAmount;
      totalDue += inv.balanceAmount;
      if (inv.balanceAmount > 0) dueCount += 1;
    });

    return {
      totalCount: normalizedInvoices.length,
      totalBilled,
      totalPaid,
      totalDue,
      dueCount
    };
  }, [normalizedInvoices]);

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 6 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return normalizedInvoices.filter((inv) => {
      if (statusTab !== 'all' && inv.paymentStatus !== statusTab) return false;
      if (filterMethod !== 'all' && (inv.paymentMethod || 'Cash').toLowerCase() !== filterMethod.toLowerCase()) return false;

      if (filterPeriod !== 'all' && inv.sortTime > 0) {
        if (filterPeriod === 'today' && inv.sortTime < startOfToday) return false;
        if (filterPeriod === 'week' && inv.sortTime < sevenDaysAgo) return false;
        if (filterPeriod === 'month' && inv.sortTime < startOfMonth) return false;
      }

      if (term) {
        const hay = [inv.docNo, inv.customerName, inv.customerPhone, inv.itemsSummary, inv.paymentMethod].join(' ').toLowerCase();
        if (!hay.includes(term)) return false;
      }

      return true;
    });
  }, [normalizedInvoices, statusTab, filterMethod, filterPeriod, searchTerm]);

  const paginatedInvoices = filteredInvoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Create Form Totals
  const formSubTotal = useMemo(() => formItems.reduce((sum, it) => sum + (parseFloat(it.lineTotal) || 0), 0), [formItems]);
  const formDiscNum = Math.min(formSubTotal, Math.max(0, parseFloat(formDiscount) || 0));
  const formTaxNum = Math.max(0, parseFloat(formTax) || 0);
  const formGrandTotal = Math.max(0, formSubTotal - formDiscNum + formTaxNum);

  useEffect(() => {
    if (!createModalOpen) return;
    if (!formPaidEdited) {
      setFormPaidAmount(formPaymentMethod === 'Credit' ? '0' : String(formGrandTotal));
    }
  }, [createModalOpen, formGrandTotal, formPaymentMethod, formPaidEdited]);

  const resetCreateForm = () => {
    setFormCustomerName('Walk-in Customer');
    setFormCustomerPhone('');
    setFormPaymentMethod('Cash');
    setFormPaidAmount('');
    setFormPaidEdited(false);
    setFormDiscount('');
    setFormTax('');
    setFormNotes('');
    setFormItems([]);
    setSelectedItemId('');
    setSelectedItemQty(1);
    setSelectedItemPrice('');
  };

  const handleAddItemToCreate = () => {
    if (!selectedItemId) return;
    const foundItem = items.find((i) => String(i.id) === String(selectedItemId));
    if (!foundItem) return;

    const qty = Math.max(1, parseInt(selectedItemQty, 10) || 1);
    const price = selectedItemPrice !== '' ? Math.max(0, parseFloat(selectedItemPrice) || 0) : parseFloat(foundItem.unitPrice) || 0;

    setFormItems((prev) => {
      const idx = prev.findIndex((it) => String(it.id) === String(foundItem.id));
      if (idx >= 0) {
        return prev.map((it, i) => (i === idx ? { ...it, qty: it.qty + qty, unitPrice: price, lineTotal: (it.qty + qty) * price } : it));
      }
      return [
        ...prev,
        {
          id: foundItem.id,
          name: foundItem.name,
          category: foundItem.category || 'General',
          qty,
          unitPrice: price,
          lineTotal: qty * price
        }
      ];
    });

    setSelectedItemId('');
    setSelectedItemQty(1);
    setSelectedItemPrice('');
  };

  const handleSaveNewInvoice = async (andPrint = false) => {
    if (formItems.length === 0) {
      showToast('Please add at least one product item.', 'error');
      return;
    }

    const now = new Date();
    const invNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    const dateFormatted = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
    const paidAmt = formPaidAmount === '' ? (formPaymentMethod === 'Credit' ? 0 : formGrandTotal) : Math.max(0, parseFloat(formPaidAmount) || 0);
    const balanceAmt = Math.max(0, formGrandTotal - paidAmt);
    const status = formGrandTotal > 0 && balanceAmt <= 0 ? 'Paid' : paidAmt > 0 ? 'Partial' : 'Unpaid';

    const payload = {
      id: invNumber,
      invoiceNo: invNumber,
      saleNo: invNumber,
      date: `${dateFormatted}, ${timeFormatted}`,
      time: `${dateFormatted}, ${timeFormatted}`,
      dateISO: now.toISOString(),
      customer: formCustomerName.trim() || 'Walk-in Customer',
      customerName: formCustomerName.trim() || 'Walk-in Customer',
      phone: formCustomerPhone.trim(),
      customerPhone: formCustomerPhone.trim(),
      issuedTo: formCustomerName.trim() || 'Walk-in Customer',
      department: formCustomerPhone.trim() || 'Retail Counter',
      paymentMethod: formPaymentMethod,
      paymentStatus: status,
      paidAmount: paidAmt,
      balanceAmount: balanceAmt,
      notes: formNotes.trim(),
      items: formItems,
      subTotal: formSubTotal,
      discount: formDiscNum,
      tax: formTaxNum,
      totalAmount: formGrandTotal
    };

    try {
      await addShopSale(payload);
      if (typeof issueStock === 'function') {
        await Promise.allSettled(
          formItems.map((it) =>
            issueStock(
              it.id,
              it.qty,
              payload.customerName,
              payload.phone || 'Retail Counter',
              'Counter Sales',
              `Invoice: ${invNumber}`,
              it.unitPrice,
              it.category || 'General'
            )
          )
        );
      }
      showToast(`Invoice ${invNumber} generated successfully!`);
      setCreateModalOpen(false);
      resetCreateForm();
      if (andPrint) setPrintInvoice(normalizeShopSaleRecord(payload));
    } catch (err) {
      console.error('Create shop invoice error:', err);
      showToast('Failed to generate invoice.', 'error');
    }
  };

  // Receive Payment Voucher Handler
  const handleOpenReceivePayment = (inv) => {
    setVoucherInitData({
      customerName: inv.customerName,
      entryType: 'Receipt',
      refSelection: `Sale:${inv.id}`,
      amountPaid: inv.balanceAmount > 0 ? String(inv.balanceAmount) : ''
    });
    setVoucherOpen(true);
  };

  const handleSavePaymentVoucher = async (payload) => {
    try {
      await addShopCustomerPayment({
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
      showToast(`Payment of ${formatPKR(payload.amountPaid)} recorded for ${payload.customerName}!`);
      setVoucherOpen(false);
    } catch (err) {
      showToast('Failed to record payment.', 'error');
      throw err;
    }
  };

  // Edit Drawer Handlers
  const handleOpenEdit = (inv) => {
    setEditingInvoice({
      ...inv.raw,
      id: inv.id,
      docNo: inv.docNo,
      customerName: inv.customerName,
      customerPhone: inv.customerPhone,
      paymentMethod: inv.paymentMethod || 'Cash',
      notes: inv.raw?.notes || '',
      discount: inv.raw?.discount || 0,
      tax: inv.raw?.tax || 0,
      paidAmount: inv.paidAmount,
      items: inv.items.map((it) => ({ ...it }))
    });
    setEditDrawerOpen(true);
  };

  const editSubTotal = useMemo(
    () => (editingInvoice?.items || []).reduce((sum, it) => sum + (parseFloat(it.lineTotal) || 0), 0),
    [editingInvoice?.items]
  );
  const editGrandTotal = Math.max(
    0,
    editSubTotal - (parseFloat(editingInvoice?.discount) || 0) + (parseFloat(editingInvoice?.tax) || 0)
  );

  const handleSaveEditedInvoice = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;
    if ((editingInvoice.items || []).length === 0) {
      showToast('Invoice must have at least one item.', 'error');
      return;
    }

    const updatedPaid = Math.max(0, parseFloat(editingInvoice.paidAmount) || 0);
    await updateShopSale(editingInvoice.id, {
      customer: editingInvoice.customerName.trim() || 'Walk-in Customer',
      customerName: editingInvoice.customerName.trim() || 'Walk-in Customer',
      phone: (editingInvoice.customerPhone || '').trim(),
      customerPhone: (editingInvoice.customerPhone || '').trim(),
      paymentMethod: editingInvoice.paymentMethod || 'Cash',
      notes: (editingInvoice.notes || '').trim(),
      items: editingInvoice.items,
      subTotal: editSubTotal,
      discount: parseFloat(editingInvoice.discount) || 0,
      tax: parseFloat(editingInvoice.tax) || 0,
      totalAmount: editGrandTotal,
      paidAmount: updatedPaid
    });

    showToast(`Invoice ${editingInvoice.docNo} updated!`);
    setEditDrawerOpen(false);
    setEditingInvoice(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteShopSale(deleteTarget.id);
    showToast(`Invoice ${deleteTarget.docNo} deleted.`);
    setDeleteTarget(null);
  };

  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header & KPIs */}
      <Box>
        <PageHeader
          title="Shop Invoices"
          count={normalizedInvoices.length}
          countLabel="Invoices"
          subtitle="Track retail sales invoices, collect due balances, edit bills, and print customer receipts."
          actions={
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <AppButton intent="secondary" startIcon={<ShoppingCartOutlined />} onClick={() => navigate('/shop/mart')}>
                Open Shop Mart
              </AppButton>
              <AppButton
                intent="primary"
                startIcon={<PlusOutlined />}
                onClick={() => {
                  resetCreateForm();
                  setCreateModalOpen(true);
                }}
              >
                New Invoice
              </AppButton>
            </Box>
          }
          sx={{ mb: 2 }}
        />

        <MasterKpiGrid
          kpis={[
            {
              label: 'Total Shop Invoices',
              value: kpiSummary.totalCount.toLocaleString(),
              helper: 'Counter slips & retail bills',
              icon: <FileTextOutlined />,
              tone: 'primary'
            },
            {
              label: 'Total Billed Amount',
              value: formatPKR(kpiSummary.totalBilled),
              helper: 'Combined retail sales value',
              icon: <DollarOutlined />,
              tone: 'primary'
            },
            {
              label: 'Payments Collected',
              value: formatPKR(kpiSummary.totalPaid),
              helper: 'Cash & settled receipts',
              icon: <CheckCircleOutlined />,
              tone: 'success',
              highlightValue: true
            },
            {
              label: 'Pending Receivables',
              value: formatPKR(kpiSummary.totalDue),
              helper: `${kpiSummary.dueCount} open balance invoice(s)`,
              icon: <DollarOutlined />,
              tone: kpiSummary.totalDue > 0 ? 'error' : 'success',
              highlightValue: kpiSummary.totalDue > 0
            }
          ]}
        />
      </Box>

      {/* Main Ledger Card */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          {/* Status Filter Tabs */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', p: 0.5, borderRadius: 2, gap: 0.5, flexWrap: 'wrap' })}>
              {[
                { key: 'all', label: `All Invoices (${normalizedInvoices.length})` },
                { key: 'Paid', label: 'Paid' },
                { key: 'Partial', label: 'Partial' },
                { key: 'Unpaid', label: 'Unpaid / Credit' }
              ].map((tab) => {
                const isActive = statusTab === tab.key;
                return (
                  <Box
                    key={tab.key}
                    component="button"
                    type="button"
                    onClick={() => setStatusTab(tab.key)}
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

            <Typography variant="caption" color="text.secondary">
              Showing {filteredInvoices.length} retail invoice(s)
            </Typography>
          </Box>

          <FilterBar
            hasActiveFilters={Boolean(searchTerm) || filterPeriod !== 'all' || filterMethod !== 'all' || statusTab !== 'all'}
            onClear={() => {
              setSearchTerm('');
              setFilterPeriod('all');
              setFilterMethod('all');
              setStatusTab('all');
            }}
            sx={{ mb: 0, p: 1.25 }}
          >
            <OutlinedInput
              size="small"
              placeholder="Search by invoice #, customer, phone, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 240 }, bgcolor: 'background.paper' }}
            />

            <TextField
              select
              size="small"
              label="Time Period"
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              sx={{ width: { xs: '100%', sm: 165 }, bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Payment Method"
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              sx={{ width: { xs: '100%', sm: 175 }, bgcolor: 'background.paper' }}
            >
              <MenuItem value="all">All Methods</MenuItem>
              {SHOP_PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
          </FilterBar>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 920 }}>
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
                <TableCell sx={tableHeadCellSx}>Customer</TableCell>
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
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <FileTextOutlined style={{ fontSize: 38, color: theme.palette.text.disabled, display: 'block', margin: '0 auto 8px' }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No shop invoices found
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Complete a sale from Shop Mart or click &ldquo;New Invoice&rdquo; above.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((inv) => (
                  <TableRow key={inv.id} hover sx={{ '& td': { py: 1.75 } }}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {inv.docNo}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inv.paymentMethod}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {inv.dateLabel}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {inv.customerName}
                      </Typography>
                      {inv.customerPhone && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {inv.customerPhone}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}
                      >
                        {inv.itemsSummary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inv.itemsCount} {inv.itemsCount === 1 ? 'item' : 'items'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={inv.paymentStatus}
                        size="small"
                        color={getPaymentStatusColor(inv.paymentStatus)}
                        variant="light"
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatPKR(inv.billTotal)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                        Paid: {formatPKR(inv.paidAmount)}
                      </Typography>
                      {inv.allocatedFromAccount > 0 && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Incl. {formatPKR(inv.allocatedFromAccount)} on-account
                        </Typography>
                      )}
                      {inv.balanceAmount > 0 && (
                        <Typography variant="caption" display="block" fontWeight={700} sx={{ color: errorTone.main, fontVariantNumeric: 'tabular-nums' }}>
                          Due: {formatPKR(inv.balanceAmount)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center" sx={{ pr: 2.5 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <AppButton
                          size="small"
                          intent={inv.balanceAmount > 0 ? 'primary' : 'neutral'}
                          startIcon={<DollarOutlined />}
                          disabled={inv.balanceAmount <= 0}
                          onClick={() => handleOpenReceivePayment(inv)}
                        >
                          {inv.balanceAmount > 0 ? 'Receive' : 'Settled'}
                        </AppButton>

                        <Tooltip title="Print Invoice">
                          <IconButton
                            size="small"
                            onClick={() => setPrintInvoice(inv)}
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
                            onClick={() => handleOpenEdit(inv)}
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
                              onClick={() => setDeleteTarget(inv)}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredInvoices.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </MainCard>

      {/* Shared Payment Voucher Dialog */}
      <PaymentVoucherDialog
        open={voucherOpen}
        onClose={() => setVoucherOpen(false)}
        initialData={voucherInitData}
        customerDirectory={customerDirectory}
        customerLedgers={customerLedgers}
        onSaveVoucher={handleSavePaymentVoucher}
      />

      {/* Create Invoice Modal */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileTextOutlined style={{ color: primaryTone.main }} /> New Shop Invoice
          </Box>
          <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.3fr 1fr 1fr' }, gap: 1.5 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={customerDirectory.map((c) => c.name)}
                value={formCustomerName || null}
                inputValue={formCustomerName}
                onChange={(_, val) => setFormCustomerName(val || '')}
                onInputChange={(_, val, reason) => {
                  if (reason !== 'reset') setFormCustomerName(val || '');
                }}
                renderInput={(params) => <TextField {...params} label="Customer Name" placeholder="Walk-in Customer" />}
              />
              <TextField
                size="small"
                label="Phone (Optional)"
                placeholder="0300-1234567"
                value={formCustomerPhone}
                onChange={(e) => setFormCustomerPhone(e.target.value)}
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
                {SHOP_PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Add Product Row */}
            <Box sx={getSubSurfaceSx(theme, { p: 2 })}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.25 }}>
                Add Product to Invoice
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 80px 120px auto' }, gap: 1.25, alignItems: 'center' }}>
                <TextField
                  select
                  size="small"
                  label="Select Shop Product"
                  value={selectedItemId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedItemId(id);
                    const found = items.find((it) => String(it.id) === String(id));
                    if (found) setSelectedItemPrice(String(found.unitPrice || 0));
                  }}
                >
                  <MenuItem value="">-- Choose Product --</MenuItem>
                  {items.map((it) => (
                    <MenuItem key={it.id} value={it.id}>
                      {it.name} (Stock: {it.totalStock || 0} • {formatPKR(it.unitPrice)})
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
                  onChange={(e) => setSelectedItemPrice(e.target.value)}
                />

                <AppButton intent="secondary" size="small" startIcon={<PlusOutlined />} onClick={handleAddItemToCreate} disabled={!selectedItemId}>
                  Add
                </AppButton>
              </Box>
            </Box>

            {formItems.length > 0 && (
              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
                      <TableCell sx={tableHeadCellSx}>Item</TableCell>
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
                      <TableRow key={it.id}>
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
                            onClick={() => setFormItems((prev) => prev.filter((row) => row.id !== it.id))}
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

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 1.5 }}>
              <TextField
                size="small"
                type="number"
                label="Discount (PKR)"
                inputProps={{ min: 0 }}
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
              />
              <TextField
                size="small"
                type="number"
                label="Tax (PKR)"
                inputProps={{ min: 0 }}
                value={formTax}
                onChange={(e) => setFormTax(e.target.value)}
              />
              <TextField
                size="small"
                type="number"
                label="Paid Amount (PKR)"
                inputProps={{ min: 0 }}
                value={formPaidAmount}
                onChange={(e) => {
                  setFormPaidAmount(e.target.value);
                  setFormPaidEdited(true);
                }}
              />
              <TextField size="small" label="Notes" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </Box>

            <Box sx={getSubSurfaceSx(theme, { p: 1.75, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 })}>
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                Sub Total: {formatPKR(formSubTotal)} • Balance Due:{' '}
                <Box component="span" sx={{ fontWeight: 700, color: errorTone.main }}>
                  {formatPKR(Math.max(0, formGrandTotal - (parseFloat(formPaidAmount) || 0)))}
                </Box>
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                Grand Total: {formatPKR(formGrandTotal)}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: getSubSurfaceSx(theme).bgcolor }}>
          <AppButton intent="cancel" onClick={() => setCreateModalOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="secondary" startIcon={<PrinterOutlined />} onClick={() => handleSaveNewInvoice(true)} disabled={formItems.length === 0}>
            Save &amp; Print
          </AppButton>
          <AppButton intent="primary" onClick={() => handleSaveNewInvoice(false)} disabled={formItems.length === 0}>
            Save Invoice
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Edit Invoice Drawer */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: { xs: '100vw', sm: 440 }, p: 3 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={700}>
            Edit Invoice {editingInvoice?.docNo}
          </Typography>
          <IconButton size="small" onClick={() => setEditDrawerOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {editingInvoice && (
          <Box component="form" onSubmit={handleSaveEditedInvoice} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Customer Name"
              size="small"
              fullWidth
              required
              value={editingInvoice.customerName}
              onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Phone"
                size="small"
                fullWidth
                value={editingInvoice.customerPhone || ''}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, customerPhone: e.target.value })}
              />
              <TextField
                select
                label="Payment Method"
                size="small"
                fullWidth
                value={editingInvoice.paymentMethod || 'Cash'}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, paymentMethod: e.target.value })}
              >
                {SHOP_PAYMENT_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
              Line Items ({editingInvoice.items.length})
            </Typography>
            {editingInvoice.items.map((it, idx) => (
              <Box key={it.id || idx} sx={getSubSurfaceSx(theme, { p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 })}>
                <TextField
                  size="small"
                  label="Item Name"
                  value={it.name || ''}
                  onChange={(e) => {
                    const updated = [...editingInvoice.items];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setEditingInvoice({ ...editingInvoice, items: updated });
                  }}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 1, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Qty"
                    value={it.qty}
                    onChange={(e) => {
                      const q = Math.max(1, parseInt(e.target.value, 10) || 1);
                      const updated = [...editingInvoice.items];
                      updated[idx] = { ...updated[idx], qty: q, lineTotal: q * (parseFloat(updated[idx].unitPrice) || 0) };
                      setEditingInvoice({ ...editingInvoice, items: updated });
                    }}
                  />
                  <TextField
                    size="small"
                    type="number"
                    label="Rate"
                    value={it.unitPrice}
                    onChange={(e) => {
                      const p = Math.max(0, parseFloat(e.target.value) || 0);
                      const updated = [...editingInvoice.items];
                      updated[idx] = { ...updated[idx], unitPrice: p, lineTotal: (parseInt(updated[idx].qty, 10) || 1) * p };
                      setEditingInvoice({ ...editingInvoice, items: updated });
                    }}
                  />
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      setEditingInvoice({
                        ...editingInvoice,
                        items: editingInvoice.items.filter((_, rIdx) => rIdx !== idx)
                      })
                    }
                  >
                    <DeleteOutlined style={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              </Box>
            ))}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.25 }}>
              <TextField
                size="small"
                type="number"
                label="Discount"
                value={editingInvoice.discount}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, discount: e.target.value })}
              />
              <TextField
                size="small"
                type="number"
                label="Tax"
                value={editingInvoice.tax}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, tax: e.target.value })}
              />
              <TextField
                size="small"
                type="number"
                label="Paid Amt"
                value={editingInvoice.paidAmount}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, paidAmount: e.target.value })}
              />
            </Box>

            <TextField
              label="Notes"
              size="small"
              multiline
              minRows={2}
              value={editingInvoice.notes || ''}
              onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
            />

            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              Updated Net Total: {formatPKR(editGrandTotal)}
            </Typography>

            <AppButton type="submit" intent="primary" fullWidth>
              Save Invoice Changes
            </AppButton>
          </Box>
        )}
      </Drawer>

      {/* Print Modal via Shared UniversalPrintModal */}
      {printInvoice && (
        <UniversalPrintModal
          open={Boolean(printInvoice)}
          onClose={() => setPrintInvoice(null)}
          title="Official Shop Sales Invoice"
          typeTag="Shop Sales Receipt"
          badgeColor={printInvoice.paymentStatus === 'Paid' ? 'success' : 'warning'}
          partyLabel="Customer Details"
          party={{
            name: printInvoice.customerName,
            phone: printInvoice.customerPhone || undefined,
            department: printInvoice.cityAddress || 'Retail Counter'
          }}
          invoiceLabel="Invoice No:"
          invoiceNo={printInvoice.docNo || formatInvoiceNo(printInvoice)}
          date={printInvoice.dateLabel || formatFullDate(printInvoice.time, printInvoice.dateISO)}
          status={printInvoice.paymentStatus || 'Paid'}
          items={(printInvoice.items || []).map((it) => ({
            name: it.name || it.machineName,
            subtitle: it.category,
            qty: it.qty,
            rate: it.unitPrice,
            total: it.lineTotal
          }))}
          summary={{
            totalAmount: printInvoice.billTotal ?? printInvoice.lineTotal,
            paidAmount: printInvoice.paidAmount,
            balanceAmount: printInvoice.balanceAmount ?? Math.max(0, (printInvoice.lineTotal || 0) - (printInvoice.paidAmount || 0)),
            notes: `Payment Method: ${printInvoice.paymentMethod || 'Cash'}${printInvoice.notes ? ` • ${printInvoice.notes}` : ''}`
          }}
          receiverSignatureLabel="Customer Signature"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Invoice ${deleteTarget?.docNo || ''}?`}
        message={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.docNo}</strong> for <strong>{deleteTarget?.customerName}</strong>?
          </>
        }
        confirmText="Delete Invoice"
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} sx={{ fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
