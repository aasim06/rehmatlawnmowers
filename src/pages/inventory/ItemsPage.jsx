import { useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';

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
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
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
  Typography,
  Tooltip
} from '@mui/material';

// icons
import { PlusOutlined, SearchOutlined, ImportOutlined, ExportOutlined, DeleteOutlined, EditOutlined, WarningOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

import { useDebounce } from 'hooks/useDebounce';

const UNIT_OPTIONS = ['PCS', 'KG', 'Liter', 'Meter', 'Set'];

export default function ItemsPage() {
  const { items, masterItemNames = [], categories = [], issueStock, receiveStock, addNewItem, updateItem, deleteItem, deleteMultipleItems, cleanDuplicateItems } = useStoreInventory();

  // Search & Category filter
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Checkbox Selection State
  const [selected, setSelected] = useState([]);

  // Stock Out Modal State
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [qtyUsed, setQtyUsed] = useState(5);
  const [usedBy, setUsedBy] = useState('Zubair Ahmed');
  const [department, setDepartment] = useState('Assembly Line 1');
  const [notes, setNotes] = useState('Daily production issue');

  // Stock In Modal State
  const [stockInOpen, setStockInOpen] = useState(false);
  const [qtyReceived, setQtyReceived] = useState(10);
  const [supplierName, setSupplierName] = useState('Siemens Industrial');

  // Add Item Drawer State
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemCode: `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
    name: '',
    category: 'Electrical & Motors',
    totalStock: 50,
    unit: 'PCS',
    unitPrice: 25,
    minLevel: 10,
    rackLocation: 'Rack A-01'
  });

  // Edit Item Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Single Item Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Bulk Delete Confirmation Dialog State
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const categoryFilterOptions = ['All', ...new Set(items.map((i) => i.category))];

  const filteredItems = items.filter((i) => {
    const sTerm = (debouncedSearch || '').toLowerCase();
    const matchesSearch =
      (i.name || '').toLowerCase().includes(sTerm) ||
      (i.itemCode || '').toLowerCase().includes(sTerm) ||
      (i.rackLocation || '').toLowerCase().includes(sTerm);

    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredItems.map((n) => n.id);
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

  // Open Handlers
  const handleOpenStockOut = (item) => {
    setTargetItem(item);
    setQtyUsed(1);
    setStockOutOpen(true);
  };

  const handleOpenStockIn = (item) => {
    setTargetItem(item);
    setQtyReceived(10);
    setStockInOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem({ ...item });
    setEditDrawerOpen(true);
  };

  const handleOpenDelete = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  // Submit Handlers
  const handleStockOutSubmit = () => {
    if (!targetItem || !usedBy) return;
    const ok = issueStock(targetItem.id, qtyUsed, usedBy, department, 'Store Keeper', notes);
    if (ok) setStockOutOpen(false);
    else alert('Insufficient stock!');
  };

  const handleStockInSubmit = () => {
    if (!targetItem) return;
    receiveStock(targetItem.id, qtyReceived, supplierName);
    setStockInOpen(false);
  };

  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      const inputs = Array.from(
        e.currentTarget.querySelectorAll('input, select')
      ).filter((el) => !el.disabled && el.type !== 'hidden');

      const currentIndex = inputs.indexOf(e.target);
      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        e.preventDefault();
        const nextInput = inputs[currentIndex + 1];
        if (nextInput) {
          nextInput.focus();
          if (typeof nextInput.select === 'function') {
            nextInput.select();
          }
        }
      }
    }
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name) {
      alert('Please select or type an item name.');
      return;
    }
    addNewItem(newItem);
    setAddDrawerOpen(false);
    setNewItem({
      itemCode: `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: '',
      category: 'Electrical & Motors',
      totalStock: 50,
      unit: 'PCS',
      unitPrice: 25,
      minLevel: 10,
      rackLocation: 'Rack A-01'
    });
  };

  const handleEditItemSubmit = (e) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name) return;
    updateItem(editingItem.id, editingItem);
    setEditDrawerOpen(false);
    setEditingItem(null);
  };

  const handleConfirmSingleDelete = () => {
    if (itemToDelete) {
      deleteItem(itemToDelete.id);
      setSelected((prev) => prev.filter((id) => id !== itemToDelete.id));
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleItems(selected);
      setSelected([]);
    }
    setBulkDeleteDialogOpen(false);
  };

  return (
    <Box>
      {/* 1. TOP SECTION: Add New Store Inventory Item Card */}
      <MainCard title="➕ Add New Store Inventory Item" sx={{ mb: 3 }}>
        <form onSubmit={handleAddItemSubmit} onKeyDown={handleFormKeyDown}>
          <Box
            sx={{
              '& .MuiInputBase-root': {
                height: 40,
                fontSize: '0.875rem'
              },
              '& .MuiInputLabel-root': {
                fontSize: '0.8125rem'
              }
            }}
          >
            <Grid container spacing={2}>
              {/* ROW 1: Item Name, SKU, Location, Unit */}
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Autocomplete
                  freeSolo
                  options={masterItemNames.map((m) => m.name)}
                  value={newItem.name}
                  onInputChange={(event, newInputValue) => {
                    const matchedMaster = masterItemNames.find((m) => m.name.toLowerCase() === (newInputValue || '').toLowerCase());
                    setNewItem({
                      ...newItem,
                      name: newInputValue || '',
                      category: matchedMaster ? matchedMaster.category : 'General',
                      unit: matchedMaster ? matchedMaster.defaultUnit : newItem.unit
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="ITEM NAME *"
                      required
                      placeholder="e.g. Electric Motor 3HP or Blade"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="SKU CODE / SHORT ID *"
                  fullWidth
                  required
                  placeholder="e.g. SKU-84564564"
                  value={newItem.itemCode}
                  onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="RACK / LOCATION"
                  fullWidth
                  placeholder="e.g. Rack A-01"
                  value={newItem.rackLocation}
                  onChange={(e) => setNewItem({ ...newItem, rackLocation: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="UNIT *"
                  fullWidth
                  required
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* ROW 2: Stock, Price, Min Level & Save Action */}
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <TextField
                  label="OPENING STOCK *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                  value={newItem.totalStock}
                  onChange={(e) => setNewItem({ ...newItem, totalStock: parseInt(e.target.value) || 0 })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <TextField
                  label="UNIT PRICE (RS) *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 'any' }}
                  value={newItem.unitPrice}
                  onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <TextField
                  label="MIN THRESHOLD *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  value={newItem.minLevel}
                  onChange={(e) => setNewItem({ ...newItem, minLevel: parseInt(e.target.value) || 5 })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  type="submit"
                  startIcon={<PlusOutlined />}
                  sx={{ fontWeight: 800, height: 40, borderRadius: 2 }}
                >
                  Save New Store Item
                </Button>
              </Grid>
            </Grid>
          </Box>
        </form>
      </MainCard>

      {/* 2. BOTTOM SECTION: Store Inventory Items Table Card */}
      <MainCard
        title="Store Inventory Items"
        secondary={
          <Stack direction="row" spacing={1.5}>
            {selected.length > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteOutlined />}
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                Delete Selected ({selected.length})
              </Button>
            )}
            <Button variant="outlined" color="warning" onClick={cleanDuplicateItems}>
              Clean Duplicates
            </Button>
          </Stack>
        }
      >
        {/* Search Header */}
        <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <OutlinedInput
              fullWidth
              placeholder="Search items, SKU code, rack location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              }
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="caption" color="textSecondary">
              {selected.length > 0 ? (
                <strong style={{ color: '#ff4d4f' }}>{selected.length} items selected for deletion</strong>
              ) : (
                `Total ${filteredItems.length} Store Items`
              )}
            </Typography>
          </Grid>
        </Grid>

        {/* Items Table */}
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredItems.length}
                    checked={filteredItems.length > 0 && selected.length === filteredItems.length}
                    onChange={handleSelectAllClick}
                    inputProps={{ 'aria-label': 'select all items' }}
                  />
                </TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>SKU Code</TableCell>
                <TableCell align="right">Price Per Unit</TableCell>
                <TableCell align="center">Units</TableCell>
                <TableCell align="center">Stock Quantity</TableCell>
                <TableCell align="center">Min Threshold</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((item) => {
                  const isLow = item.remainingStock <= item.minLevel;
                  const isItemSelected = isSelected(item.id);

                  return (
                    <TableRow key={item.id} hover selected={isItemSelected}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={(e) => handleSelectOne(e, item.id)}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.category || 'General'} | Rack: {item.rackLocation || 'N/A'}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {item.itemCode}
                        </Typography>
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={600}>
                          Rs. {item.unitPrice?.toLocaleString()}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip label={item.unit} size="small" variant="outlined" />
                      </TableCell>

                      <TableCell align="center">
                        <Typography variant="subtitle1" fontWeight={800} color={isLow ? 'error.main' : 'success.main'}>
                          {item.remainingStock}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        {isLow ? (
                          <Chip icon={<WarningOutlined />} label={`Low (${item.minLevel})`} color="error" size="small" sx={{ fontWeight: 700 }} />
                        ) : (
                          <Chip label={item.minLevel} size="small" variant="outlined" />
                        )}
                      </TableCell>

                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Stock Out (Usage)">
                            <IconButton color="error" size="small" onClick={() => handleOpenStockOut(item)}>
                              <ExportOutlined />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Stock In (Receive)">
                            <IconButton color="success" size="small" onClick={() => handleOpenStockIn(item)}>
                              <ImportOutlined />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Edit Item">
                            <IconButton color="primary" size="small" onClick={() => handleOpenEditItem(item)}>
                              <EditOutlined />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Item">
                            <IconButton color="error" size="small" onClick={() => handleOpenDelete(item)}>
                              <DeleteOutlined />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredItems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </MainCard>

      {/* Modal 1: Stock Out */}
      <Dialog open={stockOutOpen} onClose={() => setStockOutOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>📤 Stock Out (Usage): {targetItem?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="textSecondary" display="block">
                Available Stock Right Now:
              </Typography>
              <Typography variant="h5" color="primary.main" fontWeight={700}>
                {targetItem?.remainingStock} {targetItem?.unit}
              </Typography>
            </Box>

            <TextField
              label="Quantity Used / Issued"
              type="number"
              fullWidth
              inputProps={{ min: 1, max: targetItem?.remainingStock }}
              value={qtyUsed}
              onChange={(e) => setQtyUsed(Math.max(1, parseInt(e.target.value) || 1))}
            />

            <TextField
              label="Who Used (Operator / Worker Name)"
              fullWidth
              required
              value={usedBy}
              onChange={(e) => setUsedBy(e.target.value)}
            />

            <TextField
              label="Department / Workstation"
              fullWidth
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <TextField
              label="Notes"
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStockOutOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleStockOutSubmit}>
            Record Stock Out
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 2: Stock In */}
      <Dialog open={stockInOpen} onClose={() => setStockInOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>📥 Stock In: {targetItem?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Quantity Received"
              type="number"
              fullWidth
              inputProps={{ min: 1 }}
              value={qtyReceived}
              onChange={(e) => setQtyReceived(Math.max(1, parseInt(e.target.value) || 1))}
            />

            <TextField
              label="Supplier / Vendor"
              fullWidth
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setStockInOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleStockInSubmit}>
            Record Stock In
          </Button>
        </DialogActions>
      </Dialog>



      {/* Drawer 4: Edit Item (7 Inputs Form) */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 420 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Edit Item Details
          </Typography>

          {editingItem && (
            <form onSubmit={handleEditItemSubmit}>
              <Stack spacing={2.5}>
                {/* 1. Item Name */}
                <TextField
                  label="Item Name"
                  fullWidth
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />

                {/* 2. SKU Code */}
                <TextField
                  label="SKU Code / Short ID"
                  fullWidth
                  required
                  value={editingItem.itemCode}
                  onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value })}
                />

                {/* 3. Price Per Unit */}
                <TextField
                  label="Price Per Unit"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 'any' }}
                  value={editingItem.unitPrice}
                  onChange={(e) => setEditingItem({ ...editingItem, unitPrice: parseFloat(e.target.value) || 0 })}
                />

                {/* 4. Category */}
                <TextField
                  select
                  label="Category"
                  fullWidth
                  required
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                >
                  {(categories.length > 0
                    ? categories.map((c) => c.name)
                    : ['Electrical & Motors', 'Mechanical Parts', 'Sensors & Automation', 'Hydraulics', 'Pneumatics', 'Raw Materials', 'General']
                  ).map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>

                {/* 5. Units */}
                <TextField
                  select
                  id="itemUnitEdit"
                  label="Units"
                  fullWidth
                  required
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                {/* 6. Initial Stock Quantity */}
                <TextField
                  label="Total Stock Quantity"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                  value={editingItem.totalStock}
                  onChange={(e) => setEditingItem({ ...editingItem, totalStock: parseInt(e.target.value) || 0 })}
                />

                {/* 7. Min Threshold */}
                <TextField
                  label="Min Threshold (Low Stock Warning At)"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  value={editingItem.minLevel}
                  onChange={(e) => setEditingItem({ ...editingItem, minLevel: parseInt(e.target.value) || 5 })}
                />

                <TextField
                  label="Rack Location"
                  fullWidth
                  value={editingItem.rackLocation}
                  onChange={(e) => setEditingItem({ ...editingItem, rackLocation: e.target.value })}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" color="primary" type="submit">
                    Update Item Changes
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* Modal 5: Confirm Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete Item Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete item <strong>"{itemToDelete?.name}"</strong> ({itemToDelete?.itemCode})? This action will permanently remove the item from your store inventory.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmSingleDelete} variant="contained" color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 6: Confirm Bulk Delete Multiple Items Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete All Selected Items Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all <strong>{selected.length} selected items</strong> from your store inventory? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} variant="contained" color="error">
            Delete All {selected.length} Items
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
