import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  OutlinedInput,
  Pagination,
  Snackbar,
  Typography
} from '@mui/material';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';

import { useStoreInventory } from 'context/StoreInventoryContext';
import { AppButton, FilterBar, PageHeader, UniversalPrintModal } from 'components/common';
import { ShopOrderSummaryPanel, ShopProductCard, ShopProductDrawer } from 'components/shop';
import { getCardSurfaceSx } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import { buildShopCustomerLedgers, buildShopCustomerOptions, computePosTotals, resolveShopCategories } from 'utils/shopHelpers';

const createEmptyProductForm = (defaultCategory = 'General') => ({
  name: '',
  category: defaultCategory,
  specification: '',
  unitPrice: '',
  totalStock: '',
  unit: 'PCS',
  imageUrl: ''
});

/**
 * Retail Shop Mart POS Counter.
 * Uses unified Mantis theme tokens and modular Shop components for product browsing,
 * cart checkout, stock updates, product editing, and receipt printing.
 */
export default function ShopMartPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const {
    items = [],
    categories: storedCategories = [],
    vendors = [],
    shopSales = [],
    shopCustomers = [],
    shopCustomerPayments = [],
    issueStock,
    addUsageLog,
    addNewItem,
    seedShopDemoData,
    updateItem,
    deleteItem,
    addShopSale
  } = useStoreInventory();

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [martPage, setMartPage] = useState(1);
  const itemsPerPage = 15;

  // Cart & Order State
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [paidEdited, setPaidEdited] = useState(false);
  const [orderDiscount, setOrderDiscount] = useState('');
  const [orderDiscountType, setOrderDiscountType] = useState('flat');
  const [orderTax, setOrderTax] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Invoice Print Modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Product Add / Edit Drawer & Delete Confirm
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [productForm, setProductForm] = useState(() => createEmptyProductForm());
  const [savingProduct, setSavingProduct] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Feedback Snackbar
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  useEffect(() => {
    setMartPage(1);
  }, [search, activeCategory]);

  const categoryFilterList = useMemo(
    () => resolveShopCategories({ categories: storedCategories, items, includeAll: true }),
    [storedCategories, items]
  );

  const productCategoryOptions = useMemo(
    () => resolveShopCategories({ categories: storedCategories, items, includeAll: false }),
    [storedCategories, items]
  );

  const customerOptions = useMemo(
    () => buildShopCustomerOptions({ shopCustomers, vendors, shopSales, shopCustomerPayments }),
    [shopCustomers, vendors, shopSales, shopCustomerPayments]
  );

  const customerLedgers = useMemo(
    () => buildShopCustomerLedgers({ shopCustomers, shopSales, shopCustomerPayments }),
    [shopCustomers, shopSales, shopCustomerPayments]
  );

  const selectedCustomerLedger = useMemo(() => {
    const key = (customerName || '').trim().toLowerCase();
    if (!key) return null;
    return customerLedgers.find((c) => c.customerName.toLowerCase() === key) || null;
  }, [customerLedgers, customerName]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchCat = activeCategory === 'All' || (item.category || 'General') === activeCategory;
      const matchSearch =
        !query ||
        (item.name || '').toLowerCase().includes(query) ||
        (item.specification || '').toLowerCase().includes(query) ||
        (item.category || '').toLowerCase().includes(query);
      return matchCat && matchSearch;
    });
  }, [items, activeCategory, search]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedMartItems = useMemo(() => {
    const startIndex = (martPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, martPage]);

  const totals = useMemo(
    () =>
      computePosTotals({
        cart,
        discountValue: orderDiscount,
        discountType: orderDiscountType,
        taxValue: orderTax
      }),
    [cart, orderDiscount, orderDiscountType, orderTax]
  );

  useEffect(() => {
    if (cart.length === 0) {
      setPaidAmount('');
      setPaidEdited(false);
      return;
    }
    if (!paidEdited) {
      setPaidAmount(paymentMethod === 'Credit' ? '0' : String(totals.grandTotal));
    }
  }, [cart.length, totals.grandTotal, paymentMethod, paidEdited]);

  const handleCustomerNameChange = (nextName) => {
    setCustomerName(nextName);
    const trimmed = (nextName || '').trim().toLowerCase();
    if (!trimmed) return;
    const matchedDir = (shopCustomers || []).find((c) => (c.name || '').trim().toLowerCase() === trimmed);
    const matchedLedger = customerLedgers.find((c) => c.customerName.toLowerCase() === trimmed);
    const phone = matchedDir?.phone || matchedLedger?.phone || '';
    if (phone && !customerPhone) {
      setCustomerPhone(phone);
    }
  };

  // Cart Handlers
  const getCartQty = (itemId) => cart.find((c) => c.item.id === itemId)?.qty || 0;
  const getAvailableStock = (item) => Math.max(0, (parseInt(item.totalStock, 10) || 0) - getCartQty(item.id));

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) => (c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const changeQty = (itemId, delta) => {
    setCart((prev) => prev.map((c) => (c.item.id === itemId ? { ...c, qty: c.qty + delta } : c)).filter((c) => c.qty > 0));
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setPaymentMethod('Cash');
    setPaidAmount('');
    setPaidEdited(false);
    setOrderDiscount('');
    setOrderDiscountType('flat');
    setOrderTax('');
  };

  // Checkout & Invoice Generation
  const handleCheckout = async () => {
    if (cart.length === 0 || checkoutLoading) return;
    setCheckoutLoading(true);

    const buyerName = customerName.trim() || 'Walk-in Customer';
    const buyerPhone = customerPhone.trim();
    const invNumber = `SLIP-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });

    const paidNum = Math.max(0, parseFloat(paidAmount) || 0);
    const clampedPaid = paidAmount === '' ? (paymentMethod === 'Credit' ? 0 : totals.grandTotal) : paidNum;
    const balanceDue = Math.max(0, totals.grandTotal - clampedPaid);
    const derivedStatus = totals.grandTotal > 0 && balanceDue <= 0 ? 'Paid' : clampedPaid > 0 ? 'Partial' : 'Unpaid';

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
      phone: buyerPhone,
      customerPhone: buyerPhone,
      issuedTo: buyerName,
      department: buyerPhone || 'Retail Counter',
      paymentMethod,
      paymentStatus: derivedStatus,
      paidAmount: clampedPaid,
      balanceAmount: balanceDue,
      items: cartSnapshot,
      subTotal: totals.subTotal,
      discount: totals.discountAmount,
      discountType: orderDiscountType,
      discountValue: orderDiscount || 0,
      tax: totals.taxAmount,
      totalAmount: totals.grandTotal
    };

    const checkoutCartSnapshot = [...cart];

    try {
      setInvoiceData(invoicePayload);
      setInvoiceModalOpen(true);
      clearCart();
      showToast(`Sale ${invNumber} (${formatPKR(invoicePayload.totalAmount)}) completed!`);

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
              buyerPhone || 'Retail Counter',
              'Counter Sales',
              `Slip: ${invNumber}`,
              parseFloat(item.unitPrice) || 0,
              item.category || 'General'
            )
          )
        );
      }
    } catch (e) {
      console.error('Checkout error:', e);
      showToast('Failed to complete sale. Please try again.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Product Drawer Handlers
  const handleOpenAddProduct = () => {
    setEditingItem(null);
    setProductForm(createEmptyProductForm(productCategoryOptions[0] || 'General'));
    setProductDrawerOpen(true);
  };

  const handleOpenEditProduct = (item) => {
    setEditingItem(item);
    setProductForm({
      name: item.name || '',
      category: item.category || 'General',
      specification: item.specification || '',
      unitPrice: item.unitPrice ?? '',
      totalStock: item.totalStock ?? '',
      unit: item.unit || 'PCS',
      imageUrl: item.imageUrl || ''
    });
    setProductDrawerOpen(true);
  };

  const handleSaveProduct = async () => {
    const cleanName = (productForm.name || '').trim();
    if (!cleanName || savingProduct) return;

    setSavingProduct(true);
    const payload = {
      name: cleanName,
      category: (productForm.category || '').trim() || 'General',
      specification: (productForm.specification || '').trim(),
      unitPrice: Math.max(0, parseFloat(productForm.unitPrice) || 0),
      totalStock: Math.max(0, parseInt(productForm.totalStock, 10) || 0),
      unit: productForm.unit || 'PCS',
      imageUrl: productForm.imageUrl || ''
    };

    try {
      if (editingItem && typeof updateItem === 'function') {
        await updateItem(editingItem.id, payload);
        showToast(`Product "${payload.name}" updated.`);
      } else if (typeof addNewItem === 'function') {
        await addNewItem(payload);
        showToast(`Product "${payload.name}" added to Shop Mart.`);
      }
      setProductDrawerOpen(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Product save error:', err);
      showToast('Unable to save product.', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!editingItem || typeof deleteItem !== 'function') return;
    await deleteItem(editingItem.id);
    setCart((prev) => prev.filter((c) => c.item.id !== editingItem.id));
    showToast(`Product "${editingItem.name}" deleted.`, 'info');
    setDeleteDialogOpen(false);
    setProductDrawerOpen(false);
    setEditingItem(null);
  };

  const hasActiveFilters = Boolean(search.trim()) || activeCategory !== 'All';

  const invoiceNotes = useMemo(() => {
    if (!invoiceData) return '';
    const notes = [];
    if (invoiceData.discount > 0) notes.push(`Discount: -${formatPKR(invoiceData.discount)}`);
    if (invoiceData.tax > 0) notes.push(`Tax: +${formatPKR(invoiceData.tax)}`);
    notes.push(`Payment: ${invoiceData.paymentMethod || 'Cash'}`);
    return notes.join(' • ');
  }, [invoiceData]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Unified Theme Page Header */}
      <PageHeader
        title="Shop Mart"
        count={items.length}
        countLabel="POS Products"
        subtitle="Select items to build a customer order, apply discounts or tax, and issue printed retail receipts."
        actions={
          <>
            <AppButton intent="secondary" startIcon={<FileTextOutlined />} onClick={() => navigate('/shop/invoices')}>
              Shop Invoices
            </AppButton>
            <AppButton intent="primary" startIcon={<PlusOutlined />} onClick={handleOpenAddProduct}>
              Add Product
            </AppButton>
          </>
        }
        sx={{ mb: 0 }}
      />

      {/* Search & Category Filter Bar */}
      <FilterBar
        hasActiveFilters={hasActiveFilters}
        onClear={() => {
          setSearch('');
          setActiveCategory('All');
        }}
        sx={{ mb: 0 }}
      >
        <OutlinedInput
          size="small"
          placeholder="Search products by name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <SearchOutlined style={{ color: theme.palette.text.secondary }} />
            </InputAdornment>
          }
          sx={{ width: { xs: '100%', sm: 260 }, bgcolor: 'background.paper' }}
        />

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          {categoryFilterList.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <Chip
                key={cat}
                label={cat}
                size="small"
                clickable
                color={isActive ? 'primary' : 'default'}
                variant={isActive ? 'filled' : 'outlined'}
                onClick={() => setActiveCategory(cat)}
                sx={{ fontWeight: isActive ? 700 : 500, fontSize: '0.75rem' }}
              />
            );
          })}
        </Box>
      </FilterBar>

      {/* Main 2-Column POS Workspace */}
      <Grid container spacing={3} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 8.2 }}>
          {filteredItems.length === 0 ? (
            <Box sx={getCardSurfaceSx(theme, { py: 8, px: 3, textAlign: 'center' })}>
              <InboxOutlined style={{ fontSize: '3rem', color: theme.palette.text.disabled, marginBottom: 12 }} />
              <Typography variant="h5" fontWeight={700} color="text.primary">
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {items.length === 0
                  ? 'No products in your Shop Mart catalogue yet. Add products or restore starter items.'
                  : 'Try adjusting your search query or category filter.'}
              </Typography>
              <Box sx={{ display: 'inline-flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                <AppButton intent="primary" startIcon={<PlusOutlined />} onClick={handleOpenAddProduct}>
                  Add Product
                </AppButton>
                {items.length === 0 && typeof seedShopDemoData === 'function' && (
                  <AppButton intent="secondary" startIcon={<ReloadOutlined />} onClick={seedShopDemoData}>
                    Restore Default Products
                  </AppButton>
                )}
              </Box>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {paginatedMartItems.map((item) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
                    <ShopProductCard
                      item={item}
                      inCartQty={getCartQty(item.id)}
                      availableStock={getAvailableStock(item)}
                      onAddToCart={addToCart}
                      onEdit={handleOpenEditProduct}
                    />
                  </Grid>
                ))}
              </Grid>

              {totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
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
                  />
                </Box>
              )}
            </>
          )}
        </Grid>

        <Grid size={{ xs: 12, lg: 3.8 }}>
          <ShopOrderSummaryPanel
            cart={cart}
            cartCount={totals.itemCount}
            subTotal={totals.subTotal}
            discountAmount={totals.discountAmount}
            grandTotal={totals.grandTotal}
            customerOptions={customerOptions}
            customerName={customerName}
            onCustomerNameChange={handleCustomerNameChange}
            customerLedger={selectedCustomerLedger}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(nextMethod) => {
              setPaymentMethod(nextMethod);
              setPaidEdited(false);
            }}
            paidAmount={paidAmount}
            onPaidAmountChange={(nextPaid) => {
              setPaidAmount(nextPaid);
              setPaidEdited(true);
            }}
            orderDiscount={orderDiscount}
            onOrderDiscountChange={setOrderDiscount}
            orderDiscountType={orderDiscountType}
            onOrderDiscountTypeChange={setOrderDiscountType}
            orderTax={orderTax}
            onOrderTaxChange={setOrderTax}
            onChangeQty={changeQty}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
            checkoutLoading={checkoutLoading}
          />
        </Grid>
      </Grid>

      {/* Reusable Add / Edit Product Drawer */}
      <ShopProductDrawer
        open={productDrawerOpen}
        onClose={() => {
          setProductDrawerOpen(false);
          setEditingItem(null);
        }}
        editingItem={editingItem}
        formData={productForm}
        onChangeFormData={setProductForm}
        categoryOptions={productCategoryOptions}
        onSave={handleSaveProduct}
        onDelete={() => setDeleteDialogOpen(true)}
        saving={savingProduct}
      />

      {/* Delete Product Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove <strong>{editingItem?.name}</strong> from Shop Mart inventory?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDeleteProduct}>
            Delete Product
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Shared Shop Print Receipt Modal */}
      {invoiceData && (
        <UniversalPrintModal
          open={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title="Shop Sales Invoice & Receipt"
          typeTag="Retail Sales Receipt"
          badgeColor={invoiceData.paymentStatus === 'Paid' ? 'success' : 'warning'}
          partyLabel="Customer / Buyer Details"
          party={{
            name: invoiceData.customerName,
            phone: invoiceData.phone || undefined,
            department: invoiceData.department
          }}
          invoiceLabel="Slip / Invoice No:"
          invoiceNo={invoiceData.invoiceNo}
          date={invoiceData.date}
          status={invoiceData.paymentStatus}
          items={(invoiceData.items || []).map((it) => ({
            name: it.name,
            subtitle: it.category,
            qty: it.qty,
            rate: it.unitPrice,
            total: it.lineTotal
          }))}
          summary={{
            totalAmount: invoiceData.totalAmount,
            paidAmount: invoiceData.paidAmount,
            balanceAmount: invoiceData.balanceAmount,
            notes: invoiceNotes
          }}
          receiverSignatureLabel="Customer Signature"
        />
      )}

      {/* Snackbar Feedback */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
