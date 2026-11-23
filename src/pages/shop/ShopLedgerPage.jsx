import React, { useState, useMemo, useEffect } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { useTheme } from '@mui/material/styles';

// material-ui
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
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

// components & icons
import MainCard from 'components/MainCard';
import CeoSignature from 'components/CeoSignature';

// ant design icons
import BookOutlined from '@ant-design/icons/BookOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';

// ==============================|| HELPER FUNCTIONS ||============================== //

// Extract normalized YYYY-MM-DD from any slip record
const getSlipDateString = (slip) => {
  if (slip.dateISO && typeof slip.dateISO === 'string') {
    const part = slip.dateISO.split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  if (slip.createdAt) {
    const d = new Date(slip.createdAt);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  const rawDate = slip.date || slip.time;
  if (rawDate && typeof rawDate === 'string') {
    const isoMatch = rawDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const cleaned = rawDate.split(',')[0].trim();
    const parsed = Date.parse(cleaned);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  return '';
};

// Check if slip is within [startDate, endDate] range
const isSlipInDateRange = (slip, start, end) => {
  if (!start && !end) return true;
  const slipDay = getSlipDateString(slip);
  if (!slipDay) return true;
  if (start && slipDay < start) return false;
  if (end && slipDay > end) return false;
  return true;
};

// Safely normalize slip items for hierarchical ledger table
const normalizeSlipItems = (slip) => {
  if (Array.isArray(slip.items) && slip.items.length > 0) {
    return slip.items.map((it) => {
      const name = it.name || it.itemName || it.title || 'Item';
      const qty = parseInt(it.qty ?? it.quantity ?? 1, 10) || 1;
      let rate = parseFloat(it.unitPrice ?? it.rate ?? it.price ?? 0) || 0;
      let amount = parseFloat(it.lineTotal ?? it.amount ?? 0);
      if (!amount && rate > 0) {
        amount = qty * rate;
      } else if (amount > 0 && !rate && qty > 0) {
        rate = amount / qty;
      }
      return { name, qty, rate, amount };
    });
  }
  const totalVal = parseFloat(slip.totalAmount) || 0;
  return [
    {
      name: slip.machineName || slip.notes || 'Material Parts',
      qty: 1,
      rate: totalVal,
      amount: totalVal
    }
  ];
};

// ==============================|| SHOP MATERIAL ISSUE LEDGER ||============================== //

export default function ShopLedgerPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    shopSales = [],
    resetShopDataToZero,
    deleteShopSale,
    deleteMachineSale,
    deleteMultipleShopSales,
    deleteMultipleMachineSales
  } = useStoreInventory();

  // Search & Date Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedPerson, setExpandedPerson] = useState(null);

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
  }, [searchTerm, startDate, endDate]);

  // Toast / Feedback State
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  // Delete State
  const [personToDelete, setPersonToDelete] = useState(null);
  const [deletePersonModalOpen, setDeletePersonModalOpen] = useState(false);

  const [slipToDelete, setSlipToDelete] = useState(null);
  const [deleteSlipModalOpen, setDeleteSlipModalOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);

  // Factory Reset Dialog State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetShopData = async () => {
    if (!resetShopDataToZero) return;
    setResetting(true);
    await resetShopDataToZero();
    setResetting(false);
    setResetConfirmOpen(false);
    showToast('Shop data has been reset to 0.', 'info');
  };

  // Print Statement Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Quick Date Presets
  const getTodayISO = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const setFilterToday = () => {
    const today = getTodayISO();
    setStartDate(today);
    setEndDate(today);
  };

  const setFilterPast7Days = () => {
    const now = new Date();
    const end = getTodayISO();
    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const y = past.getFullYear();
    const m = String(past.getMonth() + 1).padStart(2, '0');
    const d = String(past.getDate()).padStart(2, '0');
    setStartDate(`${y}-${m}-${d}`);
    setEndDate(end);
  };

  const setFilterThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const start = `${y}-${m}-01`;
    const end = getTodayISO();
    setStartDate(start);
    setEndDate(end);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const todayStr = useMemo(() => getTodayISO(), []);
  const isTodaySelected = startDate === todayStr && endDate === todayStr;

  // Group Shop Issues by Person Name (Recipient), filtered by Date Range
  const personLedgers = useMemo(() => {
    const personMap = {};

    shopSales.forEach((slip) => {
      // Date Range Filtering
      if (!isSlipInDateRange(slip, startDate, endDate)) {
        return;
      }

      const rawName = (slip.customerName || slip.customer || slip.issuedTo || 'Factory Staff').trim();
      const personKey = rawName.toLowerCase();

      if (!personMap[personKey]) {
        personMap[personKey] = {
          key: personKey,
          personName: rawName,
          phoneOrDept: slip.customerPhone || slip.phone || slip.department || 'Factory Floor',
          slips: [],
          totalSlips: 0,
          totalItemsCount: 0,
          totalValue: 0
        };
      }

      if (slip.customerPhone || slip.phone || slip.department) {
        personMap[personKey].phoneOrDept = slip.customerPhone || slip.phone || slip.department;
      }

      const totalVal = parseFloat(slip.totalAmount) || 0;
      const itemsCount = (slip.items || []).reduce((sum, it) => sum + (parseInt(it.qty, 10) || 1), 0);

      personMap[personKey].slips.push(slip);
      personMap[personKey].totalSlips += 1;
      personMap[personKey].totalItemsCount += itemsCount;
      personMap[personKey].totalValue += totalVal;
    });

    return Object.values(personMap).sort((a, b) => b.totalValue - a.totalValue);
  }, [shopSales, startDate, endDate]);

  // Filtered Persons (by Search Term)
  const filteredPersons = useMemo(() => {
    return personLedgers.filter((p) => {
      const term = searchTerm.toLowerCase();
      return (
        p.personName.toLowerCase().includes(term) ||
        p.phoneOrDept.toLowerCase().includes(term)
      );
    });
  }, [personLedgers, searchTerm]);

  // Overall KPIs (calculated over filtered date range)
  const kpiData = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    let totalSlips = 0;

    personLedgers.forEach((p) => {
      totalValue += p.totalValue;
      totalItems += p.totalItemsCount;
      totalSlips += p.totalSlips;
    });

    return {
      totalPersons: personLedgers.length,
      totalSlips,
      totalItems,
      totalValue
    };
  }, [personLedgers]);

  // Open Print Statement Modal
  const handleOpenPrintStatement = (person) => {
    setPrintData(person);
    setPrintModalOpen(true);
  };

  // Delete Handlers
  const handleConfirmDeletePerson = async () => {
    if (!personToDelete || !personToDelete.slips) return;
    setDeleting(true);
    try {
      const ids = personToDelete.slips.map((s) => s.id).filter(Boolean);
      if (ids.length > 0) {
        const delMulti = deleteMultipleShopSales || deleteMultipleMachineSales;
        if (typeof delMulti === 'function') {
          await delMulti(ids);
        } else {
          const delSingle = deleteShopSale || deleteMachineSale;
          if (typeof delSingle === 'function') {
            await Promise.allSettled(ids.map((id) => delSingle(id)));
          }
        }
      }
      showToast(`Records for "${personToDelete.personName}" deleted successfully!`);
      setDeletePersonModalOpen(false);
      setPersonToDelete(null);
    } catch (err) {
      console.error('Delete person ledger error:', err);
      showToast('Failed to delete records', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDeleteSlip = async () => {
    if (!slipToDelete) return;
    setDeleting(true);
    try {
      const slipId = slipToDelete.id;
      const delSingle = deleteShopSale || deleteMachineSale;
      if (typeof delSingle === 'function') {
        await delSingle(slipId);
      }
      showToast(`Slip #${slipToDelete.invoiceNo || slipToDelete.saleNo || slipToDelete.id} deleted successfully!`);
      setDeleteSlipModalOpen(false);
      setSlipToDelete(null);
    } catch (err) {
      console.error('Delete slip error:', err);
      showToast('Failed to delete slip', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* 1. Header Banner */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: 'primary.lighter', color: 'primary.main', p: 1, borderRadius: 2, display: 'flex' }}>
            <BookOutlined style={{ fontSize: '1.4rem' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -0.3 }}>
              Shop Customer Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track factory workers, technicians &amp; staff issue history, filter by date range, and print statements.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlined />}
          onClick={() => setResetConfirmOpen(true)}
          sx={{ fontWeight: 800, borderRadius: 1.5, height: 36, px: 2, fontSize: '0.8rem' }}
        >
          Factory Reset (0)
        </Button>
      </Box>

      {/* 2. Top Metric KPI Cards - 4 Columns Across Full Width */}
      <Grid container spacing={2.5} sx={{ mb: 3.5, width: '100%' }}>
        {/* Total Persons */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #1677ff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Staff / Persons
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ mt: 0.5, color: '#1677ff' }}>
                  {kpiData.totalPersons}
                </Typography>
              </Box>
              <Box sx={{ color: '#1677ff', display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Issue Slips */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #005F56' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Issue Slips
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ mt: 0.5, color: '#005F56' }}>
                  {kpiData.totalSlips}
                </Typography>
              </Box>
              <Box sx={{ color: '#005F56', display: 'flex', alignItems: 'center' }}>
                <FileTextOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Items Issued */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #fa8c16' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Items Issued
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ mt: 0.5, color: '#d46b08' }}>
                  {kpiData.totalItems}
                </Typography>
              </Box>
              <Box sx={{ color: '#fa8c16', display: 'flex', alignItems: 'center' }}>
                <AppstoreOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Value Issued */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #52c41a' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Issued Value
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, color: '#389e0d' }}>
                  Rs. {kpiData.totalValue.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ color: '#52c41a', display: 'flex', alignItems: 'center' }}>
                <DollarOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>
      </Grid>

      {/* 3. Filter & Date Range Bar */}
      <MainCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              placeholder="Search by Person Name, Department, or Phone..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined style={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>

          {/* From Date */}
          <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true }
              }}
              sx={{
                '& .MuiInputBase-root': { height: 38 }
              }}
            />
          </Grid>

          {/* To Date */}
          <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
            <TextField
              label="To Date"
              type="date"
              size="small"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true }
              }}
              sx={{
                '& .MuiInputBase-root': { height: 38 }
              }}
            />
          </Grid>

          {/* Reset Filters Button */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            {(searchTerm || startDate || endDate) ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<ReloadOutlined />}
                onClick={handleResetFilters}
                fullWidth
                sx={{ height: 38, fontWeight: 700, borderRadius: 1.5 }}
              >
                Reset
              </Button>
            ) : null}
          </Grid>
        </Grid>

        {/* Quick Date Presets Bar */}
        <Box sx={{ mt: 1.75, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
            Quick Range:
          </Typography>
          <Chip
            label="All Time"
            size="small"
            clickable
            color={!startDate && !endDate ? 'primary' : 'default'}
            variant={!startDate && !endDate ? 'filled' : 'outlined'}
            onClick={() => { setStartDate(''); setEndDate(''); }}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />
          <Chip
            label="Today"
            size="small"
            clickable
            color={isTodaySelected ? 'primary' : 'default'}
            variant={isTodaySelected ? 'filled' : 'outlined'}
            onClick={setFilterToday}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />
          <Chip
            label="Past 7 Days"
            size="small"
            clickable
            variant="outlined"
            onClick={setFilterPast7Days}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />
          <Chip
            label="This Month"
            size="small"
            clickable
            variant="outlined"
            onClick={setFilterThisMonth}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />

          {(startDate || endDate) && (
            <Chip
              label={`Records: ${startDate || 'Start'} → ${endDate || 'Today'}`}
              size="small"
              color="info"
              sx={{ fontWeight: 800, height: 26, ml: 'auto' }}
            />
          )}
        </Box>
      </MainCard>

      {/* 4. Person / Staff Issue Table */}
      <MainCard content={false} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'background.neutral' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ fontWeight: 800 }}>Person / Staff Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Dept / Machine / Phone</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Total Slips</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Total Items Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Total Value</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, width: 220 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPersons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <BookOutlined style={{ fontSize: '2.5rem', color: '#94a3b8', display: 'block', margin: '0 auto 12px' }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No issue records found.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {startDate || endDate
                        ? 'No records match the selected date range. Try expanding your date filter.'
                        : 'When staff takes items from Shop Mart, their records will automatically appear here.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersons
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((person) => {
                    const isExpanded = expandedPerson === person.key;

                    return (
                      <React.Fragment key={person.key}>
                        <TableRow
                          hover
                          sx={{
                            cursor: 'pointer',
                            bgcolor: isExpanded ? (isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9') : 'inherit'
                          }}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => setExpandedPerson(isExpanded ? null : person.key)}
                            >
                              {isExpanded ? <UpOutlined style={{ fontSize: '0.8rem' }} /> : <DownOutlined style={{ fontSize: '0.8rem' }} />}
                            </IconButton>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                              {person.personName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {person.phoneOrDept}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`${person.totalSlips} Slips`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`${person.totalItemsCount} Pcs`} color="info" size="small" sx={{ fontWeight: 800 }} />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" fontWeight={800} color="#005F56">
                              Rs. {person.totalValue.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                              <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                startIcon={<PrinterOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenPrintStatement(person);
                                }}
                                sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                              >
                                Print Statement
                              </Button>

                              <Tooltip title={`Delete ${person.personName} Record`}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPersonToDelete(person);
                                    setDeletePersonModalOpen(true);
                                  }}
                                  sx={{
                                    bgcolor: isDark ? 'rgba(255, 77, 79, 0.15)' : '#fff1f0',
                                    border: '1px solid rgba(255, 77, 79, 0.3)',
                                    borderRadius: 1.5,
                                    p: 0.75,
                                    '&:hover': { bgcolor: '#ff4d4f', color: '#fff' }
                                  }}
                                >
                                  <DeleteOutlined style={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>

                        {/* Expanded History Row */}
                        <TableRow>
                          <TableCell colSpan={7} sx={{ py: 0, bgcolor: isDark ? 'background.default' : '#f8fafc' }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2.5 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <FileTextOutlined /> All Material Issue Slips for: {person.personName}
                                </Typography>
                                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                  <Table size="small">
                                    <TableHead sx={{ bgcolor: isDark ? 'background.paper' : '#ffffff', borderBottom: '1.5px solid #e2e8f0' }}>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 50, color: 'text.secondary' }}>Sr</TableCell>
                                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>Item</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 80, color: 'text.secondary' }}>Qty</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 110, color: 'text.secondary' }}>Rate</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 110, color: 'text.secondary' }}>Amount</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 60, color: 'text.secondary' }}>Action</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {person.slips.map((s, sIdx) => {
                                        const slipItems = normalizeSlipItems(s);
                                        return (
                                          <React.Fragment key={s.id || s.invoiceNo || sIdx}>
                                            <TableRow sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                              <TableCell colSpan={5} sx={{ py: 1, px: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.84rem', color: '#096dd9' }}>
                                                      {s.invoiceNo || s.saleNo || 'SLIP'}
                                                    </Typography>
                                                    <Typography component="span" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                      {s.date || s.time || 'N/A'}
                                                    </Typography>
                                                  </Box>
                                                  <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.86rem', color: 'text.primary' }}>
                                                    Rs. {(parseFloat(s.totalAmount) || 0).toLocaleString()}
                                                  </Typography>
                                                </Box>
                                              </TableCell>
                                              <TableCell align="center" sx={{ py: 0.5 }}>
                                                <Tooltip title="Delete this issue slip">
                                                  <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSlipToDelete(s);
                                                      setDeleteSlipModalOpen(true);
                                                    }}
                                                    sx={{
                                                      bgcolor: isDark ? 'rgba(255, 77, 79, 0.15)' : '#fff1f0',
                                                      p: 0.5,
                                                      '&:hover': { bgcolor: '#ff4d4f', color: '#fff' }
                                                    }}
                                                  >
                                                    <DeleteOutlined style={{ fontSize: 13 }} />
                                                  </IconButton>
                                                </Tooltip>
                                              </TableCell>
                                            </TableRow>
                                            {slipItems.map((item, itemIdx) => (
                                              <TableRow key={itemIdx} sx={{ borderBottom: '1px solid #f1f5f9', '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fafafa' } }}>
                                                <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', pl: 2 }}>{itemIdx + 1}</TableCell>
                                                <TableCell sx={{ fontSize: '0.82rem', fontWeight: 500 }}>{item.name}</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{item.qty}</TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                                                  {item.rate > 0 ? item.rate.toLocaleString() : '-'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                  {item.amount.toLocaleString()}
                                                </TableCell>
                                                <TableCell />
                                              </TableRow>
                                            ))}
                                          </React.Fragment>
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
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredPersons.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </MainCard>

      {/* 5. PRINT OFFICIAL PERSON ISSUE STATEMENT DIALOG */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
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
              #printable-person-statement, #printable-person-statement * {
                visibility: visible !important;
              }
              #printable-person-statement {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 10px !important;
                margin: 0 !important;
              }
              .no-print,
              button,
              .MuiDialogActions-root,
              .MuiDialogTitle-root {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={800}>
            Staff Material Issue Statement
          </Typography>
          <IconButton size="small" onClick={() => setPrintModalOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {printData && (
            <Box id="printable-person-statement" sx={{ bgcolor: '#fff', color: '#111827', p: 3, borderRadius: 1 }}>
              {/* Header: Company Name */}
              <Box sx={{ borderBottom: '2.5px solid #005F56', pb: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#005F56', letterSpacing: -0.5 }}>
                      REHMAT LAWN MOWERS
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mt: 0.25 }}>
                      Factory Store &amp; Workshop • Internal Material Issue Statement
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Workshop Counter • Ph: 03154630026
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#096dd9' }}>
                      STAFF ISSUE LEDGER
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                      Date: {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                    {startDate || endDate ? (
                      <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 800, display: 'block', mt: 0.25 }}>
                        Period: {startDate || 'Start'} to {endDate || 'Present'}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                        Period: All Time Records
                      </Typography>
                    )}
                    <Chip label="Factory Issue" size="small" color="primary" sx={{ fontWeight: 800, mt: 0.5 }} />
                  </Box>
                </Box>
              </Box>

              {/* Person Info Card */}
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Issued To / Receiver Name
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.25 }}>
                      {printData.personName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Department / Machine / Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.25 }}>
                      {printData.phoneOrDept}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Slips Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#005F56', mb: 1, textTransform: 'uppercase' }}>
                Issued Items Breakdown
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <th style={{ width: '6%', padding: '8px 10px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Sr</th>
                    <th style={{ width: '48%', padding: '8px 10px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Item</th>
                    <th style={{ width: '12%', padding: '8px 10px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Qty</th>
                    <th style={{ width: '17%', padding: '8px 10px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Rate</th>
                    <th style={{ width: '17%', padding: '8px 10px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.slips.map((s, slipIdx) => {
                    const slipItems = normalizeSlipItems(s);
                    return (
                      <React.Fragment key={s.id || s.invoiceNo || slipIdx}>
                        {/* Slip Header Bar */}
                        <tr style={{ backgroundColor: '#f8fafc', borderTop: slipIdx > 0 ? '1px solid #e2e8f0' : 'none', borderBottom: '1px solid #e2e8f0' }}>
                          <td colSpan={5} style={{ padding: '7px 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ color: '#096dd9', fontWeight: 800, fontSize: '0.85rem', marginRight: '16px' }}>
                                  {s.invoiceNo || s.saleNo || 'SLIP'}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
                                  {s.date || s.time || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
                                  Rs. {(parseFloat(s.totalAmount) || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {/* Slip Items */}
                        {slipItems.map((item, itemIdx) => (
                          <tr key={itemIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '7px 10px', fontSize: '0.82rem', color: '#475569' }}>
                              {itemIdx + 1}
                            </td>
                            <td style={{ padding: '7px 10px', fontSize: '0.83rem', fontWeight: 500, color: '#1e293b' }}>
                              {item.name}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '0.83rem', fontWeight: 700, color: '#0f172a' }}>
                              {item.qty}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '0.83rem', color: '#334155' }}>
                              {item.rate > 0 ? item.rate.toLocaleString() : '-'}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '0.83rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #005F56' }}>
                    <td colSpan={4} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                      TOTAL MATERIAL VALUE:
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: '#005F56' }}>
                      Rs. {printData.totalValue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ borderTop: '1px solid #94a3b8', pt: 1, width: 200, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Receiver / Staff Signature
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                    <CeoSignature />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="no-print" sx={{ p: 2 }}>
          <Button onClick={() => setPrintModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            sx={{ fontWeight: 800, px: 3 }}
          >
            Print Issue Statement
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. CONFIRM DELETE PERSON LEDGER MODAL */}
      <Dialog
        open={deletePersonModalOpen}
        onClose={() => !deleting && setDeletePersonModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 480 } } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlined /> Delete Customer / Staff Record?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to delete all material issue records for{' '}
            <strong style={{ color: '#1677ff' }}>{personToDelete?.personName}</strong>?
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: isDark ? 'background.neutral' : '#fff1f0', borderRadius: 1.5, border: '1px solid #ffccc7' }}>
            <Typography variant="body2" color="error.dark" fontWeight={700}>
              • Total Slips to delete: {personToDelete?.slips?.length || 0}
            </Typography>
            <Typography variant="body2" color="error.dark" fontWeight={700} sx={{ mt: 0.5 }}>
              • Total Value: Rs. {(personToDelete?.totalValue || 0).toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              This will permanently delete all issue slips for this person from store records.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeletePersonModalOpen(false)} color="inherit" disabled={deleting} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeletePerson}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ fontWeight: 800, borderRadius: 1.5, px: 3 }}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete All Records'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 7. CONFIRM DELETE INDIVIDUAL SLIP MODAL */}
      <Dialog
        open={deleteSlipModalOpen}
        onClose={() => !deleting && setDeleteSlipModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 440 } } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlined /> Delete Issue Slip?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1 }}>
            Are you sure you want to delete Slip{' '}
            <strong style={{ color: '#1677ff' }}>#{slipToDelete?.invoiceNo || slipToDelete?.saleNo || slipToDelete?.id}</strong>?
          </Typography>
          <Box sx={{ mt: 2, p: 1.5, bgcolor: isDark ? 'background.neutral' : '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
            <Typography variant="body2" fontWeight={700} color="text.secondary">
              Date: {slipToDelete?.date || slipToDelete?.time || 'N/A'}
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} color="#005F56" sx={{ mt: 0.5 }}>
              Amount: Rs. {(parseFloat(slipToDelete?.totalAmount) || 0).toLocaleString()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteSlipModalOpen(false)} color="inherit" disabled={deleting} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteSlip}
            color="error"
            variant="contained"
            disabled={deleting}
            sx={{ fontWeight: 800, borderRadius: 1.5, px: 3 }}
          >
            {deleting ? 'Deleting...' : 'Yes, Delete Slip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 8. CONFIRM FACTORY RESET DIALOG */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 500 } } }}>
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main' }}>
          Confirm Factory Reset Shop Data?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to wipe all Shop inventory items, issue history, and sales slips? This action will set all shop ledger metrics to 0 for a completely fresh start.
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

      {/* 9. TOAST NOTIFICATION SNACKBAR */}
      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%', fontWeight: 700 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
