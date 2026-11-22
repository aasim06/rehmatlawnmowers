import { useState, useMemo, useEffect } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
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

  const { items = [], vendors = [], shopSales = [], issueStock, addUsageLog, addNewItem, seedShopDemoData, updateItem, deleteItem, addShopSale, resetShopDataToZero } = useStoreInventory();

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
  const [paymentMode, setPaymentMode] = useState('Cash'); // 'Cash' | 'Credit' | 'Bank Transfer'
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

  const [orderDiscount, setOrderDiscount] = useState('');
  const [orderDiscountType, setOrderDiscountType] = useState('flat'); // 'flat' (Rs.) or 'percent' (%)
  const [orderTax, setOrderTax] = useState('');

  const customerOptions = useMemo(() => {
    const fromVendors = (vendors || []).map((v) => v.name?.trim()).filter(Boolean);
    const fromSales = (shopSales || []).map((s) => (s.customerName || s.customer || '').trim()).filter(Boolean);
    return Array.from(new Set(['Walk-in Customer', ...fromVendors, ...fromSales]));
  }, [vendors, shopSales]);

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

  const computedDiscountAmount = useMemo(() => {
    const rawVal = parseFloat(orderDiscount) || 0;
    if (orderDiscountType === 'percent') {
      const pct = Math.min(100, Math.max(0, rawVal));
      return (cartTotal * pct) / 100;
    }
    return Math.min(cartTotal, Math.max(0, rawVal));
  }, [cartTotal, orderDiscount, orderDiscountType]);

  const computedTaxAmount = useMemo(() => {
    const rawVal = parseFloat(orderTax) || 0;
    return Math.max(0, rawVal);
  }, [orderTax]);

  const computedGrandTotal = useMemo(() => {
    return Math.max(0, cartTotal - computedDiscountAmount + computedTaxAmount);
  }, [cartTotal, computedDiscountAmount, computedTaxAmount]);

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
    setOrderDiscount('');
    setOrderDiscountType('flat');
    setOrderTax('');
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
      subTotal: cartTotal,
      discount: computedDiscountAmount,
      discountType: orderDiscountType,
      discountValue: orderDiscount || 0,
      tax: computedTaxAmount,
      totalAmount: computedGrandTotal
    };

    // INSTANT ZERO-LATENCY DISPLAY
    setInvoiceData(invoicePayload);
    setInvoiceModalOpen(true);
    const checkoutCartSnapshot = [...cart];
    clearCart();
    setDrawerOpen(false);
    setCheckoutLoading(false);

    // CONCURRENT BACKGROUND EXECUTION
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
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
          bgcolor: isDark ? 'background.paper' : '#ffffff',
          overflow: 'hidden',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          '&:hover': {
            borderColor: '#005F56',
            boxShadow: '0 4px 14px rgba(0,0,0,0.07)',
            transform: 'translateY(-2px)'
          },
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Product Image Area */}
        <Box
          sx={{
            height: 135,
            bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            p: 1.5,
            borderBottom: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'
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
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
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

          {/* Stock Badge (Pill in Top-Right as in Pic 1) */}
          {isOutOfStock ? (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: '#fee2e2',
                color: '#ef4444',
                px: 1,
                py: 0.3,
                borderRadius: 1.5,
                fontSize: '0.7rem',
                fontWeight: 700,
                lineHeight: 1
              }}
            >
              Out of stock
            </Box>
          ) : (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: '#fef3c7',
                color: '#d97706',
                px: 1,
                py: 0.3,
                borderRadius: 1.5,
                fontSize: '0.7rem',
                fontWeight: 700,
                lineHeight: 1
              }}
            >
              {stock} stock
            </Box>
          )}

          {/* In-cart count badge */}
          {inCart > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                bgcolor: '#005F56',
                color: '#fff',
                px: 0.9,
                py: 0.3,
                borderRadius: 1.5,
                fontSize: '0.68rem',
                fontWeight: 800,
                lineHeight: 1
              }}
            >
              {inCart} in Cart
            </Box>
          )}
        </Box>

        {/* Info & Content Area */}
        <Box sx={{ p: 1.75, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  color: isDark ? '#f1f5f9' : '#0f172a',
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
                    p: 0.3,
                    mt: -0.2,
                    mr: -0.5,
                    color: '#94a3b8',
                    flexShrink: 0,
                    borderRadius: 1,
                    '&:hover': { color: '#0f172a', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'grey.100' }
                  }}
                >
                  <EditOutlined style={{ fontSize: '0.85rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem', mt: 0.25, display: 'block' }}>
              {item.category || 'General'} • {item.unit || 'PCS'}
            </Typography>
          </Box>

          <Box sx={{ mt: 1.25 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isDark ? '#fff' : '#0f172a', mb: 1.25, fontSize: '1.05rem' }}>
              Rs. {price.toLocaleString()}
            </Typography>

            {available <= 0 ? (
              <Button
                fullWidth
                disabled
                size="small"
                sx={{
                  bgcolor: '#f1f5f9 !important',
                  color: '#94a3b8 !important',
                  borderRadius: 1.5,
                  py: 0.85,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  cursor: 'not-allowed'
                }}
              >
                + Out of stock
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                size="small"
                onClick={() => addToCart(item)}
                sx={{
                  bgcolor: '#005F56',
                  '&:hover': { bgcolor: '#004740' },
                  color: '#fff',
                  borderRadius: 1.5,
                  py: 0.85,
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textTransform: 'none',
                  boxShadow: 'none'
                }}
              >
                + Add to Cart
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

      {/* ── HEADER (Pic 1 Style) ── */}
      <Box sx={{ mb: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Shop Mart
          </Typography>
          <Box
            sx={{
              bgcolor: '#005F56',
              color: '#ffffff',
              px: 1.2,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 700,
              fontSize: '0.72rem',
              display: 'inline-block'
            }}
          >
            POS Counter
          </Box>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
          Click any item to add to cart • Complete sale from cart drawer
        </Typography>
      </Box>

      {/* ── SEARCH + CATEGORY FILTER + FACTORY RESET BAR (Pic 1 Style) ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
          width: '100%',
          mb: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1 }}>
          <TextField
            size="small"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 260 },
              bgcolor: isDark ? 'background.paper' : '#fff',
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontSize: '0.85rem'
              }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined style={{ fontSize: '0.9rem', color: '#94a3b8' }} />
                  </InputAdornment>
                )
              }
            }}
          />

          {/* Category Filter Pills (Pic 1 Style) */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <Box
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  sx={{
                    px: 2,
                    py: 0.6,
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : 600,
                    cursor: 'pointer',
                    bgcolor: isActive ? '#005F56' : (isDark ? 'rgba(255,255,255,0.05)' : '#ffffff'),
                    color: isActive ? '#ffffff' : (isDark ? 'text.secondary' : '#334155'),
                    border: '1px solid',
                    borderColor: isActive ? '#005F56' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                    transition: 'all 0.15s ease',
                    userSelect: 'none',
                    '&:hover': {
                      borderColor: '#005F56',
                      color: isActive ? '#ffffff' : '#005F56'
                    }
                  }}
                >
                  {cat}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Factory Reset Button */}
        <Button
          variant="outlined"
          color="inherit"
          size="small"
          onClick={() => setResetConfirmOpen(true)}
          startIcon={<DeleteOutlined style={{ color: '#475569' }} />}
          sx={{
            fontWeight: 600,
            borderRadius: 2,
            height: 38,
            fontSize: '0.82rem',
            color: '#334155',
            borderColor: '#e2e8f0',
            bgcolor: '#ffffff',
            textTransform: 'none',
            '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1' }
          }}
        >
          Factory Reset
        </Button>
      </Box>

      {/* ── 2-COLUMN MAIN CONTENT (CATALOGUE + CURRENT ORDER AS SHOWN IN PIC 1) ── */}
      <Grid container spacing={3} alignItems="flex-start">
        {/* Left: Products Grid (3 cards per row) */}
        <Grid size={{ xs: 12, lg: 8.2 }}>
          {filteredItems.length === 0 ? (
            <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary', bgcolor: '#fff', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
              <InboxOutlined style={{ fontSize: '3rem', opacity: 0.3, marginBottom: 12 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>No items found</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {items.length === 0
                  ? 'No products in shop inventory yet. Add products from the Add Product page.'
                  : 'Try a different search or category'}
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginatedMartItems.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <ItemCard item={item} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination Controls */}
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
            </>
          )}
        </Grid>

        {/* Right: Current Order Sidebar (Pic 1 Style) */}
        <Grid size={{ xs: 12, lg: 3.8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              position: { lg: 'sticky' },
              top: { lg: 24 }
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>
              Current Order ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </Typography>

            {/* Cart Items List */}
            <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5, mb: 2.5 }}>
              {cart.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                  <ShoppingCartOutlined style={{ fontSize: '2rem', opacity: 0.25, marginBottom: 8 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    No items in order
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Click &quot;+ Add to Cart&quot; on products to add
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  {cart.map(({ item, qty }) => {
                    const price = parseFloat(item.unitPrice) || 0;
                    return (
                      <Box
                        key={item.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          py: 1.25,
                          borderBottom: '1px solid #f1f5f9',
                          gap: 1.5
                        }}
                      >
                        {/* Thumbnail */}
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            bgcolor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            flexShrink: 0
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
                            <PictureOutlined style={{ fontSize: '1rem', color: '#94a3b8' }} />
                          )}
                        </Box>

                        {/* Title & Price */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.82rem',
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a', mt: 0.25 }}>
                            Rs. {price.toLocaleString()}
                          </Typography>
                        </Box>

                        {/* Stepper Pill: [ - 1 + ] */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid #cbd5e1',
                            borderRadius: '20px',
                            px: 0.5,
                            py: 0.15,
                            bgcolor: '#ffffff',
                            flexShrink: 0
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => changeQty(item.id, -1)}
                            sx={{ p: 0.25, color: '#475569', '&:hover': { bgcolor: '#f1f5f9' } }}
                          >
                            <MinusOutlined style={{ fontSize: '0.65rem' }} />
                          </IconButton>
                          <Typography sx={{ px: 0.75, fontWeight: 700, fontSize: '0.8rem', minWidth: 16, textAlign: 'center', color: '#0f172a' }}>
                            {qty}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => changeQty(item.id, 1)}
                            disabled={qty >= (parseInt(item.totalStock, 10) || 0)}
                            sx={{ p: 0.25, color: '#475569', '&:hover': { bgcolor: '#f1f5f9' } }}
                          >
                            <PlusOutlined style={{ fontSize: '0.65rem' }} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Customer Select */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8rem', display: 'block', mb: 0.75 }}>
                Customer Select
              </Typography>
              <Autocomplete
                freeSolo
                options={customerOptions}
                value={customerName}
                onChange={(event, newValue) => {
                  const val = typeof newValue === 'string' ? newValue : (newValue || '');
                  setCustomerName(val);
                }}
                onInputChange={(event, newInputValue) => {
                  setCustomerName(newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    size="small"
                    placeholder="Customer Select"
                    sx={{
                      bgcolor: '#fff',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        fontSize: '0.85rem'
                      }
                    }}
                  />
                )}
              />
            </Box>

            {/* Financial Details (Sub Total, Discount, Tax, Grand Total) */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                  Sub Total
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                  Rs. {cartTotal.toLocaleString()}
                </Typography>
              </Box>

              {/* Discount / Offer */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                    Discount/Offer
                  </Typography>
                  <Box sx={{ display: 'inline-flex', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setOrderDiscountType('flat')}
                      sx={{
                        border: 'none',
                        px: 0.75,
                        py: 0.1,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        bgcolor: orderDiscountType === 'flat' ? '#005F56' : '#f8fafc',
                        color: orderDiscountType === 'flat' ? '#fff' : '#64748b'
                      }}
                    >
                      Rs
                    </Box>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setOrderDiscountType('percent')}
                      sx={{
                        border: 'none',
                        borderLeft: '1px solid #cbd5e1',
                        px: 0.75,
                        py: 0.1,
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        bgcolor: orderDiscountType === 'percent' ? '#005F56' : '#f8fafc',
                        color: orderDiscountType === 'percent' ? '#fff' : '#64748b'
                      }}
                    >
                      %
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {orderDiscountType === 'percent' && computedDiscountAmount > 0 && (
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>
                      (-Rs.{computedDiscountAmount.toLocaleString()})
                    </Typography>
                  )}
                  <TextField
                    size="small"
                    type="number"
                    placeholder="0"
                    value={orderDiscount}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') {
                        setOrderDiscount('');
                      } else {
                        const num = parseFloat(v);
                        setOrderDiscount(isNaN(num) ? '' : Math.max(0, num));
                      }
                    }}
                    onFocus={(e) => e.target.select?.()}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.25 }}>
                          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                            {orderDiscountType === 'flat' ? 'Rs.' : '%'}
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                    inputProps={{
                      min: 0,
                      max: orderDiscountType === 'percent' ? 100 : undefined,
                      style: {
                        textAlign: 'right',
                        fontWeight: 700,
                        padding: '3px 6px',
                        fontSize: '0.85rem'
                      }
                    }}
                    sx={{
                      width: 105,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                        height: 28,
                        bgcolor: '#fff',
                        borderColor: '#cbd5e1'
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Quick discount chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end', mt: -0.5 }}>
                {[5, 10].map((pct) => (
                  <Chip
                    key={`p-${pct}`}
                    label={`${pct}%`}
                    size="small"
                    onClick={() => {
                      setOrderDiscountType('percent');
                      setOrderDiscount(pct);
                    }}
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: orderDiscountType === 'percent' && Number(orderDiscount) === pct ? '#005F56' : '#f1f5f9',
                      color: orderDiscountType === 'percent' && Number(orderDiscount) === pct ? '#fff' : '#475569',
                      '&:hover': { bgcolor: '#e2e8f0' }
                    }}
                  />
                ))}
                {[200, 500, 1000].map((amt) => (
                  <Chip
                    key={`f-${amt}`}
                    label={`-${amt}`}
                    size="small"
                    onClick={() => {
                      setOrderDiscountType('flat');
                      setOrderDiscount(amt);
                    }}
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: orderDiscountType === 'flat' && Number(orderDiscount) === amt ? '#005F56' : '#f1f5f9',
                      color: orderDiscountType === 'flat' && Number(orderDiscount) === amt ? '#fff' : '#475569',
                      '&:hover': { bgcolor: '#e2e8f0' }
                    }}
                  />
                ))}
                {Boolean(orderDiscount) && (
                  <Chip
                    label="✕"
                    size="small"
                    onClick={() => setOrderDiscount('')}
                    sx={{
                      height: 18,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: '#fee2e2',
                      color: '#b91c1c',
                      '&:hover': { bgcolor: '#fecaca' }
                    }}
                  />
                )}
              </Box>

              {/* Tax */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>
                  tax
                </Typography>
                <TextField
                  size="small"
                  type="number"
                  placeholder="0"
                  value={orderTax}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') {
                      setOrderTax('');
                    } else {
                      const num = parseFloat(v);
                      setOrderTax(isNaN(num) ? '' : Math.max(0, num));
                    }
                  }}
                  onFocus={(e) => e.target.select?.()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ mr: 0.25 }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b' }}>
                          Rs.
                        </Typography>
                      </InputAdornment>
                    )
                  }}
                  inputProps={{
                    min: 0,
                    style: {
                      textAlign: 'right',
                      fontWeight: 700,
                      padding: '3px 6px',
                      fontSize: '0.85rem'
                    }
                  }}
                  sx={{
                    width: 105,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      height: 28,
                      bgcolor: '#fff',
                      borderColor: '#cbd5e1'
                    }
                  }}
                />
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.05rem' }}>
                  Grand Total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0f172a', fontSize: '1.15rem' }}>
                  Rs. {computedGrandTotal.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            {/* Checkout Button */}
            <Button
              fullWidth
              variant="contained"
              disabled={cart.length === 0 || checkoutLoading}
              onClick={handleCheckout}
              sx={{
                bgcolor: '#005F56',
                '&:hover': { bgcolor: '#004740' },
                color: '#fff',
                py: 1.4,
                borderRadius: 1.5,
                fontWeight: 800,
                fontSize: '0.88rem',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                boxShadow: 'none'
              }}
            >
              {checkoutLoading ? 'Processing...' : 'PAY NOW / COMPLETE SALE'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

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

      {/* Print Invoice Receipt Modal Dialog */}
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

        <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>Shop Customer Invoice & Statement</Typography>
          <Chip label="Shop Sales Receipt" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {invoiceData && (() => {
            const rawItems = invoiceData.items || [];
            const displayItems = rawItems.length > 0 ? rawItems : [
              {
                name: 'Shop Item',
                qty: 1,
                unitPrice: invoiceData.totalAmount || 0,
                lineTotal: invoiceData.totalAmount || 0
              }
            ];
            const grandTotalSum = parseFloat(invoiceData.totalAmount || 0);
            const discountVal = parseFloat(invoiceData.discount || 0);
            const pMethod = invoiceData.paymentMethod || 'Cash';
            const isCredit = String(pMethod).toLowerCase().includes('credit');

            return (
              <Box
                id="printable-shop-invoice"
                sx={{
                  position: 'relative',
                  overflow: 'hidden',
                  pt: { xs: 5, sm: 7 },
                  px: { xs: 1, sm: 1.5 },
                  pb: { xs: 1, sm: 1.5 },
                  bgcolor: '#ffffff',
                  color: '#111827',
                  borderRadius: 1
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  {/* Structured Professional Customer & Invoice Metadata Card */}
                  <div
                    style={{
                      border: '1.5px solid #111827',
                      borderRadius: '4px',
                      marginBottom: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.45)',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                      {/* Left Column: Customer Details */}
                      <div style={{ flex: '1.2', padding: '6px 10px', borderRight: '1px solid #e5e7eb' }}>
                        <div
                          style={{
                            fontSize: '0.70rem',
                            fontWeight: 800,
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '2px'
                          }}
                        >
                          Customer / Buyer Details
                        </div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                          {invoiceData.customer || 'Walk-in Customer'}
                        </div>
                        <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                          <div>
                            <strong>Sale Entry Type:</strong> Shop Retail Sales Receipt
                          </div>
                          {invoiceData.phone && (
                            <div>
                              <strong>Contact / Phone:</strong> {invoiceData.phone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Invoice Meta */}
                      <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                            fontSize: '0.80rem'
                          }}
                        >
                          <span style={{ color: '#6b7280', fontWeight: 700 }}>PO / Voucher No:</span>
                          <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>
                            {invoiceData.invoiceNo || invoiceData.id}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '4px',
                            fontSize: '0.80rem'
                          }}
                        >
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                          <span style={{ fontWeight: 700, color: '#374151' }}>
                            {invoiceData.date || 'N/A'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Status:</span>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>Completed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      border: '1.5px solid #111827',
                      marginBottom: '10px',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                        <th
                          style={{
                            width: '8%',
                            borderRight: '1.5px solid #111827',
                            padding: '4px 4px',
                            textAlign: 'center',
                            fontSize: '0.82rem'
                          }}
                        >
                          <strong>Sr</strong>
                        </th>
                        <th
                          style={{
                            width: '62%',
                            borderRight: '1.5px solid #111827',
                            padding: '4px 8px',
                            textAlign: 'center',
                            fontSize: '0.82rem'
                          }}
                        >
                          <strong>Specification / Item Name</strong>
                        </th>
                        <th
                          style={{
                            width: '14%',
                            borderRight: '1.5px solid #111827',
                            padding: '4px 4px',
                            textAlign: 'center',
                            fontSize: '0.82rem'
                          }}
                        >
                          <strong>QTY</strong>
                        </th>
                        <th style={{ width: '16%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                          <strong>Total Amount</strong>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayItems.map((item, idx) => {
                        const itemPrice = parseFloat(item.unitPrice) || 0;
                        const itemQty = parseInt(item.qty, 10) || 1;
                        const itemTotal = parseFloat(item.lineTotal) || itemQty * itemPrice;

                        return (
                          <tr
                            key={item.id || idx}
                            style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}
                          >
                            <td
                              style={{
                                borderRight: '1.5px solid #111827',
                                padding: '3px 4px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem'
                              }}
                            >
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td
                              style={{
                                borderRight: '1.5px solid #111827',
                                padding: '3px 8px',
                                textAlign: 'left',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                lineHeight: 1.25
                              }}
                            >
                              {item.name}{' '}
                              {item.category ? `(${item.category})` : ''}
                            </td>
                            <td
                              style={{
                                borderRight: '1.5px solid #111827',
                                padding: '3px 4px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem'
                              }}
                            >
                              {String(itemQty).padStart(2, '0')}
                            </td>
                            <td
                              style={{
                                padding: '3px 8px',
                                textAlign: 'right',
                                fontWeight: 800,
                                fontSize: '0.82rem'
                              }}
                            >
                              {itemTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Total Amount Bottom Row */}
                      <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                        <td
                          colSpan={2}
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '4px 8px',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.88rem'
                          }}
                        >
                          Total amount
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                        <td
                          style={{
                            padding: '4px 8px',
                            textAlign: 'right',
                            fontWeight: 900,
                            fontSize: '0.92rem',
                            color: '#111827'
                          }}
                        >
                          {grandTotalSum.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Financial Summary Box */}
                  <Box
                    sx={{
                      bgcolor: 'transparent',
                      py: 0.8,
                      px: 1.2,
                      borderRadius: 1,
                      border: '1px solid #86efac',
                      mb: 1.2
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        flexWrap: 'wrap',
                        gap: '8px'
                      }}
                    >
                      <div>
                        <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                          TOTAL SALE ITEMS: {displayItems.length}
                        </Typography>
                        {isCredit ? (
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mt: 0.3 }}
                          >
                            Payment: Full Credit Purchase (Unpaid)
                          </Typography>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: '#16a34a', display: 'block', mt: 0.3 }}
                          >
                            Payment: Paid via {pMethod}
                          </Typography>
                        )}
                        {discountVal > 0 && (
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mt: 0.2 }}
                          >
                            Discount Applied: -Rs. {discountVal.toLocaleString()}
                          </Typography>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight={800}
                          color="success.dark"
                          sx={{ lineHeight: 1.2 }}
                        >
                          NET TOTAL: Rs. {grandTotalSum.toLocaleString()}
                        </Typography>
                      </div>
                    </div>
                  </Box>

                  {/* Signatures Footer */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                      width: '100%',
                      marginTop: '16px',
                      paddingTop: '8px'
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 170 }}
                      >
                        Customer Signature
                      </Typography>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                        <CeoSignature />
                      </Box>
                    </div>
                  </div>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions className="no-print" sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setInvoiceModalOpen(false)}
            size="large"
            className="no-print"
          >
            Close & Continue
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            size="large"
            className="no-print"
            sx={{ px: 3, fontWeight: 700 }}
          >
            Print Shop Invoice ({invoiceData?.items?.length || 1} Items)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Reset Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 500 } } }}>
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main' }}>
          Confirm Factory Reset Shop Data?
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
