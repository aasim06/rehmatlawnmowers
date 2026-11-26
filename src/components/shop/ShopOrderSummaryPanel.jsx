import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import MinusOutlined from '@ant-design/icons/MinusOutlined';
import PictureOutlined from '@ant-design/icons/PictureOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';

import { AppButton } from 'components/common';
import { getCardSurfaceSx, getSubSurfaceSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import { SHOP_PAYMENT_METHODS } from 'utils/shopHelpers';

/**
 * Reusable sticky POS Order & Checkout panel synchronized with Mantis theme tokens.
 */
export default function ShopOrderSummaryPanel({
  cart = [],
  cartCount = 0,
  subTotal = 0,
  discountAmount = 0,
  grandTotal = 0,
  customerOptions = [],
  customerName = '',
  onCustomerNameChange,
  customerLedger = null,
  customerPhone = '',
  onCustomerPhoneChange,
  paymentMethod = 'Cash',
  onPaymentMethodChange,
  paidAmount = '',
  onPaidAmountChange,
  orderDiscount = '',
  onOrderDiscountChange,
  orderDiscountType = 'flat',
  onOrderDiscountTypeChange,
  orderTax = '',
  onOrderTaxChange,
  onChangeQty,
  onRemoveItem,
  onClearCart,
  onCheckout,
  checkoutLoading = false
}) {
  const theme = useTheme();
  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');

  return (
    <Box
      sx={getCardSurfaceSx(theme, {
        p: 2.5,
        position: { lg: 'sticky' },
        top: { lg: 24 }
      })}
    >
      {/* Order Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700} color="text.primary">
          Current Order ({cartCount} {cartCount === 1 ? 'item' : 'items'})
        </Typography>
        {cart.length > 0 && onClearCart && (
          <AppButton intent="ghost" color="error" size="small" onClick={onClearCart}>
            Clear
          </AppButton>
        )}
      </Box>

      {/* Cart Items List */}
      <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 0.5, mb: 2.5 }}>
        {cart.length === 0 ? (
          <Box sx={getSubSurfaceSx(theme, { py: 4, px: 2, textAlign: 'center' })}>
            <ShoppingCartOutlined style={{ fontSize: '2rem', color: theme.palette.text.disabled, marginBottom: 8 }} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              No items in order
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.25 }}>
              Click &ldquo;Add to Cart&rdquo; on products to begin billing
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {cart.map(({ item, qty }) => {
              const price = parseFloat(item.unitPrice) || 0;
              const maxStock = parseInt(item.totalStock, 10) || 0;
              return (
                <Box
                  key={item.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 1.25,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    gap: 1.25
                  }}
                >
                  <Box
                    sx={getSubSurfaceSx(theme, {
                      width: 42,
                      height: 42,
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    })}
                  >
                    {item.imageUrl ? (
                      <Box
                        component="img"
                        src={item.imageUrl}
                        alt={item.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <PictureOutlined style={{ fontSize: '1rem', color: theme.palette.text.disabled }} />
                    )}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {item.name}
                    </Typography>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatPKR(price)} × {qty} = {formatPKR(price * qty)}
                    </Typography>
                  </Box>

                  {/* Qty Stepper */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 5,
                      px: 0.4,
                      py: 0.15,
                      bgcolor: 'background.paper',
                      flexShrink: 0
                    }}
                  >
                    <IconButton size="small" onClick={() => onChangeQty(item.id, -1)} sx={{ p: 0.35, color: 'text.secondary' }}>
                      <MinusOutlined style={{ fontSize: 11 }} />
                    </IconButton>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="text.primary"
                      sx={{ px: 0.75, minWidth: 18, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {qty}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onChangeQty(item.id, 1)}
                      disabled={qty >= maxStock}
                      sx={{ p: 0.35, color: 'text.secondary' }}
                    >
                      <PlusOutlined style={{ fontSize: 11 }} />
                    </IconButton>
                  </Box>

                  {onRemoveItem && (
                    <Tooltip title="Remove">
                      <IconButton
                        size="small"
                        onClick={() => onRemoveItem(item.id)}
                        sx={{ p: 0.4, color: 'text.disabled', '&:hover': { color: errorTone.main } }}
                      >
                        <DeleteOutlined style={{ fontSize: 13 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Customer & Payment Details */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2.5 }}>
        <Box>
          {customerLedger && customerLedger.netBalance !== 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
              <Chip
                size="small"
                color={customerLedger.netBalance > 0 ? 'warning' : 'success'}
                variant="light"
                label={
                  customerLedger.netBalance > 0
                    ? `Prev Balance Due: ${formatPKR(customerLedger.netBalance)}`
                    : `Advance Credit: ${formatPKR(Math.abs(customerLedger.netBalance))}`
                }
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
              />
            </Box>
          )}
          <Autocomplete
            freeSolo
            size="small"
            options={customerOptions}
            value={customerName || null}
            inputValue={customerName}
            onChange={(e, val) => onCustomerNameChange(typeof val === 'string' ? val : val || '')}
            onInputChange={(e, val, reason) => {
              if (reason !== 'reset') onCustomerNameChange(val || '');
            }}
            renderInput={(params) => <TextField {...params} label="Customer" placeholder="Walk-in Customer" />}
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
          <TextField
            size="small"
            label="Phone (Optional)"
            placeholder="0300-1234567"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
          />
          <TextField select size="small" label="Payment" value={paymentMethod} onChange={(e) => onPaymentMethodChange(e.target.value)}>
            {SHOP_PAYMENT_METHODS.map((method) => (
              <MenuItem key={method} value={method}>
                {method}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* Totals & Adjustments */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            Sub Total
          </Typography>
          <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatPKR(subTotal)}
          </Typography>
        </Box>

        {/* Discount Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Discount
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                overflow: 'hidden'
              }}
            >
              {[
                { key: 'flat', label: 'Rs' },
                { key: 'percent', label: '%' }
              ].map((mode, idx) => {
                const isSelected = orderDiscountType === mode.key;
                return (
                  <Box
                    key={mode.key}
                    component="button"
                    type="button"
                    onClick={() => onOrderDiscountTypeChange(mode.key)}
                    sx={{
                      border: 0,
                      borderLeft: idx > 0 ? '1px solid' : 0,
                      borderColor: 'divider',
                      px: 0.85,
                      py: 0.25,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      bgcolor: isSelected ? 'primary.main' : 'background.paper',
                      color: isSelected ? 'primary.contrastText' : 'text.secondary'
                    }}
                  >
                    {mode.label}
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            {orderDiscountType === 'percent' && discountAmount > 0 && (
              <Typography variant="caption" fontWeight={700} sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                (-{formatPKR(discountAmount)})
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
                  onOrderDiscountChange('');
                } else {
                  const num = parseFloat(v);
                  onOrderDiscountChange(Number.isNaN(num) ? '' : Math.max(0, num));
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0.25 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {orderDiscountType === 'flat' ? 'Rs.' : '%'}
                    </Typography>
                  </InputAdornment>
                )
              }}
              inputProps={{
                min: 0,
                max: orderDiscountType === 'percent' ? 100 : undefined,
                style: { textAlign: 'right', fontWeight: 700, padding: '4px 6px', fontSize: '0.85rem' }
              }}
              sx={{ width: 108 }}
            />
          </Box>
        </Box>

        {/* Quick Discount Chips */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {[5, 10].map((pct) => {
            const active = orderDiscountType === 'percent' && Number(orderDiscount) === pct;
            return (
              <Chip
                key={`p-${pct}`}
                label={`${pct}%`}
                size="small"
                clickable
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                onClick={() => {
                  onOrderDiscountTypeChange('percent');
                  onOrderDiscountChange(pct);
                }}
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
              />
            );
          })}
          {[200, 500, 1000].map((amt) => {
            const active = orderDiscountType === 'flat' && Number(orderDiscount) === amt;
            return (
              <Chip
                key={`f-${amt}`}
                label={`-${amt}`}
                size="small"
                clickable
                color={active ? 'primary' : 'default'}
                variant={active ? 'filled' : 'outlined'}
                onClick={() => {
                  onOrderDiscountTypeChange('flat');
                  onOrderDiscountChange(amt);
                }}
                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
              />
            );
          })}
          {Boolean(orderDiscount) && (
            <Chip
              label="Clear"
              size="small"
              clickable
              color="error"
              variant="outlined"
              onClick={() => onOrderDiscountChange('')}
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700 }}
            />
          )}
        </Box>

        {/* Tax Row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            Tax
          </Typography>
          <TextField
            size="small"
            type="number"
            placeholder="0"
            value={orderTax}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') {
                onOrderTaxChange('');
              } else {
                const num = parseFloat(v);
                onOrderTaxChange(Number.isNaN(num) ? '' : Math.max(0, num));
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.25 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    Rs.
                  </Typography>
                </InputAdornment>
              )
            }}
            inputProps={{
              min: 0,
              style: { textAlign: 'right', fontWeight: 700, padding: '4px 6px', fontSize: '0.85rem' }
            }}
            sx={{ width: 108 }}
          />
        </Box>

        <Divider sx={{ my: 0.5 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={800} color="text.primary">
            Grand Total
          </Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color: primaryTone.main, fontVariantNumeric: 'tabular-nums' }}>
            {formatPKR(grandTotal)}
          </Typography>
        </Box>

        {/* Paid Now & Balance Due (Partial / Udhaar Counter Support) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.25 }}>
          <Typography variant="body2" fontWeight={600} color="text.secondary">
            Paid Now
          </Typography>
          <TextField
            size="small"
            type="number"
            placeholder="0"
            value={paidAmount}
            onChange={(e) => {
              const v = e.target.value;
              if (v === '') {
                onPaidAmountChange('');
              } else {
                const num = parseFloat(v);
                onPaidAmountChange(Number.isNaN(num) ? '' : Math.max(0, num));
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.25 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    Rs.
                  </Typography>
                </InputAdornment>
              )
            }}
            inputProps={{
              min: 0,
              style: { textAlign: 'right', fontWeight: 700, padding: '4px 6px', fontSize: '0.85rem' }
            }}
            sx={{ width: 122 }}
          />
        </Box>

        {cart.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              Remaining Balance Due
            </Typography>
            <Typography
              variant="subtitle2"
              fontWeight={800}
              sx={{
                fontVariantNumeric: 'tabular-nums',
                color: Math.max(0, grandTotal - (parseFloat(paidAmount) || 0)) > 0 ? errorTone.main : successTone.main
              }}
            >
              {formatPKR(Math.max(0, grandTotal - (parseFloat(paidAmount) || 0)))}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Primary Checkout CTA */}
      <AppButton
        fullWidth
        size="large"
        intent="primary"
        loading={checkoutLoading}
        loadingText="Processing..."
        disabled={cart.length === 0}
        onClick={onCheckout}
      >
        Pay Now / Complete Sale
      </AppButton>
    </Box>
  );
}

ShopOrderSummaryPanel.propTypes = {
  cart: PropTypes.array,
  cartCount: PropTypes.number,
  subTotal: PropTypes.number,
  discountAmount: PropTypes.number,
  grandTotal: PropTypes.number,
  customerOptions: PropTypes.arrayOf(PropTypes.string),
  customerName: PropTypes.string,
  onCustomerNameChange: PropTypes.func.isRequired,
  customerLedger: PropTypes.object,
  customerPhone: PropTypes.string,
  onCustomerPhoneChange: PropTypes.func.isRequired,
  paymentMethod: PropTypes.string,
  onPaymentMethodChange: PropTypes.func.isRequired,
  paidAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onPaidAmountChange: PropTypes.func.isRequired,
  orderDiscount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onOrderDiscountChange: PropTypes.func.isRequired,
  orderDiscountType: PropTypes.string,
  onOrderDiscountTypeChange: PropTypes.func.isRequired,
  orderTax: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onOrderTaxChange: PropTypes.func.isRequired,
  onChangeQty: PropTypes.func.isRequired,
  onRemoveItem: PropTypes.func,
  onClearCart: PropTypes.func,
  onCheckout: PropTypes.func.isRequired,
  checkoutLoading: PropTypes.bool
};

