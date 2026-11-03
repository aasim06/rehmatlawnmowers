import { useState, useMemo, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Paper from '@mui/material/Paper';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Avatar from '@mui/material/Avatar';

// project imports
import MainCard from 'components/MainCard';

// assets / icons
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import PlusSquareOutlined from '@ant-design/icons/PlusSquareOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import ThunderboltOutlined from '@ant-design/icons/ThunderboltOutlined';
import PictureOutlined from '@ant-design/icons/PictureOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';

// Preset photo options for quick setup
const DEMO_PICTURE_PRESETS = [
  { label: 'Lawn Mower Machine', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cutting Blade', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Spark Plug', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80' },
  { label: '4T Engine Oil', url: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Rubber Wheel', url: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Air Filter Cartridge', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Grass Trimmer Line', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80' },
  { label: 'Grass Catcher Bag', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' }
];

const DEFAULT_CATEGORIES = [
  'Lawn Mowers',
  'Accessories',
  'Blades & Cutters',
  'Engine Parts',
  'Oils & Lubricants',
  'Spare Parts',
  'General'
];

const UNIT_OPTIONS = ['PCS', 'Set', 'Unit', 'KG', 'Liter', 'Meter', 'Roll', 'Bottle'];

// Client-side image optimizer for fast storage & instant loading
const compressImageFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 500;
        const scale = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function ShopAddProductPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    items = [],
    categories = [],
    addNewItem,
    updateItem,
    deleteItem,
    seedShopDemoData,
    resetShopDataToZero
  } = useStoreInventory();

  // Factory Reset State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetShopData = async () => {
    if (!resetShopDataToZero) return;
    setResetting(true);
    await resetShopDataToZero();
    setResetting(false);
    setResetConfirmOpen(false);
    setSuccessMsg('All Shop items and data reset to 0 successfully!');
  };

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Lawn Mowers',
    unit: 'PCS',
    unitPrice: '',
    totalStock: '',
    minLevel: '5',
    imageUrl: ''
  });

  const [editingItem, setEditingItem] = useState(null);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Notification State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  // Delete Confirmation State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const formRef = useRef(null);

  // Available Categories (Context + Defaults)
  const availableCategories = useMemo(() => {
    const fromCats = (categories || []).map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean);
    const fromItems = (items || []).map((i) => i.category).filter(Boolean);
    const combined = Array.from(new Set([...DEFAULT_CATEGORIES, ...fromCats, ...fromItems])).sort();
    return combined;
  }, [categories, items]);

  // Filtered Items for List
  const filteredProducts = useMemo(() => {
    return items.filter((item) => {
      const matchSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'All' || (item.category || 'General') === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [items, searchQuery, selectedCategory]);

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

  // Reset to page 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedCategory]);

  // Paginated Products (renders only current page for fast performance with large datasets)
  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  // Handle local image upload
  const handleLocalFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file);
        setFormData((prev) => ({ ...prev, imageUrl: compressedBase64 }));
      } catch (err) {
        console.error('File read error:', err);
      }
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setFormData({
      name: '',
      category: 'Lawn Mowers',
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

  // Open Edit Mode
  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'General',
      unit: item.unit || 'PCS',
      unitPrice: item.unitPrice || '',
      totalStock: item.totalStock ?? '',
      minLevel: item.minLevel ?? '5',
      imageUrl: item.imageUrl || ''
    });
    setShowCustomCat(false);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Save / Update Product
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setToast({ open: true, message: 'Please enter a product name', severity: 'warning' });
      return;
    }

    const priceNum = parseFloat(formData.unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setToast({ open: true, message: 'Please enter a valid price (>= 0)', severity: 'warning' });
      return;
    }

    const stockNum = parseInt(formData.totalStock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setToast({ open: true, message: 'Please enter a valid stock quantity (>= 0)', severity: 'warning' });
      return;
    }

    const finalCategory = showCustomCat && customCategory.trim() ? customCategory.trim() : formData.category;

    const payload = {
      name: formData.name.trim(),
      category: finalCategory || 'General',
      unit: formData.unit || 'PCS',
      unitPrice: priceNum,
      totalStock: stockNum,
      minLevel: parseInt(formData.minLevel, 10) || 5,
      imageUrl: formData.imageUrl || ''
    };

    try {
      if (editingItem) {
        if (typeof updateItem === 'function') {
          await updateItem(editingItem.id, payload);
          setToast({ open: true, message: `Product "${payload.name}" updated successfully!`, severity: 'success' });
        }
      } else {
        if (typeof addNewItem === 'function') {
          await addNewItem(payload);
          setToast({ open: true, message: `Product "${payload.name}" added to Shop catalogue!`, severity: 'success' });
        }
      }
      handleResetForm();
    } catch (err) {
      console.error('Error saving product:', err);
      setToast({ open: true, message: 'Failed to save product. Please try again.', severity: 'error' });
    }
  };

  // Confirm Delete
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      if (typeof deleteItem === 'function') {
        await deleteItem(itemToDelete.id);
        setToast({ open: true, message: `Product "${itemToDelete.name}" deleted.`, severity: 'info' });
      }
      if (editingItem?.id === itemToDelete.id) {
        handleResetForm();
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      setToast({ open: true, message: 'Failed to delete product.', severity: 'error' });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── HEADER TITLE & ACTION BUTTONS ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 3, gap: 1.5 }}>
        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.5, fontSize: { xs: '1.4rem', sm: '1.75rem' } }}>
              Shop Products &amp; Add Product
            </Typography>
            <Chip
              label="Shop Module"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.8125rem' }}>
            Add, update and manage retail products for Shop Mart POS Counter
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            component={Link}
            to="/shop/mart"
            variant="contained"
            color="warning"
            size="small"
            startIcon={<ShoppingCartOutlined />}
            sx={{ fontWeight: 700, borderRadius: 1.5, height: 35, fontSize: '0.78rem', bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' } }}
          >
            Open Shop Mart
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => setResetConfirmOpen(true)}
            startIcon={<DeleteOutlined />}
            sx={{ fontWeight: 800, borderRadius: 1.5, height: 35, fontSize: '0.78rem' }}
          >
            Factory Reset (0)
          </Button>
        </Stack>
      </Box>

      {/* ── 1. ADD / EDIT PRODUCT CARD (TOP FULL-WIDTH) ── */}
      <Box sx={{ mb: 3 }} ref={formRef}>
        <MainCard
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <PlusSquareOutlined style={{ fontSize: '1.15rem', color: editingItem ? '#f59e0b' : theme.palette.primary.main }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
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
                  sx={{ fontWeight: 700, height: 24, cursor: 'pointer' }}
                />
              )}
            </Box>
          }
          sx={{
            boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 14px rgba(0,0,0,0.06)')
          }}
        >
          <Box component="form" onSubmit={handleSubmit}>
            {/* 4 INPUTS UPAR & 4 INPUTS NEECHE (Strict 4-Column Grid) */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(4, 1fr)'
                },
                gap: 2,
                mb: 2.5
              }}
            >
              {/* ── ROW 1 (4 INPUTS UPAR) ── */}
              {/* 1. Product Name */}
              <TextField
                label="Product Name"
                required
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Lawn Mower Cutting Blade"
              />

              {/* 2. Category */}
              {!showCustomCat ? (
                <TextField
                  select
                  label="Category"
                  fullWidth
                  value={formData.category}
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
                  label="New Category Name"
                  fullWidth
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Electric Cables"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowCustomCat(false)}>
                          <CloseOutlined style={{ fontSize: '0.75rem' }} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              )}

              {/* 3. Unit */}
              <TextField
                select
                label="Unit"
                fullWidth
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              >
                {UNIT_OPTIONS.map((u) => (
                  <MenuItem key={u} value={u}>
                    {u}
                  </MenuItem>
                ))}
              </TextField>

              {/* 4. Price (PKR) */}
              <TextField
                label="Price (PKR)"
                type="number"
                required
                fullWidth
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                placeholder="0"
                inputProps={{ min: 0, step: 'any' }}
              />

              {/* ── ROW 2 (4 INPUTS NEECHE) ── */}
              {/* 5. Stock Qty */}
              <TextField
                label="Stock Qty"
                type="number"
                required
                fullWidth
                value={formData.totalStock}
                onChange={(e) => setFormData({ ...formData, totalStock: e.target.value })}
                placeholder="0"
                inputProps={{ min: 0 }}
              />

              {/* 6. Low Stock Warning Level */}
              <TextField
                label="Low Stock Alert Level"
                type="number"
                fullWidth
                value={formData.minLevel}
                onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
                placeholder="5"
                inputProps={{ min: 1 }}
              />

              {/* 7. Quick Photo Preset */}
              <TextField
                select
                fullWidth
                label="Quick Photo Preset"
                value={DEMO_PICTURE_PRESETS.some((p) => p.url === formData.imageUrl) ? formData.imageUrl : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setFormData({ ...formData, imageUrl: e.target.value });
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  -- Select Photo Preset --
                </MenuItem>
                {DEMO_PICTURE_PRESETS.map((preset) => (
                  <MenuItem key={preset.label} value={preset.url} sx={{ fontSize: '0.875rem' }}>
                    {preset.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* 8. Photo URL */}
              <TextField
                label="Photo URL"
                fullWidth
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://... or paste link"
              />
            </Box>

            {/* ── ROW 3: PICTURE UPLOAD, PREVIEW & ACTION BUTTONS ── */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                justifyContent: 'space-between',
                gap: 2,
                p: 1.75,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'grey.50'
              }}
            >
              {/* Left: Upload Button & Live Thumbnail */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                <Button
                  component="label"
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<UploadOutlined />}
                  sx={{ fontWeight: 700, borderRadius: 1.5, height: 36, px: 2 }}
                >
                  Choose Picture from PC
                  <input type="file" hidden accept="image/*" onChange={handleLocalFileUpload} />
                </Button>

                {formData.imageUrl ? (
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 52,
                        height: 42,
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
                    <Button
                      size="small"
                      color="error"
                      variant="text"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      sx={{ fontSize: '0.72rem', fontWeight: 700, p: 0.5 }}
                    >
                      Remove Photo
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    JPG, PNG or WEBP from PC (optional)
                  </Typography>
                )}
              </Stack>

              {/* Right: Submit & Reset Buttons */}
              <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  onClick={handleResetForm}
                  sx={{ fontWeight: 700, px: 2.5, borderRadius: 1.5, height: 36 }}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  startIcon={editingItem ? <CheckCircleOutlined /> : <PlusOutlined />}
                  sx={{ fontWeight: 800, px: 3, borderRadius: 1.5, height: 36 }}
                >
                  {editingItem ? 'Update Product' : '+ Save Product'}
                </Button>
              </Stack>
            </Box>
          </Box>
        </MainCard>
      </Box>

      {/* ── 2. SHOP PRODUCTS CATALOGUE (BOTTOM FULL-WIDTH TABLE) ── */}
      <MainCard
        title={
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Shop Products Catalogue ({filteredProducts.length})
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                All retail products configured in the Shop module
              </Typography>
            </Box>

            {/* Search Input & Category Filter */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                size="small"
                placeholder="Search products by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: { xs: '100%', sm: 240 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseOutlined style={{ fontSize: '0.75rem' }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }}
              />

              <TextField
                select
                size="small"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="All">All Categories</MenuItem>
                {availableCategories.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Box>
        }
      >
        {/* Table */}
        {filteredProducts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
            <PictureOutlined style={{ fontSize: 44, color: '#94a3b8', marginBottom: 12 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              No Products Found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {items.length === 0
                ? 'Your shop catalogue is currently empty. Use the form above to add products.'
                : 'No products matched your search or category filter.'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, maxHeight: 600 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Product</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
                    Price
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="center">
                    Stock
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">
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
                        bgcolor: isCurrentEditing ? (isDark ? 'rgba(255,193,7,0.12)' : 'rgba(255,193,7,0.08)') : 'inherit',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {/* Product Thumbnail & Name */}
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            src={item.imageUrl}
                            alt={item.name}
                            variant="rounded"
                            sx={{
                              width: 42,
                              height: 42,
                              bgcolor: isDark ? 'grey.800' : 'grey.200',
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <PictureOutlined />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Unit: {item.unit || 'PCS'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <Chip
                          label={item.category || 'General'}
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.72rem', height: 22 }}
                        />
                      </TableCell>

                      {/* Price */}
                      <TableCell align="right">
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>
                          Rs. {(parseFloat(item.unitPrice) || 0).toLocaleString()}
                        </Typography>
                      </TableCell>

                      {/* Stock Status */}
                      <TableCell align="center">
                        <Chip
                          label={isOutOfStock ? '0 Out of Stock' : `${stock} ${item.unit || 'PCS'}`}
                          size="small"
                          color={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'success'}
                          variant={isOutOfStock ? 'filled' : 'outlined'}
                          sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Edit Product">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleEditClick(item)}
                              sx={{
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100',
                                '&:hover': { bgcolor: 'primary.light', color: '#fff' }
                              }}
                            >
                              <EditOutlined style={{ fontSize: '0.85rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Product">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setItemToDelete(item);
                                setDeleteConfirmOpen(true);
                              }}
                              sx={{
                                bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100',
                                '&:hover': { bgcolor: 'error.main', color: '#fff' }
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: '0.85rem' }} />
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
        )}

        {filteredProducts.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          />
        )}
      </MainCard>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>&quot;{itemToDelete?.name}&quot;</strong> from the Shop catalogue?
            This product will no longer appear in Shop Mart.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteItem} color="error" variant="contained" sx={{ fontWeight: 700 }}>
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── FACTORY RESET CONFIRMATION DIALOG ── */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 500 } } }}>
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main' }}>
          ⚠️ Confirm Factory Reset Shop Data?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to wipe all Shop inventory products, stock counts, counter sales slips, and ledger records? This action will set all shop data to 0 for a completely fresh start.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleResetShopData} color="error" variant="contained" disabled={resetting} sx={{ fontWeight: 800, borderRadius: 1.5, px: 3 }}>
            {resetting ? 'Resetting...' : 'Yes, Reset All Shop Data to 0'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── SNACKBAR NOTIFICATION ── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 700, borderRadius: 2 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
