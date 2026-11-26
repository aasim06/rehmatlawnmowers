import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { useDebounce } from 'hooks/useDebounce';
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
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  DollarOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import { AppButton, MasterKpiGrid, PageHeader } from 'components/common';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import {
  buildCustomerLedgers,
  getCustomerDirectorySuggestions,
  resolveAllocatedInvoiceMap,
  resolveRepairFinancials
} from 'utils/machineLedgerHelpers';

const REPAIR_STATUS_OPTIONS = ['Received', 'In Repair', 'Ready for Delivery', 'Delivered'];

const STATUS_META = {
  Received: {
    label: 'Machine Received',
    filterLabel: 'Received',
    tooltip: 'Customer dropped off the machine at the workshop for repairs.',
    chipColor: 'warning'
  },
  'In Repair': {
    label: 'In Repairing',
    filterLabel: 'In Repair',
    tooltip: 'Technician is actively servicing and repairing this machine.',
    chipColor: 'primary'
  },
  'Ready for Delivery': {
    label: 'Ready for Delivery',
    filterLabel: 'Ready',
    tooltip: 'Machine repair is complete and ready for customer handover.',
    chipColor: 'success'
  },
  Delivered: {
    label: 'Delivered',
    filterLabel: 'Delivered',
    tooltip: 'Customer settled the bill and received the machine.',
    chipColor: 'default'
  }
};

const QUICK_FAULT_PRESETS = [
  { label: 'General servicing', text: 'General Servicing & Overhauling' },
  { label: 'Engine problem', text: 'Engine Problem / Tuning & Overhaul' },
  { label: 'Blade issue', text: 'Blade Issue / Replacement & Sharpening' },
  { label: 'Starter problem', text: 'Starter Problem / Pulley & Recoil Repair' }
];

const DEFAULT_MACHINE_MODEL = 'Rehmat 20" Lawn Mower (Petrol Engine)';

const BASE_PART_SUGGESTIONS = [
  'Gear set complete',
  'Chain set complete',
  'Bearing Complete',
  'Sharpness overhauling',
  'Back roller shaft',
  'Paint new',
  'Grass box',
  'Brush cutter repair',
  'Labor charges',
  'SKF Ball Bearing 6205',
  'Ball Bearing 6204',
  'Cutter Blade 18"',
  'Cutter Blade 20"',
  'Cutter Blade 24"',
  'Carburetor Assembly',
  'Carburetor Tuning & Labour',
  'Spark Plug NGK',
  'Engine Oil 4T 20W-50',
  'Starter Pulley & Recoil Rope',
  'Air Filter Element',
  'V-Belt A-38',
  'Throttle Cable',
  'Clutch Plate Set',
  'Complete Engine Overhaul Service'
];

const BASE_MACHINE_MODELS = [
  DEFAULT_MACHINE_MODEL,
  'Rehmat Electric Lawn Cutter 18"',
  'Rehmat Heavy Duty Lawn Mower 24"',
  'Rehmat Grass Trimmer & Cutter 2-Stroke',
  'Rehmat Hand Push Lawn Roller Mower'
];

const createEmptyItemRow = () => ({
  id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  itemName: '',
  qnty: 1,
  rate: '',
  totalAmount: 0
});

const createFormState = () => ({
  customerName: '',
  customerPhone: '',
  cityAddress: '',
  machineModel: '',
  faultDescription: '',
  discountAmount: '',
  paidAmount: '',
  repairStatus: 'Received',
  promisedDate: '',
  items: [createEmptyItemRow()]
});

/** Clean and normalize customer phone/city values when imported from legacy concatenated fields. */
const parseCustomerInfo = (phoneStr, cityStr) => {
  let phone = (phoneStr || '').trim();
  let city = (cityStr || '').trim();

  if (phone && (!city || city === 'Lahore')) {
    const match = phone.match(/^(\d{10,12}|[\d\-+]+)([A-Za-z\s]+)$/);
    if (match) {
      phone = match[1].trim();
      city = match[2].trim();
    }
  }

  if (phone.length === 11 && phone.startsWith('03')) {
    phone = `${phone.slice(0, 4)}-${phone.slice(4)}`;
  }

  return { phone: phone || 'N/A', city: city || 'Lahore' };
};

const formatSr = (num) => (num < 10 ? `0${num}` : `${num}`);

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

export default function MachineRepairsPage() {
  const theme = useTheme();
  const {
    machineRepairs = [],
    machineModels = [],
    machineSales = [],
    machineCustomers = [],
    customerPayments = [],
    items = [],
    masterItemNames = [],
    addMachineModel,
    addMachineRepair,
    updateMachineRepair,
    deleteMachineRepair,
    addCustomerPayment
  } = useStoreInventory();

  const customerSuggestions = getCustomerDirectorySuggestions({
    machineCustomers,
    machineSales,
    machineRepairs,
    customerPayments
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

  const [addModelDialogOpen, setAddModelDialogOpen] = useState(false);
  const [newModelInput, setNewModelInput] = useState('');

  // Search, Filter & Selection state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Job card form state & UI feedback
  const [form, setForm] = useState(() => createFormState());
  const [customerNameError, setCustomerNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const matchedCustomerLedger = customerLedgers.find(
    (c) => c.customerName.toLowerCase() === (form.customerName || '').trim().toLowerCase()
  );

  // Receive Payment Voucher state on repair job card
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [repairForPay, setRepairForPay] = useState(null);
  const [payForm, setPayForm] = useState({
    entryType: 'Receipt',
    amountPaid: '',
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  });
  const [savingPay, setSavingPay] = useState(false);

  // Drawers & Modals
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState(null);
  const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  const customerInputRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const availablePartNames = Array.from(
    new Set([...BASE_PART_SUGGESTIONS, ...items.map((i) => i.name), ...(masterItemNames || []).map((m) => m.name)])
  ).filter(Boolean);

  const uniqueMachineOptions = Array.from(new Set([...BASE_MACHINE_MODELS, ...machineModels])).filter(Boolean);

  // Line item handlers
  const handleAddItemRow = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItemRow()] }));
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
      const currentRow = { ...updated[index], [field]: value };
      const q = Math.max(1, parseInt(currentRow.qnty, 10) || 1);
      const r = Math.max(0, parseFloat(currentRow.rate) || 0);
      currentRow.totalAmount = q * r;
      updated[index] = currentRow;
      return { ...prev, items: updated };
    });
  };

  // Calculations
  const calculatedGrossTotal = form.items.reduce((sum, item) => {
    const q = Math.max(0, parseInt(item.qnty, 10) || 0);
    const r = Math.max(0, parseFloat(item.rate) || 0);
    return sum + q * r;
  }, 0);

  const calculatedDiscount = Math.max(0, parseFloat(form.discountAmount) || 0);
  const calculatedNetTotal = Math.max(0, calculatedGrossTotal - calculatedDiscount);
  const calculatedBalance = Math.max(0, calculatedNetTotal - (parseFloat(form.paidAmount) || 0));

  const handleClearForm = () => {
    setCustomerNameError('');
    setForm(createFormState());
  };

  const submitJobCard = async (shouldPrint = true) => {
    if (isSubmitting) return;
    if (!form.customerName.trim()) {
      setCustomerNameError('Customer name is required');
      customerInputRef.current?.focus();
      return;
    }

    setCustomerNameError('');
    setIsSubmitting(true);

    try {
      const resolvedModel = (form.machineModel || '').trim() || 'Lawn Mower Machine';
      const resolvedFault = (form.faultDescription || '').trim() || 'General Servicing';
      const resolvedCity = (form.cityAddress || '').trim() || 'Lahore';
      const resolvedPromised = (form.promisedDate || '').trim() || '1-2 Days';

      const formattedItems = form.items.map((item) => {
        const q = Math.max(1, parseInt(item.qnty, 10) || 1);
        const r = Math.max(0, parseFloat(item.rate) || 0);
        const label = (item.itemName || '').trim() || 'Specification Item';
        return {
          id: item.id || `item-${Math.random().toString(36).slice(2, 8)}`,
          itemName: label,
          specification: label,
          model: resolvedModel,
          qnty: q,
          rate: r,
          totalAmount: q * r
        };
      });

      const partsSummaryText = formattedItems.map((i) => `${i.specification} (${i.qnty}x @ Rs.${i.rate})`).join(', ');

      const created = await addMachineRepair({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim() || 'N/A',
        cityAddress: resolvedCity,
        machineName: resolvedModel,
        serialNo: 'N/A',
        faultDescription: `${resolvedFault} | Details: ${partsSummaryText}`,
        partsCost: calculatedGrossTotal,
        discountAmount: calculatedDiscount,
        laborCost: 0,
        totalCost: calculatedNetTotal,
        paidAmount: parseFloat(form.paidAmount) || 0,
        balanceAmount: calculatedBalance,
        repairStatus: form.repairStatus,
        promisedDate: resolvedPromised,
        repairItems: formattedItems
      });

      if (shouldPrint) {
        setPrintData({
          ...created,
          machineModel: resolvedModel,
          faultDescription: resolvedFault,
          repairItems: formattedItems,
          grossTotal: calculatedGrossTotal,
          discountAmount: calculatedDiscount,
          subTotal: calculatedNetTotal,
          balanceAmount: calculatedBalance
        });
        setPrintModalOpen(true);
      }

      setForm(createFormState());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    submitJobCard(false);
  };

  const handleSaveNewModel = () => {
    const trimmed = newModelInput.trim();
    if (!trimmed) return;
    addMachineModel(trimmed);
    setForm((prev) => ({ ...prev, machineModel: trimmed }));
    setNewModelInput('');
    setAddModelDialogOpen(false);
  };

  // Edit Drawer handlers
  const handleOpenEdit = (repair) => {
    const fin = resolveRepairFinancials(repair, customerPayments);
    setEditingRepair({
      ...repair,
      partsCost: fin.grossCost,
      discountAmount: fin.discount,
      totalCost: fin.netTotal,
      paidAmount: fin.paidAmount,
      balanceAmount: fin.balanceAmount
    });
    setEditDrawerOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRepair) return;
    updateMachineRepair(editingRepair.id, editingRepair);
    setEditDrawerOpen(false);
  };

  const handleSelectCustomerName = (selectedName) => {
    const trimmed = (selectedName || '').trim();
    const match = customerSuggestions.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (customerNameError) setCustomerNameError('');
    setForm((prev) => ({
      ...prev,
      customerName: selectedName || '',
      customerPhone: match?.phone && !prev.customerPhone ? match.phone : prev.customerPhone,
      cityAddress: match?.city && (!prev.cityAddress || prev.cityAddress === 'Lahore') ? match.city : prev.cityAddress
    }));
  };

  const handleOpenReceivePayment = (repair) => {
    const fin = resolveRepairFinancials(repair, customerPayments);
    const alloc = allocationMap.get(`Repair:${repair.id}`);
    setRepairForPay({
      ...repair,
      ...fin,
      paidAmount: alloc ? alloc.paidAmount : fin.paidAmount,
      balanceAmount: alloc ? alloc.balanceAmount : fin.balanceAmount
    });
    setPayForm({
      entryType: 'Receipt',
      amountPaid: fin.balanceAmount > 0 ? String(fin.balanceAmount) : '',
      paymentMethod: 'Cash',
      referenceNo: '',
      notes: ''
    });
    setPayDialogOpen(true);
  };

  const handleSubmitRepairPayment = async (e) => {
    e.preventDefault();
    if (!repairForPay || savingPay) return;
    const paidNum = parseFloat(payForm.amountPaid) || 0;
    if (paidNum <= 0) return;

    setSavingPay(true);
    try {
      await addCustomerPayment({
        customerName: repairForPay.customerName || 'Walk-in Customer',
        entryType: payForm.entryType,
        referenceType: 'Repair',
        repairId: repairForPay.id,
        referenceLabel: repairForPay.repairNo || formatSr(1),
        amountPaid: paidNum,
        paymentMethod: payForm.entryType === 'Adjustment' ? 'Discount / Waiver' : payForm.paymentMethod,
        referenceNo: payForm.referenceNo,
        notes: payForm.notes
      });
      setPayDialogOpen(false);
      setRepairForPay(null);
    } finally {
      setSavingPay(false);
    }
  };

  // Delete handlers (single + bulk)
  const handleOpenDelete = (repair) => {
    setBulkDeleteMode(false);
    setRepairToDelete(repair);
    setDeleteDialogOpen(true);
  };

  const handleOpenBulkDelete = () => {
    if (selected.length === 0) return;
    setBulkDeleteMode(true);
    setRepairToDelete(null);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (bulkDeleteMode) {
      selected.forEach((id) => deleteMachineRepair(id));
      setSelected([]);
    } else if (repairToDelete) {
      deleteMachineRepair(repairToDelete.id);
      setSelected((prev) => prev.filter((id) => id !== repairToDelete.id));
    }
    setDeleteDialogOpen(false);
    setRepairToDelete(null);
    setBulkDeleteMode(false);
  };

  const handleOpenPrint = (repair) => {
    setPrintData(repair);
    setPrintModalOpen(true);
  };

  // Filtered ledger rows
  const filteredRepairs = machineRepairs.filter((r) => {
    const sTerm = (debouncedSearch || '').toLowerCase();
    const matchesSearch =
      !sTerm ||
      (r.repairNo || '').toLowerCase().includes(sTerm) ||
      (r.customerName || '').toLowerCase().includes(sTerm) ||
      (r.customerPhone || '').toLowerCase().includes(sTerm) ||
      (r.machineName || '').toLowerCase().includes(sTerm) ||
      (r.faultDescription || '').toLowerCase().includes(sTerm);

    const matchesStatus = statusFilter === 'All' || r.repairStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(filteredRepairs.map((n) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  // KPI metrics
  const totalRepairsCount = machineRepairs.length;
  const inRepairCount = machineRepairs.filter((r) => r.repairStatus === 'In Repair' || r.repairStatus === 'Received').length;
  const readyCount = machineRepairs.filter((r) => r.repairStatus === 'Ready for Delivery').length;
  const totalRepairRevenue = machineRepairs.reduce((sum, r) => {
    const alloc = allocationMap.get(`Repair:${r.id}`);
    return sum + (alloc ? alloc.paidAmount : resolveRepairFinancials(r, customerPayments).paidAmount);
  }, 0);

  const kpiCards = [
    {
      label: 'Total Repair Jobs',
      value: totalRepairsCount.toLocaleString(),
      helper: 'Logged service job cards',
      icon: <ToolOutlined />,
      tone: 'primary',
      onClick: () => setStatusFilter('All')
    },
    {
      label: 'In Repair / Pending',
      value: inRepairCount.toLocaleString(),
      helper: 'Received & workshop queue',
      icon: <ClockCircleOutlined />,
      tone: 'warning',
      highlightValue: inRepairCount > 0,
      onClick: () => setStatusFilter('In Repair')
    },
    {
      label: 'Ready for Delivery',
      value: readyCount.toLocaleString(),
      helper: 'Completed & awaiting pickup',
      icon: <CheckCircleOutlined />,
      tone: 'success',
      onClick: () => setStatusFilter('Ready for Delivery')
    },
    {
      label: 'Total Repair Revenue',
      value: formatPKR(totalRepairRevenue),
      helper: 'Collected workshop payments',
      icon: <DollarOutlined />,
      tone: 'success',
      highlightValue: totalRepairRevenue > 0
    }
  ];

  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. PAGE HEADER & TOP KPI GRID */}
      <Box>
        <PageHeader
          title="Machine Repairing"
          count={totalRepairsCount}
          countLabel="Job Cards"
          subtitle="Create workshop repair job cards, log parts & labor billing, and track customer deliveries."
          sx={{ mb: 2 }}
        />
        <MasterKpiGrid kpis={kpiCards} />
      </Box>

      {/* 2. NEW REPAIR JOB CARD FORM */}
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
            New Repair Job Card
          </Typography>
          <Chip
            label={`Net Total: ${formatPKR(calculatedNetTotal)}`}
            size="small"
            color="primary"
            variant="light"
            sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          />
        </Box>

        <Box component="form" noValidate onSubmit={handleConfirmSubmit} sx={{ p: { xs: 2, sm: 3 } }}>
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
                <Typography component="label" htmlFor="repair-customer-name" sx={{ ...fieldLabelSx, mb: 0 }}>
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
                value={form.customerName || null}
                inputValue={form.customerName}
                onChange={(e, val) => handleSelectCustomerName(val || '')}
                onInputChange={(e, val, reason) => {
                  if (reason !== 'reset') handleSelectCustomerName(val || '');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    id="repair-customer-name"
                    inputRef={customerInputRef}
                    placeholder="e.g. Asim Ameer or select existing customer..."
                    error={Boolean(customerNameError)}
                    helperText={customerNameError}
                  />
                )}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="repair-customer-phone" sx={fieldLabelSx}>
                Phone no{' '}
                <Box component="span" sx={{ color: 'error.main' }}>
                  *
                </Box>
              </Typography>
              <TextField
                id="repair-customer-phone"
                fullWidth
                size="small"
                placeholder="0306-0112606"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="repair-city-address" sx={fieldLabelSx}>
                City / Address
              </Typography>
              <TextField
                id="repair-city-address"
                fullWidth
                size="small"
                placeholder="Lahore"
                value={form.cityAddress}
                onChange={(e) => setForm({ ...form, cityAddress: e.target.value })}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* 2. MACHINE & FAULT */}
          <Typography component="span" sx={sectionEyebrowSx}>
            2. Machine & Fault
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 2,
              mb: 2
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                <Typography component="label" htmlFor="repair-machine-model" sx={{ ...fieldLabelSx, mb: 0 }}>
                  Machine model under repair{' '}
                  <Box component="span" sx={{ color: 'error.main' }}>
                    *
                  </Box>
                </Typography>
                <Typography
                  component="button"
                  type="button"
                  onClick={() => setAddModelDialogOpen(true)}
                  sx={{
                    border: 0,
                    background: 'none',
                    p: 0,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  + Add model
                </Typography>
              </Box>
              <Autocomplete
                id="repair-machine-model"
                freeSolo
                size="small"
                options={uniqueMachineOptions}
                value={form.machineModel || null}
                inputValue={form.machineModel}
                onChange={(e, newVal) => setForm((prev) => ({ ...prev, machineModel: newVal || '' }))}
                onInputChange={(e, newInputVal, reason) => {
                  if (reason !== 'reset') setForm((prev) => ({ ...prev, machineModel: newInputVal || '' }));
                }}
                renderInput={(params) => <TextField {...params} placeholder='e.g. Rehmat 20" Lawn Mower (Petrol Engine)' />}
              />
            </Box>

            <Box>
              <Typography component="label" htmlFor="repair-promised-date" sx={fieldLabelSx}>
                Expected delivery date
              </Typography>
              <TextField
                id="repair-promised-date"
                fullWidth
                size="small"
                placeholder="e.g. 1-2 Days or 30 Nov 2026"
                value={form.promisedDate}
                onChange={(e) => setForm({ ...form, promisedDate: e.target.value })}
              />
            </Box>
          </Box>

          <Box>
            <Typography component="label" htmlFor="repair-fault-summary" sx={fieldLabelSx}>
              Reported fault / problem summary
            </Typography>
            <TextField
              id="repair-fault-summary"
              fullWidth
              multiline
              minRows={2}
              size="small"
              placeholder="Describe the reported fault or servicing requirements..."
              value={form.faultDescription}
              onChange={(e) => setForm({ ...form, faultDescription: e.target.value })}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.25 }}>
              {QUICK_FAULT_PRESETS.map((preset) => {
                const isSelectedPreset = (form.faultDescription || '').toLowerCase() === preset.text.toLowerCase();
                return (
                  <Chip
                    key={preset.label}
                    label={preset.label}
                    size="small"
                    clickable
                    color={isSelectedPreset ? 'primary' : 'default'}
                    variant={isSelectedPreset ? 'light' : 'outlined'}
                    onClick={() => setForm((prev) => ({ ...prev, faultDescription: preset.text }))}
                    sx={{ fontWeight: isSelectedPreset ? 700 : 500, fontSize: '0.75rem' }}
                  />
                );
              })}
            </Box>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* 3. PARTS & BILLING */}
          <Typography component="span" sx={sectionEyebrowSx}>
            3. Parts & Billing
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.8fr) minmax(300px, 1fr)' },
              gap: 3,
              alignItems: 'start'
            }}
          >
            {/* Left Column: Clean Line Items Table */}
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Box sx={{ minWidth: 540 }}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '32px minmax(180px, 1fr) 74px 108px 88px 30px',
                      gap: 1.25,
                      pb: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography sx={tableHeadCellSx}>SR</Typography>
                    <Typography sx={tableHeadCellSx}>Specification</Typography>
                    <Typography sx={{ ...tableHeadCellSx, textAlign: 'center' }}>QTY</Typography>
                    <Typography sx={{ ...tableHeadCellSx, textAlign: 'right' }}>Rate (Rs.)</Typography>
                    <Typography sx={{ ...tableHeadCellSx, textAlign: 'right' }}>Amount</Typography>
                    <Box />
                  </Box>

                  {form.items.map((row, idx) => (
                    <Box
                      key={row.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '32px minmax(180px, 1fr) 74px 108px 88px 30px',
                        gap: 1.25,
                        alignItems: 'center',
                        py: 1,
                        borderBottom: '1px solid',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatSr(idx + 1)}
                      </Typography>

                      <Autocomplete
                        freeSolo
                        size="small"
                        options={availablePartNames}
                        value={row.itemName || null}
                        inputValue={row.itemName}
                        onChange={(e, newVal) => handleItemRowChange(idx, 'itemName', newVal || '')}
                        onInputChange={(e, newVal, reason) => {
                          if (reason !== 'reset') handleItemRowChange(idx, 'itemName', newVal || '');
                        }}
                        renderInput={(params) => <TextField {...params} placeholder="Enter part or service name..." />}
                      />

                      <TextField
                        type="number"
                        size="small"
                        value={row.qnty}
                        inputProps={{ min: 1, style: { textAlign: 'center' } }}
                        onChange={(e) => handleItemRowChange(idx, 'qnty', e.target.value)}
                      />

                      <TextField
                        type="number"
                        size="small"
                        placeholder="0"
                        value={row.rate}
                        inputProps={{ min: 0, style: { textAlign: 'right' } }}
                        onChange={(e) => handleItemRowChange(idx, 'rate', e.target.value)}
                      />

                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="text.primary"
                        sx={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {(parseFloat(row.totalAmount) || 0).toLocaleString()}
                      </Typography>

                      <Tooltip title={form.items.length <= 1 ? 'At least one row required' : 'Remove item'}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={form.items.length <= 1}
                            onClick={() => handleRemoveItemRow(idx)}
                            sx={{
                              color: 'text.secondary',
                              '&:hover': { color: 'error.main' }
                            }}
                          >
                            <DeleteOutlined style={{ fontSize: 13 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box sx={{ mt: 1.75 }}>
                <AppButton intent="secondary" size="small" startIcon={<PlusOutlined />} onClick={handleAddItemRow}>
                  Add line item
                </AppButton>
              </Box>
            </Box>

            {/* Right Column: Billing Summary Panel */}
            <Box sx={getSubSurfaceSx(theme, { p: 2.25, borderRadius: 2 })}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.75 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Gross total
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatPKR(calculatedGrossTotal)}
                </Typography>
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography component="label" htmlFor="repair-discount" sx={fieldLabelSx}>
                  Discount (PKR)
                </Typography>
                <TextField
                  id="repair-discount"
                  type="number"
                  size="small"
                  fullWidth
                  placeholder="0"
                  inputProps={{ min: 0 }}
                  value={form.discountAmount}
                  onChange={(e) => setForm({ ...form, discountAmount: e.target.value })}
                />
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography component="label" htmlFor="repair-paid-advance" sx={fieldLabelSx}>
                  Paid advance (PKR)
                </Typography>
                <TextField
                  id="repair-paid-advance"
                  type="number"
                  size="small"
                  fullWidth
                  placeholder="0"
                  inputProps={{ min: 0 }}
                  value={form.paidAmount}
                  onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography component="label" htmlFor="repair-status-select" sx={fieldLabelSx}>
                  Repair status
                </Typography>
                <TextField
                  id="repair-status-select"
                  select
                  size="small"
                  fullWidth
                  value={form.repairStatus}
                  onChange={(e) => setForm({ ...form, repairStatus: e.target.value })}
                >
                  {REPAIR_STATUS_OPTIONS.map((st) => (
                    <MenuItem key={st} value={st}>
                      {STATUS_META[st]?.label || st}
                    </MenuItem>
                  ))}
                </TextField>
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
                  color: calculatedBalance > 0 ? errorTone.main : successTone.main
                }}
              >
                {formatPKR(calculatedBalance)}
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
            <AppButton intent="secondary" startIcon={<PrinterOutlined />} onClick={() => submitJobCard(true)} disabled={isSubmitting}>
              Save & print receipt
            </AppButton>
            <AppButton intent="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Confirm job card'}
            </AppButton>
          </Box>
        </Box>
      </MainCard>

      {/* 3. JOB CARDS & REPAIRS LEDGER */}
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
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Job Cards & Repairs Ledger
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                Manage customer repair status, specifications and payment balances.
              </Typography>
            </Box>

            {selected.length > 0 && (
              <AppButton intent="danger" size="small" startIcon={<DeleteOutlined />} onClick={handleOpenBulkDelete}>
                Delete Selected ({selected.length})
              </AppButton>
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2
            }}
          >
            {/* Segmented Filter Control */}
            <Box
              sx={getSubSurfaceSx(theme, {
                display: 'inline-flex',
                flexWrap: 'wrap',
                gap: 0.5,
                p: 0.5,
                borderRadius: 2
              })}
            >
              {['All', ...REPAIR_STATUS_OPTIONS].map((statusKey) => {
                const isAll = statusKey === 'All';
                const count = isAll ? machineRepairs.length : machineRepairs.filter((r) => r.repairStatus === statusKey).length;
                const isActive = statusFilter === statusKey;
                const label = isAll ? 'All Jobs' : STATUS_META[statusKey]?.filterLabel || statusKey;
                return (
                  <Box
                    key={statusKey}
                    component="button"
                    type="button"
                    onClick={() => setStatusFilter(statusKey)}
                    sx={{
                      border: 0,
                      px: 1.5,
                      py: 0.65,
                      borderRadius: 1.5,
                      fontSize: '0.8rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      bgcolor: isActive ? 'background.paper' : 'transparent',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      boxShadow: isActive ? theme.shadows[1] : 'none'
                    }}
                  >
                    {label} ({count})
                  </Box>
                );
              })}
            </Box>

            {/* Search Input */}
            <OutlinedInput
              inputRef={searchInputRef}
              size="small"
              placeholder="Search Job No, Customer, Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <Chip label="Ctrl+K" size="small" variant="outlined" sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }} />
                </InputAdornment>
              }
              sx={{ width: { xs: '100%', sm: 320 } }}
            />
          </Box>
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
                <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredRepairs.length}
                    checked={filteredRepairs.length > 0 && selected.length === filteredRepairs.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={tableHeadCellSx}>Job No & Date</TableCell>
                <TableCell sx={tableHeadCellSx}>Customer</TableCell>
                <TableCell sx={tableHeadCellSx}>Model</TableCell>
                <TableCell sx={tableHeadCellSx}>Parts</TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>
                  Total Bill
                </TableCell>
                <TableCell align="center" sx={tableHeadCellSx}>
                  Payment
                </TableCell>
                <TableCell align="center" sx={tableHeadCellSx}>
                  Status
                </TableCell>
                <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRepairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary" fontWeight={600}>
                      No machine repair records found matching your filters.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRepairs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((repair) => {
                  const isItemSelected = selected.includes(repair.id);
                  const rawFin = resolveRepairFinancials(repair, customerPayments);
                  const alloc = allocationMap.get(`Repair:${repair.id}`);
                  const fin = {
                    ...rawFin,
                    paidAmount: alloc ? alloc.paidAmount : rawFin.paidAmount,
                    balanceAmount: alloc ? alloc.balanceAmount : rawFin.balanceAmount
                  };
                  const itemsList = Array.isArray(repair.repairItems) ? repair.repairItems : [];
                  const displayedParts = itemsList.slice(0, 2);
                  const remainingPartsCount = itemsList.length - 2;
                  const { phone, city } = parseCustomerInfo(repair.customerPhone, repair.cityAddress);
                  const statusInfo = STATUS_META[repair.repairStatus] || {
                    label: repair.repairStatus || 'Received',
                    tooltip: 'Job status',
                    chipColor: 'warning'
                  };

                  return (
                    <TableRow key={repair.id} hover selected={isItemSelected} sx={{ '& td': { py: 1.75 } }}>
                      <TableCell padding="checkbox" sx={{ pl: 2.5 }}>
                        <Checkbox color="primary" checked={isItemSelected} onChange={() => handleSelectOne(repair.id)} />
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          #{repair.repairNo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {repair.receivedDate}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {repair.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {phone} • {city}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" fontWeight={500} color="text.primary">
                          {repair.machineName || 'Lawn Mower'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 240 }}>
                        {itemsList.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                            {displayedParts.map((part, pIdx) => (
                              <Chip
                                key={pIdx}
                                size="small"
                                variant="outlined"
                                label={`${part.qnty > 1 ? `${part.qnty}× ` : ''}${part.specification || part.itemName || 'Item'}`}
                                sx={{ fontSize: '0.75rem', fontWeight: 500, height: 24 }}
                              />
                            ))}
                            {remainingPartsCount > 0 && (
                              <Tooltip
                                title={itemsList
                                  .slice(2)
                                  .map((p) => `${p.qnty || 1}x ${p.specification || p.itemName}`)
                                  .join(', ')}
                                arrow
                              >
                                <Chip
                                  size="small"
                                  color="primary"
                                  variant="light"
                                  label={`+${remainingPartsCount} more`}
                                  sx={{ fontSize: '0.75rem', fontWeight: 700, height: 24 }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            {repair.faultDescription || 'General Repair & Service'}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPKR(fin.netTotal)}
                        </Typography>
                        {fin.discount > 0 && (
                          <Typography variant="caption" display="block" color="error.main" fontWeight={600}>
                            -{formatPKR(fin.discount)}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="center">
                        {fin.balanceAmount > 0 ? (
                          <Typography variant="caption" fontWeight={700} sx={{ color: errorTone.main, fontVariantNumeric: 'tabular-nums' }}>
                            Due {fin.balanceAmount.toLocaleString()}
                          </Typography>
                        ) : (
                          <Chip label="Paid" size="small" color="success" variant="light" sx={{ fontWeight: 700 }} />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Tooltip title={statusInfo.tooltip} arrow placement="top">
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            color={statusInfo.chipColor}
                            variant="light"
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        </Tooltip>
                      </TableCell>

                      <TableCell align="center" sx={{ pr: 2.5 }}>
                        <Box sx={{ display: 'flex', gap: 0.75, justifyContent: 'center' }}>
                          {fin.balanceAmount > 0 && (
                            <Tooltip title="Receive Payment / Discount">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenReceivePayment(repair)}
                                sx={{
                                  border: '1px solid',
                                  borderColor: successTone.border,
                                  bgcolor: successTone.bg,
                                  borderRadius: 1.5,
                                  color: successTone.main,
                                  '&:hover': { bgcolor: successTone.main, color: '#fff' }
                                }}
                              >
                                <DollarOutlined style={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Print Receipt">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPrint(repair)}
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
                          <Tooltip title="Edit Job">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEdit(repair)}
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
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDelete(repair)}
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
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredRepairs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </MainCard>

      {/* EDIT DRAWER */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: 330, sm: 420 }, p: 3 }}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>
            Edit Repair Job Card #{editingRepair?.repairNo}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Update job status, customer info, fault notes, discount or payments.
          </Typography>
          <Divider sx={{ my: 2.5 }} />

          {editingRepair && (() => {
            const netAfterDisc = Math.max(
              0,
              (parseFloat(editingRepair.partsCost) || 0) +
              (parseFloat(editingRepair.laborCost) || 0) -
              (parseFloat(editingRepair.discountAmount) || 0)
            );
            const remBal = Math.max(0, netAfterDisc - (parseFloat(editingRepair.paidAmount) || 0));

            return (
              <Box component="form" onSubmit={handleSaveEdit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Repair Status"
                  select
                  fullWidth
                  size="small"
                  value={editingRepair.repairStatus || 'Received'}
                  onChange={(e) => setEditingRepair({ ...editingRepair, repairStatus: e.target.value })}
                >
                  {REPAIR_STATUS_OPTIONS.map((st) => (
                    <MenuItem key={st} value={st}>
                      {STATUS_META[st]?.label || st}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Customer Name"
                  fullWidth
                  size="small"
                  required
                  value={editingRepair.customerName || ''}
                  onChange={(e) => setEditingRepair({ ...editingRepair, customerName: e.target.value })}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField
                    label="Phone No"
                    fullWidth
                    size="small"
                    value={editingRepair.customerPhone || ''}
                    onChange={(e) => setEditingRepair({ ...editingRepair, customerPhone: e.target.value })}
                  />
                  <TextField
                    label="Expected Delivery"
                    fullWidth
                    size="small"
                    value={editingRepair.promisedDate || ''}
                    onChange={(e) => setEditingRepair({ ...editingRepair, promisedDate: e.target.value })}
                  />
                </Box>

                <TextField
                  label="Machine Model"
                  fullWidth
                  size="small"
                  value={editingRepair.machineName || ''}
                  onChange={(e) => setEditingRepair({ ...editingRepair, machineName: e.target.value })}
                />

                <TextField
                  label="Fault / Technician Notes"
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  value={editingRepair.technicianNotes || editingRepair.faultDescription || ''}
                  onChange={(e) => setEditingRepair({ ...editingRepair, technicianNotes: e.target.value })}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <TextField
                    label="Discount (PKR)"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ min: 0 }}
                    value={editingRepair.discountAmount || 0}
                    onChange={(e) =>
                      setEditingRepair((prev) => ({ ...prev, discountAmount: Math.max(0, parseFloat(e.target.value) || 0) }))
                    }
                  />
                  <TextField
                    label="Paid Amount (PKR)"
                    type="number"
                    fullWidth
                    size="small"
                    inputProps={{ min: 0 }}
                    value={editingRepair.paidAmount || 0}
                    onChange={(e) =>
                      setEditingRepair((prev) => ({ ...prev, paidAmount: Math.max(0, parseFloat(e.target.value) || 0) }))
                    }
                  />
                </Box>

                <Box sx={getSubSurfaceSx(theme, { p: 1.75, borderRadius: 1.5 })}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Net Total Bill:</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{formatPKR(netAfterDisc)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Remaining Due:</Typography>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: remBal > 0 ? errorTone.main : successTone.main }}>
                      {formatPKR(remBal)}
                    </Typography>
                  </Box>
                </Box>

                <AppButton intent="primary" type="submit" fullWidth>
                  Update Job Card
                </AppButton>
              </Box>
            );
          })()}
        </Box>
      </Drawer>

      {/* RECEIVE REPAIR PAYMENT VOUCHER DIALOG */}
      <Dialog open={payDialogOpen} onClose={() => setPayDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmitRepairPayment}>
          <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
            Receive Repair Payment — #{repairForPay?.repairNo}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {repairForPay && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={getSubSurfaceSx(theme, { p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{repairForPay.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">{repairForPay.machineName}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">Remaining Due</Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ color: errorTone.main }}>
                      {formatPKR(repairForPay.balanceAmount)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    select
                    size="small"
                    label="Transaction Type"
                    value={payForm.entryType}
                    onChange={(e) => setPayForm({ ...payForm, entryType: e.target.value })}
                  >
                    <MenuItem value="Receipt">Cash / Payment Received</MenuItem>
                    <MenuItem value="Adjustment">Discount / Settlement</MenuItem>
                  </TextField>

                  <TextField
                    size="small"
                    type="number"
                    required
                    autoFocus
                    label="Amount (PKR) *"
                    inputProps={{ min: 0 }}
                    value={payForm.amountPaid}
                    onChange={(e) => setPayForm({ ...payForm, amountPaid: e.target.value })}
                  />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    select
                    size="small"
                    label="Payment Method"
                    disabled={payForm.entryType === 'Adjustment'}
                    value={payForm.paymentMethod}
                    onChange={(e) => setPayForm({ ...payForm, paymentMethod: e.target.value })}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer / Online</MenuItem>
                    <MenuItem value="Easypaisa / JazzCash">Easypaisa / JazzCash</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                  </TextField>

                  <TextField
                    size="small"
                    label="Reference / TXN #"
                    value={payForm.referenceNo}
                    onChange={(e) => setPayForm({ ...payForm, referenceNo: e.target.value })}
                  />
                </Box>

                <TextField
                  size="small"
                  label="Notes"
                  value={payForm.notes}
                  onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <AppButton intent="cancel" onClick={() => setPayDialogOpen(false)} disabled={savingPay}>
              Cancel
            </AppButton>
            <AppButton type="submit" intent="primary" startIcon={<DollarOutlined />} disabled={savingPay}>
              {savingPay ? 'Saving...' : 'Confirm Payment'}
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {bulkDeleteMode ? `Delete ${selected.length} Selected Job Cards?` : 'Delete Repair Job Record?'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {bulkDeleteMode ? (
              <>
                Are you sure you want to delete <strong>{selected.length}</strong> selected repair job card records? This action cannot be
                undone.
              </>
            ) : (
              <>
                Are you sure you want to delete repair record <strong>#{repairToDelete?.repairNo}</strong> for customer{' '}
                <strong>{repairToDelete?.customerName}</strong>?
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDelete}>
            Delete
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* ADD NEW MACHINE MODEL DIALOG */}
      <Dialog open={addModelDialogOpen} onClose={() => setAddModelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Machine Model</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the name of the machine model to save into your catalog.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Machine Model Name *"
            placeholder="e.g. Rehmat 26 Inch Heavy Duty Mower"
            value={newModelInput}
            onChange={(e) => setNewModelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveNewModel();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setAddModelDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="primary" onClick={handleSaveNewModel}>
            Save Model
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* PRINT JOB CARD INVOICE RECEIPT MODAL */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 4mm 5mm;
              }
              html, body {
                height: 100% !important;
                overflow: hidden !important;
              }
              #root { display: none !important; }
              body * {
                visibility: hidden !important;
              }
              #printable-repair-jobcard, #printable-repair-jobcard * {
                visibility: visible !important;
              }
              #printable-repair-jobcard {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 60px 4px 6px 4px !important;
                box-sizing: border-box !important;
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
            Machine Repairing Job Card Invoice Receipt
          </Typography>
          <Chip label="Repair Receipt" color="success" variant="light" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {printData && (
            <Box
              id="printable-repair-jobcard"
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
                {/* Customer & Job Metadata Card */}
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
                        <div>
                          <strong>Phone:</strong> {printData.customerPhone}
                        </div>
                        <div>
                          <strong>City / Address:</strong> {printData.cityAddress}
                        </div>
                      </div>
                    </div>

                    <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 700 }}>Job Card No:</span>
                        <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>{printData.repairNo}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                        <span style={{ fontWeight: 700, color: '#374151' }}>{printData.receivedDate}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Repair Status:</span>
                        <span style={{ fontWeight: 800, color: '#16a34a' }}>{printData.repairStatus || 'Received'}</span>
                      </div>
                    </div>
                  </div>

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
                    <span style={{ fontWeight: 700, color: '#166534', marginRight: '8px' }}>Machine Model Under Repair:</span>
                    <span style={{ fontWeight: 800, color: '#111827' }}>{printData.machineName || printData.machineModel}</span>
                  </div>
                </div>

                {/* Printable Parts & Rate Table */}
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
                        <strong>Specification</strong>
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
                    {printData.repairItems && printData.repairItems.length > 0 ? (
                      printData.repairItems.map((item, idx) => {
                        const itemQty = parseInt(item.qnty, 10) || 1;
                        const itemRate = parseFloat(item.rate) || 0;
                        const itemTotal = item.totalAmount || itemQty * itemRate;

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
                              {formatSr(idx + 1)}
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
                              {item.specification || item.itemName || item.model}
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
                              {formatSr(itemQty)}
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
                              {itemRate.toLocaleString()}
                            </td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                              {itemTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '3px 4px',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}
                        >
                          01
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
                          {printData.faultDescription || 'General Repair & Overhauling'}
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
                          01
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
                          {(printData.totalCost || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                          {(printData.totalCost || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}

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
                        {(printData.grossTotal || printData.totalCost || printData.subTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Advance, Discount & Balance Row */}
                <Box sx={{ bgcolor: 'transparent', py: 0.8, px: 1.2, borderRadius: 1, border: '1px solid #86efac', mb: 1.2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Box>
                      {printData.discountAmount > 0 && (
                        <Typography variant="body2" color="error.main" fontWeight={700} display="block">
                          DISCOUNT: -Rs. {printData.discountAmount.toLocaleString()}
                        </Typography>
                      )}
                      <Typography variant="caption" color="#4b5563" display="block">
                        PAID ADVANCE: Rs. {(printData.paidAmount || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" fontWeight={800} color="#166534" sx={{ lineHeight: 1.2 }}>
                        NET TOTAL: Rs. {(printData.totalCost || printData.subTotal || 0).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={800}
                        color={printData.balanceAmount > 0 ? '#dc2626' : '#16a34a'}
                        display="block"
                      >
                        {printData.balanceAmount > 0
                          ? `REMAINING DUE: Rs. ${printData.balanceAmount.toLocaleString()}`
                          : 'FULL PAID (NO DUES)'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Signature Row */}
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
          )}
        </DialogContent>

        <DialogActions
          className="no-print"
          sx={{
            p: 2,
            bgcolor: getSubSurfaceSx(theme).bgcolor,
            borderTop: '1px solid',
            borderColor: 'divider'
          }}
        >
          <AppButton intent="cancel" onClick={() => setPrintModalOpen(false)}>
            Close
          </AppButton>
          <AppButton intent="print" startIcon={<PrinterOutlined />} onClick={() => window.print()}>
            Print Job Card Invoice
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
