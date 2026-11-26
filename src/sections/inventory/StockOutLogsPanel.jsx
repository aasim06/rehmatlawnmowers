import { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Box,
  Chip,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import ArrowDownOutlined from '@ant-design/icons/ArrowDownOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';

import { AppButton, AppDataTable } from 'components/common';
import { formatCategoryLabel } from 'utils/formatText';

const drawerFieldSx = {
  '& .MuiOutlinedInput-root': {
    height: '41.38px',
    minHeight: '41.38px',
    py: 0
  }
};

/**
 * Stock Out Logs table (AppDataTable) + Edit Drawer, preserving Stock Out's original layout.
 */
export default function StockOutLogsPanel({
  isShop = false,
  logs = [],
  categoryOptions = [],
  partyOptions = [],
  selectedCategory,
  onCategoryChange,
  selected = [],
  onSelectChange,
  onBulkDeleteClick,
  onCollectPayment,
  onOpenPrint,
  onOpenEdit,
  onOpenDelete,
  canDelete = true,
  canEditPrice = true,
  isStoreKeeper = false,
  editDrawerOpen = false,
  editingLog = null,
  onChangeEditingLog,
  onCloseEditDrawer,
  onSubmitEdit
}) {
  const columns = useMemo(
    () => [
      {
        id: 'itemName',
        label: 'ITEM SELECT',
        sortable: true,
        render: (log) => (
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {log.itemName}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {log.itemCode}
            </Typography>
          </Box>
        )
      },
      {
        id: 'category',
        label: 'CATEGORY',
        sortable: true,
        render: (log) => <Chip label={formatCategoryLabel(log.category || 'General')} size="small" variant="outlined" color="primary" />
      },
      {
        id: 'usedBy',
        label: 'RECIPIENT / DEPT',
        sortable: true,
        render: (log) => (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {log.usedBy || log.customer || '—'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {log.department || ''}
            </Typography>
          </Box>
        )
      },
      {
        id: 'qtyUsed',
        label: 'QTY',
        align: 'center',
        sortable: true,
        render: (log) => (
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="error.main"
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
          >
            <ArrowDownOutlined /> -{log.qtyUsed}
          </Typography>
        )
      },
      {
        id: 'unitPrice',
        label: 'LINE TOTAL',
        align: 'right',
        sortable: true,
        render: (log) => (
          <Typography variant="subtitle2" fontWeight={700} color="error.main">
            Rs. {((log.qtyUsed || 1) * (log.unitPrice || 0)).toLocaleString()}
          </Typography>
        )
      },
      {
        id: 'time',
        label: 'DATE & TIME',
        align: 'right',
        sortable: true,
        render: (log) => (
          <Typography variant="caption" color="textSecondary">
            {log.time}
          </Typography>
        )
      }
    ],
    []
  );

  return (
    <>
      <AppDataTable
        cardProps={{
          title: isShop ? 'Shop Stock Out (Sales Logs)' : 'Stock Out (Sales / Usage Logs)',
          secondary: selected.length > 0 && canDelete && (
            <AppButton intent="danger" size="small" startIcon={<DeleteOutlined />} onClick={onBulkDeleteClick}>
              Delete Selected ({selected.length})
            </AppButton>
          )
        }}
        columns={columns}
        data={logs}
        selectable={canDelete}
        selected={selected}
        onSelect={onSelectChange}
        searchPlaceholder="Search logs by item name, SKU, recipient, dept..."
        searchKeys={['itemName', 'itemCode', 'category', 'usedBy', 'customer', 'department']}
        toolbarLeft={
          <TextField
            select
            size="small"
            value={selectedCategory || 'All'}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            sx={{
              width: { xs: '100%', sm: 220, md: 240 },
              '& .MuiOutlinedInput-root': { height: '41.38px' }
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
        actions={(log) => (
          <Stack direction="row" spacing={1} justifyContent="center">
            {onCollectPayment && (
              <Tooltip title="Collect Payment / Record Voucher">
                <IconButton color="success" size="small" onClick={() => onCollectPayment(log)}>
                  <DollarOutlined />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Print Invoice Receipt">
              <IconButton color="info" size="small" onClick={() => onOpenPrint?.(log)}>
                <PrinterOutlined />
              </IconButton>
            </Tooltip>
            {!isStoreKeeper && (
              <Tooltip title="Edit Record">
                <IconButton color="primary" size="small" onClick={() => onOpenEdit?.(log)}>
                  <EditOutlined />
                </IconButton>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Delete Record">
                <IconButton color="error" size="small" onClick={() => onOpenDelete?.(log)}>
                  <DeleteOutlined />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
        emptyTitle="No Stock Out records found"
        emptySubtitle="No usage or sales transactions have been recorded matching your criteria."
      />

      {/* Edit Stock Out Record Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={onCloseEditDrawer}>
        <Box sx={{ width: { xs: 340, sm: 440 }, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
            Edit Stock Out Record
          </Typography>

          {editingLog && (
            <Box component="form" onSubmit={onSubmitEdit}>
              <Stack spacing={2.5}>
                <Autocomplete
                  freeSolo
                  options={partyOptions}
                  value={editingLog.customer || ''}
                  onChange={(_, val) => onChangeEditingLog({ ...editingLog, customer: typeof val === 'string' ? val : val || '' })}
                  onInputChange={(_, val) => onChangeEditingLog({ ...editingLog, customer: val || '' })}
                  sx={drawerFieldSx}
                  renderInput={(params) => <TextField {...params} label="SELECT RECIPIENT / WORKER NAME" required fullWidth />}
                />

                <TextField
                  label="ITEM SELECT"
                  fullWidth
                  required
                  sx={drawerFieldSx}
                  value={editingLog.itemName}
                  onChange={(e) => onChangeEditingLog({ ...editingLog, itemName: e.target.value })}
                />

                <TextField
                  label="QTY"
                  type="number"
                  fullWidth
                  required
                  sx={drawerFieldSx}
                  inputProps={{ min: 1 }}
                  value={editingLog.qty}
                  onChange={(e) => onChangeEditingLog({ ...editingLog, qty: parseInt(e.target.value, 10) || 1 })}
                />

                <TextField
                  label="UNIT PRICE"
                  type="number"
                  fullWidth
                  disabled={!canEditPrice}
                  sx={drawerFieldSx}
                  inputProps={{ min: 0 }}
                  value={editingLog.unitPrice}
                  onChange={(e) => onChangeEditingLog({ ...editingLog, unitPrice: parseFloat(e.target.value) || 0 })}
                />

                <TextField
                  label="LINE TOTAL"
                  fullWidth
                  disabled
                  sx={drawerFieldSx}
                  value={`Rs. ${((parseInt(editingLog.qty, 10) || 0) * (parseFloat(editingLog.unitPrice) || 0)).toLocaleString()}`}
                />

                <TextField
                  label="PAID AMOUNT (PKR)"
                  type="number"
                  fullWidth
                  disabled={!canEditPrice}
                  sx={drawerFieldSx}
                  inputProps={{ min: 0, step: 'any' }}
                  value={editingLog.amountPaid ?? 0}
                  onChange={(e) => onChangeEditingLog({ ...editingLog, amountPaid: parseFloat(e.target.value) || 0 })}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <AppButton intent="cancel" onClick={onCloseEditDrawer}>
                    Cancel
                  </AppButton>
                  <AppButton intent="primary" type="submit">
                    Update Record
                  </AppButton>
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}

StockOutLogsPanel.propTypes = {
  isShop: PropTypes.bool,
  logs: PropTypes.array,
  categoryOptions: PropTypes.array,
  partyOptions: PropTypes.array,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func,
  selected: PropTypes.array,
  onSelectChange: PropTypes.func,
  onBulkDeleteClick: PropTypes.func,
  onCollectPayment: PropTypes.func,
  onOpenPrint: PropTypes.func,
  onOpenEdit: PropTypes.func,
  onOpenDelete: PropTypes.func,
  canDelete: PropTypes.bool,
  canEditPrice: PropTypes.bool,
  isStoreKeeper: PropTypes.bool,
  editDrawerOpen: PropTypes.bool,
  editingLog: PropTypes.object,
  onChangeEditingLog: PropTypes.func,
  onCloseEditDrawer: PropTypes.func,
  onSubmitEdit: PropTypes.func
};
