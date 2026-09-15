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
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

const PARTY_TYPE_OPTIONS = ['Supplier (Vendor)', 'Customer (Party)', 'Contractor', 'Transporter', 'Other'];

export default function VendorsPage() {
  const { vendors, addVendor, updateVendor, deleteVendor, deleteMultipleVendors } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState([]);

  // Add Vendor / Party Drawer State
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({
    name: '',
    partyType: 'Supplier (Vendor)',
    phone: '',
    address: ''
  });

  // Edit Vendor Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  // Single Delete Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  // Bulk Delete Confirmation Dialog State
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const filteredVendors = vendors.filter((v) => {
    const pType = v.partyType || 'Supplier (Vendor)';
    return (
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.phone && v.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.address && v.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredVendors.map((n) => n.id);
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

  // Handle Add Vendor Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newVendor.name) return;
    addVendor(newVendor);
    setNewVendor({
      name: '',
      partyType: 'Supplier (Vendor)',
      phone: '',
      address: ''
    });
    setAddDrawerOpen(false);
  };

  // Handle Open Edit Drawer
  const handleOpenEdit = (vendor) => {
    setEditingVendor({
      ...vendor,
      partyType: vendor.partyType || 'Supplier (Vendor)'
    });
    setEditDrawerOpen(true);
  };

  // Handle Edit Vendor Submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingVendor || !editingVendor.name) return;
    updateVendor(editingVendor.id, editingVendor);
    setEditDrawerOpen(false);
    setEditingVendor(null);
  };

  // Handle Open Delete Modal
  const handleOpenDelete = (vendor) => {
    setVendorToDelete(vendor);
    setDeleteDialogOpen(true);
  };

  // Handle Confirm Single Delete Vendor
  const handleConfirmSingleDelete = () => {
    if (vendorToDelete) {
      deleteVendor(vendorToDelete.id);
      setSelected((prev) => prev.filter((id) => id !== vendorToDelete.id));
    }
    setDeleteDialogOpen(false);
    setVendorToDelete(null);
  };

  // Handle Confirm Bulk Delete Vendors
  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleVendors(selected);
      setSelected([]);
    }
    setBulkDeleteDialogOpen(false);
  };

  return (
    <MainCard
      title="Vendors & Parties Directory"
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
            + Add New Vendor / Party
          </Button>
        </Stack>
      }
    >
      {/* Search Header */}
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Grid item xs={12} sm={6}>
          <OutlinedInput
            fullWidth
            placeholder="Search vendor name, party type, phone number..."
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
              <strong style={{ color: '#ff4d4f' }}>{selected.length} items selected for deletion</strong>
            ) : (
              `Total ${filteredVendors.length} Registered Vendors & Parties`
            )}
          </Typography>
        </Grid>
      </Grid>

      {/* Vendors & Parties Table */}
      <TableContainer>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < filteredVendors.length}
                  checked={filteredVendors.length > 0 && selected.length === filteredVendors.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all vendors' }}
                />
              </TableCell>
              <TableCell>Vendor / Person Name</TableCell>
              <TableCell>Party Type</TableCell>
              <TableCell>Phone Number</TableCell>
              <TableCell>Company / Address Note</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No registered vendors or parties found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredVendors.map((vendor) => {
                const isVendorSelected = isSelected(vendor.id);
                const partyTypeLabel = vendor.partyType || vendor.category || 'Supplier (Vendor)';

                return (
                  <TableRow key={vendor.id} hover selected={isVendorSelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isVendorSelected}
                        onChange={(e) => handleSelectOne(e, vendor.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                        {vendor.name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip label={partyTypeLabel} size="small" color="primary" variant="light" />
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneOutlined style={{ fontSize: 13, color: '#52c41a' }} />
                        <Typography variant="body2">{vendor.phone || 'N/A'}</Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {vendor.address || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Edit Vendor / Party">
                          <IconButton color="primary" size="small" onClick={() => handleOpenEdit(vendor)}>
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Vendor / Party">
                          <IconButton color="error" size="small" onClick={() => handleOpenDelete(vendor)}>
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

      {/* Drawer 1: Add New Vendor / Party */}
      <Drawer anchor="right" open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)}>
        <Box sx={{ width: 440, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2.5, fontWeight: 700 }}>
            Add New Vendor / Party
          </Typography>

          <form onSubmit={handleAddSubmit}>
            <Stack spacing={2.5}>
              {/* 1. Vendor / Person Name */}
              <TextField
                label="VENDOR / PERSON NAME *"
                fullWidth
                required
                placeholder="e.g. Amjad / Saqlain"
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
              />

              {/* 2. Party Type & Phone Number in a row */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    select
                    label="PARTY TYPE *"
                    fullWidth
                    required
                    value={newVendor.partyType}
                    onChange={(e) => setNewVendor({ ...newVendor, partyType: e.target.value })}
                  >
                    {PARTY_TYPE_OPTIONS.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={6}>
                  <TextField
                    label="PHONE NUMBER"
                    fullWidth
                    placeholder="e.g. 0300-1234567"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  />
                </Grid>
              </Grid>

              {/* 3. Company / Address Note */}
              <TextField
                label="COMPANY / ADDRESS NOTE"
                fullWidth
                placeholder="e.g. Amjad Tech Traders, Lahore"
                value={newVendor.address}
                onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => setAddDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  sx={{
                    bgcolor: '#e67e22',
                    '&:hover': { bgcolor: '#d35400' }
                  }}
                >
                  Save Vendor
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Drawer>

      {/* Drawer 2: Edit Vendor / Party */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: 440, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 2.5, fontWeight: 700 }}>
            Edit Vendor / Party
          </Typography>

          {editingVendor && (
            <form onSubmit={handleEditSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="VENDOR / PERSON NAME *"
                  fullWidth
                  required
                  value={editingVendor.name}
                  onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      select
                      label="PARTY TYPE *"
                      fullWidth
                      required
                      value={editingVendor.partyType || 'Supplier (Vendor)'}
                      onChange={(e) => setEditingVendor({ ...editingVendor, partyType: e.target.value })}
                    >
                      {PARTY_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      label="PHONE NUMBER"
                      fullWidth
                      value={editingVendor.phone || ''}
                      onChange={(e) => setEditingVendor({ ...editingVendor, phone: e.target.value })}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="COMPANY / ADDRESS NOTE"
                  fullWidth
                  value={editingVendor.address || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, address: e.target.value })}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    type="submit"
                    sx={{
                      bgcolor: '#e67e22',
                      '&:hover': { bgcolor: '#d35400' }
                    }}
                  >
                    Save Changes
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* Modal 3: Confirm Single Delete Vendor Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete Vendor Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete vendor <strong>"{vendorToDelete?.name}"</strong> ({vendorToDelete?.id})? This action will remove the vendor from your directory.
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

      {/* Modal 4: Confirm Bulk Delete Multiple Vendors Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete All Selected Vendors Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all <strong>{selected.length} selected vendors</strong> from your directory? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} variant="contained" color="error">
            Delete All {selected.length} Vendors
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
