import { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
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
  Paper
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
  UserOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';

// Project imports
import MainCard from 'components/MainCard';
import CeoSignature from 'components/CeoSignature';
import { useStoreInventory } from 'context/StoreInventoryContext';

// Helper for currency formatting
const formatRs = (num) => {
  const val = parseFloat(num) || 0;
  return `Rs. ${val.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
};

export default function ShopInvoicesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { shopSales = [], items = [], addShopSale, updateShopSale, deleteShopSale, issueStock } = useStoreInventory();

  // ── Search & Filter State ────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all'); // all, today, week, month
  const [filterPayment, setFilterPayment] = useState('all'); // all, Cash, Bank Transfer, Credit

  // ── Pagination State ─────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ── Notification State ───────────────────────────────────────────────────
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // ── Modal States ─────────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Selected invoices for actions
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // ── Create Invoice Form State ────────────────────────────────────────────
  const [formCustomerName, setFormCustomerName] = useState('Walk-in Customer');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Cash');
  const [formNotes, setFormNotes] = useState('');
  const [formItems, setFormItems] = useState([]); // [{ id, name, category, qty, unitPrice, lineTotal }]
  const [formDiscount, setFormDiscount] = useState('');
  const [formDiscountType, setFormDiscountType] = useState('flat'); // 'flat' (Rs.) or 'percent' (%)
  const [formTax, setFormTax] = useState('');

  // Item selector in Create Modal
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState(1);
  const [selectedItemPrice, setSelectedItemPrice] = useState('');

  // Reset Create Form
  const resetCreateForm = () => {
    setFormCustomerName('Walk-in Customer');
    setFormCustomerPhone('');
    setFormPaymentMethod('Cash');
    setFormNotes('');
    setFormItems([]);
    setFormDiscount('');
    setFormDiscountType('flat');
    setFormTax('');
    setSelectedItemId('');
    setSelectedItemQty(1);
    setSelectedItemPrice('');
  };

  // Pre-fill Edit Modal
  const handleOpenEdit = (inv) => {
    const rawItems = inv.items || inv.cart || [];
    const normalizedItems = rawItems.map((it) => ({
      id: it.id || it.itemId || `ITM-${Math.random()}`,
      name: it.name || it.itemName || 'Shop Item',
      category: it.category || 'General',
      qty: parseInt(it.qty, 10) || 1,
      unitPrice: parseFloat(it.unitPrice) || 0,
      lineTotal: (parseInt(it.qty, 10) || 1) * (parseFloat(it.unitPrice) || 0)
    }));

    setEditingInvoice({
      ...inv,
      customerName: inv.customerName || inv.customer || inv.buyerName || 'Walk-in Customer',
      customerPhone: inv.customerPhone || inv.phone || '',
      paymentMethod: inv.paymentMethod || 'Cash',
      notes: inv.notes || inv.department || '',
      items: normalizedItems,
      discount: inv.discount !== undefined ? inv.discount : 0,
      discountType: inv.discountType || 'flat',
      discountValue: inv.discountValue !== undefined ? inv.discountValue : inv.discount || '',
      tax: inv.tax !== undefined ? inv.tax : '',
      subTotal: inv.subTotal || 0,
      totalAmount: inv.totalAmount || inv.grandTotal || 0
    });
    setEditModalOpen(true);
  };

  // ── Calculation Helpers for Create Form ─────────────────────────────────
  const formSubTotal = useMemo(() => {
    return formItems.reduce((acc, it) => acc + (parseFloat(it.lineTotal) || 0), 0);
  }, [formItems]);

  const formComputedDiscount = useMemo(() => {
    const val = parseFloat(formDiscount) || 0;
    if (formDiscountType === 'percent') {
      return (formSubTotal * Math.min(100, Math.max(0, val))) / 100;
    }
    return Math.min(formSubTotal, Math.max(0, val));
  }, [formSubTotal, formDiscount, formDiscountType]);

  const formComputedTax = useMemo(() => {
    const val = parseFloat(formTax) || 0;
    return (formSubTotal * Math.max(0, val)) / 100;
  }, [formSubTotal, formTax]);

  const formGrandTotal = useMemo(() => {
    return Math.max(0, formSubTotal - formComputedDiscount + formComputedTax);
  }, [formSubTotal, formComputedDiscount, formComputedTax]);

  // Handle Add Item to Create Form
  const handleAddItemToCreate = () => {
    if (!selectedItemId) return;
    const foundItem = items.find((i) => String(i.id) === String(selectedItemId));
    if (!foundItem) return;

    const qty = parseInt(selectedItemQty, 10) || 1;
    const price = selectedItemPrice !== '' ? parseFloat(selectedItemPrice) : parseFloat(foundItem.unitPrice) || 0;

    const existingIndex = formItems.findIndex((it) => String(it.id) === String(foundItem.id));
    if (existingIndex >= 0) {
      const updated = [...formItems];
      const newQty = updated[existingIndex].qty + qty;
      updated[existingIndex] = {
        ...updated[existingIndex],
        qty: newQty,
        unitPrice: price,
        lineTotal: newQty * price
      };
      setFormItems(updated);
    } else {
      setFormItems((prev) => [
        ...prev,
        {
          id: foundItem.id,
          name: foundItem.name,
          category: foundItem.category || 'General',
          qty,
          unitPrice: price,
          lineTotal: qty * price
        }
      ]);
    }

    // Reset selector
    setSelectedItemId('');
    setSelectedItemQty(1);
    setSelectedItemPrice('');
  };

  const handleRemoveItemFromCreate = (itemId) => {
    setFormItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // ── Calculation Helpers for Edit Form ───────────────────────────────────
  const editSubTotal = useMemo(() => {
    if (!editingInvoice?.items) return 0;
    return editingInvoice.items.reduce((acc, it) => acc + (parseFloat(it.lineTotal) || 0), 0);
  }, [editingInvoice?.items]);

  const editComputedDiscount = useMemo(() => {
    if (!editingInvoice) return 0;
    const val = parseFloat(editingInvoice.discountValue) || 0;
    if (editingInvoice.discountType === 'percent') {
      return (editSubTotal * Math.min(100, Math.max(0, val))) / 100;
    }
    return Math.min(editSubTotal, Math.max(0, val));
  }, [editSubTotal, editingInvoice?.discountValue, editingInvoice?.discountType]);

  const editComputedTax = useMemo(() => {
    if (!editingInvoice) return 0;
    const val = parseFloat(editingInvoice.tax) || 0;
    return (editSubTotal * Math.max(0, val)) / 100;
  }, [editSubTotal, editingInvoice?.tax]);

  const editGrandTotal = useMemo(() => {
    return Math.max(0, editSubTotal - editComputedDiscount + editComputedTax);
  }, [editSubTotal, editComputedDiscount, editComputedTax]);

  // Edit item quantity/price changers
  const handleEditItemQtyChange = (itemId, newQty) => {
    if (!editingInvoice) return;
    const qty = Math.max(1, parseInt(newQty, 10) || 1);
    const updated = editingInvoice.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          qty,
          lineTotal: qty * it.unitPrice
        };
      }
      return it;
    });
    setEditingInvoice((prev) => ({ ...prev, items: updated }));
  };

  const handleEditItemPriceChange = (itemId, newPrice) => {
    if (!editingInvoice) return;
    const price = Math.max(0, parseFloat(newPrice) || 0);
    const updated = editingInvoice.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          unitPrice: price,
          lineTotal: it.qty * price
        };
      }
      return it;
    });
    setEditingInvoice((prev) => ({ ...prev, items: updated }));
  };

  const handleRemoveItemFromEdit = (itemId) => {
    if (!editingInvoice) return;
    const updated = editingInvoice.items.filter((it) => it.id !== itemId);
    setEditingInvoice((prev) => ({ ...prev, items: updated }));
  };

  const handleAddItemToEdit = () => {
    if (!editingInvoice) return;
    const newItem = {
      id: `item-${Date.now()}`,
      name: 'Custom Product / Service',
      category: 'General',
      qty: 1,
      unitPrice: 0,
      lineTotal: 0
    };
    setEditingInvoice((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const handleEditItemNameChange = (itemId, newName) => {
    if (!editingInvoice) return;
    const updated = editingInvoice.items.map((it) => {
      if (it.id === itemId) {
        return { ...it, name: newName, itemName: newName };
      }
      return it;
    });
    setEditingInvoice((prev) => ({ ...prev, items: updated }));
  };

  // ── Save New Invoice ─────────────────────────────────────────────────────
  const handleSaveNewInvoice = async (andPrint = false) => {
    if (formItems.length === 0) {
      showToast('Please add at least one item to the invoice.', 'error');
      return;
    }

    const now = new Date();
    const invNumber = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
    const dateFormatted = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

    const newInvoicePayload = {
      id: invNumber,
      invoiceNo: invNumber,
      saleNo: invNumber,
      date: `${dateFormatted}, ${timeFormatted}`,
      time: `${dateFormatted}, ${timeFormatted}`,
      dateISO: now.toISOString(),
      customer: formCustomerName.trim() || 'Walk-in Customer',
      customerName: formCustomerName.trim() || 'Walk-in Customer',
      phone: formCustomerPhone.trim() || '',
      customerPhone: formCustomerPhone.trim() || '',
      issuedTo: formCustomerName.trim() || 'Walk-in Customer',
      department: formCustomerPhone.trim() || 'Retail Counter',
      paymentMethod: formPaymentMethod || 'Cash',
      notes: formNotes.trim() || '',
      items: formItems,
      subTotal: formSubTotal,
      discount: formComputedDiscount,
      discountType: formDiscountType,
      discountValue: formDiscount || 0,
      tax: formComputedTax,
      totalAmount: formGrandTotal
    };

    try {
      if (typeof addShopSale === 'function') {
        await addShopSale(newInvoicePayload);
      }

      // Deduct stock if issueStock is available
      if (typeof issueStock === 'function') {
        formItems.forEach((it) => {
          try {
            issueStock(
              it.id,
              it.qty,
              formCustomerName.trim() || 'Walk-in Customer',
              formCustomerPhone.trim() || 'Shop Counter',
              'Shop Keeper',
              `Invoice: ${invNumber}`,
              it.unitPrice,
              it.category || 'General'
            );
          } catch {}
        });
      }

      showToast(`Invoice ${invNumber} generated successfully!`);
      setCreateModalOpen(false);
      resetCreateForm();

      if (andPrint) {
        setSelectedInvoice(newInvoicePayload);
        setPrintModalOpen(true);
      }
    } catch (err) {
      console.error('Save invoice error:', err);
      showToast('Failed to save invoice. Please try again.', 'error');
    }
  };

  // ── Save Edited Invoice ──────────────────────────────────────────────────
  const handleSaveEditedInvoice = async () => {
    if (!editingInvoice) return;
    if (editingInvoice.items.length === 0) {
      showToast('Invoice must have at least one item.', 'error');
      return;
    }

    const updatedPayload = {
      ...editingInvoice,
      customer: editingInvoice.customerName.trim() || 'Walk-in Customer',
      customerName: editingInvoice.customerName.trim() || 'Walk-in Customer',
      phone: editingInvoice.customerPhone.trim() || '',
      customerPhone: editingInvoice.customerPhone.trim() || '',
      issuedTo: editingInvoice.customerName.trim() || 'Walk-in Customer',
      paymentMethod: editingInvoice.paymentMethod || 'Cash',
      notes: editingInvoice.notes?.trim() || '',
      items: editingInvoice.items,
      subTotal: editSubTotal,
      discount: editComputedDiscount,
      discountType: editingInvoice.discountType || 'flat',
      discountValue: editingInvoice.discountValue || 0,
      tax: editComputedTax,
      totalAmount: editGrandTotal,
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof updateShopSale === 'function') {
        await updateShopSale(editingInvoice.id, updatedPayload);
      }
      showToast(`Invoice ${editingInvoice.invoiceNo || editingInvoice.id} updated successfully!`);
      setEditModalOpen(false);
      setEditingInvoice(null);
    } catch (err) {
      console.error('Update invoice error:', err);
      showToast('Failed to update invoice.', 'error');
    }
  };

  // ── Delete Invoice ───────────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!selectedInvoice) return;
    try {
      if (typeof deleteShopSale === 'function') {
        await deleteShopSale(selectedInvoice.id);
      }
      showToast(`Invoice ${selectedInvoice.invoiceNo || selectedInvoice.id} deleted successfully!`);
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

    return (shopSales || []).filter((inv) => {
      // 1. Search term match
      if (term) {
        const invNo = (inv.invoiceNo || inv.saleNo || inv.id || '').toLowerCase();
        const cust = (inv.customerName || inv.customer || inv.issuedTo || '').toLowerCase();
        const phone = (inv.customerPhone || inv.phone || '').toLowerCase();
        const itemsStr = (inv.items || inv.cart || [])
          .map((i) => i.name || i.itemName || '')
          .join(' ')
          .toLowerCase();

        const matches = invNo.includes(term) || cust.includes(term) || phone.includes(term) || itemsStr.includes(term);

        if (!matches) return false;
      }

      // 2. Filter by Period
      if (filterPeriod !== 'all') {
        const invTime = inv.dateISO ? new Date(inv.dateISO).getTime() : 0;
        if (filterPeriod === 'today' && invTime < startOfToday) return false;
        if (filterPeriod === 'week' && invTime < sevenDaysAgo) return false;
        if (filterPeriod === 'month' && invTime < startOfMonth) return false;
      }

      // 3. Filter by Payment Method
      if (filterPayment !== 'all') {
        const pMethod = (inv.paymentMethod || 'Cash').toLowerCase();
        if (pMethod !== filterPayment.toLowerCase()) return false;
      }

      return true;
    });
  }, [shopSales, searchTerm, filterPeriod, filterPayment]);

  // Paginated Slices
  const paginatedInvoices = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredInvoices.slice(start, start + rowsPerPage);
  }, [filteredInvoices, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: -0.5, color: 'text.primary' }}>
          Shop Invoices & Billing
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          View retail store invoices, manage billing history, edit orders, and print customer receipts.
        </Typography>
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
                placeholder="Search by invoice #, customer name, phone, or items..."
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

            {/* Filter by Payment Method */}
            <Grid size={{ xs: 6, md: 2.5 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={filterPayment}
                  label="Payment Method"
                  onChange={(e) => {
                    setFilterPayment(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Methods</MenuItem>
                  <MenuItem value="Cash">Cash Only</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Credit">Credit / Due</MenuItem>
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
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>DATE & TIME</TableCell>
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
                        No shop invoices found
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Complete a sale from Shop Mart to generate invoices here.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((inv) => {
                  const invNumber = inv.invoiceNo || inv.saleNo || inv.id;
                  const custName = inv.customerName || inv.customer || inv.issuedTo || 'Walk-in Customer';
                  const custPhone = inv.customerPhone || inv.phone || '';
                  const rawItems = inv.items || inv.cart || [];
                  const totalAmt = parseFloat(inv.totalAmount || inv.grandTotal || inv.subTotal) || 0;
                  const subTotal = parseFloat(inv.subTotal) || totalAmt;
                  const pMethod = inv.paymentMethod || 'Cash';

                  return (
                    <TableRow key={inv.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      {/* Invoice # */}
                      <TableCell>
                        <Chip
                          label={invNumber}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: isDark ? 'rgba(0, 95, 86, 0.2)' : '#e6f7f4',
                            color: '#005F56',
                            border: '1px solid rgba(0, 95, 86, 0.3)'
                          }}
                        />
                      </TableCell>

                      {/* Date & Time */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {inv.date || 'N/A'}
                        </Typography>
                      </TableCell>

                      {/* Customer Details */}
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {custName}
                        </Typography>
                        {custPhone && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            <PhoneOutlined style={{ fontSize: 11, marginRight: 4 }} />
                            {custPhone}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Items Summary */}
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">
                          {rawItems.length} {rawItems.length === 1 ? 'Item' : 'Items'}
                        </Typography>
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{
                            display: 'block',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'text.primary'
                          }}
                        >
                          {rawItems.map((i) => `${i.name || i.itemName} (x${i.qty})`).join(', ') || 'No item details'}
                        </Typography>
                      </TableCell>

                      {/* Payment Method */}
                      <TableCell>
                        <Chip
                          label={pMethod}
                          size="small"
                          color={pMethod === 'Cash' ? 'success' : pMethod === 'Credit' ? 'warning' : 'primary'}
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
                      </TableCell>

                      {/* Action Buttons */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
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
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination */}
        <TablePagination
          component="div"
          count={filteredInvoices.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      </MainCard>

      {/* ── CREATE INVOICE MODAL ─────────────────────────────────────────── */}
      <Dialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ px: 3, py: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Create New Shop Invoice
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Select products from shop stock, specify customer details, and record sale.
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setCreateModalOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          {/* Customer & Payment Info */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Customer Name *"
                value={formCustomerName}
                onChange={(e) => setFormCustomerName(e.target.value)}
                placeholder="Walk-in Customer / Ali Khan"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Customer Phone"
                value={formCustomerPhone}
                onChange={(e) => setFormCustomerPhone(e.target.value)}
                placeholder="0300-1234567"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Method</InputLabel>
                <Select value={formPaymentMethod} label="Payment Method" onChange={(e) => setFormPaymentMethod(e.target.value)}>
                  <MenuItem value="Cash">Cash Counter</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer / Online</MenuItem>
                  <MenuItem value="Credit">Credit / Khata Due</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Invoice Notes / Remarks"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any special warranty, delivery remarks, or customer notes..."
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }}>
            <Chip label="ADD ITEMS TO INVOICE" size="small" sx={{ fontWeight: 700 }} />
          </Divider>

          {/* Add Item Row */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: isDark ? 'background.default' : '#f8fafc', borderRadius: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Select Item from Shop Stock</InputLabel>
                  <Select
                    value={selectedItemId}
                    label="Select Item from Shop Stock"
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedItemId(id);
                      const itm = items.find((i) => String(i.id) === String(id));
                      if (itm) {
                        setSelectedItemPrice(itm.unitPrice || 0);
                      }
                    }}
                  >
                    {items.map((itm) => (
                      <MenuItem key={itm.id} value={itm.id}>
                        {itm.name} ({itm.category || 'General'}) — In Stock: {itm.totalStock || itm.remainingStock || 0}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 6, sm: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Qty"
                  value={selectedItemQty}
                  onChange={(e) => setSelectedItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  inputProps={{ min: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Unit Price (Rs.)"
                  value={selectedItemPrice}
                  onChange={(e) => setSelectedItemPrice(e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddItemToCreate}
                  disabled={!selectedItemId}
                  startIcon={<PlusOutlined />}
                  sx={{ fontWeight: 700, borderRadius: 1.5, bgcolor: '#005F56', '&:hover': { bgcolor: '#004740' } }}
                >
                  Add Item
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Items Draft Table */}
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, borderRadius: 1.5 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: isDark ? 'background.default' : '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ITEM NAME</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    QTY
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    UNIT PRICE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    LINE TOTAL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">
                    ACTION
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No items added to invoice draft yet. Use the selector above to add items.
                    </TableCell>
                  </TableRow>
                ) : (
                  formItems.map((it, idx) => (
                    <TableRow key={it.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {it.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {it.category}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={it.qty} size="small" sx={{ fontWeight: 700 }} />
                      </TableCell>
                      <TableCell align="right">{formatRs(it.unitPrice)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#005F56' }}>
                        {formatRs(it.lineTotal)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleRemoveItemFromCreate(it.id)}>
                          <DeleteOutlined style={{ fontSize: 13 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Discount & Tax Row */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={`Discount (${formDiscountType === 'percent' ? '%' : 'Rs.'})`}
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(e.target.value)}
                  placeholder="0"
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setFormDiscountType((prev) => (prev === 'flat' ? 'percent' : 'flat'))}
                  sx={{ minWidth: 46, fontWeight: 700 }}
                >
                  {formDiscountType === 'flat' ? 'Rs' : '%'}
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Tax / GST Rate (%)"
                value={formTax}
                onChange={(e) => setFormTax(e.target.value)}
                placeholder="0"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor: isDark ? 'background.default' : '#f8fafc',
                  border: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'right'
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Subtotal: {formatRs(formSubTotal)} | Discount: -{formatRs(formComputedDiscount)}
                </Typography>
                <Typography variant="h4" fontWeight={900} color="#005F56" sx={{ mt: 0.5 }}>
                  Net Total: {formatRs(formGrandTotal)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PrinterOutlined />}
            onClick={() => handleSaveNewInvoice(true)}
            disabled={formItems.length === 0}
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
          >
            Save & Print
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CheckCircleOutlined />}
            onClick={() => handleSaveNewInvoice(false)}
            disabled={formItems.length === 0}
            sx={{
              fontWeight: 800,
              borderRadius: 1.5,
              px: 3,
              bgcolor: '#005F56',
              '&:hover': { bgcolor: '#004740' }
            }}
          >
            Save Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── EDIT INVOICE DRAWER (Right Side Drawer like Stock Out) ──────────── */}
      <Drawer
        anchor="right"
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 600, md: 740, lg: 820 },
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2.2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? 'background.paper' : '#ffffff',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Stack direction="row" spacing={1.75} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(0, 95, 86, 0.25)' : '#ecfdf5',
                  color: '#005F56',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}
              >
                <EditOutlined />
              </Box>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                    Edit Shop Invoice
                  </Typography>
                  <Chip
                    label={`#${editingInvoice?.invoiceNo || editingInvoice?.id || ''}`}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#e6f4ea',
                      color: '#005F56',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'
                    }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3, fontSize: '0.84rem' }}>
                  Update customer information, line items, quantities, or pricing adjustments.
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={() => setEditModalOpen(false)}
              sx={{
                color: 'text.secondary',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0', color: 'text.primary' }
              }}
            >
              <CloseOutlined style={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 3, pt: 3, pb: 4, flex: 1, overflowY: 'auto', bgcolor: isDark ? 'background.default' : '#ffffff' }}>
          {editingInvoice && (
            <Stack spacing={3}>
              {/* Customer & Billing Info Card */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                  border: '1px solid',
                  borderColor: isDark ? 'divider' : '#e2e8f0'
                }}
              >
                <Typography
                  variant="subtitle2"
                  fontWeight={800}
                  sx={{ color: 'text.primary', mb: 1.75, display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <UserOutlined style={{ color: '#005F56' }} /> Customer & Payment Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                      CUSTOMER NAME
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. Walk-in Customer"
                      value={editingInvoice.customerName || ''}
                      onChange={(e) => setEditingInvoice((prev) => ({ ...prev, customerName: e.target.value }))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <UserOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                      PHONE NUMBER
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Optional contact"
                      value={editingInvoice.customerPhone || ''}
                      onChange={(e) => setEditingInvoice((prev) => ({ ...prev, customerPhone: e.target.value }))}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneOutlined style={{ color: '#94a3b8', fontSize: 14 }} />
                          </InputAdornment>
                        )
                      }}
                      sx={{
                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                      PAYMENT METHOD
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={editingInvoice.paymentMethod || 'Cash'}
                      onChange={(e) => setEditingInvoice((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                      sx={{
                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                        borderRadius: 1.5
                      }}
                    >
                      <MenuItem value="Cash">Cash Counter</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Credit">Credit / Due</MenuItem>
                    </Select>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                      NOTES / REMARKS
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Remarks..."
                      value={editingInvoice.notes || ''}
                      onChange={(e) => setEditingInvoice((prev) => ({ ...prev, notes: e.target.value }))}
                      sx={{
                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Items Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1.5 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <FileTextOutlined style={{ color: '#005F56' }} /> Invoice Items ({editingInvoice.items?.length || 0})
                  </Typography>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PlusOutlined />}
                    onClick={handleAddItemToEdit}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: 1.5,
                      borderColor: isDark ? 'divider' : '#cbd5e1',
                      color: isDark ? 'text.primary' : '#334155',
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                      '&:hover': {
                        borderColor: '#005F56',
                        color: '#005F56',
                        bgcolor: isDark ? 'rgba(0, 95, 86, 0.1)' : '#f0fdf4'
                      }
                    }}
                  >
                    Add Line Item
                  </Button>
                </Box>

                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: isDark ? 'divider' : '#e2e8f0',
                    overflow: 'hidden'
                  }}
                >
                  <Table size="small">
                    <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}>
                          ITEM DESCRIPTION
                        </TableCell>
                        <TableCell
                          align="center"
                          width={110}
                          sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                        >
                          QTY
                        </TableCell>
                        <TableCell
                          align="center"
                          width={170}
                          sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                        >
                          UNIT PRICE
                        </TableCell>
                        <TableCell
                          align="right"
                          width={150}
                          sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                        >
                          LINE TOTAL
                        </TableCell>
                        <TableCell
                          align="center"
                          width={60}
                          sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                        >
                          DEL
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {editingInvoice.items?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                              No items currently in this invoice.
                            </Typography>
                            <Button
                              size="small"
                              variant="text"
                              startIcon={<PlusOutlined />}
                              onClick={handleAddItemToEdit}
                              sx={{ fontWeight: 700, color: '#005F56' }}
                            >
                              Add an item
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : (
                        editingInvoice.items?.map((it, idx) => (
                          <TableRow
                            key={it.id || idx}
                            sx={{
                              '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fafafa' },
                              '&:last-child td, &:last-child th': { border: 0 }
                            }}
                          >
                            <TableCell sx={{ py: 1.5 }}>
                              <TextField
                                fullWidth
                                size="small"
                                value={it.name || it.itemName || ''}
                                onChange={(e) => handleEditItemNameChange(it.id, e.target.value)}
                                placeholder="Item name / specification"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 1.5,
                                    fontSize: '0.88rem',
                                    fontWeight: 700,
                                    bgcolor: isDark ? 'background.paper' : '#ffffff'
                                  }
                                }}
                              />
                              <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5, px: 0.5 }}>
                                Category: {it.category || 'Shop Inventory'}
                              </Typography>
                            </TableCell>

                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <TextField
                                size="small"
                                type="number"
                                value={it.qty}
                                onChange={(e) => handleEditItemQtyChange(it.id, e.target.value)}
                                inputProps={{
                                  min: 1,
                                  style: { textAlign: 'center', padding: '6px 4px', fontSize: '0.9rem', fontWeight: 700 }
                                }}
                                sx={{
                                  width: 80,
                                  bgcolor: isDark ? 'background.paper' : '#ffffff',
                                  '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                                }}
                              />
                            </TableCell>

                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <TextField
                                size="small"
                                type="number"
                                value={it.unitPrice}
                                onChange={(e) => handleEditItemPriceChange(it.id, e.target.value)}
                                inputProps={{ min: 0, style: { textAlign: 'center', padding: '6px 4px', fontSize: '0.9rem', fontWeight: 600 } }}
                                sx={{
                                  width: 110,
                                  bgcolor: isDark ? 'background.paper' : '#ffffff',
                                  '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                                }}
                              />
                            </TableCell>

                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#005F56', fontSize: '0.95rem' }}>
                                {formatRs(it.lineTotal)}
                              </Typography>
                            </TableCell>

                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Tooltip title="Remove item">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRemoveItemFromEdit(it.id)}
                                  sx={{
                                    color: '#ef4444',
                                    bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                                    border: '1px solid',
                                    borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
                                    '&:hover': { bgcolor: '#fee2e2', color: '#dc2626' }
                                  }}
                                >
                                  <DeleteOutlined style={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Discount, Tax & Financial Summary */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  gap: 2.5,
                  width: '100%'
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      height: '100%',
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                      border: '1px solid',
                      borderColor: isDark ? 'divider' : '#e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      sx={{ color: '#64748b', mb: 1.5, display: 'block', letterSpacing: '0.04em' }}
                    >
                      DISCOUNT & TAX ADJUSTMENTS
                    </Typography>

                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Discount"
                        value={editingInvoice.discountValue || ''}
                        onChange={(e) =>
                          setEditingInvoice((prev) => ({
                            ...prev,
                            discountValue: e.target.value,
                            discountType: 'flat'
                          }))
                        }
                        placeholder="0"
                        sx={{
                          bgcolor: isDark ? 'background.paper' : '#ffffff',
                          '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                        }}
                      />

                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        label="Tax / VAT Rate (%)"
                        value={editingInvoice.tax || ''}
                        onChange={(e) => setEditingInvoice((prev) => ({ ...prev, tax: e.target.value }))}
                        placeholder="0"
                        sx={{
                          bgcolor: isDark ? 'background.paper' : '#ffffff',
                          '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                        }}
                      />
                    </Stack>
                  </Box>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      p: 2.5,
                      height: '100%',
                      borderRadius: 2.5,
                      bgcolor: isDark ? 'rgba(0, 95, 86, 0.08)' : '#f0fdf4',
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(0, 95, 86, 0.3)' : '#bbf7d0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>
                          Subtotal Amount:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#111827', fontWeight: 700 }}>
                          {formatRs(editSubTotal)}
                        </Typography>
                      </Box>

                      {editComputedDiscount > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                            Discount Applied:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 700 }}>
                            - {formatRs(editComputedDiscount)}
                          </Typography>
                        </Box>
                      )}

                      {editComputedTax > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>
                            Tax Applied ({editingInvoice.tax}%):
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#111827', fontWeight: 700 }}>
                            + {formatRs(editComputedTax)}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    <Box sx={{ pt: 1.5, mt: 1.5, borderTop: '1px solid', borderColor: isDark ? 'rgba(0, 95, 86, 0.25)' : '#bbf7d0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            sx={{ color: '#047857', letterSpacing: '0.04em', display: 'block' }}
                          >
                            NET GRAND TOTAL
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            Payment: {editingInvoice.paymentMethod || 'Cash Counter'}
                          </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight={900} sx={{ color: '#005F56', letterSpacing: '-0.02em', fontSize: '1.5rem' }}>
                          {formatRs(editGrandTotal)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Stack>
          )}
        </Box>

        {/* Fixed Bottom Actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isDark ? 'background.paper' : '#f8fafc',
            position: 'sticky',
            bottom: 0,
            zIndex: 10
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Pressing Save will recalculate stock & ledger balances automatically.
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={() => setEditModalOpen(false)}
              variant="outlined"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                borderColor: isDark ? 'divider' : '#cbd5e1',
                px: 2.5,
                py: 0.8,
                borderRadius: 1.5,
                textTransform: 'none',
                fontSize: '0.9rem',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckCircleOutlined />}
              onClick={handleSaveEditedInvoice}
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                px: 3.5,
                py: 0.9,
                bgcolor: '#003830',
                color: '#ffffff',
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: '0 4px 6px -1px rgba(0, 56, 48, 0.25)',
                '&:hover': { bgcolor: '#002620', boxShadow: '0 6px 10px -1px rgba(0, 56, 48, 0.35)' }
              }}
            >
              Save Changes
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* ── DELETE INVOICE CONFIRMATION MODAL ────────────────────────────── */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Invoice Deletion</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1">
            Are you sure you want to permanently delete Invoice <strong>#{selectedInvoice?.invoiceNo || selectedInvoice?.id}</strong>?
          </Typography>
          <Box sx={{ mt: 2, p: 1.5, bgcolor: isDark ? 'background.default' : '#fef2f2', borderRadius: 1.5 }}>
            <Typography variant="caption" color="error" display="block" fontWeight={700}>
              Customer: {selectedInvoice?.customerName || selectedInvoice?.customer || 'Walk-in'}
            </Typography>
            <Typography variant="caption" color="error" display="block" fontWeight={700}>
              Total Amount: {formatRs(selectedInvoice?.totalAmount || selectedInvoice?.subTotal || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
              This record will be removed from your cloud records and retail ledger.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} sx={{ fontWeight: 800, borderRadius: 1.5, px: 2.5 }}>
            Yes, Delete Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── PRINT INVOICE RECEIPT MODAL ──────────────────────────────────── */}
      <Dialog
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        {/* Print Styling Rules */}
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
              #root {
                display: none !important;
              }
              body {
                visibility: hidden !important;
                background: #fff !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .MuiDialog-root {
                visibility: visible !important;
                position: static !important;
              }
              .MuiBackdrop-root,
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
              .MuiDialog-container {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .MuiDialog-paper {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                overflow: visible !important;
              }
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                border: none !important;
                box-shadow: none !important;
              }
              #printable-shop-invoice, #printable-shop-invoice * {
                visibility: visible !important;
              }
              #printable-shop-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 50px 4px 6px 4px !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
            }
          `}
        </style>

        <DialogTitle
          className="no-print"
          sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
        >
          <Typography variant="h5" fontWeight={700}>
            Shop Customer Invoice & Statement
          </Typography>
          <Chip label="Shop Sales Receipt" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {selectedInvoice &&
            (() => {
              const rawItems = selectedInvoice.items || selectedInvoice.cart || [];
              const displayItems =
                rawItems.length > 0
                  ? rawItems
                  : [
                      {
                        id: selectedInvoice.id,
                        name: 'Shop Item',
                        qty: 1,
                        unitPrice: selectedInvoice.totalAmount || 0,
                        lineTotal: selectedInvoice.totalAmount || 0
                      }
                    ];

              const grandTotalSum = parseFloat(selectedInvoice.totalAmount || selectedInvoice.grandTotal || selectedInvoice.subTotal) || 0;
              const pMethod = selectedInvoice.paymentMethod || 'Cash';
              const isCredit = String(pMethod).toLowerCase().includes('credit');
              const discountVal = parseFloat(selectedInvoice.discount) || 0;

              return (
                <Box
                  id="printable-shop-invoice"
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    pt: { xs: 5, sm: 7 },
                    px: { xs: 1, sm: 1.5 },
                    pb: { xs: 1, sm: 1.5 },
                    bgcolor: '#ffffff',
                    color: '#111827',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Structured Professional Customer & Invoice Metadata Card */}
                    <div
                      style={{
                        border: '1.5px solid #111827',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.45)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                        {/* Left Column: Customer Details */}
                        <div style={{ flex: '1.2', padding: '6px 10px', borderRight: '1px solid #e5e7eb' }}>
                          <div
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '2px'
                            }}
                          >
                            CUSTOMER / BUYER DETAILS
                          </div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                            {selectedInvoice.customerName || selectedInvoice.customer || selectedInvoice.issuedTo || 'Walk-in Customer'}
                          </div>
                          <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                            <div>
                              <strong>Sale Entry Type:</strong> Shop Sales Receipt
                            </div>
                            {(selectedInvoice.customerPhone || selectedInvoice.phone) && (
                              <div>
                                <strong>Contact / Phone:</strong> {selectedInvoice.customerPhone || selectedInvoice.phone}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Invoice Meta */}
                        <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '4px',
                              fontSize: '0.80rem'
                            }}
                          >
                            <span style={{ color: '#6b7280', fontWeight: 700 }}>PO / Voucher No:</span>
                            <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>
                              {selectedInvoice.invoiceNo || selectedInvoice.saleNo || selectedInvoice.id}
                            </span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: '4px',
                              fontSize: '0.80rem'
                            }}
                          >
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                            <span style={{ fontWeight: 700, color: '#374151' }}>
                              {selectedInvoice.date || selectedInvoice.time || 'N/A'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Status:</span>
                            <span style={{ fontWeight: 800, color: '#16a34a' }}>Completed</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1.5px solid #111827',
                        marginBottom: '10px',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                          <th
                            style={{
                              width: '8%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 4px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Sr</strong>
                          </th>
                          <th
                            style={{
                              width: '62%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Specification / Item Name</strong>
                          </th>
                          <th
                            style={{
                              width: '14%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 4px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>QTY</strong>
                          </th>
                          <th style={{ width: '16%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                            <strong>Total Amount</strong>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayItems.map((item, idx) => {
                          const itemPrice = parseFloat(item.unitPrice) || 0;
                          const itemQty = parseInt(item.qty || item.qtyUsed, 10) || 1;
                          const itemTotal = parseFloat(item.lineTotal) || itemQty * itemPrice;

                          return (
                            <tr key={item.id || idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 4px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.82rem'
                                }}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 8px',
                                  textAlign: 'left',
                                  fontWeight: 600,
                                  fontSize: '0.82rem',
                                  lineHeight: 1.25
                                }}
                              >
                                {(item.name || item.itemName || '').replace(/\s*\([a-f0-9-]{10,}\)/gi, '').replace(/\s*\(SKU-[^)]+\)/gi, '').trim()}
                              </td>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 4px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.82rem'
                                }}
                              >
                                {String(itemQty).padStart(2, '0')}
                              </td>
                              <td
                                style={{
                                  padding: '3px 8px',
                                  textAlign: 'right',
                                  fontWeight: 800,
                                  fontSize: '0.82rem'
                                }}
                              >
                                {itemTotal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Total Amount Bottom Row */}
                        <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                          <td
                            colSpan={2}
                            style={{
                              borderRight: '1.5px solid #111827',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem'
                            }}
                          >
                            Total amount
                          </td>
                          <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                          <td
                            style={{
                              padding: '4px 8px',
                              textAlign: 'right',
                              fontWeight: 900,
                              fontSize: '0.92rem',
                              color: '#111827'
                            }}
                          >
                            {grandTotalSum.toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Financial Summary Box */}
                    <Box
                      sx={{
                        bgcolor: 'transparent',
                        py: 0.8,
                        px: 1.2,
                        borderRadius: 1,
                        border: '1px solid #86efac',
                        mb: 1.2
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          width: '100%',
                          flexWrap: 'wrap',
                          gap: '8px'
                        }}
                      >
                        <div>
                          <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                            TOTAL ITEMS: {displayItems.length}
                          </Typography>
                          {isCredit ? (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mt: 0.3 }}>
                              Payment: Credit Sale (Unpaid)
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', display: 'block', mt: 0.3 }}>
                              Payment: Paid via {pMethod}
                            </Typography>
                          )}
                          {discountVal > 0 && (
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mt: 0.2 }}>
                              Discount Applied: -Rs. {discountVal.toLocaleString()}
                            </Typography>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Typography variant="subtitle1" fontWeight={800} color="success.dark" sx={{ lineHeight: 1.2 }}>
                            NET TOTAL: Rs. {grandTotalSum.toLocaleString()}
                          </Typography>
                          {selectedInvoice.notes && (
                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.3, maxWidth: 260 }}>
                              Note: {selectedInvoice.notes}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </Box>

                    {/* Signatures Footer */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        width: '100%',
                        marginTop: '16px',
                        paddingTop: '8px'
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 170 }}
                        >
                          Customer Signature
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
          <Button variant="outlined" color="secondary" onClick={() => setPrintModalOpen(false)} size="large" className="no-print">
            Close & Continue
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            size="large"
            className="no-print"
            sx={{ px: 3, fontWeight: 700 }}
          >
            Print Customer Invoice ({selectedInvoice?.items?.length || selectedInvoice?.cart?.length || 1} Items)
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar Toast ──────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 700 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
