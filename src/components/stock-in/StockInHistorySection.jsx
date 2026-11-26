import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  OutlinedInput,
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
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import FolderOpenOutlined from '@ant-design/icons/FolderOpenOutlined';
import FolderOutlined from '@ant-design/icons/FolderOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';

import MainCard from 'components/MainCard';
import { AppButton, FilterBar } from 'components/common';
import { formatCategoryLabel } from 'utils/formatText';
import { formatPKR } from 'utils/dashboardHelpers';
import { getCardSurfaceSx, getSubSurfaceSx, getSubTableHeadCellSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';

const tableHeadCellSx = getTableHeadCellSx();

const subHeadCellSx = getSubTableHeadCellSx();

/**
 * Collapsible Vendor-grouped Stock In History table with FilterBar, bulk selection,
 * expandable shipment line items, and direct vendor settlement.
 */
export default function StockInHistorySection({
  stockInLogs = [],
  groupedLogs = [],
  categoryOptions = [],
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onResetFilters,
  selected = [],
  onSelectChange,
  canDelete = true,
  onOpenPayment,
  onPrintGroup,
  onPrintLog,
  onEditLog,
  onDeleteLog,
  onBulkDeleteClick
}) {
  const theme = useTheme();
  const primaryTone = getToneColors(theme, 'primary');
  const successTone = getToneColors(theme, 'success');
  const errorTone = getToneColors(theme, 'error');

  const [expandedVendors, setExpandedVendors] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const isSearching = Boolean(searchTerm.trim() || selectedCategory !== 'All');
  const isVendorExpanded = (vName) => {
    if (isSearching) return true;
    if (expandedVendors[vName] !== undefined) return expandedVendors[vName];
    return allExpanded;
  };

  const toggleVendorExpand = (vName) => {
    setExpandedVendors((prev) => ({ ...prev, [vName]: !isVendorExpanded(vName) }));
  };

  const handleToggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    const updated = {};
    groupedLogs.forEach((g) => {
      updated[g.vendorName] = next;
    });
    setExpandedVendors(updated);
  };

  const isGroupSelected = (group) => {
    const ids = group.items.map((i) => i.id);
    return ids.length > 0 && ids.every((id) => selected.includes(id));
  };

  const isGroupIndeterminate = (group) => {
    const ids = group.items.map((i) => i.id);
    const some = ids.some((id) => selected.includes(id));
    return some && !ids.every((id) => selected.includes(id));
  };

  const handleSelectAll = (checked) => {
    onSelectChange(checked ? stockInLogs.map((l) => l.id) : []);
  };

  const handleSelectGroup = (e, group) => {
    e.stopPropagation();
    const ids = group.items.map((i) => i.id);
    if (isGroupSelected(group)) {
      onSelectChange(selected.filter((id) => !ids.includes(id)));
    } else {
      onSelectChange(Array.from(new Set([...selected, ...ids])));
    }
  };

  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    onSelectChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const paginatedGroups = groupedLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const baseCols = (canDelete ? 1 : 0) + 7;

  return (
    <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
      {/* Filter Toolbar */}
      <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <FilterBar
          hasActiveFilters={isSearching}
          onClear={() => {
            setPage(0);
            onResetFilters?.();
          }}
          sx={{ mb: 0, p: 0, bgcolor: 'transparent', border: 0 }}
        >
          <OutlinedInput
            size="small"
            placeholder="Search by item name, SKU, vendor, or notes..."
            value={searchTerm}
            onChange={(e) => {
              setPage(0);
              onSearchChange?.(e.target.value);
            }}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined style={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            }
            sx={{ flex: 1, minWidth: { xs: '100%', sm: 250 } }}
          />

          <Autocomplete
            size="small"
            options={['All', ...categoryOptions]}
            value={selectedCategory || 'All'}
            onChange={(_, val) => {
              setPage(0);
              onCategoryChange?.(val || 'All');
            }}
            getOptionLabel={(opt) => formatCategoryLabel(opt)}
            isOptionEqualToValue={(opt, val) => opt === val}
            renderInput={(params) => <TextField {...params} label="Category Filter" />}
            sx={{ width: { xs: '100%', sm: 210 } }}
          />

          <AppButton
            intent="secondary"
            size="small"
            startIcon={allExpanded ? <FolderOutlined /> : <FolderOpenOutlined />}
            onClick={handleToggleAll}
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
          </AppButton>

          {selected.length > 0 && canDelete && (
            <AppButton intent="danger" size="small" startIcon={<DeleteOutlined />} onClick={onBulkDeleteClick}>
              Delete Selected ({selected.length})
            </AppButton>
          )}
        </FilterBar>
      </Box>

      {/* Collapsible Vendor Grouped Table */}
      <TableContainer>
        <Table sx={{ minWidth: 840 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor, borderBottom: '1px solid', borderColor: 'divider' }}>
              {canDelete && (
                <TableCell padding="checkbox" sx={{ pl: 2 }}>
                  <Checkbox
                    size="small"
                    indeterminate={selected.length > 0 && selected.length < stockInLogs.length}
                    checked={stockInLogs.length > 0 && selected.length === stockInLogs.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}
              <TableCell sx={{ width: 42 }} />
              <TableCell sx={tableHeadCellSx}>Vendor / Supplier</TableCell>
              <TableCell align="center" sx={tableHeadCellSx}>Items / Qty</TableCell>
              <TableCell align="right" sx={tableHeadCellSx}>Total Bill</TableCell>
              <TableCell align="right" sx={tableHeadCellSx}>Paid</TableCell>
              <TableCell align="right" sx={tableHeadCellSx}>Balance Due</TableCell>
              <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={baseCols} align="center" sx={{ py: 7 }}>
                  <InboxOutlined style={{ fontSize: 36, color: theme.palette.text.disabled, display: 'block', margin: '0 auto 10px' }} />
                  <Typography variant="h6" fontWeight={700} color="text.secondary">
                    No Stock In Logs Found
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Add items in the Receiving Invoice tab or clear active filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedGroups.map((group) => {
                const expanded = isVendorExpanded(group.vendorName);
                const firstLog = group.items[0];
                return (
                  <React.Fragment key={group.vendorName}>
                    <TableRow
                      hover
                      onClick={() => toggleVendorExpand(group.vendorName)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: expanded ? getSubSurfaceSx(theme).bgcolor : 'inherit',
                        '& td': { py: 1.75 }
                      }}
                    >
                      {canDelete && (
                        <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            size="small"
                            checked={isGroupSelected(group)}
                            indeterminate={isGroupIndeterminate(group)}
                            onChange={(e) => handleSelectGroup(e, group)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <IconButton size="small" sx={{ color: expanded ? 'primary.main' : 'text.secondary' }}>
                          {expanded ? <UpOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                            {group.vendorName}
                          </Typography>
                          {group.biltyList.slice(0, 2).map((b) => (
                            <Chip key={b} label={`Bill #${b}`} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.75rem' }} />
                          ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Last Received: {group.latestTime || 'Recent'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'inline-flex', gap: 0.6 }}>
                          <Chip label={`${group.items.length} Lines`} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                          <Chip
                            label={`+${group.totalQty} Qty`}
                            size="small"
                            color="primary"
                            variant="light"
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {formatPKR(group.totalBill)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                        {formatPKR(group.totalPaid)}
                      </TableCell>
                      <TableCell align="right">
                        {group.remainingBalance > 0 ? (
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: errorTone.main, fontVariantNumeric: 'tabular-nums' }}>
                            Due: {formatPKR(group.remainingBalance)}
                          </Typography>
                        ) : (
                          <Chip label="Settled" size="small" color="success" variant="light" sx={{ fontWeight: 700 }} />
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ pr: 2.5 }} onClick={(e) => e.stopPropagation()}>
                        <Box sx={{ display: 'inline-flex', gap: 0.75, alignItems: 'center' }}>
                          <AppButton size="small" intent="primary" startIcon={<DollarOutlined />} onClick={() => onOpenPayment?.(firstLog)}>
                            Pay
                          </AppButton>
                          <Tooltip title="Print Vendor Shipment Receipt">
                            <IconButton
                              size="small"
                              onClick={() => onPrintGroup?.(group)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                                color: 'text.secondary',
                                '&:hover': { bgcolor: primaryTone.bg, color: primaryTone.main, borderColor: primaryTone.border }
                              }}
                            >
                              <PrinterOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Line Items */}
                    <TableRow>
                      <TableCell colSpan={baseCols} sx={{ p: 0, borderBottom: expanded ? '1px solid' : 0, borderColor: 'divider' }}>
                        <Collapse in={expanded} timeout="auto" unmountOnExit>
                          <Box sx={getSubSurfaceSx(theme, { p: 2, borderRadius: 0 })}>
                            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
                                    {canDelete && <TableCell padding="checkbox" sx={{ width: 40 }} />}
                                    <TableCell sx={subHeadCellSx}>Item &amp; Reference</TableCell>
                                    <TableCell sx={subHeadCellSx}>Category</TableCell>
                                    <TableCell sx={subHeadCellSx}>Date &amp; Time</TableCell>
                                    <TableCell align="center" sx={subHeadCellSx}>Qty</TableCell>
                                    <TableCell align="right" sx={subHeadCellSx}>Rate</TableCell>
                                    <TableCell align="right" sx={subHeadCellSx}>Line Total</TableCell>
                                    <TableCell align="center" sx={subHeadCellSx}>Actions</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {group.items.map((log) => {
                                    const qty = Math.max(1, parseInt(log.qtyUsed, 10) || 1);
                                    const rate = parseFloat(log.unitPrice) || 0;
                                    const lineTotal =
                                      log.lineTotal !== undefined && Number(log.lineTotal) > 0 ? parseFloat(log.lineTotal) : qty * rate;

                                    return (
                                      <TableRow key={log.id} hover>
                                        {canDelete && (
                                          <TableCell padding="checkbox">
                                            <Checkbox size="small" checked={selected.includes(log.id)} onChange={(e) => handleSelectOne(e, log.id)} />
                                          </TableCell>
                                        )}
                                        <TableCell>
                                          <Typography variant="body2" fontWeight={700} color="text.primary">
                                            {log.itemName}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {log.itemCode || 'N/A'}
                                            {log.notes ? ` • ${log.notes}` : ''}
                                          </Typography>
                                        </TableCell>
                                        <TableCell>
                                          <Chip label={formatCategoryLabel(log.category || 'General')} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.75rem' }} />
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                                          {log.time || 'Recent'}
                                        </TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                          +{qty}
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                                          {formatPKR(rate)}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                          {formatPKR(lineTotal)}
                                        </TableCell>
                                        <TableCell align="center">
                                          <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                                            <Tooltip title="Print Line Receipt">
                                              <IconButton size="small" color="primary" onClick={() => onPrintLog?.(log)}>
                                                <PrinterOutlined style={{ fontSize: 13 }} />
                                              </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Edit Line Entry">
                                              <IconButton size="small" color="info" onClick={() => onEditLog?.(log)}>
                                                <EditOutlined style={{ fontSize: 13 }} />
                                              </IconButton>
                                            </Tooltip>
                                            {canDelete && (
                                              <Tooltip title="Delete Entry">
                                                <IconButton size="small" color="error" onClick={() => onDeleteLog?.(log)}>
                                                  <DeleteOutlined style={{ fontSize: 13 }} />
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                          </Box>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={groupedLogs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </MainCard>
  );
}

StockInHistorySection.propTypes = {
  stockInLogs: PropTypes.array,
  groupedLogs: PropTypes.array,
  categoryOptions: PropTypes.array,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  selectedCategory: PropTypes.string,
  onCategoryChange: PropTypes.func,
  onResetFilters: PropTypes.func,
  selected: PropTypes.array,
  onSelectChange: PropTypes.func,
  canDelete: PropTypes.bool,
  onOpenPayment: PropTypes.func,
  onPrintGroup: PropTypes.func,
  onPrintLog: PropTypes.func,
  onEditLog: PropTypes.func,
  onDeleteLog: PropTypes.func,
  onBulkDeleteClick: PropTypes.func
};
