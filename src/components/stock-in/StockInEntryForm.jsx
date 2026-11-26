import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Alert, Autocomplete, Box, Grid, TextField, Typography } from '@mui/material';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';

import MainCard from 'components/MainCard';
import { AppButton } from 'components/common';
import { formatPKR } from 'utils/dashboardHelpers';
import { getCardSurfaceSx, getSubSurfaceSx, getToneColors } from 'utils/themeSurface';

const stockFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: '41.38px',
    minHeight: '41.38px',
    py: 0
  }
};

const MODE_CONFIG = {
  in: {
    cardTitle: 'Record Stock In',
    editTitle: 'Edit Stock In Entry',
    partyLabel: 'Vendor / Supplier',
    partyPlaceholder: 'Select or type vendor...',
    itemLabel: 'Item',
    itemPlaceholder: 'Select or type item...',
    categoryLabel: 'Category',
    qtyLabel: 'Qty',
    showSecondaryHint: true,
    grid: { party: { xs: 12, md: 4 }, item: { xs: 12, md: 5 }, category: { xs: 12, md: 3 }, qty: { xs: 12, sm: 6, md: 2 } }
  },
  out: {
    cardTitle: 'Record Stock Out (Sales / Usage Invoice)',
    shopCardTitle: 'Shop - Record Stock Out (Sales Invoice)',
    partyLabel: 'SELECT RECIPIENT / WORKER NAME',
    partyPlaceholder: 'Select or Type Recipient / Worker Name',
    itemLabel: 'ITEM SELECT',
    itemPlaceholder: 'Select Item',
    categoryLabel: 'CATEGORY',
    qtyLabel: 'QTY',
    showSecondaryHint: false,
    grid: { party: { xs: 12, sm: 6, md: 3 }, item: { xs: 12, sm: 6, md: 3 }, category: { xs: 12, sm: 6, md: 2.5 }, qty: { xs: 12, sm: 3, md: 1.5 } }
  }
};

/**
 * Reusable Store Stock entry card shared by Stock In and Stock Out.
 * Renders the 4 shared entry inputs uniformly at 41.38px height while preserving each mode's layout:
 * - Stock Out: single-row rapid entry (Recipient, Item, Category, Qty, Save Invoice)
 * - Stock In: multi-field bill/discount pricing row + Add to Invoice
 */
export default function StockInEntryForm({
  mode = 'in',
  isShop = false,
  form,
  onChangeForm,
  onItemNameChange,
  vendorOptions = [],
  itemOptions = [],
  categoryOptions = [],
  lineTotal = 0,
  editingLog = null,
  canEditPrice = true,
  saving = false,
  refs = {},
  onSubmit,
  onSaveInvoice,
  onClear,
  onCancelEdit
}) {
  const theme = useTheme();
  const isOut = mode === 'out';
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.in;
  const primaryTone = getToneColors(theme, 'primary');
  const successTone = getToneColors(theme, 'success');

  const focusWithSelect = (refObj) => {
    setTimeout(() => {
      if (refObj?.current) {
        refObj.current.focus();
        refObj.current.select?.();
      }
    }, 50);
  };

  const titleText = isOut
    ? isShop
      ? cfg.shopCardTitle
      : cfg.cardTitle
    : editingLog
      ? cfg.editTitle
      : cfg.cardTitle;

  const cardTitle = isOut ? (
    titleText
  ) : (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {editingLog ? <EditOutlined style={{ color: primaryTone.main }} /> : <PlusOutlined style={{ color: primaryTone.main }} />}
      <span>{titleText}</span>
    </Box>
  );

  return (
    <MainCard
      title={cardTitle}
      secondary={
        cfg.showSecondaryHint ? (
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Fields marked * are required
          </Typography>
        ) : undefined
      }
      sx={getCardSurfaceSx(theme)}
    >
      {!isOut && editingLog && (
        <Alert
          severity="info"
          icon={<EditOutlined />}
          sx={{ mb: 2.5, fontWeight: 600, alignItems: 'center' }}
          action={
            <AppButton size="small" intent="secondary" startIcon={<CloseOutlined />} onClick={onCancelEdit}>
              Cancel Edit
            </AppButton>
          }
        >
          Editing <strong>&ldquo;{editingLog.itemName}&rdquo;</strong> — update values below and click{' '}
          <strong>Update Stock In</strong>.
        </Alert>
      )}

      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit?.();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && editingLog && !isOut) onCancelEdit?.();
        }}
      >
        <Grid container spacing={2} alignItems={isOut ? 'center' : 'flex-start'}>
          {/* 1. Party (Vendor or Recipient / Worker) */}
          <Grid size={cfg.grid.party}>
            <Autocomplete
              freeSolo
              options={vendorOptions}
              value={form.vendor || null}
              inputValue={form.vendor}
              sx={stockFieldSx}
              onChange={(_, val) => {
                const next = typeof val === 'string' ? val : val || '';
                onChangeForm((prev) => ({ ...prev, vendor: next }));
                if (next) focusWithSelect(refs.itemSelectRef);
              }}
              onInputChange={(_, val, reason) => {
                if (reason !== 'reset') onChangeForm((prev) => ({ ...prev, vendor: val || '' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={refs.vendorRef}
                  label={cfg.partyLabel}
                  required
                  placeholder={cfg.partyPlaceholder}
                  onFocus={(e) => e.target.select?.()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      focusWithSelect(refs.itemSelectRef);
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* 2. Item Select */}
          <Grid size={cfg.grid.item}>
            <Autocomplete
              freeSolo
              options={itemOptions}
              value={form.itemName || null}
              inputValue={form.itemName}
              sx={stockFieldSx}
              onChange={(e, val) => {
                onItemNameChange?.(e, val);
                if (val) focusWithSelect(refs.qtyRef);
              }}
              onInputChange={(e, val, reason) => {
                if (reason !== 'reset') onItemNameChange?.(e, val);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={refs.itemSelectRef}
                  label={cfg.itemLabel}
                  required
                  placeholder={cfg.itemPlaceholder}
                  onFocus={(e) => e.target.select?.()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      focusWithSelect(refs.qtyRef);
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* 3. Category */}
          <Grid size={cfg.grid.category}>
            <Autocomplete
              freeSolo
              options={categoryOptions}
              value={form.category || 'General'}
              inputValue={form.category}
              sx={stockFieldSx}
              onChange={(_, val) => onChangeForm((prev) => ({ ...prev, category: val || 'General' }))}
              onInputChange={(_, val, reason) => {
                if (reason !== 'reset') onChangeForm((prev) => ({ ...prev, category: val || 'General' }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  inputRef={refs.categoryRef}
                  label={cfg.categoryLabel}
                  placeholder="Category"
                  onFocus={(e) => e.target.select?.()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      focusWithSelect(refs.qtyRef);
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* 4. Qty */}
          <Grid size={cfg.grid.qty}>
            <TextField
              label={cfg.qtyLabel}
              type="number"
              fullWidth
              required
              sx={stockFieldSx}
              inputRef={refs.qtyRef}
              inputProps={{ min: 1 }}
              value={form.qty}
              onFocus={(e) => e.target.select?.()}
              onChange={(e) => {
                const raw = e.target.value;
                const qtyNum = parseInt(raw, 10) || 0;
                const billNum = parseFloat(form.totalBillAmount) || 0;
                const unitPrice = !isOut && qtyNum > 0 ? billNum / qtyNum : form.unitPrice;
                onChangeForm((prev) => ({ ...prev, qty: raw === '' ? '' : qtyNum, unitPrice }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (isOut) {
                    onSubmit?.();
                  } else {
                    focusWithSelect(refs.priceRef);
                  }
                }
              }}
            />
          </Grid>

          {isOut ? (
            /* 5. Stock Out Single-Row Save Invoice Action */
            <Grid size={{ xs: 12, sm: 3, md: 2 }}>
              <AppButton
                intent="primary"
                type="button"
                fullWidth
                loading={saving}
                startIcon={<ExportOutlined />}
                onClick={onSaveInvoice}
                sx={{ height: '41.38px' }}
              >
                Save Invoice
              </AppButton>
            </Grid>
          ) : (
            <>
              {/* Total Bill Amount (PKR) */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField
                  label="Total Bill Amount (PKR)"
                  type="number"
                  fullWidth
                  required
                  disabled={!canEditPrice}
                  sx={stockFieldSx}
                  inputRef={refs.priceRef}
                  inputProps={{ min: 0, step: 'any' }}
                  placeholder="0"
                  value={
                    form.totalBillAmount !== undefined
                      ? form.totalBillAmount
                      : form.unitPrice
                        ? (parseInt(form.qty, 10) || 1) * form.unitPrice
                        : ''
                  }
                  onFocus={(e) => e.target.select?.()}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const billNum = parseFloat(raw) || 0;
                    const qtyNum = parseInt(form.qty, 10) || 1;
                    const unitPrice = qtyNum > 0 ? billNum / qtyNum : billNum;
                    onChangeForm((prev) => ({ ...prev, totalBillAmount: raw, unitPrice }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.ctrlKey) {
                        onSubmit?.();
                      } else {
                        focusWithSelect(refs.discountRef);
                      }
                    }
                  }}
                  helperText={
                    Number(form.qty) > 0 && Number(form.totalBillAmount) > 0
                      ? `Rate: Rs. ${(Number(form.totalBillAmount) / Number(form.qty)).toFixed(2)} / unit`
                      : 'Rate per unit calculates automatically'
                  }
                />
              </Grid>

              {/* Discount (PKR) */}
              <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                <TextField
                  label="Discount (PKR)"
                  type="number"
                  fullWidth
                  sx={stockFieldSx}
                  inputRef={refs.discountRef}
                  inputProps={{ min: 0, step: 'any' }}
                  value={form.discount}
                  onFocus={(e) => e.target.select?.()}
                  onChange={(e) => onChangeForm((prev) => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      onSubmit?.();
                    }
                  }}
                />
              </Grid>

              {/* Line Total Readout */}
              <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                <Box
                  sx={getSubSurfaceSx(theme, {
                    px: 1.75,
                    height: '41.38px',
                    minHeight: '41.38px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    borderColor: successTone.border,
                    bgcolor: successTone.bg
                  })}
                >
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', lineHeight: 1.1 }}>
                    Line Total (PKR)
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                    {formatPKR(lineTotal)}
                  </Typography>
                </Box>
              </Grid>

              {/* Submit / Clear Actions */}
              <Grid size={{ xs: 12, md: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', md: 'flex-end' }, flexWrap: 'wrap' }}>
                  <AppButton intent="cancel" sx={{ height: '41.38px' }} startIcon={<ReloadOutlined />} onClick={onClear} disabled={saving}>
                    Clear
                  </AppButton>
                  <AppButton
                    type="submit"
                    intent="primary"
                    loading={saving}
                    sx={{ height: '41.38px' }}
                    startIcon={editingLog ? <CheckOutlined /> : <PlusOutlined />}
                    disabled={!form.itemName?.trim() || saving}
                  >
                    {editingLog ? 'Update Stock In' : 'Add to Invoice'}
                  </AppButton>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </Box>
    </MainCard>
  );
}

StockInEntryForm.propTypes = {
  mode: PropTypes.oneOf(['in', 'out']),
  isShop: PropTypes.bool,
  form: PropTypes.object.isRequired,
  onChangeForm: PropTypes.func.isRequired,
  onItemNameChange: PropTypes.func.isRequired,
  vendorOptions: PropTypes.array,
  itemOptions: PropTypes.array,
  categoryOptions: PropTypes.array,
  lineTotal: PropTypes.number,
  editingLog: PropTypes.object,
  canEditPrice: PropTypes.bool,
  saving: PropTypes.bool,
  refs: PropTypes.object,
  onSubmit: PropTypes.func,
  onSaveInvoice: PropTypes.func,
  onClear: PropTypes.func,
  onCancelEdit: PropTypes.func
};
