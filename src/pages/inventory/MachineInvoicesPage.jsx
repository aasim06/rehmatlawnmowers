import { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
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
  Typography,
  Alert,
  Snackbar,
  Autocomplete
} from '@mui/material';

// Ant Design Icons
import {
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  PrinterOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
  ReloadOutlined,
  DollarOutlined
} from '@ant-design/icons';

// Project imports
import MainCard from 'components/MainCard';
import CeoSignature from 'components/CeoSignature';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';

// Helper for currency formatting
const formatRs = (num) => {
  const val = parseFloat(num) || 0;
  return `Rs. ${val.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
};

const formatInvoiceNo = (sale) => {
  if (!sale) return 'MS-10001';
  const num = typeof sale === 'string' ? sale : sale.saleNo || sale.sale_no || sale.id;
  if (!num) return 'MS-10001';
  const str = String(num).trim();
  if ((str.startsWith('MS-') || str.startsWith('PO-') || str.startsWith('REP-') || str.startsWith('INV-')) && str.length <= 15) {
    return str;
  }
  const cleanHex = str
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 5)
    .toUpperCase();
  return `MS-${cleanHex || '10001'}`;
};

const formatFullDate = (timeStr, dateISO) => {
  if (dateISO) {
    const d = new Date(dateISO);
    if (!isNaN(d.getTime())) {
      const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateFormatted}, ${timeFormatted}`;
    }
  }
  if (timeStr && timeStr.includes('Today,')) {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return timeStr.replace('Today,', `${todayStr},`);
  }
  return timeStr || 'N/A';
};

export default function MachineInvoicesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { canDelete, canEditPrice } = usePermission();

  const {
    machineSales = [],
    machineModels = [],
    addCustomerPayment,
    updateMachineSale,
    deleteMachineSale
  } = useStoreInventory();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, today, week, month
  const [filterPayment, setFilterPayment] = useState('all'); // all, Paid, Partial, Unpaid

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Notification State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Modal States
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPay, setSelectedInvoiceForPay] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  });

  // Selected invoice for actions
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingSale, setEditingSale] = useState(null);

  // ── Open Payment Modal ───────────────────────────────────────────────────
  const handleOpenPaymentModal = (inv) => {
    setSelectedInvoiceForPay(inv);
    const totalBill = parseFloat(inv.lineTotal || inv.subTotal) || 0;
    const currentPaid = parseFloat(inv.paidAmount) || 0;
    const currentBal = Math.max(0, totalBill - currentPaid);
    setPaymentForm({
      amountPaid: currentBal > 0 ? String(currentBal) : '',
      paymentMethod: 'Cash',
      referenceNo: '',
      notes: ''
    });
    setPaymentModalOpen(true);
  };

  // ── Submit Payment Handler ───────────────────────────────────────────────
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPay) return;
    const paidNum = parseFloat(paymentForm.amountPaid) || 0;
    if (paidNum <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    const currentPaid = parseFloat(selectedInvoiceForPay.paidAmount) || 0;
    const totalBill = parseFloat(selectedInvoiceForPay.lineTotal || selectedInvoiceForPay.subTotal) || 0;
    const newPaid = currentPaid + paidNum;
    const newBalance = Math.max(0, totalBill - newPaid);
    const newStatus = newPaid >= totalBill ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid';

    try {
      if (addCustomerPayment) {
        await addCustomerPayment({
          customerName: selectedInvoiceForPay.customerName || 'Walk-in Customer',
          invoiceId: selectedInvoiceForPay.id,
          amountPaid: paidNum,
          paymentMethod: paymentForm.paymentMethod,
          referenceNo: paymentForm.referenceNo,
          notes: paymentForm.notes
        });
      }

      if (updateMachineSale) {
        await updateMachineSale(selectedInvoiceForPay.id, {
          paidAmount: newPaid,
          balanceAmount: newBalance,
          paymentStatus: newStatus
        });
      }

      showToast(`Payment of Rs. ${paidNum.toLocaleString()} received successfully for invoice #${formatInvoiceNo(selectedInvoiceForPay)}!`);
      setPaymentModalOpen(false);
    } catch (err) {
      console.error('Payment collection error:', err);
      showToast('Failed to record payment', 'error');
    }
  };

  // ── Open Edit Drawer ─────────────────────────────────────────────────────
  const handleOpenEdit = (sale) => {
    const itemsArray =
      sale.items && sale.items.length > 0
        ? sale.items.map((i) => ({ ...i }))
        : [
            {
              machineName: sale.machineName || '',
              serialNo: sale.serialNo || '',
              qty: sale.qty || 1,
              unitPrice: sale.unitPrice || 0,
              discount: sale.discount || 0
            }
          ];

    setEditingSale({
      ...sale,
      items: itemsArray,
      paidAmount: sale.paidAmount || 0,
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      cityAddress: sale.cityAddress || '',
      warrantyTerms: sale.warrantyTerms || '1 Year Motor & Frame Free Service Warranty'
    });
    setEditDrawerOpen(true);
  };

  // ── Submit Edit Sale ─────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!editingSale) return;

    const itemsList = editingSale.items.map((i) => {
      const q = parseInt(i.qty, 10) || 1;
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
    });

    const subTotal = itemsList.reduce((sum, i) => sum + i.lineTotal, 0);
    const discSum = itemsList.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
    const total = subTotal;
    const totalQtySum = itemsList.reduce((sum, i) => sum + i.qty, 0);
    const paid = parseFloat(editingSale.paidAmount) || 0;
    const bal = Math.max(0, total - paid);
    const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    const firstMachine = itemsList[0] || {};

    try {
      await updateMachineSale(editingSale.id, {
        customerName: editingSale.customerName,
        customerPhone: editingSale.customerPhone,
        cityAddress: editingSale.cityAddress,
        items: itemsList,
        machineName: itemsList.length > 1 ? `${firstMachine.machineName} (+${itemsList.length - 1} more)` : firstMachine.machineName,
        serialNo: firstMachine.serialNo,
        qty: totalQtySum,
        unitPrice: firstMachine.unitPrice,
        subTotal,
        discountAmount: discSum,
        lineTotal: total,
        paidAmount: paid,
        balanceAmount: bal,
        paymentStatus: status,
        warrantyTerms: editingSale.warrantyTerms
      });

      showToast(`Machine invoice ${formatInvoiceNo(editingSale)} updated successfully!`);
      setEditDrawerOpen(false);
      setEditingSale(null);
    } catch (err) {
      console.error('Update machine invoice error:', err);
      showToast('Failed to update invoice.', 'error');
    }
  };

  // ── Delete Invoice ───────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!selectedInvoice) return;
    try {
      if (typeof deleteMachineSale === 'function') {
        await deleteMachineSale(selectedInvoice.id);
      }
      showToast(`Invoice ${formatInvoiceNo(selectedInvoice)} deleted successfully!`);
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Delete invoice error:', err);
      showToast('Failed to delete invoice.', 'error');
    }
  };

  // ── Filter Invoices ──────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return (machineSales || []).filter((inv) => {
      // 1. Search term match
      if (term) {
        const invNo = (inv.saleNo || inv.id || '').toLowerCase();
        const cust = (inv.customerName || '').toLowerCase();
        const phone = (inv.customerPhone || '').toLowerCase();
        const city = (inv.cityAddress || '').toLowerCase();
        const machinesStr = (inv.items || [])
          .map((i) => i.machineName || '')
          .concat([inv.machineName || ''])
          .join(' ')
          .toLowerCase();

        const matches = invNo.includes(term) || cust.includes(term) || phone.includes(term) || city.includes(term) || machinesStr.includes(term);

        if (!matches) return false;
      }

      // 2. Filter by Period
      if (filterPeriod !== 'all') {
        let invTime = 0;
        if (inv.dateISO) {
          invTime = new Date(inv.dateISO).getTime();
        } else if (inv.time) {
          const parsed = Date.parse(inv.time);
          if (!isNaN(parsed)) invTime = parsed;
        }

        if (invTime > 0) {
          if (filterPeriod === 'today' && invTime < startOfToday) return false;
          if (filterPeriod === 'week' && invTime < sevenDaysAgo) return false;
          if (filterPeriod === 'month' && invTime < startOfMonth) return false;
        }
      }

      // 3. Filter by Payment Method / Status
      if (filterPayment !== 'all') {
        const status = (inv.paymentStatus || 'Paid').toLowerCase();
        if (status !== filterPayment.toLowerCase()) return false;
      }

      return true;
    });
  }, [machineSales, searchTerm, filterPeriod, filterPayment]);

  // Paginated Slices
  const paginatedInvoices = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: -0.5, color: 'text.primary' }}>
            Machine Invoices &amp; Billing
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View machine sales invoices, manage billing history, edit orders, and print customer receipts.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="success"
          startIcon={<PlusOutlined />}
          onClick={() => navigate('/inventory/machine-sales')}
          sx={{ fontWeight: 800, borderRadius: 1.5, px: 2.5 }}
        >
          + New Machine Sale
        </Button>
      </Box>

      {/* ── Main Invoices Card with Search & Filters ─────────────────────── */}
      <MainCard content={false} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Search & Filter Toolbar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search Input */}
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by invoice #, customer name, phone, or machine model..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined style={{ color: '#8c8c8c' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Filter by Period */}
            <Grid size={{ xs: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={filterPeriod}
                  label="Time Period"
                  onChange={(e) => {
                    setFilterPeriod(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Invoices</MenuItem>
                  <MenuItem value="today">Today's Invoices</MenuItem>
                  <MenuItem value="week">Past 7 Days</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Filter by Payment Status */}
            <Grid size={{ xs: 6, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Status</InputLabel>
                <Select
                  value={filterPayment}
                  label="Payment Status"
                  onChange={(e) => {
                    setFilterPayment(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Partial">Partial</MenuItem>
                  <MenuItem value="Unpaid">Unpaid / Credit</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Reset Filter Button */}
            <Grid size={{ xs: 12, md: 1.5 }}>
              <Button
                fullWidth
                size="medium"
                variant="outlined"
                color="secondary"
                startIcon={<ReloadOutlined />}
                onClick={() => {
                  setSearchTerm('');
                  setFilterPeriod('all');
                  setFilterPayment('all');
                  setPage(0);
                }}
                sx={{ borderRadius: 1.5, fontWeight: 600 }}
              >
                Reset
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Invoices Table */}
        <TableContainer sx={{ minHeight: 380 }}>
          <Table sx={{ minWidth: 850 }}>
            <TableHead sx={{ bgcolor: isDark ? 'background.default' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>INVOICE #</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>DATE &amp; TIME</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>CUSTOMER</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>ITEMS SUMMARY</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>PAYMENT</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="right">
                  SUBTOTAL
                </TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="right">
                  TOTAL AMOUNT
                </TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">
                  ACTIONS
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <FileTextOutlined style={{ fontSize: 44, color: '#bfbfbf', marginBottom: 8 }} />
                      <Typography variant="h6" fontWeight={700} color="text.secondary">
                        No machine invoices found
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Create a machine sale from the Machine Sales page to generate invoices here.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((inv) => {
                  const invNumber = formatInvoiceNo(inv);
                  const custName = inv.customerName || 'Walk-in Customer';
                  const custPhone = inv.customerPhone || '';
                  const custCity = inv.cityAddress || '';
                  const rawItems = inv.items && inv.items.length > 0 ? inv.items : [{ machineName: inv.machineName, qty: inv.qty || 1 }];
                  const totalAmt = parseFloat(inv.lineTotal || inv.subTotal) || 0;
                  const subTotal = parseFloat(inv.subTotal) || totalAmt;
                  const pStatus = inv.paymentStatus || (inv.paidAmount >= totalAmt ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid');
                  const bal = parseFloat(inv.balanceAmount) || Math.max(0, totalAmt - (parseFloat(inv.paidAmount) || 0));

                  return (
                    <TableRow key={inv.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Invoice # */}
                      <TableCell>
                        <Chip
                          label={invNumber}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            bgcolor: isDark ? 'rgba(0, 95, 86, 0.25)' : '#e6f7f4',
                            color: '#005F56',
                            border: '1px solid #86efac'
                          }}
                        />
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          {formatFullDate(inv.time, inv.dateISO)}
                        </Typography>
                      </TableCell>

                      {/* Customer */}
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {custName}
                        </Typography>
                        {(custPhone || custCity) && (
                          <Typography variant="caption" color="text.secondary">
                            {custPhone ? `${custPhone}` : ''}
                            {custPhone && custCity ? ' • ' : ''}
                            {custCity ? `${custCity}` : ''}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Items Summary */}
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="caption" fontWeight={700} color="primary.main" display="block">
                          {rawItems.length} {rawItems.length === 1 ? 'Machine' : 'Machines'}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: '0.8rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'text.primary'
                          }}
                        >
                          {rawItems.map((i) => `${i.machineName || 'Machine'} (x${i.qty || 1})`).join(', ') || 'No item details'}
                        </Typography>
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell>
                        <Chip
                          label={pStatus}
                          size="small"
                          color={pStatus === 'Paid' ? 'success' : pStatus === 'Partial' ? 'warning' : 'error'}
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                        />
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          {formatRs(subTotal)}
                        </Typography>
                      </TableCell>

                      {/* Net Total */}
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={800} color="#005F56">
                          {formatRs(totalAmt)}
                        </Typography>
                        {bal > 0 && (
                          <Typography variant="caption" color="error.main" display="block" fontWeight={700}>
                            Due: {formatRs(bal)}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                          {/* Receive Payment Button */}
                          <Tooltip title="Receive Payment & Update Bill">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<DollarOutlined />}
                              onClick={() => handleOpenPaymentModal(inv)}
                              sx={{
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' },
                                fontWeight: 700,
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontSize: '0.72rem',
                                py: 0.35,
                                px: 1,
                                height: 28,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              Receive Payment
                            </Button>
                          </Tooltip>

                          {/* Print Receipt */}
                          <Tooltip title="View & Print Invoice">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setPrintModalOpen(true);
                              }}
                              sx={{
                                bgcolor: isDark ? 'rgba(0, 95, 86, 0.2)' : '#e6f7f4',
                                '&:hover': { bgcolor: '#005F56', color: '#fff' }
                              }}
                            >
                              <PrinterOutlined style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Edit Invoice */}
                          <Tooltip title="Edit Invoice">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleOpenEdit(inv)}
                              sx={{
                                bgcolor: isDark ? 'rgba(22, 119, 255, 0.15)' : '#e6f4ff',
                                '&:hover': { bgcolor: '#1677ff', color: '#fff' }
                              }}
                            >
                              <EditOutlined style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>

                          {/* Delete Invoice */}
                          {canDelete && (
                            <Tooltip title="Delete Invoice">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedInvoice(inv);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{
                                  bgcolor: isDark ? 'rgba(255, 77, 79, 0.15)' : '#fff1f0',
                                  '&:hover': { bgcolor: '#ff4d4f', color: '#fff' }
                                }}
                              >
                                <DeleteOutlined style={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
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
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </MainCard>

      {/* ── PRINT OFFICIAL MACHINE SALE INVOICE DIALOG ──────────────────── */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
              #root { display: none !important; }
              body * { visibility: hidden !important; }
              #printable-machine-invoice, #printable-machine-invoice * { visibility: visible !important; }
              #printable-machine-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 10px !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .MuiDialog-root, .MuiDialog-container, .MuiDialog-paper, .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                overflow: visible !important;
                box-shadow: none !important;
              }
              .MuiBackdrop-root, .MuiDialogActions-root, .MuiDialogTitle-root, .no-print, button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle
          className="no-print"
          sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
        >
          <Typography variant="h5" fontWeight={700}>
            Official Customer Machine Sale Invoice
          </Typography>
          <Chip label="Sales Invoice" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
          {selectedInvoice && (
            <Box
              id="printable-machine-invoice"
              sx={{
                p: 2,
                bgcolor: '#fff',
                color: '#111827',
                borderRadius: 1
              }}
            >
              {/* Header Box */}
              <Box sx={{ border: '1px solid #000', mb: 2 }}>
                <Grid container>
                  <Grid size={{ xs: 7 }} sx={{ p: 1.5, borderRight: '1px solid #000' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#666', display: 'block' }}>
                      CUSTOMER DETAILS
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      {selectedInvoice.customerName || 'Walk-in Customer'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      Phone: {selectedInvoice.customerPhone || 'N/A'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      City / Address: {selectedInvoice.cityAddress || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 5 }} sx={{ p: 1.5 }}>
                    <Stack spacing={0.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Invoice No:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'monospace' }}>
                          {formatInvoiceNo(selectedInvoice)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Date &amp; Time:</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {formatFullDate(selectedInvoice.time, selectedInvoice.dateISO)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800 }}>Payment Status:</Typography>
                        <Chip
                          label={selectedInvoice.paymentStatus || 'Paid'}
                          size="small"
                          color={selectedInvoice.paymentStatus === 'Paid' ? 'success' : selectedInvoice.paymentStatus === 'Partial' ? 'warning' : 'error'}
                          sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800 }}
                        />
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Box>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fff', borderBottom: '1px solid #000' }}>
                    <th style={{ width: '8%', padding: '6px', borderRight: '1px solid #000', textAlign: 'center', fontSize: '0.8rem' }}>Sr</th>
                    <th style={{ width: '52%', padding: '6px', borderRight: '1px solid #000', textAlign: 'left', fontSize: '0.8rem' }}>
                      Specification / Model
                    </th>
                    <th style={{ width: '10%', padding: '6px', borderRight: '1px solid #000', textAlign: 'center', fontSize: '0.8rem' }}>QTY</th>
                    <th style={{ width: '15%', padding: '6px', borderRight: '1px solid #000', textAlign: 'right', fontSize: '0.8rem' }}>Rate</th>
                    <th style={{ width: '15%', padding: '6px', textAlign: 'right', fontSize: '0.8rem' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedInvoice.items && selectedInvoice.items.length > 0
                    ? selectedInvoice.items
                    : [
                        {
                          machineName: selectedInvoice.machineName,
                          serialNo: selectedInvoice.serialNo,
                          qty: selectedInvoice.qty || 1,
                          unitPrice: selectedInvoice.unitPrice || selectedInvoice.lineTotal,
                          lineTotal: selectedInvoice.lineTotal
                        }
                      ]
                  ).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ padding: '6px', borderRight: '1px solid #000', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '6px', borderRight: '1px solid #000', fontSize: '0.8rem', fontWeight: 600 }}>
                        {item.machineName || 'Machine'}
                        {item.serialNo && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#666' }}>
                            S/N: {item.serialNo}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '6px', borderRight: '1px solid #000', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                        {String(item.qty || 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '6px', borderRight: '1px solid #000', textAlign: 'right', fontSize: '0.8rem' }}>
                        {(parseFloat(item.unitPrice) || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '6px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 700 }}>
                        {(parseFloat(item.lineTotal) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ backgroundColor: '#fff', borderTop: '1px solid #000' }}>
                    <td colSpan={4} style={{ padding: '6px 12px', borderRight: '1px solid #000', textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>
                      Total amount
                    </td>
                    <td style={{ padding: '6px', textAlign: 'right', fontWeight: 900, fontSize: '0.85rem' }}>
                      {(parseFloat(selectedInvoice.lineTotal || selectedInvoice.subTotal) || 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Box with Flex Space-Between */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 1,
                  mb: 3
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 800 }}>
                  PAID AMOUNT: Rs. {(parseFloat(selectedInvoice.paidAmount) || 0).toLocaleString()}
                </Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    NET TOTAL: Rs. {(parseFloat(selectedInvoice.lineTotal || selectedInvoice.subTotal) || 0).toLocaleString()}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: (parseFloat(selectedInvoice.balanceAmount) || 0) > 0 ? 'error.main' : 'success.main',
                      display: 'block'
                    }}
                  >
                    REMAINING DUE: Rs. {(parseFloat(selectedInvoice.balanceAmount) || 0).toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              {/* Warranty Terms */}
              {selectedInvoice.warrantyTerms && (
                <Box sx={{ mb: 2, p: 1, bgcolor: '#f0fdf4', border: '1px dashed #86efac', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>
                    Warranty Terms: {selectedInvoice.warrantyTerms}
                  </Typography>
                </Box>
              )}

              {/* Signatures */}
              <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ borderTop: '1px solid #94a3b8', pt: 1, width: 200, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Customer Signature
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                    <CeoSignature />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions className="no-print" sx={{ p: 2 }}>
          <Button onClick={() => setPrintModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            sx={{ fontWeight: 800, px: 3 }}
          >
            Print Customer Machine Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── EDIT MACHINE SALE INVOICE DRAWER ────────────────────────────── */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 460 }, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={800}>
              Edit Machine Invoice
            </Typography>
            <IconButton onClick={() => setEditDrawerOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {editingSale && (
            <form onSubmit={handleEditSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Customer Name"
                  fullWidth
                  value={editingSale.customerName}
                  onChange={(e) => setEditingSale({ ...editingSale, customerName: e.target.value })}
                  required
                />
                <TextField
                  label="Customer Phone"
                  fullWidth
                  value={editingSale.customerPhone}
                  onChange={(e) => setEditingSale({ ...editingSale, customerPhone: e.target.value })}
                />
                <TextField
                  label="City / Address"
                  fullWidth
                  value={editingSale.cityAddress}
                  onChange={(e) => setEditingSale({ ...editingSale, cityAddress: e.target.value })}
                />

                {/* Machines List */}
                <Typography variant="subtitle2" fontWeight={800} color="primary">
                  Machines Purchased ({editingSale.items.length})
                </Typography>

                {editingSale.items.map((item, idx) => (
                  <Box key={idx} sx={{ p: 1.5, border: '1px solid #e2e8f0', borderRadius: 1.5, bgcolor: '#f8fafc' }}>
                    <Stack spacing={1.5}>
                      <Autocomplete
                        freeSolo
                        options={machineModels}
                        value={item.machineName}
                        onChange={(e, val) => {
                          const updated = [...editingSale.items];
                          updated[idx].machineName = val || '';
                          setEditingSale({ ...editingSale, items: updated });
                        }}
                        onInputChange={(e, val) => {
                          const updated = [...editingSale.items];
                          updated[idx].machineName = val || '';
                          setEditingSale({ ...editingSale, items: updated });
                        }}
                        renderInput={(params) => <TextField {...params} label="Machine Model" size="small" required />}
                      />
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Qty"
                            type="number"
                            size="small"
                            fullWidth
                            value={item.qty}
                            onChange={(e) => {
                              const updated = [...editingSale.items];
                              updated[idx].qty = parseInt(e.target.value, 10) || 1;
                              setEditingSale({ ...editingSale, items: updated });
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Unit Price"
                            type="number"
                            size="small"
                            fullWidth
                            disabled={!canEditPrice}
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...editingSale.items];
                              updated[idx].unitPrice = parseFloat(e.target.value) || 0;
                              setEditingSale({ ...editingSale, items: updated });
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Stack>
                  </Box>
                ))}

                <TextField
                  label="Paid Amount (Rs.)"
                  type="number"
                  fullWidth
                  value={editingSale.paidAmount}
                  onChange={(e) => setEditingSale({ ...editingSale, paidAmount: e.target.value })}
                />

                <TextField
                  label="Warranty Terms"
                  fullWidth
                  multiline
                  rows={2}
                  value={editingSale.warrantyTerms}
                  onChange={(e) => setEditingSale({ ...editingSale, warrantyTerms: e.target.value })}
                />

                <Button type="submit" variant="contained" color="success" fullWidth sx={{ fontWeight: 800, py: 1.2 }}>
                  Save Changes
                </Button>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* ── RECEIVE PAYMENT MODAL ────────────────────────────────────────── */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
          }
        }}
      >
        <form onSubmit={handlePaymentSubmit}>
          <DialogTitle
            sx={{
              fontWeight: 800,
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider',
              pb: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DollarOutlined /> Receive Payment
              {selectedInvoiceForPay && (
                <Chip
                  label={formatInvoiceNo(selectedInvoiceForPay)}
                  size="small"
                  sx={{ fontWeight: 800, ml: 1, bgcolor: '#e6f7f4', color: '#005F56' }}
                />
              )}
            </Box>
            <IconButton size="small" onClick={() => setPaymentModalOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            {selectedInvoiceForPay && (() => {
              const totalBill = parseFloat(selectedInvoiceForPay.lineTotal || selectedInvoiceForPay.subTotal) || 0;
              const alreadyPaid = parseFloat(selectedInvoiceForPay.paidAmount) || 0;
              const dueBal = Math.max(0, totalBill - alreadyPaid);
              const paidNow = parseFloat(paymentForm.amountPaid) || 0;
              const remAfter = Math.max(0, dueBal - paidNow);

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* Customer & Invoice Summary Card */}
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f0fdf4',
                      borderRadius: 1.5,
                      border: '1px solid #bbf7d0'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                          Customer Name
                        </Typography>
                        <Typography variant="h5" fontWeight={800} color="primary.main">
                          {selectedInvoiceForPay.customerName || 'Walk-in Customer'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedInvoiceForPay.customerPhone || 'N/A'}{selectedInvoiceForPay.cityAddress ? ` • ${selectedInvoiceForPay.cityAddress}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                          Current Due Balance
                        </Typography>
                        <Typography variant="h4" fontWeight={900} sx={{ color: dueBal > 0 ? '#ef4444' : '#10b981', mt: 0.25 }}>
                          Rs. {dueBal.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: '#bbf7d0' }} />

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Total Invoice Amount:</Typography>
                        <Typography variant="body2" fontWeight={800} color="#005F56">
                          Rs. {totalBill.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">Previously Paid:</Typography>
                        <Typography variant="body2" fontWeight={800} color="text.primary">
                          Rs. {alreadyPaid.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Payment Inputs */}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Amount Received (Rs) *"
                        type="number"
                        fullWidth
                        required
                        autoFocus
                        placeholder="Enter amount..."
                        inputProps={{ min: 0 }}
                        value={paymentForm.amountPaid}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="New Remaining Due (Rs)"
                        type="text"
                        fullWidth
                        disabled
                        value={`Rs. ${remAfter.toLocaleString()}`}
                        sx={{
                          bgcolor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
                          borderRadius: 1
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    select
                    label="Payment Method *"
                    fullWidth
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer / Online</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Easypaisa / JazzCash">Easypaisa / JazzCash</MenuItem>
                  </TextField>

                  <TextField
                    label="Reference / Cheque No"
                    placeholder="e.g. TXN-908123"
                    fullWidth
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                  />

                  <TextField
                    label="Notes / Remarks"
                    placeholder="Optional payment notes..."
                    fullWidth
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </Box>
              );
            })()}
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: isDark ? 'background.paper' : '#f8fafc', borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setPaymentModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<DollarOutlined />}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800, px: 3 }}
            >
              Confirm &amp; Save Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ── DELETE CONFIRMATION DIALOG ──────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Machine Invoice
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete machine invoice <strong>{selectedInvoice ? formatInvoiceNo(selectedInvoice) : ''}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This action cannot be undone and will remove this sale from records and ledger.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" sx={{ fontWeight: 700 }}>
            Yes, Delete Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR FEEDBACK ────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
