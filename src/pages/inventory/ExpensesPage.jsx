import React, { useState, useMemo } from 'react';

// material-ui
import {
  Autocomplete,
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  Chip,
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
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

// project imports
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';
import { useStoreInventory } from 'context/StoreInventoryContext';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';
import { useTransparentLogo } from 'components/logo/LogoMain';
import CeoSignature from 'components/CeoSignature';

// assets
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import ClearOutlined from '@ant-design/icons/ClearOutlined';

const EXPENSE_CATEGORIES = [
  'Tea & Refreshment',
  'Fuel & Transport',
  'Utilities & Bills',
  'Staff Wages & Labor',
  'Shop Maintenance & Tools',
  'Stationery & Office',
  'Miscellaneous & Others'
];

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

export default function ExpensesPage() {
  const transparentLogo = useTransparentLogo(rehmatLogo);
  const { expenses = [], addExpense, deleteExpense } = useStoreInventory();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tea & Refreshment');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Table Selection & Filter State
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'month', 'all'

  // Print Dialog State
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedExpenseForPrint, setSelectedExpenseForPrint] = useState(null);

  // Today Date String
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // KPI Calculations
  const stats = useMemo(() => {
    let todayTotal = 0;
    let todayCount = 0;
    let monthTotal = 0;
    let allTimeTotal = 0;
    const catMap = {};

    expenses.forEach((e) => {
      const amt = parseFloat(e.amount) || 0;
      allTimeTotal += amt;

      if (e.expenseDate === todayStr) {
        todayTotal += amt;
        todayCount += 1;
      }

      if ((e.expenseDate || '').startsWith(currentMonthStr)) {
        monthTotal += amt;
      }

      const cat = e.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + amt;
    });

    let topCat = 'None';
    let topCatAmt = 0;
    Object.entries(catMap).forEach(([cat, sum]) => {
      if (sum > topCatAmt) {
        topCat = cat;
        topCatAmt = sum;
      }
    });

    return { todayTotal, todayCount, monthTotal, allTimeTotal, topCat };
  }, [expenses, todayStr, currentMonthStr]);

  // Filtered Expenses List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Date filter
      if (dateFilter === 'today' && e.expenseDate !== todayStr) return false;
      if (dateFilter === 'month' && !(e.expenseDate || '').startsWith(currentMonthStr)) return false;

      // Category filter
      if (selectedCategory !== 'All' && e.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (e.title || '').toLowerCase().includes(q);
        const matchesPaidTo = (e.paidTo || '').toLowerCase().includes(q);
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesPaidTo && !matchesNotes) return false;
      }

      return true;
    });
  }, [expenses, dateFilter, todayStr, currentMonthStr, selectedCategory, searchQuery]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  }, [filteredExpenses]);

  // Submit Add Expense
  const handleAddExpense = (e) => {
    if (e) e.preventDefault();
    if (!title.trim() || !amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid expense title and amount');
      return;
    }

    addExpense({
      title: title.trim(),
      category,
      amount: parseFloat(amount),
      paymentMethod,
      paidTo: paidTo.trim() || 'N/A',
      expenseDate,
      notes: notes.trim()
    });

    // Reset Form
    handleClearForm();
  };

  const handleClearForm = () => {
    setTitle('');
    setAmount('');
    setPaidTo('');
    setNotes('');
    setCategory('Tea & Refreshment');
    setPaymentMethod('Cash');
    setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  // Table Checkbox Selection
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredExpenses.map((n) => n.id);
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

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selected.length} selected expense records?`)) {
      selected.forEach((id) => deleteExpense(id));
      setSelected([]);
    }
  };

  // Open Print Dialog
  const handleOpenPrint = (expenseItem = null) => {
    setSelectedExpenseForPrint(expenseItem);
    setPrintOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Stack spacing={3}>
      {/* 1. TOP 4 MANTIS KPI STATS CARDS */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="TODAY'S EXPENSES"
            count={`PKR ${stats.todayTotal.toLocaleString()}`}
            extra={`${stats.todayCount} voucher${stats.todayCount !== 1 ? 's' : ''} recorded today`}
            color="error"
            accentColor="#ef4444"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="THIS MONTH'S EXPENSES"
            count={`PKR ${stats.monthTotal.toLocaleString()}`}
            extra="Current Month Cycle"
            color="primary"
            accentColor="#1677ff"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="TOP EXPENSE CATEGORY"
            count={stats.topCat}
            extra="Major cost driver"
            color="warning"
            accentColor="#faad14"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticEcommerce
            title="ALL-TIME TOTAL EXPENSES"
            count={`PKR ${stats.allTimeTotal.toLocaleString()}`}
            extra={`${expenses.length} total recorded entries`}
            color="success"
            accentColor="#52c41a"
          />
        </Grid>
      </Grid>

      {/* 2. RECORD NEW EXPENSE FORM CARD */}
      <MainCard
        title="Record New Expense Voucher"
        sx={{
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)'),
          borderRadius: 2
        }}
      >
        <form onSubmit={handleAddExpense}>
          <Grid container spacing={2.5} alignItems="center">
            {/* ROW 1: Expense Title (50%), Category (25%), Amount (25%) */}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px',
                    py: 0
                  }
                }}
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
              <TextField
                select
                fullWidth
                label="EXPENSE CATEGORY *"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="AMOUNT (PKR) *"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">PKR</InputAdornment>
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            {/* ROW 2: Paid To (30%), Payment Method (20%), Expense Date (20%), Notes (30%) */}
            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <TextField
                fullWidth
                label="PAID TO / PERSON / VENDOR"
                placeholder="e.g. Hotel, PSO Petrol Pump, LESCO, Ali"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <TextField
                select
                fullWidth
                label="PAYMENT METHOD"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <TextField
                fullWidth
                label="NOTES / RECEIPT REF #"
                placeholder="Optional voucher details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '44px',
                    minHeight: '44px'
                  }
                }}
              />
            </Grid>

            {/* ROW 3: Action Buttons */}
            <Grid size={12}>
              <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<ClearOutlined />}
                  onClick={handleClearForm}
                  sx={{ height: '40px', px: 2.5, fontWeight: 600 }}
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="success"
                  startIcon={<PlusOutlined />}
                  sx={{
                    height: '40px',
                    px: 3.5,
                    fontWeight: 700,
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  Save Expense Voucher
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </MainCard>

      {/* 3. EXPENSES REGISTER & TABLE CARD */}
      <MainCard
        title={
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography variant="h5" fontWeight={700}>
                Expenses History & Daily Register
              </Typography>
              <Chip label={`${filteredExpenses.length} Records`} size="small" color="primary" variant="light" />
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

            <Stack direction="row" spacing={1.5}>
              {selected.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlined />}
                  onClick={handleBulkDelete}
                  sx={{ height: '36px', fontWeight: 600 }}
                >
                  Delete ({selected.length})
                </Button>
              )}
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<PrinterOutlined />}
                onClick={() => handleOpenPrint(null)}
                sx={{ height: '36px', fontWeight: 600 }}
              >
                Print Expense Sheet
              </Button>
            </Stack>
          </Stack>
        }
        sx={{
          boxShadow: (theme) => (theme.palette.mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 2px 10px rgba(0, 0, 0, 0.05)'),
          borderRadius: 2
        }}
      >
        {/* Search & Filter Toolbar */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ mb: 2.5 }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          {/* Quick Date Filters */}
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={dateFilter === 'today' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('today')}
              sx={{ fontWeight: 600 }}
            >
              Today&apos;s Expenses
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('month')}
              sx={{ fontWeight: 600 }}
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setDateFilter('all')}
              sx={{ fontWeight: 600 }}
            >
              All Records
            </Button>
          </ButtonGroup>

          {/* Search Input & Category Dropdown */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <OutlinedInput
              size="small"
              placeholder="Search title, person, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined />
                </InputAdornment>
              }
              sx={{ minWidth: { sm: 240 }, height: '36px' }}
            />

            <TextField
              select
              size="small"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{
                minWidth: { sm: 180 },
                '& .MuiOutlinedInput-root': {
                  height: '36px'
                }
              }}
            >
              <MenuItem value="All">All Categories</MenuItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>

        {/* Expenses Data Table */}
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'grey.50') }}>
              <TableRow>
                <TableCell padding="checkbox" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredExpenses.length}
                    checked={filteredExpenses.length > 0 && selected.length === filteredExpenses.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 50, borderBottom: '1px solid', borderColor: 'divider' }}>SR</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 110, borderBottom: '1px solid', borderColor: 'divider' }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid', borderColor: 'divider' }}>EXPENSE TITLE / DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 160, borderBottom: '1px solid', borderColor: 'divider' }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 130, borderBottom: '1px solid', borderColor: 'divider' }}>PAID TO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary', width: 120, borderBottom: '1px solid', borderColor: 'divider' }}>PAYMENT MODE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary', width: 130, borderBottom: '1px solid', borderColor: 'divider' }}>
                  AMOUNT (PKR)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary', width: 90, borderBottom: '1px solid', borderColor: 'divider' }}>
                  ACTION
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No expense records found for the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((exp, idx) => {
                  const isItemSelected = isSelected(exp.id);
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
                      <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>{exp.expenseDate}</TableCell>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.primary' }}>
                          {exp.title}
                        </Typography>
                        {exp.notes && (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {exp.notes}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={exp.category || 'General'}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: (theme) =>
                              theme.palette.mode === 'dark'
                                ? exp.category === 'Tea & Refreshment'
                                  ? 'rgba(245, 158, 11, 0.2)'
                                  : exp.category === 'Fuel & Transport'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : exp.category === 'Utilities & Bills'
                                  ? 'rgba(59, 130, 246, 0.2)'
                                  : exp.category === 'Staff Wages & Labor'
                                  ? 'rgba(99, 102, 241, 0.2)'
                                  : 'rgba(255, 255, 255, 0.1)'
                                : exp.category === 'Tea & Refreshment'
                                ? '#fef3c7'
                                : exp.category === 'Fuel & Transport'
                                ? '#fee2e2'
                                : exp.category === 'Utilities & Bills'
                                ? '#dbeafe'
                                : exp.category === 'Staff Wages & Labor'
                                ? '#e0e7ff'
                                : '#f1f5f9',
                            color: (theme) =>
                              theme.palette.mode === 'dark'
                                ? exp.category === 'Tea & Refreshment'
                                  ? '#fbbf24'
                                  : exp.category === 'Fuel & Transport'
                                  ? '#f87171'
                                  : exp.category === 'Utilities & Bills'
                                  ? '#60a5fa'
                                  : exp.category === 'Staff Wages & Labor'
                                  ? '#818cf8'
                                  : '#e2e8f0'
                                : exp.category === 'Tea & Refreshment'
                                ? '#b45309'
                                : exp.category === 'Fuel & Transport'
                                ? '#b91c1c'
                                : exp.category === 'Utilities & Bills'
                                ? '#1d4ed8'
                                : exp.category === 'Staff Wages & Labor'
                                ? '#4338ca'
                                : '#475569'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{exp.paidTo || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={exp.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: (theme) => (theme.palette.mode === 'dark' ? '#f87171' : '#dc2626'), fontSize: '0.95rem' }}>
                        PKR {parseFloat(exp.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="center">
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

              {/* Total Summary Row */}
              {filteredExpenses.length > 0 && (
                <TableRow
                  sx={{
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'grey.50'),
                    borderTop: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  <TableCell colSpan={7} align="right" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                    Total Amount:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: (theme) => (theme.palette.mode === 'dark' ? '#f87171' : '#dc2626'), fontSize: '1.05rem' }}>
                    PKR {filteredTotal.toLocaleString()}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      {/* 4. PRINTABLE VOUCHER / STATEMENT DIALOG */}
      <Dialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '@media print': {
            '& .MuiDialog-container': {
              display: 'block !important',
              padding: '0 !important',
              margin: '0 !important'
            },
            '& .MuiPaper-root': {
              boxShadow: 'none !important',
              border: 'none !important',
              maxWidth: '100% !important',
              margin: '0 !important',
              padding: '0 !important',
              borderRadius: '0 !important',
              overflow: 'visible !important'
            }
          }
        }}
      >
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-expense-sheet, #printable-expense-sheet * {
                visibility: visible !important;
              }
              #printable-expense-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              .no-print, .MuiDialogTitle-root, .MuiDialogActions-root, .MuiBackdrop-root {
                display: none !important;
                visibility: hidden !important;
              }
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                overflow: visible !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {selectedExpenseForPrint ? 'Expense Payment Voucher' : 'Daily Expenses Statement'}
          </Typography>
          <Button variant="contained" color="primary" startIcon={<PrinterOutlined />} onClick={handlePrint} className="no-print">
            Print Now
          </Button>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#ffffff' }}>
          <Box id="printable-expense-sheet" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
            {/* Watermark Logo */}
            <Box
              component="img"
              className="watermark-logo"
              src={transparentLogo || rehmatLogo}
              alt="Watermark Logo"
              sx={{
                position: 'absolute',
                top: '58%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '390px',
                maxWidth: '70%',
                opacity: 0.15,
                pointerEvents: 'none',
                zIndex: 0
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Brand Header with Emblem Logo */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
                <Box
                  component="img"
                  src={transparentLogo || rehmatLogo}
                  alt="Rehmat Logo Emblem"
                  sx={{ width: 64, height: 64, objectFit: 'contain', borderRadius: '50%' }}
                />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h3" fontWeight={800} sx={{ color: '#10b981', lineHeight: 1.1, letterSpacing: '0.5px' }}>
                    REHMAT LAWN MOWERS
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Structured Metadata Card */}
              <div style={{
                border: '1.5px solid #111827',
                borderRadius: '4px',
                marginBottom: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ flex: '1.2', padding: '10px 14px', borderRight: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                      Statement Type
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                      {selectedExpenseForPrint ? 'Expense Voucher' : 'Daily Expenses Statement'}
                    </div>
                  </div>

                  <div style={{ flex: '1', padding: '10px 14px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Statement Date:</span>
                      <span style={{ fontWeight: 700, color: '#374151' }}>
                        {selectedExpenseForPrint ? selectedExpenseForPrint.expenseDate : dateFilter === 'today' ? todayStr : 'Filtered Records'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Total Count:</span>
                      <span style={{ fontWeight: 800, color: '#16a34a' }}>
                        {selectedExpenseForPrint ? '01 Entry' : `${filteredExpenses.length} Entries`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '16px', backgroundColor: 'transparent' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                    <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '8px 4px', textAlign: 'center', fontSize: '0.95rem' }}>
                      <strong>Sr</strong>
                    </th>
                    <th style={{ width: '52%', borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontSize: '0.95rem' }}>
                      <strong>Expense Title / Description</strong>
                    </th>
                    <th style={{ width: '12%', borderRight: '1.5px solid #111827', padding: '8px 6px', textAlign: 'center', fontSize: '0.95rem' }}>
                      <strong>Category</strong>
                    </th>
                    <th style={{ width: '14%', borderRight: '1.5px solid #111827', padding: '8px 8px', textAlign: 'center', fontSize: '0.95rem' }}>
                      <strong>Paid To</strong>
                    </th>
                    <th style={{ width: '14%', padding: '8px 8px', textAlign: 'center', fontSize: '0.95rem' }}>
                      <strong>Amount (PKR)</strong>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExpenseForPrint ? (
                    <tr style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                        01
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>
                        {selectedExpenseForPrint.title} {selectedExpenseForPrint.notes ? `(${selectedExpenseForPrint.notes})` : ''}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '6px 6px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                        {selectedExpenseForPrint.category}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                        {selectedExpenseForPrint.paidTo || 'N/A'}
                      </td>
                      <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                        {parseFloat(selectedExpenseForPrint.amount).toLocaleString()}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id || idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>
                          {exp.title} {exp.notes ? `(${exp.notes})` : ''}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 6px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                          {exp.category}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                          {exp.paidTo || 'N/A'}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                          {parseFloat(exp.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Total Amount Bottom Row */}
                  <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                    <td colSpan={2} style={{ borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>
                      Total amount
                    </td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '8px' }}></td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '8px' }}></td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#111827' }}>
                      {(selectedExpenseForPrint ? parseFloat(selectedExpenseForPrint.amount) : filteredTotal).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Summary Box */}
              <Box sx={{ bgcolor: 'transparent', p: 1.5, borderRadius: 1, border: '1px solid #86efac', mb: 2 }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" fontWeight={700} color="textSecondary" display="block">
                      TOTAL EXPENSE VOUCHERS: {selectedExpenseForPrint ? 1 : filteredExpenses.length}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="h6" fontWeight={800} color="success.dark">
                      NET TOTAL EXPENSES: Rs. {(selectedExpenseForPrint ? parseFloat(selectedExpenseForPrint.amount) : filteredTotal).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Signatures Footer */}
              <Grid container spacing={2} sx={{ mt: 3, pt: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 1, width: 180 }}>
                    Cashier / Manager Signature
                  </Typography>
                </Grid>
                <Grid item xs={6} sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                    <CeoSignature />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="no-print" sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button onClick={() => setPrintOpen(false)} color="secondary" variant="outlined" className="no-print">
            Close
          </Button>
          <Button variant="contained" color="primary" startIcon={<PrinterOutlined />} onClick={handlePrint} className="no-print" sx={{ fontWeight: 700 }}>
            Print Statement
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
