import { useState, useMemo, useEffect } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

// Icons
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import MinusOutlined from '@ant-design/icons/MinusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import PhoneOutlined from '@ant-design/icons/PhoneOutlined';
import ThunderboltOutlined from '@ant-design/icons/ThunderboltOutlined';
import PictureOutlined from '@ant-design/icons/PictureOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import CeoSignature from 'components/CeoSignature';

// Quick picture presets for lawn mower store (flat text, no emojis)
const DEMO_PICTURE_PRESETS = [
  { label: 'Lawn Mower', url: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Cutting Blade', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80' },
  { label: 'Spark Plug', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=600&q=80' },
  { label: '4T Engine Oil', url: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Rubber Wheel', url: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Air Filter', url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80' },
  { label: 'Trimmer Line', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80' },
  { label: 'Catcher Bag', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80' }
];

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

// ==============================|| SHOP MART — POS COUNTER ||============================== //

export default function ShopMartPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { items = [], issueStock, addUsageLog, addNewItem, seedShopDemoData, updateItem, deleteItem, addShopSale, resetShopDataToZero } = useStoreInventory();

  // Factory Reset State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetShopData = async () => {
    if (!resetShopDataToZero) return;
    setResetting(true);
    await resetShopDataToZero();
    setCart([]);
    setResetting(false);
    setResetConfirmOpen(false);
  };

  // ── State ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]); // [{ item, qty }]
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'Udhaar' | 'Bank Transfer'
  const [customPaidAmount, setCustomPaidAmount] = useState('');
  const [lastSoldTo, setLastSoldTo] = useState('');
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Print Invoice Modal State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Add / Edit Product Drawer State
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Lawn Mowers',
    unitPrice: 1500,
    totalStock: 10,
    unit: 'PCS',
    imageUrl: DEMO_PICTURE_PRESETS[0].url
  });

  // ── Derived ────────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = [...new Set(items.map((i) => i.category || 'General'))].sort();
    return ['All', ...cats];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchCat = activeCategory === 'All' || (item.category || 'General') === activeCategory;
      const matchSearch = (item.name || '').toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.qty * (parseFloat(c.item.unitPrice) || 0), 0),
    [cart]
  );

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  // ── Mart Pagination (15 items per page for instantaneous rendering) ─────
  const [martPage, setMartPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    setMartPage(1);
  }, [search, activeCategory]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginatedMartItems = useMemo(() => {
    const startIndex = (martPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, martPage, itemsPerPage]);

  // ── Cart helpers ───────────────────────────────────────────────────────
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const changeQty = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((c) => c.item.id === itemId ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMode('Cash');
    setCustomPaidAmount('');
  };

  // ── Checkout & Generate Invoice ───────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    const buyerName = customerName.trim() || 'Factory Worker / Staff';
    const invNumber = `SLIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

    // Store a full snapshot of the cart for voucher
    const cartSnapshot = cart.map(({ item, qty }) => {
      const price = parseFloat(item.unitPrice) || 0;
      return {
        id: item.id,
        name: item.name,
        category: item.category || 'General',
        qty,
        unitPrice: price,
        lineTotal: qty * price
      };
    });

    const invoicePayload = {
      id: invNumber,
      invoiceNo: invNumber,
      saleNo: invNumber,
      date: `${dateFormatted}, ${timeFormatted}`,
      time: `${dateFormatted}, ${timeFormatted}`,
      dateISO: now.toISOString(),
      customer: buyerName,
      customerName: buyerName,
      phone: customerPhone.trim() || '',
      customerPhone: customerPhone.trim() || '',
      issuedTo: buyerName,
      department: customerPhone.trim() || 'Factory Floor',
      items: cartSnapshot,
      totalAmount: cartTotal
    };

    // ⚡ INSTANT ZERO-LATENCY DISPLAY
    setInvoiceData(invoicePayload);
    setInvoiceModalOpen(true);
    const checkoutCartSnapshot = [...cart];
    clearCart();
    setDrawerOpen(false);
    setCheckoutLoading(false);

    // ⚡ CONCURRENT BACKGROUND EXECUTION
    try {
      if (typeof addShopSale === 'function') {
        addShopSale(invoicePayload);
      }
      const recordFunc = typeof issueStock === 'function' ? issueStock : addUsageLog;
      if (typeof recordFunc === 'function') {
        await Promise.allSettled(
          checkoutCartSnapshot.map(({ item, qty }) =>
            recordFunc(
              item.id,
              qty,
              buyerName,
              customerPhone.trim() || 'Factory Floor',
              'Store Keeper',
              `Slip: ${invNumber}`,
              parseFloat(item.unitPrice) || 0,
              item.category || 'General'
            )
          )
        );
      }
    } catch (e) {
      console.error('Checkout loop error:', e);
    }
  };

  // ── Local File Upload & Compression ─────────────────────────────────
  const handleLocalFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImageFile(file);
        setNewProduct((prev) => ({ ...prev, imageUrl: compressedBase64 }));
      } catch (err) {
        console.error('File read error:', err);
      }
    }
  };

  // ── Open Edit Product Drawer ──────────────────────────────────────────
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setNewProduct({
      name: item.name || '',
      category: item.category || 'General',
      unitPrice: item.unitPrice || 0,
      totalStock: item.totalStock || 0,
      unit: item.unit || 'PCS',
      imageUrl: item.imageUrl || ''
    });
    setAddDialogOpen(true);
  };

  // ── Save / Update Product Handler ───────────────────────────────────────
  const handleSaveProduct = async () => {
    if (!newProduct.name.trim()) return;

    if (editingItem) {
      if (typeof updateItem === 'function') {
        await updateItem(editingItem.id, {
          name: newProduct.name.trim(),
          category: newProduct.category || 'General',
          unitPrice: parseFloat(newProduct.unitPrice) || 0,
          totalStock: parseInt(newProduct.totalStock, 10) || 0,
          unit: newProduct.unit || 'PCS',
          imageUrl: newProduct.imageUrl || ''
        });
      }
    } else {
      if (typeof addNewItem === 'function') {
        await addNewItem({
          name: newProduct.name.trim(),
          category: newProduct.category || 'General',
          unitPrice: parseFloat(newProduct.unitPrice) || 0,
          totalStock: parseInt(newProduct.totalStock, 10) || 0,
          unit: newProduct.unit || 'PCS',
          imageUrl: newProduct.imageUrl || ''
        });
      }
    }

    setAddDialogOpen(false);
    setEditingItem(null);
    setNewProduct({
      name: '',
      category: 'Lawn Mowers',
      unitPrice: 1500,
      totalStock: 10,
      unit: 'PCS',
      imageUrl: ''
    });
  };

  // ── Delete Product Handler ──────────────────────────────────────────────
  const handleDeleteProduct = async () => {
    if (!editingItem) return;
    if (window.confirm(`Are you sure you want to delete "${editingItem.name}" from Shop Mart?`)) {
      if (typeof deleteItem === 'function') {
        await deleteItem(editingItem.id);
      }
      setAddDialogOpen(false);
      setEditingItem(null);
    }
  };

  // ── Item stock check ───────────────────────────────────────────────────
  const getCartQty = (itemId) => {
    const found = cart.find((c) => c.item.id === itemId);
    return found ? found.qty : 0;
  };

  const getAvailableStock = (item) => {
    const cartQty = getCartQty(item.id);
    return Math.max(0, (parseInt(item.totalStock, 10) || 0) - cartQty);
  };

  // ── CARD ───────────────────────────────────────────────────────────────
  const ItemCard = ({ item }) => {
    const stock = parseInt(item.totalStock, 10) || 0;
    const available = getAvailableStock(item);
    const inCart = getCartQty(item.id);
    const isOutOfStock = stock <= 0;
    const price = parseFloat(item.unitPrice) || 0;

    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid',
          borderColor: inCart > 0
            ? '#005F56'
            : isDark ? 'rgba(255,255,255,0.08)' : 'divider',
          bgcolor: inCart > 0
            ? (isDark ? 'rgba(0,95,86,0.12)' : 'rgba(0,95,86,0.04)')
            : (isDark ? 'background.paper' : '#fff'),
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxShadow: inCart > 0 ? '0 0 0 2px rgba(0,95,86,0.22)' : 'none',
          '&:hover': {
            borderColor: '#005F56',
            transform: 'translateY(-2px)'
          },
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Product Image */}
        <Box
          sx={{
            height: 105,
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {item.imageUrl ? (
            <Box
              component="img"
              src={item.imageUrl}
              alt={item.name}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
          <Box
            sx={{
              display: item.imageUrl ? 'none' : 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
              color: 'text.disabled'
            }}
          >
            <PictureOutlined style={{ fontSize: '2rem', opacity: 0.3 }} />
          </Box>

          {/* Stock badge */}
          <Chip
            label={isOutOfStock ? 'Out' : `${stock} stock`}
            size="small"
            color={isOutOfStock ? 'error' : stock <= 5 ? 'warning' : 'default'}
            variant={isOutOfStock ? 'filled' : 'outlined'}
            sx={{
              position: 'absolute', top: 5, right: 5,
              fontWeight: 700, fontSize: '0.65rem', height: 18,
              bgcolor: !isOutOfStock ? (isDark ? 'rgba(30,30,30,0.85)' : 'rgba(255,255,255,0.92)') : undefined
            }}
          />

          {/* In-cart badge */}
          {inCart > 0 && (
            <Chip
              label={`× ${inCart}`}
              size="small"
              color="success"
              sx={{
                position: 'absolute', top: 5, left: 5,
                fontWeight: 800, fontSize: '0.65rem', height: 18
              }}
            />
          )}
        </Box>

        {/* Info */}
        <Box sx={{ p: 1.15, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  mb: 0.25,
                  lineHeight: 1.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  flex: 1
                }}
              >
                {item.name}
              </Typography>
              <Tooltip title="Edit Product">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(item);
                  }}
                  sx={{
                    p: 0.35,
                    mt: -0.25,
                    mr: -0.5,
                    color: 'text.secondary',
                    flexShrink: 0,
                    borderRadius: 1,
                    '&:hover': { color: 'primary.main', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'grey.100' }
                  }}
                >
                  <EditOutlined style={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {item.category || 'General'} • {item.unit || 'PCS'}
            </Typography>
          </Box>

          <Box sx={{ mt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#005F56', mb: 0.75, fontSize: '0.925rem' }}>
              Rs. {price.toLocaleString()}
            </Typography>

            {inCart > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderRadius: 1.5,
                  bgcolor: '#005F56',
                  color: '#fff',
                  height: 30,
                  px: 0.5
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); changeQty(item.id, -1); }}
                  sx={{ color: '#fff', p: 0.35, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
                >
                  <MinusOutlined style={{ fontSize: '0.75rem' }} />
                </IconButton>
                <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.78rem', color: '#fff' }}>
                  {inCart} in Cart
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); changeQty(item.id, 1); }}
                  disabled={available === 0}
                  sx={{
                    color: '#fff', p: 0.35,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' },
                    '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  <PlusOutlined style={{ fontSize: '0.75rem' }} />
                </IconButton>
              </Box>
            ) : (
              <Button
                fullWidth
                size="small"
                variant="outlined"
                color="success"
                disabled={isOutOfStock}
                onClick={() => addToCart(item)}
                startIcon={<PlusOutlined style={{ fontSize: '0.75rem' }} />}
                sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.75rem', height: 30 }}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };

  // ══════════════════════════════════════════════════════════════════════
  return (
    <Box sx={{ width: '100%', pb: 3 }}>

      {/* ── HEADER ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
              Shop Mart
            </Typography>
            <Chip label="POS Counter" size="small" color="primary" variant="outlined"
              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.8125rem' }}>
            Click any item to add to cart • Complete sale from cart drawer
          </Typography>
        </Box>

        {/* Top Actions */}
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
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

          {/* Cart button */}
          <Tooltip title="Open Cart">
            <Badge badgeContent={cartCount} color="error" max={99}>
              <Button
                variant="contained"
                color={cartCount > 0 ? 'success' : 'inherit'}
                size="small"
                onClick={() => setDrawerOpen(true)}
                startIcon={<ShoppingCartOutlined />}
                sx={{ fontWeight: 700, borderRadius: 1.5, px: 2, height: 35 }}
              >
                Cart {cartCount > 0 ? `(${cartCount})` : ''}
                {cartTotal > 0 && ` — Rs. ${cartTotal.toLocaleString()}`}
              </Button>
            </Badge>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── SEARCH + CATEGORY FILTER ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: 1.5,
          width: '100%',
          mb: 2.5
        }}
      >
        <TextField
          size="small"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: '100%', sm: 280 }, flexShrink: 0 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined style={{ fontSize: '0.85rem', color: '#94A3B8' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 1.5, fontSize: '0.875rem' }
            }
          }}
        />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              onClick={() => setActiveCategory(cat)}
              variant={activeCategory === cat ? 'filled' : 'outlined'}
              color={activeCategory === cat ? 'primary' : 'default'}
              sx={{ fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', height: 28 }}
            />
          ))}
        </Box>
      </Box>

      {/* ── ITEMS GRID ── */}
      {filteredItems.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
          <InboxOutlined style={{ fontSize: '3rem', opacity: 0.3, marginBottom: 12 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>No items found</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {items.length === 0
              ? 'No products in shop inventory yet. Add products from the Add Product page.'
              : 'Try a different search or category'}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(5, 1fr)'
            },
            gap: 1.5
          }}
        >
          {paginatedMartItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </Box>
      )}

      {/* ── PAGINATION CONTROLS ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={martPage}
            onChange={(e, val) => {
              setMartPage(val);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 700
              }
            }}
          />
        </Box>
      )}

      {/* ── FLOATING BOTTOM CHECKOUT PILL (WHEN ITEMS IN CART) ── */}
      {cartCount > 0 && !drawerOpen && (
        <Paper
          elevation={6}
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 28,
            zIndex: 1100,
            py: 1,
            px: 2,
            borderRadius: 3,
            bgcolor: '#005F56',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 8px 24px rgba(0,95,86,0.38)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
            '&:hover': { transform: 'scale(1.02)' }
          }}
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {cartCount} item(s) in Cart
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
              Total: Rs. {cartTotal.toLocaleString()}
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            sx={{
              bgcolor: '#fff',
              color: '#005F56',
              fontWeight: 800,
              fontSize: '0.78rem',
              borderRadius: 1.5,
              '&:hover': { bgcolor: '#f0fdf4' }
            }}
          >
            Checkout →
          </Button>
        </Paper>
      )}

      {/* ══ CART DRAWER (CLEAN MINIMAL DESIGN) ═════════════════════════ */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100vw', sm: 340 },
              maxWidth: 340,
              boxSizing: 'border-box',
              bgcolor: isDark ? 'background.paper' : '#fff',
              display: 'flex',
              flexDirection: 'column'
            },
            style: {
              width: '340px',
              maxWidth: '100vw'
            }
          }
        }}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 340 },
            maxWidth: 340,
            boxSizing: 'border-box',
            bgcolor: isDark ? 'background.paper' : '#fff',
            display: 'flex',
            flexDirection: 'column'
          },
          style: {
            width: '340px',
            maxWidth: '100vw'
          }
        }}
        sx={{
          zIndex: 1300,
          '& .MuiDrawer-paper': {
            width: { xs: '100vw', sm: 340 },
            maxWidth: '340px !important',
            boxSizing: 'border-box'
          }
        }}
      >
        {/* Drawer Header: "7 Item in cart" | "Clear" */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, borderBottom: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'grey.200' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.95rem' }}>
            <strong style={{ color: isDark ? '#fff' : '#111827', fontWeight: 800 }}>{cartCount}</strong> Item in cart
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {cart.length > 0 && (
              <Button
                variant="text"
                size="small"
                onClick={clearCart}
                sx={{
                  color: '#0284c7',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  p: 0,
                  minWidth: 0,
                  '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Clear
              </Button>
            )}
            <IconButton size="small" onClick={() => setDrawerOpen(false)} sx={{ color: 'text.secondary', p: 0.5 }}>
              <CloseOutlined style={{ fontSize: '0.85rem' }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Checkout success state */}
        {checkoutDone ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, px: 3 }}>
            <CheckCircleOutlined style={{ fontSize: '3.5rem', color: '#10B981' }} />
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#10B981' }}>Sale Complete!</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', lineHeight: 1.6 }}>
              Issued to: <strong style={{ color: isDark ? '#fff' : '#0f172a' }}>{lastSoldTo || 'Walk-in Customer'}</strong><br />
              {cart.length} item(s) • Rs. {cartTotal.toLocaleString()}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Cart Items List */}
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {cart.length === 0 ? (
                <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary', px: 3 }}>
                  <ShoppingCartOutlined style={{ fontSize: '2.5rem', opacity: 0.25, marginBottom: 12 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Cart is empty
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                    Click any item on the left to add to cart
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {cart.map(({ item, qty }) => {
                    const price = parseFloat(item.unitPrice) || 0;
                    return (
                      <Box
                        key={item.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          py: 1.75,
                          px: 2.5,
                          borderBottom: '1px solid',
                          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'grey.100',
                          gap: 1.75
                        }}
                      >
                        {/* Thumbnail */}
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1.5,
                            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'grey.200'
                          }}
                        >
                          {item.imageUrl ? (
                            <Box
                              component="img"
                              src={item.imageUrl}
                              alt={item.name}
                              onError={(e) => { e.target.style.display = 'none'; }}
                              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <PictureOutlined style={{ fontSize: '1.25rem', color: '#94a3b8' }} />
                          )}
                        </Box>

                        {/* Info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: isDark ? '#f1f5f9' : '#1e293b',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.875rem',
                              lineHeight: 1.3
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25, fontSize: '0.75rem' }}>
                            {item.category || 'General'} • {item.unit || 'PCS'}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#fff' : '#0f172a', mt: 0.35, fontSize: '0.9rem' }}>
                            Rs. {price.toLocaleString()}
                          </Typography>
                        </Box>

                        {/* Minimal Stepper: − 1 + in rose/red */}
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
                          <IconButton
                            size="small"
                            onClick={() => changeQty(item.id, -1)}
                            sx={{
                              color: '#e11d48',
                              fontSize: '1.15rem',
                              fontWeight: 900,
                              p: 0.4,
                              lineHeight: 1,
                              '&:hover': { bgcolor: 'rgba(225,29,72,0.08)' }
                            }}
                          >
                            −
                          </IconButton>
                          <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 16, textAlign: 'center', fontSize: '0.9rem' }}>
                            {qty}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => changeQty(item.id, 1)}
                            disabled={qty >= (parseInt(item.totalStock, 10) || 0)}
                            sx={{
                              color: '#e11d48',
                              fontSize: '1.15rem',
                              fontWeight: 900,
                              p: 0.4,
                              lineHeight: 1,
                              '&:hover': { bgcolor: 'rgba(225,29,72,0.08)' }
                            }}
                          >
                            +
                          </IconButton>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Footer: Issued To / Receiver + Subtotal + Checkout Button */}
            {cart.length > 0 && (
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'grey.200' }}>
                {/* Buyer / Customer Section */}
                <Box sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'grey.200',
                  mb: 1.5
                }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.75 }}>
                    Issued To / Receiver Name
                  </Typography>

                  <Stack spacing={1.25}>
                    <TextField
                      size="small"
                      placeholder="Person / Staff Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <UserOutlined style={{ fontSize: '0.85rem', color: '#94a3b8' }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1.5, fontSize: '0.85rem', bgcolor: isDark ? 'background.paper' : '#fff' }
                        }
                      }}
                    />

                    <TextField
                      size="small"
                      placeholder="Department / Phone / Machine # (optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      fullWidth
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneOutlined style={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: 1.5, fontSize: '0.85rem', bgcolor: isDark ? 'background.paper' : '#fff' }
                        }
                      }}
                    />
                  </Stack>
                </Box>

                {/* Subtotal Pill Box */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1.25,
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'grey.200',
                    mb: 1.5
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}>
                    Subtotal
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#fff' : '#0f172a', fontSize: '1.05rem' }}>
                    Rs. {cartTotal.toLocaleString()}
                  </Typography>
                </Box>

                {/* Big Checkout Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCheckout}
                  disabled={checkoutLoading || cart.length === 0}
                  sx={{
                    bgcolor: '#f43f5e',
                    '&:hover': { bgcolor: '#e11d48' },
                    color: '#fff',
                    fontWeight: 800,
                    borderRadius: 2,
                    height: 48,
                    fontSize: '1rem',
                    letterSpacing: 0.2,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(244,63,94,0.3)'
                  }}
                >
                  {checkoutLoading ? 'Processing...' : 'Checkout'}
                </Button>
              </Box>
            )}
          </>
        )}
      </Drawer>

      {/* ══ ADD PRODUCT DRAWER (RIGHT SIDE SLIDE-OUT) ══════════════════ */}
      <Drawer
        anchor="right"
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100vw', sm: 320 },
              maxWidth: 320,
              boxSizing: 'border-box',
              bgcolor: isDark ? 'background.paper' : '#fff',
              display: 'flex',
              flexDirection: 'column'
            },
            style: {
              width: '320px',
              maxWidth: '100vw'
            }
          }
        }}
        PaperProps={{
          sx: {
            width: { xs: '100vw', sm: 320 },
            maxWidth: 320,
            boxSizing: 'border-box',
            bgcolor: isDark ? 'background.paper' : '#fff',
            display: 'flex',
            flexDirection: 'column'
          },
          style: {
            width: '320px',
            maxWidth: '100vw'
          }
        }}
        sx={{
          zIndex: 1300,
          '& .MuiDrawer-paper': {
            width: { xs: '100vw', sm: 320 },
            maxWidth: '320px !important',
            boxSizing: 'border-box'
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'grey.200'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {editingItem ? 'Edit Product' : 'Add Product to Shop Mart'}
          </Typography>
          <IconButton size="small" onClick={() => { setAddDialogOpen(false); setEditingItem(null); }}>
            <CloseOutlined style={{ fontSize: '0.85rem' }} />
          </IconButton>
        </Box>

        {/* Form Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
          <Stack spacing={1.5}>
            <TextField
              label="Product Name *"
              required
              fullWidth
              size="small"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="e.g. Lawn Mower Rotary Blade"
            />
            
            <Stack direction="row" spacing={1.25}>
              <TextField
                label="Category"
                fullWidth
                size="small"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                placeholder="Category"
              />
              <TextField
                label="Unit"
                size="small"
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                sx={{ width: 85 }}
              />
            </Stack>

            <Stack direction="row" spacing={1.25}>
              <TextField
                label="Price (PKR) *"
                type="number"
                fullWidth
                size="small"
                value={newProduct.unitPrice}
                onChange={(e) => setNewProduct({ ...newProduct, unitPrice: e.target.value })}
              />
              <TextField
                label="Stock Qty *"
                type="number"
                fullWidth
                size="small"
                value={newProduct.totalStock}
                onChange={(e) => setNewProduct({ ...newProduct, totalStock: e.target.value })}
              />
            </Stack>

            <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 1.5, bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'grey.50' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', display: 'block', mb: 1 }}>
                Product Picture
              </Typography>

              {/* Local File Selector */}
              <Button
                fullWidth
                component="label"
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<UploadOutlined />}
                sx={{ fontWeight: 700, borderRadius: 1.5, py: 0.75, mb: 0.5 }}
              >
                Choose Picture from PC
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLocalFileUpload}
                />
              </Button>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem', textAlign: 'center', mb: 1.25 }}>
                JPG, PNG or WEBP from computer
              </Typography>

              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.68rem' }}>OR PASTE IMAGE LINK</Typography>
              </Divider>

              <TextField
                label="Photo / Image URL"
                fullWidth
                size="small"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                placeholder="https://... or paste link"
                sx={{ mt: 0.5 }}
              />
              
              {/* Quick Presets Dropdown */}
              <TextField
                select
                fullWidth
                size="small"
                label="Quick Photo Preset"
                value={DEMO_PICTURE_PRESETS.some((p) => p.url === newProduct.imageUrl) ? newProduct.imageUrl : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setNewProduct({ ...newProduct, imageUrl: e.target.value });
                  }
                }}
                sx={{ mt: 1.25 }}
              >
                <MenuItem value="" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  -- Select Photo Preset --
                </MenuItem>
                {DEMO_PICTURE_PRESETS.map((preset) => (
                  <MenuItem key={preset.label} value={preset.url} sx={{ fontSize: '0.825rem' }}>
                    {preset.label}
                  </MenuItem>
                ))}
              </TextField>

              {/* Preview Box */}
              {newProduct.imageUrl && (
                <Box sx={{ mt: 1.5, position: 'relative', width: '100%', height: 110, borderRadius: 1.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                  <Box
                    component="img"
                    src={newProduct.imageUrl}
                    alt="preview"
                    onError={(e) => { e.target.style.display = 'none'; }}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    onClick={() => setNewProduct((prev) => ({ ...prev, imageUrl: '' }))}
                    sx={{
                      position: 'absolute', top: 5, right: 5,
                      fontSize: '0.65rem', py: 0.2, px: 0.75, minWidth: 0, fontWeight: 700
                    }}
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            p: 1.75,
            borderTop: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'grey.200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%'
          }}
        >
          {editingItem ? (
            <Button
              onClick={handleDeleteProduct}
              color="error"
              size="small"
              startIcon={<DeleteOutlined />}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Delete
            </Button>
          ) : (
            <Button
              onClick={() => { setAddDialogOpen(false); setEditingItem(null); }}
              color="inherit"
              size="small"
              sx={{ fontWeight: 600 }}
            >
              Cancel
            </Button>
          )}

          <Stack direction="row" spacing={1} alignItems="center">
            {editingItem && (
              <Button
                onClick={() => { setAddDialogOpen(false); setEditingItem(null); }}
                color="inherit"
                size="small"
                sx={{ fontWeight: 600 }}
              >
                Cancel
              </Button>
            )}
            <Button
              variant="contained"
              color="success"
              size="small"
              onClick={handleSaveProduct}
              sx={{ fontWeight: 700, px: 2.5, borderRadius: 1.5 }}
            >
              {editingItem ? 'Update Product' : 'Save Product'}
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* 📄 Print Invoice Receipt Modal Dialog */}
      <Dialog open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
              #root {
                display: none !important;
              }
              body {
                visibility: hidden !important;
                background: #fff !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .MuiDialog-root {
                visibility: visible !important;
                position: static !important;
              }
              .MuiBackdrop-root {
                display: none !important;
              }
              .MuiDialog-container {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .MuiDialog-paper {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                overflow: visible !important;
              }
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                border: none !important;
              }
              #printable-shop-invoice, #printable-shop-invoice * {
                visibility: visible !important;
              }
              #printable-shop-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 10px !important;
                margin: 0 !important;
              }
              .MuiDialog-root,
              .MuiDialog-container,
              .MuiDialog-paper,
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                overflow: visible !important;
                box-shadow: none !important;
              }
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h5" fontWeight={800}>Store Material Issue Voucher</Typography>
            <Chip label="Internal Factory Use" color="primary" size="small" sx={{ fontWeight: 700 }} />
          </Stack>
          <IconButton size="small" onClick={() => setInvoiceModalOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
          {invoiceData && (
            <Box id="printable-shop-invoice" sx={{ bgcolor: '#fff', color: '#111827', p: { xs: 1.5, sm: 3 }, borderRadius: 1 }}>
              {/* Header: Company Name & Brand */}
              <Box sx={{ borderBottom: '2px solid #005F56', pb: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#005F56', letterSpacing: -0.5 }}>
                      REHMAT LAWN MOWERS
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mt: 0.25 }}>
                      Factory Store &amp; Workshop • Material Issue Voucher
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Main Market / Workshop Counter • Ph: 0300-XXXXXXX
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#096dd9' }}>
                      INVOICE #{invoiceData.invoiceNo}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                      Date: {invoiceData.date}
                    </Typography>
                    <Chip label="Issued" size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '0.68rem', mt: 0.5 }} />
                  </Box>
                </Box>
              </Box>

              {/* Customer / Buyer Card */}
              <Box sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 1.5, mb: 2, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Customer / Buyer (Kon Le Kar Gaya)
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.25 }}>
                      {invoiceData.customer}
                    </Typography>
                  </Box>
                  {invoiceData.phone && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Department / Phone
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.25 }}>
                        {invoiceData.phone}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #005F56', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#005F56', color: '#fff' }}>
                    <th style={{ width: '8%', padding: '8px 6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800 }}>Sr</th>
                    <th style={{ width: '52%', padding: '8px 10px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 800 }}>Item Description</th>
                    <th style={{ width: '12%', padding: '8px 6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800 }}>Qty</th>
                    <th style={{ width: '14%', padding: '8px 6px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 800 }}>Price (PKR)</th>
                    <th style={{ width: '14%', padding: '8px 10px', textAlign: 'right', fontSize: '0.8rem', fontWeight: 800 }}>Total (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontSize: '0.82rem' }}>
                        <strong>{it.name}</strong>
                        {it.category && <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>{it.category}</span>}
                      </td>
                      <td style={{ padding: '8px 6px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800 }}>{it.qty}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontSize: '0.82rem' }}>Rs. {it.unitPrice.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 800, color: '#005F56' }}>Rs. {it.lineTotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2.5px solid #005F56' }}>
                    <td colSpan={4} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, fontSize: '1rem' }}>
                      TOTAL ISSUED VALUE:
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1.15rem', color: '#005F56' }}>
                      Rs. {invoiceData.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures & Footer Note */}
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ borderTop: '1px solid #94a3b8', pt: 1, width: 200, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Receiver / Staff Signature
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                    <CeoSignature width={160} />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions className="no-print" sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setInvoiceModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Close
          </Button>
          <Button
            variant="contained"
            size="large"
            onClick={() => window.print()}
            startIcon={<PrinterOutlined />}
            sx={{ fontWeight: 800, borderRadius: 1.5, px: 3, bgcolor: '#005F56', '&:hover': { bgcolor: '#004740' } }}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Reset Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 500 } } }}>
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main' }}>
          ⚠️ Confirm Factory Reset Shop Data?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to wipe all Shop inventory items, stock counts, counter sales slips, and ledger records? This action will set all shop metrics and data to 0 for a completely fresh start.
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
    </Box>
  );
}
