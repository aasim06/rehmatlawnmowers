import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Tooltip
} from '@mui/material';

// icons
import {
  PlusOutlined,
  ImportOutlined,
  ExportOutlined,
  DeleteOutlined,
  EditOutlined,
  WarningOutlined,
  ReloadOutlined,
  PlusSquareOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import { AppDataTable, AppButton } from 'components/common';
import { formatCategoryLabel } from 'utils/formatText';

const UNIT_OPTIONS = ['PCS', 'KG', 'Liter', 'Meter', 'Set'];

export default function ItemsPage() {
  const {
    items,
    masterItemNames = [],
    categories = [],
    issueStock,
    receiveStock,
    addNewItem,
    updateItem,
    deleteItem,
    deleteMultipleItems,
    cleanDuplicateItems,
    restoreDefaultStoreItems
  } = useStoreInventory();

  // Search & Category filter
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  // Add Item Drawer State (navigates to /inventory/items/add-name)
  const [newItem, setNewItem] = useState({
    itemCode: '',
    name: '',
    category: '',
    totalStock: '',
    unit: 'PCS',
    totalBillAmount: '',
    unitPrice: 0,
    minLevel: '',
    rackLocation: ''
  });

  // Edit Item Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Single Item Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Bulk Delete Confirmation Dialog State
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const categoryOptions = useMemo(() => {
    const rawSet = new Set([
      'General',
      ...(categories || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean),
      ...items.map((i) => i.category).filter(Boolean)
    ]);
    const list = Array.from(rawSet).filter(Boolean);
    return list.sort((a, b) => a.localeCompare(b));
  }, [categories, items]);

  const categoryFilteredItems = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') return items;
    return items.filter((i) => i.category === selectedCategory);
  }, [items, selectedCategory]);

  const columns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Item Name',
        sortable: true,
        render: (item) => (
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              {item.name}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Rack: {item.rackLocation || 'N/A'}
            </Typography>
          </Box>
        )
      },
      {
        id: 'category',
        label: 'Category',
        sortable: true,
        render: (item) => (
          <Chip
            label={formatCategoryLabel(item.category || 'General')}
            size="small"
            variant="outlined"
            color="primary"
          />
        )
      },
      {
        id: 'itemCode',
        label: 'SKU Code',
        sortable: true,
        render: (item) => (
          <Typography variant="subtitle2" fontWeight={600}>
            {item.itemCode}
          </Typography>
        )
      },
      {
        id: 'totalBillAmount',
        label: 'Total Bill Amount',
        align: 'right',
        sortable: true,
        render: (item) => {
          const totalBill = (item.totalBillAmount !== undefined && Number(item.totalBillAmount) > 0)
            ? Number(item.totalBillAmount)
            : ((Number(item.remainingStock || item.totalStock || 0)) * (Number(item.unitPrice) || 0));
          return (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                Rs. {Number(totalBill).toLocaleString()}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Rs. {(Number(item.unitPrice) || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} / {item.unit || 'PCS'}
              </Typography>
            </Box>
          );
        }
      },
      {
        id: 'unit',
        label: 'Units',
        align: 'center',
        sortable: true,
        render: (item) => <Chip label={item.unit} size="small" variant="outlined" />
      },
      {
        id: 'remainingStock',
        label: 'Stock Quantity',
        align: 'center',
        sortable: true,
        render: (item) => {
          const isLow = Number(item.remainingStock) <= Number(item.minLevel);
          return (
            <Typography variant="subtitle1" fontWeight={800} color={isLow ? 'error.main' : 'success.main'}>
              {item.remainingStock}
            </Typography>
          );
        }
      },
      {
        id: 'minLevel',
        label: 'Min Threshold',
        align: 'center',
        sortable: true,
        render: (item) => {
          const isLow = Number(item.remainingStock) <= Number(item.minLevel);
          return isLow ? (
            <Chip icon={<WarningOutlined />} label={`Low (${item.minLevel})`} color="error" size="small" sx={{ fontWeight: 700 }} />
          ) : (
            <Chip label={item.minLevel} size="small" variant="outlined" />
          );
        }
      }
    ],
    []
  );

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
    const stock = Number(item.totalStock) || Number(item.remainingStock) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const totalBill = item.totalBillAmount !== undefined ? item.totalBillAmount : (stock * unitPrice);

    setEditingItem({
      ...item,
      totalBillAmount: Math.round(totalBill * 100) / 100
    });
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
    const finalStock = parseInt(newItem.totalStock) || 0;
    const finalBill = parseFloat(newItem.totalBillAmount) || 0;
    const computedUnitPrice = finalStock > 0 ? (finalBill / finalStock) : (parseFloat(newItem.unitPrice) || 0);
    const finalItemCode = newItem.itemCode?.trim() || `SKU-${Math.floor(10000000 + Math.random() * 90000000)}`;
    const finalMinLevel = parseInt(newItem.minLevel) || 5;

    addNewItem({
      ...newItem,
      itemCode: finalItemCode,
      category: newItem.category?.trim() || 'General',
      totalStock: finalStock,
      totalBillAmount: finalBill,
      unitPrice: computedUnitPrice,
      minLevel: finalMinLevel,
      rackLocation: newItem.rackLocation?.trim() || ''
    });
    setAddDrawerOpen(false);
    setNewItem({
      itemCode: '',
      name: '',
      category: '',
      totalStock: '',
      unit: 'PCS',
      totalBillAmount: '',
      unitPrice: 0,
      minLevel: '',
      rackLocation: ''
    });
  };

  const handleEditItemSubmit = (e) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name) return;
    const stock = parseInt(editingItem.totalStock) || 0;
    const bill = parseFloat(editingItem.totalBillAmount) || 0;
    const computedUnitPrice = stock > 0 ? (bill / stock) : (parseFloat(editingItem.unitPrice) || 0);

    updateItem(editingItem.id, {
      ...editingItem,
      totalStock: stock,
      totalBillAmount: bill,
      unitPrice: computedUnitPrice
    });
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
      <MainCard title="Add New Store Inventory Item" sx={{ mb: 3 }}>
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
              {/* ROW 1: Item Name, Category, SKU, Location, Unit */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Autocomplete
                  freeSolo
                  options={masterItemNames.map((m) => m.name)}
                  value={newItem.name}
                  onInputChange={(event, newInputValue) => {
                    const matchedMaster = masterItemNames.find((m) => m.name.toLowerCase() === (newInputValue || '').toLowerCase());
                    const masterUnitPrice = matchedMaster?.unitPrice || 0;
                    setNewItem((prev) => {
                      const stock = parseInt(prev.totalStock) || 0;
                      const bill = (masterUnitPrice > 0 && stock > 0) ? (masterUnitPrice * stock) : prev.totalBillAmount;
                      return {
                        ...prev,
                        name: newInputValue || '',
                        category: matchedMaster ? matchedMaster.category : prev.category || '',
                        unit: matchedMaster ? (matchedMaster.defaultUnit || prev.unit) : prev.unit,
                        unitPrice: masterUnitPrice > 0 ? masterUnitPrice : prev.unitPrice,
                        totalBillAmount: bill
                      };
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

              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <Autocomplete
                  freeSolo
                  options={categoryOptions}
                  value={newItem.category || ''}
                  onChange={(event, newValue) => {
                    const val = typeof newValue === 'string' ? newValue : (newValue || '');
                    setNewItem((prev) => ({ ...prev, category: val }));
                  }}
                  onInputChange={(event, newInputValue) => {
                    setNewItem((prev) => ({ ...prev, category: newInputValue || '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="CATEGORY *"
                      required
                      placeholder="e.g. Electrical & Motors"
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <TextField
                  label="SKU CODE / SHORT ID"
                  fullWidth
                  placeholder="e.g. SKU-84564564 (Auto if blank)"
                  value={newItem.itemCode || ''}
                  onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="RACK / LOCATION"
                  fullWidth
                  placeholder="e.g. Rack A-01"
                  value={newItem.rackLocation || ''}
                  onChange={(e) => setNewItem({ ...newItem, rackLocation: e.target.value })}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  select
                  label="UNIT *"
                  fullWidth
                  required
                  value={newItem.unit || 'PCS'}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                >
                  {UNIT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* ROW 2: Stock, Total Bill, Min Level & Save Action */}
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <TextField
                  label="OPENING STOCK *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0 }}
                  value={newItem.totalStock !== undefined ? newItem.totalStock : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const stockNum = val === '' ? 0 : (parseInt(val) || 0);
                    const billNum = parseFloat(newItem.totalBillAmount) || 0;
                    const unitPrice = stockNum > 0 ? (billNum / stockNum) : billNum;
                    setNewItem((prev) => ({
                      ...prev,
                      totalStock: val,
                      unitPrice
                    }));
                  }}
                  helperText="Initial inventory count"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <TextField
                  label="TOTAL BILL AMOUNT (RS) *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 'any' }}
                  value={newItem.totalBillAmount !== undefined ? newItem.totalBillAmount : ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const billNum = val === '' ? 0 : (parseFloat(val) || 0);
                    const stockNum = parseInt(newItem.totalStock) || 0;
                    const unitPrice = stockNum > 0 ? (billNum / stockNum) : billNum;
                    setNewItem((prev) => ({
                      ...prev,
                      totalBillAmount: val,
                      unitPrice
                    }));
                  }}
                  helperText={
                    Number(newItem.totalStock) > 0 && Number(newItem.totalBillAmount) > 0
                      ? `Rate: Rs. ${(Number(newItem.totalBillAmount) / Number(newItem.totalStock)).toFixed(2)} / ${newItem.unit || 'PCS'}`
                      : 'Calculates rate per unit automatically'
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <TextField
                  label="MIN THRESHOLD *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 1 }}
                  value={newItem.minLevel !== undefined ? newItem.minLevel : ''}
                  onChange={(e) => setNewItem({ ...newItem, minLevel: e.target.value })}
                  helperText="Low stock alert trigger"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 12, md: 3 }}>
                <AppButton intent="primary" fullWidth type="submit" startIcon={<PlusOutlined />}>
                  Save New Store Item
                </AppButton>
              </Grid>
            </Grid>
          </Box>
        </form>
      </MainCard>

      {/* 2. BOTTOM SECTION: Store Inventory Items Table with AppDataTable */}
      <AppDataTable
        cardProps={{
          title: 'Store Inventory Items',
          secondary: (
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              {selected.length > 0 && (
                <AppButton intent="danger" startIcon={<DeleteOutlined />} onClick={() => setBulkDeleteDialogOpen(true)}>
                  Delete Selected ({selected.length})
                </AppButton>
              )}
              {items.length === 0 && typeof restoreDefaultStoreItems === 'function' && (
                <AppButton intent="primary" startIcon={<ReloadOutlined />} onClick={restoreDefaultStoreItems}>
                  Load Default Store Items (19 Items)
                </AppButton>
              )}
              <AppButton component={Link} to="/inventory/add-item-name" intent="secondary" startIcon={<PlusSquareOutlined />}>
                Item Names Directory ({masterItemNames?.length || 0})
              </AppButton>
              <AppButton intent="neutral" onClick={cleanDuplicateItems}>
                Clean Duplicates
              </AppButton>
            </Stack>
          )
        }}
        columns={columns}
        data={categoryFilteredItems}
        selectable
        selected={selected}
        onSelect={setSelected}
        searchPlaceholder="Search items, SKU code, rack location..."
        searchKeys={['name', 'itemCode', 'rackLocation', 'category']}
        initialSearch={urlSearch}
        toolbarLeft={
          <TextField
            select
            size="small"
            value={selectedCategory || 'All'}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 220, md: 240 },
              '& .MuiOutlinedInput-root': { height: 38 }
            }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    maxHeight: 280,
                    borderRadius: 2,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid',
                    borderColor: 'divider',
                    mt: 0.5,
                    '& .MuiMenuItem-root': {
                      fontSize: '0.85rem',
                      py: 0.8,
                      px: 1.5,
                      borderRadius: 1,
                      mx: 0.5,
                      my: 0.2,
                      '&.Mui-selected': {
                        fontWeight: 700,
                        bgcolor: 'primary.lighter',
                        color: 'primary.main'
                      }
                    }
                  }
                },
                anchorOrigin: {
                  vertical: 'bottom',
                  horizontal: 'left'
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'left'
                }
              }
            }}
          >
            <MenuItem value="All">All Categories</MenuItem>
            {categoryOptions.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {formatCategoryLabel(cat)}
              </MenuItem>
            ))}
          </TextField>
        }
        actions={(item) => (
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
              <IconButton color="primary" size="small" onClick={() => handleOpenEdit(item)}>
                <EditOutlined />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Item">
              <IconButton color="error" size="small" onClick={() => handleOpenDelete(item)}>
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
        emptyTitle="No Store Items Found"
        emptySubtitle="If items were cleared or factory reset, you can load the standard store catalog or add new items from pre-saved item names."
        emptyAction={
          <Stack direction="row" spacing={1.5} justifyContent="center" flexWrap="wrap">
            {typeof restoreDefaultStoreItems === 'function' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<ReloadOutlined />}
                onClick={restoreDefaultStoreItems}
                sx={{ fontWeight: 700 }}
              >
                Load Default Store Items (19 Items)
              </Button>
            )}
            <Button
              component={Link}
              to="/inventory/add-item-name"
              variant="outlined"
              color="secondary"
              startIcon={<PlusSquareOutlined />}
              sx={{ fontWeight: 700 }}
            >
              Item Names Directory ({masterItemNames?.length || 0})
            </Button>
          </Stack>
        }
      />

      {/* Modal 1: Stock Out */}
      <Dialog open={stockOutOpen} onClose={() => setStockOutOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Stock Out (Usage): {targetItem?.name}</DialogTitle>
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
        <DialogTitle sx={{ fontWeight: 700 }}>Stock In: {targetItem?.name}</DialogTitle>
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
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
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

                {/* 3. Total Bill Amount */}
                <TextField
                  label="Total Bill Amount (Rs.) *"
                  type="number"
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 'any' }}
                  value={editingItem.totalBillAmount !== undefined ? editingItem.totalBillAmount : ((Number(editingItem.totalStock) || 1) * (Number(editingItem.unitPrice) || 0))}
                  onChange={(e) => {
                    const val = e.target.value;
                    const billNum = parseFloat(val) || 0;
                    const stockNum = parseInt(editingItem.totalStock) || 1;
                    const unitPrice = stockNum > 0 ? (billNum / stockNum) : billNum;
                    setEditingItem((prev) => ({
                      ...prev,
                      totalBillAmount: val,
                      unitPrice
                    }));
                  }}
                  helperText={
                    Number(editingItem.totalStock) > 0 && Number(editingItem.totalBillAmount) > 0
                      ? `Rate: Rs. ${(Number(editingItem.totalBillAmount) / Number(editingItem.totalStock)).toFixed(2)} / ${editingItem.unit || 'PCS'}`
                      : 'Calculates rate per unit automatically'
                  }
                />

                {/* 4. Category */}
                <TextField
                  select
                  label="Category"
                  fullWidth
                  required
                  value={editingItem.category || 'General'}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        sx: {
                          maxHeight: 280,
                          borderRadius: 1.5,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                          mt: 0.5
                        }
                      },
                      anchorOrigin: {
                        vertical: 'bottom',
                        horizontal: 'left'
                      },
                      transformOrigin: {
                        vertical: 'top',
                        horizontal: 'left'
                      }
                    }
                  }}
                >
                  {categoryOptions.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {formatCategoryLabel(cat)}
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
                  onChange={(e) => {
                    const val = e.target.value;
                    const stockNum = parseInt(val) || 0;
                    const billNum = parseFloat(editingItem.totalBillAmount) || 0;
                    const unitPrice = stockNum > 0 ? (billNum / stockNum) : billNum;
                    setEditingItem((prev) => ({
                      ...prev,
                      totalStock: val === '' ? '' : stockNum,
                      unitPrice
                    }));
                  }}
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
          Delete Item Confirmation
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
          Delete All Selected Items Confirmation
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
