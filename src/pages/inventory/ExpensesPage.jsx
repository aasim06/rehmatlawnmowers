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
            <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100') }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.length > 0 && selected.length < filteredExpenses.length}
                    checked={filteredExpenses.length > 0 && selected.length === filteredExpenses.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 50 }}>SR</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 110 }}>DATE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>EXPENSE TITLE / DESCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 160 }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 130 }}>PAID TO</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.secondary', width: 110 }}>PAYMENT MODE</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'text.secondary', width: 130 }}>
                  AMOUNT (PKR)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', width: 90 }}>
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
                          variant="light"
                          color={
                            exp.category === 'Tea & Refreshment'
                              ? 'warning'
                              : exp.category === 'Fuel & Transport'
                              ? 'error'
                              : exp.category === 'Utilities & Bills'
                              ? 'primary'
                              : exp.category === 'Staff Wages & Labor'
                              ? 'info'
                              : 'default'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>{exp.paidTo || 'N/A'}</TableCell>
                      <TableCell>
                        <Chip label={exp.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main', fontSize: '0.95rem' }}>
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
                    bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'),
                    borderTop: '2px solid',
                    borderColor: 'divider'
                  }}
                >
                  <TableCell colSpan={7} align="right" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '0.95rem' }}>
                    Total Amount:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: 'error.main', fontSize: '1.05rem' }}>
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
      <Dialog open={printOpen} onClose={() => setPrintOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>
            {selectedExpenseForPrint ? 'Expense Payment Voucher' : 'Daily Expenses Statement'}
          </Typography>
          <Button variant="contained" color="primary" startIcon={<PrinterOutlined />} onClick={handlePrint}>
            Print Now
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Box id="printable-expense-sheet" sx={{ p: 2, bgcolor: '#ffffff' }}>
            {/* Company Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pb: 2, borderBottom: '2px solid #0f172a', mb: 2 }}>
              <Box>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', letterSpacing: 1 }}>
                  REHMAT LAWN MOWERS
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  Store & Workshop Daily Expense Statement
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Phone: 0306-0112606 | Lahore, Pakistan
                </Typography>
              </Box>
              <Box
                component="img"
                src={rehmatLogo}
                alt="Logo"
                sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '50%', border: '1px solid #cbd5e1' }}
              />
            </Stack>

            {/* Date & Meta */}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 2, bgcolor: '#f8fafc', p: 1.5, borderRadius: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Report Date:{' '}
                <Box component="span" fontWeight={800}>
                  {selectedExpenseForPrint ? selectedExpenseForPrint.expenseDate : dateFilter === 'today' ? todayStr : 'Filtered Period'}
                </Box>
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                Total Expenses:{' '}
                <Box component="span" fontWeight={800} color="#b91c1c">
                  PKR {selectedExpenseForPrint ? parseFloat(selectedExpenseForPrint.amount).toLocaleString() : filteredTotal.toLocaleString()}
                </Box>
              </Typography>
            </Stack>

            {/* Print Table */}
            <Table size="small" sx={{ border: '1px solid #cbd5e1', mb: 3 }}>
              <TableHead sx={{ bgcolor: '#0f172a' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Sr</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Expense Description</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Paid To</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 700 }}>Mode</TableCell>
                  <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700 }}>
                    Amount (PKR)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedExpenseForPrint ? (
                  <TableRow>
                    <TableCell>1</TableCell>
                    <TableCell>{selectedExpenseForPrint.expenseDate}</TableCell>
                    <TableCell fontWeight={700}>{selectedExpenseForPrint.title}</TableCell>
                    <TableCell>{selectedExpenseForPrint.category}</TableCell>
                    <TableCell>{selectedExpenseForPrint.paidTo || 'N/A'}</TableCell>
                    <TableCell>{selectedExpenseForPrint.paymentMethod || 'Cash'}</TableCell>
                    <TableCell align="right" fontWeight={800}>
                      PKR {parseFloat(selectedExpenseForPrint.amount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((exp, idx) => (
                    <TableRow key={exp.id || idx}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{exp.expenseDate}</TableCell>
                      <TableCell fontWeight={600}>{exp.title}</TableCell>
                      <TableCell>{exp.category}</TableCell>
                      <TableCell>{exp.paidTo || 'N/A'}</TableCell>
                      <TableCell>{exp.paymentMethod || 'Cash'}</TableCell>
                      <TableCell align="right" fontWeight={700}>
                        PKR {parseFloat(exp.amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                  <TableCell colSpan={6} align="right" sx={{ fontWeight: 800 }}>
                    Total Amount:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#b91c1c', fontSize: '1rem' }}>
                    PKR {selectedExpenseForPrint ? parseFloat(selectedExpenseForPrint.amount).toLocaleString() : filteredTotal.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Signatures */}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 5, pt: 2 }}>
              <Box sx={{ borderTop: '1px solid #94a3b8', width: 180, textAlign: 'center', pt: 0.5 }}>
                <Typography variant="caption" fontWeight={700}>
                  Prepared By (Cashier)
                </Typography>
              </Box>
              <Box sx={{ borderTop: '1px solid #94a3b8', width: 180, textAlign: 'center', pt: 0.5 }}>
                <Typography variant="caption" fontWeight={700}>
                  Verified / Approved By
                </Typography>
              </Box>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPrintOpen(false)} color="secondary">
            Close
          </Button>
          <Button variant="contained" color="primary" startIcon={<PrinterOutlined />} onClick={handlePrint}>
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
