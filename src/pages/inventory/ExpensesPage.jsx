import { useState, useMemo, useEffect } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  Button,
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
import CeoSignature from 'components/CeoSignature';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx } from 'utils/themeSurface';

// assets
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import ClearOutlined from '@ant-design/icons/ClearOutlined';

// project imports
import { AppButton } from 'components/common';

const DEFAULT_EXPENSE_CATEGORIES = [
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

const tableHeadCellSx = getTableHeadCellSx();

export default function ExpensesPage() {
  const theme = useTheme();
  const {
    expenses = [],
    addExpense,
    deleteExpense,
    expenseCategories = DEFAULT_EXPENSE_CATEGORIES,
    addExpenseCategory,
    deleteExpenseCategory
  } = useStoreInventory();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Tea & Refreshment');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Add Custom Category Modal State
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

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
    if (addExpenseCategory) {
      addExpenseCategory(trimmed);
    }
    setCategory(trimmed);
    setNewCategoryName('');
    setCategoryError('');
    setAddCategoryOpen(false);
  };

  const handleDeleteCategory = (catToDelete) => {
    if (window.confirm(`Are you sure you want to delete category "${catToDelete}"?`)) {
      if (deleteExpenseCategory) {
        deleteExpenseCategory(catToDelete);
      }
      if (category === catToDelete) {
        setCategory(expenseCategories.find((c) => c !== catToDelete) || 'Miscellaneous & Others');
      }
    }
  };

  // Table Selection & Filter State
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('today'); // 'today', 'month', 'all'

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
  }, [searchQuery, selectedCategory, dateFilter]);

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
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  select
                  fullWidth
                  label="EXPENSE CATEGORY *"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__add_new_cat__') {
                      setAddCategoryOpen(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      height: '44px',
                      minHeight: '44px'
                    }
                  }}
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
          </Grid>

          {/* ROW 3: Action Buttons (Right Aligned) */}
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

      {/* 3. EXPENSES REGISTER & TABLE CARD */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        {/* Card Header */}
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
              Expenses history &amp; daily register
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
            <AppButton intent="secondary" size="small" onClick={() => handleOpenPrint(null)}>
              Print expense sheet
            </AppButton>
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Search & Filter Toolbar */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1.5,
              mb: 2
            }}
          >
            {/* Segmented Date Filter Pills */}
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', p: 0.5, borderRadius: 2, gap: 0.5 })}>
              {[
                { key: 'today', label: 'Today' },
                { key: 'month', label: 'This month' },
                { key: 'all', label: 'All records' }
              ].map((tab) => {
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
              sx={{ width: { xs: '100%', sm: 185 } }}
            >
              <MenuItem value="All">All categories</MenuItem>
              {expenseCategories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Expenses Data Table */}
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
                  <TableCell align="right" sx={{ ...tableHeadCellSx, width: 135 }}>
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
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No expense records found for the selected filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((exp, idx) => {
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
                          <TableCell sx={{ color: 'text.secondary' }}>{page * rowsPerPage + idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary', whiteSpace: 'nowrap' }}>{exp.expenseDate}</TableCell>
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
                                bgcolor: (t) =>
                                  t.palette.mode === 'dark'
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
                                color: (t) =>
                                  t.palette.mode === 'dark'
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
                          <TableCell align="right" sx={{ fontWeight: 700, color: (t) => (t.palette.mode === 'dark' ? '#f87171' : '#dc2626'), fontSize: '0.875rem' }}>
                            PKR {parseFloat(exp.amount || 0).toLocaleString()}
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

                {/* Total Summary Row */}
                {filteredExpenses.length > 0 && (
                  <TableRow
                    sx={{
                      bgcolor: getSubSurfaceSx(theme).bgcolor,
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <TableCell colSpan={7} align="right" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.875rem' }}>
                      Total Amount:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: (t) => (t.palette.mode === 'dark' ? '#f87171' : '#dc2626'), fontSize: '1rem' }}>
                      PKR {filteredTotal.toLocaleString()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
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
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{ mt: 0.5 }}
          />
        </Box>
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
                margin: 4mm 5mm;
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
                padding: 60px 4px 6px 4px !important;
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

        <DialogContent sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#ffffff' }}>
          <Box id="printable-expense-sheet" sx={{ position: 'relative', overflow: 'hidden', pt: { xs: 5, sm: 7 }, px: { xs: 1, sm: 1.5 }, pb: { xs: 1, sm: 1.5 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* Structured Metadata Card */}
              <div style={{
                border: '1.5px solid #111827',
                borderRadius: '4px',
                marginBottom: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                overflow: 'hidden'
              }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ flex: '1.2', padding: '6px 10px', borderRight: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                      Statement Type
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                      {selectedExpenseForPrint ? 'Expense Voucher' : 'Daily Expenses Statement'}
                    </div>
                  </div>

                  <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Statement Date:</span>
                      <span style={{ fontWeight: 700, color: '#374151' }}>
                        {selectedExpenseForPrint ? selectedExpenseForPrint.expenseDate : dateFilter === 'today' ? todayStr : 'Filtered Records'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                      <span style={{ color: '#6b7280', fontWeight: 600 }}>Total Count:</span>
                      <span style={{ fontWeight: 800, color: '#16a34a' }}>
                        {selectedExpenseForPrint ? '01 Entry' : `${filteredExpenses.length} Entries`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '10px', backgroundColor: 'transparent' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                    <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontSize: '0.82rem' }}>
                      <strong>Sr</strong>
                    </th>
                    <th style={{ width: '52%', borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                      <strong>Expense Title / Description</strong>
                    </th>
                    <th style={{ width: '12%', borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontSize: '0.82rem' }}>
                      <strong>Category</strong>
                    </th>
                    <th style={{ width: '14%', borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                      <strong>Paid To</strong>
                    </th>
                    <th style={{ width: '14%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                      <strong>Amount (PKR)</strong>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedExpenseForPrint ? (
                    <tr style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                        01
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.25 }}>
                        {selectedExpenseForPrint.title} {selectedExpenseForPrint.notes ? `(${selectedExpenseForPrint.notes})` : ''}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                        {selectedExpenseForPrint.category}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                        {selectedExpenseForPrint.paidTo || 'N/A'}
                      </td>
                      <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                        {parseFloat(selectedExpenseForPrint.amount).toLocaleString()}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp, idx) => (
                      <tr key={exp.id || idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.25 }}>
                          {exp.title} {exp.notes ? `(${exp.notes})` : ''}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                          {exp.category}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                          {exp.paidTo || 'N/A'}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                          {parseFloat(exp.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}

                  {/* Total Amount Bottom Row */}
                  <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                    <td colSpan={2} style={{ borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'center', fontWeight: 800, fontSize: '0.88rem' }}>
                      Total amount
                    </td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                    <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, fontSize: '0.92rem', color: '#111827' }}>
                      {(selectedExpenseForPrint ? parseFloat(selectedExpenseForPrint.amount) : filteredTotal).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Summary Box */}
              <Box sx={{ bgcolor: 'transparent', py: 0.8, px: 1.2, borderRadius: 1, border: '1px solid #86efac', mb: 1.2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                      TOTAL EXPENSE VOUCHERS: {selectedExpenseForPrint ? 1 : filteredExpenses.length}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle1" fontWeight={800} color="success.dark" sx={{ lineHeight: 1.2 }}>
                      NET TOTAL EXPENSES: Rs. {(selectedExpenseForPrint ? parseFloat(selectedExpenseForPrint.amount) : filteredTotal).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Signatures Footer */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', mt: 1.5, pt: 1 }}>
                <Box>
                  <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 170 }}>
                    Cashier / Manager Signature
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                    <CeoSignature />
                  </Box>
                </Box>
              </Box>
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

      {/* 5. ADD / MANAGE EXPENSE CATEGORY DIALOG */}
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
            <Typography variant="body2" color="textSecondary">
              Create custom expense categories to categorize workshop, factory, and store spending.
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
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<PlusOutlined />}
                  sx={{ fontWeight: 700, py: 1 }}
                >
                  Save & Select Category
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
