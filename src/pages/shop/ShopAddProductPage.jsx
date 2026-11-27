import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PictureOutlined from '@ant-design/icons/PictureOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import PlusSquareOutlined from '@ant-design/icons/PlusSquareOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';

import MainCard from 'components/MainCard';
import { AppButton, ConfirmDialog, FilterBar, PageHeader } from 'components/common';
import { ShopResetDialog } from 'components/shop';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import { compressImageFile, resolveShopCategories, SHOP_UNITS } from 'utils/shopHelpers';

const tableHeadCellSx = getTableHeadCellSx();

/**
 * Retail Shop Mart Product Management & Catalogue page.
 */
export default function ShopAddProductPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    items = [],
    categories = [],
    masterItemNames = [],
    addNewItem,
    updateItem,
    deleteItem,
    resetShopDataToZero,
    restoreDefaultShopItems,
    seedShopDemoData
  } = useStoreInventory();

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    specification: '',
    category: 'General',
    unit: 'PCS',
    unitPrice: '',
    totalStock: '',
    minLevel: '5',
    imageUrl: ''
  });

  const [editingItem, setEditingItem] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const formRef = useRef(null);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedCategory]);

  const availableCategories = useMemo(
    () => resolveShopCategories({ categories, items, includeAll: false }),
    [categories, items]
  );

  const existingProductNames = useMemo(
    () =>
      Array.from(new Set([...items.map((i) => i.name), ...(masterItemNames || []).map((m) => m.name)]))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [items, masterItemNames]
  );

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        (item.name || '').toLowerCase().includes(q) ||
        (item.specification || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);
      const matchCat = selectedCategory === 'All' || (item.category || 'General') === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [items, searchQuery, selectedCategory]);

  const paginatedProducts = filteredProducts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleProductNameChange = (event, newInputValue) => {
    const val = typeof newInputValue === 'string' ? newInputValue : newInputValue?.name || '';
    const matchedItem = items.find((i) => (i.name || '').toLowerCase() === val.toLowerCase());
    if (matchedItem) {
      setFormData((prev) => ({
        ...prev,
        name: val,
        specification: matchedItem.specification || prev.specification || '',
        category: matchedItem.category || prev.category || 'General',
        unit: matchedItem.unit || prev.unit || 'PCS',
        unitPrice: matchedItem.unitPrice !== undefined && matchedItem.unitPrice !== '' ? matchedItem.unitPrice : prev.unitPrice,
        minLevel: matchedItem.minLevel ?? prev.minLevel ?? '5',
        imageUrl: matchedItem.imageUrl || prev.imageUrl || ''
      }));
      return;
    }

    const matchedMaster = (masterItemNames || []).find((m) => (m.name || '').toLowerCase() === val.toLowerCase());
    if (matchedMaster) {
      setFormData((prev) => ({
        ...prev,
        name: val,
        category: matchedMaster.category || prev.category || 'General',
        unit: matchedMaster.defaultUnit || matchedMaster.unit || prev.unit || 'PCS',
        unitPrice: matchedMaster.unitPrice !== undefined && matchedMaster.unitPrice !== '' ? matchedMaster.unitPrice : prev.unitPrice
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, name: val }));
  };

  const handleLocalFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImageFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: compressedBase64 }));
    } catch (err) {
      console.error('File read error:', err);
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: '',
      specification: '',
      category: availableCategories[0] || 'General',
      unit: 'PCS',
      unitPrice: '',
      totalStock: '',
      minLevel: '5',
      imageUrl: ''
    });
    setEditingItem(null);
    setShowCustomCat(false);
    setCustomCategory('');
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      specification: item.specification || '',
      category: item.category || 'General',
      unit: item.unit || 'PCS',
      unitPrice: item.unitPrice ?? '',
      totalStock: item.totalStock ?? '',
      minLevel: item.minLevel ?? '5',
      imageUrl: item.imageUrl || ''
    });
    setShowCustomCat(false);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ open: true, message: 'Please enter a product name.', severity: 'warning' });
      return;
    }

    const priceNum = parseFloat(formData.unitPrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setToast({ open: true, message: 'Please enter a valid price (>= 0).', severity: 'warning' });
      return;
    }

    const stockNum = parseInt(formData.totalStock, 10);
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setToast({ open: true, message: 'Please enter a valid stock quantity (>= 0).', severity: 'warning' });
      return;
    }

    const finalCategory = showCustomCat && customCategory.trim() ? customCategory.trim() : formData.category;
    const payload = {
      name: formData.name.trim(),
      specification: (formData.specification || '').trim(),
      category: finalCategory || 'General',
      unit: formData.unit || 'PCS',
      unitPrice: priceNum,
      totalStock: stockNum,
      minLevel: parseInt(formData.minLevel, 10) || 5,
      imageUrl: formData.imageUrl || ''
    };

    try {
      if (editingItem && typeof updateItem === 'function') {
        await updateItem(editingItem.id, payload);
        setToast({ open: true, message: `Product "${payload.name}" updated successfully!`, severity: 'success' });
      } else if (typeof addNewItem === 'function') {
        await addNewItem(payload);
        setToast({ open: true, message: `Product "${payload.name}" added to Shop catalogue!`, severity: 'success' });
      }
      handleResetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      setToast({ open: true, message: 'Failed to save product.', severity: 'error' });
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (typeof deleteItem === 'function') {
        await deleteItem(itemToDelete.id);
        setToast({ open: true, message: `Product "${itemToDelete.name}" deleted.`, severity: 'info' });
      }
      if (editingItem?.id === itemToDelete.id) handleResetForm();
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleResetShopData = async () => {
    if (!resetShopDataToZero) return;
    setResetting(true);
    await resetShopDataToZero();
    setResetting(false);
    setResetConfirmOpen(false);
    setToast({ open: true, message: 'All Shop items and data reset to 0.', severity: 'info' });
  };

  const primaryTone = getToneColors(theme, 'primary');
  const warningTone = getToneColors(theme, 'warning');
  const errorTone = getToneColors(theme, 'error');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      <PageHeader
        title="Shop Products"
        count={items.length}
        countLabel="Items"
        subtitle="Add, update, and manage retail products for your Shop Mart POS counter."
        actions={
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {(typeof restoreDefaultShopItems === 'function' || typeof seedShopDemoData === 'function') && (
              <AppButton
                intent="secondary"
                startIcon={<ReloadOutlined />}
                onClick={async () => {
                  const fn = restoreDefaultShopItems || seedShopDemoData;
                  await fn();
                  setToast({ open: true, message: 'Default Shop products restored successfully!', severity: 'success' });
                }}
              >
                Restore Products
              </AppButton>
            )}
            <AppButton component={Link} to="/shop/mart" intent="primary" startIcon={<ShoppingCartOutlined />}>
              Open Shop Mart
            </AppButton>
            <AppButton intent="danger-outlined" startIcon={<DeleteOutlined />} onClick={() => setResetConfirmOpen(true)}>
              Factory Reset
            </AppButton>
          </Box>
        }
        sx={{ mb: 0 }}
      />

      {/* Add / Edit Product Card */}
      <Box ref={formRef}>
        <MainCard
          sx={getCardSurfaceSx(theme)}
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <PlusSquareOutlined style={{ fontSize: '1.15rem', color: editingItem ? warningTone.main : primaryTone.main }} />
                <Typography variant="h5" fontWeight={700}>
                  {editingItem ? `Edit Product: ${editingItem.name}` : 'Add New Product to Shop Mart'}
                </Typography>
              </Stack>
              {editingItem && (
                <Chip
                  label="Cancel Editing"
                  size="small"
                  color="warning"
                  onDelete={handleResetForm}
                  onClick={handleResetForm}
                  sx={{ fontWeight: 700, cursor: 'pointer' }}
                />
              )}
            </Box>
          }
        >
          <Box component="form" onSubmit={handleSubmit}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: 2,
                mb: 2.5
              }}
            >
              <Autocomplete
                freeSolo
                size="small"
                options={existingProductNames}
                value={formData.name || null}
                inputValue={formData.name}
                onChange={handleProductNameChange}
                onInputChange={(e, val, reason) => {
                  if (reason !== 'reset') handleProductNameChange(e, val);
                }}
                renderInput={(params) => <TextField {...params} label="Product Name *" required placeholder="Select or type product..." />}
              />

              <TextField
                size="small"
                label="Specification"
                fullWidth
                value={formData.specification}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                placeholder="e.g. Size, Power, Model"
              />

              {!showCustomCat ? (
                <TextField
                  select
                  size="small"
                  label="Category"
                  fullWidth
                  value={availableCategories.includes(formData.category) ? formData.category : availableCategories[0] || 'General'}
                  onChange={(e) => {
                    if (e.target.value === '__custom__') {
                      setShowCustomCat(true);
                    } else {
                      setFormData({ ...formData, category: e.target.value });
                    }
                  }}
                >
                  {availableCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem value="__custom__" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    + Add New Category
                  </MenuItem>
                </TextField>
              ) : (
                <TextField
                  size="small"
                  label="New Category Name"
                  fullWidth
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Electric Cables"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowCustomCat(false)}>
                          <CloseOutlined style={{ fontSize: 12 }} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}

              <TextField
                select
                size="small"
                label="Unit"
                fullWidth
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {SHOP_UNITS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                label="Price (PKR) *"
                type="number"
                required
                fullWidth
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0"
                inputProps={{ min: 0, step: 'any' }}
              />

              <TextField
                size="small"
                label="Stock Qty *"
                type="number"
                required
                fullWidth
                value={formData.totalStock}
                onChange={(e) => setFormData({ ...formData, totalStock: e.target.value })}
                placeholder="0"
                inputProps={{ min: 0 }}
              />

              <TextField
                size="small"
                label="Low Stock Alert"
                type="number"
                fullWidth
                value={formData.minLevel}
                onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
                placeholder="5"
                inputProps={{ min: 1 }}
              />

              <TextField
                size="small"
                label="Photo URL (Optional)"
                fullWidth
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://... or upload below"
              />
            </Box>

            <Box
              sx={getSubSurfaceSx(theme, {
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                p: 1.75,
                borderStyle: 'dashed'
              })}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                <AppButton component="label" intent="secondary" size="small" startIcon={<UploadOutlined />}>
                  Choose Picture from PC
                  <input type="file" hidden accept="image/*" onChange={handleLocalFileUpload} />
                </AppButton>

                {formData.imageUrl ? (
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 48,
                        height: 40,
                        borderRadius: 1.5,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Box
                        component="img"
                        src={formData.imageUrl}
                        alt="Preview"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                    <AppButton size="small" intent="ghost" color="error" onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}>
                      Remove Photo
                    </AppButton>
                  </Stack>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG or WEBP from PC (optional)
                  </Typography>
                )}
              </Stack>

              <Stack direction="row" spacing={1.25} justifyContent="flex-end">
                <AppButton type="button" intent="cancel" onClick={handleResetForm}>
                  Reset
                </AppButton>
                <AppButton type="submit" intent="primary" startIcon={editingItem ? <CheckCircleOutlined /> : <PlusOutlined />}>
                  {editingItem ? 'Update Product' : 'Save Product'}
                </AppButton>
              </Stack>
            </Box>
          </Box>
        </MainCard>
      </Box>

      {/* Products Catalogue Table */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Shop Products Catalogue ({filteredProducts.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                All retail products configured in the Shop Mart module.
              </Typography>
            </Box>
          </Box>

          <FilterBar
            hasActiveFilters={Boolean(searchQuery) || selectedCategory !== 'All'}
            onClear={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            sx={{ mb: 0, p: 1.25 }}
          >
            <OutlinedInput
              size="small"
              placeholder="Search products by name, spec, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 240 }, bgcolor: 'background.paper' }}
            />

            <TextField
              select
              size="small"
              label="Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ minWidth: 180, bgcolor: 'background.paper' }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {availableCategories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </TextField>
          </FilterBar>
        </Box>

        {filteredProducts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <PictureOutlined style={{ fontSize: 42, color: theme.palette.text.disabled, marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={700} color="text.secondary">
              No Products Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {items.length === 0
                ? 'Your shop catalogue is currently empty. Use the form above to add products.'
                : 'No products matched your search or category filter.'}
            </Typography>
            {items.length === 0 && (typeof restoreDefaultShopItems === 'function' || typeof seedShopDemoData === 'function') && (
              <AppButton
                intent="primary"
                startIcon={<ReloadOutlined />}
                onClick={async () => {
                  const fn = restoreDefaultShopItems || seedShopDemoData;
                  await fn();
                  setToast({ open: true, message: 'Default Shop products restored successfully!', severity: 'success' });
                }}
              >
                Restore Default Shop Products
              </AppButton>
            )}
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
            <Table sx={{ minWidth: 760 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <TableCell sx={{ ...tableHeadCellSx, pl: 2.5 }}>Product</TableCell>
                  <TableCell sx={tableHeadCellSx}>Category</TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    Price
                  </TableCell>
                  <TableCell align="center" sx={tableHeadCellSx}>
                    Stock
                  </TableCell>
                  <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.map((item) => {
                  const stock = parseInt(item.totalStock, 10) || 0;
                  const min = parseInt(item.minLevel, 10) || 5;
                  const isLowStock = stock <= min;
                  const isOutOfStock = stock <= 0;
                  const isCurrentEditing = editingItem?.id === item.id;

                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        '& td': { py: 1.5 },
                        bgcolor: isCurrentEditing ? warningTone.bg : 'inherit'
                      }}
                    >
                      <TableCell sx={{ pl: 2.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={item.imageUrl}
                            alt={item.name}
                            variant="rounded"
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: isDark ? 'grey.800' : 'grey.100',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <PictureOutlined />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[item.specification, `Unit: ${item.unit || 'PCS'}`].filter(Boolean).join(' • ')}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip label={item.category || 'General'} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatPKR(item.unitPrice)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip
                          label={isOutOfStock ? '0 Out of Stock' : `${stock} ${item.unit || 'PCS'}`}
                          size="small"
                          color={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'success'}
                          variant="light"
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      </TableCell>

                      <TableCell align="center" sx={{ pr: 2.5 }}>
                        <Box sx={{ display: 'inline-flex', gap: 0.75 }}>
                          <Tooltip title="Edit Product">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(item)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                color: 'text.secondary',
                                '&:hover': { bgcolor: primaryTone.bg, color: primaryTone.main, borderColor: primaryTone.border }
                              }}
                            >
                              <EditOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Product">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setItemToDelete(item);
                                setDeleteConfirmOpen(true);
                              }}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                color: 'text.secondary',
                                '&:hover': { bgcolor: errorTone.bg, color: errorTone.main, borderColor: errorTone.border }
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {filteredProducts.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </MainCard>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete Product?"
        message={
          <>
            Are you sure you want to delete <strong>&quot;{itemToDelete?.name}&quot;</strong> from the Shop catalogue?
          </>
        }
        confirmText="Delete Product"
      />

      <ShopResetDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={handleResetShopData}
        loading={resetting}
      />

      <Snackbar open={toast.open} autoHideDuration={3500} onClose={() => setToast((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ fontWeight: 600 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
