import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Snackbar,
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
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BookOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  WalletOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';
import { AppButton, MasterKpiGrid, PageHeader } from 'components/common';
import PaymentVoucherDialog from 'components/machine/PaymentVoucherDialog';
import CustomerLedgerPrintModals from 'sections/ledger/CustomerLedgerPrintModals';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import { getTodayISO, isRecordInDateRange } from 'utils/ledgerHelpers';
import { formatCleanVoucherNotes, formatFullDate, formatInvoiceNo } from 'utils/machineLedgerHelpers';

const tableHeadCellSx = getTableHeadCellSx();

/**
 * Shared Payments & Balances workspace powering Machine Payments, Shop Payments, and Store Payments.
 * Supports Receivables, Payable Balances, Daily Cashbook, Voucher Printing, and Reversal.
 */
export default function PaymentsWorkspace({
  mode = 'customer',
  title = 'Payments & Balances',
  subtitle = "Track who owes money to collect, advance credits to refund, and today's cash receipts & payouts.",
  ledgerPath = '/inventory/customer-ledgers',
  ledgerButtonLabel = 'Full Customer Ledgers',
  statementTitle = 'Official Customer Account Statement',
  customerLedgers = [],
  customerDirectory = [],
  customerPayments = [],
  canDelete = true,
  onAddPayment,
  onDeletePayment
}) {
  const theme = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('receivable');
  const [searchTerm, setSearchTerm] = useState('');
  const [cashbookPeriod, setCashbookPeriod] = useState('today');
  const [cashbookType, setCashbookType] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherInitData, setVoucherInitData] = useState(null);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printCustomerData, setPrintCustomerData] = useState(null);
  const [printVoucherModalOpen, setPrintVoucherModalOpen] = useState(false);
  const [printVoucherData, setPrintVoucherData] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  useEffect(() => {
    setPage(0);
  }, [activeTab, searchTerm, cashbookPeriod, cashbookType]);

  const receivableAccounts = useMemo(() => customerLedgers.filter((c) => c.netBalance > 0), [customerLedgers]);

  const payableAccounts = useMemo(
    () => customerLedgers.filter((c) => c.netBalance < 0).sort((a, b) => a.netBalance - b.netBalance),
    [customerLedgers]
  );

  const todayISO = getTodayISO();

  const summary = useMemo(() => {
    const totalReceivable = receivableAccounts.reduce((s, c) => s + c.netBalance, 0);
    const totalPayable = payableAccounts.reduce((s, c) => s + Math.abs(c.netBalance), 0);

    let collectedToday = 0;
    let todayReceiptsCount = 0;
    let paidOutToday = 0;
    let todayPayoutsCount = 0;

    (customerPayments || []).forEach((p) => {
      if (!isRecordInDateRange({ createdAt: p.createdAt, dateISO: p.dateISO, time: p.time }, todayISO, todayISO)) return;
      const amt = parseFloat(p.amountPaid) || 0;
      if (p.entryType === 'Payout') {
        paidOutToday += amt;
        todayPayoutsCount += 1;
      } else if (p.entryType !== 'Adjustment') {
        collectedToday += amt;
        todayReceiptsCount += 1;
      }
    });

    return {
      totalReceivable,
      totalPayable,
      collectedToday,
      todayReceiptsCount,
      paidOutToday,
      todayPayoutsCount
    };
  }, [receivableAccounts, payableAccounts, customerPayments, todayISO]);

  const filteredReceivables = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return receivableAccounts.filter(
      (c) => !q || c.customerName.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    );
  }, [receivableAccounts, searchTerm]);

  const filteredPayables = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return payableAccounts.filter(
      (c) => !q || c.customerName.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)
    );
  }, [payableAccounts, searchTerm]);

  const filteredCashbook = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (customerPayments || [])
      .filter((p) => {
        if (cashbookPeriod === 'today' && !isRecordInDateRange({ createdAt: p.createdAt, dateISO: p.dateISO, time: p.time }, todayISO, todayISO)) {
          return false;
        }
        const eType = p.entryType || 'Receipt';
        if (cashbookType !== 'all' && eType !== cashbookType) return false;
        if (!q) return true;
        return [p.voucherNo, p.customerName, p.referenceLabel, p.paymentMethod, p.referenceNo, p.notes].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => new Date(b.createdAt || b.dateISO || 0) - new Date(a.createdAt || a.dateISO || 0));
  }, [customerPayments, cashbookPeriod, todayISO, cashbookType, searchTerm]);

  const activeRows = activeTab === 'receivable' ? filteredReceivables : activeTab === 'payable' ? filteredPayables : filteredCashbook;
  const paginatedRows = activeRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleOpenVoucher = (customerName = '', entryType = 'Receipt', amount = '') => {
    setVoucherInitData({
      customerName,
      entryType,
      refSelection: 'ACCOUNT',
      amountPaid: amount ? String(amount) : '',
      fromHeaderButton: !customerName
    });
    setVoucherOpen(true);
  };

  const handleSaveVoucher = async (payload) => {
    try {
      const createdVoucher = await onAddPayment({
        customerName: payload.customerName,
        entryType: payload.entryType,
        referenceType: payload.referenceType,
        invoiceId: payload.invoiceId,
        repairId: payload.repairId,
        referenceLabel: payload.referenceLabel,
        amountPaid: payload.amountPaid,
        paymentMethod: payload.paymentMethod,
        referenceNo: payload.referenceNo,
        notes: payload.notes
      });

      showToast(
        `${payload.entryType === 'Payout' ? 'Cash payout' : payload.entryType === 'Adjustment' ? 'Discount adjustment' : 'Payment received'} of ${formatPKR(payload.amountPaid)} recorded for ${payload.customerName}!`
      );
      setVoucherOpen(false);

      if (voucherInitData?.fromHeaderButton) {
        setCashbookPeriod('today');
        setCashbookType('all');
        setActiveTab('cashbook');
      }

      if (payload.shouldPrint && createdVoucher) {
        setPrintVoucherData({
          ...createdVoucher,
          phone: payload.customerLedger?.phone || '',
          city: payload.customerLedger?.city || '',
          matchedInvoices: payload.customerLedger?.invoices || [],
          remainingAccountBalance: payload.remainingAccountBalance
        });
        setPrintVoucherModalOpen(true);
      }
    } catch (err) {
      showToast('Failed to record payment entry. Please try again.', 'error');
      throw err;
    }
  };

  const handleConfirmDeleteVoucher = async () => {
    if (!voucherToDelete) return;
    await onDeletePayment(voucherToDelete.id, voucherToDelete);
    showToast(`Voucher ${formatInvoiceNo(voucherToDelete)} reversed & deleted.`);
    setVoucherToDelete(null);
  };

  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');
  const warningTone = getToneColors(theme, 'warning');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <PageHeader
          title={title}
          subtitle={subtitle}
          actions={
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <AppButton intent="secondary" startIcon={<BookOutlined />} onClick={() => navigate(ledgerPath)}>
                {ledgerButtonLabel}
              </AppButton>
              <AppButton intent="primary" startIcon={<DollarOutlined />} onClick={() => handleOpenVoucher('', 'Receipt', '')}>
                Record Payment / Payout
              </AppButton>
            </Box>
          }
          sx={{ mb: 2 }}
        />

        <MasterKpiGrid
          kpis={[
            {
              label: 'Receivable (To Collect)',
              value: formatPKR(summary.totalReceivable),
              helper:
                receivableAccounts.length > 0 ? `${receivableAccounts.length} customer(s) with pending due` : 'All receivables collected',
              icon: <ArrowDownOutlined />,
              tone: summary.totalReceivable > 0 ? 'error' : 'success',
              highlightValue: summary.totalReceivable > 0,
              onClick: () => setActiveTab('receivable')
            },
            {
              label: 'Payable (To Return)',
              value: formatPKR(summary.totalPayable),
              helper:
                payableAccounts.length > 0 ? `${payableAccounts.length} customer advance / refund balance(s)` : 'No advances payable',
              icon: <ArrowUpOutlined />,
              tone: summary.totalPayable > 0 ? 'warning' : 'neutral',
              highlightValue: summary.totalPayable > 0,
              onClick: () => setActiveTab('payable')
            },
            {
              label: 'Collected Today',
              value: formatPKR(summary.collectedToday),
              helper: `${summary.todayReceiptsCount} receipt(s) received today`,
              icon: <CheckCircleOutlined />,
              tone: 'success',
              highlightValue: summary.collectedToday > 0,
              onClick: () => {
                setCashbookPeriod('today');
                setCashbookType('Receipt');
                setActiveTab('cashbook');
              }
            },
            {
              label: 'Paid Out Today',
              value: formatPKR(summary.paidOutToday),
              helper: `${summary.todayPayoutsCount} cash refund / payout(s) today`,
              icon: <WalletOutlined />,
              tone: 'primary',
              onClick: () => {
                setCashbookPeriod('today');
                setCashbookType('Payout');
                setActiveTab('cashbook');
              }
            }
          ]}
        />
      </Box>

      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              mb: 2
            }}
          >
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', flexWrap: 'wrap', p: 0.5, borderRadius: 2, gap: 0.5 })}>
              {[
                { key: 'receivable', label: `To Collect — Receivable (${receivableAccounts.length})` },
                { key: 'payable', label: `To Return — Payable (${payableAccounts.length})` },
                { key: 'cashbook', label: `Daily Cashbook (${customerPayments.length})` }
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Box
                    key={tab.key}
                    component="button"
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
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

            {activeTab === 'cashbook' && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                <Chip
                  label="Today Only"
                  size="small"
                  clickable
                  color={cashbookPeriod === 'today' ? 'primary' : 'default'}
                  variant={cashbookPeriod === 'today' ? 'light' : 'outlined'}
                  onClick={() => setCashbookPeriod('today')}
                  sx={{ fontWeight: cashbookPeriod === 'today' ? 700 : 500 }}
                />
                <Chip
                  label="All Dates"
                  size="small"
                  clickable
                  color={cashbookPeriod === 'all' ? 'primary' : 'default'}
                  variant={cashbookPeriod === 'all' ? 'light' : 'outlined'}
                  onClick={() => setCashbookPeriod('all')}
                  sx={{ fontWeight: cashbookPeriod === 'all' ? 700 : 500 }}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <OutlinedInput
              size="small"
              placeholder={
                activeTab === 'cashbook'
                  ? 'Search by voucher #, customer, reference or notes...'
                  : 'Search customer by name, phone, or city...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
            />

            {activeTab === 'cashbook' && (
              <TextField
                select
                size="small"
                value={cashbookType}
                onChange={(e) => setCashbookType(e.target.value)}
                sx={{ width: { xs: '100%', sm: 210 } }}
              >
                <MenuItem value="all">All Transaction Types</MenuItem>
                <MenuItem value="Receipt">Payment Received (Cash In)</MenuItem>
                <MenuItem value="Payout">Cash Paid / Refund (Cash Out)</MenuItem>
                <MenuItem value="Adjustment">Discount / Adjustment</MenuItem>
              </TextField>
            )}

            <AppButton
              intent="cancel"
              size="small"
              startIcon={<ReloadOutlined />}
              onClick={() => {
                setSearchTerm('');
                setCashbookPeriod('today');
                setCashbookType('all');
              }}
            >
              Reset
            </AppButton>
          </Box>
        </Box>

        {(activeTab === 'receivable' || activeTab === 'payable') && (
          <TableContainer>
            <Table sx={{ minWidth: 880 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: getSubSurfaceSx(theme).bgcolor,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <TableCell sx={{ ...tableHeadCellSx, pl: 2.5 }}>Customer</TableCell>
                  <TableCell sx={tableHeadCellSx}>Open Bills &amp; References</TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    Total Billed
                  </TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    Total Credited
                  </TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    {activeTab === 'receivable' ? 'Amount Receivable' : 'Amount Payable'}
                  </TableCell>
                  <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <CheckCircleOutlined style={{ fontSize: 36, color: successTone.main, display: 'block', margin: '0 auto 8px' }} />
                      <Typography variant="h6" fontWeight={700} color="text.secondary">
                        {activeTab === 'receivable'
                          ? 'No pending customer receivables to collect'
                          : 'No advance credits or refunds payable to customers'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        All active party accounts in this category are currently clear.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((cust) => {
                    const openDocs = (cust.invoices || []).filter((inv) => inv.balanceAmount > 0);
                    const amountDueOrCredit = Math.abs(cust.netBalance);

                    return (
                      <TableRow key={cust.key} hover sx={{ '& td': { py: 1.75 } }}>
                        <TableCell sx={{ pl: 2.5 }}>
                          <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                            {cust.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {cust.phone || 'No Phone'} • {cust.city || 'Retail Counter'}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 280 }}>
                          {openDocs.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                              {openDocs.slice(0, 3).map((doc) => (
                                <Chip
                                  key={`${doc.recordType}-${doc.id}`}
                                  size="small"
                                  variant="outlined"
                                  label={`${formatInvoiceNo(doc)} (${formatPKR(doc.balanceAmount)})`}
                                  sx={{ fontSize: '0.75rem', height: 22 }}
                                />
                              ))}
                              {openDocs.length > 3 && (
                                <Chip
                                  size="small"
                                  variant="light"
                                  color="primary"
                                  label={`+${openDocs.length - 3} more`}
                                  sx={{ fontSize: '0.75rem', height: 22, fontWeight: 700 }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {cust.openingBalance !== 0 ? 'Opening Balance / On-Account Balance' : 'On-Account Ledger Balance'}
                            </Typography>
                          )}
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatPKR(cust.totalDebit)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={600} sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                            {formatPKR(cust.totalCredit)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          <Typography
                            variant="subtitle1"
                            fontWeight={700}
                            sx={{
                              fontVariantNumeric: 'tabular-nums',
                              color: activeTab === 'receivable' ? errorTone.main : warningTone.main
                            }}
                          >
                            {formatPKR(amountDueOrCredit)}
                          </Typography>
                        </TableCell>

                        <TableCell align="center" sx={{ pr: 2.5 }}>
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                            <AppButton
                              size="small"
                              intent={activeTab === 'receivable' ? 'primary' : 'secondary'}
                              startIcon={<DollarOutlined />}
                              onClick={() =>
                                handleOpenVoucher(cust.customerName, activeTab === 'receivable' ? 'Receipt' : 'Payout', amountDueOrCredit)
                              }
                            >
                              {activeTab === 'receivable' ? 'Receive Payment' : 'Return / Pay Cash'}
                            </AppButton>

                            <Tooltip title="View Complete Customer Ledger">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`${ledgerPath}?customer=${encodeURIComponent(cust.customerName)}`)}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1.5,
                                  color: 'text.secondary',
                                  '&:hover': { bgcolor: primaryTone.bg, color: primaryTone.main, borderColor: primaryTone.border }
                                }}
                              >
                                <BookOutlined style={{ fontSize: 13 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Print Statement">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setPrintCustomerData(cust);
                                  setPrintModalOpen(true);
                                }}
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
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {activeTab === 'cashbook' && (
          <TableContainer>
            <Table sx={{ minWidth: 880 }}>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: getSubSurfaceSx(theme).bgcolor,
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <TableCell sx={{ ...tableHeadCellSx, pl: 2.5 }}>Voucher #</TableCell>
                  <TableCell sx={tableHeadCellSx}>Date &amp; Time</TableCell>
                  <TableCell sx={tableHeadCellSx}>Customer</TableCell>
                  <TableCell sx={tableHeadCellSx}>Type</TableCell>
                  <TableCell sx={tableHeadCellSx}>Applied To &amp; Notes</TableCell>
                  <TableCell sx={tableHeadCellSx}>Method</TableCell>
                  <TableCell align="right" sx={tableHeadCellSx}>
                    Amount
                  </TableCell>
                  <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <WalletOutlined
                        style={{ fontSize: 36, color: theme.palette.text.disabled, display: 'block', margin: '0 auto 8px' }}
                      />
                      <Typography variant="h6" fontWeight={700} color="text.secondary">
                        No payment vouchers found {cashbookPeriod === 'today' ? 'for today' : ''}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Switch to &ldquo;All Dates&rdquo; or record a new payment/payout above.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRows.map((v) => {
                    const eType = v.entryType || 'Receipt';
                    const isPayout = eType === 'Payout';
                    const isAdj = eType === 'Adjustment';
                    const custLedger = customerLedgers.find((c) => c.customerName.toLowerCase() === (v.customerName || '').toLowerCase());

                    return (
                      <TableRow key={v.id} hover sx={{ '& td': { py: 1.6 } }}>
                        <TableCell sx={{ pl: 2.5 }}>
                          <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                            {formatInvoiceNo(v)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                            {formatFullDate(v.time, v.createdAt || v.dateISO)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                            {v.customerName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              isPayout
                                ? v.source === 'vendor_payment'
                                  ? 'Paid to Vendor'
                                  : 'Paid Out (Refund)'
                                : isAdj
                                  ? 'Discount Adj'
                                  : 'Payment Received'
                            }
                            size="small"
                            color={isPayout ? 'error' : isAdj ? 'warning' : 'success'}
                            variant="light"
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 260 }}>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {v.referenceLabel || 'General Account'}
                          </Typography>
                          {(v.referenceNo || v.notes) && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {[v.referenceNo ? `Ref: ${v.referenceNo}` : '', formatCleanVoucherNotes(v.notes)].filter(Boolean).join(' • ')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip label={v.paymentMethod || 'Cash'} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{
                              fontVariantNumeric: 'tabular-nums',
                              color: isPayout ? errorTone.main : isAdj ? warningTone.main : successTone.main
                            }}
                          >
                            {isPayout ? '-' : '+'} {formatPKR(v.amountPaid)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ pr: 2.5 }}>
                          <Box sx={{ display: 'inline-flex', gap: 0.75 }}>
                            <Tooltip title="Print Voucher Receipt">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setPrintVoucherData({
                                    ...v,
                                    phone: custLedger?.phone || '',
                                    city: custLedger?.city || '',
                                    matchedInvoices: custLedger?.invoices || [],
                                    remainingAccountBalance: Math.abs(custLedger?.netBalance ?? 0)
                                  });
                                  setPrintVoucherModalOpen(true);
                                }}
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
                            {canDelete && (
                              <Tooltip title="Reverse & Delete Voucher">
                                <IconButton
                                  size="small"
                                  onClick={() => setVoucherToDelete(v)}
                                  sx={{
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1.5,
                                    color: 'text.secondary',
                                    '&:hover': { bgcolor: errorTone.bg, color: errorTone.main, borderColor: errorTone.border }
                                  }}
                                >
                                  <DeleteOutlined style={{ fontSize: 13 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={activeRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </MainCard>

      <PaymentVoucherDialog
        open={voucherOpen}
        onClose={() => setVoucherOpen(false)}
        initialData={voucherInitData}
        customerDirectory={customerDirectory}
        customerLedgers={customerLedgers}
        onSaveVoucher={handleSaveVoucher}
      />

      <Dialog open={Boolean(voucherToDelete)} onClose={() => setVoucherToDelete(null)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reverse &amp; Delete Voucher?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Deleting voucher <strong>{voucherToDelete ? formatInvoiceNo(voucherToDelete) : ''}</strong> (
            {formatPKR(voucherToDelete?.amountPaid || 0)}) will automatically restore the linked invoice balance. Continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setVoucherToDelete(null)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDeleteVoucher}>
            Reverse &amp; Delete
          </AppButton>
        </DialogActions>
      </Dialog>

      <CustomerLedgerPrintModals
        mode={mode === 'store' ? 'store' : 'machine'}
        printModalOpen={printModalOpen}
        setPrintModalOpen={setPrintModalOpen}
        printCustomerData={printCustomerData}
        statementTitle={statementTitle}
        printVoucherModalOpen={printVoucherModalOpen}
        setPrintVoucherModalOpen={setPrintVoucherModalOpen}
        printVoucherData={printVoucherData}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

PaymentsWorkspace.propTypes = {
  mode: PropTypes.oneOf(['customer', 'store']),
  title: PropTypes.string,
  subtitle: PropTypes.string,
  ledgerPath: PropTypes.string,
  ledgerButtonLabel: PropTypes.string,
  statementTitle: PropTypes.string,
  customerLedgers: PropTypes.array.isRequired,
  customerDirectory: PropTypes.array.isRequired,
  customerPayments: PropTypes.array.isRequired,
  canDelete: PropTypes.bool,
  onAddPayment: PropTypes.func.isRequired,
  onDeletePayment: PropTypes.func.isRequired
};

