import { useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
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
import { PlusOutlined, SearchOutlined, ExportOutlined, ImportOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

export default function StoreInventoryPage() {
  const { items, issueStock, receiveStock, addNewItem, deleteItem } = useStoreInventory();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Issue Modal
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [targetItem, setTargetItem] = useState(null);
  const [issueQty, setIssueQty] = useState(5);
  const [usedBy, setUsedBy] = useState('Zubair Ahmed');
  const [department, setDepartment] = useState('Assembly Line 1');
  const [notes, setNotes] = useState('Daily production issue');

  // Receive Modal
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveQty, setReceiveQty] = useState(10);
  const [supplierName, setSupplierName] = useState('Vendor Shipment');

  // Add Item Drawer
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    itemCode: `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`,
    name: '',
    category: 'Hardware',
    totalStock: 50,
    unit: 'pcs',
    unitPrice: 20,
    minLevel: 10,
    rackLocation: 'Rack A-01'
  });

  const categories = ['All', ...new Set(items.map((i) => i.category))];

  const filteredItems = items.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.rackLocation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleOpenIssue = (item) => {
    setTargetItem(item);
    setIssueQty(1);
    setIssueModalOpen(true);
  };

  const handleOpenReceive = (item) => {
    setTargetItem(item);
    setReceiveQty(10);
    setReceiveModalOpen(true);
  };

  const handleIssueSubmit = () => {
    if (!targetItem || !usedBy) return;
    const ok = issueStock(targetItem.id, issueQty, usedBy, department, 'Store Keeper', notes);
    if (ok) setIssueModalOpen(false);
    else alert('Insufficient stock to issue!');
  };

  const handleReceiveSubmit = () => {
    if (!targetItem) return;
    receiveStock(targetItem.id, receiveQty, supplierName);
    setReceiveModalOpen(false);
  };

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    addNewItem(newItem);
    setAddDrawerOpen(false);
  };

  return (
    <MainCard
      title="Factory Store Available Inventory Catalog"
      secondary={
        <Button variant="contained" startIcon={<PlusOutlined />} onClick={() => setAddDrawerOpen(true)}>
          Add New Store Item
        </Button>
      }
    >
      {/* Search & Filter Header */}
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Grid item xs={12} sm={5}>
          <OutlinedInput
            fullWidth
            placeholder="Search items, SKU tracking code, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />
        </Grid>

        <Grid item xs={12} sm="auto">
          <FormControl sx={{ minWidth: 240, width: 240 }}>
            <InputLabel>Category</InputLabel>
            <Select value={selectedCategory} label="Category" onChange={(e) => setSelectedCategory(e.target.value)}>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="textSecondary">
            Showing {filteredItems.length} of {items.length} Store Items
          </Typography>
        </Grid>
      </Grid>

      {/* Inventory Table */}
      <TableContainer>
        <Table sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>SKU / Item Code</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="center">Total Stock</TableCell>
              <TableCell align="center">Used Today</TableCell>
              <TableCell align="center">Remaining Available Stock</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell>Location</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => {
              const isLow = item.remainingStock <= item.minLevel;

              return (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.itemCode}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {item.id}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {item.name}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip label={item.category} size="small" variant="light" color="primary" />
                  </TableCell>

                  <TableCell align="center">
                    {item.totalStock} {item.unit}
                  </TableCell>

                  <TableCell align="center">
                    <Typography variant="subtitle2" color="error.main" fontWeight={700}>
                      {item.usedToday} {item.unit}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700} color={isLow ? 'error.main' : 'success.main'}>
                        {item.remainingStock} {item.unit}
                      </Typography>
                      {isLow && (
                        <Tooltip title={`Low Stock Alert! Min reorder level is ${item.minLevel} ${item.unit}`}>
                          <Chip icon={<WarningOutlined />} label="Low" size="small" color="warning" />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>

                  <TableCell align="right">{item.unitPrice}</TableCell>

                  <TableCell>
                    <Chip label={item.rackLocation || 'Store'} size="small" sx={{ bgcolor: 'grey.100' }} />
                  </TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Tooltip title="Issue Stock (Store OUT)">
                        <IconButton color="primary" size="small" onClick={() => handleOpenIssue(item)}>
                          <ExportOutlined />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Receive Shipment (Store IN)">
                        <IconButton color="success" size="small" onClick={() => handleOpenReceive(item)}>
                          <ImportOutlined />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Item">
                        <IconButton color="error" size="small" onClick={() => deleteItem(item.id)}>
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

      {/* Modal: Issue Item */}
      <Dialog open={issueModalOpen} onClose={() => setIssueModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>📤 Issue Item: {targetItem?.name}</DialogTitle>
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
              value={issueQty}
              onChange={(e) => setIssueQty(Math.max(1, parseInt(e.target.value) || 1))}
            />

            <TextField
              label="Who Used (Worker / Operator Name)"
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
          <Button onClick={() => setIssueModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleIssueSubmit}>
            Record Stock Issue
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Receive Shipment */}
      <Dialog open={receiveModalOpen} onClose={() => setReceiveModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>📦 Receive Stock: {targetItem?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Quantity Received"
              type="number"
              fullWidth
              inputProps={{ min: 1 }}
              value={receiveQty}
              onChange={(e) => setReceiveQty(Math.max(1, parseInt(e.target.value) || 1))}
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
          <Button onClick={() => setReceiveModalOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleReceiveSubmit}>
            Add Shipment Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Drawer: Add Item */}
      <Drawer anchor="right" open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)}>
        <Box sx={{ width: 420, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Add New Item to Factory Store
          </Typography>

          <form onSubmit={handleAddItemSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Item SKU / Tracking Code"
                fullWidth
                required
                value={newItem.itemCode}
                onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
              />

              <TextField
                label="Inventory Item Name"
                fullWidth
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />

              <TextField
                label="Category"
                fullWidth
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Total Initial Stock"
                    type="number"
                    fullWidth
                    required
                    value={newItem.totalStock}
                    onChange={(e) => setNewItem({ ...newItem, totalStock: parseInt(e.target.value) || 0 })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Unit"
                    fullWidth
                    required
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Unit Price"
                    type="number"
                    fullWidth
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Min Reorder Level"
                    type="number"
                    fullWidth
                    value={newItem.minLevel}
                    onChange={(e) => setNewItem({ ...newItem, minLevel: parseInt(e.target.value) || 5 })}
                  />
                </Grid>
              </Grid>

              <TextField
                label="Rack Location"
                fullWidth
                value={newItem.rackLocation}
                onChange={(e) => setNewItem({ ...newItem, rackLocation: e.target.value })}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => setAddDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  Save Item
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Drawer>
    </MainCard>
  );
}
