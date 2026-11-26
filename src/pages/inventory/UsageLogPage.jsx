import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// icons
import DatabaseOutlined from '@ant-design/icons/DatabaseOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import HistoryOutlined from '@ant-design/icons/HistoryOutlined';
import ImportOutlined from '@ant-design/icons/ImportOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import BookOutlined from '@ant-design/icons/BookOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';

// project imports
import { AppButton, MasterHistoryLedger, UniversalPrintModal } from 'components/common';
import { formatPKR } from 'utils/dashboardHelpers';
import { isRecordInDateRange } from 'utils/ledgerHelpers';

/**
 * Factory Store History & Bin Card Ledger.
 * Unified under MasterHistoryLedger with identical filters, KPIs, switcher, and print sheet.
 */
export default function UsageLogPage() {
  const navigate = useNavigate();
  const { usageLogs = [], items = [], deleteMultipleLogs } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedItem, setSelectedItem] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterType, selectedItem, startDate, endDate]);

  const itemUnitMap = useMemo(() => {
    const map = {};
    (items || []).forEach((it) => {
      if (it.name) map[it.name.trim().toLowerCase()] = it.unit || 'PCS';
    });
    return map;
  }, [items]);

  const uniqueItemOptions = useMemo(() => {
    const set = new Set();
    (items || []).forEach((it) => it.name && set.add(it.name.trim()));
    (usageLogs || []).forEach((l) => l.itemName && set.add(l.itemName.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, usageLogs]);

  const itemRunningBalances = useMemo(() => {
    const chronological = [...usageLogs].sort(
      (a, b) => new Date(a.created_at || a.dateISO || 0) - new Date(b.created_at || b.dateISO || 0)
    );
    const balances = {};
    const stockMap = {};

    chronological.forEach((log) => {
      const key = (log.itemName || '').trim().toLowerCase();
      const isIN = (log.type || '').toUpperCase().includes('IN');
      const qty = parseFloat(log.qtyUsed) || 0;
      if (stockMap[key] === undefined) stockMap[key] = 0;
      stockMap[key] = isIN ? stockMap[key] + qty : Math.max(0, stockMap[key] - qty);

      const explicitValid =
        log.remainingStockAfter !== null && log.remainingStockAfter !== undefined && !Number.isNaN(Number(log.remainingStockAfter));

      balances[log.id] = explicitValid ? Number(log.remainingStockAfter) : stockMap[key];
    });

    return balances;
  }, [usageLogs]);

  const filteredLogs = useMemo(() => {
    return usageLogs.filter((log) => {
      if (selectedItem !== 'All' && (log.itemName || '').trim().toLowerCase() !== selectedItem.trim().toLowerCase()) {
        return false;
      }
      if (filterType === 'IN' && !(log.type || '').toUpperCase().includes('IN')) return false;
      if (filterType === 'OUT' && (log.type || '').toUpperCase().includes('IN')) return false;
      if (!isRecordInDateRange(log, startDate, endDate)) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          (log.itemName || '').toLowerCase().includes(q) ||
          (log.itemCode || '').toLowerCase().includes(q) ||
          (log.usedBy || '').toLowerCase().includes(q) ||
          (log.department || '').toLowerCase().includes(q) ||
          (log.biltyNo || '').toLowerCase().includes(q) ||
          (log.notes || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [usageLogs, selectedItem, filterType, startDate, endDate, searchTerm]);

  const summary = useMemo(() => {
    let totalInQty = 0;
    let totalInVal = 0;
    let totalOutQty = 0;
    let totalOutVal = 0;

    filteredLogs.forEach((log) => {
      const isIN = (log.type || '').toUpperCase().includes('IN');
      const qty = parseFloat(log.qtyUsed) || 0;
      const rate = parseFloat(log.unitPrice) || 0;
      const val = parseFloat(log.lineTotal) || qty * rate;
      if (isIN) {
        totalInQty += qty;
        totalInVal += val;
      } else {
        totalOutQty += qty;
        totalOutVal += val;
      }
    });

    return {
      totalInQty,
      totalInVal,
      totalOutQty,
      totalOutVal,
      netQtyMovement: totalInQty - totalOutQty,
      netValMovement: totalInVal - totalOutVal
    };
  }, [filteredLogs]);

  const formatVoucher = (log) => {
    const isIN = (log.type || '').toUpperCase().includes('IN');
    if (log.biltyNo) return { text: `Bill #${log.biltyNo}`, isBilty: true };
    if (log.notes && log.notes.includes('Bill #')) {
      const match = log.notes.match(/Bill #([^\s(]+)/);
      if (match) return { text: `Bill #${match[1]}`, isBilty: true };
    }
    const short = (log.id || '').replace(/-/g, '').slice(0, 5).toUpperCase();
    return { text: isIN ? `GRN-${short}` : `ISS-${short}`, isBilty: false };
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(filteredLogs.map((n) => n.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterType('All');
    setSelectedItem('All');
    setStartDate('');
    setEndDate('');
    setSelected([]);
  };

  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleLogs(selected);
      setSelected([]);
    }
    setBulkDeleteDialogOpen(false);
  };

  const handleExportCSV = () => {
    const headers = [
      'Date & Time',
      'Voucher / Bill No',
      'Item Name',
      'SKU Code',
      'Movement Type',
      'Party / Operator',
      'Department',
      'IN Qty',
      'OUT Qty',
      'Total Value (PKR)',
      'Balance Stock',
      'Issued By',
      'Notes'
    ];

    const rows = filteredLogs.map((log) => {
      const isIN = (log.type || '').toUpperCase().includes('IN');
      const balance = itemRunningBalances[log.id] ?? 0;
      const unit = itemUnitMap[(log.itemName || '').trim().toLowerCase()] || 'PCS';
      const voucher = formatVoucher(log).text;

      return [
        `"${log.time || log.dateISO || ''}"`,
        `"${voucher}"`,
        `"${log.itemName || ''}"`,
        `"${log.itemCode || ''}"`,
        `"${isIN ? 'INWARD' : 'OUTWARD'}"`,
        `"${log.usedBy || ''}"`,
        `"${log.department || ''}"`,
        isIN ? log.qtyUsed : 0,
        !isIN ? log.qtyUsed : 0,
        log.lineTotal || log.qtyUsed * (log.unitPrice || 0),
        `"${balance} ${unit}"`,
        `"${log.issuedBy || ''}"`,
        `"${(log.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Rehmat_Store_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const extraStoreFilters = (
    <>
      <Autocomplete
        size="small"
        options={uniqueItemOptions}
        value={selectedItem === 'All' ? null : selectedItem}
        onChange={(_, newValue) => setSelectedItem(newValue || 'All')}
        sx={{
          flex: '1 1 200px',
          minWidth: 180,
          '& .MuiOutlinedInput-root': { height: 38 }
        }}
        renderInput={(params) => <TextField {...params} size="small" label="Filter Specific Item" placeholder="All Items..." />}
      />

      <FormControl size="small" sx={{ flex: '0 0 155px', '& .MuiOutlinedInput-root': { height: 38 } }}>
        <InputLabel id="movement-type-label">Movement Type</InputLabel>
        <Select labelId="movement-type-label" value={filterType} label="Movement Type" onChange={(e) => setFilterType(e.target.value)}>
          <MenuItem value="All">All Movements</MenuItem>
          <MenuItem value="IN">Inward</MenuItem>
          <MenuItem value="OUT">Outward</MenuItem>
        </Select>
      </FormControl>
    </>
  );

  const printCustomTable = (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '12px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f8fafc', border: '1.5px solid #111827', textAlign: 'left' }}>
          <th style={{ padding: '6px 6px', borderRight: '1px solid #cbd5e1', textAlign: 'center', width: '36px' }}>Sr</th>
          <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Date &amp; Time</th>
          <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Voucher #</th>
          <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Item &amp; SKU</th>
          <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1' }}>Party / Operator</th>
          <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>IN</th>
          <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>OUT</th>
          <th style={{ padding: '6px 8px', borderRight: '1px solid #cbd5e1', textAlign: 'right' }}>Amount</th>
          <th style={{ padding: '6px 8px', textAlign: 'right' }}>Balance</th>
        </tr>
      </thead>
      <tbody>
        {filteredLogs.map((log, idx) => {
          const isIN = (log.type || '').toUpperCase().includes('IN');
          const voucher = formatVoucher(log);
          const balanceQty = itemRunningBalances[log.id] ?? 0;
          const unit = itemUnitMap[(log.itemName || '').trim().toLowerCase()] || 'PCS';
          const rateVal = parseFloat(log.unitPrice) || 0;
          const totalVal = parseFloat(log.lineTotal) || (parseFloat(log.qtyUsed) || 0) * rateVal;

          return (
            <tr
              key={log.id}
              style={{ borderBottom: '1px solid #cbd5e1', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}
            >
              <td style={{ padding: '5px 6px', borderRight: '1px solid #e2e8f0', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                {log.dateISO ? new Date(log.dateISO).toLocaleDateString() : log.time?.split(',')[0] || '-'}
              </td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {voucher.text}
              </td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700 }}>{log.itemName}</div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{log.itemCode || 'SKU-N/A'}</div>
              </td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0' }}>{log.usedBy || (isIN ? 'Vendor' : 'Operator')}</td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>
                {isIN ? `+${log.qtyUsed}` : '-'}
              </td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
                {!isIN ? `-${log.qtyUsed}` : '-'}
              </td>
              <td style={{ padding: '5px 8px', borderRight: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700 }}>
                {totalVal > 0 ? formatPKR(totalVal) : '-'}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>
                {balanceQty} {unit}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const printCustomSummary = (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1,
        border: '1px solid #86efac',
        mb: 1.2,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 1.5
      }}
    >
      <Box>
        <Typography variant="caption" fontWeight={700} display="block" color="success.dark">
          Total Inward: +{summary.totalInQty.toLocaleString()} Units ({formatPKR(summary.totalInVal)})
        </Typography>
        <Typography variant="caption" fontWeight={700} display="block" color="error.main">
          Total Outward: -{summary.totalOutQty.toLocaleString()} Units ({formatPKR(summary.totalOutVal)})
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right' }}>
        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
          Net Movement:{' '}
          {summary.netQtyMovement >= 0 ? `+${summary.netQtyMovement.toLocaleString()}` : summary.netQtyMovement.toLocaleString()} Units
        </Typography>
        <Typography variant="caption" fontWeight={700} color="text.secondary">
          Net Value: {formatPKR(summary.netValMovement)}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <MasterHistoryLedger
        activeDepartment="factory-store"
        title="Store History & Bin Card Ledger"
        subtitle="Audit inward deliveries, floor issuance, stock running balances & bin card movement"
        badgeLabel="Audit Live"
        headerIcon={<HistoryOutlined />}
        headerActions={
          <>
            {selected.length > 0 && (
              <AppButton intent="danger" size="small" startIcon={<DeleteOutlined />} onClick={() => setBulkDeleteDialogOpen(true)}>
                Delete Selected ({selected.length})
              </AppButton>
            )}
            <AppButton intent="secondary" startIcon={<WalletOutlined />} onClick={() => navigate('/inventory/store-payments')}>
              Store Payments
            </AppButton>
            <AppButton intent="secondary" startIcon={<BookOutlined />} onClick={() => navigate('/inventory/store-ledger')}>
              Store Party Ledger
            </AppButton>
            <AppButton intent="cancel" startIcon={<DownloadOutlined />} onClick={handleExportCSV} disabled={filteredLogs.length === 0}>
              Export CSV
            </AppButton>
            <AppButton
              intent="print"
              startIcon={<PrinterOutlined />}
              onClick={() => setPrintModalOpen(true)}
              disabled={filteredLogs.length === 0}
            >
              Print Ledger
            </AppButton>
          </>
        }
        kpis={[
          {
            label: 'Filtered Records',
            value: filteredLogs.length.toLocaleString(),
            helper: `Total stored entries: ${usageLogs.length}`,
            icon: <DatabaseOutlined />,
            tone: 'primary'
          },
          {
            label: 'Total Inward',
            value: `+${summary.totalInQty.toLocaleString()} Units`,
            helper: formatPKR(summary.totalInVal),
            icon: <ImportOutlined />,
            tone: 'success',
            highlightValue: summary.totalInQty > 0
          },
          {
            label: 'Total Outward',
            value: `−${summary.totalOutQty.toLocaleString()} Units`,
            helper: formatPKR(summary.totalOutVal),
            icon: <ExportOutlined />,
            tone: summary.totalOutQty > 0 ? 'error' : 'neutral'
          },
          {
            label: 'Net Stock Movement',
            value: `${summary.netQtyMovement >= 0 ? `+${summary.netQtyMovement.toLocaleString()}` : summary.netQtyMovement.toLocaleString()} Units`,
            helper: `Net: ${formatPKR(summary.netValMovement)}`,
            icon: <HistoryOutlined />,
            tone: 'primary'
          }
        ]}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search item, SKU, operator, dept or bill #..."
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onResetFilters={handleClearFilter}
        hasExtraActiveFilters={filterType !== 'All' || selectedItem !== 'All'}
        extraFilters={extraStoreFilters}
        quickRangeChips={
          selectedItem !== 'All' && (
            <Chip
              label={`Bin Card: ${selectedItem}`}
              size="small"
              color="primary"
              onDelete={() => setSelectedItem('All')}
              sx={{ fontWeight: 700, height: 26 }}
            />
          )
        }
        registerTitle="Store Transaction Register"
        registerCount={filteredLogs.length}
        registerCountLabel="Transactions"
        pagination={{
          count: filteredLogs.length,
          rowsPerPage,
          page,
          onPageChange: (_, newPage) => setPage(newPage),
          onRowsPerPageChange: (e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }
        }}
      >
        <TableContainer sx={{ minHeight: 380 }}>
          <Table size="small" sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ py: 1.5, px: 1 }}>
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredLogs.length}
                    checked={filteredLogs.length > 0 && selected.length === filteredLogs.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>DATE &amp; TIME</TableCell>
                <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>VOUCHER #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ITEM &amp; SKU</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  MOVEMENT
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PARTY / OPERATOR</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  IN QTY
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  OUT QTY
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  TOTAL AMOUNT
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                  BALANCE
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 7 }}>
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No Store Ledger Records Found
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      Try adjusting the date range, item filter, or search keywords.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => {
                  const isIN = (log.type || '').toUpperCase().includes('IN');
                  const isLogSelected = selected.includes(log.id);
                  const voucher = formatVoucher(log);
                  const balanceQty = itemRunningBalances[log.id] ?? 0;
                  const unit = itemUnitMap[(log.itemName || '').trim().toLowerCase()] || 'PCS';
                  const rateVal = parseFloat(log.unitPrice) || 0;
                  const totalVal = parseFloat(log.lineTotal) || (parseFloat(log.qtyUsed) || 0) * rateVal;

                  return (
                    <TableRow key={log.id} hover selected={isLogSelected}>
                      <TableCell padding="checkbox" sx={{ py: 0.75, px: 1 }}>
                        <Checkbox color="primary" checked={isLogSelected} onChange={(e) => handleSelectOne(e, log.id)} />
                      </TableCell>

                      <TableCell sx={{ py: 0.85, px: 1, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight={700}>
                          {log.time ? log.time.split(',')[0] : log.dateISO ? new Date(log.dateISO).toLocaleDateString() : '-'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {log.time && log.time.includes(',') ? log.time.split(',')[1].trim() : ''}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 0.85, px: 1, whiteSpace: 'nowrap' }}>
                        <Chip
                          label={voucher.text}
                          size="small"
                          color={voucher.isBilty ? 'primary' : isIN ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 0.85, px: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {log.itemName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block' }}>
                          {log.itemCode || 'SKU-N/A'}
                        </Typography>
                      </TableCell>

                      <TableCell align="center" sx={{ py: 0.85, px: 1, whiteSpace: 'nowrap' }}>
                        <Chip
                          size="small"
                          label={isIN ? 'INWARD' : 'OUTWARD'}
                          color={isIN ? 'success' : 'error'}
                          variant="light"
                          sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 0.85, px: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {log.usedBy || (isIN ? 'Vendor Shipment' : 'Store Operator')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {isIN ? 'Supplier' : 'Issued To'}
                          {log.department && log.department !== 'Store' && log.department !== 'Store Inward' ? ` (${log.department})` : ''}
                        </Typography>
                      </TableCell>

                      <TableCell align="right" sx={{ py: 0.85, px: 1, whiteSpace: 'nowrap' }}>
                        {isIN ? (
                          <Typography variant="subtitle2" fontWeight={700} color="success.main">
                            +{log.qtyUsed}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ py: 0.85, px: 1, whiteSpace: 'nowrap' }}>
                        {!isIN ? (
                          <Typography variant="subtitle2" fontWeight={700} color="error.main">
                            -{log.qtyUsed}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell align="right" sx={{ py: 0.85, px: 1, whiteSpace: 'nowrap' }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {totalVal > 0 ? formatPKR(totalVal) : '-'}
                        </Typography>
                      </TableCell>

                      <TableCell align="right" sx={{ py: 0.85, px: 1, whiteSpace: 'nowrap' }}>
                        <Chip
                          size="small"
                          label={`${balanceQty} ${unit}`}
                          color="primary"
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MasterHistoryLedger>

      {/* Bulk Delete Modal */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Selected Logs Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selected.length} selected transaction logs</strong> from the ledger?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setBulkDeleteDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmBulkDelete}>
            Delete Selected
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* Unified Store Ledger Statement Print Modal */}
      <UniversalPrintModal
        open={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        title="Store Inventory Ledger Statement"
        typeTag="Store Bin Card Register"
        badgeColor="primary"
        partyLabel="Audit Scope"
        party={{
          name: selectedItem === 'All' ? 'All Store Materials & Parts' : `Bin Card: ${selectedItem}`,
          subText: `Movement Filter: ${filterType === 'All' ? 'All Inward & Outward' : filterType}`
        }}
        invoiceLabel="Period:"
        invoiceNo={startDate || endDate ? `${startDate || 'Start'} to ${endDate || 'Present'}` : 'All Time'}
        date={new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
        status={`${filteredLogs.length} Records`}
        customTable={printCustomTable}
        customSummary={printCustomSummary}
        receiverSignatureLabel="Store Manager / Incharge"
      />
    </>
  );
}
