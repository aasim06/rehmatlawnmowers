import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';

import { AppButton } from 'components/common';
import { formatPKR } from 'utils/dashboardHelpers';
import { getSubSurfaceSx, getToneColors } from 'utils/themeSurface';

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Easypaisa / JazzCash', 'Cheque'];

/**
 * Shared Vendor Shipment Payment & Bilty settlement dialog for Stock In invoices.
 */
export default function StockInVendorPaymentDialog({
  open,
  onClose,
  data,
  onChangeData,
  onConfirm
}) {
  const theme = useTheme();
  const successTone = getToneColors(theme, 'success');
  const errorTone = getToneColors(theme, 'error');
  const primaryTone = getToneColors(theme, 'primary');

  const alreadyPaid = Math.max(0, parseFloat(data.alreadyPaid) || 0);
  const newPaid = Math.max(0, parseFloat(data.cashPaid) || 0);
  const totalAmount = Math.max(0, parseFloat(data.totalAmount) || 0);
  const totalPaidCombined = alreadyPaid + newPaid;
  const remaining = Math.max(0, totalAmount - totalPaidCombined);
  const isCredit = totalPaidCombined === 0;
  const activeTone = remaining > 0 ? errorTone : successTone;

  return (
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth="sm" fullWidth>
      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onConfirm?.(true);
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DollarOutlined style={{ color: primaryTone.main }} /> Pay Vendor &amp; Bilty Receipt
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Stack spacing={2.25}>
            {/* Vendor Shipment Summary */}
            <Box sx={getSubSurfaceSx(theme, { p: 2 })}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                    Vendor / Supplier
                  </Typography>
                  <Typography variant="h5" fontWeight={800} color="text.primary">
                    {data.vendor || 'Supplier'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {data.items?.length > 1
                      ? `${data.items.length} shipment items included`
                      : `Item: ${data.items?.[0]?.itemName || 'Shipment'}`}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                    Total Shipment Bill
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color: primaryTone.main, fontVariantNumeric: 'tabular-nums' }}>
                    {formatPKR(totalAmount)}
                  </Typography>
                  {alreadyPaid > 0 && (
                    <Typography variant="caption" sx={{ color: successTone.main, fontWeight: 700, display: 'block' }}>
                      Paid to Date: {formatPKR(alreadyPaid)}
                    </Typography>
                  )}
                </Box>
              </Box>

              {data.items && data.items.length > 1 && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Stack spacing={0.5}>
                    {data.items.map((it, idx) => {
                      const itTotal = it.lineTotal && Number(it.lineTotal) > 0 ? parseFloat(it.lineTotal) : (parseInt(it.qtyUsed, 10) || 1) * (parseFloat(it.unitPrice) || 0);
                      return (
                        <Box key={it.id || idx} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <Typography variant="caption" fontWeight={600} color="text.primary">
                            {idx + 1}. {it.itemName} (×{it.qtyUsed || 1})
                          </Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatPKR(itTotal)}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Amount Input */}
            <TextField
              autoFocus
              size="small"
              fullWidth
              type="number"
              label="Payment Amount to Pay (PKR)"
              placeholder="Enter amount in PKR..."
              inputProps={{ min: 0, step: 'any' }}
              value={data.cashPaid}
              onChange={(e) => onChangeData((prev) => ({ ...prev, cashPaid: e.target.value }))}
              helperText={
                newPaid > 0
                  ? `${formatPKR(newPaid)} will be recorded against ${data.vendor || 'Supplier'}.`
                  : 'Enter 0 or leave blank to settle bill later on credit.'
              }
            />

            {/* Payment Method & Bilty */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                size="small"
                fullWidth
                label="Payment Method"
                value={data.paymentMethod || 'Cash'}
                onChange={(e) => onChangeData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                size="small"
                fullWidth
                label="Vendor Bill / Bilty # (Optional)"
                placeholder="e.g. Bill #1045 / Bilty 99"
                value={data.biltyNo || ''}
                onChange={(e) => onChangeData((prev) => ({ ...prev, biltyNo: e.target.value }))}
              />
            </Box>

            {/* Live Balance Preview */}
            <Box
              sx={getSubSurfaceSx(theme, {
                p: 2,
                bgcolor: activeTone.bg,
                borderColor: activeTone.border,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              })}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                  Payment Status
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} sx={{ color: activeTone.main }}>
                  {remaining === 0 ? 'Fully Cleared (Rs. 0 Balance)' : isCredit ? 'Full Credit (Unpaid)' : 'Partial Payment'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                  Remaining Balance Due
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: activeTone.main, fontVariantNumeric: 'tabular-nums' }}>
                  {formatPKR(remaining)}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between', bgcolor: getSubSurfaceSx(theme).bgcolor }}>
          <AppButton intent="cancel" onClick={onClose}>
            Cancel
          </AppButton>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <AppButton intent="secondary" onClick={() => onConfirm?.(false)}>
              Save Only
            </AppButton>
            <AppButton type="submit" intent="primary" startIcon={<PrinterOutlined />}>
              Save &amp; Print Receipt
            </AppButton>
          </Box>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

StockInVendorPaymentDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  data: PropTypes.object.isRequired,
  onChangeData: PropTypes.func.isRequired,
  onConfirm: PropTypes.func
};
