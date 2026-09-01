import { useState, useRef } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { useDebounce } from 'hooks/useDebounce';

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
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
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
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  PrinterOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';

const REPAIR_STATUS_OPTIONS = ['Received', 'In Repair', 'Ready for Delivery', 'Delivered'];

export default function MachineRepairsPage() {
  const {
    machineRepairs = [],
    machineModels = [],
    items = [],
    masterItemNames = [],
    addMachineModel,
    addMachineRepair,
    updateMachineRepair,
    deleteMachineRepair
  } = useStoreInventory();

  const [addModelDialogOpen, setAddModelDialogOpen] = useState(false);
  const [newModelInput, setNewModelInput] = useState('');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [statusFilter, setStatusFilter] = useState('All');
  const [selected, setSelected] = useState([]);

  // Available Specifications / Parts list for auto-complete
  const availablePartNames = Array.from(
    new Set([
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
      'Complete Engine Overhaul Service',
      ...items.map((i) => i.name),
      ...(masterItemNames || []).map((m) => m.name)
    ])
  ).filter(Boolean);

  const defaultMachineList = [
    'Rehmat 20" Lawn Mower (Petrol Engine)',
    'Rehmat Electric Lawn Cutter 18"',
    'Rehmat Heavy Duty Lawn Mower 24"',
    'Rehmat Grass Trimmer & Cutter 2-Stroke',
    'Rehmat Hand Push Lawn Roller Mower',
    ...machineModels
  ];

  const uniqueMachineOptions = Array.from(new Set(defaultMachineList)).filter(Boolean);

  // Selection handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredRepairs.map((n) => n.id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (event, id) => {
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

  // Customer & Repair Form State
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    cityAddress: 'Lahore',
    machineModel: 'Rehmat 20" Lawn Mower (Petrol Engine)',
    faultDescription: 'General Servicing & Overhauling',
    discountAmount: 0,
    paidAmount: 0,
    repairStatus: 'Received',
    promisedDate: '1-2 Days',
    items: [
      {
        id: 'item-1',
        itemName: 'Gear set complete',
        qnty: 1,
        rate: 13500,
        totalAmount: 13500
      },
      {
        id: 'item-2',
        itemName: 'Chain set complete',
        qnty: 1,
        rate: 3500,
        totalAmount: 3500
      },
      {
        id: 'item-3',
        itemName: 'Bearing Complete',
        qnty: 1,
        rate: 3500,
        totalAmount: 3500
      },
      {
        id: 'item-4',
        itemName: 'Sharpness overhauling',
        qnty: 1,
        rate: 4000,
        totalAmount: 4000
      },
      {
        id: 'item-5',
        itemName: 'Labor charges',
        qnty: 1,
        rate: 8000,
        totalAmount: 8000
      }
    ]
  });

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [repairToDelete, setRepairToDelete] = useState(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  const customerInputRef = useRef(null);

  // Line item handlers
  const handleAddItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          itemName: '',
          qnty: 1,
          rate: 0,
          totalAmount: 0
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
      const currentRow = { ...updated[index], [field]: value };
      const q = parseInt(currentRow.qnty) || 1;
      const r = parseFloat(currentRow.rate) || 0;
      currentRow.totalAmount = q * r;
      updated[index] = currentRow;
      return { ...prev, items: updated };
    });
  };

  // Calculations
  const calculatedGrossTotal = form.items.reduce((sum, item) => {
    const q = parseInt(item.qnty) || 0;
    const r = parseFloat(item.rate) || 0;
    return sum + q * r;
  }, 0);

  const calculatedDiscount = Math.max(0, parseFloat(form.discountAmount) || 0);
  const calculatedNetTotal = Math.max(0, calculatedGrossTotal - calculatedDiscount);
  const calculatedBalance = Math.max(0, calculatedNetTotal - (parseFloat(form.paidAmount) || 0));

  // Handle Create Repair Job
  const handleSubmitRepair = async (e) => {
    e.preventDefault();
    if (!form.customerName.trim()) {
      alert('Please enter Customer Name!');
      return;
    }

    const formattedItems = form.items.map((i) => {
      const q = parseInt(i.qnty) || 1;
      const r = parseFloat(i.rate) || 0;
      return {
        id: i.id || `item-${Math.random()}`,
        itemName: i.itemName.trim() || 'Specification Item',
        specification: i.itemName.trim() || 'Specification Item',
        model: form.machineModel,
        qnty: q,
        rate: r,
        totalAmount: q * r
      };
    });

    const partsSummaryText = formattedItems.map((i) => `${i.specification} (${i.qnty}x @ Rs.${i.rate})`).join(', ');

    const created = await addMachineRepair({
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim() || 'N/A',
      cityAddress: form.cityAddress.trim() || 'Lahore',
      machineName: form.machineModel || 'Lawn Mower Machine',
      serialNo: 'N/A',
      faultDescription: `${form.faultDescription} | Details: ${partsSummaryText}`,
      partsCost: calculatedGrossTotal,
      discountAmount: calculatedDiscount,
      laborCost: 0,
      totalCost: calculatedNetTotal,
      paidAmount: parseFloat(form.paidAmount) || 0,
      balanceAmount: calculatedBalance,
      repairStatus: form.repairStatus,
      promisedDate: form.promisedDate,
      repairItems: formattedItems
    });

    setPrintData({
      ...created,
      machineModel: form.machineModel,
      faultDescription: form.faultDescription,
      repairItems: formattedItems,
      grossTotal: calculatedGrossTotal,
      discountAmount: calculatedDiscount,
      subTotal: calculatedNetTotal,
      balanceAmount: calculatedBalance
    });
    setPrintModalOpen(true);

    // Reset Form
    setForm({
      customerName: '',
      customerPhone: '',
      cityAddress: 'Lahore',
      machineModel: 'Rehmat 20" Lawn Mower (Petrol Engine)',
      faultDescription: 'General Servicing & Overhauling',
      discountAmount: 0,
      paidAmount: 0,
      repairStatus: 'Received',
      promisedDate: '1-2 Days',
      items: [
        {
          id: `item-${Date.now()}`,
          itemName: '',
          qnty: 1,
          rate: 0,
          totalAmount: 0
        }
      ]
    });
  };

  // Open Edit Drawer
  const handleOpenEdit = (repair) => {
    setEditingRepair({ ...repair });
    setEditDrawerOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingRepair) return;
    updateMachineRepair(editingRepair.id, editingRepair);
    setEditDrawerOpen(false);
  };

  // Delete Handler
  const handleOpenDelete = (repair) => {
    setRepairToDelete(repair);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (repairToDelete) {
      deleteMachineRepair(repairToDelete.id);
      setDeleteDialogOpen(false);
      setRepairToDelete(null);
    }
  };

  // Open Print Receipt Modal
  const handleOpenPrint = (repair) => {
    setPrintData(repair);
    setPrintModalOpen(true);
  };

  // Filtered Repair Records
  const filteredRepairs = machineRepairs.filter((r) => {
    const sTerm = (debouncedSearch || '').toLowerCase();
    const matchesSearch =
      (r.repairNo || '').toLowerCase().includes(sTerm) ||
      (r.customerName || '').toLowerCase().includes(sTerm) ||
      (r.customerPhone || '').toLowerCase().includes(sTerm) ||
      (r.machineName || '').toLowerCase().includes(sTerm) ||
      (r.faultDescription || '').toLowerCase().includes(sTerm);

    const matchesStatus = statusFilter === 'All' || r.repairStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Summary Metrics
  const totalRepairsCount = machineRepairs.length;
  const inRepairCount = machineRepairs.filter((r) => r.repairStatus === 'In Repair' || r.repairStatus === 'Received').length;
  const readyCount = machineRepairs.filter((r) => r.repairStatus === 'Ready for Delivery').length;
  const totalRepairRevenue = machineRepairs.reduce((sum, r) => sum + (parseFloat(r.paidAmount) || 0), 0);

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'Received':
        return 'warning';
      case 'In Repair':
        return 'primary';
      case 'Ready for Delivery':
        return 'success';
      case 'Delivered':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const formatSr = (num) => (num < 10 ? `0${num}` : `${num}`);

  return (
    <Stack spacing={3}>
      {/* 1. TOP METRICS SUMMARY CARDS */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard content={false} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>
                TOTAL REPAIR JOBS
              </Typography>
              <Typography variant="h4" fontWeight={800} color="primary.main">
                {totalRepairsCount}
              </Typography>
            </Box>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard content={false} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>
                IN REPAIR / PENDING
              </Typography>
              <Typography variant="h4" fontWeight={800} color="warning.main">
                {inRepairCount}
              </Typography>
            </Box>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard content={false} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>
                READY FOR DELIVERY
              </Typography>
              <Typography variant="h4" fontWeight={800} color="success.main">
                {readyCount}
              </Typography>
            </Box>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard content={false} sx={{ p: 2.5, borderRadius: 2 }}>
            <Box>
              <Typography variant="caption" color="textSecondary" fontWeight={600}>
                TOTAL REPAIR REVENUE
              </Typography>
              <Typography variant="h4" fontWeight={800} color="success.dark">
                Rs. {totalRepairRevenue.toLocaleString()}
              </Typography>
            </Box>
          </MainCard>
        </Grid>
      </Grid>

      {/* 2. RECORD MACHINE REPAIR FORM CARD */}
      <MainCard
        title="Record Machine Repairing Service & Job Card"
        sx={{
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)'),
          borderRadius: 2
        }}
      >
        <form onSubmit={handleSubmitRepair}>
          <Grid container spacing={2.5} alignItems="center">
            {/* ROW 1: Customer Details */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="CUSTOMER NAME *"
                fullWidth
                required
                inputRef={customerInputRef}
                placeholder="e.g. Tariq Mahmood"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="CUSTOMER PHONE NO *"
                fullWidth
                required
                placeholder="e.g. 0300-1234567"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="CITY / ADDRESS"
                fullWidth
                placeholder="e.g. Lahore / Multan Road"
                value={form.cityAddress}
                onChange={(e) => setForm({ ...form, cityAddress: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            {/* ROW 2: Machine Model & Fault / Problem Summary */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Autocomplete
                freeSolo
                options={uniqueMachineOptions}
                value={form.machineModel}
                onChange={(e, val) => setForm({ ...form, machineModel: val || '' })}
                onInputChange={(e, val) => setForm({ ...form, machineModel: val || '' })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px',
                    py: 0
                  }
                }}
                renderInput={(params) => (
                  <TextField {...params} label="MACHINE MODEL UNDER REPAIR *" required placeholder="Select or Type Machine Model" />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="REPORTED FAULT / PROBLEM SUMMARY"
                fullWidth
                placeholder="e.g. Starting issue, vibration, blade replacement..."
                value={form.faultDescription}
                onChange={(e) => setForm({ ...form, faultDescription: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            {/* ROW 3: Add Line Item Button & Specification Table */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ mb: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlusOutlined />}
                  onClick={handleAddItemRow}
                  sx={{
                    height: '34px',
                    fontWeight: 700,
                    borderRadius: 1,
                    color: 'success.dark',
                    borderColor: 'success.main',
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(82, 196, 26, 0.1)' : '#f6ffed'),
                    '&:hover': { bgcolor: 'success.lighter', borderColor: 'success.dark' }
                  }}
                >
                  Add Line Item
                </Button>
              </Box>

              <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc') }}>
                    <TableRow>
                      <TableCell align="center" style={{ width: '6%' }}><strong>Sr</strong></TableCell>
                      <TableCell style={{ width: '50%' }}><strong>Specification *</strong></TableCell>
                      <TableCell align="center" style={{ width: '12%' }}><strong>QTY *</strong></TableCell>
                      <TableCell align="right" style={{ width: '14%' }}><strong>Rate *</strong></TableCell>
                      <TableCell align="right" style={{ width: '14%' }}><strong>Total Amount</strong></TableCell>
                      <TableCell align="center" style={{ width: '4%' }}></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {form.items.map((rowItem, idx) => {
                      const qVal = parseInt(rowItem.qnty) || 0;
                      const rVal = parseFloat(rowItem.rate) || 0;
                      const rowTotal = qVal * rVal;

                      return (
                        <TableRow key={rowItem.id || idx} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          <TableCell align="center">
                            <Typography variant="body2" color="text.primary" fontWeight={800}>
                              {formatSr(idx + 1)}
                            </Typography>
                          </TableCell>

                          <TableCell>
                            <Autocomplete
                              freeSolo
                              size="small"
                              options={availablePartNames}
                              value={rowItem.itemName}
                              onChange={(e, val) => {
                                const strVal = typeof val === 'string' ? val : (val || '');
                                const matchedItem = items.find((i) => i.name.toLowerCase() === strVal.toLowerCase());
                                const updatedRate = matchedItem?.unitPrice ? matchedItem.unitPrice : rowItem.rate;
                                setForm((prev) => {
                                  const updated = [...prev.items];
                                  updated[idx] = {
                                    ...updated[idx],
                                    itemName: strVal,
                                    rate: updatedRate,
                                    totalAmount: (parseInt(updated[idx].qnty) || 1) * updatedRate
                                  };
                                  return { ...prev, items: updated };
                                });
                              }}
                              onInputChange={(e, val) => handleItemRowChange(idx, 'itemName', val)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: '41.38px',
                                  minHeight: '41.38px',
                                  py: 0
                                }
                              }}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  placeholder="Type or select specification (e.g. Gear set, Chain set, Bearing)..."
                                  required
                                />
                              )}
                            />
                          </TableCell>

                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              fullWidth
                              required
                              inputProps={{ min: 1, style: { textAlign: 'center', fontWeight: 700 } }}
                              value={rowItem.qnty}
                              onChange={(e) => handleItemRowChange(idx, 'qnty', parseInt(e.target.value) || 1)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: '41.38px',
                                  minHeight: '41.38px'
                                }
                              }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <TextField
                              type="number"
                              size="small"
                              fullWidth
                              required
                              inputProps={{ min: 0, step: 'any', style: { textAlign: 'right', fontWeight: 700 } }}
                              value={rowItem.rate}
                              onChange={(e) => handleItemRowChange(idx, 'rate', parseFloat(e.target.value) || 0)}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  height: '41.38px',
                                  minHeight: '41.38px'
                                }
                              }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                              {rowTotal.toLocaleString()}
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
            </Grid>

            {/* ROW 4: Totals, Discount & Status Action Row */}
            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                label="GROSS TOTAL (PKR)"
                fullWidth
                value={`Rs. ${calculatedGrossTotal.toLocaleString()}`}
                InputProps={{ readOnly: true, style: { fontWeight: 800, color: '#1890ff' } }}
                sx={{
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(24, 144, 255, 0.12)' : '#e6f7ff'),
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                label="DISCOUNT (PKR)"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                value={form.discountAmount}
                onChange={(e) => setForm({ ...form, discountAmount: parseFloat(e.target.value) || 0 })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                label="NET BILL AMOUNT (PKR)"
                fullWidth
                value={`Rs. ${calculatedNetTotal.toLocaleString()}`}
                InputProps={{ readOnly: true, style: { fontWeight: 800, color: '#10b981' } }}
                sx={{
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5'),
                  borderRadius: 1,
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                label="PAID ADVANCE (PKR)"
                type="number"
                fullWidth
                inputProps={{ min: 0 }}
                value={form.paidAmount}
                onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
              <TextField
                label="REMAINING BALANCE"
                fullWidth
                value={`Rs. ${calculatedBalance.toLocaleString()}`}
                InputProps={{ readOnly: true, style: { fontWeight: 800, color: calculatedBalance > 0 ? '#ff4d4f' : '#52c41a' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="REPAIR STATUS"
                select
                fullWidth
                value={form.repairStatus}
                onChange={(e) => setForm({ ...form, repairStatus: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              >
                {REPAIR_STATUS_OPTIONS.map((st) => (
                  <MenuItem key={st} value={st}>
                    {st}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                type="submit"
                fullWidth
                startIcon={<PlusOutlined />}
                sx={{
                  height: '41.38px',
                  bgcolor: '#1890ff',
                  '&:hover': { bgcolor: '#096dd9' },
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(24, 144, 255, 0.3)'
                }}
              >
                Confirm Repair Job Card & Save Receipt
              </Button>
            </Grid>
          </Grid>
        </form>
      </MainCard>

      {/* 3. REPAIR RECORDS TABLE CARD */}
      <MainCard
        title="Machine Repairing & Job Card Ledgers"
        secondary={
          selected.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={() => {
                if (window.confirm(`Delete ${selected.length} selected job card records?`)) {
                  selected.forEach((id) => deleteMachineRepair(id));
                  setSelected([]);
                }
              }}
              size="small"
              sx={{ fontWeight: 700 }}
            >
              Delete Selected ({selected.length})
            </Button>
          )
        }
      >
        {/* Search & Filter Toolbar */}
        <Grid container spacing={2} sx={{ mb: 2.5, alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <OutlinedInput
              fullWidth
              placeholder="Search by Job No (e.g. REP-1001), Customer, Phone, Model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              }
              sx={{
                height: '41.38px',
                minHeight: '41.38px'
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              fullWidth
              label="Filter By Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '41.38px',
                  minHeight: '41.38px'
                }
              }}
            >
              <MenuItem value="All">All Statuses ({machineRepairs.length})</MenuItem>
              {REPAIR_STATUS_OPTIONS.map((st) => (
                <MenuItem key={st} value={st}>
                  {st} ({machineRepairs.filter((r) => r.repairStatus === st).length})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Typography variant="caption" color="textSecondary" fontWeight={600}>
              {selected.length > 0 ? (
                <strong style={{ color: '#ff4d4f' }}>{selected.length} records selected</strong>
              ) : (
                `Showing ${filteredRepairs.length} of ${machineRepairs.length} Job Cards`
              )}
            </Typography>
          </Grid>
        </Grid>

        {/* Repair Records Ledger Table */}
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Table sx={{ minWidth: 900 }}>
            <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#f8fafc') }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredRepairs.length}
                    checked={filteredRepairs.length > 0 && selected.length === filteredRepairs.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell><strong>JOB NO & DATE</strong></TableCell>
                <TableCell><strong>CUSTOMER DETAILS</strong></TableCell>
                <TableCell><strong>MACHINE MODEL</strong></TableCell>
                <TableCell><strong>SPECIFICATION & REPAIR BREAKDOWN</strong></TableCell>
                <TableCell align="right"><strong>TOTAL BILL</strong></TableCell>
                <TableCell align="center"><strong>PAYMENT STATUS</strong></TableCell>
                <TableCell align="center"><strong>JOB STATUS</strong></TableCell>
                <TableCell align="center"><strong>ACTIONS</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRepairs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1" color="textSecondary" fontWeight={600}>
                      No machine repair job cards found matching your search.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRepairs.map((repair) => {
                  const isItemSelected = isSelected(repair.id);
                  const itemsList = repair.repairItems && Array.isArray(repair.repairItems) ? repair.repairItems : [];
                  const displayedParts = itemsList.slice(0, 3);
                  const remainingPartsCount = itemsList.length - 3;

                  return (
                    <TableRow key={repair.id} hover selected={isItemSelected} sx={{ verticalAlign: 'middle' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={(e) => handleSelectOne(e, repair.id)}
                        />
                      </TableCell>

                      {/* 1. Job No & Date */}
                      <TableCell>
                        <Chip
                          label={repair.repairNo}
                          color="primary"
                          variant="filled"
                          size="small"
                          sx={{ fontWeight: 800, borderRadius: 1 }}
                        />
                        <Typography variant="caption" display="block" color="textSecondary" sx={{ mt: 0.5, fontWeight: 500 }}>
                          {repair.receivedDate}
                        </Typography>
                      </TableCell>

                      {/* 2. Customer Details */}
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {repair.customerName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {repair.customerPhone}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {repair.cityAddress}
                        </Typography>
                      </TableCell>

                      {/* 3. Machine Model */}
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.dark">
                          {repair.machineName || 'Lawn Mower'}
                        </Typography>
                      </TableCell>

                      {/* 4. Specification Breakdown Tags */}
                      <TableCell sx={{ maxWidth: 260 }}>
                        {itemsList.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {displayedParts.map((part, pIdx) => (
                              <Chip
                                key={pIdx}
                                label={`${part.specification || part.itemName || 'Item'} × ${part.qnty || 1}`}
                                size="small"
                                variant="outlined"
                                color="default"
                                sx={{
                                  height: 22,
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9')
                                }}
                              />
                            ))}
                            {remainingPartsCount > 0 && (
                              <Chip
                                label={`+${remainingPartsCount} more`}
                                size="small"
                                color="info"
                                variant="outlined"
                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
                              />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            {repair.faultDescription || 'General Repair & Service'}
                          </Typography>
                        )}
                      </TableCell>

                      {/* 5. Total Bill */}
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                          Rs. {(repair.totalCost || 0).toLocaleString()}
                        </Typography>
                        {repair.discountAmount > 0 && (
                          <Typography variant="caption" display="block" color="error.main" fontWeight={600}>
                            Disc: -Rs. {repair.discountAmount.toLocaleString()}
                          </Typography>
                        )}
                      </TableCell>

                      {/* 6. Payment Status */}
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          Paid: Rs. {(repair.paidAmount || 0).toLocaleString()}
                        </Typography>
                        {repair.balanceAmount > 0 ? (
                          <Chip
                            label={`Due: Rs. ${repair.balanceAmount.toLocaleString()}`}
                            color="error"
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, mt: 0.5 }}
                          />
                        ) : (
                          <Chip
                            label="Full Paid"
                            color="success"
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem', fontWeight: 800, mt: 0.5 }}
                          />
                        )}
                      </TableCell>

                      {/* 7. Job Status */}
                      <TableCell align="center">
                        <Chip
                          label={repair.repairStatus}
                          color={getStatusChipColor(repair.repairStatus)}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: 1 }}
                        />
                      </TableCell>

                      {/* 8. Actions */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Print Job Card Receipt">
                            <IconButton color="info" size="small" onClick={() => handleOpenPrint(repair)}>
                              <PrinterOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Status / Payment">
                            <IconButton color="primary" size="small" onClick={() => handleOpenEdit(repair)}>
                              <EditOutlined />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Record">
                            <IconButton color="error" size="small" onClick={() => handleOpenDelete(repair)}>
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
      </MainCard>

      {/* EDIT DRAWER */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: 380, p: 3 }}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Edit Repair Job Card #{editingRepair?.repairNo}
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {editingRepair && (
            <form onSubmit={handleSaveEdit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Repair Status"
                  select
                  fullWidth
                  value={editingRepair.repairStatus || 'Received'}
                  onChange={(e) => setEditingRepair({ ...editingRepair, repairStatus: e.target.value })}
                >
                  {REPAIR_STATUS_OPTIONS.map((st) => (
                    <MenuItem key={st} value={st}>
                      {st}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Paid Amount (PKR)"
                  type="number"
                  fullWidth
                  value={editingRepair.paidAmount || 0}
                  onChange={(e) => setEditingRepair({ ...editingRepair, paidAmount: parseFloat(e.target.value) || 0 })}
                />

                <Button variant="contained" type="submit" fullWidth sx={{ height: 44, fontWeight: 700 }}>
                  Update Job Card
                </Button>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Repair Job Record?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete repair record <strong>#{repairToDelete?.repairNo}</strong> for customer{' '}
            <strong>{repairToDelete?.customerName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ADD NEW MACHINE MODEL DIALOG */}
      <Dialog open={addModelDialogOpen} onClose={() => setAddModelDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Machine Model</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Enter the name of the machine model to save into your catalog.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Machine Model Name *"
            placeholder="e.g. Rehmat 26 Inch Heavy Duty Mower"
            value={newModelInput}
            onChange={(e) => setNewModelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (newModelInput.trim()) {
                  addMachineModel(newModelInput.trim());
                  setForm((prev) => ({ ...prev, machineModel: newModelInput.trim() }));
                  setNewModelInput('');
                  setAddModelDialogOpen(false);
                }
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                height: '41.38px',
                minHeight: '41.38px'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAddModelDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              if (!newModelInput.trim()) return;
              addMachineModel(newModelInput.trim());
              setForm((prev) => ({ ...prev, machineModel: newModelInput.trim() }));
              setNewModelInput('');
              setAddModelDialogOpen(false);
            }}
            sx={{ fontWeight: 700 }}
          >
            Save Model
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRINT JOB CARD INVOICE RECEIPT MODAL (EXACT MATCH WITH IMAGE 1) */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: auto;
                margin: 8mm;
              }
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

        <DialogTitle component="div" className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>Machine Repairing Job Card Invoice Receipt</Typography>
          <Chip label="Repair Receipt" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {printData && (
            <Box id="printable-repair-jobcard" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
              {/* Watermark Background Logo */}
              <Box
                component="img"
                src={rehmatLogo}
                alt="Watermark Logo"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '60%',
                  maxWidth: 420,
                  opacity: 0.08,
                  pointerEvents: 'none',
                  zIndex: 0,
                  borderRadius: '50%'
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h3" fontWeight={800} align="center" sx={{ color: '#10b981', mb: 0.5, letterSpacing: '0.5px' }}>
                  REHMAT LAWN MOWERS
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} align="center" sx={{ color: '#10b981', mb: 1.5 }}>
                  FACTORY STORE REPAIRING & SERVICE
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                {/* Structured Professional Customer & Job Metadata Card */}
                <div style={{
                  border: '1.5px solid #111827',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  backgroundColor: '#ffffff',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                    {/* Left Column: Customer Details */}
                    <div style={{ flex: '1.2', padding: '10px 14px', borderRight: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                        Customer Details
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                        {printData.customerName}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.6' }}>
                        <div><strong>Phone:</strong> {printData.customerPhone}</div>
                        <div><strong>City / Address:</strong> {printData.cityAddress}</div>
                      </div>
                    </div>

                    {/* Right Column: Job Card Meta */}
                    <div style={{ flex: '1', padding: '10px 14px', backgroundColor: '#f9fafb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 700 }}>Job Card No:</span>
                        <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.95rem' }}>{printData.repairNo}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                        <span style={{ fontWeight: 700, color: '#374151' }}>{printData.receivedDate}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Repair Status:</span>
                        <span style={{ fontWeight: 800, color: '#16a34a' }}>{printData.repairStatus || 'Received'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Machine Model Highlight Strip */}
                  <div style={{ padding: '7px 14px', backgroundColor: '#f0fdf4', borderTop: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: 700, color: '#166534', marginRight: '8px' }}>Machine Model Under Repair:</span>
                    <span style={{ fontWeight: 800, color: '#111827' }}>{printData.machineName || printData.machineModel}</span>
                  </div>
                </div>

                {/* EXACT TABLE AS SHOWN IN IMAGE 1 (Sr | Specification | QTY | Rate | Total Amount) */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: '#f9fafb' }}>
                      <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '8px 4px', textAlign: 'center', fontSize: '0.95rem' }}>
                        <strong>Sr</strong>
                      </th>
                      <th style={{ width: '52%', borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontSize: '0.95rem' }}>
                        <strong>Specification</strong>
                      </th>
                      <th style={{ width: '12%', borderRight: '1.5px solid #111827', padding: '8px 6px', textAlign: 'center', fontSize: '0.95rem' }}>
                        <strong>QTY</strong>
                      </th>
                      <th style={{ width: '14%', borderRight: '1.5px solid #111827', padding: '8px 8px', textAlign: 'center', fontSize: '0.95rem' }}>
                        <strong>Rate</strong>
                      </th>
                      <th style={{ width: '14%', padding: '8px 8px', textAlign: 'center', fontSize: '0.95rem' }}>
                        <strong>Total Amount</strong>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {printData.repairItems && printData.repairItems.length > 0 ? (
                      printData.repairItems.map((item, idx) => {
                        const itemQty = parseInt(item.qnty) || 1;
                        const itemRate = parseFloat(item.rate) || 0;
                        const itemTotal = item.totalAmount || (itemQty * itemRate);

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #111827' }}>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                              {formatSr(idx + 1)}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>
                              {item.specification || item.itemName || item.model}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 6px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                              {formatSr(itemQty)}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                              {itemRate.toLocaleString()}
                            </td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                              {itemTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr style={{ borderBottom: '1px solid #111827' }}>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 4px', textAlign: 'center', fontWeight: 800 }}>
                          01
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'left', fontWeight: 600 }}>
                          {printData.faultDescription || 'General Repair & Overhauling'}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 6px', textAlign: 'center', fontWeight: 800 }}>
                          01
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'right', fontWeight: 800 }}>
                          {(printData.totalCost || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800 }}>
                          {(printData.totalCost || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* Total Amount Bottom Row */}
                    <tr style={{ backgroundColor: '#fcfcfc', borderTop: '1.5px solid #111827' }}>
                      <td colSpan={2} style={{ borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>
                        Total amount
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '8px' }}></td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '8px' }}></td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#111827' }}>
                        {(printData.grossTotal || printData.totalCost || printData.subTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Advance, Discount & Balance Row */}
                <Box sx={{ bgcolor: '#f0fdf4', p: 1.5, borderRadius: 1, border: '1px solid #86efac', mb: 2 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid size={{ xs: 6 }}>
                      {printData.discountAmount > 0 && (
                        <Typography variant="subtitle2" color="error.main" fontWeight={700} display="block">
                          DISCOUNT: -Rs. {printData.discountAmount.toLocaleString()}
                        </Typography>
                      )}
                      <Typography variant="caption" color="textSecondary" display="block">
                        PAID ADVANCE: Rs. {(printData.paidAmount || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" fontWeight={800} color="success.dark">
                        NET TOTAL: Rs. {(printData.totalCost || printData.subTotal || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} color={printData.balanceAmount > 0 ? 'error.main' : 'success.main'}>
                        {printData.balanceAmount > 0 ? `REMAINING DUE: Rs. ${printData.balanceAmount.toLocaleString()}` : 'FULL PAID (NO DUES)'}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {/* Signature Row */}
                <Grid container spacing={2} sx={{ mt: 3, pt: 2 }}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 1, width: 180 }}>
                      Customer Signature
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 1, width: 180, ml: 'auto' }}>
                      Authorized Store Incharge
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions className="no-print" sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'), borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setPrintModalOpen(false)} color="secondary">
            Close
          </Button>
          <Button variant="contained" color="success" startIcon={<PrinterOutlined />} onClick={() => window.print()} sx={{ fontWeight: 700 }}>
            Print Job Card Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
