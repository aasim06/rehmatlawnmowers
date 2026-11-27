import { useState, useMemo } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// icons
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PlusSquareOutlined from '@ant-design/icons/PlusSquareOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';

// project imports (New Master Components)
import { PageHeader, AppDataTable, FormDialog, ConfirmDialog, AppButton } from 'components/common';
import { formatCategoryLabel } from 'utils/formatText';

const UNIT_OPTIONS = ['PCS', 'KG', 'Liter', 'Meter', 'Set'];

const modalMenuProps = {
  PaperProps: {
    sx: {
      maxHeight: 240,
      borderRadius: 1.5,
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      mt: 0.5,
      '& .MuiMenuItem-root': {
        fontSize: '0.875rem',
        py: 0.8,
        px: 1.5
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
};

export default function AddItemNamePage() {
  const {
    items = [],
    categories = [],
    masterItemNames = [],
    addMasterItemName,
    updateMasterItemName,
    deleteMasterItemName,
    deleteMultipleMasterItemNames,
    restoreDefaultMasterItemNames
  } = useStoreInventory();

  // Search & Category filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selected, setSelected] = useState([]);
  const [restoring, setRestoring] = useState(false);
  const [restoredSnackbar, setRestoredSnackbar] = useState(false);

  // Add Item Dialog State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemName, setNewItemName] = useState({
    name: '',
    skuCode: '',
    totalBillAmount: '',
    unitPrice: 0,
    category: 'General',
    defaultUnit: 'PCS',
    initialStock: '',
    minThreshold: '10'
  });

  // Edit Item Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItemName, setEditingItemName] = useState(null);

  // Delete Dialog States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  // Category filter options
  const categoryOptions = useMemo(() => {
    const rawSet = new Set([
      'General',
      ...(categories || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    ]);
    return Array.from(rawSet).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  // Filter master items by Category (search is handled automatically by AppDataTable)
  const displayItems = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'All') return masterItemNames;
    return masterItemNames.filter((m) => (m.category || 'General') === selectedCategory);
  }, [masterItemNames, selectedCategory]);

  // Restore Default Item Names Handler
  const handleRestoreDefaults = async () => {
    setRestoring(true);
    if (restoreDefaultMasterItemNames) {
      await restoreDefaultMasterItemNames();
    }
    setRestoring(false);
    setRestoredSnackbar(true);
  };

  // Add Submit Handler
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItemName.name.trim()) return;

    const stock = parseInt(newItemName.initialStock) || 0;
    const bill = parseFloat(newItemName.totalBillAmount) || 0;
    const computedUnitPrice = stock > 0 ? bill / stock : parseFloat(newItemName.unitPrice) || 0;

    addMasterItemName({
      ...newItemName,
      initialStock: stock,
      totalBillAmount: bill,
      unitPrice: computedUnitPrice
    });

    setNewItemName({
      name: '',
      skuCode: '',
      totalBillAmount: '',
      unitPrice: 0,
      category: 'General',
      defaultUnit: 'PCS',
      initialStock: '',
      minThreshold: '10'
    });
    setAddDialogOpen(false);
  };

  // Edit Submit Handler
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingItemName || !editingItemName.name.trim()) return;

    const stock = parseInt(editingItemName.initialStock) || 0;
    const bill = parseFloat(editingItemName.totalBillAmount) || 0;
    const computedUnitPrice = stock > 0 ? bill / stock : parseFloat(editingItemName.unitPrice) || 0;

    updateMasterItemName(editingItemName.id, {
      ...editingItemName,
      initialStock: stock,
      totalBillAmount: bill,
      unitPrice: computedUnitPrice
    });
    setEditDialogOpen(false);
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

  // Table Columns Definition
  const columns = useMemo(
    () => [
      {
        id: 'id',
        label: 'ID',
        minWidth: 90,
        sortable: true,
        render: (row) => (
          <Typography variant="caption" fontWeight={600} color="text.secondary">
            {row.id}
          </Typography>
        )
      },
      {
        id: 'name',
        label: 'Pre-saved Master Item Name',
        minWidth: 220,
        sortable: true,
        render: (row) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <PlusSquareOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            <Typography variant="subtitle2" fontWeight={700}>
              {row.name}
            </Typography>
          </Stack>
        )
      },
      {
        id: 'category',
        label: 'Category',
        minWidth: 150,
        sortable: true,
        render: (row) => <Chip label={formatCategoryLabel(row.category || 'General')} size="small" variant="light" color="primary" />
      },
      {
        id: 'defaultUnit',
        label: 'Default Unit',
        minWidth: 110,
        align: 'center',
        sortable: true,
        render: (row) => <Chip label={row.defaultUnit || 'PCS'} size="small" sx={{ bgcolor: 'grey.100' }} />
      },
      {
        id: 'usedCount',
        label: 'Store Items Using This Name',
        minWidth: 180,
        align: 'center',
        render: (row) => {
          const count = items.filter((i) => i.name && i.name.toLowerCase() === (row.name || '').toLowerCase()).length;
          return (
            <Typography variant="subtitle2" fontWeight={700} color={count > 0 ? 'success.main' : 'text.secondary'}>
              {count} active store item{count === 1 ? '' : 's'}
            </Typography>
          );
        }
      }
    ],
    [items]
  );

  return (
    <Box>
      {/* 1. Universal Page Header */}
      <PageHeader
        title="Master Item Names Directory"
        subtitle="Save your factory store item names here once so you don't need to retype them when receiving or issuing stock."
        count={displayItems.length}
        countLabel="Item Names"
        actions={
          <>
            {selected.length > 0 && (
              <AppButton intent="danger" startIcon={<DeleteOutlined />} onClick={() => setBulkDeleteDialogOpen(true)}>
                Delete Selected ({selected.length})
              </AppButton>
            )}
            <AppButton
              intent="secondary"
              loading={restoring}
              loadingText="Restoring..."
              startIcon={<ReloadOutlined />}
              onClick={handleRestoreDefaults}
            >
              Restore Defaults (40+ Items)
            </AppButton>
            <AppButton intent="primary" startIcon={<PlusOutlined />} onClick={() => setAddDialogOpen(true)}>
              Add Master Item Name
            </AppButton>
          </>
        }
      />

      {/* 2. Universal Master Data Table */}
      <AppDataTable
        columns={columns}
        data={displayItems}
        searchPlaceholder="Search saved item names, categories, IDs..."
        searchKeys={['name', 'category', 'id', 'skuCode']}
        selectable
        selected={selected}
        onSelect={setSelected}
        defaultRowsPerPage={10}
        toolbarRight={
          <TextField
            select
            size="small"
            value={selectedCategory || 'All'}
            onChange={(e) => setSelectedCategory(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 220 },
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
                  horizontal: 'right'
                },
                transformOrigin: {
                  vertical: 'top',
                  horizontal: 'right'
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
        actions={(row) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="Edit Item Name">
              <IconButton
                color="primary"
                size="small"
                onClick={() => {
                  const stock = Number(row.initialStock) || 50;
                  const unitPrice = Number(row.unitPrice) || 0;
                  const totalBill = row.totalBillAmount !== undefined ? row.totalBillAmount : stock * unitPrice;
                  setEditingItemName({
                    ...row,
                    totalBillAmount: Math.round(totalBill * 100) / 100
                  });
                  setEditDialogOpen(true);
                }}
              >
                <EditOutlined />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Item Name">
              <IconButton
                color="error"
                size="small"
                onClick={() => {
                  setItemToDelete(row);
                  setDeleteDialogOpen(true);
                }}
              >
                <DeleteOutlined />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      />

      {/* 3. Universal Add Form Dialog */}
      <FormDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        title="Add Master Item Name"
        subtitle="Create a reusable item specification for store inventory & billing."
        saveText="Save Item Name"
        onSubmit={handleAddSubmit}
      >
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Item Name"
            fullWidth
            required
            placeholder="e.g. 3HP Electric Motor (3-Phase)"
            value={newItemName.name}
            onChange={(e) => setNewItemName({ ...newItemName, name: e.target.value })}
          />

          <TextField
            label="SKU Code / Short ID"
            fullWidth
            placeholder="e.g. SKU-84564564 (Auto if blank)"
            value={newItemName.skuCode}
            onChange={(e) => setNewItemName({ ...newItemName, skuCode: e.target.value })}
          />

          <TextField
            label="Total Bill Amount (Rs.) *"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0, step: 'any' }}
            value={newItemName.totalBillAmount}
            onChange={(e) => {
              const val = e.target.value;
              const billNum = parseFloat(val) || 0;
              const stockNum = parseInt(newItemName.initialStock) || 0;
              const unitPrice = stockNum > 0 ? billNum / stockNum : billNum;
              setNewItemName((prev) => ({ ...prev, totalBillAmount: val, unitPrice }));
            }}
            helperText={
              Number(newItemName.initialStock) > 0 && Number(newItemName.totalBillAmount) > 0
                ? `Rate: Rs. ${(Number(newItemName.totalBillAmount) / Number(newItemName.initialStock)).toFixed(2)} / ${newItemName.defaultUnit || 'PCS'}`
                : 'Calculates rate per unit automatically'
            }
          />

          <TextField
            select
            label="Category"
            fullWidth
            required
            value={newItemName.category || 'General'}
            onChange={(e) => setNewItemName({ ...newItemName, category: e.target.value })}
            SelectProps={{
              MenuProps: modalMenuProps
            }}
          >
            {categoryOptions.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {formatCategoryLabel(cat)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Measurement Unit"
            fullWidth
            required
            value={newItemName.defaultUnit}
            onChange={(e) => setNewItemName({ ...newItemName, defaultUnit: e.target.value })}
            SelectProps={{
              MenuProps: modalMenuProps
            }}
          >
            {UNIT_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Initial Stock Quantity"
            type="number"
            fullWidth
            required
            inputProps={{ min: 0 }}
            value={newItemName.initialStock}
            onChange={(e) => {
              const val = e.target.value;
              const stockNum = parseInt(val) || 0;
              const billNum = parseFloat(newItemName.totalBillAmount) || 0;
              const unitPrice = stockNum > 0 ? billNum / stockNum : billNum;
              setNewItemName((prev) => ({
                ...prev,
                initialStock: val === '' ? '' : stockNum,
                unitPrice
              }));
            }}
          />

          <TextField
            label="Min Threshold (Low Stock Alert Level)"
            type="number"
            fullWidth
            required
            inputProps={{ min: 1 }}
            value={newItemName.minThreshold}
            onChange={(e) => setNewItemName({ ...newItemName, minThreshold: e.target.value })}
          />
        </Stack>
      </FormDialog>

      {/* 4. Universal Edit Form Dialog */}
      <FormDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title="Edit Master Item Name"
        subtitle={editingItemName ? `Editing ID: ${editingItemName.id}` : ''}
        saveText="Update Changes"
        onSubmit={handleEditSubmit}
      >
        {editingItemName && (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
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
              label="Total Bill Amount (Rs.) *"
              type="number"
              fullWidth
              value={editingItemName.totalBillAmount !== undefined ? editingItemName.totalBillAmount : ''}
              onChange={(e) => {
                const val = e.target.value;
                const billNum = parseFloat(val) || 0;
                const stockNum = parseInt(editingItemName.initialStock) || 1;
                const unitPrice = stockNum > 0 ? billNum / stockNum : billNum;
                setEditingItemName((prev) => ({ ...prev, totalBillAmount: val, unitPrice }));
              }}
            />

            <TextField
              select
              label="Category"
              fullWidth
              value={editingItemName.category || 'General'}
              onChange={(e) => setEditingItemName({ ...editingItemName, category: e.target.value })}
              SelectProps={{
                MenuProps: modalMenuProps
              }}
            >
              {categoryOptions.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {formatCategoryLabel(cat)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Default Unit"
              fullWidth
              value={editingItemName.defaultUnit || 'PCS'}
              onChange={(e) => setEditingItemName({ ...editingItemName, defaultUnit: e.target.value })}
              SelectProps={{
                MenuProps: modalMenuProps
              }}
            >
              {UNIT_OPTIONS.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Initial Stock Quantity"
              type="number"
              fullWidth
              value={editingItemName.initialStock || 0}
              onChange={(e) => {
                const val = e.target.value;
                const stockNum = parseInt(val) || 0;
                const billNum = parseFloat(editingItemName.totalBillAmount) || 0;
                const unitPrice = stockNum > 0 ? billNum / stockNum : billNum;
                setEditingItemName((prev) => ({
                  ...prev,
                  initialStock: val === '' ? '' : stockNum,
                  unitPrice
                }));
              }}
            />

            <TextField
              label="Min Threshold Level"
              type="number"
              fullWidth
              value={editingItemName.minThreshold || 10}
              onChange={(e) => setEditingItemName({ ...editingItemName, minThreshold: parseInt(e.target.value) || 1 })}
            />
          </Stack>
        )}
      </FormDialog>

      {/* 5. Delete Dialogs */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmSingleDelete}
        title="Delete Item Name"
        message={
          <>
            Are you sure you want to delete master item name <strong>&quot;{itemToDelete?.name}&quot;</strong>?
          </>
        }
        confirmText="Confirm Delete"
      />

      <ConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title="Bulk Delete Confirmation"
        message={
          <>
            Are you sure you want to delete all <strong>{selected.length} selected item names</strong>?
          </>
        }
        confirmText={`Delete Selected (${selected.length})`}
      />

      {/* Snackbar for restore alert */}
      <Snackbar
        open={restoredSnackbar}
        autoHideDuration={4000}
        onClose={() => setRestoredSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setRestoredSnackbar(false)} severity="success" sx={{ width: '100%', fontWeight: 700 }}>
          All default master item names restored successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
}
