import { useState, useMemo, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
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

// project imports
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { DEFAULT_EXPENSE_CATEGORIES, getLocalDateISO } from 'context/modules/useExpensesModule';
import CashInHandDialog from 'components/expenses/CashInHandDialog';
import ExpensePrintDialog from 'components/expenses/ExpensePrintDialog';
import { EXPENSE_PERIOD_OPTIONS, describeExpensePeriod, isDateInExpensePeriod } from 'utils/expenseHelpers';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx } from 'utils/themeSurface';

// assets
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import ClearOutlined from '@ant-design/icons/ClearOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';

import { AppButton } from 'components/common';

const QUICK_EXPENSE_SUGGESTIONS = [
  'Daily Workshop Staff Lunch & Tea',
  'Generator Petrol / Diesel',
  'Electricity Commercial Bill',
  'Lathe Tool Bit & Grinding Discs',
  'Daily Wages / Overtime Labor',
  'Shop Hardware, Oil & Cleaners',
  'Stationery, Bill Books & Tape'
];

const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Cheque'];

const CATEGORY_BADGE_COLORS = {
  'Tea & Refreshment': { lightBg: '#fef3c7', lightText: '#b45309', darkBg: 'rgba(245, 158, 11, 0.2)', darkText: '#fbbf24' },
  'Fuel & Transport': { lightBg: '#fee2e2', lightText: '#b91c1c', darkBg: 'rgba(239, 68, 68, 0.2)', darkText: '#f87171' },
  'Utilities & Bills': { lightBg: '#dbeafe', lightText: '#1d4ed8', darkBg: 'rgba(59, 130, 246, 0.2)', darkText: '#60a5fa' },
  'Staff Wages & Labor': { lightBg: '#e0e7ff', lightText: '#4338ca', darkBg: 'rgba(99, 102, 241, 0.2)', darkText: '#818cf8' },
  default: { lightBg: '#f1f5f9', lightText: '#475569', darkBg: 'rgba(255, 255, 255, 0.1)', darkText: '#e2e8f0' }
};

const tableHeadCellSx = getTableHeadCellSx();

export default function ExpensesPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    expenses = [],
    expenseFunds = [],
    addExpense,
    deleteExpense,
    addExpenseFund,
    updateExpenseFund,
    deleteExpenseFund,
    expenseCategories = DEFAULT_EXPENSE_CATEGORIES,
    addExpenseCategory,
    deleteExpenseCategory
  } = useStoreInventory();

  const todayStr = getLocalDateISO();
  const currentMonthStr = todayStr.substring(0, 7);

  // Unified Period & Filter State ('today', 'week', 'fortnight', 'month', 'custom', 'all')
  const [dateFilter, setDateFilter] = useState('today');
  const [customFromDate, setCustomFromDate] = useState(todayStr);
  const [customToDate, setCustomToDate] = useState(todayStr);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(expenseCategories[0] || 'Tea & Refreshment');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  // Cash in Hand Dialog & Drawer State
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [showFundsTable, setShowFundsTable] = useState(true);

  // Add Custom Category Modal State
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Table Selection, Search & Category Filter
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Print Dialog
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedExpenseForPrint, setSelectedExpenseForPrint] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedCategory, dateFilter, customFromDate, customToDate]);

  const periodParams = useMemo(
    () => ({
      period: dateFilter,
      todayStr,
      fromDate: customFromDate,
      toDate: customToDate
    }),
    [dateFilter, todayStr, customFromDate, customToDate]
  );

  const periodInfo = useMemo(() => describeExpensePeriod(periodParams), [periodParams]);

  // Period-filtered Cash in Hand & Expenses (used consistently across KPIs, Table Closing & Print)
  const periodFunds = useMemo(
    () => expenseFunds.filter((f) => isDateInExpensePeriod(f.fundDate, periodParams)),
    [expenseFunds, periodParams]
  );

  const periodExpenses = useMemo(
    () => expenses.filter((e) => isDateInExpensePeriod(e.expenseDate, periodParams)),
    [expenses, periodParams]
  );

  const filteredExpenses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return periodExpenses.filter((e) => {
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;
      if (q) {
        const matchesTitle = (e.title || '').toLowerCase().includes(q);
        const matchesPaidTo = (e.paidTo || '').toLowerCase().includes(q);
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesPaidTo && !matchesNotes) return false;
      }
      return true;
    });
  }, [periodExpenses, selectedCategory, searchQuery]);

  // Financial Aggregations
  const financials = useMemo(() => {
    const periodCashTotal = periodFunds.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    const periodExpensesTotal = periodExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const filteredExpensesTotal = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const periodRemainingBalance = periodCashTotal - periodExpensesTotal;

    const allTimeCashTotal = expenseFunds.reduce((sum, f) => sum + (parseFloat(f.amount) || 0), 0);
    const allTimeExpensesTotal = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const allTimeRemainingBalance = allTimeCashTotal - allTimeExpensesTotal;
    const monthExpensesTotal = expenses
      .filter((e) => (e.expenseDate || '').startsWith(currentMonthStr))
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    return {
      periodCashTotal,
      periodExpensesTotal,
      filteredExpensesTotal,
      periodRemainingBalance,
      allTimeCashTotal,
      allTimeExpensesTotal,
      allTimeRemainingBalance,
      monthExpensesTotal
    };
  }, [periodFunds, periodExpenses, filteredExpenses, expenseFunds, expenses, currentMonthStr]);

  const draftAmountVal = parseFloat(amount) || 0;
  const projectedBalanceAfterDraft = financials.periodRemainingBalance - draftAmountVal;
  const isSubFiltered = Boolean(searchQuery.trim()) || selectedCategory !== 'All';
  const isPeriodDeficit = financials.periodRemainingBalance < 0;
  const isAllTimeDeficit = financials.allTimeRemainingBalance < 0;

  // Handlers
  const handleSaveNewCategory = (e) => {
    if (e) e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setCategoryError('Please enter a category name');
      return;
    }
    if (expenseCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('Category with this name already exists');
      return;
    }
    if (addExpenseCategory) addExpenseCategory(trimmed);
    setCategory(trimmed);
    setNewCategoryName('');
    setCategoryError('');
    setAddCategoryOpen(false);
  };

  const handleDeleteCategory = (catToDelete) => {
    if (window.confirm(`Are you sure you want to delete category "${catToDelete}"?`)) {
      if (deleteExpenseCategory) deleteExpenseCategory(catToDelete);
      if (category === catToDelete) {
        setCategory(expenseCategories.find((c) => c !== catToDelete) || 'Miscellaneous & Others');
      }
    }
  };

  const handleClearForm = () => {
    setTitle('');
    setAmount('');
    setPaidTo('');
    setNotes('');
    setCategory(expenseCategories[0] || 'Tea & Refreshment');
    setPaymentMethod('Cash');
    setExpenseDate(todayStr);
  };

  const handleAddExpense = async (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid expense title and amount');
      return;
    }

    await addExpense({
      title: title.trim(),
      category,
      amount: parseFloat(amount),
      paymentMethod,
      paidTo: paidTo.trim() || 'N/A',
      expenseDate,
      notes: notes.trim()
    });
    handleClearForm();
  };

  const handleSaveCashFund = async (fundPayload, existingId) => {
    if (existingId && updateExpenseFund) {
      await updateExpenseFund(existingId, fundPayload);
    } else if (addExpenseFund) {
      await addExpenseFund(fundPayload);
    }
    setEditingFund(null);
  };

  const handleSelectAllClick = (event) => {
    setSelected(event.target.checked ? filteredExpenses.map((n) => n.id) : []);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    if (selectedIndex === -1) {
      setSelected([...selected, id]);
    } else {
      setSelected(selected.filter((item) => item !== id));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} selected expense records?`)) {
      selected.forEach((id) => deleteExpense(id));
      setSelected([]);
    }
  };

  const handleOpenPrint = (expenseItem = null) => {
    setSelectedExpenseForPrint(expenseItem);
    setPrintOpen(true);
  };

  return (
    <Stack spacing={3}>
      {/* 1. PERIOD SELECTOR BAR + QUICK CASH IN HAND ACTION */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { px: { xs: 2, sm: 2.5 }, py: 1.75 })}>
        <Stack direction={{ xs: 'column', lg: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', lg: 'center' }} spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', p: 0.5, borderRadius: 2, gap: 0.5, flexWrap: 'wrap' })}>
              {EXPENSE_PERIOD_OPTIONS.map((tab) => {
                const isActive = dateFilter === tab.key;
                return (
                  <Box
                    key={tab.key}
                    component="button"
                    type="button"
                    onClick={() => setDateFilter(tab.key)}
                    sx={{
                      border: 0,
                      px: 1.5,
                      py: 0.65,
                      borderRadius: 1.5,
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      bgcolor: isActive ? 'background.paper' : 'transparent',
                      color: isActive ? 'primary.main' : 'text.secondary',
                      boxShadow: isActive ? theme.shadows[1] : 'none'
                    }}
                  >
                    {tab.label}
                  </Box>
                );
              })}
            </Box>

            <Chip label={periodInfo.rangeText} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />

            {dateFilter === 'custom' && (
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  type="date"
                  size="small"
                  label="From"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
                <TextField
                  type="date"
                  size="small"
                  label="To"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: 150 }}
                />
              </Stack>
            )}
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
            <AppButton
              intent="primary"
              startIcon={<WalletOutlined />}
              onClick={() => {
                setEditingFund(null);
                setFundDialogOpen(true);
              }}
              sx={{
                bgcolor: '#059669',
                '&:hover': { bgcolor: '#047857' }
              }}
            >
              + Add Cash in Hand
            </AppButton>
            <AppButton intent="secondary" startIcon={<PrinterOutlined />} onClick={() => handleOpenPrint(null)}>
              Print Closing Sheet
            </AppButton>
          </Stack>
        </Stack>
      </MainCard>

      {/* 2. TOP 4 FINANCIAL KPI STATS CARDS */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title={`CASH IN HAND (${periodInfo.shortLabel.toUpperCase()})`}
            count={`PKR ${financials.periodCashTotal.toLocaleString()}`}
            extra={`${periodFunds.length} cash receipt${periodFunds.length !== 1 ? 's' : ''} added`}
            color="success"
            accentColor="#10b981"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title={`EXPENSES (${periodInfo.shortLabel.toUpperCase()})`}
            count={`PKR ${financials.periodExpensesTotal.toLocaleString()}`}
            extra={`${periodExpenses.length} voucher${periodExpenses.length !== 1 ? 's' : ''} spent`}
            color="error"
            accentColor="#ef4444"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title={`REMAINING BALANCE (${periodInfo.shortLabel.toUpperCase()})`}
            count={`PKR ${financials.periodRemainingBalance.toLocaleString()}`}
            extra={isPeriodDeficit ? 'Shortfall / Extra Paid' : 'Closing Cash in Hand (Baqaya)'}
            color={isPeriodDeficit ? 'error' : 'primary'}
            accentColor={isPeriodDeficit ? '#dc2626' : '#1677ff'}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="OVERALL NET CASH (ALL TIME)"
            count={`PKR ${financials.allTimeRemainingBalance.toLocaleString()}`}
            extra={
              isAllTimeDeficit
                ? `Month Exp: PKR ${financials.monthExpensesTotal.toLocaleString()}`
                : `Total In: ${financials.allTimeCashTotal.toLocaleString()} • Month Exp: ${financials.monthExpensesTotal.toLocaleString()}`
            }
            color={isAllTimeDeficit ? 'warning' : 'success'}
            accentColor={isAllTimeDeficit ? '#f59e0b' : '#52c41a'}
          />
        </Grid>
      </Grid>

      {/* 3. COMPANY CASH IN HAND RECEIPTS PANEL */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 1.5,
            borderBottom: showFundsTable ? '1px solid' : 'none',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap">
            <WalletOutlined style={{ color: '#10b981', fontSize: 18 }} />
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Company Cash Received (Cash in Hand)
            </Typography>
            <Chip
              label={`${periodFunds.length} ${periodFunds.length === 1 ? 'receipt' : 'receipts'} • PKR ${financials.periodCashTotal.toLocaleString()}`}
              size="small"
              color="success"
              variant="light"
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <AppButton
              intent="secondary"
              size="small"
              startIcon={<PlusOutlined />}
              onClick={() => {
                setEditingFund(null);
                setFundDialogOpen(true);
              }}
            >
              Add Cash
            </AppButton>
            <IconButton size="small" onClick={() => setShowFundsTable((prev) => !prev)} aria-label="Toggle Cash Received List">
              {showFundsTable ? <UpOutlined /> : <DownOutlined />}
            </IconButton>
          </Stack>
        </Box>

        <Collapse in={showFundsTable}>
          {periodFunds.length === 0 ? (
            <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                No cash receipt recorded for <strong>{periodInfo.label}</strong> yet. Click &ldquo;+ Add Cash in Hand&rdquo; whenever company cash is received.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ ...tableHeadCellSx, width: 115 }}>DATE</TableCell>
                    <TableCell sx={tableHeadCellSx}>RECEIVED FROM / SOURCE</TableCell>
                    <TableCell sx={{ ...tableHeadCellSx, width: 130 }}>METHOD</TableCell>
                    <TableCell sx={tableHeadCellSx}>NOTES</TableCell>
                    <TableCell sx={{ ...tableHeadCellSx, width: 150 }}>ADDED BY</TableCell>
                    <TableCell align="right" sx={{ ...tableHeadCellSx, width: 150 }}>
                      CASH IN (PKR)
                    </TableCell>
                    <TableCell align="center" sx={{ ...tableHeadCellSx, width: 95 }}>
                      ACTION
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {periodFunds.map((fund) => (
                    <TableRow key={fund.id} hover>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fund.fundDate}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{fund.receivedFrom || 'Owner / Head Office'}</TableCell>
                      <TableCell>
                        <Chip label={fund.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{fund.notes || '—'}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.80rem' }}>{fund.addedBy || 'Counter'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#34d399' : '#059669' }}>
                        + PKR {(parseFloat(fund.amount) || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <Tooltip title="Edit Cash Entry">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setEditingFund(fund);
                                setFundDialogOpen(true);
                              }}
                            >
                              <EditOutlined style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Cash Entry">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                if (window.confirm(`Delete Cash in Hand entry of PKR ${parseFloat(fund.amount).toLocaleString()}?`)) {
                                  deleteExpenseFund(fund.id);
                                }
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Collapse>
      </MainCard>

      {/* 4. RECORD NEW EXPENSE VOUCHER FORM CARD */}
      <MainCard
        title="Record New Expense Voucher"
        secondary={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              label={`Closing Balance: PKR ${financials.periodRemainingBalance.toLocaleString()}`}
              color={isPeriodDeficit ? 'error' : 'success'}
              variant="light"
              size="small"
              sx={{ fontWeight: 700 }}
            />
            {draftAmountVal > 0 && (
              <Chip
                label={`After This Expense: PKR ${projectedBalanceAfterDraft.toLocaleString()}`}
                color={projectedBalanceAfterDraft < 0 ? 'warning' : 'primary'}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        }
        sx={{
          boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)',
          borderRadius: 2
        }}
      >
        <form onSubmit={handleAddExpense}>
          <Grid container spacing={2.5} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                freeSolo
                options={QUICK_EXPENSE_SUGGESTIONS}
                value={title}
                onChange={(event, newValue) => {
                  setTitle(typeof newValue === 'string' ? newValue : newValue || '');
                }}
                onInputChange={(event, newInputValue) => {
                  setTitle(newInputValue);
                }}
                sx={{ '& .MuiOutlinedInput-root': { height: '44px', minHeight: '44px', py: 0 } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="EXPENSE TITLE / DESCRIPTION *"
                    required
                    placeholder="e.g. Daily Staff Lunch & Tea, Generator Petrol, Utility Bill"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  fullWidth
                  label="EXPENSE CATEGORY *"
                  value={expenseCategories.includes(category) ? category : expenseCategories[0] || 'Miscellaneous & Others'}
                  onChange={(e) => {
                    if (e.target.value === '__add_new_cat__') {
                      setAddCategoryOpen(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { height: '44px', minHeight: '44px' } }}
                >
                  {expenseCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem
                    value="__add_new_cat__"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700,
                      bgcolor: 'primary.lighter',
                      py: 1,
                      '&:hover': { bgcolor: 'primary.light' }
                    }}
                  >
                    <PlusOutlined style={{ marginRight: 8 }} /> + Add Custom Category...
                  </MenuItem>
                </TextField>

                <Tooltip title="Add New Category">
                  <IconButton
                    color="primary"
                    onClick={() => setAddCategoryOpen(true)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 1.5,
                      height: '44px',
                      width: '44px',
                      flexShrink: 0,
                      bgcolor: 'primary.lighter',
                      '&:hover': { bgcolor: 'primary.light' }
                    }}
                  >
                    <PlusOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="AMOUNT (PKR)"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">PKR</InputAdornment>
                }}
                sx={{ '& .MuiOutlinedInput-root': { height: '44px', minHeight: '44px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <TextField
                fullWidth
                label="PAID TO / PERSON / VENDOR"
                placeholder="e.g. Hotel, PSO Petrol Pump, LESCO, Ali"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { height: '44px', minHeight: '44px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <TextField
                select
                fullWidth
                label="PAYMENT METHOD"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { height: '44px', minHeight: '44px' } }}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <TextField
                fullWidth
                label="EXPENSE DATE"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { height: '44px', minHeight: '44px' } }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <TextField
                fullWidth
                label="NOTES / RECEIPT REF #"
                placeholder="Optional voucher details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { height: '44px', minHeight: '44px' } }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, pt: 2.5, width: '100%' }}>
            <AppButton intent="cancel" startIcon={<ClearOutlined />} onClick={handleClearForm}>
              Clear Form
            </AppButton>
            <AppButton intent="primary" type="submit" startIcon={<PlusOutlined />}>
              Save Expense Voucher
            </AppButton>
          </Box>
        </form>
      </MainCard>

      {/* 5. EXPENSES REGISTER & CLOSING TABLE CARD */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Expenses history &amp; closing register
            </Typography>
            <Chip
              label={`${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'record' : 'records'}`}
              size="small"
              color="primary"
              variant="light"
              sx={{ fontWeight: 600 }}
            />
            {selected.length > 0 && (
              <Chip
                label={`${selected.length} Selected`}
                size="small"
                color="error"
                onDelete={handleBulkDelete}
                deleteIcon={<DeleteOutlined />}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center">
            {selected.length > 0 && (
              <AppButton intent="danger" size="small" startIcon={<DeleteOutlined />} onClick={handleBulkDelete}>
                Delete ({selected.length})
              </AppButton>
            )}
            <AppButton intent="secondary" size="small" startIcon={<PrinterOutlined />} onClick={() => handleOpenPrint(null)}>
              Print expense sheet
            </AppButton>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Search & Category Toolbar */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <OutlinedInput
              size="small"
              placeholder="Search title, person, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 240 } }}
            />

            <TextField
              select
              size="small"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{ width: { xs: '100%', sm: 210 } }}
            >
              <MenuItem value="All">All categories</MenuItem>
              {expenseCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Expenses Table */}
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selected.length > 0 && selected.length < filteredExpenses.length}
                      checked={filteredExpenses.length > 0 && selected.length === filteredExpenses.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, width: 56 }}>SR</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, width: 115 }}>DATE</TableCell>
                  <TableCell sx={tableHeadCellSx}>TITLE / DESCRIPTION</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, width: 165 }}>CATEGORY</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, width: 135 }}>PAID TO</TableCell>
                  <TableCell sx={{ ...tableHeadCellSx, width: 120 }}>PAYMENT</TableCell>
                  <TableCell align="right" sx={{ ...tableHeadCellSx, width: 140 }}>
                    AMOUNT (PKR)
                  </TableCell>
                  <TableCell align="center" sx={{ ...tableHeadCellSx, width: 95, pr: 2 }}>
                    ACTION
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No expense records found for {periodInfo.label}.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((exp, idx) => {
                    const isItemSelected = selected.indexOf(exp.id) !== -1;
                    const badgeStyle = CATEGORY_BADGE_COLORS[exp.category] || CATEGORY_BADGE_COLORS.default;
                    return (
                      <TableRow
                        key={exp.id || idx}
                        hover
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer', '&:last-child td': { borderBottom: 0 } }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            onChange={(event) => handleSelectOne(event, exp.id)}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>{exp.expenseDate}</TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
                            {exp.title}
                          </Typography>
                          {(exp.notes || exp.addedBy) && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {[exp.notes, exp.addedBy ? `By: ${exp.addedBy}` : ''].filter(Boolean).join(' • ')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exp.category || 'General'}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              bgcolor: isDark ? badgeStyle.darkBg : badgeStyle.lightBg,
                              color: isDark ? badgeStyle.darkText : badgeStyle.lightText
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: 'text.primary' }}>{exp.paidTo || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={exp.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: isDark ? '#f87171' : '#dc2626', fontSize: '0.875rem' }}>
                          PKR {(parseFloat(exp.amount) || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="center" sx={{ pr: 2 }}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title="Print Voucher">
                              <IconButton size="small" color="primary" onClick={() => handleOpenPrint(exp)}>
                                <PrinterOutlined style={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Expense">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete "${exp.title}"?`)) {
                                    deleteExpense(exp.id);
                                  }
                                }}
                              >
                                <DeleteOutlined style={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}

                {/* Day-End / Period Closing Calculation Rows */}
                {(filteredExpenses.length > 0 || periodFunds.length > 0) && (
                  <>
                    {isSubFiltered && (
                      <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor, borderTop: '1px solid', borderColor: 'divider' }}>
                        <TableCell colSpan={7} align="right" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.84rem' }}>
                          Filtered Rows Total:
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: isDark ? '#fca5a5' : '#b91c1c', fontSize: '0.92rem' }}>
                          PKR {financials.filteredExpensesTotal.toLocaleString()}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    )}

                    <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor, borderTop: '1px solid', borderColor: 'divider' }}>
                      <TableCell colSpan={7} align="right" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                        Cash in Hand / Received ({periodInfo.shortLabel}):
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#34d399' : '#059669', fontSize: '0.95rem' }}>
                        + PKR {financials.periodCashTotal.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>

                    <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
                      <TableCell colSpan={7} align="right" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                        Less: Total Expenses ({periodInfo.shortLabel}):
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: isDark ? '#f87171' : '#dc2626', fontSize: '0.95rem' }}>
                        - PKR {financials.periodExpensesTotal.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>

                    <TableRow
                      sx={{
                        bgcolor: isDark
                          ? isPeriodDeficit
                            ? 'rgba(239, 68, 68, 0.14)'
                            : 'rgba(16, 185, 129, 0.14)'
                          : isPeriodDeficit
                            ? '#fef2f2'
                            : '#ecfdf5',
                        borderTop: '2px solid',
                        borderColor: isPeriodDeficit ? 'error.main' : 'success.main'
                      }}
                    >
                      <TableCell colSpan={7} align="right" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                        {isPeriodDeficit ? 'Shortfall / Extra Paid Balance:' : 'Remaining / Closing Cash Balance (Baqaya):'}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 900,
                          color: isPeriodDeficit ? (isDark ? '#f87171' : '#b91c1c') : isDark ? '#34d399' : '#047857',
                          fontSize: '1.08rem'
                        }}
                      >
                        PKR {financials.periodRemainingBalance.toLocaleString()}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredExpenses.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            sx={{ mt: 0.5 }}
          />
        </Box>
      </MainCard>

      {/* 6. CASH IN HAND ENTRY DIALOG */}
      <CashInHandDialog
        open={fundDialogOpen}
        onClose={() => {
          setFundDialogOpen(false);
          setEditingFund(null);
        }}
        onSave={handleSaveCashFund}
        editingFund={editingFund}
      />

      {/* 7. PRINTABLE CLOSING STATEMENT / VOUCHER DIALOG */}
      <ExpensePrintDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        selectedExpenseForPrint={selectedExpenseForPrint}
        periodInfo={periodInfo}
        periodFunds={periodFunds}
        filteredExpenses={filteredExpenses}
        periodCashTotal={financials.periodCashTotal}
        periodExpensesTotal={financials.periodExpensesTotal}
        filteredTotal={financials.filteredExpensesTotal}
        periodRemainingBalance={financials.periodRemainingBalance}
      />

      {/* 8. ADD / MANAGE EXPENSE CATEGORY DIALOG */}
      <Dialog open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <PlusOutlined style={{ color: '#1677ff' }} />
            <Typography variant="h5" fontWeight={700}>
              Add Expense Category
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Create custom expense categories to categorize workshop, factory, and store spending. All categories sync automatically to the cloud.
            </Typography>

            <form onSubmit={handleSaveNewCategory}>
              <Stack spacing={1.5}>
                <TextField
                  fullWidth
                  autoFocus
                  label="Category Name *"
                  placeholder="e.g. Factory Rent, Packaging, Advertising"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (categoryError) setCategoryError('');
                  }}
                  error={Boolean(categoryError)}
                  helperText={categoryError}
                />
                <Button type="submit" variant="contained" color="primary" fullWidth startIcon={<PlusOutlined />} sx={{ fontWeight: 700, py: 1 }}>
                  Save &amp; Select Category
                </Button>
              </Stack>
            </form>

            <Divider />

            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Current Categories ({expenseCategories.length}):
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {expenseCategories.map((cat) => {
                  const isDefault = DEFAULT_EXPENSE_CATEGORIES.includes(cat);
                  return (
                    <Chip
                      key={cat}
                      label={cat}
                      size="small"
                      color={category === cat ? 'primary' : 'default'}
                      variant={category === cat ? 'filled' : 'outlined'}
                      onDelete={!isDefault ? () => handleDeleteCategory(cat) : undefined}
                      onClick={() => {
                        setCategory(cat);
                        setAddCategoryOpen(false);
                      }}
                      sx={{ fontWeight: 600, cursor: 'pointer' }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setAddCategoryOpen(false)} color="secondary" sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
