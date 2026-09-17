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
import { ImportOutlined, SearchOutlined, ArrowUpOutlined, PlusOutlined, DeleteOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';
import { useTransparentLogo } from 'components/logo/LogoMain';

export default function StockInPage() {
  const transparentLogo = useTransparentLogo(rehmatLogo);
  const { items = [], vendors = [], masterItemNames = [], categories = [], usageLogs = [], receiveStock, addNewItem, deleteLog, updateLog, deleteMultipleLogs } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selected, setSelected] = useState([]);
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
    unitPrice: 0,
    discount: 0
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
      setForm((prev) => ({
        ...prev,
        itemName: val,
        category: matchedItem.category || prev.category || 'General',
        unitPrice: matchedItem.unitPrice || prev.unitPrice
      }));
    } else {
      const matchedMaster = (masterItemNames || []).find((m) => m.name.toLowerCase() === val.toLowerCase());
      setForm((prev) => ({
        ...prev,
        itemName: val,
        category: matchedMaster?.category || prev.category || 'General'
      }));
    }
  };

  // Add Quick Item to Table below (triggered when pressing Enter on QTY field)
  const handleQuickAddToList = async () => {
    if (!form.itemName.trim()) return;

    const matchedItem = items.find((i) => i.name.toLowerCase() === form.itemName.trim().toLowerCase());
    const qtyVal = parseInt(form.qty) || 1;
    const priceVal = parseFloat(form.unitPrice) || 0;
    const discountVal = parseFloat(form.discount) || 0;
    const netTotal = Math.max(0, qtyVal * priceVal - discountVal);
    const poCode = `PO-${Math.floor(1000 + Math.random() * 9000)}`;

    if (matchedItem) {
      await receiveStock(matchedItem, qtyVal, form.vendor, poCode, priceVal, form.category || matchedItem.category || 'General');
    } else {
      const newCode = `RM-${Math.floor(100 + Math.random() * 900)}`;
      const createdItem = await addNewItem({
        name: form.itemName.trim(),
        itemCode: newCode,
        category: form.category || 'General',
        unit: 'PCS',
        totalStock: 0,
        minLevel: 10,
        unitPrice: priceVal,
        rackLocation: 'Main Store'
      });
      await receiveStock(createdItem || newCode, qtyVal, form.vendor, poCode, priceVal, form.category || 'General');
    }

    setForm((prev) => ({
      ...prev,
      itemName: '',
      qty: 1,
      unitPrice: 0,
      discount: 0
    }));

    // Auto-focus back to ITEM SELECT for non-stop typing
    setTimeout(() => {
      if (itemSelectRef.current) {
        itemSelectRef.current.focus();
      }
    }, 50);
  };

  // Mouse Click Handler on Green Save Button (Triggers Print Vendor Invoice Modal)
  const handleSaveButtonClick = () => {
    const qtyVal = parseInt(form.qty) || 1;
    const priceVal = parseFloat(form.unitPrice) || 0;
    const discountVal = parseFloat(form.discount) || 0;
    const netTotal = Math.max(0, qtyVal * priceVal - discountVal);

    if (form.itemName.trim()) {
      handleQuickAddToList();
    }

    setPrintData({
      id: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'Stock In (Receiving Invoice)',
      vendor: form.vendor,
      itemName: form.itemName,
      qty: form.qty,
      unitPrice: form.unitPrice,
      discount: discountVal,
      lineTotal: netTotal,
      time: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    });

    setPrintModalOpen(true);
  };

  // Open Print Modal for Row Log
  const handleOpenPrint = (log) => {
    setPrintData({
      id: log.itemCode || `INV-${log.id}`,
      type: 'Stock In Receipt',
      vendor: log.usedBy || 'Vendor',
      itemName: log.itemName,
      qty: log.qtyUsed,
      unitPrice: log.unitPrice || 0,
      lineTotal: log.lineTotal || log.qtyUsed * (log.unitPrice || 0),
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
      vendor: log.usedBy || vendorList[0],
      qty: log.qtyUsed || 1,
      unitPrice: log.unitPrice || 0
    });
    setEditDrawerOpen(true);
  };

  // Edit Submit Handler
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingLog) return;
    const qtyVal = parseInt(editingLog.qty) || 1;
    const priceVal = parseFloat(editingLog.unitPrice) || 0;

    updateLog(editingLog.id, {
      itemName: editingLog.itemName,
      usedBy: editingLog.vendor,
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

  // Filter logs for IN transactions
  const stockInLogs = usageLogs.filter((log) => {
    const isIN = log.type && log.type.toUpperCase().includes('IN');
    const matchedItem = items.find((i) => i.name.toLowerCase() === (log.itemName || '').toLowerCase());
    const logCat = log.category || matchedItem?.category || 'General';

    const matchesSearch =
      (log.itemName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.itemCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.usedBy && log.usedBy.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const lineTotal = (parseInt(form.qty) || 0) * (parseFloat(form.unitPrice) || 0);

  return (
    <Stack spacing={3}>
      {/* 1. TOP SECTION: Record Stock In Form Card */}
      <MainCard
        title=" Record Stock In (Receiving Invoice)"
        sx={{
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)'),
          borderRadius: 2
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleQuickAddToList(); }}>
          <Grid container spacing={2.5} alignItems="center">
            {/* ROW 1: 50% / 50% split */}
            {/* 1. SELECT VENDOR / SUPPLIER */}
            <Grid size={{ xs: 12, md: 4 }}>
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
                    placeholder="Select or Type Vendor Name"
                  />
                )}
              />
            </Grid>

            {/* 2. ITEM SELECT */}
            <Grid size={{ xs: 12, md: 5 }}>
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
            <Grid size={{ xs: 12, md: 3 }}>
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

            {/* ROW 2: QTY, Price, Discount, Line Total, and Save Button */}
            {/* 3. QTY */}
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
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

            {/* 4. UNIT PRICE (PKR) */}
            <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
              <TextField
                label="UNIT PRICE (PKR)"
                type="number"
                fullWidth
                inputRef={priceRef}
                inputProps={{ min: 0, step: 'any' }}
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })}
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

            {/* 5. DISCOUNT (PKR) */}
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

            {/* 6. LINE TOTAL (PKR) */}
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
                  Rs. {Math.max(0, (parseInt(form.qty) || 0) * (parseFloat(form.unitPrice) || 0) - (parseFloat(form.discount) || 0)).toLocaleString()}
                </Typography>
              </Box>
            </Grid>

            {/* 7. SAVE BUTTON */}
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
                  fontSize: '0.9rem',
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
        title="Stock In (Receiving Logs)"
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
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              }
              sx={{ height: '42px' }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              fullWidth
              label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  height: '42px',
                  minHeight: '42px'
                }
              }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {categoryOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }} sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="textSecondary">
              Showing <strong>{stockInLogs.length}</strong> Stock In Log Records
            </Typography>
          </Grid>
        </Grid>

        {/* Mobile Summary Cards (Visible on xs & sm viewports) */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {stockInLogs.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No Stock In shipment records found.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {stockInLogs.map((log) => {
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
                          label={log.vendor || log.department || 'Supplier'}
                          color="success"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {log.time}
                        </Typography>
                      </Stack>

                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {log.itemName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Code: {log.itemCode || log.id}
                        </Typography>
                      </Box>

                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'action.hover', p: 1.25, borderRadius: 1.5 }}>
                        <Typography variant="body2" fontWeight={600}>
                          Qty Received: <strong style={{ color: '#52c41a' }}>+{log.qtyUsed}</strong>
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={800} color="success.main">
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
                          Print Receipt
                        </Button>
                        <IconButton color="primary" size="small" onClick={() => handleOpenEdit(log)}>
                          <EditOutlined />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => handleOpenDelete(log)}>
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

        {/* Stock In Table (Visible on md and up) */}
        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
          <TableContainer>
            <Table sx={{ minWidth: 600 }}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < stockInLogs.length}
                      checked={stockInLogs.length > 0 && selected.length === stockInLogs.length}
                      onChange={handleSelectAllClick}
                      inputProps={{ 'aria-label': 'select all stock in' }}
                    />
                  </TableCell>
                  <TableCell>ITEM SELECT</TableCell>
                  <TableCell>CATEGORY</TableCell>
                  <TableCell align="center">QTY</TableCell>
                  <TableCell align="right">UNIT PRICE</TableCell>
                  <TableCell align="right">LINE TOTAL</TableCell>
                  <TableCell>VENDOR / SUPPLIER</TableCell>
                  <TableCell align="right">DATE & TIME</TableCell>
                  <TableCell align="center">ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stockInLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No Stock In shipment records found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  stockInLogs.map((log) => {
                    const isItemSelected = isSelected(log.id);
                    const matchedItem = items.find((i) => i.name.toLowerCase() === (log.itemName || '').toLowerCase());
                    const logCat = log.category || matchedItem?.category || 'General';

                    return (
                      <TableRow key={log.id} hover selected={isItemSelected} onClick={(e) => handleSelectOne(e, log.id)}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={(e) => handleSelectOne(e, log.id)}
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {log.itemName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {log.itemCode || log.id}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip label={logCat} size="small" variant="light" color="primary" sx={{ fontWeight: 600 }} />
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="subtitle1" fontWeight={700} color="success.main" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <ArrowUpOutlined /> +{log.qtyUsed}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600}>
                            Rs. {(parseFloat(log.unitPrice) || 0).toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={700} color="success.main">
                            Rs. {((log.qtyUsed || 1) * (parseFloat(log.unitPrice) || 0)).toLocaleString()}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={log.usedBy || log.department || 'Vendor'}
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="caption" color="textSecondary">
                            {log.time}
                          </Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="Print Receipt">
                              <IconButton color="info" size="small" onClick={() => handleOpenPrint(log)}>
                                <PrinterOutlined />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Stock In">
                              <IconButton color="primary" size="small" onClick={() => handleOpenEdit(log)}>
                                <EditOutlined />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Record">
                              <IconButton color="error" size="small" onClick={() => handleOpenDelete(log)}>
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

      {/* Edit Stock In Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 440 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
            ✏️ Edit Stock In Record
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
              #printable-invoice-stockin, #printable-invoice-stockin * {
                visibility: visible !important;
              }
              #printable-invoice-stockin {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 10px !important;
              }
              #printable-invoice-stockin .watermark-logo {
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
          <Typography variant="h5" fontWeight={700}>📄 Vendor Stock Receiving Invoice & Statement</Typography>
          <Chip label={printData?.type || 'Stock In'} color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
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
              <Box id="printable-invoice-stockin" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
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

                  {/* Structured Professional Vendor & PO Metadata Card */}
                  <div style={{
                    border: '1.5px solid #111827',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                      {/* Left Column: Vendor Details */}
                      <div style={{ flex: '1.2', padding: '10px 14px', borderRight: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                          Vendor / Supplier Details
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                          {printData.vendor || 'Supplier'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.6' }}>
                          <div><strong>Stock In Entry Type:</strong> {printData.type || 'Stock Receiving'}</div>
                        </div>
                      </div>

                      {/* Right Column: PO Meta */}
                      <div style={{ flex: '1', padding: '10px 14px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 700 }}>PO / Voucher No:</span>
                          <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.95rem' }}>{printData.id}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                          <span style={{ fontWeight: 700, color: '#374151' }}>{printData.time}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Status:</span>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>Received</span>
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
                          <strong>Specification / Item Name</strong>
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
                          TOTAL RECEIVING ITEMS: {displayLogs.length}
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
                        Vendor Signature
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
            Print Vendor Invoice ({stockInLogs.filter(log => (log.usedBy || '').toLowerCase() === (printData?.vendor || '').toLowerCase()).length || 1} Items)
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
