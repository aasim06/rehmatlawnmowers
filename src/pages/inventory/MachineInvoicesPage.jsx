import { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
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

// icons
import {
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  ToolOutlined,
  WarningOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import { AppButton, ConfirmDialog, MasterKpiGrid, PageHeader, UniversalPrintModal } from 'components/common';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';
import { getCardSurfaceSx, getSubSurfaceSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import {
  formatFullDate,
  formatInvoiceNo,
  formatItemsSummaryLabel,
  normalizeMachineItems,
  resolveAllocatedInvoiceMap,
  resolveRecordTimestamp,
  resolveRepairFinancials,
  resolveSaleFinancials
} from 'utils/machineLedgerHelpers';

const tableHeadCellSx = getTableHeadCellSx();

const getPaymentStatusColor = (status) => {
  if (status === 'Paid') return 'success';
  if (status === 'Partial') return 'warning';
  return 'error';
};

export default function MachineInvoicesPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { canDelete, canEditPrice } = usePermission();

  const {
    machineSales = [],
    machineRepairs = [],
    machineModels = [],
    machineCustomers = [],
    customerPayments = [],
    addCustomerPayment,
    updateMachineSale,
    deleteMachineSale,
    deleteMachineRepair
  } = useStoreInventory();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all'); // all | Sale | Repair
  const [filterPeriod, setFilterPeriod] = useState('all'); // all | today | week | month
  const [filterPayment, setFilterPayment] = useState('all'); // all | Paid | Partial | Unpaid
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Notification
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  // Modals & Drawers
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printVoucherData, setPrintVoucherData] = useState(null);

  // Payment Voucher Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBillForPay, setSelectedBillForPay] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    entryType: 'Receipt',
    amountPaid: '',
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);

  // Unified Sales + Repair Job Bills (reconciled with customer on-account vouchers)
  const unifiedBills = useMemo(() => {
    const allocationMap = resolveAllocatedInvoiceMap({
      machineCustomers,
      machineSales,
      machineRepairs,
      customerPayments
    });

    const salesList = (machineSales || []).map((sale) => {
      const fin = resolveSaleFinancials(sale, customerPayments);
      const alloc = allocationMap.get(`Sale:${sale.id}`);
      const rawItems = normalizeMachineItems(sale);
      const paidAmount = alloc ? alloc.paidAmount : fin.paidAmount;
      const balanceAmount = alloc ? alloc.balanceAmount : fin.balanceAmount;
      const statusNorm = alloc ? alloc.paymentStatus : fin.paymentStatus;
      return {
        uid: `Sale-${sale.id}`,
        id: sale.id,
        sourceType: 'Sale',
        docNo: formatInvoiceNo(sale),
        customerName: sale.customerName || 'Walk-in Customer',
        customerPhone: sale.customerPhone || '',
        cityAddress: sale.cityAddress || '',
        itemsSummary: rawItems.map((i) => `${i.name} (x${i.qty})`).join(', ') || 'Machine Sale',
        itemsCount: rawItems.length,
        billTotal: fin.billTotal,
        paidAmount,
        allocatedFromAccount: alloc ? alloc.allocatedFromAccount : 0,
        balanceAmount,
        paymentStatus: statusNorm,
        filterStatus: statusNorm,
        dateLabel: formatFullDate(sale.time, sale.dateISO),
        sortTime: resolveRecordTimestamp(sale),
        raw: sale
      };
    });

    const repairList = (machineRepairs || []).map((rep) => {
      const fin = resolveRepairFinancials(rep, customerPayments);
      const alloc = allocationMap.get(`Repair:${rep.id}`);
      const rawItems = normalizeMachineItems({ ...rep, recordType: 'Repair' });
      const paidAmount = alloc ? alloc.paidAmount : fin.paidAmount;
      const balanceAmount = alloc ? alloc.balanceAmount : fin.balanceAmount;
      const normalizedStatus = alloc
        ? alloc.paymentStatus
        : fin.balanceAmount <= 0 && fin.netTotal > 0
          ? 'Paid'
          : fin.paidAmount > 0
            ? 'Partial'
            : 'Unpaid';
      return {
        uid: `Repair-${rep.id}`,
        id: rep.id,
        sourceType: 'Repair',
        docNo: formatInvoiceNo(rep),
        customerName: rep.customerName || 'Walk-in Customer',
        customerPhone: rep.customerPhone || '',
        cityAddress: rep.cityAddress || '',
        itemsSummary: `${rep.machineName || 'Machine Repair'} • ${rep.repairStatus || 'Received'}`,
        itemsCount: rawItems.length,
        billTotal: fin.netTotal,
        paidAmount,
        allocatedFromAccount: alloc ? alloc.allocatedFromAccount : 0,
        balanceAmount,
        paymentStatus: normalizedStatus,
        filterStatus: normalizedStatus,
        dateLabel: formatFullDate(rep.receivedDate, rep.dateISO),
        sortTime: resolveRecordTimestamp(rep),
        raw: rep
      };
    });

    return [...salesList, ...repairList].sort((a, b) => b.sortTime - a.sortTime);
  }, [machineCustomers, machineSales, machineRepairs, customerPayments]);

  const kpiSummary = useMemo(() => {
    const totalBilled = unifiedBills.reduce((s, b) => s + b.billTotal, 0);
    const totalPaid = unifiedBills.reduce((s, b) => s + b.paidAmount, 0);
    const totalDue = unifiedBills.reduce((s, b) => s + b.balanceAmount, 0);
    const dueCount = unifiedBills.filter((b) => b.balanceAmount > 0).length;
    return {
      totalCount: unifiedBills.length,
      salesCount: unifiedBills.filter((b) => b.sourceType === 'Sale').length,
      repairCount: unifiedBills.filter((b) => b.sourceType === 'Repair').length,
      totalBilled,
      totalPaid,
      totalDue,
      dueCount
    };
  }, [unifiedBills]);

  const filteredBills = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 6 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return unifiedBills.filter((bill) => {
      if (sourceFilter !== 'all' && bill.sourceType !== sourceFilter) return false;
      if (filterPayment !== 'all' && bill.filterStatus.toLowerCase() !== filterPayment.toLowerCase()) return false;

      if (filterPeriod !== 'all' && bill.sortTime > 0) {
        if (filterPeriod === 'today' && bill.sortTime < startOfToday) return false;
        if (filterPeriod === 'week' && bill.sortTime < sevenDaysAgo) return false;
        if (filterPeriod === 'month' && bill.sortTime < startOfMonth) return false;
      }

      if (term) {
        const hay = [bill.docNo, bill.customerName, bill.customerPhone, bill.cityAddress, bill.itemsSummary]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }

      return true;
    });
  }, [unifiedBills, sourceFilter, filterPayment, filterPeriod, searchTerm]);

  const paginatedBills = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredBills.slice(start, start + rowsPerPage);
  }, [filteredBills, page, rowsPerPage]);

  const handleOpenPaymentModal = (bill) => {
    setSelectedBillForPay(bill);
    setPaymentForm({
      entryType: 'Receipt',
      amountPaid: bill.balanceAmount > 0 ? String(bill.balanceAmount) : '',
      paymentMethod: 'Cash',
      referenceNo: '',
      notes: ''
    });
    setPaymentModalOpen(true);
  };

  const submitPaymentVoucher = async (shouldPrintReceipt = false) => {
    if (!selectedBillForPay || savingPayment) return;
    const paidNum = parseFloat(paymentForm.amountPaid) || 0;
    if (paidNum <= 0) {
      showToast('Please enter a valid positive payment amount', 'error');
      return;
    }

    setSavingPayment(true);
    try {
      const isRepair = selectedBillForPay.sourceType === 'Repair';
      const createdVoucher = await addCustomerPayment({
        customerName: selectedBillForPay.customerName,
        entryType: paymentForm.entryType,
        referenceType: isRepair ? 'Repair' : 'Sale',
        invoiceId: isRepair ? '' : selectedBillForPay.id,
        repairId: isRepair ? selectedBillForPay.id : '',
        referenceLabel: selectedBillForPay.docNo,
        amountPaid: paidNum,
        paymentMethod: paymentForm.entryType === 'Adjustment' ? 'Discount / Waiver' : paymentForm.paymentMethod,
        referenceNo: paymentForm.referenceNo,
        notes: paymentForm.notes
      });

      showToast(
        `${paymentForm.entryType === 'Adjustment' ? 'Settlement discount' : 'Payment'} of ${formatPKR(paidNum)} recorded for ${selectedBillForPay.docNo}!`
      );
      setPaymentModalOpen(false);

      if (shouldPrintReceipt && createdVoucher) {
        setPrintVoucherData({
          ...createdVoucher,
          billTotal: selectedBillForPay.billTotal,
          previousPaid: selectedBillForPay.paidAmount,
          newBalance: Math.max(0, selectedBillForPay.balanceAmount - paidNum),
          customerPhone: selectedBillForPay.customerPhone,
          cityAddress: selectedBillForPay.cityAddress
        });
      }
    } catch (err) {
      console.error('Payment collection error:', err);
      showToast('Failed to record payment', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleOpenEdit = (bill) => {
    if (bill.sourceType !== 'Sale') {
      navigate('/inventory/machine-repairs');
      return;
    }
    const sale = bill.raw;
    const itemsArray =
      sale.items && sale.items.length > 0
        ? sale.items.map((i) => ({ ...i }))
        : [
          {
            machineName: sale.machineName || '',
            serialNo: sale.serialNo || '',
            qty: sale.qty || 1,
            unitPrice: sale.unitPrice || 0,
            discount: sale.discount || 0
          }
        ];

    setEditingSale({
      ...sale,
      items: itemsArray,
      paidAmount: bill.paidAmount,
      customerName: sale.customerName || '',
      customerPhone: sale.customerPhone || '',
      cityAddress: sale.cityAddress || '',
      warrantyTerms: sale.warrantyTerms || '1 Year Motor & Frame Free Service Warranty'
    });
    setEditDrawerOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingSale) return;

    const itemsList = editingSale.items.map((i) => {
      const q = Math.max(1, parseInt(i.qty, 10) || 1);
      const p = Math.max(0, parseFloat(i.unitPrice) || 0);
      const discPercent = Math.min(100, Math.max(0, parseFloat(i.discount) || 0));
      const gross = q * p;
      const discAmount = (gross * discPercent) / 100;
      const lineTotal = Math.max(0, gross - discAmount);
      return {
        machineName: i.machineName || 'Machine',
        serialNo: i.serialNo || '',
        qty: q,
        unitPrice: p,
        discount: discPercent,
        discountAmount: discAmount,
        lineTotal
      };
    });

    const subTotal = itemsList.reduce((sum, i) => sum + i.lineTotal, 0);
    const discSum = itemsList.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
    const total = subTotal;
    const totalQtySum = itemsList.reduce((sum, i) => sum + i.qty, 0);
    const paid = Math.max(0, parseFloat(editingSale.paidAmount) || 0);
    const bal = Math.max(0, total - paid);
    const status = total > 0 && paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    const firstMachine = itemsList[0] || {};

    try {
      await updateMachineSale(editingSale.id, {
        customerName: editingSale.customerName,
        customerPhone: editingSale.customerPhone,
        cityAddress: editingSale.cityAddress,
        items: itemsList,
        machineName: formatItemsSummaryLabel(itemsList, 'Machine'),
        serialNo: firstMachine.serialNo,
        qty: totalQtySum,
        unitPrice: firstMachine.unitPrice,
        subTotal,
        discountAmount: discSum,
        lineTotal: total,
        paidAmount: paid,
        balanceAmount: bal,
        paymentStatus: status,
        warrantyTerms: editingSale.warrantyTerms
      });

      showToast(`Machine invoice ${formatInvoiceNo(editingSale)} updated successfully!`);
      setEditDrawerOpen(false);
      setEditingSale(null);
    } catch (err) {
      console.error('Update machine invoice error:', err);
      showToast('Failed to update invoice.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBill) return;
    try {
      if (selectedBill.sourceType === 'Repair' && typeof deleteMachineRepair === 'function') {
        await deleteMachineRepair(selectedBill.id);
      } else if (typeof deleteMachineSale === 'function') {
        await deleteMachineSale(selectedBill.id);
      }
      showToast(`${selectedBill.docNo} deleted successfully!`);
      setDeleteDialogOpen(false);
      setSelectedBill(null);
    } catch (err) {
      console.error('Delete bill error:', err);
      showToast('Failed to delete record.', 'error');
    }
  };

  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <PageHeader
          title="Machine Invoices & Billing"
          count={kpiSummary.totalCount}
          countLabel="Bills & Jobs"
          subtitle="Track machine sales invoices and repair bills, collect payments with printed receipts, and settle customer dues."
          actions={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <AppButton intent="secondary" startIcon={<ToolOutlined />} onClick={() => navigate('/inventory/machine-repairs')}>
                Workshop Repairs
              </AppButton>
              <AppButton intent="primary" startIcon={<PlusOutlined />} onClick={() => navigate('/inventory/machine-sales')}>
                New Machine Sale
              </AppButton>
            </Box>
          }
          sx={{ mb: 2 }}
        />

        <MasterKpiGrid
          kpis={[
            {
              label: 'Total Bills & Jobs',
              value: kpiSummary.totalCount.toLocaleString(),
              helper: `${kpiSummary.salesCount} Sales • ${kpiSummary.repairCount} Repairs`,
              icon: <FileTextOutlined />,
              tone: 'primary',
              onClick: () => setFilterPayment('all')
            },
            {
              label: 'Total Billed Amount',
              value: formatPKR(kpiSummary.totalBilled),
              helper: 'Combined sales & service value',
              icon: <DollarOutlined />,
              tone: 'primary'
            },
            {
              label: 'Payments Collected',
              value: formatPKR(kpiSummary.totalPaid),
              helper: 'Advances & settled receipts',
              icon: <CheckCircleOutlined />,
              tone: 'success',
              highlightValue: true
            },
            {
              label: 'Pending Receivables',
              value: formatPKR(kpiSummary.totalDue),
              helper: kpiSummary.dueCount > 0 ? `${kpiSummary.dueCount} open balance bill(s)` : 'All invoices settled',
              icon: kpiSummary.totalDue > 0 ? <WarningOutlined /> : <CheckCircleOutlined />,
              tone: kpiSummary.totalDue > 0 ? 'error' : 'success',
              highlightValue: kpiSummary.totalDue > 0,
              onClick: () => setFilterPayment('Unpaid')
            }
          ]}
        />
      </Box>

      {/* UNIFIED BILLING & PAYMENTS LEDGER CARD */}
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
            {/* Segmented Source Tabs */}
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', p: 0.5, borderRadius: 2, gap: 0.5 })}>
              {[
                { key: 'all', label: `All Bills (${kpiSummary.totalCount})` },
                { key: 'Sale', label: `Machine Sales (${kpiSummary.salesCount})` },
                { key: 'Repair', label: `Repair Jobs (${kpiSummary.repairCount})` }
              ].map((tab) => {
                const isActive = sourceFilter === tab.key;
                return (
                  <Box
                    key={tab.key}
                    component="button"
                    type="button"
                    onClick={() => {
                      setSourceFilter(tab.key);
                      setPage(0);
                    }}
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

            <Typography variant="body2" color="text.secondary">
              Showing <strong>{filteredBills.length}</strong> billing {filteredBills.length === 1 ? 'record' : 'records'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
            <OutlinedInput
              size="small"
              placeholder="Search by invoice #, job #, customer, phone, model..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                </InputAdornment>
              }
              sx={{ flex: 1, minWidth: { xs: '100%', sm: 260 } }}
            />

            <TextField
              select
              size="small"
              label="Time Period"
              value={filterPeriod}
              onChange={(e) => {
                setFilterPeriod(e.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: '48%', sm: 170 } }}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">Past 7 Days</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              label="Payment Status"
              value={filterPayment}
              onChange={(e) => {
                setFilterPayment(e.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: '48%', sm: 170 } }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Partial">Partial</MenuItem>
              <MenuItem value="Unpaid">Unpaid / Credit</MenuItem>
            </TextField>

            <AppButton
              intent="cancel"
              size="small"
              startIcon={<ReloadOutlined />}
              onClick={() => {
                setSearchTerm('');
                setSourceFilter('all');
                setFilterPeriod('all');
                setFilterPayment('all');
                setPage(0);
              }}
            >
              Reset
            </AppButton>
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: getSubSurfaceSx(theme).bgcolor,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <TableCell sx={{ ...tableHeadCellSx, pl: 2.5 }}>Bill / Job #</TableCell>
                <TableCell sx={tableHeadCellSx}>Date & Time</TableCell>
                <TableCell sx={tableHeadCellSx}>Customer</TableCell>
                <TableCell sx={tableHeadCellSx}>Items Summary</TableCell>
                <TableCell align="center" sx={tableHeadCellSx}>Status</TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>Total Bill</TableCell>
                <TableCell align="right" sx={tableHeadCellSx}>Paid / Due</TableCell>
                <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedBills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <FileTextOutlined style={{ fontSize: 38, color: theme.palette.text.disabled, display: 'block', margin: '0 auto 8px' }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No machine bills or repair invoices found
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Create a Machine Sale or Repair Job Card to generate bills and collect payments here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBills.map((bill) => (
                  <TableRow key={bill.uid} hover sx={{ '& td': { py: 1.75 } }}>
                    <TableCell sx={{ pl: 2.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                          {bill.docNo}
                        </Typography>
                        <Chip
                          label={bill.sourceType === 'Repair' ? 'Workshop Repair' : 'Machine Sale'}
                          size="small"
                          color={bill.sourceType === 'Repair' ? 'warning' : 'primary'}
                          variant="light"
                          sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                        />
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        {bill.dateLabel}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        {bill.customerName}
                      </Typography>
                      {(bill.customerPhone || bill.cityAddress) && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {bill.customerPhone}
                          {bill.customerPhone && bill.cityAddress ? ' • ' : ''}
                          {bill.cityAddress}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell sx={{ maxWidth: 280 }}>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}
                      >
                        {bill.itemsSummary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {bill.itemsCount} {bill.itemsCount === 1 ? 'line item' : 'line items'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={bill.paymentStatus}
                        size="small"
                        color={getPaymentStatusColor(bill.paymentStatus)}
                        variant="light"
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatPKR(bill.billTotal)}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                        Paid: {formatPKR(bill.paidAmount)}
                      </Typography>
                      {bill.allocatedFromAccount > 0 && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Incl. {formatPKR(bill.allocatedFromAccount)} on-account
                        </Typography>
                      )}
                      {bill.balanceAmount > 0 && (
                        <Typography variant="caption" display="block" fontWeight={700} sx={{ color: errorTone.main, fontVariantNumeric: 'tabular-nums' }}>
                          Due: {formatPKR(bill.balanceAmount)}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center" sx={{ pr: 2.5 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                        <AppButton
                          intent="primary"
                          size="small"
                          startIcon={<DollarOutlined />}
                          onClick={() => handleOpenPaymentModal(bill)}
                          disabled={bill.balanceAmount <= 0}
                        >
                          {bill.balanceAmount > 0 ? 'Receive' : 'Settled'}
                        </AppButton>

                        <Tooltip title="View & Print Invoice">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedBill(bill);
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

                        <Tooltip title={bill.sourceType === 'Repair' ? 'Open in Machine Repairing' : 'Edit Invoice'}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(bill)}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              color: 'text.secondary',
                              '&:hover': { bgcolor: primaryTone.bg, color: primaryTone.main, borderColor: primaryTone.border }
                            }}
                          >
                            <EditOutlined style={{ fontSize: 13 }} />
                          </IconButton>
                        </Tooltip>

                        {canDelete && (
                          <Tooltip title="Delete Record">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedBill(bill);
                                setDeleteDialogOpen(true);
                              }}
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredBills.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </MainCard>

      {/* PRINT BILL / JOB CARD MODAL */}
      {selectedBill && (
        <UniversalPrintModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          title={selectedBill.sourceType === 'Repair' ? 'Machine Repairing Job Card Receipt' : 'Official Customer Machine Sale Invoice'}
          typeTag={selectedBill.sourceType === 'Repair' ? 'Repair Receipt' : 'Sales Invoice'}
          badgeColor={selectedBill.sourceType === 'Repair' ? 'warning' : 'success'}
          partyLabel="Customer Details"
          party={{
            name: selectedBill.customerName,
            phone: selectedBill.customerPhone || 'N/A',
            city: selectedBill.cityAddress || 'Lahore'
          }}
          invoiceLabel={selectedBill.sourceType === 'Repair' ? 'Job Card No:' : 'Invoice No:'}
          invoiceNo={selectedBill.docNo}
          date={selectedBill.dateLabel}
          status={selectedBill.paymentStatus}
          items={normalizeMachineItems(selectedBill.raw).map((it) => ({
            name: it.name,
            subtitle: it.subtitle,
            qty: it.qty,
            rate: it.rate,
            total: it.amount
          }))}
          summary={{
            totalAmount: selectedBill.billTotal,
            paidAmount: selectedBill.paidAmount,
            balanceAmount: selectedBill.balanceAmount,
            notes: selectedBill.raw?.warrantyTerms ? `Warranty: ${selectedBill.raw.warrantyTerms}` : undefined
          }}
          receiverSignatureLabel="Customer Signature"
        />
      )}

      {/* PRINT PAYMENT VOUCHER RECEIPT MODAL */}
      {printVoucherData && (
        <UniversalPrintModal
          open={Boolean(printVoucherData)}
          onClose={() => setPrintVoucherData(null)}
          title="Official Customer Payment Receipt"
          typeTag={printVoucherData.entryType === 'Adjustment' ? 'Discount Voucher' : 'Payment Receipt'}
          badgeColor="success"
          partyLabel="Received From"
          party={{
            name: printVoucherData.customerName,
            phone: printVoucherData.customerPhone || undefined,
            city: printVoucherData.cityAddress || undefined
          }}
          invoiceLabel="Voucher No:"
          invoiceNo={formatInvoiceNo(printVoucherData)}
          date={printVoucherData.time}
          status={printVoucherData.paymentMethod || 'Cash'}
          items={[
            {
              name: `Payment received against ${printVoucherData.referenceLabel || 'Customer Account'}`,
              subtitle: printVoucherData.referenceNo ? `Ref: ${printVoucherData.referenceNo}` : printVoucherData.notes || '',
              qty: 1,
              rate: printVoucherData.amountPaid,
              total: printVoucherData.amountPaid
            }
          ]}
          summary={{
            totalAmount: printVoucherData.billTotal,
            paidAmount: (printVoucherData.previousPaid || 0) + (printVoucherData.amountPaid || 0),
            balanceAmount: printVoucherData.newBalance,
            notes: printVoucherData.notes || `Method: ${printVoucherData.paymentMethod}`
          }}
          receiverSignatureLabel="Customer / Payer Signature"
        />
      )}

      {/* EDIT MACHINE SALE DRAWER */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: 320, sm: 460 }, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Edit Machine Invoice {editingSale ? formatInvoiceNo(editingSale) : ''}
            </Typography>
            <IconButton onClick={() => setEditDrawerOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {editingSale && (
            <Box component="form" onSubmit={handleEditSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Customer Name"
                size="small"
                fullWidth
                required
                value={editingSale.customerName}
                onChange={(e) => setEditingSale({ ...editingSale, customerName: e.target.value })}
              />
              <TextField
                label="Customer Phone"
                size="small"
                fullWidth
                value={editingSale.customerPhone}
                onChange={(e) => setEditingSale({ ...editingSale, customerPhone: e.target.value })}
              />
              <TextField
                label="City / Address"
                size="small"
                fullWidth
                value={editingSale.cityAddress}
                onChange={(e) => setEditingSale({ ...editingSale, cityAddress: e.target.value })}
              />

              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                Machines Purchased ({editingSale.items.length})
              </Typography>

              {editingSale.items.map((item, idx) => (
                <Box key={idx} sx={getSubSurfaceSx(theme, { p: 1.5, borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 })}>
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={machineModels}
                    value={item.machineName}
                    onChange={(e, val) => {
                      const updated = [...editingSale.items];
                      updated[idx] = { ...updated[idx], machineName: val || '' };
                      setEditingSale({ ...editingSale, items: updated });
                    }}
                    onInputChange={(e, val) => {
                      const updated = [...editingSale.items];
                      updated[idx] = { ...updated[idx], machineName: val || '' };
                      setEditingSale({ ...editingSale, items: updated });
                    }}
                    renderInput={(params) => <TextField {...params} label="Machine Model" required />}
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <TextField
                      label="Qty"
                      type="number"
                      size="small"
                      value={item.qty}
                      onChange={(e) => {
                        const updated = [...editingSale.items];
                        updated[idx] = { ...updated[idx], qty: parseInt(e.target.value, 10) || 1 };
                        setEditingSale({ ...editingSale, items: updated });
                      }}
                    />
                    <TextField
                      label="Unit Price"
                      type="number"
                      size="small"
                      disabled={!canEditPrice}
                      value={item.unitPrice}
                      onChange={(e) => {
                        const updated = [...editingSale.items];
                        updated[idx] = { ...updated[idx], unitPrice: parseFloat(e.target.value) || 0 };
                        setEditingSale({ ...editingSale, items: updated });
                      }}
                    />
                  </Box>
                </Box>
              ))}

              <TextField
                label="Paid Amount (Rs.)"
                type="number"
                size="small"
                fullWidth
                value={editingSale.paidAmount}
                onChange={(e) => setEditingSale({ ...editingSale, paidAmount: e.target.value })}
              />

              <TextField
                label="Warranty Terms"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={editingSale.warrantyTerms}
                onChange={(e) => setEditingSale({ ...editingSale, warrantyTerms: e.target.value })}
              />

              <AppButton type="submit" intent="primary" fullWidth>
                Save Changes
              </AppButton>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* RECEIVE PAYMENT VOUCHER MODAL */}
      <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="sm" fullWidth>
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            submitPaymentVoucher(false);
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DollarOutlined style={{ color: primaryTone.main }} /> Receive Payment Voucher
              {selectedBillForPay && (
                <Chip label={selectedBillForPay.docNo} size="small" color="primary" variant="light" sx={{ fontWeight: 700 }} />
              )}
            </Box>
            <IconButton size="small" onClick={() => setPaymentModalOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            {selectedBillForPay && (() => {
              const paidNow = parseFloat(paymentForm.amountPaid) || 0;
              const remAfter = Math.max(0, selectedBillForPay.balanceAmount - paidNow);

              return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={getSubSurfaceSx(theme, { p: 2, borderRadius: 2 })}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                      <Box>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          Customer Account
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="text.primary">
                          {selectedBillForPay.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedBillForPay.customerPhone || 'N/A'}
                          {selectedBillForPay.cityAddress ? ` • ${selectedBillForPay.cityAddress}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                          Current Due
                        </Typography>
                        <Typography variant="h4" fontWeight={700} sx={{ color: errorTone.main, fontVariantNumeric: 'tabular-nums' }}>
                          {formatPKR(selectedBillForPay.balanceAmount)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextField
                        select
                        size="small"
                        label="Voucher Type *"
                        fullWidth
                        value={paymentForm.entryType}
                        onChange={(e) => setPaymentForm({ ...paymentForm, entryType: e.target.value })}
                      >
                        <MenuItem value="Receipt">Payment Received (Cash In)</MenuItem>
                        <MenuItem value="Adjustment">Discount / Final Settlement</MenuItem>
                      </TextField>

                      <TextField
                        label="Amount (Rs.) *"
                        type="number"
                        size="small"
                        fullWidth
                        required
                        autoFocus
                        inputProps={{ min: 0 }}
                        value={paymentForm.amountPaid}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      select
                      size="small"
                      label="Voucher Type *"
                      fullWidth
                      value={paymentForm.entryType}
                      onChange={(e) => setPaymentForm({ ...paymentForm, entryType: e.target.value })}
                    >
                      <MenuItem value="Receipt">Cash / Payment Received</MenuItem>
                      <MenuItem value="Adjustment">Discount / Final Settlement</MenuItem>
                    </TextField>

                    <TextField
                      label="Amount (Rs.) *"
                      type="number"
                      size="small"
                      fullWidth
                      required
                      autoFocus
                      inputProps={{ min: 0 }}
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                    />
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      select
                      size="small"
                      label="Payment Method"
                      fullWidth
                      disabled={paymentForm.entryType === 'Adjustment'}
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer / Online</MenuItem>
                      <MenuItem value="Easypaisa / JazzCash">Easypaisa / JazzCash</MenuItem>
                      <MenuItem value="Cheque">Cheque</MenuItem>
                    </TextField>

                    <TextField
                      size="small"
                      label="New Remaining Due"
                      fullWidth
                      disabled
                      value={formatPKR(remAfter)}
                    />
                  </Box>

                  <TextField
                    size="small"
                    label="Reference / Cheque / Transaction #"
                    placeholder="e.g. TXN-908123"
                    fullWidth
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                  />

                  <TextField
                    size="small"
                    label="Notes / Remarks"
                    placeholder="Optional payment notes..."
                    fullWidth
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </Box>
              );
            })()}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, bgcolor: getSubSurfaceSx(theme).bgcolor }}>
            <AppButton intent="cancel" onClick={() => setPaymentModalOpen(false)} disabled={savingPayment}>
              Cancel
            </AppButton>
            <AppButton
              intent="secondary"
              startIcon={<PrinterOutlined />}
              onClick={() => submitPaymentVoucher(true)}
              disabled={savingPayment}
            >
              Save &amp; Print Receipt
            </AppButton>
            <AppButton type="submit" intent="primary" startIcon={<DollarOutlined />} disabled={savingPayment}>
              {savingPayment ? 'Saving...' : 'Confirm Payment'}
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      {/* DELETE DIALOG */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${selectedBill?.docNo || ''}?`}
        message={
          <>
            Are you sure you want to delete <strong>{selectedBill?.docNo}</strong> for <strong>{selectedBill?.customerName}</strong>? This
            action cannot be undone.
          </>
        }
        confirmText="Yes, Delete"
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
