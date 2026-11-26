import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Box, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';

import MainCard from 'components/MainCard';
import { AppButton } from 'components/common';
import { formatPKR } from 'utils/dashboardHelpers';
import { computeSessionInvoiceSummary } from 'utils/stockInHelpers';
import { getCardSurfaceSx, getSubSurfaceSx, getSubTableHeadCellSx, getToneColors } from 'utils/themeSurface';

const headCellSx = getSubTableHeadCellSx({ py: 1.25 });

/**
 * Live Session Receiving Invoice card for Factory Store Stock In.
 */
export default function StockInLiveInvoiceCard({
  voucherNo,
  vendorName,
  items = [],
  onNewInvoice,
  onOpenPayment,
  onPrintInvoice,
  onEditItem,
  onDeleteItem
}) {
  const theme = useTheme();
  const primaryTone = getToneColors(theme, 'primary');
  const successTone = getToneColors(theme, 'success');
  const errorTone = getToneColors(theme, 'error');

  const summary = computeSessionInvoiceSummary(items);
  const dateStr = items[0]?.time || new Date().toLocaleString();

  return (
    <MainCard
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <span>Receiving Invoice</span>
          <Chip label={voucherNo} size="small" color="primary" variant="light" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
        </Box>
      }
      secondary={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <AppButton intent="secondary" size="small" startIcon={<PlusOutlined />} onClick={onNewInvoice}>
            New Invoice
          </AppButton>
          <AppButton intent="primary" size="small" startIcon={<DollarOutlined />} disabled={items.length === 0} onClick={onOpenPayment}>
            Pay Vendor (Cash / Bilty)
          </AppButton>
          <AppButton intent="secondary" size="small" startIcon={<PrinterOutlined />} disabled={items.length === 0} onClick={onPrintInvoice}>
            Print Invoice
          </AppButton>
        </Box>
      }
      sx={getCardSurfaceSx(theme)}
    >
      {/* Invoice Header Strip */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 2.5
        }}
      >
        <Box sx={getSubSurfaceSx(theme, { p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Vendor / Supplier
            </Typography>
            <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 0.25 }}>
              {vendorName || 'Market'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Entry Type: Stock In Receipt
            </Typography>
          </Box>
          <Chip label={`${items.length} Line${items.length === 1 ? '' : 's'}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
        </Box>

        <Box sx={getSubSurfaceSx(theme, { p: 2, display: 'flex', flexDirection: 'column', gap: 0.5 })}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              PO / Voucher No
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary.main">
              {voucherNo}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Date &amp; Time
            </Typography>
            <Typography variant="caption" fontWeight={700} color="text.primary">
              {dateStr}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Payment Status
            </Typography>
            <Chip
              label={
                summary.statusColor === 'warning'
                  ? `${summary.statusLabel} (Due: ${formatPKR(summary.balanceDue)})`
                  : summary.statusLabel
              }
              size="small"
              color={summary.statusColor}
              variant="light"
              sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Session Line Items Table */}
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
              <TableCell sx={{ ...headCellSx, width: 52, textAlign: 'center' }}>Sr</TableCell>
              <TableCell sx={headCellSx}>Specification / Item Name</TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: 90 }}>Qty</TableCell>
              <TableCell align="right" sx={{ ...headCellSx, width: 120 }}>Rate</TableCell>
              <TableCell align="right" sx={{ ...headCellSx, width: 140 }}>Total Amount</TableCell>
              <TableCell align="center" sx={{ ...headCellSx, width: 100 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                  <InboxOutlined style={{ fontSize: 30, color: theme.palette.text.disabled, display: 'block', margin: '0 auto 8px' }} />
                  <Typography variant="body2" fontWeight={600} color="text.secondary">
                    No items added yet. Fill the Stock In form above to add items to this invoice.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => {
                const qty = Math.max(1, parseInt(item.qtyUsed, 10) || 1);
                const lineTotal = item.lineTotal !== undefined ? parseFloat(item.lineTotal) || 0 : qty * (parseFloat(item.unitPrice) || 0);
                const rate = qty > 0 ? lineTotal / qty : parseFloat(item.unitPrice) || 0;
                return (
                  <TableRow key={item.id || idx} hover>
                    <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {idx + 1}
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {item.itemName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.category || 'General'} • {item.itemCode || voucherNo}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {qty}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                      {formatPKR(rate)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {formatPKR(lineTotal)}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <Tooltip title="Edit Line Item">
                          <IconButton
                            size="small"
                            onClick={() => onEditItem?.(item)}
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
                        <Tooltip title="Remove Item">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteItem?.(item.id)}
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
              })
            )}

            {/* Grand Total Row */}
            <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
              <TableCell colSpan={2} align="right" sx={{ py: 1.5, fontWeight: 700 }}>
                Total Invoice Amount
              </TableCell>
              <TableCell align="center" sx={{ py: 1.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {summary.totalQty}
              </TableCell>
              <TableCell />
              <TableCell
                align="right"
                sx={{ py: 1.5, fontWeight: 700, color: successTone.main, fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums' }}
              >
                {formatPKR(summary.totalAmount)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </MainCard>
  );
}

StockInLiveInvoiceCard.propTypes = {
  voucherNo: PropTypes.string.isRequired,
  vendorName: PropTypes.string,
  items: PropTypes.array,
  onNewInvoice: PropTypes.func,
  onOpenPayment: PropTypes.func,
  onPrintInvoice: PropTypes.func,
  onEditItem: PropTypes.func,
  onDeleteItem: PropTypes.func
};
