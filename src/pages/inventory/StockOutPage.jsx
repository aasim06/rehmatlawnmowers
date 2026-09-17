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
import { ExportOutlined, SearchOutlined, ArrowDownOutlined, DeleteOutlined, EditOutlined, PlusOutlined, PrinterOutlined, SendOutlined, CheckCircleOutlined, BellOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';
import { useTransparentLogo } from 'components/logo/LogoMain';
import usePermission from 'hooks/usePermission';

export default function StockOutPage() {
  const transparentLogo = useTransparentLogo(rehmatLogo);
  const { canDelete, canEditPrice, isStoreKeeper } = usePermission();
  const { items = [], vendors = [], masterItemNames = [], categories = [], usageLogs = [], issueStock, deleteLog, updateLog, deleteMultipleLogs, addNotification } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selected, setSelected] = useState([]);
  const itemSelectRef = useRef(null);
  const qtyRef = useRef(null);

  // Available customer/parties list from real Vendors & Parties added by user
  const partyList = (vendors || []).map((v) => v.name).filter(Boolean);

  // Category options list from StoreInventoryContext
  const categoryOptions = Array.from(
    new Set([
      'General',
      ...(categories || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    ])
  );

  // Add Stock Out Drawer Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    itemName: '',
    category: 'General',
    qty: 1,
    unitPrice: 0
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

  // Send Alert / Request to Admin State
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({
    type: '⚠️ Low Stock Reorder Alert',
    message: ''
  });
  const [notifSuccess, setNotifSuccess] = useState(false);

  const handleSendNotif = (e) => {
    e.preventDefault();
    if (!notifForm.message.trim()) return;

    if (addNotification) {
      addNotification({
        title: notifForm.type,
        message: notifForm.message,
        type: notifForm.type.includes('Low Stock') ? 'alert' : 'request',
        senderName: 'Store Keeper Ali',
        senderRole: 'Store Keeper'
      });
    }

    setNotifSuccess(true);
    setTimeout(() => {
      setNotifSuccess(false);
      setNotifDialogOpen(false);
      setNotifForm({ type: '⚠️ Low Stock Reorder Alert', message: '' });
    }, 1000);
  };

  // Filter logs for OUT transactions
  const stockOutLogs = usageLogs.filter(
    (log) =>
      log.type && log.type.toUpperCase().includes('OUT') &&
      (selectedCategory === 'All' || (log.category || 'General') === selectedCategory) &&
      ((log.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.usedBy && log.usedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.department && log.department.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Combine all items list from store items and master item names for complete dropdown options
  const existingNamesList = Array.from(
    new Set([
      ...items.map((i) => i.name),
      ...(masterItemNames || []).map((m) => m.name)
    ])
  ).filter(Boolean);

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = stockOutLogs.map((n) => n.id);
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

  // Auto-fill unit price and category when selecting item name
  const handleItemNameChange = (event, newInputValue) => {
    const val = typeof newInputValue === 'string' ? newInputValue : (newInputValue?.name || '');
    const matchedItem = items.find((i) => i.name.toLowerCase() === val.toLowerCase());
    if (matchedItem) {
      setForm((prev) => ({
        ...prev,
        itemName: val,
        category: matchedItem.category || prev.category || 'General',
        unitPrice: matchedItem.unitPrice || 0
      }));
    } else {
      const matchedMaster = (masterItemNames || []).find((m) => m.name.toLowerCase() === val.toLowerCase());
      setForm((prev) => ({
        ...prev,
        itemName: val,
        category: matchedMaster?.category || prev.category || 'General',
        unitPrice: 0
      }));
    }
  };

  // Quick Add Item to Table below (triggered when pressing Enter on QTY field)
  const handleQuickAddToList = () => {
    if (!form.itemName.trim()) return;

    const targetItem = items.find((i) => i.name.toLowerCase() === form.itemName.toLowerCase());

    if (!targetItem) {
      alert('Selected item is not in store inventory!');
      return;
    }

    const qtyVal = parseInt(form.qty) || 1;
    const priceVal = parseFloat(form.unitPrice) > 0 ? parseFloat(form.unitPrice) : (targetItem.unitPrice || 0);

    const success = issueStock(
      targetItem.id,
      qtyVal,
      form.customer,
      'Sales / Issuance',
      'Store Keeper',
      `Unit Price: ${priceVal}`,
      priceVal,
      form.category || targetItem.category || 'General'
    );
    if (success) {
      setForm((prev) => ({
        ...prev,
        itemName: '',
        category: 'General',
        qty: 1,
        unitPrice: 0
      }));

      // Auto-focus back to ITEM SELECT for non-stop typing
      setTimeout(() => {
        if (itemSelectRef.current) {
          itemSelectRef.current.focus();
        }
      }, 50);
    } else {
      alert('Cannot issue stock. Insufficient available quantity!');
    }
  };

  // Mouse Click Handler on Red Save Button (Triggers Print Customer Invoice Modal)
  const handleSaveButtonClick = () => {
    const targetItem = items.find((i) => i.name.toLowerCase() === form.itemName.toLowerCase());
    const qtyVal = parseInt(form.qty) || 1;
    const priceVal = parseFloat(form.unitPrice) > 0 ? parseFloat(form.unitPrice) : (targetItem?.unitPrice || 0);
    const lineTotalVal = qtyVal * priceVal;

    if (form.itemName.trim()) {
      handleQuickAddToList();
    }

    setPrintData({
      id: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: 'Stock Out (Sales Invoice)',
      customer: form.customer,
      itemName: form.itemName,
      qty: qtyVal,
      unitPrice: priceVal,
      lineTotal: lineTotalVal,
      time: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    });

    setPrintModalOpen(true);
  };

  // Submit Add Stock Out Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.itemName.trim()) return;

    const targetItem = items.find((i) => i.name.toLowerCase() === form.itemName.toLowerCase());

    if (!targetItem) {
      alert('Selected item is not in store inventory!');
      return;
    }

    const qtyVal = parseInt(form.qty) || 1;
    const priceVal = parseFloat(form.unitPrice) > 0 ? parseFloat(form.unitPrice) : (targetItem.unitPrice || 0);
    const lineTotalVal = qtyVal * priceVal;
    const invCode = `INV-${Math.floor(10000 + Math.random() * 90000)}`;

    const success = issueStock(
      targetItem.id,
      qtyVal,
      form.customer,
      'Sales / Issuance',
      'Store Keeper',
      `Unit Price: ${priceVal}`,
      priceVal,
      form.category || targetItem.category || 'General'
    );
    if (success) {
      setDrawerOpen(false);

      // Set Invoice Receipt Data for Modal
      setPrintData({
        id: invCode,
        type: 'Stock Out (Sales Invoice)',
        customer: form.customer,
        itemName: form.itemName,
        qty: qtyVal,
        unitPrice: priceVal,
        lineTotal: lineTotalVal,
        time: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      });

      setForm({
        customer: '',
        itemName: '',
        category: 'General',
        qty: 1,
        unitPrice: 0
      });

      setPrintModalOpen(true);
    } else {
      alert('Cannot issue stock. Insufficient available quantity!');
    }
  };

  // Open Print Modal for Row Log
  const handleOpenPrint = (log) => {
    const matchedItem = items.find((i) => i.name.toLowerCase() === (log.itemName || '').toLowerCase());
    const unitPriceVal = (log.unitPrice && log.unitPrice > 0) ? log.unitPrice : (matchedItem?.unitPrice || 0);
    const lineTotalVal = (log.lineTotal && log.lineTotal > 0) ? log.lineTotal : (log.qtyUsed * unitPriceVal);

    setPrintData({
      id: log.itemCode || `INV-${log.id}`,
      type: 'Sales Invoice Receipt',
      customer: log.usedBy || log.department || 'Customer',
      itemName: log.itemName,
      qty: log.qtyUsed,
      unitPrice: unitPriceVal,
      lineTotal: lineTotalVal,
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
    setEditingLog({
      ...log,
      customer: log.usedBy || partyList[0],
      qty: log.qtyUsed || 1,
      unitPrice: log.unitPrice || 0
    });
    setEditDrawerOpen(true);
  };

  // Submit Edit Handler
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingLog) return;

    const qtyVal = parseInt(editingLog.qty) || 1;
    const priceVal = parseFloat(editingLog.unitPrice) || 0;

    updateLog(editingLog.id, {
      itemName: editingLog.itemName,
      usedBy: editingLog.customer,
      qtyUsed: qtyVal,
      unitPrice: priceVal,
      lineTotal: qtyVal * priceVal
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

  const lineTotal = (parseInt(form.qty) || 0) * (parseFloat(form.unitPrice) || 0);

  return (
    <Stack spacing={3}>
      {/* 1. TOP SECTION: Record Stock Out Form Card */}
      <MainCard
        title="Record Stock Out (Sales / Usage Invoice)"
        sx={{
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)'),
          borderRadius: 2
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleQuickAddToList(); }}>
          <Grid container spacing={2} alignItems="center">
            {/* 1. SELECT CUSTOMER / RECEIVED BY */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                freeSolo
                options={partyList}
                value={form.customer}
                onChange={(event, newValue) => {
                  const val = typeof newValue === 'string' ? newValue : (newValue || '');
                  setForm((prev) => ({ ...prev, customer: val }));
                }}
                onInputChange={(event, newInputValue) => {
                  setForm((prev) => ({ ...prev, customer: newInputValue }));
                }}
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
                    label="SELECT RECIPIENT / WORKER NAME *"
                    required
                    placeholder="Select or Type Recipient / Worker Name"
                  />
                )}
              />
            </Grid>

            {/* 2. ITEM SELECT */}
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Autocomplete
                freeSolo
                options={existingNamesList}
                value={form.itemName}
                onChange={(event, newValue) => handleItemNameChange(event, newValue)}
                onInputChange={(event, newInputValue) => handleItemNameChange(event, newInputValue)}
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
                    inputRef={itemSelectRef}
                    label="ITEM SELECT *"
                    required
                    placeholder="Select Item"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (qtyRef.current) {
                          qtyRef.current.focus();
                          qtyRef.current.select();
                        }
                      }
                    }}
                  />
                )}
              />
            </Grid>

            {/* 3. CATEGORY SELECT */}
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
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
                    height: '41.38px',
                    minHeight: '41.38px',
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

            {/* 4. QTY */}
            <Grid size={{ xs: 12, sm: 3, md: 1.5 }}>
              <TextField
                label="QTY *"
                type="number"
                fullWidth
                required
                inputRef={qtyRef}
                inputProps={{ min: 1 }}
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: parseInt(e.target.value) || 1 })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddToList();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '41.38px',
                    minHeight: '41.38px'
                  }
                }}
              />
            </Grid>

            {/* 5. SAVE BUTTON */}
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <Button
                variant="contained"
                type="button"
                onClick={handleSaveButtonClick}
                fullWidth
                startIcon={<ExportOutlined />}
                sx={{
                  height: '41.38px',
                  bgcolor: '#ff4d4f',
                  '&:hover': { bgcolor: '#d9363e' },
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 14px rgba(255, 77, 79, 0.3)'
                }}
              >
                Save Invoice
              </Button>
            </Grid>
          </Grid>
        </form>
      </MainCard>

      {/* 2. BOTTOM SECTION: Stock Out Logs Table Card */}
      <MainCard
        title="Stock Out (Sales / Usage Logs)"
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
          <Grid size={{ xs: 12, sm: 5 }}>
            <OutlinedInput
              fullWidth
              size="small"
              placeholder="Search Stock Out logs by Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              }
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
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

          <Grid size={{ xs: 12, sm: 3 }} sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="textSecondary">
              {selected.length > 0 ? (
                <strong style={{ color: '#ff4d4f' }}>{selected.length} records selected for deletion</strong>
              ) : (
                `Total ${stockOutLogs.length} Stock Out Records`
              )}
            </Typography>
          </Grid>
        </Grid>

        {/* Mobile Summary Cards (Visible on xs & sm viewports) */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {stockOutLogs.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No Stock Out usage records found.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {stockOutLogs.map((log) => {
                const isItemSelected = isSelected(log.id);
                return (
                  <Paper
                    key={log.id}
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      borderColor: isItemSelected ? 'primary.main' : 'divider',
                      bgcolor: isItemSelected ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={log.usedBy || log.department || 'Recipient'}
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {log.time}
                        </Typography>
                      </Stack>

                      <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle1" fontWeight={700}>
                            {log.itemName}
                          </Typography>
                          <Chip label={log.category || 'General'} size="small" variant="outlined" color="primary" />
                        </Stack>
                        <Typography variant="caption" color="textSecondary">
                          Code: {log.itemCode || log.id}
                        </Typography>
                      </Box>

                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'action.hover', p: 1.25, borderRadius: 1.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Qty Issued: <strong style={{ color: '#ff4d4f' }}>-{log.qtyUsed}</strong>
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={800} color="error.main">
                          Rs. {((log.qtyUsed || 1) * (log.unitPrice || 0)).toLocaleString()}
                        </Typography>
                      </Stack>

                      <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" sx={{ pt: 0.5 }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<PrinterOutlined />}
                          onClick={() => handleOpenPrint(log)}
                          sx={{ fontWeight: 700, borderRadius: 1.5 }}
                        >
                          Print Invoice
                        </Button>
                        {!isStoreKeeper && (
                          <IconButton color="secondary" size="small" onClick={() => handleOpenEdit(log)}>
                            <EditOutlined />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton color="error" size="small" onClick={() => handleOpenDelete(log)}>
                            <DeleteOutlined />
                          </IconButton>
                        )}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Box>

        {/* Stock Out Table (Visible on md and up) */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < stockOutLogs.length}
                      checked={stockOutLogs.length > 0 && selected.length === stockOutLogs.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all stock out' }}
                    />
                  </TableCell>
                  <TableCell>ITEM SELECT</TableCell>
                  <TableCell>CATEGORY</TableCell>
                  <TableCell align="center">QTY</TableCell>
                  <TableCell align="right">DATE & TIME</TableCell>
                  <TableCell align="center">ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockOutLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No Stock Out usage records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stockOutLogs.map((log) => {
                    const isItemSelected = isSelected(log.id);

                    return (
                      <TableRow key={log.id} hover selected={isItemSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={(e) => handleSelectOne(e, log.id)}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {log.itemName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {log.itemCode}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={log.category || 'General'}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="subtitle1" fontWeight={700} color="error.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <ArrowDownOutlined /> -{log.qtyUsed}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="caption" color="textSecondary">
                            {log.time}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Print Invoice Receipt">
                              <IconButton color="info" size="small" onClick={() => handleOpenPrint(log)}>
                                <PrinterOutlined />
                              </IconButton>
                            </Tooltip>
                            {!isStoreKeeper && (
                              <Tooltip title="Edit Record">
                                <IconButton color="primary" size="small" onClick={() => handleOpenEdit(log)}>
                                  <EditOutlined />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDelete && (
                              <Tooltip title="Delete Record">
                                <IconButton color="error" size="small" onClick={() => handleOpenDelete(log)}>
                                  <DeleteOutlined />
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
        </Box>
      </MainCard>

      {/* Edit Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: 440, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
            ✏️ Edit Stock Out Record
          </Typography>

          {editingLog && (
            <form onSubmit={handleEditSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  select
                  label="SELECT RECIPIENT / WORKER NAME *"
                  fullWidth
                  required
                  value={editingLog.customer}
                  onChange={(e) => setEditingLog({ ...editingLog, customer: e.target.value })}
                >
                  {partyList.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
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
                  onChange={(e) => setEditingLog({ ...editingLog, qty: parseInt(e.target.value) || 1 })}
                />

                <TextField
                  label="UNIT PRICE"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={editingLog.unitPrice}
                  onChange={(e) => setEditingLog({ ...editingLog, unitPrice: parseFloat(e.target.value) || 0 })}
                />

                <TextField
                  label="LINE TOTAL"
                  fullWidth
                  disabled
                  value={`Rs. ${((parseInt(editingLog.qty) || 0) * (parseFloat(editingLog.unitPrice) || 0)).toLocaleString()}`}
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

      {/* Delete Single Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Stock Out Record</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the Stock Out record for <strong>{logToDelete?.itemName}</strong>?
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
            Are you sure you want to delete <strong>{selected.length}</strong> selected Stock Out records?
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

      {/* 📄 Print Invoice Receipt Modal Dialog */}
      <Dialog open={printModalOpen} onClose={handleClosePrintModal} maxWidth="md" fullWidth>
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
              #printable-invoice-stockout, #printable-invoice-stockout * {
                visibility: visible !important;
              }
              #printable-invoice-stockout {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 10px !important;
              }
              #printable-invoice-stockout .watermark-logo {
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
          <Typography variant="h5" fontWeight={700}>📄 Stock Out Sales Invoice & Statement</Typography>
          <Chip label={printData?.type || 'Stock Out Receipt'} color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
          {printData && (() => {
            const activeCustomerLogs = stockOutLogs.filter(
              (log) => (log.usedBy || log.department || '').toLowerCase() === (printData.customer || '').toLowerCase()
            );

            const displayLogs = activeCustomerLogs.length > 0 ? activeCustomerLogs : [
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
              <Box id="printable-invoice-stockout" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
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
                      sx={{ width: 64, height: 64, objectFit: 'contain', borderRadius: '50%' }}
                    />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#10b981', lineHeight: 1.1, letterSpacing: '0.5px' }}>
                        REHMAT LAWN MOWERS
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Structured Professional Customer / Department Metadata Card */}
                  <div style={{
                    border: '1.5px solid #111827',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                      {/* Left Column: Customer Details */}
                      <div style={{ flex: '1.2', padding: '10px 14px', borderRight: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                          Customer / Party Details
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                          {printData.customer || 'Customer'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.6' }}>
                          <div><strong>Issuance Category:</strong> {printData.type || 'Stock Out Sales'}</div>
                        </div>
                      </div>

                      {/* Right Column: Voucher Meta */}
                      <div style={{ flex: '1', padding: '10px 14px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 700 }}>Voucher / Invoice No:</span>
                          <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.95rem' }}>#{printData.id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                          <span style={{ fontWeight: 700, color: '#374151' }}>{printData.date}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Status:</span>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>Dispatched</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '16px', backgroundColor: 'transparent' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                        <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '8px 4px', textAlign: 'center', fontSize: '0.95rem' }}>
                          <strong>Sr</strong>
                        </th>
                        <th style={{ width: '52%', borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontSize: '0.95rem' }}>
                          <strong>Specification / Item Description</strong>
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
                      {displayLogs.map((item, idx) => {
                        const itemUnitPrice = item.unitPrice || 0;
                        const itemLineTotal = item.lineTotal || (item.qtyUsed * itemUnitPrice);
                        const itemQty = item.qtyUsed || 1;

                        return (
                          <tr key={item.id || idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>
                              {item.itemName} {item.itemCode ? `(${item.itemCode})` : ''}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 6px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                              {String(itemQty).padStart(2, '0')}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                              {itemUnitPrice.toLocaleString()}
                            </td>
                            <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                              {itemLineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total Amount Bottom Row */}
                      <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                        <td colSpan={2} style={{ borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>
                          Total amount
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '8px' }}></td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '8px' }}></td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#111827' }}>
                          {grandTotalSum.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Financial Summary Box */}
                  <Box sx={{ bgcolor: 'transparent', p: 1.5, borderRadius: 1, border: '1px solid #86efac', mb: 2 }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="textSecondary" display="block">
                          TOTAL DISPATCHED ITEMS: {displayLogs.length}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={800} color="success.dark">
                          NET TOTAL: Rs. {grandTotalSum.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Signatures Footer */}
                  <Grid container spacing={2} sx={{ mt: 3, pt: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 1, width: 180 }}>
                        Customer / Receiver Signature
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
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
            Print Sales Invoice ({stockOutLogs.filter(log => (log.usedBy || log.department || '').toLowerCase() === (printData?.customer || '').toLowerCase()).length || 1} Items)
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📨 SEND ALERT / REQUEST TO SUPER ADMIN DIALOG */}
      <Dialog open={notifDialogOpen} onClose={() => setNotifDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SendOutlined style={{ color: '#fa8c16' }} /> Send Alert / Request to Admin
        </DialogTitle>
        <form onSubmit={handleSendNotif}>
          <DialogContent>
            <Stack spacing={2.5}>
              {notifSuccess && (
                <Chip
                  icon={<CheckCircleOutlined />}
                  label="Notification Sent to Super Admin Bell Icon!"
                  color="success"
                  sx={{ fontWeight: 700, py: 2 }}
                />
              )}
              <TextField
                select
                label="Alert / Request Category *"
                fullWidth
                value={notifForm.type}
                onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
              >
                <MenuItem value="⚠️ Low Stock Reorder Alert">⚠️ Low Stock Reorder Alert</MenuItem>
                <MenuItem value="📦 Stock Out / Issuance Note">📦 Stock Out / Issuance Note</MenuItem>
                <MenuItem value="📝 Urgent Purchase Order Request">📝 Urgent Purchase Order Request</MenuItem>
                <MenuItem value="💬 General Note / Alert to Admin">💬 General Note / Alert to Admin</MenuItem>
              </TextField>

              <TextField
                label="Message / Note Details *"
                fullWidth
                required
                multiline
                rows={3}
                placeholder="e.g. SKF Ball Bearings stock is running low, please reorder 100 units urgently."
                value={notifForm.message}
                onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setNotifDialogOpen(false)} color="secondary">
              Cancel
            </Button>
            <Button variant="contained" color="warning" type="submit" startIcon={<SendOutlined />} sx={{ fontWeight: 700 }}>
              Send Notification To Admin
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
