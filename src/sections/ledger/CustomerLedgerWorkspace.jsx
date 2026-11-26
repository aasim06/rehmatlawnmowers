import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
  Box,
  Chip,
  Collapse,
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

import {
  BookOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DollarOutlined,
  DownOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  UpOutlined,
  UserAddOutlined,
  UserOutlined,
  WalletOutlined,
  WarningOutlined
} from '@ant-design/icons';

import MainCard from 'components/MainCard';
import { AppButton, MasterKpiGrid, PageHeader } from 'components/common';
import PaymentVoucherDialog from 'components/machine/PaymentVoucherDialog';
import CustomerLedgerPrintModals from 'sections/ledger/CustomerLedgerPrintModals';
import { getCardSurfaceSx, getSubSurfaceSx, getSubTableHeadCellSx, getTableHeadCellSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import { formatCleanVoucherNotes, formatFullDate, formatInvoiceNo, formatItemsSummaryLabel } from 'utils/machineLedgerHelpers';

const tableHeadCellSx = getTableHeadCellSx();

const subHeadCellSx = getSubTableHeadCellSx();

const createInitialCustomerForm = () => ({
  id: null,
  name: '',
  phone: '',
  city: '',
  balanceType: 'receivable', // 'none' | 'receivable' | 'advance'
  openingAmount: 0,
  notes: ''
});

/**
 * Shared A-to-Z Customer Khata & Accounting Ledger workspace powering both
 * Machine Customer Ledgers and Shop Customer Ledger with identical sequence,
 * layout, KPIs, chronological passbook, linked invoices, vouchers, and A4 prints.
 */
export default function CustomerLedgerWorkspace({
  mode = 'machine',
  headerTitle = 'Account Statements & History',
  subtitle = 'Complete chronological debit/credit history, linked bills, and printable customer statements.',
  paymentsPath = '/inventory/machine-payments',
  paymentsButtonLabel = 'Payments & Balances',
  accountsHelper = 'Buyers, repair clients & registered parties',
  debitHelper = 'Sales bills, repairs, opening & payouts',
  billsLabel = 'Bills/Jobs',
  defaultCityLabel = 'Lahore',
  documentsTabLabel = 'Invoices & Repair Jobs',
  itemsColumnLabel = 'Machine / Items',
  saleTypeLabel = 'Machine Sale',
  itemFieldLabel = 'Machine Model',
  emptyAccountsHint = 'Click "Register Customer" above or create a Sale / Repair job card to build accounts.',
  statementTitle = 'Official Customer Account Statement',
  saleInvoiceTitle = 'Official Customer Machine Sale Invoice',
  purchaseInvoiceTitle = 'Official Store Vendor Receiving Bill',
  repairPath = '/inventory/machine-repairs',
  extraHeaderActions = null,
  customerLedgers = [],
  customerDirectory = [],
  customerPayments = [],
  itemOptions = [],
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  canDelete = true,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onAddPayment,
  onDeletePayment,
  onUpdateSale,
  onDeleteSale,
  onDeleteMultipleSales,
  onDeleteRepair
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isShopMode = mode === 'shop';
  const isStoreMode = mode === 'store';

  // Main Tabs: 'accounts' | 'vouchers'
  const [activeTab, setActiveTab] = useState('accounts');

  // Account filters & pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all'); // 'all' | 'due' | 'settled'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Cashbook Voucher filters & pagination
  const [voucherSearch, setVoucherSearch] = useState('');
  const [voucherTypeFilter, setVoucherTypeFilter] = useState('all'); // 'all' | 'Receipt' | 'Payout' | 'Adjustment'
  const [voucherPage, setVoucherPage] = useState(0);
  const [voucherRowsPerPage, setVoucherRowsPerPage] = useState(10);

  // Expand customer state & inner sub-tab ('passbook' | 'documents')
  const [expandedCustomer, setExpandedCustomer] = useState(null);
  const [expandSubTab, setExpandSubTab] = useState('passbook');

  // Toast feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  // Register / Edit Customer Modal
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState(() => createInitialCustomerForm());
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Payment / Payout Voucher Modal
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [voucherInitData, setVoucherInitData] = useState(null);

  useEffect(() => {
    const queryCustomer = searchParams.get('customer');
    if (queryCustomer) {
      setExpandedCustomer(queryCustomer.trim().toLowerCase());
      setActiveTab('accounts');
    }
  }, [searchParams]);

  // Delete Modals (Customer / Single Document / Single Voucher)
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteCustomerModalOpen, setDeleteCustomerModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleteInvoiceDialogOpen, setDeleteInvoiceDialogOpen] = useState(false);

  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [deleteVoucherDialogOpen, setDeleteVoucherDialogOpen] = useState(false);

  // Edit Sale Invoice Drawer
  const [editInvoiceDrawerOpen, setEditInvoiceDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Print Modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printCustomerData, setPrintCustomerData] = useState(null);
  const [printInvoiceModalOpen, setPrintInvoiceModalOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);
  const [printRepairModalOpen, setPrintRepairModalOpen] = useState(false);
  const [printRepairData, setPrintRepairData] = useState(null);
  const [printVoucherModalOpen, setPrintVoucherModalOpen] = useState(false);
  const [printVoucherData, setPrintVoucherData] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, balanceFilter, startDate, endDate]);

  useEffect(() => {
    setVoucherPage(0);
  }, [voucherSearch, voucherTypeFilter]);

  const kpiData = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;
    let totalDue = 0;
    let totalPayable = 0;
    let dueCustomers = 0;
    let payableCustomers = 0;

    customerLedgers.forEach((c) => {
      totalDebit += c.totalDebit;
      totalCredit += c.totalCredit;
      totalDue += c.balanceVal;
      if (c.balanceVal > 0) dueCustomers += 1;
      if (c.netBalance < 0) {
        totalPayable += Math.abs(c.netBalance);
        payableCustomers += 1;
      }
    });

    const totalCashFlow = (customerPayments || []).reduce((s, p) => s + (parseFloat(p.amountPaid) || 0), 0);

    return {
      totalCustomers: customerLedgers.length,
      totalDebit,
      totalCredit,
      totalDue,
      totalPayable,
      dueCustomers,
      payableCustomers,
      totalCashFlow
    };
  }, [customerLedgers, customerPayments]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return customerLedgers.filter((c) => {
      if (balanceFilter === 'due' && c.balanceVal <= 0) return false;
      if (balanceFilter === 'payable' && c.netBalance >= 0) return false;
      if (balanceFilter === 'settled') {
        if (isStoreMode ? c.netBalance !== 0 : c.balanceVal > 0) return false;
      }
      if (!q) return true;
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q)
      );
    });
  }, [customerLedgers, balanceFilter, searchTerm, isStoreMode]);

  const paginatedCustomers = useMemo(
    () => filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredCustomers, page, rowsPerPage]
  );

  const filteredVouchers = useMemo(() => {
    const q = voucherSearch.trim().toLowerCase();
    return (customerPayments || [])
      .filter((p) => {
        const type = p.entryType || 'Receipt';
        if (voucherTypeFilter !== 'all' && type !== voucherTypeFilter) return false;
        if (!q) return true;
        return [p.voucherNo, p.customerName, p.referenceLabel, p.paymentMethod, p.referenceNo, p.notes]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => new Date(b.createdAt || b.dateISO || 0) - new Date(a.createdAt || a.dateISO || 0));
  }, [customerPayments, voucherSearch, voucherTypeFilter]);

  const paginatedVouchers = useMemo(
    () => filteredVouchers.slice(voucherPage * voucherRowsPerPage, voucherPage * voucherRowsPerPage + voucherRowsPerPage),
    [filteredVouchers, voucherPage, voucherRowsPerPage]
  );

  const handleOpenAddCustomer = (existingCustLedger = null) => {
    if (existingCustLedger && existingCustLedger.customerId) {
      const openBal = existingCustLedger.openingBalance || 0;
      setCustomerForm({
        id: existingCustLedger.customerId,
        name: existingCustLedger.customerName,
        phone: existingCustLedger.phone || '',
        city: existingCustLedger.city || '',
        balanceType: openBal > 0 ? 'receivable' : openBal < 0 ? 'advance' : 'none',
        openingAmount: Math.abs(openBal),
        notes: existingCustLedger.notes || ''
      });
    } else if (existingCustLedger) {
      setCustomerForm({
        id: null,
        name: existingCustLedger.customerName,
        phone: existingCustLedger.phone || '',
        city: existingCustLedger.city || '',
        balanceType: 'none',
        openingAmount: 0,
        notes: ''
      });
    } else {
      setCustomerForm(createInitialCustomerForm());
    }
    setCustomerModalOpen(true);
  };

  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!customerForm.name.trim() || savingCustomer) return;
    setSavingCustomer(true);
    try {
      const rawAmt = Math.max(0, parseFloat(customerForm.openingAmount) || 0);
      const signedOpening =
        customerForm.balanceType === 'receivable' ? rawAmt : customerForm.balanceType === 'advance' ? -rawAmt : 0;

      const customerPayload = {
        name: customerForm.name.trim(),
        phone: customerForm.phone.trim(),
        city: customerForm.city.trim(),
        address: customerForm.city.trim(),
        openingBalance: signedOpening,
        notes: customerForm.notes.trim()
      };

      if (customerForm.id && typeof onUpdateCustomer === 'function') {
        await onUpdateCustomer(customerForm.id, customerPayload);
        showToast(`Customer "${customerPayload.name}" updated successfully!`);
      } else if (typeof onAddCustomer === 'function') {
        await onAddCustomer(customerPayload);
        showToast(`Customer "${customerPayload.name}" added to customer directory!`);
      }
      setCustomerModalOpen(false);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleOpenVoucherModal = (custName = '', preselectedInv = null, defaultEntryType = 'Receipt') => {
    if (preselectedInv) {
      const refSel = `${preselectedInv.recordType === 'Repair' ? 'Repair' : 'Sale'}:${preselectedInv.id}`;
      const dueAmt = Math.max(0, parseFloat(preselectedInv.balanceAmount) || 0);
      setVoucherInitData({
        customerName: custName,
        entryType: defaultEntryType,
        refSelection: refSel,
        amountPaid: dueAmt > 0 ? String(dueAmt) : ''
      });
    } else {
      const ledger = customerLedgers.find((c) => c.customerName.toLowerCase() === (custName || '').toLowerCase());
      const dueAmt = ledger?.balanceVal > 0 ? String(ledger.balanceVal) : '';
      setVoucherInitData({
        customerName: custName,
        entryType: defaultEntryType,
        refSelection: 'ACCOUNT',
        amountPaid: dueAmt
      });
    }
    setVoucherModalOpen(true);
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
        `${payload.entryType === 'Payout' ? 'Cash Paid / Refund' : payload.entryType === 'Adjustment' ? 'Discount Adjustment' : 'Payment Received'} of ${formatPKR(payload.amountPaid)} recorded for ${payload.customerName}!`
      );
      setVoucherModalOpen(false);

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
      showToast('Failed to record account entry. Please try again.', 'error');
      throw err;
    }
  };

  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setDeletingCustomer(true);
    try {
      const repairInvs = (customerToDelete.invoices || []).filter((inv) => inv.recordType === 'Repair');
      const saleInvs = (customerToDelete.invoices || []).filter((inv) => inv.recordType !== 'Repair');

      for (const inv of repairInvs) {
        if (typeof onDeleteRepair === 'function') await onDeleteRepair(inv.id);
      }

      const saleIds = saleInvs.map((inv) => inv.id).filter(Boolean);
      if (saleIds.length > 0 && typeof onDeleteMultipleSales === 'function') {
        await onDeleteMultipleSales(saleIds);
      } else if (typeof onDeleteSale === 'function') {
        for (const id of saleIds) await onDeleteSale(id);
      }

      for (const v of customerToDelete.vouchers || []) {
        if (typeof onDeletePayment === 'function') await onDeletePayment(v.id);
      }

      if (customerToDelete.customerId && typeof onDeleteCustomer === 'function') {
        await onDeleteCustomer(customerToDelete.customerId);
      }

      showToast(`Deleted ledger records for ${customerToDelete.customerName}`);
      setDeleteCustomerModalOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Delete customer ledger error:', err);
      showToast('Failed to delete customer ledger records', 'error');
    } finally {
      setDeletingCustomer(false);
    }
  };

  const handleOpenPrintInvoice = (inv) => {
    if (inv.recordType === 'Repair') {
      setPrintRepairData(inv);
      setPrintRepairModalOpen(true);
    } else {
      setPrintInvoiceData(inv);
      setPrintInvoiceModalOpen(true);
    }
  };

  const handleOpenPrintVoucher = (voucher, custLedger = null) => {
    const ledger =
      custLedger || customerLedgers.find((c) => c.customerName.toLowerCase() === (voucher.customerName || '').toLowerCase());
    setPrintVoucherData({
      ...voucher,
      phone: ledger?.phone || '',
      city: ledger?.city || '',
      matchedInvoices: ledger?.invoices || [],
      remainingAccountBalance: Math.abs(ledger?.netBalance ?? 0)
    });
    setPrintVoucherModalOpen(true);
  };

  const handleOpenEditInvoice = (inv) => {
    if (inv.recordType === 'Repair') {
      navigate(repairPath);
      return;
    }
    const itemsArray =
      inv.items && inv.items.length > 0
        ? inv.items.map((i) => ({ ...i, machineName: i.machineName || i.name }))
        : [
          {
            machineName: inv.machineName || (isShopMode ? 'Shop Item' : 'Machine'),
            name: inv.machineName || (isShopMode ? 'Shop Item' : 'Machine'),
            serialNo: inv.serialNo || '',
            qty: inv.qty || 1,
            unitPrice: inv.unitPrice || inv.lineTotal || 0,
            discount: inv.discount || 0
          }
        ];
    setEditingInvoice({ ...inv, items: itemsArray });
    setEditInvoiceDrawerOpen(true);
  };

  const handleEditInvoiceSubmit = async (e) => {
    e.preventDefault();
    if (!editingInvoice || typeof onUpdateSale !== 'function') return;

    const itemsList = (editingInvoice.items || []).map((i) => {
      const q = Math.max(1, parseInt(i.qty, 10) || 1);
      const p = Math.max(0, parseFloat(i.unitPrice) || 0);
      const discPercent = Math.min(100, Math.max(0, parseFloat(i.discount) || 0));
      const gross = q * p;
      const discAmount = (gross * discPercent) / 100;
      const lineTotal = Math.max(0, gross - discAmount);
      const itemLabel = i.machineName || i.name || (isShopMode ? 'Shop Item' : 'Machine');
      return {
        ...i,
        name: itemLabel,
        machineName: itemLabel,
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
    const invoiceDiscount = isShopMode ? Math.max(0, parseFloat(editingInvoice.discount) || 0) : discSum;
    const invoiceTax = isShopMode ? Math.max(0, parseFloat(editingInvoice.tax) || 0) : 0;
    const total = isShopMode ? Math.max(0, subTotal - invoiceDiscount + invoiceTax) : subTotal;
    const totalQtySum = itemsList.reduce((sum, i) => sum + i.qty, 0);
    const paid = Math.max(0, parseFloat(editingInvoice.paidAmount) || 0);
    const bal = Math.max(0, total - paid);
    const status = total > 0 && paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    const firstItem = itemsList[0] || {};
    const cleanName = (editingInvoice.customerName || 'Walk-in Customer').trim();
    const cleanPhone = (editingInvoice.customerPhone || '').trim();
    const cleanCity = (editingInvoice.cityAddress || '').trim();

    await onUpdateSale(editingInvoice.id, {
      customer: cleanName,
      customerName: cleanName,
      phone: cleanPhone,
      customerPhone: cleanPhone,
      cityAddress: cleanCity,
      items: itemsList,
      machineName: formatItemsSummaryLabel(itemsList, isShopMode ? 'Shop Item' : 'Machine'),
      serialNo: firstItem.serialNo || '',
      qty: totalQtySum,
      unitPrice: firstItem.unitPrice || 0,
      subTotal,
      discount: isShopMode ? invoiceDiscount : editingInvoice.discount || 0,
      tax: isShopMode ? invoiceTax : 0,
      discountAmount: discSum,
      lineTotal: total,
      totalAmount: total,
      grandTotal: total,
      paidAmount: paid,
      balanceAmount: bal,
      paymentStatus: status,
      notes: editingInvoice.notes || '',
      warrantyTerms: editingInvoice.warrantyTerms || ''
    });

    showToast(`Updated invoice ${formatInvoiceNo(editingInvoice)}!`);
    setEditInvoiceDrawerOpen(false);
  };

  const handleConfirmDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    if (invoiceToDelete.recordType === 'Repair' && typeof onDeleteRepair === 'function') {
      await onDeleteRepair(invoiceToDelete.id);
    } else if (typeof onDeleteSale === 'function') {
      await onDeleteSale(invoiceToDelete.id);
    }
    showToast(`Deleted ${formatInvoiceNo(invoiceToDelete)} successfully.`);
    setInvoiceToDelete(null);
    setDeleteInvoiceDialogOpen(false);
  };

  const handleConfirmDeleteVoucher = async () => {
    if (!voucherToDelete) return;
    await onDeletePayment(voucherToDelete.id, voucherToDelete);
    showToast(`Voucher ${formatInvoiceNo(voucherToDelete)} reversed & deleted.`);
    setVoucherToDelete(null);
    setDeleteVoucherDialogOpen(false);
  };

  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');
  const warningTone = getToneColors(theme, 'warning');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 1. HEADER & TOP KPI GRID */}
      <Box>
        <PageHeader
          title={headerTitle}
          count={kpiData.totalCustomers}
          countLabel="Accounts"
          subtitle={subtitle}
          actions={
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {extraHeaderActions}
              <AppButton intent="secondary" startIcon={<WalletOutlined />} onClick={() => navigate(paymentsPath)}>
                {paymentsButtonLabel}
              </AppButton>
              <AppButton intent="secondary" startIcon={<UserAddOutlined />} onClick={() => handleOpenAddCustomer()}>
                {isStoreMode ? 'Register Party' : 'Register Customer'}
              </AppButton>
              <AppButton intent="primary" startIcon={<DollarOutlined />} onClick={() => handleOpenVoucherModal('')}>
                Record Payment / Payout
              </AppButton>
            </Box>
          }
          sx={{ mb: 2 }}
        />

        <MasterKpiGrid
          kpis={
            isStoreMode
              ? [
                  {
                    label: 'Store Party Accounts',
                    value: kpiData.totalCustomers.toLocaleString(),
                    helper: accountsHelper,
                    icon: <UserOutlined />,
                    tone: 'primary',
                    onClick: () => {
                      setActiveTab('accounts');
                      setBalanceFilter('all');
                    }
                  },
                  {
                    label: 'Total Receivable',
                    value: formatPKR(kpiData.totalDue),
                    helper: kpiData.dueCustomers > 0 ? `${kpiData.dueCustomers} party(s) owe Factory Store` : 'No pending collections',
                    icon: <WarningOutlined />,
                    tone: kpiData.totalDue > 0 ? 'error' : 'success',
                    highlightValue: kpiData.totalDue > 0,
                    onClick: () => {
                      setActiveTab('accounts');
                      setBalanceFilter((prev) => (prev === 'due' ? 'all' : 'due'));
                    }
                  },
                  {
                    label: 'Total Payable',
                    value: formatPKR(kpiData.totalPayable),
                    helper:
                      kpiData.payableCustomers > 0
                        ? `${kpiData.payableCustomers} vendor / party account(s) payable`
                        : 'All vendors & credits settled',
                    icon: <WalletOutlined />,
                    tone: kpiData.totalPayable > 0 ? 'warning' : 'success',
                    highlightValue: kpiData.totalPayable > 0,
                    onClick: () => {
                      setActiveTab('accounts');
                      setBalanceFilter((prev) => (prev === 'payable' ? 'all' : 'payable'));
                    }
                  },
                  {
                    label: 'Cash Vouchers & Payouts',
                    value: formatPKR(kpiData.totalCashFlow),
                    helper: `${customerPayments.length} receipt(s) & vendor payout(s)`,
                    icon: <CheckCircleOutlined />,
                    tone: 'success',
                    highlightValue: true,
                    onClick: () => setActiveTab('vouchers')
                  }
                ]
              : [
                  {
                    label: 'Customer Accounts',
                    value: kpiData.totalCustomers.toLocaleString(),
                    helper: accountsHelper,
                    icon: <UserOutlined />,
                    tone: 'primary',
                    onClick: () => {
                      setActiveTab('accounts');
                      setBalanceFilter('all');
                    }
                  },
                  {
                    label: 'Total Billed & Debit (Dr)',
                    value: formatPKR(kpiData.totalDebit),
                    helper: debitHelper,
                    icon: <FileTextOutlined />,
                    tone: 'primary'
                  },
                  {
                    label: 'Payments & Credits (Cr)',
                    value: formatPKR(kpiData.totalCredit),
                    helper: `${customerPayments.length} voucher(s) + advance payments`,
                    icon: <CheckCircleOutlined />,
                    tone: 'success',
                    highlightValue: true,
                    onClick: () => setActiveTab('vouchers')
                  },
                  {
                    label: 'Net Balance Due',
                    value: formatPKR(kpiData.totalDue),
                    helper: kpiData.dueCustomers > 0 ? `${kpiData.dueCustomers} account(s) pending collection` : 'All customer accounts settled',
                    icon: kpiData.totalDue > 0 ? <WarningOutlined /> : <WalletOutlined />,
                    tone: kpiData.totalDue > 0 ? 'error' : 'success',
                    highlightValue: kpiData.totalDue > 0,
                    onClick: () => {
                      setActiveTab('accounts');
                      setBalanceFilter((prev) => (prev === 'due' ? 'all' : 'due'));
                    }
                  }
                ]
          }
        />
      </Box>

      {/* 2. MAIN LEDGER & CASHBOOK CARD */}
      <MainCard content={false} sx={getCardSurfaceSx(theme, { overflow: 'hidden' })}>
        {/* Navigation Tabs & Filters Header */}
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
            <Box sx={getSubSurfaceSx(theme, { display: 'inline-flex', p: 0.5, borderRadius: 2, gap: 0.5 })}>
              {[
                { key: 'accounts', label: `${isStoreMode ? 'Party Accounts' : 'Customer Accounts'} (${customerLedgers.length})` },
                { key: 'vouchers', label: `All Payment Vouchers (${customerPayments.length})` }
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
                      px: 1.75,
                      py: 0.7,
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

            {activeTab === 'accounts' && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {(isStoreMode
                  ? [
                      { key: 'all', label: 'All Accounts' },
                      { key: 'due', label: `Receivable (${kpiData.dueCustomers})` },
                      { key: 'payable', label: `Payable (${kpiData.payableCustomers})` },
                      { key: 'settled', label: 'Settled' }
                    ]
                  : [
                      { key: 'all', label: 'All Accounts' },
                      { key: 'due', label: `Due Balance (${kpiData.dueCustomers})` },
                      { key: 'settled', label: 'Settled / Credit' }
                    ]
                ).map((pill) => {
                  const active = balanceFilter === pill.key;
                  return (
                    <Chip
                      key={pill.key}
                      label={pill.label}
                      size="small"
                      clickable
                      color={active ? 'primary' : 'default'}
                      variant={active ? 'light' : 'outlined'}
                      onClick={() => setBalanceFilter(pill.key)}
                      sx={{ fontWeight: active ? 700 : 500 }}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          {activeTab === 'accounts' ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 1.5 }}>
              <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: 240 } }}>
                <Typography component="label" htmlFor={`${mode}-ledger-search-input`} sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  Search Customer
                </Typography>
                <OutlinedInput
                  id={`${mode}-ledger-search-input`}
                  fullWidth
                  size="small"
                  placeholder="Search by name, phone, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined style={{ color: theme.palette.text.secondary }} />
                    </InputAdornment>
                  }
                />
              </Box>
              <Box sx={{ width: { xs: '47%', sm: 160 } }}>
                <Typography component="label" htmlFor={`${mode}-ledger-from-date`} sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  From Date
                </Typography>
                <TextField
                  id={`${mode}-ledger-from-date`}
                  type="date"
                  size="small"
                  fullWidth
                  value={startDate}
                  onChange={(e) => onStartDateChange?.(e.target.value)}
                />
              </Box>
              <Box sx={{ width: { xs: '47%', sm: 160 } }}>
                <Typography component="label" htmlFor={`${mode}-ledger-to-date`} sx={{ display: 'block', mb: 0.5, fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary' }}>
                  To Date
                </Typography>
                <TextField
                  id={`${mode}-ledger-to-date`}
                  type="date"
                  size="small"
                  fullWidth
                  value={endDate}
                  onChange={(e) => onEndDateChange?.(e.target.value)}
                />
              </Box>
              <AppButton
                intent="cancel"
                size="small"
                startIcon={<ReloadOutlined />}
                onClick={() => {
                  setSearchTerm('');
                  setBalanceFilter('all');
                  onStartDateChange?.('');
                  onEndDateChange?.('');
                }}
              >
                Reset
              </AppButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <OutlinedInput
                size="small"
                placeholder="Search voucher #, customer, method, ref # or notes..."
                value={voucherSearch}
                onChange={(e) => setVoucherSearch(e.target.value)}
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
                value={voucherTypeFilter}
                onChange={(e) => setVoucherTypeFilter(e.target.value)}
                sx={{ width: { xs: '100%', sm: 220 } }}
              >
                <MenuItem value="all">All Voucher Types</MenuItem>
                <MenuItem value="Receipt">Payment Received (Cash In)</MenuItem>
                <MenuItem value="Payout">Cash Paid / Refund (Cash Out)</MenuItem>
                <MenuItem value="Adjustment">Discount / Settlement</MenuItem>
              </TextField>
            </Box>
          )}
        </Box>

        {/* TAB 1 CONTENT: CUSTOMER KHATA ACCOUNTS TABLE */}
        {activeTab === 'accounts' && (
          <>
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
                    <TableCell sx={{ width: 44, pl: 2 }} />
                    <TableCell sx={tableHeadCellSx}>{isStoreMode ? 'Party / Vendor Account' : 'Customer Account'}</TableCell>
                    <TableCell align="center" sx={tableHeadCellSx}>Records</TableCell>
                    <TableCell align="right" sx={tableHeadCellSx}>{isStoreMode ? 'Total Debit (Dr)' : 'Total Billed (Dr)'}</TableCell>
                    <TableCell align="right" sx={tableHeadCellSx}>{isStoreMode ? 'Total Credit (Cr)' : 'Total Paid (Cr)'}</TableCell>
                    <TableCell align="right" sx={tableHeadCellSx}>Net Balance</TableCell>
                    <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                        <BookOutlined style={{ fontSize: 36, color: theme.palette.text.disabled, display: 'block', margin: '0 auto 10px' }} />
                        <Typography variant="h6" fontWeight={700} color="text.secondary">
                          No Customer Accounts Found
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {emptyAccountsHint}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCustomers.map((cust) => {
                      const isExpanded = expandedCustomer === cust.key;
                      const isAdvance = cust.netBalance < 0;
                      const hasDue = cust.netBalance > 0;

                      return (
                        <React.Fragment key={cust.key}>
                          <TableRow
                            hover
                            onClick={() => setExpandedCustomer(isExpanded ? null : cust.key)}
                            sx={{
                              cursor: 'pointer',
                              bgcolor: isExpanded ? getSubSurfaceSx(theme).bgcolor : 'inherit',
                              '& td': { py: 1.75 }
                            }}
                          >
                            <TableCell sx={{ pl: 2 }}>
                              <IconButton size="small" sx={{ color: isExpanded ? 'primary.main' : 'text.secondary' }}>
                                {isExpanded ? <UpOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
                              </IconButton>
                            </TableCell>

                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                                  {cust.customerName}
                                </Typography>
                                {cust.registered && (
                                  <Chip label="Directory" size="small" color="primary" variant="light" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }} />
                                )}
                              </Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {cust.phone || 'No Phone'} • {cust.city || defaultCityLabel}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              <Box sx={{ display: 'inline-flex', gap: 0.6, flexWrap: 'wrap', justifyContent: 'center' }}>
                                <Chip
                                  label={`${cust.totalInvoicesCount} ${billsLabel}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                                />
                                {cust.vouchers.length > 0 && (
                                  <Chip
                                    label={`${cust.vouchers.length} Vch`}
                                    size="small"
                                    color="success"
                                    variant="light"
                                    sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                                  />
                                )}
                              </Box>
                            </TableCell>

                            <TableCell align="right">
                              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                                {formatPKR(cust.totalDebit)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600} sx={{ color: successTone.main, fontVariantNumeric: 'tabular-nums' }}>
                                {formatPKR(cust.totalCredit)}
                              </Typography>
                            </TableCell>

                            <TableCell align="right">
                              {hasDue ? (
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: errorTone.main, fontVariantNumeric: 'tabular-nums' }}>
                                  {isStoreMode ? 'Receivable' : 'Due'}: {formatPKR(cust.balanceVal)}
                                </Typography>
                              ) : isAdvance ? (
                                <Chip
                                  label={`${isStoreMode ? 'Payable' : 'Adv Credit'}: ${formatPKR(Math.abs(cust.netBalance))}`}
                                  size="small"
                                  color={isStoreMode ? 'warning' : 'info'}
                                  variant="light"
                                  sx={{ fontWeight: 700 }}
                                />
                              ) : (
                                <Chip label="Settled" size="small" color="success" variant="light" sx={{ fontWeight: 700 }} />
                              )}
                            </TableCell>

                            <TableCell align="center" sx={{ pr: 2.5 }} onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                                <AppButton
                                  size="small"
                                  intent="primary"
                                  startIcon={<DollarOutlined />}
                                  onClick={() => handleOpenVoucherModal(cust.customerName, null, isAdvance ? 'Payout' : 'Receipt')}
                                >
                                  Pay / Collect
                                </AppButton>

                                <Tooltip title="Print Full Account Statement">
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

                                <Tooltip title="Edit / Save Party Details & Opening Balance">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenAddCustomer(cust)}
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
                                  <Tooltip title={`Delete complete account records for ${cust.customerName}`}>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setCustomerToDelete(cust);
                                        setDeleteCustomerModalOpen(true);
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

                          {/* EXPANDED CUSTOMER KHATA PASSBOOK & DOCUMENTS */}
                          <TableRow>
                            <TableCell colSpan={7} sx={{ p: 0, borderBottom: isExpanded ? '1px solid' : 0, borderColor: 'divider' }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={getSubSurfaceSx(theme, { p: 2.5, borderRadius: 0 })}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      flexWrap: 'wrap',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      gap: 1.5,
                                      mb: 2
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                      <Chip
                                        label={`Chronological Passbook (${cust.ledgerEntries.length} Entries)`}
                                        size="small"
                                        clickable
                                        color={expandSubTab === 'passbook' ? 'primary' : 'default'}
                                        variant={expandSubTab === 'passbook' ? 'light' : 'outlined'}
                                        onClick={() => setExpandSubTab('passbook')}
                                        sx={{ fontWeight: 700 }}
                                      />
                                      <Chip
                                        label={`${documentsTabLabel} (${cust.invoices.length})`}
                                        size="small"
                                        clickable
                                        color={expandSubTab === 'documents' ? 'primary' : 'default'}
                                        variant={expandSubTab === 'documents' ? 'light' : 'outlined'}
                                        onClick={() => setExpandSubTab('documents')}
                                        sx={{ fontWeight: 700 }}
                                      />
                                    </Box>

                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <AppButton
                                        size="small"
                                        intent="secondary"
                                        startIcon={<PrinterOutlined />}
                                        onClick={() => {
                                          setPrintCustomerData(cust);
                                          setPrintModalOpen(true);
                                        }}
                                      >
                                        Print Statement
                                      </AppButton>
                                      <AppButton
                                        size="small"
                                        intent="primary"
                                        startIcon={<PlusOutlined />}
                                        onClick={() => handleOpenVoucherModal(cust.customerName)}
                                      >
                                        Add Entry
                                      </AppButton>
                                    </Box>
                                  </Box>

                                  {expandSubTab === 'passbook' ? (
                                    <TableContainer
                                      sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        bgcolor: 'background.paper'
                                      }}
                                    >
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
                                            <TableCell sx={subHeadCellSx}>Date &amp; Time</TableCell>
                                            <TableCell sx={subHeadCellSx}>Ref / Voucher #</TableCell>
                                            <TableCell sx={subHeadCellSx}>Particulars</TableCell>
                                            <TableCell sx={subHeadCellSx}>Method</TableCell>
                                            <TableCell align="right" sx={subHeadCellSx}>Debit (Dr)</TableCell>
                                            <TableCell align="right" sx={subHeadCellSx}>Credit (Cr)</TableCell>
                                            <TableCell align="right" sx={subHeadCellSx}>Balance</TableCell>
                                            <TableCell align="center" sx={subHeadCellSx}>Actions</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {cust.ledgerEntries.length === 0 ? (
                                            <TableRow>
                                              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                  No ledger entries yet for this customer.
                                                </Typography>
                                              </TableCell>
                                            </TableRow>
                                          ) : (
                                            cust.ledgerEntries.map((entry) => (
                                              <TableRow key={entry.id} hover>
                                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                                                  {entry.dateLabel}
                                                </TableCell>
                                                <TableCell>
                                                  <Typography variant="caption" fontWeight={700} color="primary.main">
                                                    {entry.voucherNo}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell>
                                                  <Typography variant="body2" fontWeight={600} color="text.primary">
                                                    {entry.particulars}
                                                  </Typography>
                                                  {Array.isArray(entry.items) && entry.items.length > 0 && (
                                                    <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                                      {entry.items.map((it, iIdx) => (
                                                        <Typography
                                                          key={iIdx}
                                                          variant="caption"
                                                          color="text.secondary"
                                                          sx={{ fontVariantNumeric: 'tabular-nums' }}
                                                        >
                                                          {iIdx + 1}. {it.name} — {it.qty} × {formatPKR(it.rate)} = {formatPKR(it.amount)}
                                                        </Typography>
                                                      ))}
                                                    </Box>
                                                  )}
                                                </TableCell>
                                                <TableCell>
                                                  <Chip label={entry.paymentMethod} size="small" variant="outlined" sx={{ height: 22, fontSize: '0.75rem' }} />
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, fontSize: '0.8125rem' }}>
                                                  {entry.debit > 0 ? formatPKR(entry.debit) : '—'}
                                                </TableCell>
                                                <TableCell
                                                  align="right"
                                                  sx={{
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontWeight: 700,
                                                    fontSize: '0.8125rem',
                                                    color: entry.credit > 0 ? successTone.main : 'text.secondary'
                                                  }}
                                                >
                                                  {entry.credit > 0 ? formatPKR(entry.credit) : '—'}
                                                </TableCell>
                                                <TableCell
                                                  align="right"
                                                  sx={{
                                                    fontVariantNumeric: 'tabular-nums',
                                                    fontWeight: 700,
                                                    fontSize: '0.8125rem',
                                                    color: entry.runningBalance > 0 ? errorTone.main : successTone.main
                                                  }}
                                                >
                                                  {formatPKR(Math.abs(entry.runningBalance))} {entry.runningBalance < 0 ? '(Cr)' : ''}
                                                </TableCell>
                                                <TableCell align="center">
                                                  {entry.isVoucher && (
                                                    <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                                                      <Tooltip title="Print Receipt Voucher">
                                                        <IconButton size="small" onClick={() => handleOpenPrintVoucher(entry.raw, cust)}>
                                                          <PrinterOutlined style={{ fontSize: 12 }} />
                                                        </IconButton>
                                                      </Tooltip>
                                                      {canDelete && (
                                                        <Tooltip title="Delete / Reverse Voucher">
                                                          <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => {
                                                              setVoucherToDelete(entry.raw);
                                                              setDeleteVoucherDialogOpen(true);
                                                            }}
                                                          >
                                                            <DeleteOutlined style={{ fontSize: 12 }} />
                                                          </IconButton>
                                                        </Tooltip>
                                                      )}
                                                    </Box>
                                                  )}
                                                  {!entry.isVoucher && !entry.isAutoAdvance && entry.recordType && (
                                                    <Tooltip title="Print Invoice / Receipt">
                                                      <IconButton size="small" onClick={() => handleOpenPrintInvoice({ ...entry.raw, recordType: entry.recordType })}>
                                                        <PrinterOutlined style={{ fontSize: 12 }} />
                                                      </IconButton>
                                                    </Tooltip>
                                                  )}
                                                </TableCell>
                                              </TableRow>
                                            ))
                                          )}
                                        </TableBody>
                                      </Table>
                                    </TableContainer>
                                  ) : (
                                    <TableContainer
                                      sx={{
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 2,
                                        bgcolor: 'background.paper'
                                      }}
                                    >
                                      <Table size="small">
                                        <TableHead>
                                          <TableRow sx={{ bgcolor: getSubSurfaceSx(theme).bgcolor }}>
                                            <TableCell sx={subHeadCellSx}>Bill / Job #</TableCell>
                                            <TableCell sx={subHeadCellSx}>Type</TableCell>
                                            <TableCell sx={subHeadCellSx}>Date</TableCell>
                                            <TableCell sx={subHeadCellSx}>{itemsColumnLabel}</TableCell>
                                            <TableCell align="right" sx={subHeadCellSx}>Total Bill</TableCell>
                                            <TableCell align="right" sx={subHeadCellSx}>Paid</TableCell>
                                            <TableCell align="right" sx={subHeadCellSx}>Balance Due</TableCell>
                                            <TableCell align="center" sx={subHeadCellSx}>Actions</TableCell>
                                          </TableRow>
                                        </TableHead>
                                        <TableBody>
                                          {cust.invoices.length === 0 ? (
                                            <TableRow>
                                              <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                  No invoices linked to this customer yet.
                                                </Typography>
                                              </TableCell>
                                            </TableRow>
                                          ) : (
                                            cust.invoices.map((inv) => (
                                              <TableRow key={`${inv.recordType}-${inv.id}`} hover>
                                                <TableCell>
                                                  <Typography variant="caption" fontWeight={700} color="primary.main">
                                                    {formatInvoiceNo(inv)}
                                                  </Typography>
                                                </TableCell>
                                                <TableCell>
                                                  <Chip
                                                    label={
                                                      inv.recordType === 'Repair'
                                                        ? 'Repair Job'
                                                        : inv.recordType === 'Purchase'
                                                          ? 'Stock In Purchase'
                                                          : saleTypeLabel
                                                    }
                                                    size="small"
                                                    color={inv.recordType === 'Repair' ? 'warning' : inv.recordType === 'Purchase' ? 'info' : 'primary'}
                                                    variant="light"
                                                    sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                                                  />
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem', color: 'text.secondary' }}>
                                                  {formatFullDate(inv.time, inv.dateISO)}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                                  {inv.machineName || (isShopMode ? 'Retail Counter' : isStoreMode ? 'Factory Store' : 'Machine')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                                                  {formatPKR(inv.lineTotal)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ color: successTone.main, fontWeight: 600, fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
                                                  {formatPKR(inv.paidAmount)}
                                                </TableCell>
                                                <TableCell
                                                  align="right"
                                                  sx={{
                                                    color: inv.balanceAmount > 0 ? errorTone.main : successTone.main,
                                                    fontWeight: 700,
                                                    fontSize: '0.8125rem',
                                                    fontVariantNumeric: 'tabular-nums'
                                                  }}
                                                >
                                                  {formatPKR(inv.balanceAmount)}
                                                </TableCell>
                                                <TableCell align="center">
                                                  <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                                                    {inv.balanceAmount > 0 && (
                                                      <Tooltip
                                                        title={
                                                          inv.recordType === 'Purchase'
                                                            ? 'Pay Vendor Against This Bill'
                                                            : 'Receive Payment Against This Bill'
                                                        }
                                                      >
                                                        <IconButton
                                                          size="small"
                                                          color="success"
                                                          onClick={() =>
                                                            handleOpenVoucherModal(
                                                              cust.customerName,
                                                              inv,
                                                              inv.recordType === 'Purchase' ? 'Payout' : 'Receipt'
                                                            )
                                                          }
                                                        >
                                                          <DollarOutlined style={{ fontSize: 13 }} />
                                                        </IconButton>
                                                      </Tooltip>
                                                    )}
                                                    <Tooltip title="Print Bill / Receipt">
                                                      <IconButton size="small" color="primary" onClick={() => handleOpenPrintInvoice(inv)}>
                                                        <PrinterOutlined style={{ fontSize: 13 }} />
                                                      </IconButton>
                                                    </Tooltip>
                                                    {inv.recordType !== 'Repair' && typeof onUpdateSale === 'function' && (
                                                      <Tooltip title={`Edit ${saleTypeLabel}`}>
                                                        <IconButton size="small" color="info" onClick={() => handleOpenEditInvoice(inv)}>
                                                          <EditOutlined style={{ fontSize: 13 }} />
                                                        </IconButton>
                                                      </Tooltip>
                                                    )}
                                                    {canDelete && (
                                                      <Tooltip title="Delete Record">
                                                        <IconButton
                                                          size="small"
                                                          color="error"
                                                          onClick={() => {
                                                            setInvoiceToDelete(inv);
                                                            setDeleteInvoiceDialogOpen(true);
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
                                  )}
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
              count={filteredCustomers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}

        {/* TAB 2 CONTENT: CASHBOOK & PAYMENT VOUCHERS */}
        {activeTab === 'vouchers' && (
          <>
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
                    <TableCell sx={tableHeadCellSx}>Reference &amp; Notes</TableCell>
                    <TableCell sx={tableHeadCellSx}>Method</TableCell>
                    <TableCell align="right" sx={tableHeadCellSx}>Amount</TableCell>
                    <TableCell align="center" sx={{ ...tableHeadCellSx, pr: 2.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedVouchers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <WalletOutlined style={{ fontSize: 36, color: theme.palette.text.disabled, display: 'block', margin: '0 auto 8px' }} />
                        <Typography variant="h6" fontWeight={700} color="text.secondary">
                          No Vouchers Recorded Yet
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Use &ldquo;Record Payment / Payout&rdquo; to log customer receipts, refunds, or settlement discounts.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedVouchers.map((v) => {
                      const eType = v.entryType || 'Receipt';
                      const isPayout = eType === 'Payout';
                      const isAdj = eType === 'Adjustment';

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
                                    : isStoreMode
                                      ? 'Paid Out (Vendor / Cash)'
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
                            <Typography variant="body2" color="text.primary" fontWeight={500}>
                              {v.referenceLabel || 'General Account'}
                            </Typography>
                            {(v.referenceNo || v.notes) && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {[v.referenceNo ? `Ref: ${v.referenceNo}` : '', formatCleanVoucherNotes(v.notes)]
                                  .filter(Boolean)
                                  .join(' • ')}
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
                                  onClick={() => handleOpenPrintVoucher(v)}
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
                                <Tooltip title="Delete & Reverse Voucher">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setVoucherToDelete(v);
                                      setDeleteVoucherDialogOpen(true);
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredVouchers.length}
              rowsPerPage={voucherRowsPerPage}
              page={voucherPage}
              onPageChange={(e, newPage) => setVoucherPage(newPage)}
              onRowsPerPageChange={(e) => {
                setVoucherRowsPerPage(parseInt(e.target.value, 10));
                setVoucherPage(0);
              }}
            />
          </>
        )}
      </MainCard>

      {/* REGISTER / EDIT CUSTOMER MODAL */}
      <Dialog open={customerModalOpen} onClose={() => setCustomerModalOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSaveCustomer}>
          <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider' }}>
            {customerForm.id ? `Edit Party Details — ${customerForm.name}` : 'Register Customer Account'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Customer / Party Name"
                size="small"
                fullWidth
                required
                autoFocus
                placeholder="e.g. Mian Abdul Rehman Farms"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Phone Number"
                  size="small"
                  fullWidth
                  placeholder="0300-1234567"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                />
                <TextField
                  label="City / Address"
                  size="small"
                  fullWidth
                  placeholder="Lahore / Sargodha"
                  value={customerForm.city}
                  onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                />
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.3fr 1fr' }, gap: 2 }}>
                <TextField
                  select
                  size="small"
                  label="Opening Balance Type"
                  value={customerForm.balanceType}
                  onChange={(e) => setCustomerForm({ ...customerForm, balanceType: e.target.value })}
                >
                  <MenuItem value="none">Zero / Fresh Account</MenuItem>
                  <MenuItem value="receivable">{isStoreMode ? 'Receivable Balance (Party Owes Us)' : 'Receivable Balance (Debit)'}</MenuItem>
                  <MenuItem value="advance">{isStoreMode ? 'Payable / Advance Credit (We Owe Party)' : 'Advance Credit Paid by Party (Credit)'}</MenuItem>
                </TextField>

                <TextField
                  size="small"
                  type="number"
                  label="Opening Amount (PKR)"
                  disabled={customerForm.balanceType === 'none'}
                  inputProps={{ min: 0 }}
                  value={customerForm.openingAmount}
                  onChange={(e) => setCustomerForm({ ...customerForm, openingAmount: e.target.value })}
                />
              </Box>

              <TextField
                label="Account Notes"
                size="small"
                fullWidth
                multiline
                minRows={2}
                placeholder="Optional terms, credit limit or remarks..."
                value={customerForm.notes}
                onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, bgcolor: getSubSurfaceSx(theme).bgcolor }}>
            <AppButton intent="cancel" onClick={() => setCustomerModalOpen(false)} disabled={savingCustomer}>
              Cancel
            </AppButton>
            <AppButton type="submit" intent="primary" disabled={savingCustomer}>
              {savingCustomer ? 'Saving...' : customerForm.id ? 'Update Customer' : 'Save Customer Account'}
            </AppButton>
          </DialogActions>
        </Box>
      </Dialog>

      {/* SHARED PAYMENT / PAYOUT VOUCHER DIALOG */}
      <PaymentVoucherDialog
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        initialData={voucherInitData}
        customerDirectory={customerDirectory}
        customerLedgers={customerLedgers}
        onSaveVoucher={handleSaveVoucher}
      />

      {/* PRINT MODALS */}
      <CustomerLedgerPrintModals
        mode={mode}
        printModalOpen={printModalOpen}
        setPrintModalOpen={setPrintModalOpen}
        printCustomerData={printCustomerData}
        startDate={startDate}
        endDate={endDate}
        printInvoiceModalOpen={printInvoiceModalOpen}
        setPrintInvoiceModalOpen={setPrintInvoiceModalOpen}
        printInvoiceData={printInvoiceData}
        printRepairModalOpen={printRepairModalOpen}
        setPrintRepairModalOpen={setPrintRepairModalOpen}
        printRepairData={printRepairData}
        printVoucherModalOpen={printVoucherModalOpen}
        setPrintVoucherModalOpen={setPrintVoucherModalOpen}
        printVoucherData={printVoucherData}
        statementTitle={statementTitle}
        saleInvoiceTitle={saleInvoiceTitle}
        purchaseInvoiceTitle={purchaseInvoiceTitle}
      />

      {/* DELETE CUSTOMER DIALOG */}
      <Dialog open={deleteCustomerModalOpen} onClose={() => setDeleteCustomerModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>Delete Complete Customer Account?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete all records, invoices, and vouchers for <strong>{customerToDelete?.customerName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setDeleteCustomerModalOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDeleteCustomer} disabled={deletingCustomer}>
            {deletingCustomer ? 'Deleting...' : 'Delete Everything'}
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* DELETE INDIVIDUAL INVOICE / REPAIR DIALOG */}
      <Dialog open={deleteInvoiceDialogOpen} onClose={() => setDeleteInvoiceDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete {invoiceToDelete ? formatInvoiceNo(invoiceToDelete) : 'Record'}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete record <strong>{invoiceToDelete ? formatInvoiceNo(invoiceToDelete) : ''}</strong> for{' '}
            <strong>{invoiceToDelete?.customerName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setDeleteInvoiceDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDeleteInvoice}>
            Delete Record
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* DELETE / REVERSE VOUCHER DIALOG */}
      <Dialog open={deleteVoucherDialogOpen} onClose={() => setDeleteVoucherDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Reverse &amp; Delete Voucher?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Deleting voucher <strong>{voucherToDelete ? formatInvoiceNo(voucherToDelete) : ''}</strong> ({formatPKR(voucherToDelete?.amountPaid || 0)}) will automatically restore the customer&rsquo;s linked balance. Continue?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton intent="cancel" onClick={() => setDeleteVoucherDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDeleteVoucher}>
            Reverse &amp; Delete
          </AppButton>
        </DialogActions>
      </Dialog>

      {/* EDIT INDIVIDUAL SALE INVOICE DRAWER */}
      <Drawer anchor="right" open={editInvoiceDrawerOpen} onClose={() => setEditInvoiceDrawerOpen(false)}>
        <Box sx={{ width: { xs: 330, sm: 480 }, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Edit {saleTypeLabel} {editingInvoice ? formatInvoiceNo(editingInvoice) : ''}
            </Typography>
            <IconButton onClick={() => setEditInvoiceDrawerOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2.5 }} />

          {editingInvoice && (
            <Box component="form" onSubmit={handleEditInvoiceSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Customer Name"
                size="small"
                required
                fullWidth
                value={editingInvoice.customerName || ''}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                <TextField
                  label="Phone"
                  size="small"
                  fullWidth
                  value={editingInvoice.customerPhone || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, customerPhone: e.target.value })}
                />
                <TextField
                  label="City / Address"
                  size="small"
                  fullWidth
                  value={editingInvoice.cityAddress || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, cityAddress: e.target.value })}
                />
              </Box>

              {(editingInvoice.items || []).map((item, idx) => (
                <Box key={idx} sx={getSubSurfaceSx(theme, { p: 1.5, borderRadius: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 })}>
                  <Autocomplete
                    freeSolo
                    size="small"
                    options={itemOptions}
                    value={item.machineName || item.name || ''}
                    onChange={(_, val) => {
                      const updated = [...editingInvoice.items];
                      updated[idx] = { ...updated[idx], machineName: val || '', name: val || '' };
                      setEditingInvoice({ ...editingInvoice, items: updated });
                    }}
                    onInputChange={(_, val) => {
                      const updated = [...editingInvoice.items];
                      updated[idx] = { ...updated[idx], machineName: val || '', name: val || '' };
                      setEditingInvoice({ ...editingInvoice, items: updated });
                    }}
                    renderInput={(params) => <TextField {...params} label={itemFieldLabel} required />}
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
                    <TextField
                      label="Qty"
                      type="number"
                      size="small"
                      value={item.qty || 1}
                      onChange={(e) => {
                        const updated = [...editingInvoice.items];
                        updated[idx] = { ...updated[idx], qty: parseInt(e.target.value, 10) || 1 };
                        setEditingInvoice({ ...editingInvoice, items: updated });
                      }}
                    />
                    <TextField
                      label="Rate"
                      type="number"
                      size="small"
                      value={item.unitPrice || 0}
                      onChange={(e) => {
                        const updated = [...editingInvoice.items];
                        updated[idx] = { ...updated[idx], unitPrice: parseFloat(e.target.value) || 0 };
                        setEditingInvoice({ ...editingInvoice, items: updated });
                      }}
                    />
                    <TextField
                      label="Disc (%)"
                      type="number"
                      size="small"
                      value={item.discount || 0}
                      onChange={(e) => {
                        const updated = [...editingInvoice.items];
                        updated[idx] = { ...updated[idx], discount: parseFloat(e.target.value) || 0 };
                        setEditingInvoice({ ...editingInvoice, items: updated });
                      }}
                    />
                  </Box>
                </Box>
              ))}

              <TextField
                label="Paid Amount (PKR)"
                type="number"
                size="small"
                fullWidth
                value={editingInvoice.paidAmount || 0}
                onChange={(e) => setEditingInvoice({ ...editingInvoice, paidAmount: parseFloat(e.target.value) || 0 })}
              />

              <TextField
                label={isShopMode ? 'Notes / Remarks' : 'Warranty Terms'}
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={isShopMode ? editingInvoice.notes || '' : editingInvoice.warrantyTerms || ''}
                onChange={(e) =>
                  setEditingInvoice({
                    ...editingInvoice,
                    [isShopMode ? 'notes' : 'warrantyTerms']: e.target.value
                  })
                }
              />

              <AppButton type="submit" intent="primary" fullWidth>
                Save Invoice Changes
              </AppButton>
            </Box>
          )}
        </Box>
      </Drawer>

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

CustomerLedgerWorkspace.propTypes = {
  mode: PropTypes.oneOf(['machine', 'shop', 'store']),
  headerTitle: PropTypes.string,
  subtitle: PropTypes.string,
  paymentsPath: PropTypes.string,
  paymentsButtonLabel: PropTypes.string,
  accountsHelper: PropTypes.string,
  debitHelper: PropTypes.string,
  billsLabel: PropTypes.string,
  defaultCityLabel: PropTypes.string,
  documentsTabLabel: PropTypes.string,
  itemsColumnLabel: PropTypes.string,
  saleTypeLabel: PropTypes.string,
  itemFieldLabel: PropTypes.string,
  emptyAccountsHint: PropTypes.string,
  statementTitle: PropTypes.string,
  saleInvoiceTitle: PropTypes.string,
  purchaseInvoiceTitle: PropTypes.string,
  repairPath: PropTypes.string,
  extraHeaderActions: PropTypes.node,
  customerLedgers: PropTypes.array,
  customerDirectory: PropTypes.array,
  customerPayments: PropTypes.array,
  itemOptions: PropTypes.array,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onStartDateChange: PropTypes.func,
  onEndDateChange: PropTypes.func,
  canDelete: PropTypes.bool,
  onAddCustomer: PropTypes.func,
  onUpdateCustomer: PropTypes.func,
  onDeleteCustomer: PropTypes.func,
  onAddPayment: PropTypes.func,
  onDeletePayment: PropTypes.func,
  onUpdateSale: PropTypes.func,
  onDeleteSale: PropTypes.func,
  onDeleteMultipleSales: PropTypes.func,
  onDeleteRepair: PropTypes.func
};
