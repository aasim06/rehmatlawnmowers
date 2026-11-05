import React, { useState, useMemo, Fragment, useEffect } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import CeoSignature from 'components/CeoSignature';

// material-ui
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Paper,
  Tooltip,
  Divider,
  IconButton
} from '@mui/material';

// icons
import {
  SearchOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  ReloadOutlined,
  DeleteOutlined,
  PrinterOutlined,
  DownloadOutlined,
  DatabaseOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

export default function UsageLogPage() {
  const { usageLogs, items, deleteMultipleLogs } = useStoreInventory();

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // All | IN | OUT
  const [selectedItem, setSelectedItem] = useState('All'); // All or specific item name
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState([]);

  // Pagination State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterType, selectedItem, startDate, endDate]);

  // Modals State
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // 1. Build Item Units Map
  const itemUnitMap = useMemo(() => {
    const map = {};
    (items || []).forEach((it) => {
      if (it.name) {
        map[it.name.trim().toLowerCase()] = it.unit || 'PCS';
      }
    });
    return map;
  }, [items]);

  // 2. Build Item List for Dropdown (Bin Card Selector)
  const uniqueItemOptions = useMemo(() => {
    const set = new Set();
    (items || []).forEach((it) => {
      if (it.name) set.add(it.name.trim());
    });
    (usageLogs || []).forEach((l) => {
      if (l.itemName) set.add(l.itemName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items, usageLogs]);

  // 3. Compute Chronological Running Balance for each log
  const itemRunningBalances = useMemo(() => {
    // Sort chronological: oldest first
    const chronological = [...usageLogs].sort(
      (a, b) => new Date(a.created_at || a.dateISO || 0) - new Date(b.created_at || b.dateISO || 0)
    );

    const balances = {};
    const stockMap = {};

    chronological.forEach((log) => {
      const key = (log.itemName || '').trim().toLowerCase();
      const isIN = (log.type || '').toUpperCase().includes('IN');
      const qty = parseFloat(log.qtyUsed) || 0;

      if (stockMap[key] === undefined) {
        stockMap[key] = 0;
      }

      if (isIN) {
        stockMap[key] += qty;
      } else {
        stockMap[key] = Math.max(0, stockMap[key] - qty);
      }

      const explicitValid =
        log.remainingStockAfter !== null &&
        log.remainingStockAfter !== undefined &&
        !isNaN(Number(log.remainingStockAfter));

      balances[log.id] = explicitValid ? Number(log.remainingStockAfter) : stockMap[key];
    });

    return balances;
  }, [usageLogs]);

  // 4. Filtered Logs
  const filteredLogs = useMemo(() => {
    return usageLogs.filter((log) => {
      // Item Dropdown Filter
      if (selectedItem !== 'All' && (log.itemName || '').trim().toLowerCase() !== selectedItem.trim().toLowerCase()) {
        return false;
      }

      // Movement Type Filter
      if (filterType === 'IN' && !(log.type || '').toUpperCase().includes('IN')) return false;
      if (filterType === 'OUT' && (log.type || '').toUpperCase().includes('IN')) return false;

      // Date Range Filter
      if (log.dateISO) {
        const logDay = log.dateISO.split('T')[0];
        if (startDate && logDay < startDate) return false;
        if (endDate && logDay > endDate) return false;
      }

      // Search Query Filter
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

  // 5. Overall Summary Metrics
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

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredLogs.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterType('All');
    setSelectedItem('All');
    setStartDate('');
    setEndDate('');
    setSelected([]);
  };

  // Bulk Delete Confirm Handler
  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleLogs(selected);
      setSelected([]);
    }
    setBulkDeleteDialogOpen(false);
  };

  // Export to CSV Function
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
      const voucher = log.biltyNo
        ? `Bill #${log.biltyNo}`
        : isIN
        ? `GRN-${(log.id || '').replace(/-/g, '').slice(0, 5).toUpperCase()}`
        : `ISS-${(log.id || '').replace(/-/g, '').slice(0, 5).toUpperCase()}`;

      return [
        `"${log.time || log.dateISO}"`,
        `"${voucher}"`,
        `"${log.itemName || ''}"`,
        `"${log.itemCode || ''}"`,
        `"${isIN ? 'INWARD' : 'OUTWARD'}"`,
        `"${log.usedBy || ''}"`,
        `"${log.department || ''}"`,
        isIN ? log.qtyUsed : 0,
        !isIN ? log.qtyUsed : 0,
        log.lineTotal || (log.qtyUsed * (log.unitPrice || 0)),
        `"${balance} ${unit}"`,
        `"${log.issuedBy || ''}"`,
        `"${(log.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rehmat_Store_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Format Voucher #
  const formatVoucher = (log) => {
    const isIN = (log.type || '').toUpperCase().includes('IN');
    if (log.biltyNo) {
      return { text: `Bill #${log.biltyNo}`, isBilty: true };
    }
    if (log.notes && log.notes.includes('Bill #')) {
      const match = log.notes.match(/Bill #([^\s(]+)/);
      if (match) return { text: `Bill #${match[1]}`, isBilty: true };
    }
    const short = (log.id || '').replace(/-/g, '').slice(0, 5).toUpperCase();
    return { text: isIN ? `GRN-${short}` : `ISS-${short}`, isBilty: false };
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Top Banner & Summary Cards */}
      <MainCard
        sx={{
          mb: 3,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderLeft: '5px solid #2563eb'
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h3" fontWeight={800} color="textPrimary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryOutlined style={{ color: '#2563eb' }} /> Store Ledger & History
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Official Stock Movement Register & Bin Card audit for raw materials, bearings, parts, and factory inventory.
            </Typography>
          </Grid>

          {/* 3 Key Metric Summary Cards */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
              {/* Inward Received */}
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4'),
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0'),
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" color="textSecondary" fontWeight={700} display="block">
                  TOTAL INWARD
                </Typography>
                <Typography variant="h5" fontWeight={800} color="success.main">
                  +{summary.totalInQty.toLocaleString()} Units
                </Typography>
                <Typography variant="caption" fontWeight={700} color="success.dark">
                  Rs. {summary.totalInVal.toLocaleString()}
                </Typography>
              </Box>

              {/* Outward Issued */}
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2'),
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'),
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" color="textSecondary" fontWeight={700} display="block">
                  TOTAL OUTWARD
                </Typography>
                <Typography variant="h5" fontWeight={800} color="error.main">
                  -{summary.totalOutQty.toLocaleString()} Units
                </Typography>
                <Typography variant="caption" fontWeight={700} color="error.dark">
                  Rs. {summary.totalOutVal.toLocaleString()}
                </Typography>
              </Box>

              {/* Net Movement */}
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.12)' : '#eff6ff'),
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.3)' : '#bfdbfe'),
                  textAlign: 'center'
                }}
              >
                <Typography variant="caption" color="textSecondary" fontWeight={700} display="block">
                  NET STOCK MOVEMENT
                </Typography>
                <Typography variant="h5" fontWeight={800} color="primary.main">
                  {summary.netQtyMovement >= 0 ? `+${summary.netQtyMovement.toLocaleString()}` : summary.netQtyMovement.toLocaleString()} Units
                </Typography>
                <Typography variant="caption" fontWeight={700} color="primary.dark">
                  Net: Rs. {summary.netValMovement.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </MainCard>

      {/* Main Table Card */}
      <MainCard
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DatabaseOutlined style={{ color: '#2563eb' }} />
            <span>Store Transaction Register</span>
            <Chip label={`${filteredLogs.length} Records`} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
            {selectedItem !== 'All' && (
              <Chip
                label={`Bin Card: ${selectedItem}`}
                size="small"
                color="info"
                onDelete={() => setSelectedItem('All')}
                sx={{ fontWeight: 700 }}
              />
            )}
          </Box>
        }
        secondary={
          <Stack direction="row" spacing={1} alignItems="center">
            {selected.length > 0 && (
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<DeleteOutlined />}
                onClick={() => setBulkDeleteDialogOpen(true)}
              >
                Delete Selected ({selected.length})
              </Button>
            )}
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<DownloadOutlined />}
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              sx={{ fontWeight: 600 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<PrinterOutlined />}
              onClick={() => setPrintModalOpen(true)}
              disabled={filteredLogs.length === 0}
              sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, fontWeight: 700 }}
            >
              Print Ledger
            </Button>
          </Stack>
        }
      >
        {/* Filter Controls Bar (Single Row Flexbox with Centered Aligned Inputs) */}
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Search Box */}
          <TextField
            size="small"
            label="Search Transactions"
            placeholder="Search item, SKU, party, bill #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: '1 1 240px',
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                height: 38,
                display: 'flex',
                alignItems: 'center',
                py: 0,
                '& input': {
                  height: '100%',
                  py: '0 !important',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  fontSize: '0.84rem'
                }
              },
              '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
                top: '50% !important',
                transform: 'translate(14px, -50%) scale(1) !important',
                lineHeight: '1rem !important'
              },
              '& .MuiInputLabel-shrink': {
                top: '0 !important',
                transform: 'translate(14px, -6px) scale(0.75) !important'
              }
            }}
            InputProps={{
              endAdornment: searchTerm ? (
                <InputAdornment position="end" sx={{ my: 'auto', display: 'flex', alignItems: 'center' }}>
                  <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                    <CloseCircleOutlined style={{ fontSize: '0.85rem', color: '#9ca3af' }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
          />

          {/* Item Selector (Searchable Autocomplete with hidden scrollbar) */}
          <Autocomplete
            size="small"
            options={uniqueItemOptions}
            value={selectedItem === 'All' ? null : selectedItem}
            onChange={(event, newValue) => {
              setSelectedItem(newValue || 'All');
            }}
            sx={{
              flex: '1 1 200px',
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                height: 38,
                display: 'flex',
                alignItems: 'center',
                py: 0,
                '& .MuiAutocomplete-input': {
                  height: '100%',
                  py: '0 !important',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  fontSize: '0.84rem'
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label="Filter by Specific Item"
                placeholder="All Items (Type to search...)"
                sx={{
                  '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': {
                    top: '50% !important',
                    transform: 'translate(14px, -50%) scale(1) !important',
                    lineHeight: '1rem !important'
                  },
                  '& .MuiInputLabel-shrink': {
                    top: '0 !important',
                    transform: 'translate(14px, -6px) scale(0.75) !important'
                  }
                }}
              />
            )}
            ListboxProps={{
              sx: {
                maxHeight: 220,
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                '&::-webkit-scrollbar': {
                  display: 'none',
                  width: 0,
                  height: 0
                }
              }
            }}
            slotProps={{
              paper: {
                sx: {
                  maxHeight: 220,
                  borderRadius: 1.5,
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08)',
                  mt: 0.5,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                    width: 0,
                    height: 0
                  },
                  '& .MuiAutocomplete-listbox': {
                    maxHeight: 220,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': {
                      display: 'none',
                      width: 0,
                      height: 0
                    },
                    '& .MuiAutocomplete-option': {
                      fontSize: '0.82rem',
                      py: 0.8
                    }
                  }
                }
              }
            }}
          />

          {/* Movement Type Filter */}
          <FormControl
            size="small"
            sx={{
              flex: '0 0 160px',
              minWidth: 140,
              '& .MuiOutlinedInput-root': {
                height: 38,
                display: 'flex',
                alignItems: 'center'
              },
              '& .MuiSelect-select': {
                display: 'flex',
                alignItems: 'center',
                py: '0 !important',
                height: '100%',
                fontSize: '0.84rem'
              },
              '& .MuiInputLabel-shrink': {
                top: '0 !important',
                transform: 'translate(14px, -6px) scale(0.75) !important'
              }
            }}
          >
            <InputLabel id="movement-type-label">Movement Type</InputLabel>
            <Select
              labelId="movement-type-label"
              value={filterType}
              label="Movement Type"
              onChange={(e) => setFilterType(e.target.value)}
              MenuProps={{
                PaperProps: {
                  sx: {
                    maxHeight: 220,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 },
                    '& .MuiList-root': {
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 }
                    }
                  }
                }
              }}
            >
              <MenuItem value="All">All Movements</MenuItem>
              <MenuItem value="IN">Inward</MenuItem>
              <MenuItem value="OUT">Outward</MenuItem>
            </Select>
          </FormControl>

          {/* Date Range: From */}
          <TextField
            label="From Date"
            type="date"
            size="small"
            sx={{
              flex: '0 0 135px',
              minWidth: 125,
              '& .MuiOutlinedInput-root': {
                height: 38,
                display: 'flex',
                alignItems: 'center',
                py: 0,
                '& input': {
                  height: '100%',
                  py: '0 !important',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  fontSize: '0.84rem'
                }
              },
              '& .MuiInputLabel-shrink': {
                top: '0 !important',
                transform: 'translate(14px, -6px) scale(0.75) !important'
              }
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          {/* Date Range: To */}
          <TextField
            label="To Date"
            type="date"
            size="small"
            sx={{
              flex: '0 0 135px',
              minWidth: 125,
              '& .MuiOutlinedInput-root': {
                height: 38,
                display: 'flex',
                alignItems: 'center',
                py: 0,
                '& input': {
                  height: '100%',
                  py: '0 !important',
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                  fontSize: '0.84rem'
                }
              },
              '& .MuiInputLabel-shrink': {
                top: '0 !important',
                transform: 'translate(14px, -6px) scale(0.75) !important'
              }
            }}
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          {/* Reset Filters Button */}
          {(searchTerm || filterType !== 'All' || selectedItem !== 'All' || startDate || endDate) && (
            <Tooltip title="Reset All Filters">
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={handleClearFilter}
                sx={{ height: 38, px: 1.5, minWidth: 40, fontWeight: 700 }}
                startIcon={<ReloadOutlined />}
              >
                Reset
              </Button>
            </Tooltip>
          )}
        </Box>

        {/* Ledger Table */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            width: '100%',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': { display: 'none', width: 0, height: 0 }
          }}
        >
          <Table size="small" sx={{ width: '100%' }}>
            <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fafafa') }}>
              <TableRow>
                <TableCell padding="checkbox" sx={{ py: 1, px: 1 }}>
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredLogs.length}
                    checked={filteredLogs.length > 0 && selected.length === filteredLogs.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><strong>DATE & TIME</strong></TableCell>
                <TableCell sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><strong>VOUCHER #</strong></TableCell>
                <TableCell sx={{ py: 1, px: 1 }}><strong>ITEM & SKU</strong></TableCell>
                <TableCell align="center" sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><strong>MOVEMENT</strong></TableCell>
                <TableCell sx={{ py: 1, px: 1 }}><strong>PARTY / OPERATOR</strong></TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><strong>IN QTY</strong></TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><strong>OUT QTY</strong></TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><strong>TOTAL AMOUNT</strong></TableCell>
                <TableCell align="right" sx={{ py: 1, px: 1, whiteSpace: 'nowrap' }}><strong>BALANCE</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" fontWeight={700} color="textSecondary">
                      No Store Ledger Records Found
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                      Try adjusting the date range, item filter, or search keywords.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((log) => {
                  const isIN = (log.type || '').toUpperCase().includes('IN');
                  const isLogSelected = isSelected(log.id);
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

                      {/* Date & Time */}
                      <TableCell sx={{ py: 0.75, px: 1, whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight={700}>
                          {log.time ? log.time.split(',')[0] : (log.dateISO ? new Date(log.dateISO).toLocaleDateString() : '-')}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                          {log.time && log.time.includes(',') ? log.time.split(',')[1].trim() : ''}
                        </Typography>
                      </TableCell>

                      {/* Voucher / Bill # */}
                      <TableCell sx={{ py: 0.75, px: 1, whiteSpace: 'nowrap' }}>
                        <Chip
                          label={voucher.text}
                          size="small"
                          color={voucher.isBilty ? 'primary' : isIN ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ fontWeight: 700, fontSize: '0.72rem', height: 22 }}
                        />
                      </TableCell>

                      {/* Item & SKU Code */}
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <Typography variant="subtitle2" fontWeight={800} color="textPrimary" noWrap>
                          {log.itemName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontFamily: 'monospace', display: 'block' }}>
                          {log.itemCode || 'SKU-N/A'}
                        </Typography>
                      </TableCell>

                      {/* Movement Type */}
                      <TableCell align="center" sx={{ py: 0.75, px: 1, whiteSpace: 'nowrap' }}>
                        <Chip
                          size="small"
                          label={isIN ? 'INWARD' : 'OUTWARD'}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.65rem',
                            height: 20,
                            bgcolor: isIN ? '#dcfce7' : '#fee2e2',
                            color: isIN ? '#15803d' : '#b91c1c',
                            border: `1px solid ${isIN ? '#86efac' : '#fca5a5'}`
                          }}
                        />
                      </TableCell>

                      {/* Party / Beneficiary */}
                      <TableCell sx={{ py: 0.75, px: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="textPrimary" noWrap>
                          {log.usedBy || (isIN ? 'Vendor Shipment' : 'Store Operator')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: isIN ? '#166534' : '#1e40af', fontWeight: 700, display: 'block' }}>
                          {isIN ? 'SUPPLIER' : 'ISSUED TO'}{log.department && log.department !== 'Store' && log.department !== 'Store Inward' ? ` (${log.department})` : ''}
                        </Typography>
                      </TableCell>

                      {/* IN QTY */}
                      <TableCell align="right" sx={{ py: 0.75, px: 1, whiteSpace: 'nowrap' }}>
                        {isIN ? (
                          <Typography variant="subtitle2" fontWeight={800} color="success.main">
                            +{log.qtyUsed}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>

                      {/* OUT QTY */}
                      <TableCell align="right" sx={{ py: 0.75, px: 1, whiteSpace: 'nowrap' }}>
                        {!isIN ? (
                          <Typography variant="subtitle2" fontWeight={800} color="error.main">
                            -{log.qtyUsed}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="textSecondary">-</Typography>
                        )}
                      </TableCell>

                      {/* Total Value */}
                      <TableCell align="right" sx={{ py: 0.75, px: 1, whiteSpace: 'nowrap' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="textPrimary">
                          {totalVal > 0 ? `Rs. ${totalVal.toLocaleString()}` : '-'}
                        </Typography>
                      </TableCell>

                      {/* Balance Stock */}
                      <TableCell align="right" sx={{ py: 0.75, px: 1, whiteSpace: 'nowrap' }}>
                        <Chip
                          size="small"
                          label={`${balanceQty} ${unit}`}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            height: 22,
                            bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff'),
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredLogs.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </MainCard>

      {/* Bulk Delete Modal */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Selected Logs Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{selected.length} selected transaction logs</strong> from the ledger? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} variant="contained" color="error">
            Delete Selected
          </Button>
        </DialogActions>
      </Dialog>

      {/* Printable Store Ledger Statement Modal */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
              }
              #root { display: none !important; }
              body * {
                visibility: hidden !important;
              }
              #printable-store-ledger, #printable-store-ledger * {
                visibility: visible !important;
              }
              #printable-store-ledger {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-sizing: border-box !important;
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
                background: #ffffff !important;
                width: 100% !important;
                max-width: 100% !important;
              }
              .MuiBackdrop-root,
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" fontWeight={800}>
            Print Store Inventory Ledger
          </Typography>
          <Button variant="contained" startIcon={<PrinterOutlined />} onClick={() => window.print()} sx={{ bgcolor: '#2563eb' }} className="no-print">
            Print Now
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 1, sm: 3 } }}>
          <Box
            id="printable-store-ledger"
            sx={{
              p: 2.5,
              bgcolor: '#ffffff',
              color: '#000000',
              fontFamily: 'Arial, sans-serif',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* Print Header */}
            <Box sx={{ borderBottom: '2px solid #0f172a', pb: 1.5, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '0.5px', color: '#0f172a', fontSize: '1.45rem', lineHeight: 1.1 }}>
                  REHMAT LAWN MOWERS
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <Typography variant="caption" fontWeight={800} display="block" color="#0f172a">
                  Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.2 }}>
                  Total Entries: <strong>{filteredLogs.length}</strong> Records
                </Typography>
              </Box>
            </Box>

            {/* Printable Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', marginBottom: '16px', tableLayout: 'auto' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #0f172a', textAlign: 'left' }}>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', width: '35px', textAlign: 'center', whiteSpace: 'nowrap' }}>Sr</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Date & Time</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>Voucher #</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1' }}>Item Specification / Name</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1' }}>Party / Operator</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', whiteSpace: 'nowrap' }}>IN Qty</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', whiteSpace: 'nowrap' }}>OUT Qty</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', whiteSpace: 'nowrap' }}>Total Amount</th>
                  <th style={{ padding: '7px 8px', border: '1px solid #cbd5e1', textAlign: 'right', whiteSpace: 'nowrap' }}>Balance</th>
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
                    <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700 }}>{log.dateISO ? new Date(log.dateISO).toLocaleDateString() : (log.time ? log.time.split(',')[0] : '-')}</div>
                        <div style={{ fontSize: '0.70rem', color: '#64748b' }}>{log.time && log.time.includes(',') ? log.time.split(',')[1].trim() : ''}</div>
                      </td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {voucher.text}
                      </td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{log.itemName}</div>
                        <div style={{ fontSize: '0.70rem', color: '#64748b', fontFamily: 'monospace' }}>{log.itemCode || 'SKU-N/A'}</div>
                      </td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>
                        <div style={{ fontWeight: 700 }}>{log.usedBy || (isIN ? 'Vendor Shipment' : 'Store Operator')}</div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, color: isIN ? '#047857' : '#1d4ed8' }}>
                          {isIN ? 'SUPPLIER' : 'ISSUED TO'}{log.department && log.department !== 'Store' && log.department !== 'Store Inward' ? ` (${log.department})` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>
                        {isIN ? `+${log.qtyUsed}` : '-'}
                      </td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 800, color: '#dc2626', whiteSpace: 'nowrap' }}>
                        {!isIN ? `-${log.qtyUsed}` : '-'}
                      </td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {totalVal > 0 ? `Rs. ${totalVal.toLocaleString()}` : '-'}
                      </td>
                      <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 800, color: '#1e40af', whiteSpace: 'nowrap' }}>
                        {balanceQty} {unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Print Summary Totals Box */}
            <Box sx={{ border: '1px solid #94a3b8', p: 1.5, borderRadius: 1, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
              <Box>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                  Total Inward Quantity: <span style={{ color: '#16a34a' }}>+{summary.totalInQty.toLocaleString()} Units</span> (Value: Rs. {summary.totalInVal.toLocaleString()})
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc2626', marginTop: '3px' }}>
                  Total Outward Quantity: -{summary.totalOutQty.toLocaleString()} Units (Value: Rs. {summary.totalOutVal.toLocaleString()})
                </div>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 900, color: '#1d4ed8' }}>
                  Net Movement: {summary.netQtyMovement >= 0 ? `+${summary.netQtyMovement.toLocaleString()}` : summary.netQtyMovement.toLocaleString()} Units
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginTop: '2px' }}>
                  Net Amount Value: Rs. {summary.netValMovement.toLocaleString()}
                </div>
              </Box>
            </Box>

            {/* Print Signatures Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pt: 1.5, mt: 1, width: '100%' }}>
              <div style={{ textAlign: 'left', width: '220px' }}>
                <div style={{ borderTop: '1px dashed #475569', paddingTop: '6px' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                    Store Manager / Incharge
                  </div>
                  <div style={{ fontSize: '0.70rem', color: '#64748b', marginTop: '2px' }}>
                    Verified Stock Movement
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <CeoSignature />
              </div>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="no-print" sx={{ p: 2, justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={() => setPrintModalOpen(false)} className="no-print">
            Close
          </Button>
          <Button variant="contained" startIcon={<PrinterOutlined />} onClick={() => window.print()} sx={{ bgcolor: '#2563eb' }} className="no-print">
            Print Document
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
