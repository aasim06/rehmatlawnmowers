import React, { useState, useMemo } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';

// project imports
import MainCard from 'components/MainCard';
import { useStoreInventory } from 'context/StoreInventoryContext';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';

// assets
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';
import CoffeeOutlined from '@ant-design/icons/CoffeeOutlined';

const EXPENSE_CATEGORIES = [
  'Tea & Refreshment',
  'Fuel & Transport',
  'Utilities & Bills',
  'Staff Wages & Labor',
  'Shop Maintenance & Tools',
  'Stationery & Office',
  'Miscellaneous & Others'
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

  // Filters State
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
    e.preventDefault();
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
    setTitle('');
    setAmount('');
    setPaidTo('');
    setNotes('');
  };

  // Open Print
  const handleOpenPrint = (expenseItem = null) => {
    setSelectedExpenseForPrint(expenseItem);
    setPrintOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* Header Banner */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: '#1e293b', mb: 0.5 }}>
          Daily & Monthly Expenses Management
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Record, track, and manage all factory, workshop, tea, transport, utility bills, and labor expenses.
        </Typography>
      </Box>

      {/* 4 Summary KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              borderLeft: '4px solid #ef4444'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Today&apos;s Expenses
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#ef4444', mt: 0.5 }}>
                  PKR {stats.todayTotal.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {stats.todayCount} voucher{stats.todayCount !== 1 ? 's' : ''} recorded today
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#fee2e2', borderRadius: 2, color: '#ef4444' }}>
                <WalletOutlined style={{ fontSize: 24 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              borderLeft: '4px solid #3b82f6'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  This Month&apos;s Expenses
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#3b82f6', mt: 0.5 }}>
                  PKR {stats.monthTotal.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Current Month Cycle
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#dbeafe', borderRadius: 2, color: '#3b82f6' }}>
                <CalendarOutlined style={{ fontSize: 24 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              borderLeft: '4px solid #f59e0b'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Top Expense Category
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#d97706', mt: 0.5, noWrap: true }}>
                  {stats.topCat}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Major cost driver
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#fef3c7', borderRadius: 2, color: '#d97706' }}>
                <CoffeeOutlined style={{ fontSize: 24 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              borderLeft: '4px solid #10b981'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  All-Time Total Expenses
                </Typography>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#10b981', mt: 0.5 }}>
                  PKR {stats.allTimeTotal.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  {expenses.length} total recorded entries
                </Typography>
              </Box>
              <Box sx={{ p: 1.5, bgcolor: '#d1fae5', borderRadius: 2, color: '#10b981' }}>
                <DollarOutlined style={{ fontSize: 24 }} />
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Add New Expense Form Card */}
      <MainCard
        title={
          <Stack direction="row" alignItems="center" spacing={1}>
            <PlusOutlined style={{ color: '#10b981' }} />
            <Typography variant="h5" fontWeight={700}>
              Record New Expense Voucher
            </Typography>
          </Stack>
        }
        sx={{ mb: 3 }}
      >
        <form onSubmit={handleAddExpense}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Expense Title / Description"
                placeholder="e.g. Daily Staff Lunch & Tea, Generator Petrol, Utility Bill"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                InputProps={{ sx: { height: '41.38px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                select
                fullWidth
                label="Expense Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                InputProps={{ sx: { height: '41.38px' } }}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3.5}>
              <TextField
                fullWidth
                label="Amount (PKR)"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                InputProps={{
                  sx: { height: '41.38px' },
                  startAdornment: <InputAdornment position="start">PKR</InputAdornment>
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                select
                fullWidth
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                InputProps={{ sx: { height: '41.38px' } }}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Paid To / Person / Vendor"
                placeholder="e.g. Hotel, PSO, LESCO, Ali"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                InputProps={{ sx: { height: '41.38px' } }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                InputProps={{ sx: { height: '41.38px' } }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Notes / Receipt Ref #"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                InputProps={{ sx: { height: '41.38px' } }}
              />
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 1 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<PlusOutlined />}
                  sx={{ height: '41.38px', px: 3, fontWeight: 700 }}
                >
                  Save Expense Voucher
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </form>
      </MainCard>

      {/* Expenses History & Filters Card */}
      <MainCard
        title={
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="h5" fontWeight={700}>
                Expenses History & Daily Register
              </Typography>
              <Chip label={`${filteredExpenses.length} Records`} size="small" color="primary" variant="outlined" />
            </Stack>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PrinterOutlined />}
              onClick={() => handleOpenPrint(null)}
              sx={{ height: '36px', fontWeight: 600 }}
            >
              Print Expense Sheet
            </Button>
          </Stack>
        }
      >
        {/* Filters Bar */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2.5 }} alignItems="center" justifyContent="space-between">
          {/* Quick Date Tabs */}
          <Stack direction="row" spacing={1}>
            <Button
              variant={dateFilter === 'today' ? 'contained' : 'outlined'}
              color="primary"
              size="small"
              onClick={() => setDateFilter('today')}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Today&apos;s Expenses
            </Button>
            <Button
              variant={dateFilter === 'month' ? 'contained' : 'outlined'}
              color="primary"
              size="small"
              onClick={() => setDateFilter('month')}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              This Month
            </Button>
            <Button
              variant={dateFilter === 'all' ? 'contained' : 'outlined'}
              color="primary"
              size="small"
              onClick={() => setDateFilter('all')}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              All Records
            </Button>
          </Stack>

          {/* Search & Category Filter */}
          <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
            <TextField
              placeholder="Search title, person, notes..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                sx: { height: '36px', minWidth: { md: 220 } },
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined />
                  </InputAdornment>
                )
              }}
            />

            <TextField
              select
              size="small"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              InputProps={{ sx: { height: '36px', minWidth: 160 } }}
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

        {/* Expenses Table */}
        <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: 60 }}>Sr</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: 120 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569' }}>Expense Title / Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: 180 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: 140 }}>Paid To</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#475569', width: 120 }}>Payment Mode</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', width: 140 }}>
                  Amount (PKR)
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', width: 100 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#94a3b8' }}>
                    No expense records found for the selected filter.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((exp, idx) => (
                  <TableRow key={exp.id || idx} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                    <TableCell sx={{ color: '#64748b' }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#334155' }}>{exp.expenseDate}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b' }}>
                        {exp.title}
                      </Typography>
                      {exp.notes && (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
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
                          bgcolor:
                            exp.category === 'Tea & Refreshment'
                              ? '#fef3c7'
                              : exp.category === 'Fuel & Transport'
                              ? '#fee2e2'
                              : exp.category === 'Utilities & Bills'
                              ? '#dbeafe'
                              : exp.category === 'Staff Wages & Labor'
                              ? '#e0e7ff'
                              : '#f1f5f9',
                          color:
                            exp.category === 'Tea & Refreshment'
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
                    <TableCell sx={{ color: '#334155' }}>{exp.paidTo || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip label={exp.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#ef4444', fontSize: '0.95rem' }}>
                      PKR {parseFloat(exp.amount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <IconButton size="small" color="primary" onClick={() => handleOpenPrint(exp)} title="Print Voucher">
                          <PrinterOutlined style={{ fontSize: 15 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete "${exp.title}"?`)) {
                              deleteExpense(exp.id);
                            }
                          }}
                          title="Delete Expense"
                        >
                          <DeleteOutlined style={{ fontSize: 15 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}

              {/* Total Footer Row */}
              {filteredExpenses.length > 0 && (
                <TableRow sx={{ bgcolor: '#f1f5f9', borderTop: '2px solid #cbd5e1' }}>
                  <TableCell colSpan={6} align="right" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>
                    Total Amount:
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900, color: '#b91c1c', fontSize: '1.05rem' }}>
                    PKR {filteredTotal.toLocaleString()}
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      {/* Printable Expense Voucher / Statement Dialog */}
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
            {/* Header */}
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
    </Box>
  );
}
