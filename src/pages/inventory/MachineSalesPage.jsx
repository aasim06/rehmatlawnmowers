import { useState, useRef } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import CeoSignature from 'components/CeoSignature';

// material-ui
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
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
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

// icons
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';
import { useTransparentLogo } from 'components/logo/LogoMain';

const defaultMachineModels = [
  'Rehmat 20" Lawn Mower (Petrol Engine)',
  'Rehmat Electric Lawn Cutter 18"',
  'Rehmat Heavy Duty Lawn Mower 24"',
  'Rehmat Grass Trimmer & Cutter 2-Stroke',
  'Rehmat Hand Push Lawn Roller Mower'
];

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
  return timeStr || '';
};

export default function MachineSalesPage() {
  const transparentLogo = useTransparentLogo(rehmatLogo);
  const {
    machineSales = [],
    machineModels = [],
    addMachineModel,
    addMachineSale,
    updateMachineSale,
    deleteMachineSale,
    deleteMultipleMachineSales
  } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selected, setSelected] = useState([]);

  // New Machine Model Dialog State
  const [newModelDialogOpen, setNewModelDialogOpen] = useState(false);
  const [newModelNameInput, setNewModelNameInput] = useState('');

  // Form State with Multi-Item Array Support
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    cityAddress: '',
    items: [
      {
        machineName: '',
        serialNo: '',
        qty: 1,
        unitPrice: 0,
        discount: 0
      }
    ],
    discountAmount: 0,
    paidAmount: 0,
    warrantyTerms: '1 Year Motor & Frame Free Service Warranty'
  });

  // Edit Drawer Form State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Print Invoice Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Filtered Sales List
  const filteredSales = machineSales.filter((item) => {
    const matchesSearch =
      (item.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.machineName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.cityAddress || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || item.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculations for Form
  const subTotalVal = form.items.reduce((sum, i) => {
    const q = parseInt(i.qty) || 1;
    const p = parseFloat(i.unitPrice) || 0;
    const discPercent = parseFloat(i.discount) || 0;
    const gross = q * p;
    const discAmount = (gross * discPercent) / 100;
    return sum + Math.max(0, gross - discAmount);
  }, 0);

  const paidVal = parseFloat(form.paidAmount) || 0;
  const balanceVal = Math.max(0, subTotalVal - paidVal);

  // New Model Handler
  const handleAddNewModelSubmit = (e) => {
    if (e) e.preventDefault();
    if (!newModelNameInput.trim()) return;
    addMachineModel(newModelNameInput.trim());
    setNewModelNameInput('');
    setNewModelDialogOpen(false);
  };

  // Multi-Item Handlers
  const handleAddItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          machineName: '',
          serialNo: '',
          qty: 1,
          unitPrice: 0,
          discount: 0
        }
      ]
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

  // Checkbox Selection
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(filteredSales.map((n) => n.id));
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

  // Submit New Sale Handler
  const handleCreateSale = async (e) => {
    if (e) e.preventDefault();
    if (!form.customerName.trim()) {
      alert('Please enter Customer Name');
      return;
    }

    const created = await addMachineSale({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      cityAddress: form.cityAddress,
      items: form.items,
      paidAmount: paidVal,
      warrantyTerms: form.warrantyTerms
    });

    setPrintData(created);
    setPrintModalOpen(true);

    // Reset Form
    setForm({
      customerName: '',
      customerPhone: '',
      cityAddress: '',
      items: [
        {
          machineName: '',
          serialNo: '',
          qty: 1,
          unitPrice: 0,
          discount: 0
        }
      ],
      paidAmount: 0,
      warrantyTerms: '1 Year Motor & Frame Free Service Warranty'
    });
  };

  // Open Edit Drawer
  const handleOpenEdit = (sale) => {
    const itemsArray = (sale.items && sale.items.length > 0) ? sale.items : [
      {
        machineName: sale.machineName,
        serialNo: sale.serialNo,
        qty: sale.qty,
        unitPrice: sale.unitPrice
      }
    ];

    setEditingSale({ ...sale, items: itemsArray });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingSale) return;

    const itemsList = (editingSale.items && editingSale.items.length > 0)
      ? editingSale.items.map((i) => {
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
          machineName: editingSale.machineName,
          serialNo: editingSale.serialNo,
          qty: parseInt(editingSale.qty) || 1,
          unitPrice: parseFloat(editingSale.unitPrice) || 0,
          discount: parseFloat(editingSale.discount) || 0,
          discountAmount: (((parseInt(editingSale.qty) || 1) * (parseFloat(editingSale.unitPrice) || 0)) * (parseFloat(editingSale.discount) || 0)) / 100,
          lineTotal: Math.max(0, ((parseInt(editingSale.qty) || 1) * (parseFloat(editingSale.unitPrice) || 0)) - ((((parseInt(editingSale.qty) || 1) * (parseFloat(editingSale.unitPrice) || 0)) * (parseFloat(editingSale.discount) || 0)) / 100))
        }];

    const subTotal = itemsList.reduce((sum, i) => sum + i.lineTotal, 0);
    const discSum = itemsList.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
    const total = subTotal;
    const totalQtySum = itemsList.reduce((sum, i) => sum + i.qty, 0);
    const paid = parseFloat(editingSale.paidAmount) || 0;
    const bal = Math.max(0, total - paid);
    const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    const firstMachine = itemsList[0] || {};

    updateMachineSale(editingSale.id, {
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
      return {
        ...prev,
        items: [
          ...(prev.items || []),
          { machineName: '', serialNo: '', qty: 1, unitPrice: 0, discount: 0 }
        ]
      };
    });
  };

  const handleRemoveEditItemRow = (index) => {
    setEditingSale((prev) => {
      if (!prev || (prev.items || []).length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, idx) => idx !== index)
      };
    });
  };

  // Delete Handlers
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

  // Open Print Modal for Row
  const handleOpenPrint = (sale) => {
    setPrintData(sale);
    setPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Stack spacing={3}>
      {/* 1. TOP SECTION: Record Machine Sale Card */}
      <MainCard
        title="Record Customer Machine Sale (Invoice Generator)"
        secondary={
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlusOutlined />}
            onClick={() => setNewModelDialogOpen(true)}
            sx={{ fontWeight: 700 }}
          >
            Add New Machine Model
          </Button>
        }
        sx={{
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)'),
          borderRadius: 2
        }}
      >
        <form onSubmit={handleCreateSale}>
          <Grid container spacing={2.5} alignItems="center">
            {/* ROW 1: Customer Details */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="CUSTOMER NAME *"
                fullWidth
                required
                placeholder="e.g. Asim Ameer"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="CUSTOMER PHONE NO"
                fullWidth
                placeholder="e.g. +92 300 1234567"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="CITY / ADDRESS"
                fullWidth
                placeholder="e.g. Lahore / Faisalabad"
                value={form.cityAddress}
                onChange={(e) => setForm({ ...form, cityAddress: e.target.value })}
              />
            </Grid>

            {/* ROW 2: Multi-Item Machine Rows Section */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc'), borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: 'primary.main' }}>
                  Machines Purchased ({form.items.length} Items)
                </Typography>

                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, bgcolor: 'background.paper', mb: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fafafa') }}>
                      <TableRow>
                        <TableCell style={{ width: '32%' }}><strong>MACHINE MODEL*</strong></TableCell>
                        <TableCell style={{ width: '18%' }}><strong>SERIAL NO</strong></TableCell>
                        <TableCell align="center" style={{ width: '8%' }}><strong>QTY *</strong></TableCell>
                        <TableCell align="right" style={{ width: '14%' }}><strong>RATE *</strong></TableCell>
                        <TableCell align="right" style={{ width: '12%' }}><strong>DISC (%)</strong></TableCell>
                        <TableCell align="right" style={{ width: '12%' }}><strong>TOTAL</strong></TableCell>
                        <TableCell align="center" style={{ width: '4%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {form.items.map((rowItem, idx) => {
                        const rowGross = (parseInt(rowItem.qty) || 1) * (parseFloat(rowItem.unitPrice) || 0);
                        const rowDiscPercent = parseFloat(rowItem.discount) || 0;
                        const rowDiscAmount = (rowGross * rowDiscPercent) / 100;
                        const rowLineTotal = Math.max(0, rowGross - rowDiscAmount);

                        return (
                          <TableRow key={idx}>
                            <TableCell>
                              <Autocomplete
                                freeSolo
                                options={machineModels}
                                value={rowItem.machineName}
                                onChange={(event, newValue) => handleItemRowChange(idx, 'machineName', newValue || '')}
                                onInputChange={(event, newInputValue) => handleItemRowChange(idx, 'machineName', newInputValue || '')}
                                renderInput={(params) => (
                                  <TextField
                                    {...params}
                                    placeholder="Select Model..."
                                    size="small"
                                    required
                                  />
                                )}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="RLM-2026-904"
                                value={rowItem.serialNo}
                                onChange={(e) => handleItemRowChange(idx, 'serialNo', e.target.value)}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                required
                                inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                value={rowItem.qty}
                                onChange={(e) => handleItemRowChange(idx, 'qty', parseInt(e.target.value) || 1)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                required
                                inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                value={rowItem.unitPrice}
                                onChange={(e) => handleItemRowChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <TextField
                                type="number"
                                size="small"
                                fullWidth
                                inputProps={{ min: 0, max: 100, style: { textAlign: 'right' } }}
                                InputProps={{
                                  endAdornment: <InputAdornment position="end">%</InputAdornment>
                                }}
                                placeholder="0"
                                value={rowItem.discount || ''}
                                onChange={(e) => handleItemRowChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                Rs. {rowLineTotal.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              {form.items.length > 1 && (
                                <IconButton color="error" size="small" onClick={() => handleRemoveItemRow(idx)}>
                                  <DeleteOutlined />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlusOutlined />}
                  onClick={handleAddItemRow}
                  sx={{ mt: 1, fontWeight: 700 }}
                >
                  Add Another Machine to Bill
                </Button>
              </Box>
            </Grid>

            {/* ROW 3: Financials & Balance Calculations */}
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                label="TOTAL INVOICE (RS.)"
                fullWidth
                value={`Rs. ${subTotalVal.toLocaleString()}`}
                InputProps={{
                  readOnly: true,
                  style: { fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }
                }}
                sx={{
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5'),
                  borderRadius: 1
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                label="PAID AMOUNT (RS.)"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <TextField
                label="REMAINING BALANCE"
                fullWidth
                value={`Rs. ${balanceVal.toLocaleString()}`}
                InputProps={{
                  readOnly: true,
                  style: { fontWeight: 800, color: balanceVal > 0 ? '#ef4444' : '#10b981', fontSize: '1.05rem' }
                }}
                sx={{
                  bgcolor: balanceVal > 0 ? (theme => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2') : (theme => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5'),
                  borderRadius: 1
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 3 }}>
              <Button
                variant="contained"
                type="submit"
                fullWidth
                startIcon={<FileTextOutlined />}
                sx={{
                  height: '41.38px',
                  bgcolor: '#52c41a',
                  '&:hover': { bgcolor: '#389e0d' },
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(82, 196, 26, 0.3)'
                }}
              >
                Generate Bill ({form.items.length} Machines) & Save
              </Button>
            </Grid>

            {/* ROW 4: Warranty Terms Note */}
            <Grid size={{ xs: 12 }}>
              <TextField
                label="WARRANTY & TERMS NOTE"
                fullWidth
                placeholder="e.g. 1 Year Motor & Frame Free Service Warranty"
                value={form.warrantyTerms}
                onChange={(e) => setForm({ ...form, warrantyTerms: e.target.value })}
              />
            </Grid>
          </Grid>
        </form>
      </MainCard>

      {/* 2. BOTTOM SECTION: Machine Sales History Logs Table Card */}
      <MainCard
        title="Machine Sales & Billing History Logs"
        secondary={
          selected.length > 0 && (
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
          <Grid size={{ xs: 12, sm: 6 }}>
            <OutlinedInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Customer, Phone, Machine Model, City..."
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              }
              sx={{ height: '42px', width: '100%' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '42px',
                  minHeight: '42px'
                }
              }}
            >
              <MenuItem value="ALL">All Payment Statuses</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Partial">Partial</MenuItem>
              <MenuItem value="Unpaid">Unpaid</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="textSecondary">
              Showing <strong>{filteredSales.length}</strong> Machine Sales Log Records
            </Typography>
          </Grid>
        </Grid>

        {/* Mobile View Cards */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {filteredSales.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No Machine Sales records found.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {filteredSales.map((sale) => {
                const isItemSel = isSelected(sale.id);
                return (
                  <Paper
                    key={sale.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isItemSel ? 'primary.main' : 'divider',
                      bgcolor: isItemSel ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                          {sale.saleNo || sale.id}
                        </Typography>
                        <Chip
                          label={sale.paymentStatus || 'Paid'}
                          color={sale.paymentStatus === 'Paid' ? 'success' : sale.paymentStatus === 'Partial' ? 'warning' : 'error'}
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </Stack>

                      <Box>
                        <Typography variant="h6" fontWeight={800}>
                          {sale.customerName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {sale.customerPhone ? `${sale.customerPhone} | ` : ''}{sale.cityAddress || 'Local'}
                        </Typography>
                      </Box>

                      <Box sx={{ bgcolor: 'action.hover', p: 1.25, borderRadius: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          📦 {sale.machineName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          Qty: {sale.qty || 1} {sale.serialNo ? `| S/N: ${sale.serialNo}` : ''}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            Bill: <strong>Rs. {(sale.lineTotal || sale.subTotal || 0).toLocaleString()}</strong>
                          </Typography>
                          <Typography variant="caption" color={sale.balanceAmount > 0 ? 'error.main' : 'success.main'} fontWeight={700}>
                            Bal: Rs. {(sale.balanceAmount || 0).toLocaleString()}
                          </Typography>
                        </Stack>
                      </Box>

                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ pt: 0.5 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<PrinterOutlined />}
                          onClick={() => handleOpenPrint(sale)}
                          sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        >
                          Print Bill
                        </Button>
                        <IconButton color="primary" size="small" onClick={() => handleOpenEdit(sale)}>
                          <EditOutlined />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => { setSaleToDelete(sale); setDeleteDialogOpen(true); }}>
                          <DeleteOutlined />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Desktop Table View */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < filteredSales.length}
                      checked={filteredSales.length > 0 && selected.length === filteredSales.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell>SALE NO / ID</TableCell>
                  <TableCell>CUSTOMER &amp; CITY</TableCell>
                  <TableCell>MACHINE MODEL &amp; QTY</TableCell>
                  <TableCell align="right">TOTAL BILL</TableCell>
                  <TableCell align="right">PAID</TableCell>
                  <TableCell align="right">BALANCE</TableCell>
                  <TableCell align="center">STATUS</TableCell>
                  <TableCell align="right">DATE &amp; TIME</TableCell>
                  <TableCell align="center">ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No Machine Sales records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => {
                    const isItemSel = isSelected(sale.id);
                    return (
                      <TableRow key={sale.id} hover selected={isItemSel} onClick={(e) => handleSelectOne(e, sale.id)}>
                        <TableCell padding="checkbox">
                          <Checkbox color="primary" checked={isItemSel} onChange={(e) => handleSelectOne(e, sale.id)} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                            {sale.saleNo || sale.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={800}>
                            {sale.customerName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {sale.customerPhone ? `${sale.customerPhone} | ` : ''}{sale.cityAddress || 'Lahore'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {sale.machineName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            Qty: <strong>{sale.qty || 1}</strong> {sale.serialNo ? `| S/N: ${sale.serialNo}` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={700} color="success.main">
                            Rs. {(sale.lineTotal || sale.subTotal || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            Rs. {(sale.paidAmount || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="subtitle2"
                            fontWeight={800}
                            color={sale.balanceAmount > 0 ? 'error.main' : 'success.main'}
                          >
                            Rs. {(sale.balanceAmount || 0).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={sale.paymentStatus || 'Paid'}
                            color={sale.paymentStatus === 'Paid' ? 'success' : sale.paymentStatus === 'Partial' ? 'warning' : 'error'}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="caption" color="textSecondary">
                            {formatFullDate(sale.time, sale.created_at || sale.dateISO)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Print Machine Invoice">
                              <IconButton color="info" size="small" onClick={() => handleOpenPrint(sale)}>
                                <PrinterOutlined />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Sale Record">
                              <IconButton color="primary" size="small" onClick={() => handleOpenEdit(sale)}>
                                <EditOutlined />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Sale Record">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => {
                                  setSaleToDelete(sale);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <DeleteOutlined />
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
        </Box>
      </MainCard>

      {/* ✏️ Edit Machine Sale Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 520 }, p: 3 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3, color: 'primary.main' }}>
            Edit Machine Sale Record
          </Typography>

          {editingSale && (
            <form onSubmit={handleEditSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Customer Name *"
                  fullWidth
                  required
                  value={editingSale.customerName || ''}
                  onChange={(e) => setEditingSale({ ...editingSale, customerName: e.target.value })}
                />
                <TextField
                  label="Customer Phone"
                  fullWidth
                  value={editingSale.customerPhone || ''}
                  onChange={(e) => setEditingSale({ ...editingSale, customerPhone: e.target.value })}
                />
                <TextField
                  label="City / Address"
                  fullWidth
                  value={editingSale.cityAddress || ''}
                  onChange={(e) => setEditingSale({ ...editingSale, cityAddress: e.target.value })}
                />

                <Typography variant="subtitle2" fontWeight={700}>
                  Purchased Machines ({(editingSale.items || []).length || 1} Items)
                </Typography>

                {(editingSale.items || []).map((editItem, idx) => (
                  <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack spacing={1.5}>
                      <Autocomplete
                        freeSolo
                        options={machineModels}
                        value={editItem.machineName || ''}
                        onChange={(event, newValue) => handleEditItemChange(idx, 'machineName', newValue || '')}
                        onInputChange={(event, newInputValue) => handleEditItemChange(idx, 'machineName', newInputValue || '')}
                        renderInput={(params) => <TextField {...params} label={`Machine Model #${idx + 1} *`} required size="small" />}
                      />
                      <Grid container spacing={1.5}>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Serial No"
                            size="small"
                            fullWidth
                            value={editItem.serialNo || ''}
                            onChange={(e) => handleEditItemChange(idx, 'serialNo', e.target.value)}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Qty"
                            type="number"
                            size="small"
                            fullWidth
                            required
                            inputProps={{ min: 1 }}
                            value={editItem.qty || 1}
                            onChange={(e) => handleEditItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Unit Price (PKR)"
                            type="number"
                            size="small"
                            fullWidth
                            required
                            value={editItem.unitPrice || 0}
                            onChange={(e) => handleEditItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <TextField
                            label="Discount (%)"
                            type="number"
                            size="small"
                            fullWidth
                            value={editItem.discount || 0}
                            onChange={(e) => handleEditItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                          />
                        </Grid>
                      </Grid>
                      {(editingSale.items || []).length > 1 && (
                        <Button color="error" size="small" onClick={() => handleRemoveEditItemRow(idx)}>
                          Remove Item Row
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                ))}

                <Button variant="outlined" size="small" onClick={handleAddEditItemRow}>
                  + Add Machine Row
                </Button>

                <TextField
                  label="Paid Amount (PKR)"
                  type="number"
                  fullWidth
                  value={editingSale.paidAmount || 0}
                  onChange={(e) => setEditingSale({ ...editingSale, paidAmount: parseFloat(e.target.value) || 0 })}
                />

                <TextField
                  label="Warranty Terms"
                  fullWidth
                  value={editingSale.warrantyTerms || ''}
                  onChange={(e) => setEditingSale({ ...editingSale, warrantyTerms: e.target.value })}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" type="submit" color="primary" sx={{ fontWeight: 700 }}>
                    Save Changes
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* 🗑️ Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Confirm Delete Sale Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the machine sale invoice for <strong>{saleToDelete?.customerName}</strong> ({saleToDelete?.machineName})?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete} sx={{ fontWeight: 700 }}>
            Delete Sale Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🗑️ Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Bulk Delete Selected Sales Records</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selected.length}</strong> selected machine sales records? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmBulkDelete} sx={{ fontWeight: 700 }}>
            Delete Selected Records ({selected.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Machine Model Dialog */}
      <Dialog open={newModelDialogOpen} onClose={() => setNewModelDialogOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddNewModelSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>⚙️ Add New Machine Model</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Add a new machine model to your master catalog dropdown list for quick invoice generation.
            </Typography>
            <TextField
              label="MACHINE MODEL NAME *"
              fullWidth
              required
              autoFocus
              placeholder="e.g. Rehmat 30'' Tractor Tow Lawn Mower"
              value={newModelNameInput}
              onChange={(e) => setNewModelNameInput(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setNewModelDialogOpen(false)} color="secondary">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              Save Machine Model
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* 📄 Printable Machine Sale Invoice Dialog */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
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
                padding: 10px !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              #printable-machine-invoice .watermark-logo {
                top: 58% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 390px !important;
                max-width: 70% !important;
                opacity: 0.15 !important;
              }
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
          <Typography variant="h5" fontWeight={700}>📄 Official Customer Machine Sale Invoice</Typography>
          <Chip label="Sales Invoice" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
          {printData && (() => {
            const displayItems = (printData.items && printData.items.length > 0) ? printData.items : [
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
                  p: { xs: 2, sm: 3 },
                  bgcolor: '#ffffff',
                  color: '#111827',
                  borderRadius: 1
                }}
              >
                {/* 🏢 Watermark Background Logo */}
                <Box
                  component="img"
                  className="watermark-logo"
                  src={transparentLogo || rehmatLogo}
                  alt="Watermark Logo"
                  sx={{
                    position: 'absolute',
                    top: '58%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '390px',
                    maxWidth: '70%',
                    opacity: 0.15,
                    pointerEvents: 'none',
                    zIndex: 0
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  {/* Brand Header with Emblem Logo */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
                    <Box
                      component="img"
                      src={transparentLogo || rehmatLogo}
                      alt="Rehmat Logo Emblem"
                      sx={{ width: 60, height: 60, objectFit: 'contain', borderRadius: '50%' }}
                    />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#10b981', lineHeight: 1.1, letterSpacing: '0.5px' }}>
                        REHMAT LAWN MOWERS
                      </Typography>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#047857', letterSpacing: '0.3px', mt: 0.3 }}>
                        FACTORY STORE MACHINE SALES & DISTRIBUTION
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        Official Machine Sales & Customer Invoice Statement
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="textSecondary" display="block">INVOICE NO:</Typography>
                      <Typography variant="subtitle2" fontWeight={700}>{printData.id}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>CUSTOMER NAME:</Typography>
                      <Typography variant="h5" fontWeight={800} color="primary.main">{printData.customerName}</Typography>
                      {printData.customerPhone && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Contact: {printData.customerPhone} | {printData.cityAddress}
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="textSecondary" display="block">DATE & TIME:</Typography>
                      <Typography variant="subtitle2" fontWeight={700}>{printData.time}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>PAYMENT STATUS:</Typography>
                      <Chip
                        label={printData.paymentStatus || 'Paid'}
                        color={printData.paymentStatus === 'Paid' ? 'success' : printData.paymentStatus === 'Partial' ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Grid>
                  </Grid>

                  {/* Multi-Item Machine Table */}
                  <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: 1, mb: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'transparent' }}>
                        <TableRow>
                          <TableCell><strong>#</strong></TableCell>
                          <TableCell><strong>MACHINE MODEL & SPECS</strong></TableCell>
                          <TableCell align="center"><strong>SERIAL NO</strong></TableCell>
                          <TableCell align="center"><strong>QTY</strong></TableCell>
                          <TableCell align="right"><strong>RATE</strong></TableCell>
                          <TableCell align="right"><strong>TOTAL AMOUNT</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayItems.map((item, idx) => {
                          const q = parseInt(item.qty) || 1;
                          const p = parseFloat(item.unitPrice) || 0;
                          const d = parseFloat(item.discount) || 0;
                          const gross = q * p;
                          const lineAmt = item.lineTotal !== undefined && !isNaN(item.lineTotal) ? item.lineTotal : Math.max(0, gross - (gross * d) / 100);

                          return (
                            <TableRow key={idx} hover>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" fontWeight={700}>{item.machineName || 'Machine'}</Typography>
                              </TableCell>
                              <TableCell align="center">{item.serialNo || 'N/A'}</TableCell>
                              <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                  {q}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">Rs. {p.toLocaleString()}</TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight={700}>
                                  Rs. {lineAmt.toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ bgcolor: 'transparent', p: 2, borderRadius: 1.5, border: '1px solid #a7f3d0', mb: 2 }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="textSecondary" display="block">TOTAL BILL: Rs. {(printData.lineTotal || 0).toLocaleString()}</Typography>
                        <Typography variant="caption" color="textSecondary" display="block">PAID AMOUNT: Rs. {(printData.paidAmount || 0).toLocaleString()}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="textSecondary" display="block">REMAINING BALANCE:</Typography>
                        <Typography variant="h3" fontWeight={800} color={(printData.balanceAmount || 0) > 0 ? '#dc2626' : '#059669'}>
                          Rs. {(printData.balanceAmount || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Signatures Footer */}
                  <Grid container spacing={3} sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e5e7eb' }}>
                    <Grid size={{ xs: 6 }} textAlign="center">
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ textDecoration: 'overline', pt: 2 }}>
                        Customer Signature / Receiver
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} textAlign="right">
                      <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                        <CeoSignature />
                      </Box>
                    </Grid>
                  </Grid>
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
            onClick={handlePrint}
            size="large"
            className="no-print"
            sx={{ px: 3, fontWeight: 700 }}
          >
            Print Customer Machine Bill
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
