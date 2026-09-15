import { useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
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
  Typography,
  Tooltip
} from '@mui/material';

// icons
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, PlusSquareOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

const UNIT_OPTIONS = ['PCS', 'KG', 'Liter', 'Meter', 'Set'];

export default function AddItemNamePage() {
  const { items, categories = [], masterItemNames, addMasterItemName, updateMasterItemName, deleteMasterItemName, deleteMultipleMasterItemNames } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState([]);

  // Add Master Item Drawer State (7 inputs)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newItemName, setNewItemName] = useState({
    name: '',
    skuCode: `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
    unitPrice: 25,
    category: 'Electrical & Motors',
    defaultUnit: 'PCS',
    initialStock: 50,
    minThreshold: 10
  });

  // Edit Master Item Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingItemName, setEditingItemName] = useState(null);

  // Single Delete Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Bulk Delete Confirmation Dialog State
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const filteredMasterNames = masterItemNames.filter((m) => {
    return (
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredMasterNames.map((n) => n.id);
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

  // Submit Add Handler
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.name.trim()) return;
    addMasterItemName(newItemName);
    setNewItemName({
      name: '',
      skuCode: `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
      unitPrice: 25,
      category: 'Electrical & Motors',
      defaultUnit: 'PCS',
      initialStock: 50,
      minThreshold: 10
    });
    setAddDrawerOpen(false);
  };

  // Submit Edit Handler
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingItemName || !editingItemName.name.trim()) return;
    updateMasterItemName(editingItemName.id, editingItemName);
    setEditDrawerOpen(false);
    setEditingItemName(null);
  };

  // Single Delete Confirm Handler
  const handleConfirmSingleDelete = () => {
    if (itemToDelete) {
      deleteMasterItemName(itemToDelete.id);
      setSelected((prev) => prev.filter((id) => id !== itemToDelete.id));
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Bulk Delete Confirm Handler
  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleMasterItemNames(selected);
      setSelected([]);
    }
    setBulkDeleteDialogOpen(false);
  };

  return (
    <MainCard
      title="Master Item Names Directory"
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
          <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setAddDrawerOpen(true)}>
            + Add Master Item Name
          </Button>
        </Stack>
      }
    >
      {/* Description Banner */}
      <Box sx={{ p: 2, mb: 3, bgcolor: 'primary.lighter', borderRadius: 1, border: '1px dashed', borderColor: 'primary.main' }}>
        <Typography variant="subtitle2" color="primary.main" fontWeight={700}>
          💡 Quick Setup: Master Item Names
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Yahan aap apne factory store ke items ke naam 1 dafa save kar lein. Jab aap store mein naya item add karenge ya stock receive/issue karenge to aapko baar baar naam type nahi karna parega!
        </Typography>
      </Box>

      {/* Search Header */}
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Grid item xs={12} sm={6}>
          <OutlinedInput
            fullWidth
            placeholder="Search saved item names, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="textSecondary">
            {selected.length > 0 ? (
              <strong style={{ color: '#ff4d4f' }}>{selected.length} item names selected for deletion</strong>
            ) : (
              `Total ${filteredMasterNames.length} Saved Item Names`
            )}
          </Typography>
        </Grid>
      </Grid>

      {/* Master Item Names Table */}
      <TableContainer>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < filteredMasterNames.length}
                  checked={filteredMasterNames.length > 0 && selected.length === filteredMasterNames.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all master item names' }}
                />
              </TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Pre-saved Master Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Default Unit</TableCell>
              <TableCell align="center">Store Items Using This Name</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMasterNames.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No pre-saved item names found. Click "+ Add Master Item Name" to save item names for quick dropdown selection!
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredMasterNames.map((master) => {
                const isMasterSelected = isSelected(master.id);
                const countUsed = items.filter((i) => i.name.toLowerCase() === master.name.toLowerCase()).length;

                return (
                  <TableRow key={master.id} hover selected={isMasterSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isMasterSelected}
                        onChange={(e) => handleSelectOne(e, master.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" fontWeight={600} color="textSecondary">
                        {master.id}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PlusSquareOutlined style={{ color: '#52c41a', fontSize: 16 }} />
                        <Typography variant="subtitle2" fontWeight={700}>
                          {master.name}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip label={master.category} size="small" variant="light" color="primary" />
                    </TableCell>

                    <TableCell align="center">
                      <Chip label={master.defaultUnit} size="small" sx={{ bgcolor: 'grey.100' }} />
                    </TableCell>

                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight={700} color={countUsed > 0 ? 'success.main' : 'textSecondary'}>
                        {countUsed} active store item{countUsed === 1 ? '' : 's'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit Item Name">
                          <IconButton color="primary" size="small" onClick={() => { setEditingItemName({ ...master }); setEditDrawerOpen(true); }}>
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Item Name">
                          <IconButton color="error" size="small" onClick={() => { setItemToDelete(master); setDeleteDialogOpen(true); }}>
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

      {/* Drawer 1: Add New Master Item Name (7 Inputs) */}
      <Drawer anchor="right" open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)}>
        <Box sx={{ width: 420, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2.5 }}>
            ➕ Add Master Item Name
          </Typography>

          <form onSubmit={handleAddSubmit}>
            <Stack spacing={2.5}>
              {/* 1. Item Name */}
              <TextField
                label="Item Name"
                fullWidth
                required
                placeholder="e.g. 3HP Electric Motor (3-Phase)"
                value={newItemName.name}
                onChange={(e) => setNewItemName({ ...newItemName, name: e.target.value })}
              />

              {/* 2. SKU Code */}
              <TextField
                label="SKU Code / Short ID"
                fullWidth
                required
                placeholder="e.g. SKU-84564564 or RM-001"
                value={newItemName.skuCode}
                onChange={(e) => setNewItemName({ ...newItemName, skuCode: e.target.value })}
              />

              {/* 3. Price Per Unit */}
              <TextField
                label="Price Per Unit"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0, step: 'any' }}
                value={newItemName.unitPrice}
                onChange={(e) => setNewItemName({ ...newItemName, unitPrice: parseFloat(e.target.value) || 0 })}
              />

              {/* 4. Category */}
              <TextField
                select
                label="Category"
                fullWidth
                required
                value={newItemName.category}
                onChange={(e) => setNewItemName({ ...newItemName, category: e.target.value })}
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
                id="itemUnit"
                label="Measurement Unit"
                fullWidth
                required
                value={newItemName.defaultUnit}
                onChange={(e) => setNewItemName({ ...newItemName, defaultUnit: e.target.value })}
              >
                {UNIT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              {/* 6. Initial Stock Quantity */}
              <TextField
                label="Initial Stock Quantity"
                type="number"
                fullWidth
                required
                inputProps={{ min: 0 }}
                value={newItemName.initialStock}
                onChange={(e) => setNewItemName({ ...newItemName, initialStock: parseInt(e.target.value) || 0 })}
              />

              {/* 7. Min Threshold */}
              <TextField
                label="Min Threshold (Low Stock Alert Level)"
                type="number"
                fullWidth
                required
                inputProps={{ min: 1 }}
                value={newItemName.minThreshold}
                onChange={(e) => setNewItemName({ ...newItemName, minThreshold: parseInt(e.target.value) || 1 })}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => setAddDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  Save Item Name
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Drawer>

      {/* Drawer 2: Edit Master Item Name */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: 420, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Edit Master Item Name
          </Typography>

          {editingItemName && (
            <form onSubmit={handleEditSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Master ID"
                  fullWidth
                  disabled
                  value={editingItemName.id}
                />

                <TextField
                  label="Item Name"
                  fullWidth
                  required
                  value={editingItemName.name}
                  onChange={(e) => setEditingItemName({ ...editingItemName, name: e.target.value })}
                />

                <TextField
                  label="SKU Code"
                  fullWidth
                  value={editingItemName.skuCode || ''}
                  onChange={(e) => setEditingItemName({ ...editingItemName, skuCode: e.target.value })}
                />

                <TextField
                  label="Price Per Unit"
                  type="number"
                  fullWidth
                  value={editingItemName.unitPrice || 0}
                  onChange={(e) => setEditingItemName({ ...editingItemName, unitPrice: parseFloat(e.target.value) || 0 })}
                />

                <TextField
                  select
                  label="Category"
                  fullWidth
                  value={editingItemName.category || 'General'}
                  onChange={(e) => setEditingItemName({ ...editingItemName, category: e.target.value })}
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

                <TextField
                  select
                  id="itemUnitEdit"
                  label="Default Unit"
                  fullWidth
                  value={editingItemName.defaultUnit || 'PCS'}
                  onChange={(e) => setEditingItemName({ ...editingItemName, defaultUnit: e.target.value })}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Initial Stock Quantity"
                  type="number"
                  fullWidth
                  value={editingItemName.initialStock || 0}
                  onChange={(e) => setEditingItemName({ ...editingItemName, initialStock: parseInt(e.target.value) || 0 })}
                />

                <TextField
                  label="Min Threshold Level"
                  type="number"
                  fullWidth
                  value={editingItemName.minThreshold || 10}
                  onChange={(e) => setEditingItemName({ ...editingItemName, minThreshold: parseInt(e.target.value) || 1 })}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" color="primary" type="submit">
                    Update Changes
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* Modal 3: Confirm Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete Item Name Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete master item name <strong>"{itemToDelete?.name}"</strong>?
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

      {/* Modal 4: Confirm Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete All Selected Item Names Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all <strong>{selected.length} selected item names</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} variant="contained" color="error">
            Delete All {selected.length} Item Names
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
