import { useState, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import CeoSignature from 'components/CeoSignature';

// material-ui
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
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
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, PrinterOutlined, CloseOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import { AppButton, PageHeader } from 'components/common';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import {
  buildCustomerLedgers,
  formatItemsSummaryLabel,
  getCustomerDirectorySuggestions,
  resolveAllocatedInvoiceMap,
  resolveSaleFinancials
} from 'utils/machineLedgerHelpers';

const DEFAULT_WARRANTY_TERMS = '1 Year Motor & Frame Free Service Warranty';

const createEmptySaleItem = () => ({
  machineName: '',
  serialNo: '',
  qty: 1,
  unitPrice: 0,
  discount: 0
});

const createInitialFormState = () => ({
  customerName: '',
  customerPhone: '',
  cityAddress: '',
  items: [createEmptySaleItem()],
  paidAmount: 0,
  warrantyTerms: DEFAULT_WARRANTY_TERMS
});

/** Formats sale ISO or legacy time text into consistent ledger timestamps. */
const formatFullDate = (timeStr, dateISO) => {
  if (dateISO) {
    const d = new Date(dateISO);
    if (!Number.isNaN(d.getTime())) {
      const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateFormatted}, ${timeFormatted}`;
    }
  }
  if (timeStr && timeStr.includes('Today,')) {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return timeStr.replace('Today,', `${todayStr},`);
  }
  return timeStr || '';
};

/** Normalizes invoice number into compact MS-XXXXX format. */
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

/** Computes per-line net total after percentage discount. */
const calcLineNetTotal = (item) => {
  const q = Math.max(1, parseInt(item?.qty, 10) || 1);
  const p = Math.max(0, parseFloat(item?.unitPrice) || 0);
  const discPercent = Math.min(100, Math.max(0, parseFloat(item?.discount) || 0));
  const gross = q * p;
  return Math.max(0, gross - (gross * discPercent) / 100);
};

const getPaymentChipColor = (status) => {
  if (status === 'Paid') return 'success';
  if (status === 'Partial') return 'warning';
  return 'error';
};

const sectionEyebrowSx = {
  display: 'block',
  mb: 1.5,
  fontSize: '0.75rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'primary.main'
};

const fieldLabelSx = {
  display: 'block',
  mb: 0.75,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'text.primary'
};

const tableHeadCellSx = getTableHeadCellSx();

const inlineActionBtnSx = {
  border: 0,
  background: 'none',
  px: 0.75,
  py: 0.35,
  borderRadius: 1,
  cursor: 'pointer',
  fontSize: '0.8125rem',
  fontWeight: 600,
  fontFamily: 'inherit',
  transition: 'background-color 0.15s ease'
};

export default function MachineSalesPage() {
  const theme = useTheme();
  const { canDelete, canEditPrice } = usePermission();
  const {
    machineSales = [],
    machineRepairs = [],
    machineModels = [],
    machineCustomers = [],
    customerPayments = [],
    addMachineModel,
    addMachineSale,
    updateMachineSale,
    deleteMachineSale,
    deleteMultipleMachineSales
  } = useStoreInventory();

  const customerSuggestions = getCustomerDirectorySuggestions({
    machineCustomers,
    machineSales,
    machineRepairs
  });

  const customerLedgers = buildCustomerLedgers({
    machineCustomers,
    machineSales,
    machineRepairs,
    customerPayments
  });

  const allocationMap = resolveAllocatedInvoiceMap({
    machineCustomers,
    machineSales,
    machineRepairs,
    customerPayments
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Add model dialog state
  const [newModelDialogOpen, setNewModelDialogOpen] = useState(false);
  const [newModelNameInput, setNewModelNameInput] = useState('');

  // Form state
  const [form, setForm] = useState(() => createInitialFormState());
  const [customerNameError, setCustomerNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchedCustomerLedger = customerLedgers.find(
    (c) => c.customerName.toLowerCase() === (form.customerName || '').trim().toLowerCase()
  );

  // Drawer & dialog states
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  const customerInputRef = useRef(null);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter]);

  const filteredSales = machineSales.filter((item) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (item.customerName || '').toLowerCase().includes(q) ||
      (item.customerPhone || '').toLowerCase().includes(q) ||
      (item.machineName || '').toLowerCase().includes(q) ||
      (item.serialNo || '').toLowerCase().includes(q) ||
      (item.saleNo || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q) ||
      (item.cityAddress || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'ALL' || item.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Invoice totals
  const subTotalVal = form.items.reduce((sum, item) => sum + calcLineNetTotal(item), 0);
  const paidVal = Math.max(0, parseFloat(form.paidAmount) || 0);
  const balanceVal = Math.max(0, subTotalVal - paidVal);

  const handleAddNewModelSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = newModelNameInput.trim();
    if (!trimmed) return;
    addMachineModel(trimmed);
    setNewModelNameInput('');
    setNewModelDialogOpen(false);
  };

  // Multi-item handlers
  const handleAddItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, createEmptySaleItem()]
    }));
  };

  const handleRemoveItemRow = (index) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemRowChange = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.items];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  // Checkbox selection
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(filteredSales.map((n) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectCustomerName = (selectedName) => {
    const trimmed = (selectedName || '').trim();
    const match = customerSuggestions.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (customerNameError) setCustomerNameError('');
    setForm((prev) => ({
      ...prev,
      customerName: selectedName || '',
      customerPhone: match?.phone && !prev.customerPhone ? match.phone : prev.customerPhone,
      cityAddress: match?.city && !prev.cityAddress ? match.city : prev.cityAddress
    }));
  };

  const handleClearForm = () => {
    setCustomerNameError('');
    setForm(createInitialFormState());
  };

  const submitSale = async (shouldPrint = false) => {
    if (isSubmitting) return;
    if (!form.customerName.trim()) {
      setCustomerNameError('Customer name is required');
      customerInputRef.current?.focus();
      return;
    }

    setCustomerNameError('');
    setIsSubmitting(true);

    try {
      const created = await addMachineSale({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        cityAddress: form.cityAddress.trim(),
        items: form.items,
        paidAmount: paidVal,
        warrantyTerms: form.warrantyTerms
      });

      if (shouldPrint) {
        setPrintData(created);
        setPrintModalOpen(true);
      }

      setForm(createInitialFormState());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateSale = (e) => {
    e.preventDefault();
    submitSale(false);
  };

  // Edit drawer handlers
  const handleOpenEdit = (sale) => {
    const itemsArray =
      sale.items && sale.items.length > 0
        ? sale.items
        : [
            {
              machineName: sale.machineName,
              serialNo: sale.serialNo,
              qty: sale.qty,
              unitPrice: sale.unitPrice,
              discount: sale.discount || 0
            }
          ];

    setEditingSale({ ...sale, items: itemsArray });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingSale) return;

    const sourceItems =
      editingSale.items && editingSale.items.length > 0
        ? editingSale.items
        : [
            {
              machineName: editingSale.machineName,
              serialNo: editingSale.serialNo,
              qty: editingSale.qty,
              unitPrice: editingSale.unitPrice,
              discount: editingSale.discount || 0
            }
          ];

    const itemsList = sourceItems.map((i) => {
      const q = Math.max(1, parseInt(i.qty, 10) || 1);
      const p = Math.max(0, parseFloat(i.unitPrice) || 0);
      const discPercent = Math.min(100, Math.max(0, parseFloat(i.discount) || 0));
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
    const paid = Math.max(0, parseFloat(editingSale.paidAmount) || 0);
    const bal = Math.max(0, total - paid);
    const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    const firstMachine = itemsList[0] || {};

    updateMachineSale(editingSale.id, {
      customerName: editingSale.customerName,
      customerPhone: editingSale.customerPhone,
      cityAddress: editingSale.cityAddress,
      items: itemsList,
      machineName: formatItemsSummaryLabel(itemsList, 'Machine'),
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

    setEditDrawerOpen(false);
  };

  const handleEditItemChange = (index, field, value) => {
    setEditingSale((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.items || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleAddEditItemRow = () => {
    setEditingSale((prev) => {
      if (!prev) return prev;
      return { ...prev, items: [...(prev.items || []), createEmptySaleItem()] };
    });
  };

  const handleRemoveEditItemRow = (index) => {
    setEditingSale((prev) => {
      if (!prev || (prev.items || []).length <= 1) return prev;
      return { ...prev, items: prev.items.filter((_, idx) => idx !== index) };
    });
  };

  const handleConfirmDelete = () => {
    if (saleToDelete) {
      deleteMachineSale(saleToDelete.id);
      setSelected((prev) => prev.filter((id) => id !== saleToDelete.id));
      setDeleteDialogOpen(false);
      setSaleToDelete(null);
    }
  };

  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleMachineSales(selected);
      setSelected([]);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleOpenPrint = (sale) => {
    setPrintData(sale);
    setPrintModalOpen(true);
  };

  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');

  const machineCountLabel = `${form.items.length} ${form.items.length === 1 ? 'machine' : 'machines'}`;
  const itemHeaderCountLabel = `${form.items.length} ${form.items.length === 1 ? 'ITEM' : 'ITEMS'}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <PageHeader
        title="Machine Sales"
        count={machineSales.length}
        countLabel="Invoices"
        subtitle="Create customer machine sale bills, record serial numbers, and manage payment settlements."
        sx={{ mb: 0 }}
      />

      {/* 1. NEW MACHINE SALE (INVOICE) CARD */}
      <MainCard content={false} sx={getCardSurfaceSx(theme)}>
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Typography variant="h5" fontWeight={700} color="text.primary">
            New Machine Sale (Invoice)
          </Typography>
          <AppButton intent="secondary" size="small" startIcon={<PlusOutlined />} onClick={() => setNewModelDialogOpen(true)}>
            Add new machine model
          </AppButton>
        </Box>

        <Box component="form" onSubmit={handleCreateSale} sx={{ p: { xs: 2, sm: 3 } }}>
          {/* 1. CUSTOMER DETAILS */}
          <Typography component="span" sx={sectionEyebrowSx}>
            1. Customer Details
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75, gap: 1 }}>
                <Typography component="label" htmlFor="sale-customer-name" sx={{ ...fieldLabelSx, mb: 0 }}>
                  Customer name{' '}
                  <Box component="span" sx={{ color: 'error.main' }}>
                    *
                  </Box>
                </Typography>
                {matchedCustomerLedger && matchedCustomerLedger.balanceVal > 0 && (
                  <Chip
                    label={`Balance Due: ${formatPKR(matchedCustomerLedger.balanceVal)}`}
                    size="small"
                    color="warning"
                    variant="light"
                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                  />
                )}
              </Box>
              <Autocomplete
                freeSolo
                size="small"
                options={customerSuggestions.map((c) => c.name)}
                value={form.customerName}
                onChange={(e, val) => handleSelectCustomerName(val || '')}
                onInputChange={(e, val) => handleSelectCustomerName(val || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    id="sale-customer-name"
                    inputRef={customerInputRef}
                    placeholder="Full name or pick registered party..."
                    error={Boolean(customerNameError)}
                    helperText={customerNameError}
                  />
                )}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="sale-customer-phone" sx={fieldLabelSx}>
                Phone no
              </Typography>
              <TextField
                id="sale-customer-phone"
                fullWidth
                size="small"
                placeholder="0300-1234567"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="sale-city-address" sx={fieldLabelSx}>
                City / Address
              </Typography>
              <TextField
                id="sale-city-address"
                fullWidth
                size="small"
                placeholder="City"
                value={form.cityAddress}
                onChange={(e) => setForm({ ...form, cityAddress: e.target.value })}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* 2. MACHINES PURCHASED */}
          <Typography component="span" sx={sectionEyebrowSx}>
            2. Machines Purchased ({itemHeaderCountLabel})
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2.25fr) minmax(270px, 1fr)' },
              gap: 3,
              alignItems: 'start'
            }}
          >
            {/* Left Side: Machine Rows + Warranty */}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 640 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '28px minmax(180px, 1.4fr) minmax(115px, 0.9fr) 64px 100px 76px 84px 28px',
                      gap: 1.25,
                      pb: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography sx={tableHeadCellSx}>SR</Typography>
                    <Typography sx={tableHeadCellSx}>
                      Machine Model{' '}
                      <Box component="span" sx={{ color: 'error.main' }}>
                        *
                      </Box>
                    </Typography>
                    <Typography sx={tableHeadCellSx}>Serial No</Typography>
                    <Typography sx={{ ...tableHeadCellSx, textAlign: 'center' }}>
                      QTY{' '}
                      <Box component="span" sx={{ color: 'error.main' }}>
                        *
                      </Box>
                    </Typography>
                    <Typography sx={{ ...tableHeadCellSx, textAlign: 'right' }}>
                      Rate (Rs.){' '}
                      <Box component="span" sx={{ color: 'error.main' }}>
                        *
                      </Box>
                    </Typography>
                    <Typography sx={{ ...tableHeadCellSx, textAlign: 'right' }}>Disc (%)</Typography>
                    <Typography sx={{ ...tableHeadCellSx, textAlign: 'right' }}>Total</Typography>
                    <Box />
                  </Box>

                  {form.items.map((rowItem, idx) => {
                    const rowLineTotal = calcLineNetTotal(rowItem);
                    return (
                      <Box
                        key={idx}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '28px minmax(180px, 1.4fr) minmax(115px, 0.9fr) 64px 100px 76px 84px 28px',
                          gap: 1.25,
                          alignItems: 'center',
                          py: 1.1,
                          borderBottom: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </Typography>

                        <Autocomplete
                          freeSolo
                          size="small"
                          options={machineModels}
                          value={rowItem.machineName}
                          onChange={(event, newValue) => handleItemRowChange(idx, 'machineName', newValue || '')}
                          onInputChange={(event, newInputValue) => handleItemRowChange(idx, 'machineName', newInputValue || '')}
                          renderInput={(params) => <TextField {...params} placeholder="Select model..." required />}
                        />

                        <TextField
                          size="small"
                          placeholder="RLM-2026-904"
                          value={rowItem.serialNo}
                          onChange={(e) => handleItemRowChange(idx, 'serialNo', e.target.value)}
                        />

                        <TextField
                          type="number"
                          size="small"
                          required
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          value={rowItem.qty}
                          onChange={(e) => handleItemRowChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                        />

                        <TextField
                          type="number"
                          size="small"
                          required
                          disabled={!canEditPrice}
                          inputProps={{ min: 0, style: { textAlign: 'right' } }}
                          value={rowItem.unitPrice}
                          onChange={(e) => handleItemRowChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />

                        <TextField
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: 100, style: { textAlign: 'right' } }}
                          placeholder="0"
                          value={rowItem.discount ?? 0}
                          onChange={(e) => handleItemRowChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                        />

                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="text.primary"
                          sx={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatPKR(rowLineTotal)}
                        </Typography>

                        {form.items.length > 1 ? (
                          <Tooltip title="Remove machine">
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItemRow(idx)}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                            >
                              <DeleteOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Box />
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              <Box sx={{ mt: 1.75 }}>
                <AppButton intent="secondary" size="small" startIcon={<PlusOutlined />} onClick={handleAddItemRow}>
                  Add another machine to bill
                </AppButton>
              </Box>

              <Box sx={{ mt: 2.25 }}>
                <Typography component="label" htmlFor="sale-warranty-terms" sx={fieldLabelSx}>
                  Warranty & terms note
                </Typography>
                <TextField
                  id="sale-warranty-terms"
                  fullWidth
                  multiline
                  minRows={2}
                  size="small"
                  placeholder={DEFAULT_WARRANTY_TERMS}
                  value={form.warrantyTerms}
                  onChange={(e) => setForm({ ...form, warrantyTerms: e.target.value })}
                />
              </Box>
            </Box>

            {/* Right Side: Summary Box */}
            <Box sx={getSubSurfaceSx(theme, { p: 2.25, borderRadius: 2 })}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Total invoice
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatPKR(subTotalVal)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography component="label" htmlFor="sale-paid-amount" sx={fieldLabelSx}>
                  Paid amount (Rs.)
                </Typography>
                <TextField
                  id="sale-paid-amount"
                  type="number"
                  size="small"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                />
              </Box>

              <Divider sx={{ mb: 1.75 }} />

              <Typography
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  mb: 0.25
                }}
              >
                Remaining Balance
              </Typography>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  fontVariantNumeric: 'tabular-nums',
                  color: balanceVal > 0 ? errorTone.main : successTone.main
                }}
              >
                {formatPKR(balanceVal)}
              </Typography>
            </Box>
          </Box>

          {/* Form Footer Actions */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              gap: 1.25,
              mt: 3,
              pt: 2.5,
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <AppButton intent="cancel" onClick={handleClearForm} disabled={isSubmitting}>
              Clear form
            </AppButton>
            <AppButton intent="secondary" startIcon={<PrinterOutlined />} onClick={() => submitSale(true)} disabled={isSubmitting}>
              Save & print bill
            </AppButton>
            <AppButton intent="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : `Generate bill (${machineCountLabel})`}
            </AppButton>
          </Box>
        </Box>
      </MainCard>

      {/* 2. MACHINE SALES & BILLING HISTORY */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
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
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Machine Sales & Billing History
            </Typography>

            {selected.length > 0 && canDelete && (
              <AppButton intent="danger-outlined" size="small" startIcon={<DeleteOutlined />} onClick={() => setBulkDeleteDialogOpen(true)}>
                Delete selected ({selected.length})
              </AppButton>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 2
            }}
          >
            <OutlinedInput
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer, phone, machine model, city..."
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
            />

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ width: { xs: '100%', sm: 210 } }}
            >
              <MenuItem value="ALL">All payment statuses</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Partial">Partial</MenuItem>
              <MenuItem value="Unpaid">Unpaid</MenuItem>
            </TextField>

            <Typography variant="body2" color="text.secondary" sx={{ ml: { md: 'auto' } }}>
              Showing <strong>{filteredSales.length}</strong> sales {filteredSales.length === 1 ? 'record' : 'records'}
            </Typography>
          </Box>
        </Box>

        {/* Mobile View Cards */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
          {filteredSales.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No Machine Sales records found.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sale) => {
                const isItemSel = selected.includes(sale.id);
                const fin = allocationMap.get(`Sale:${sale.id}`) || resolveSaleFinancials(sale, customerPayments);
                const statusLabel = fin.paymentStatus;
                return (
                  <Box
                    key={sale.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: isItemSel ? 'primary.main' : 'divider',
                      bgcolor: isItemSel ? primaryTone.bg : 'background.paper',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        {formatInvoiceNo(sale)}
                      </Typography>
                      <Chip
                        label={statusLabel}
                        color={getPaymentChipColor(statusLabel)}
                        variant="light"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                        {sale.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {sale.customerPhone ? `${sale.customerPhone} • ` : ''}
                        {sale.cityAddress || 'Lahore'}
                      </Typography>
                    </Box>

                    <Box sx={getSubSurfaceSx(theme, { p: 1.5, borderRadius: 1.5 })}>
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        {sale.machineName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Qty: {sale.qty || 1} {sale.serialNo ? `• S/N: ${sale.serialNo}` : ''}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Bill: <strong>{formatPKR(fin.billTotal)}</strong>
                        </Typography>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          sx={{ color: fin.balanceAmount > 0 ? errorTone.main : successTone.main }}
                        >
                          Bal: {formatPKR(fin.balanceAmount)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
                      <AppButton intent="secondary" size="small" startIcon={<PrinterOutlined />} onClick={() => handleOpenPrint(sale)}>
                        Print
                      </AppButton>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEdit(sale)}>
                        <EditOutlined />
                      </IconButton>
                      {canDelete && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSaleToDelete(sale);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteOutlined />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>

        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table sx={{ minWidth: 880 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: getSubSurfaceSx(theme).bgcolor,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  {canDelete && (
                    <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < filteredSales.length}
                        checked={filteredSales.length > 0 && selected.length === filteredSales.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                  )}
                  <TableCell sx={tableHeadCellSx}>Sale No</TableCell>
                  <TableCell sx={tableHeadCellSx}>Customer</TableCell>
                  <TableCell sx={tableHeadCellSx}>Machine & Qty</TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    Total Bill
                  </TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    Paid
                  </TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    Balance
                  </TableCell>
                  <TableCell align="center" sx={tableHeadCellSx}>
                    Status
                  </TableCell>
                  <TableCell sx={tableHeadCellSx}>Date & Time</TableCell>
                  <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                      <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        No Machine Sales records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((sale) => {
                    const isItemSel = selected.includes(sale.id);
                    const fin = allocationMap.get(`Sale:${sale.id}`) || resolveSaleFinancials(sale, customerPayments);
                    const statusLabel = fin.paymentStatus;
                    const balanceNum = fin.balanceAmount;

                    return (
                      <TableRow
                        key={sale.id}
                        hover
                        selected={isItemSel}
                        onClick={(e) => canDelete && handleSelectOne(e, sale.id)}
                        sx={{ cursor: canDelete ? 'pointer' : 'default', '& td': { py: 1.75 } }}
                      >
                        {canDelete && (
                          <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                            <Checkbox color="primary" checked={isItemSel} onChange={(e) => handleSelectOne(e, sale.id)} />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatInvoiceNo(sale)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                            {sale.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {sale.customerPhone ? `${sale.customerPhone} · ` : ''}
                            {sale.cityAddress || 'Lahore'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {sale.machineName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Qty: {sale.qty || 1} {sale.serialNo ? `· S/N: ${sale.serialNo}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatPKR(fin.billTotal)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={500} color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatPKR(fin.paidAmount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                              fontVariantNumeric: 'tabular-nums',
                              color: balanceNum > 0 ? errorTone.main : successTone.main
                            }}
                          >
                            {formatPKR(balanceNum)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={statusLabel}
                            color={getPaymentChipColor(statusLabel)}
                            variant="light"
                            size="small"
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {formatFullDate(sale.time, sale.created_at || sale.dateISO)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ pr: 2.5 }} onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                            <Box
                              component="button"
                              type="button"
                              onClick={() => handleOpenPrint(sale)}
                              sx={{
                                ...inlineActionBtnSx,
                                color: primaryTone.main,
                                '&:hover': { bgcolor: primaryTone.bg }
                              }}
                            >
                              Print
                            </Box>
                            <Box
                              component="button"
                              type="button"
                              onClick={() => handleOpenEdit(sale)}
                              sx={{
                                ...inlineActionBtnSx,
                                color: primaryTone.main,
                                '&:hover': { bgcolor: primaryTone.bg }
                              }}
                            >
                              Edit
                            </Box>
                            {canDelete && (
                              <Box
                                component="button"
                                type="button"
                                onClick={() => {
                                  setSaleToDelete(sale);
                                  setDeleteDialogOpen(true);
                                }}
                                sx={{
                                  ...inlineActionBtnSx,
                                  color: errorTone.main,
                                  '&:hover': { bgcolor: errorTone.bg }
                                }}
                              >
                                Delete
                              </Box>
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
        </Box>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredSales.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </MainCard>

      {/* EDIT MACHINE SALE DRAWER */}
      <Drawer
        anchor="right"
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 620, md: 760, lg: 840 },
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: primaryTone.bg,
                color: primaryTone.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18
              }}
            >
              <EditOutlined />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={700} color="text.primary">
                  Edit Machine Sale Record
                </Typography>
                <Chip label={formatInvoiceNo(editingSale)} size="small" color="primary" variant="light" sx={{ fontWeight: 700 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Modify customer contact, machine models, quantities, rates, discounts, or warranty terms.
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => setEditDrawerOpen(false)}
            sx={{ color: 'text.secondary', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <CloseOutlined style={{ fontSize: 14 }} />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, py: 3, flex: 1, overflowY: 'auto', bgcolor: 'background.default' }}>
          {editingSale && (
            <Box
              component="form"
              id="edit-machine-sale-form"
              onSubmit={handleEditSubmit}
              sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              <Box sx={getSubSurfaceSx(theme, { p: 2.25, borderRadius: 2 })}>
                <Typography component="span" sx={sectionEyebrowSx}>
                  Customer & Warranty Details
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
                    gap: 1.75
                  }}
                >
                  <TextField
                    size="small"
                    required
                    label="Customer Name"
                    value={editingSale.customerName || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, customerName: e.target.value })}
                  />
                  <TextField
                    size="small"
                    label="Phone Number"
                    value={editingSale.customerPhone || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, customerPhone: e.target.value })}
                  />
                  <TextField
                    size="small"
                    label="City / Address"
                    value={editingSale.cityAddress || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, cityAddress: e.target.value })}
                  />
                  <TextField
                    size="small"
                    label="Warranty Terms"
                    value={editingSale.warrantyTerms || ''}
                    onChange={(e) => setEditingSale({ ...editingSale, warrantyTerms: e.target.value })}
                  />
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography component="span" sx={{ ...sectionEyebrowSx, mb: 0 }}>
                    Purchased Machines ({(editingSale.items || []).length || 1} Items)
                  </Typography>
                  <AppButton intent="secondary" size="small" startIcon={<PlusOutlined />} onClick={handleAddEditItemRow}>
                    Add Machine Row
                  </AppButton>
                </Box>

                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
                      <TableRow>
                        <TableCell sx={tableHeadCellSx}>Machine Model</TableCell>
                        <TableCell sx={tableHeadCellSx} width={140}>
                          Serial No
                        </TableCell>
                        <TableCell align="center" sx={tableHeadCellSx} width={80}>
                          Qty
                        </TableCell>
                        <TableCell align="right" sx={tableHeadCellSx} width={130}>
                          Rate (PKR)
                        </TableCell>
                        <TableCell align="right" sx={tableHeadCellSx} width={90}>
                          Disc (%)
                        </TableCell>
                        <TableCell align="right" sx={tableHeadCellSx} width={120}>
                          Line Total
                        </TableCell>
                        <TableCell align="center" sx={tableHeadCellSx} width={48} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(editingSale.items || []).map((editItem, idx) => {
                        const lineTotal = calcLineNetTotal(editItem);
                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Autocomplete
                                freeSolo
                                size="small"
                                options={machineModels}
                                value={editItem.machineName || ''}
                                onChange={(_, val) => handleEditItemChange(idx, 'machineName', val || '')}
                                onInputChange={(_, val) => handleEditItemChange(idx, 'machineName', val || '')}
                                renderInput={(params) => <TextField {...params} placeholder="Select model..." required />}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="Serial #"
                                value={editItem.serialNo || ''}
                                onChange={(e) => handleEditItemChange(idx, 'serialNo', e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                required
                                inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                value={editItem.qty || 1}
                                onChange={(e) => handleEditItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                required
                                disabled={!canEditPrice}
                                inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                value={editItem.unitPrice || 0}
                                onChange={(e) => handleEditItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, max: 100, style: { textAlign: 'right' } }}
                                value={editItem.discount || 0}
                                onChange={(e) => handleEditItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="subtitle2"
                                fontWeight={700}
                                color="text.primary"
                                sx={{ fontVariantNumeric: 'tabular-nums' }}
                              >
                                {formatPKR(lineTotal)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                disabled={(editingSale.items || []).length <= 1}
                                onClick={() => handleRemoveEditItemRow(idx)}
                                sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                              >
                                <DeleteOutlined style={{ fontSize: 13 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {(() => {
                const subTotal = (editingSale.items || []).reduce((sum, i) => sum + calcLineNetTotal(i), 0);
                const paid = Math.max(0, parseFloat(editingSale.paidAmount) || 0);
                const balance = Math.max(0, subTotal - paid);

                return (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                      gap: 2
                    }}
                  >
                    <Box sx={getSubSurfaceSx(theme, { p: 2.25, borderRadius: 2 })}>
                      <Typography component="span" sx={sectionEyebrowSx}>
                        Payment Disbursement
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <TextField
                          size="small"
                          type="number"
                          label="Paid Amount (PKR)"
                          inputProps={{ min: 0 }}
                          value={editingSale.paidAmount || 0}
                          onChange={(e) => setEditingSale({ ...editingSale, paidAmount: parseFloat(e.target.value) || 0 })}
                          sx={{ flex: 1, minWidth: 160 }}
                        />
                        <Chip
                          label={balance > 0 ? `Remaining: ${formatPKR(balance)}` : 'Fully Paid'}
                          color={balance > 0 ? 'error' : 'success'}
                          variant="light"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Box>
                    </Box>

                    <Box sx={getSubSurfaceSx(theme, { p: 2.25, borderRadius: 2 })}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          Total Bill Amount
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPKR(subTotal)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.25 }}>
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          Received / Paid
                        </Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                          {formatPKR(paid)}
                        </Typography>
                      </Box>
                      <Divider sx={{ mb: 1.25 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          Remaining Balance
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={700}
                          sx={{ color: balance > 0 ? errorTone.main : successTone.main, fontVariantNumeric: 'tabular-nums' }}
                        >
                          {formatPKR(balance)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                );
              })()}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            bgcolor: 'background.paper',
            position: 'sticky',
            bottom: 0,
            zIndex: 10
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Updates customer ledger balance & sales records.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.25 }}>
            <AppButton intent="cancel" onClick={() => setEditDrawerOpen(false)}>
              Cancel
            </AppButton>
            <AppButton intent="primary" type="submit" form="edit-machine-sale-form">
              Save Changes
            </AppButton>
          </Box>
        </Box>
      </Drawer>

      {/* SINGLE DELETE DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Sale Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the machine sale invoice for <strong>{saleToDelete?.customerName}</strong> (
            {saleToDelete?.machineName})?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDelete}>
            Delete Sale Invoice
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* BULK DELETE DIALOG */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Selected Sales Records?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selected.length}</strong> selected machine sales records? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setBulkDeleteDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmBulkDelete}>
            Delete Selected ({selected.length})
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* ADD NEW MACHINE MODEL DIALOG */}
      <Dialog open={newModelDialogOpen} onClose={() => setNewModelDialogOpen(false)} maxWidth="xs" fullWidth>
        <Box component="form" onSubmit={handleAddNewModelSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add New Machine Model</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Add a new machine model to your master catalog dropdown list for quick invoice generation.
            </Typography>
            <TextField
              label="Machine Model Name *"
              fullWidth
              size="small"
              required
              autoFocus
              placeholder="e.g. Rehmat 30'' Tractor Tow Lawn Mower"
              value={newModelNameInput}
              onChange={(e) => setNewModelNameInput(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <AppButton intent="cancel" onClick={() => setNewModelDialogOpen(false)}>
              Cancel
            </AppButton>
            <AppButton type="submit" intent="primary">
              Save Machine Model
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      {/* PRINTABLE MACHINE SALE INVOICE DIALOG */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
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
              #printable-machine-invoice, #printable-machine-invoice * {
                visibility: visible !important;
              }
              #printable-machine-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 150px 4px 6px 4px !important;
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

        <DialogTitle
          component="div"
          className="no-print"
          sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
        >
          <Typography variant="h5" fontWeight={700}>
            Official Customer Machine Sale Invoice
          </Typography>
          <Chip label="Sales Invoice" color="success" variant="light" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {printData &&
            (() => {
              const displayItems =
                printData.items && printData.items.length > 0
                  ? printData.items
                  : [
                      {
                        machineName: printData.machineName,
                        serialNo: printData.serialNo,
                        qty: printData.qty,
                        unitPrice: printData.unitPrice,
                        lineTotal: printData.lineTotal
                      }
                    ];

              return (
                <Box
                  id="printable-machine-invoice"
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
                            Customer Details
                          </div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                            {printData.customerName}
                          </div>
                          <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                            {printData.customerPhone && (
                              <div>
                                <strong>Phone:</strong> {printData.customerPhone}
                              </div>
                            )}
                            {printData.cityAddress && (
                              <div>
                                <strong>City / Address:</strong> {printData.cityAddress}
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 700 }}>Invoice No:</span>
                            <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>{formatInvoiceNo(printData)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                            <span style={{ fontWeight: 700, color: '#374151' }}>{printData.time}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Payment Status:</span>
                            <span style={{ fontWeight: 800, color: printData.paymentStatus === 'Paid' ? '#16a34a' : '#d97706' }}>
                              {printData.paymentStatus || 'Paid'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {printData.machineName && (
                        <div
                          style={{
                            padding: '4px 10px',
                            backgroundColor: 'rgba(240, 253, 244, 0.55)',
                            borderTop: '1px solid #bbf7d0',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '0.82rem'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: '#166534', marginRight: '8px' }}>Machine Sales Category:</span>
                          <span style={{ fontWeight: 800, color: '#111827' }}>{printData.machineName}</span>
                        </div>
                      )}
                    </div>

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
                              padding: '4px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Sr</strong>
                          </th>
                          <th
                            style={{
                              width: '52%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Specification / Model</strong>
                          </th>
                          <th
                            style={{
                              width: '12%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>QTY</strong>
                          </th>
                          <th
                            style={{
                              width: '14%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Rate</strong>
                          </th>
                          <th style={{ width: '14%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                            <strong>Total Amount</strong>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayItems.map((item, idx) => {
                          const q = parseInt(item.qty, 10) || 1;
                          const p = parseFloat(item.unitPrice) || 0;
                          const lineAmt =
                            item.lineTotal !== undefined && !Number.isNaN(item.lineTotal) ? item.lineTotal : calcLineNetTotal(item);

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
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
                                {item.machineName || 'Machine Sale'} {item.serialNo ? `(SN: ${item.serialNo})` : ''}
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
                                {String(q).padStart(2, '0')}
                              </td>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 8px',
                                  textAlign: 'right',
                                  fontWeight: 800,
                                  fontSize: '0.82rem'
                                }}
                              >
                                {p.toLocaleString()}
                              </td>
                              <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                                {lineAmt.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}

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
                          <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }} />
                          <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }} />
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, fontSize: '0.92rem', color: '#111827' }}>
                            {(printData.lineTotal || 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <Box sx={{ bgcolor: 'transparent', py: 0.8, px: 1.2, borderRadius: 1, border: '1px solid #86efac', mb: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="#4b5563" display="block">
                            PAID AMOUNT: Rs. {(printData.paidAmount || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle1" fontWeight={800} color="#166534" sx={{ lineHeight: 1.2 }}>
                            NET TOTAL: Rs. {(printData.lineTotal || 0).toLocaleString()}
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            color={(printData.balanceAmount || 0) > 0 ? '#dc2626' : '#16a34a'}
                            display="block"
                          >
                            {(printData.balanceAmount || 0) > 0
                              ? `REMAINING DUE: Rs. ${(printData.balanceAmount || 0).toLocaleString()}`
                              : 'FULL PAID (NO DUES)'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', mt: 1.5, pt: 1 }}>
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="#374151"
                          sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 170 }}
                        >
                          Customer Signature
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                          <CeoSignature />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              );
            })()}
        </DialogContent>

        <DialogActions
          className="no-print"
          sx={{ p: 2, bgcolor: getSubSurfaceSx(theme).bgcolor, borderTop: '1px solid', borderColor: 'divider' }}
        >
          <AppButton intent="cancel" onClick={() => setPrintModalOpen(false)}>
            Close &amp; Continue
          </AppButton>
          <AppButton intent="print" startIcon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Customer Machine Bill
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
