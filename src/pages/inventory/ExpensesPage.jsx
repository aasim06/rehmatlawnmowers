import { useState, useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Autocomplete,
  Box,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';

// icons
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import ClearOutlined from '@ant-design/icons/ClearOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import FallOutlined from '@ant-design/icons/FallOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';

// project imports
import MainCard from 'components/MainCard';
import {
  AppButton,
  AppDataTable,
  AppTextField,
  FilterBar,
  FormDialog,
  MasterKpiGrid,
  PageHeader
} from 'components/common';
import CashInHandDialog from 'components/expenses/CashInHandDialog';
import ExpensePrintDialog from 'components/expenses/ExpensePrintDialog';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { DEFAULT_EXPENSE_CATEGORIES, getLocalDateISO } from 'context/modules/useExpensesModule';
import {
  EXPENSE_PERIOD_OPTIONS,
  computeCashClosingSummary,
  describeExpensePeriod
} from 'utils/expenseHelpers';
import { getCardSurfaceSx, getSubSurfaceSx, getToneColors } from 'utils/themeSurface';

const QUICK_EXPENSE_SUGGESTIONS = [
  'Daily Workshop Staff Lunch & Tea',
  'Generator Petrol / Diesel',
  'Electricity Commercial Bill',
  'Lathe Tool Bit & Grinding Discs',
  'Daily Wages / Overtime Labor',
  'Shop Hardware, Oil & Cleaners',
  'Stationery, Bill Books & Tape'
];

const PAYMENT_METHODS = ['Cash', 'Online / Bank Transfer', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Cheque'];

const CATEGORY_TONE_MAP = {
  'Tea & Refreshment': 'warning',
  'Fuel & Transport': 'error',
  'Utilities & Bills': 'info',
  'Staff Wages & Labor': 'primary'
};

export default function ExpensesPage() {
  const theme = useTheme();

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

  // Unified Period & Category Filter State ('today', 'week', 'fortnight', 'month', 'custom', 'all')
  const [dateFilter, setDateFilter] = useState('today');
  const [customFromDate, setCustomFromDate] = useState(todayStr);
  const [customToDate, setCustomToDate] = useState(todayStr);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Top Inline Quick Cash-in-Hand Entry State (for quick morning / evening / online cash entries)
  const [quickFundType, setQuickFundType] = useState('received');
  const [quickFundAmount, setQuickFundAmount] = useState('');
  const [quickFundSource, setQuickFundSource] = useState('Owner / Boss');
  const [quickFundMethod, setQuickFundMethod] = useState('Cash');
  const [quickFundDate, setQuickFundDate] = useState(todayStr);
  const [quickFundNotes, setQuickFundNotes] = useState('');

  // Expense Voucher Entry Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(expenseCategories[0] || 'Tea & Refreshment');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [notes, setNotes] = useState('');

  // Dialogs & Selection State
  const [fundDialogOpen, setFundDialogOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [selected, setSelected] = useState([]);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedExpenseForPrint, setSelectedExpenseForPrint] = useState(null);

  const periodParams = useMemo(
    () => ({ period: dateFilter, todayStr, fromDate: customFromDate, toDate: customToDate }),
    [dateFilter, todayStr, customFromDate, customToDate]
  );
  const periodInfo = useMemo(() => describeExpensePeriod(periodParams), [periodParams]);

  const summary = useMemo(
    () => computeCashClosingSummary({ expenseFunds, expenses, ...periodParams }),
    [expenseFunds, expenses, periodParams]
  );

  const categoryFilteredExpenses = useMemo(
    () =>
      summary.periodExpenses
        .filter((e) => selectedCategory === 'All' || e.category === selectedCategory)
        .map((e, idx) => ({ ...e, srNo: idx + 1 })),
    [summary.periodExpenses, selectedCategory]
  );

  const categorySubtotal = useMemo(
    () => categoryFilteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
    [categoryFilteredExpenses]
  );

  const draftAmountVal = parseFloat(amount) || 0;
  const projectedAfterDraft = summary.closingBalance - draftAmountVal;
  const isPeriodDeficit = summary.closingBalance < 0;

  const successTone = getToneColors(theme, 'success');
  const errorTone = getToneColors(theme, 'error');
  const subSurface = getSubSurfaceSx(theme);

  // Handlers
  const handleQuickFundSubmit = async (e) => {
    if (e) e.preventDefault();
    const numAmt = parseFloat(quickFundAmount);
    if (!numAmt || numAmt <= 0) {
      alert('Please enter a valid cash amount greater than 0');
      return;
    }
    await addExpenseFund({
      entryType: quickFundType,
      amount: numAmt,
      fundDate: quickFundDate || todayStr,
      receivedFrom: (
        quickFundSource || (quickFundType === 'returned' ? 'Returned to Owner' : 'Owner / Boss')
      ).trim(),
      paymentMethod: quickFundMethod,
      notes: quickFundNotes.trim()
    });
    setQuickFundAmount('');
    setQuickFundNotes('');
    setQuickFundType('received');
    setQuickFundSource('Owner / Boss');
    setQuickFundDate(todayStr);
  };

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

  const cashFundColumns = useMemo(
    () => [
      { id: 'fundDate', label: 'Date', width: 110, render: (row) => <Typography fontWeight={600}>{row.fundDate}</Typography> },
      {
        id: 'entryType',
        label: 'Type',
        width: 120,
        render: (row) => {
          const isRet = row.entryType === 'returned';
          return (
            <Chip
              label={isRet ? 'Returned (-)' : 'Received (+)'}
              size="small"
              color={isRet ? 'error' : 'success'}
              variant="light"
              sx={{ fontWeight: 700 }}
            />
          );
        }
      },
      {
        id: 'receivedFrom',
        label: 'Source / Party',
        render: (row) => <Typography fontWeight={700}>{row.receivedFrom || 'Owner / Boss'}</Typography>
      },
      {
        id: 'paymentMethod',
        label: 'Method',
        width: 145,
        render: (row) => <Chip label={row.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      },
      { id: 'notes', label: 'Notes', render: (row) => <Typography color="text.secondary">{row.notes || '—'}</Typography> },
      {
        id: 'addedBy',
        label: 'Added By',
        width: 135,
        render: (row) => (
          <Typography variant="caption" color="text.secondary">
            {row.addedBy || 'Counter'}
          </Typography>
        )
      },
      {
        id: 'amount',
        label: 'Amount (PKR)',
        align: 'right',
        width: 145,
        render: (row) => {
          const isRet = row.entryType === 'returned';
          return (
            <Typography fontWeight={800} sx={{ color: isRet ? errorTone.main : successTone.main }}>
              {isRet ? '-' : '+'} PKR {(parseFloat(row.amount) || 0).toLocaleString()}
            </Typography>
          );
        }
      }
    ],
    [successTone.main, errorTone.main]
  );

  const expenseColumns = useMemo(
    () => [
      { id: 'srNo', label: 'Sr', width: 56, render: (row) => <Typography color="text.secondary">{row.srNo}</Typography> },
      {
        id: 'expenseDate',
        label: 'Date',
        width: 115,
        render: (row) => (
          <Typography fontWeight={600} whiteSpace="nowrap">
            {row.expenseDate}
          </Typography>
        )
      },
      {
        id: 'title',
        label: 'Title / Description',
        render: (row) => (
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {row.title}
            </Typography>
            {(row.notes || row.addedBy) && (
              <Typography variant="caption" color="text.secondary">
                {[row.notes, row.addedBy ? `By: ${row.addedBy}` : ''].filter(Boolean).join(' • ')}
              </Typography>
            )}
          </Box>
        )
      },
      {
        id: 'category',
        label: 'Category',
        width: 170,
        render: (row) => {
          const toneName = CATEGORY_TONE_MAP[row.category] || 'neutral';
          const chipTone = getToneColors(theme, toneName);
          return <Chip label={row.category || 'General'} size="small" sx={{ fontWeight: 600, bgcolor: chipTone.bg, color: chipTone.main }} />;
        }
      },
      { id: 'paidTo', label: 'Paid To', width: 135, render: (row) => row.paidTo || 'N/A' },
      {
        id: 'paymentMethod',
        label: 'Payment',
        width: 135,
        render: (row) => <Chip label={row.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
      },
      {
        id: 'amount',
        label: 'Amount (PKR)',
        align: 'right',
        width: 145,
        render: (row) => (
          <Typography fontWeight={700} sx={{ color: errorTone.main }}>
            PKR {(parseFloat(row.amount) || 0).toLocaleString()}
          </Typography>
        )
      }
    ],
    [theme, errorTone.main]
  );

  // Rolling Cash Closing Footer Rows rendered seamlessly inside Expenses AppDataTable
  const expenseFooterRows =
    categoryFilteredExpenses.length > 0 || summary.periodFunds.length > 0 || summary.openingBalance !== 0 ? (
      <>
        {selectedCategory !== 'All' && (
          <TableRow sx={{ bgcolor: subSurface.bgcolor, borderTop: '1px solid', borderColor: 'divider' }}>
            <TableCell colSpan={7} align="right" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Filtered Category Total:
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: errorTone.main }}>
              PKR {categorySubtotal.toLocaleString()}
            </TableCell>
            <TableCell />
          </TableRow>
        )}

        {summary.openingBalance !== 0 && (
          <TableRow sx={{ bgcolor: subSurface.bgcolor, borderTop: '1px solid', borderColor: 'divider' }}>
            <TableCell colSpan={7} align="right" sx={{ fontWeight: 700 }}>
              Opening Balance (Previous Days Carryover):
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, color: summary.openingBalance >= 0 ? 'text.primary' : errorTone.main }}>
              PKR {summary.openingBalance.toLocaleString()}
            </TableCell>
            <TableCell />
          </TableRow>
        )}

        <TableRow sx={{ bgcolor: subSurface.bgcolor, borderTop: summary.openingBalance === 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
          <TableCell colSpan={7} align="right" sx={{ fontWeight: 700 }}>
            + Cash Received ({periodInfo.shortLabel}):
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 800, color: successTone.main }}>
            + PKR {summary.periodCashReceived.toLocaleString()}
          </TableCell>
          <TableCell />
        </TableRow>

        {summary.periodCashReturned > 0 && (
          <TableRow sx={{ bgcolor: subSurface.bgcolor }}>
            <TableCell colSpan={7} align="right" sx={{ fontWeight: 700 }}>
              - Cash Returned to Owner ({periodInfo.shortLabel}):
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 800, color: errorTone.main }}>
              - PKR {summary.periodCashReturned.toLocaleString()}
            </TableCell>
            <TableCell />
          </TableRow>
        )}

        <TableRow sx={{ bgcolor: subSurface.bgcolor }}>
          <TableCell colSpan={7} align="right" sx={{ fontWeight: 700 }}>
            - Less: Total Expenses ({periodInfo.shortLabel}):
          </TableCell>
          <TableCell align="right" sx={{ fontWeight: 800, color: errorTone.main }}>
            - PKR {summary.periodExpensesTotal.toLocaleString()}
          </TableCell>
          <TableCell />
        </TableRow>

        <TableRow
          sx={{
            bgcolor: isPeriodDeficit ? errorTone.bg : successTone.bg,
            borderTop: '2px solid',
            borderColor: isPeriodDeficit ? errorTone.main : successTone.main
          }}
        >
          <TableCell colSpan={7} align="right" sx={{ fontWeight: 800, fontSize: '0.95rem' }}>
            {isPeriodDeficit
              ? 'Shortfall / Extra Paid Balance:'
              : 'Remaining / Closing Cash Balance (Carries Forward Next Day):'}
          </TableCell>
          <TableCell
            align="right"
            sx={{ fontWeight: 900, fontSize: '1.05rem', color: isPeriodDeficit ? errorTone.main : successTone.main }}
          >
            PKR {summary.closingBalance.toLocaleString()}
          </TableCell>
          <TableCell />
        </TableRow>
      </>
    ) : null;

  return (
    <Stack spacing={3}>
      {/* 1. REUSABLE PAGE HEADER */}
      <PageHeader
        title="Daily Expenses & Cash Closing"
        subtitle="Log morning/evening cash received, track daily expenses, and roll remaining cash forward automatically."
        count={summary.periodExpenses.length}
        countLabel={`${periodInfo.shortLabel} Vouchers`}
        actions={
          <>
            {selected.length > 0 && (
              <AppButton intent="danger" startIcon={<DeleteOutlined />} onClick={handleBulkDelete}>
                Delete ({selected.length})
              </AppButton>
            )}
            <AppButton
              intent="secondary"
              startIcon={<WalletOutlined />}
              onClick={() => {
                setEditingFund(null);
                setFundDialogOpen(true);
              }}
            >
              Add / Return Cash Popup
            </AppButton>
            <AppButton intent="print" startIcon={<PrinterOutlined />} onClick={() => handleOpenPrint(null)}>
              Print Closing Sheet
            </AppButton>
          </>
        }
        sx={{ mb: 0 }}
      />

      {/* 2. REUSABLE FILTERBAR (Period Selector: Daily / Weekly / 15 Days / Month / Custom / All) */}
      <FilterBar
        hasActiveFilters={dateFilter !== 'today' || selectedCategory !== 'All'}
        onClear={() => {
          setDateFilter('today');
          setSelectedCategory('All');
        }}
        sx={{ mb: 0 }}
      >
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
          <>
            <AppTextField
              type="date"
              size="small"
              fullWidth={false}
              label="From"
              value={customFromDate}
              onChange={(e) => setCustomFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 155 }}
            />
            <AppTextField
              type="date"
              size="small"
              fullWidth={false}
              label="To"
              value={customToDate}
              onChange={(e) => setCustomToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 155 }}
            />
          </>
        )}

        <AppTextField
          select
          size="small"
          fullWidth={false}
          label="Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ width: { xs: '100%', sm: 205 } }}
        >
          <MenuItem value="All">All categories</MenuItem>
          {expenseCategories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
        </AppTextField>
      </FilterBar>

      {/* 3. REUSABLE KPI GRID */}
      <MasterKpiGrid
        kpis={[
          {
            label: `Total Available Cash (${periodInfo.shortLabel})`,
            value: `PKR ${summary.totalAvailableCash.toLocaleString()}`,
            helper: `Opening ${summary.openingBalance.toLocaleString()} + Added ${summary.periodCashReceived.toLocaleString()}`,
            icon: <WalletOutlined />,
            tone: 'success',
            highlightValue: true
          },
          {
            label: `Cash Added (${periodInfo.shortLabel})`,
            value: `PKR ${summary.periodCashReceived.toLocaleString()}`,
            helper:
              summary.periodCashReturned > 0
                ? `${summary.periodFunds.length} entries • Returned: ${summary.periodCashReturned.toLocaleString()}`
                : `${summary.periodFunds.length} top-up${summary.periodFunds.length !== 1 ? 's' : ''} received`,
            icon: <DollarOutlined />,
            tone: 'info',
            highlightValue: true
          },
          {
            label: `Expenses (${periodInfo.shortLabel})`,
            value: `PKR ${summary.periodExpensesTotal.toLocaleString()}`,
            helper: `${summary.periodExpenses.length} expense voucher${summary.periodExpenses.length !== 1 ? 's' : ''}`,
            icon: <FallOutlined />,
            tone: 'error',
            highlightValue: true
          },
          {
            label: `Remaining / Closing Balance`,
            value: `PKR ${summary.closingBalance.toLocaleString()}`,
            helper: isPeriodDeficit ? 'Shortfall / Extra Paid' : 'Carries forward into next day automatically',
            icon: <CheckCircleOutlined />,
            tone: isPeriodDeficit ? 'error' : 'primary',
            highlightValue: true
          }
        ]}
      />

      {/* 4. QUICK INLINE CASH IN HAND ENTRY (UPAR ENTRY FOR MORNING / EVENING / ONLINE CASH) */}
      <MainCard
        title="Add Cash in Hand (Morning / Evening / Online Received)"
        secondary={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {summary.openingBalance !== 0 && (
              <Chip
                label={`Yesterday Carryover: PKR ${summary.openingBalance.toLocaleString()}`}
                size="small"
                color="info"
                variant="light"
                sx={{ fontWeight: 700 }}
              />
            )}
            <Chip
              label={`Live Remaining Balance: PKR ${summary.closingBalance.toLocaleString()}`}
              size="small"
              color={isPeriodDeficit ? 'error' : 'success'}
              variant="light"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        }
        sx={getCardSurfaceSx(theme)}
      >
        <form onSubmit={handleQuickFundSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
              <AppTextField
                select
                label="Entry Type"
                value={quickFundType}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuickFundType(val);
                  setQuickFundSource(val === 'returned' ? 'Returned to Owner / Boss' : 'Owner / Boss');
                }}
              >
                <MenuItem value="received">Cash Received (+)</MenuItem>
                <MenuItem value="returned">Return to Owner (-)</MenuItem>
              </AppTextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.3 }}>
              <AppTextField
                label="Cash Amount (PKR) *"
                type="number"
                placeholder="e.g. 11000"
                value={quickFundAmount}
                onChange={(e) => setQuickFundAmount(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">PKR</InputAdornment>
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.2 }}>
              <AppTextField
                label={quickFundType === 'returned' ? 'Handed Over To' : 'Received From'}
                placeholder="Owner / Boss"
                value={quickFundSource}
                onChange={(e) => setQuickFundSource(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <AppTextField select label="Method" value={quickFundMethod} onChange={(e) => setQuickFundMethod(e.target.value)}>
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </AppTextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 1.8 }}>
              <AppTextField
                label="Date"
                type="date"
                value={quickFundDate}
                onChange={(e) => setQuickFundDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
              <AppButton intent="primary" color={quickFundType === 'returned' ? 'error' : 'success'} type="submit" fullWidth startIcon={<PlusOutlined />}>
                {quickFundType === 'returned' ? 'Return' : 'Add Cash'}
              </AppButton>
            </Grid>
          </Grid>
        </form>
      </MainCard>

      {/* 5. RECORD NEW EXPENSE VOUCHER FORM CARD */}
      <MainCard
        title="Record New Expense Voucher"
        secondary={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              label={`Closing Balance: PKR ${summary.closingBalance.toLocaleString()}`}
              color={isPeriodDeficit ? 'error' : 'success'}
              variant="light"
              size="small"
              sx={{ fontWeight: 700 }}
            />
            {draftAmountVal > 0 && (
              <Chip
                label={`After This Expense: PKR ${projectedAfterDraft.toLocaleString()}`}
                color={projectedAfterDraft < 0 ? 'warning' : 'primary'}
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700 }}
              />
            )}
          </Stack>
        }
        sx={getCardSurfaceSx(theme)}
      >
        <form onSubmit={handleAddExpense}>
          <Grid container spacing={2.5} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                freeSolo
                options={QUICK_EXPENSE_SUGGESTIONS}
                value={title}
                onChange={(_, newValue) => setTitle(typeof newValue === 'string' ? newValue : newValue || '')}
                onInputChange={(_, newInputValue) => setTitle(newInputValue)}
                renderInput={(params) => (
                  <AppTextField
                    {...params}
                    required
                    label="Expense Title / Description *"
                    placeholder="e.g. Daily Staff Lunch & Tea, Generator Petrol, Utility Bill"
                  />
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AppTextField
                  select
                  label="Expense Category *"
                  value={expenseCategories.includes(category) ? category : expenseCategories[0] || 'Miscellaneous & Others'}
                  onChange={(e) => {
                    if (e.target.value === '__add_new_cat__') {
                      setAddCategoryOpen(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                >
                  {expenseCategories.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                  <Divider sx={{ my: 0.5 }} />
                  <MenuItem value="__add_new_cat__" sx={{ color: 'primary.main', fontWeight: 700, bgcolor: 'primary.lighter', py: 1 }}>
                    <PlusOutlined style={{ marginRight: 8 }} /> Add Custom Category...
                  </MenuItem>
                </AppTextField>

                <Tooltip title="Add New Category">
                  <IconButton
                    color="primary"
                    onClick={() => setAddCategoryOpen(true)}
                    sx={{
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 2,
                      height: 42,
                      width: 42,
                      flexShrink: 0,
                      bgcolor: 'primary.lighter'
                    }}
                  >
                    <PlusOutlined />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AppTextField
                label="Amount (PKR) *"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">PKR</InputAdornment>
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <AppTextField
                label="Paid To / Person / Vendor"
                placeholder="e.g. Hotel, PSO Petrol Pump, LESCO, Ali"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <AppTextField select label="Payment Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </AppTextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <AppTextField
                label="Expense Date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
              <AppTextField
                label="Notes / Receipt Ref #"
                placeholder="Optional voucher details"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, pt: 2.5 }}>
            <AppButton intent="cancel" startIcon={<ClearOutlined />} onClick={handleClearForm}>
              Clear Form
            </AppButton>
            <AppButton intent="primary" type="submit" startIcon={<PlusOutlined />}>
              Save Expense Voucher
            </AppButton>
          </Box>
        </form>
      </MainCard>

      {/* 6. EXPENSES HISTORY & ROLLING CLOSING REGISTER VIA APPDATATABLE */}
      <AppDataTable
        columns={expenseColumns}
        data={categoryFilteredExpenses}
        selectable
        selected={selected}
        onSelect={setSelected}
        searchPlaceholder="Search title, person, notes..."
        searchKeys={['title', 'paidTo', 'notes', 'category', 'expenseDate']}
        emptyTitle={`No Expense Records for ${periodInfo.label}`}
        emptySubtitle="Recorded expense vouchers for this timeframe will appear here alongside your closing balance calculation."
        footerRows={expenseFooterRows}
        toolbarRight={
          <Stack direction="row" spacing={1} alignItems="center">
            {selected.length > 0 && (
              <AppButton intent="danger" size="small" startIcon={<DeleteOutlined />} onClick={handleBulkDelete}>
                Delete ({selected.length})
              </AppButton>
            )}
            <AppButton intent="secondary" size="small" startIcon={<PrinterOutlined />} onClick={() => handleOpenPrint(null)}>
              Print Closing Sheet
            </AppButton>
          </Stack>
        }
        actions={(row) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="Print Voucher">
              <IconButton size="small" color="primary" onClick={() => handleOpenPrint(row)}>
                <PrinterOutlined style={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Expense">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete "${row.title}"?`)) {
                    deleteExpense(row.id);
                  }
                }}
              >
                <DeleteOutlined style={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      />

      {/* 7. COMPANY CASH RECEIVED & HANDOVERS HISTORY VIA APPDATATABLE */}
      <AppDataTable
        columns={cashFundColumns}
        data={summary.periodFunds}
        searchable={false}
        defaultRowsPerPage={5}
        rowsPerPageOptions={[5, 10, 25]}
        emptyTitle="No Cash Entries in Selected Period"
        emptySubtitle={`No cash received or handover recorded inside ${periodInfo.label}. Use the "Add Cash in Hand" box above anytime cash arrives.`}
        toolbarLeft={
          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap">
            <WalletOutlined style={{ color: successTone.main, fontSize: 18 }} />
            <Typography variant="h5" fontWeight={700}>
              Cash Received &amp; Handovers ({periodInfo.shortLabel})
            </Typography>
            <Chip
              label={`${summary.periodFunds.length} entry${summary.periodFunds.length === 1 ? '' : 's'} • +PKR ${summary.periodCashReceived.toLocaleString()}`}
              size="small"
              color="success"
              variant="light"
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        }
        toolbarRight={
          <AppButton
            intent="secondary"
            size="small"
            startIcon={<PlusOutlined />}
            onClick={() => {
              setEditingFund(null);
              setFundDialogOpen(true);
            }}
          >
            Add / Return Cash
          </AppButton>
        }
        actions={(row) => (
          <Stack direction="row" spacing={0.5} justifyContent="center">
            <Tooltip title="Edit Cash Entry">
              <IconButton
                size="small"
                color="primary"
                onClick={() => {
                  setEditingFund(row);
                  setFundDialogOpen(true);
                }}
              >
                <EditOutlined style={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Cash Entry">
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  if (window.confirm(`Delete Cash entry of PKR ${(parseFloat(row.amount) || 0).toLocaleString()}?`)) {
                    deleteExpenseFund(row.id);
                  }
                }}
              >
                <DeleteOutlined style={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      />

      {/* 8. CASH IN HAND ENTRY / EDIT FORMDIALOG */}
      <CashInHandDialog
        open={fundDialogOpen}
        onClose={() => {
          setFundDialogOpen(false);
          setEditingFund(null);
        }}
        onSave={handleSaveCashFund}
        editingFund={editingFund}
      />

      {/* 9. PRINTABLE CLOSING STATEMENT VIA UNIVERSALPRINTMODAL */}
      <ExpensePrintDialog
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        selectedExpenseForPrint={selectedExpenseForPrint}
        periodInfo={periodInfo}
        periodFunds={summary.periodFunds}
        filteredExpenses={categoryFilteredExpenses}
        openingBalance={summary.openingBalance}
        periodCashReceived={summary.periodCashReceived}
        periodCashReturned={summary.periodCashReturned}
        totalAvailableCash={summary.totalAvailableCash}
        periodExpensesTotal={summary.periodExpensesTotal}
        filteredTotal={categorySubtotal}
        closingBalance={summary.closingBalance}
      />

      {/* 10. ADD / MANAGE EXPENSE CATEGORY FORMDIALOG */}
      <FormDialog
        open={addCategoryOpen}
        onClose={() => setAddCategoryOpen(false)}
        onSubmit={handleSaveNewCategory}
        maxWidth="xs"
        title={
          <Stack direction="row" spacing={1} alignItems="center">
            <PlusOutlined />
            <span>Add Expense Category</span>
          </Stack>
        }
        subtitle="Create custom categories synced automatically across cloud devices."
        saveText="Save & Select Category"
        saveButtonProps={{ startIcon: <PlusOutlined /> }}
      >
        <Stack spacing={2.5}>
          <AppTextField
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
      </FormDialog>
    </Stack>
  );
}
