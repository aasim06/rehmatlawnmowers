import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import Autocomplete from '@mui/material/Autocomplete';
import Tooltip from '@mui/material/Tooltip';

// ant design icons
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';

import MainCard from 'components/MainCard';
import { useStoreInventory } from 'context/StoreInventoryContext';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';

const formatFullDate = (timeStr, dateISO) => {
  if (dateISO) {
    const d = new Date(dateISO);
    if (!isNaN(d.getTime())) {
      const dateFormatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeFormatted = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${dateFormatted}, ${timeFormatted}`;
    }
  }
  if (timeStr && timeStr.includes('Today,')) {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return timeStr.replace('Today,', `${todayStr},`);
  }
  return timeStr || '';
};

export default function CustomerLedgerPage() {
  const {
    machineSales = [],
    machineRepairs = [],
    machineModels = [],
    customerPayments = [],
    addCustomerPayment,
    updateMachineSale,
    deleteMachineSale,
    deleteMachineRepair,
    updateMachineRepair
  } = useStoreInventory();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // Expand Customer Invoices Row State
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // Individual Machine Invoice Print Modal State
  const [printInvoiceModalOpen, setPrintInvoiceModalOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);

  // Individual Repair Job Print Modal State
  const [printRepairModalOpen, setPrintRepairModalOpen] = useState(false);
  const [printRepairData, setPrintRepairData] = useState(null);

  // Individual Machine Invoice Edit Drawer State
  const [editInvoiceDrawerOpen, setEditInvoiceDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Individual Machine Invoice Delete Dialog State
  const [deleteInvoiceDialogOpen, setDeleteInvoiceDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedCustomerForPay, setSelectedCustomerForPay] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    customerName: '',
    invoiceId: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  });

  // Statement Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printCustomerData, setPrintCustomerData] = useState(null);

  // Group Machine Sales AND Machine Repairs by Customer
  const customerMap = {};

  // 1. Process Machine Sales
  machineSales.forEach((sale) => {
    const custKey = (sale.customerName || 'Walk-in Customer').trim();
    if (!customerMap[custKey]) {
      customerMap[custKey] = {
        customerName: custKey,
        phone: sale.customerPhone || '',
        city: sale.cityAddress || '',
        totalInvoicesCount: 0,
        totalPurchasesVal: 0,
        totalPaidVal: 0,
        balanceVal: 0,
        invoices: []
      };
    }
    const billTotal = sale.lineTotal || 0;
    const paid = sale.paidAmount || 0;

    customerMap[custKey].totalInvoicesCount += 1;
    customerMap[custKey].totalPurchasesVal += billTotal;
    customerMap[custKey].totalPaidVal += paid;
    customerMap[custKey].invoices.push({
      ...sale,
      recordType: 'Sale'
    });
    if (!customerMap[custKey].phone && sale.customerPhone) customerMap[custKey].phone = sale.customerPhone;
    if (!customerMap[custKey].city && sale.cityAddress) customerMap[custKey].city = sale.cityAddress;
  });

  // 2. Process Machine Repairs
  machineRepairs.forEach((repair) => {
    const custKey = (repair.customerName || 'Walk-in Customer').trim();
    if (!customerMap[custKey]) {
      customerMap[custKey] = {
        customerName: custKey,
        phone: repair.customerPhone || '',
        city: repair.cityAddress || '',
        totalInvoicesCount: 0,
        totalPurchasesVal: 0,
        totalPaidVal: 0,
        balanceVal: 0,
        invoices: []
      };
    }
    const billTotal = repair.totalCost || repair.partsCost || 0;
    const paid = repair.paidAmount || 0;

    customerMap[custKey].totalInvoicesCount += 1;
    customerMap[custKey].totalPurchasesVal += billTotal;
    customerMap[custKey].totalPaidVal += paid;
    customerMap[custKey].invoices.push({
      ...repair,
      id: repair.repairNo || repair.id,
      time: repair.receivedDate,
      lineTotal: billTotal,
      recordType: 'Repair'
    });
    if (!customerMap[custKey].phone && repair.customerPhone) customerMap[custKey].phone = repair.customerPhone;
    if (!customerMap[custKey].city && repair.cityAddress) customerMap[custKey].city = repair.cityAddress;
  });

  // Calculate Net Balances
  const customerList = Object.values(customerMap).map((cust) => {
    const balance = Math.max(0, cust.totalPurchasesVal - cust.totalPaidVal);
    return { ...cust, balanceVal: balance };
  });

  // Filtered List
  const filteredCustomers = customerList.filter(
    (c) =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Computed Overall Summary
  const grandTotalBilled = customerList.reduce((acc, c) => acc + c.totalPurchasesVal, 0);
  const grandTotalCollected = customerList.reduce((acc, c) => acc + c.totalPaidVal, 0);
  const grandTotalReceivables = customerList.reduce((acc, c) => acc + c.balanceVal, 0);

  // Open Payment Modal
  const handleOpenPaymentModal = (cust) => {
    setSelectedCustomerForPay(cust);
    setPaymentForm({
      customerName: cust.customerName,
      invoiceId: cust.invoices.length === 1 ? cust.invoices[0].id : '',
      amountPaid: '',
      remainingBalance: cust.balanceVal,
      paymentMethod: 'Cash',
      referenceNo: '',
      notes: ''
    });
    setPaymentModalOpen(true);
  };

  // Submit Payment Handler
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const paidNum = parseFloat(paymentForm.amountPaid) || 0;
    if (paidNum <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    addCustomerPayment({
      customerName: paymentForm.customerName,
      invoiceId: paymentForm.invoiceId,
      amountPaid: paidNum,
      paymentMethod: paymentForm.paymentMethod,
      referenceNo: paymentForm.referenceNo,
      notes: paymentForm.notes
    });

    setPaymentModalOpen(false);
  };

  // Open Print Invoice / Repair Modal
  const handleOpenPrintInvoice = (inv) => {
    if (inv.recordType === 'Repair') {
      setPrintRepairData(inv);
      setPrintRepairModalOpen(true);
    } else {
      setPrintInvoiceData(inv);
      setPrintInvoiceModalOpen(true);
    }
  };

  // Open Edit Invoice Drawer
  const handleOpenEditInvoice = (inv) => {
    const itemsArray = (inv.items && inv.items.length > 0) ? inv.items : [
      {
        machineName: inv.machineName,
        serialNo: inv.serialNo,
        qty: inv.qty,
        unitPrice: inv.unitPrice,
        discount: inv.discount || 0
      }
    ];

    setEditingInvoice({ ...inv, items: itemsArray });
    setEditInvoiceDrawerOpen(true);
  };

  const handleEditInvoiceSubmit = (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const itemsList = (editingInvoice.items && editingInvoice.items.length > 0)
      ? editingInvoice.items.map((i) => {
          const q = parseInt(i.qty) || 1;
          const p = parseFloat(i.unitPrice) || 0;
          const discPercent = parseFloat(i.discount) || 0;
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
        })
      : [{
          machineName: editingInvoice.machineName,
          serialNo: editingInvoice.serialNo,
          qty: parseInt(editingInvoice.qty) || 1,
          unitPrice: parseFloat(editingInvoice.unitPrice) || 0,
          discount: parseFloat(editingInvoice.discount) || 0,
          discountAmount: (((parseInt(editingInvoice.qty) || 1) * (parseFloat(editingInvoice.unitPrice) || 0)) * (parseFloat(editingInvoice.discount) || 0)) / 100,
          lineTotal: Math.max(0, ((parseInt(editingInvoice.qty) || 1) * (parseFloat(editingInvoice.unitPrice) || 0)) - ((((parseInt(editingInvoice.qty) || 1) * (parseFloat(editingInvoice.unitPrice) || 0)) * (parseFloat(editingInvoice.discount) || 0)) / 100))
        }];

    const subTotal = itemsList.reduce((sum, i) => sum + i.lineTotal, 0);
    const discSum = itemsList.reduce((sum, i) => sum + (i.discountAmount || 0), 0);
    const total = subTotal;
    const totalQtySum = itemsList.reduce((sum, i) => sum + i.qty, 0);
    const paid = parseFloat(editingInvoice.paidAmount) || 0;
    const bal = Math.max(0, total - paid);
    const status = paid >= total ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    const firstMachine = itemsList[0] || {};

    updateMachineSale(editingInvoice.id, {
      customerName: editingInvoice.customerName,
      customerPhone: editingInvoice.customerPhone,
      cityAddress: editingInvoice.cityAddress,
      items: itemsList,
      machineName: itemsList.length > 1 ? `${firstMachine.machineName} (+${itemsList.length - 1} more)` : firstMachine.machineName,
      serialNo: firstMachine.serialNo,
      qty: totalQtySum,
      unitPrice: firstMachine.unitPrice,
      subTotal,
      discountAmount: discSum,
      lineTotal: total,
      paidAmount: paid,
      balanceAmount: bal,
      paymentStatus: status,
      warrantyTerms: editingInvoice.warrantyTerms
    });

    setEditInvoiceDrawerOpen(false);
  };

  const handleEditItemChange = (index, field, value) => {
    setEditingInvoice((prev) => {
      if (!prev) return prev;
      const updated = [...(prev.items || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const handleAddEditItemRow = () => {
    setEditingInvoice((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: [
          ...(prev.items || []),
          { machineName: '', serialNo: '', qty: 1, unitPrice: 0, discount: 0 }
        ]
      };
    });
  };

  const handleRemoveEditItemRow = (index) => {
    setEditingInvoice((prev) => {
      if (!prev || (prev.items || []).length <= 1) return prev;
      return {
        ...prev,
        items: prev.items.filter((_, idx) => idx !== index)
      };
    });
  };

  // Delete Invoice / Repair Handler
  const handleConfirmDeleteInvoice = () => {
    if (invoiceToDelete) {
      if (invoiceToDelete.recordType === 'Repair') {
        deleteMachineRepair(invoiceToDelete.id);
      } else {
        deleteMachineSale(invoiceToDelete.id);
      }
      setInvoiceToDelete(null);
      setDeleteInvoiceDialogOpen(false);
    }
  };
  const handlePrintStatement = (cust) => {
    const custPaymentsList = customerPayments.filter(
      (p) => p.customerName.toLowerCase() === cust.customerName.toLowerCase()
    );
    setPrintCustomerData({
      ...cust,
      payments: custPaymentsList
    });
    setPrintModalOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Top Banner Header */}
      <MainCard
        sx={{
          mb: 3,
          background: (theme) => (theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#ffffff'),
          borderLeft: '5px solid #3b82f6'
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h3" fontWeight={800} color="textPrimary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserOutlined style={{ color: '#3b82f6' }} /> Customer Receivables & Khaata Ledger
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Track customer accounts, machine sale receivables, record partial/full cash payments, and print account statements.
            </Typography>
          </Grid>

          {/* Metric Summary Cards */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, width: '100%' }}>
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'),
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption" color="textSecondary" fontWeight={700} display="block" noWrap>
                  TOTAL BILLED
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                  Rs. {grandTotalBilled.toLocaleString()}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4'),
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0'),
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption" color="textSecondary" fontWeight={700} display="block" noWrap>
                  COLLECTED
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="success.main">
                  Rs. {grandTotalCollected.toLocaleString()}
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2'),
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'),
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="caption" color="textSecondary" fontWeight={700} display="block" noWrap>
                  RECEIVABLES
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="error.main">
                  Rs. {grandTotalReceivables.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </MainCard>

      {/* Main Ledger Card */}
      <MainCard>
        {/* Search Bar */}
        <Box sx={{ mb: 2.5, maxWidth: 450 }}>
          <OutlinedInput
            fullWidth
            placeholder="Search Customer by Name, Phone, City..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />
        </Box>

        {/* Customer Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fafafa') }}>
              <TableRow>
                <TableCell><strong>CUSTOMER NAME & CITY</strong></TableCell>
                <TableCell align="center"><strong>PHONE NO</strong></TableCell>
                <TableCell align="center"><strong>INVOICES</strong></TableCell>
                <TableCell align="right"><strong>TOTAL PURCHASES</strong></TableCell>
                <TableCell align="right"><strong>AMOUNT PAID</strong></TableCell>
                <TableCell align="right"><strong>PENDING BALANCE</strong></TableCell>
                <TableCell align="center"><strong>ACTIONS</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No Customer Ledgers Found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const isExpanded = expandedCustomer === cust.customerName;

                  return (
                    <React.Fragment key={idx}>
                      <TableRow hover sx={{ bgcolor: isExpanded ? (theme => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc') : 'inherit' }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => setExpandedCustomer(isExpanded ? null : cust.customerName)}
                              sx={{ color: 'primary.main' }}
                            >
                              {isExpanded ? <UpOutlined /> : <DownOutlined />}
                            </IconButton>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={800} color="textPrimary">
                                {cust.customerName}
                              </Typography>
                              {cust.city && (
                                <Typography variant="caption" color="textSecondary" display="block">
                                  {cust.city}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={600} color="textSecondary">
                            {cust.phone || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${cust.totalInvoicesCount} Invoices`}
                            size="small"
                            color={isExpanded ? 'primary' : 'default'}
                            variant={isExpanded ? 'filled' : 'outlined'}
                            clickable
                            onClick={() => setExpandedCustomer(isExpanded ? null : cust.customerName)}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={700}>
                            Rs. {cust.totalPurchasesVal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={700} color="success.main">
                            Rs. {cust.totalPaidVal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle1" fontWeight={800} color={cust.balanceVal > 0 ? 'error.main' : 'success.main'}>
                            Rs. {cust.balanceVal.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<DollarOutlined />}
                              onClick={() => handleOpenPaymentModal(cust)}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}
                            >
                              Receive Payment
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PrinterOutlined />}
                              onClick={() => handlePrintStatement(cust)}
                              sx={{ fontWeight: 700 }}
                            >
                              Statement
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Invoices Breakdown Row */}
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2, p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f1f5f9'), borderRadius: 2, border: '1px solid #cbd5e1' }}>
                              <Typography variant="subtitle2" fontWeight={800} color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                📄 Customer Transactions & Invoices Breakdown ({cust.invoices.length})
                              </Typography>
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                <Table size="small">
                                  <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#e2e8f0') }}>
                                    <TableRow>
                                      <TableCell><strong>TYPE</strong></TableCell>
                                      <TableCell><strong>REF NO / DATE</strong></TableCell>
                                      <TableCell><strong>MACHINE / SERVICE DETAILS</strong></TableCell>
                                      <TableCell align="center"><strong>QTY</strong></TableCell>
                                      <TableCell align="right"><strong>NET BILL</strong></TableCell>
                                      <TableCell align="right"><strong>PAID</strong></TableCell>
                                      <TableCell align="right"><strong>BALANCE</strong></TableCell>
                                      <TableCell align="center"><strong>STATUS</strong></TableCell>
                                      <TableCell align="center"><strong>ACTIONS</strong></TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {cust.invoices.map((inv) => {
                                      const isRepair = inv.recordType === 'Repair';
                                      const invItemsList = isRepair
                                        ? (inv.repairItems || [{ model: inv.machineName, specification: inv.faultDescription }])
                                        : ((inv.items && inv.items.length > 0) ? inv.items : [{ machineName: inv.machineName, serialNo: inv.serialNo, qty: inv.qty, unitPrice: inv.unitPrice }]);

                                      const displayTitle = isRepair
                                        ? (invItemsList[0]?.model || inv.machineName)
                                        : (invItemsList[0]?.machineName || inv.machineName);

                                      const displaySubtitle = isRepair
                                        ? (invItemsList[0]?.specification || inv.faultDescription || 'General Service')
                                        : (invItemsList.length > 1 ? `+ ${invItemsList.length - 1} more machines` : '');

                                      const qtyVal = isRepair
                                        ? (invItemsList.length || 1)
                                        : (inv.qty || invItemsList.reduce((acc, i) => acc + (i.qty || 1), 0));

                                      const totalVal = isRepair ? (inv.totalCost || inv.lineTotal || 0) : (inv.lineTotal || 0);
                                      const paidVal = inv.paidAmount || 0;
                                      const balVal = Math.max(0, totalVal - paidVal);

                                      return (
                                        <TableRow key={inv.id} hover>
                                          <TableCell>
                                            <Chip
                                              label={isRepair ? 'Machine Repair' : 'Machine Sale'}
                                              color={isRepair ? 'warning' : 'primary'}
                                              size="small"
                                              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                                            />
                                          </TableCell>

                                          <TableCell>
                                            <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                                              {inv.id}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" display="block">
                                              {isRepair ? inv.receivedDate : formatFullDate(inv.time, inv.dateISO)}
                                            </Typography>
                                          </TableCell>

                                          <TableCell>
                                            <Typography variant="subtitle2" fontWeight={700}>
                                              {displayTitle}
                                            </Typography>
                                            {displaySubtitle && (
                                              <Typography variant="caption" color="textSecondary" display="block">
                                                {displaySubtitle}
                                              </Typography>
                                            )}
                                          </TableCell>

                                          <TableCell align="center">
                                            <Typography variant="subtitle2" fontWeight={700}>
                                              {qtyVal}
                                            </Typography>
                                          </TableCell>

                                          <TableCell align="right">
                                            <Typography variant="subtitle2" fontWeight={800}>
                                              Rs. {totalVal.toLocaleString()}
                                            </Typography>
                                          </TableCell>

                                          <TableCell align="right">
                                            <Typography variant="body2" color="success.main" fontWeight={700}>
                                              Rs. {paidVal.toLocaleString()}
                                            </Typography>
                                          </TableCell>

                                          <TableCell align="right">
                                            <Typography variant="body2" color={balVal > 0 ? 'error.main' : 'textSecondary'} fontWeight={800}>
                                              Rs. {balVal.toLocaleString()}
                                            </Typography>
                                          </TableCell>

                                          <TableCell align="center">
                                            <Chip
                                              label={inv.paymentStatus || inv.repairStatus || (paidVal >= totalVal ? 'Paid' : paidVal > 0 ? 'Partial' : 'Unpaid')}
                                              color={(paidVal >= totalVal || inv.repairStatus === 'Delivered') ? 'success' : paidVal > 0 ? 'warning' : 'error'}
                                              size="small"
                                            />
                                          </TableCell>

                                          <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                              <Tooltip title="Print Customer Machine Bill">
                                                <IconButton color="info" size="small" onClick={() => handleOpenPrintInvoice(inv)}>
                                                  <PrinterOutlined />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Edit Record">
                                                <IconButton color="primary" size="small" onClick={() => handleOpenEditInvoice(inv)}>
                                                  <EditOutlined />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Delete Record">
                                                <IconButton color="error" size="small" onClick={() => { setInvoiceToDelete(inv); setDeleteInvoiceDialogOpen(true); }}>
                                                  <DeleteOutlined />
                                                </IconButton>
                                              </Tooltip>
                                            </Stack>
                                          </TableCell>
                                        </TableRow>
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
      </MainCard>

      {/* RECORD CUSTOMER PAYMENT MODAL */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)'
          }
        }}
      >
        <form onSubmit={handlePaymentSubmit}>
          <DialogTitle sx={{ fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <DollarOutlined /> Receive Payment (Khaata Entry)
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedCustomerForPay && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f0fdf4'), borderRadius: 1.5, border: '1px solid #bbf7d0' }}>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    {selectedCustomerForPay.customerName}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 0.5 }}>
                    Current Pending Balance: <strong style={{ color: '#ef4444' }}>Rs. {selectedCustomerForPay.balanceVal.toLocaleString()}</strong>
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                    APPLY TO INVOICE (OPTIONAL)
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={paymentForm.invoiceId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, invoiceId: e.target.value })}
                  >
                    <MenuItem value="">-- All Customer Invoices --</MenuItem>
                    {selectedCustomerForPay.invoices.map((inv) => (
                      <MenuItem key={inv.id} value={inv.id}>
                        {inv.id} (Bill: Rs. {inv.lineTotal.toLocaleString()})
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                        AMOUNT RECEIVED (RS) *
                      </Typography>
                      <TextField
                        type="number"
                        fullWidth
                        required
                        placeholder="Enter amount received..."
                        inputProps={{ min: 0 }}
                        value={paymentForm.amountPaid}
                        onChange={(e) => {
                          const val = e.target.value;
                          const paidNum = parseFloat(val) || 0;
                          const currentPending = selectedCustomerForPay ? selectedCustomerForPay.balanceVal : 0;
                          const calculatedRem = Math.max(0, currentPending - paidNum);
                          setPaymentForm({
                            ...paymentForm,
                            amountPaid: val,
                            remainingBalance: calculatedRem
                          });
                        }}
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                        NEW REMAINING BALANCE (RS)
                      </Typography>
                      <TextField
                        type="number"
                        fullWidth
                        placeholder="0"
                        inputProps={{ min: 0 }}
                        value={
                          paymentForm.remainingBalance !== undefined && paymentForm.remainingBalance !== ''
                            ? paymentForm.remainingBalance
                            : (selectedCustomerForPay ? Math.max(0, selectedCustomerForPay.balanceVal - (parseFloat(paymentForm.amountPaid) || 0)) : 0)
                        }
                        onChange={(e) => {
                          const remVal = e.target.value;
                          const remNum = parseFloat(remVal) || 0;
                          const currentPending = selectedCustomerForPay ? selectedCustomerForPay.balanceVal : 0;
                          const calculatedPaid = Math.max(0, currentPending - remNum);
                          setPaymentForm({
                            ...paymentForm,
                            amountPaid: calculatedPaid,
                            remainingBalance: remVal
                          });
                        }}
                        sx={{
                          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5'),
                          borderRadius: 1
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                    PAYMENT METHOD *
                  </Typography>
                  <TextField
                    select
                    fullWidth
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer / Online</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Easypaisa / JazzCash">Easypaisa / JazzCash</MenuItem>
                  </TextField>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                    REFERENCE / CHEQUE NO
                  </Typography>
                  <TextField
                    placeholder="e.g. TXN-908123"
                    fullWidth
                    value={paymentForm.referenceNo}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNo: e.target.value })}
                  />
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                    NOTES / REMARKS
                  </Typography>
                  <TextField
                    placeholder="Optional transaction details..."
                    fullWidth
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'), borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800, px: 3 }}>
              Confirm Payment Collection
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* PRINTABLE CUSTOMER ACCOUNT STATEMENT MODAL */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-customer-statement, #printable-customer-statement * {
                visibility: visible !important;
              }
              #printable-customer-statement {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>📄 Customer Account Ledger Statement</Typography>
          <Chip label="Statement Receipt" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {printCustomerData && (
            <Box id="printable-customer-statement" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
              {/* 🏢 Watermark Background Logo */}
              <Box
                component="img"
                src={rehmatLogo}
                alt="Watermark Logo"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '55%',
                  maxWidth: 360,
                  opacity: 0.08,
                  pointerEvents: 'none',
                  zIndex: 0,
                  borderRadius: '50%'
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h3" fontWeight={800} align="center" sx={{ color: '#10b981', mb: 0.5, letterSpacing: '0.5px' }}>
                  REHMAT LAWN MOWERS
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} align="center" sx={{ color: '#10b981', mb: 0.5 }}>
                  FACTORY STORE CUSTOMER KHAATA LEDGER
                </Typography>
                <Typography variant="caption" display="block" align="center" color="textSecondary" sx={{ mb: 2 }}>
                  Official Customer Account Statement Voucher
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">CUSTOMER NAME:</Typography>
                    <Typography variant="h5" fontWeight={800} color="primary.main">{printCustomerData.customerName}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Phone: {printCustomerData.phone || 'N/A'} | Address: {printCustomerData.city || 'Lahore'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="textSecondary" display="block">STATEMENT DATE:</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>TOTAL INVOICES:</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{printCustomerData.invoices.length} Transactions</Typography>
                  </Grid>
                </Grid>

                {/* Invoices Breakdown Table */}
                <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: 1, mb: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                      <TableRow>
                        <TableCell><strong>REF NO / DATE</strong></TableCell>
                        <TableCell><strong>TYPE</strong></TableCell>
                        <TableCell align="right"><strong>BILL TOTAL</strong></TableCell>
                        <TableCell align="right"><strong>PAID</strong></TableCell>
                        <TableCell align="right"><strong>BALANCE DUE</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {printCustomerData.invoices.map((inv) => (
                        <TableRow key={inv.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>{inv.id}</Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {inv.receivedDate || formatFullDate(inv.time, inv.dateISO)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={inv.recordType || 'Sale'} size="small" color={inv.recordType === 'Repair' ? 'warning' : 'primary'} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell align="right">Rs. {(inv.lineTotal || inv.totalCost || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>Rs. {(inv.paidAmount || 0).toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: (inv.lineTotal - (inv.paidAmount || 0)) > 0 ? 'error.main' : 'textSecondary', fontWeight: 700 }}>
                            Rs. {Math.max(0, (inv.lineTotal || inv.totalCost || 0) - (inv.paidAmount || 0)).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ bgcolor: '#ecfdf5', p: 2, borderRadius: 1.5, border: '1px solid #a7f3d0', mb: 2 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">TOTAL BILLED: Rs. {printCustomerData.totalPurchasesVal.toLocaleString()}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block">TOTAL PAID: Rs. {printCustomerData.totalPaidVal.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="textSecondary" display="block">RECEIVABLE BALANCE:</Typography>
                      <Typography variant="h3" fontWeight={800} color={printCustomerData.balanceVal > 0 ? '#dc2626' : '#059669'}>
                        Rs. {printCustomerData.balanceVal.toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="no-print" sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={() => setPrintModalOpen(false)} size="large" className="no-print">
            Close & Continue
          </Button>
          <Button variant="contained" color="success" startIcon={<PrinterOutlined />} onClick={() => window.print()} size="large" className="no-print" sx={{ px: 3, fontWeight: 700 }}>
            Print Account Statement
          </Button>
        </DialogActions>
      </Dialog>

      {/* EDIT INDIVIDUAL MACHINE INVOICE DRAWER */}
      <Drawer anchor="right" open={editInvoiceDrawerOpen} onClose={() => setEditInvoiceDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 620 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" sx={{ mb: 2.5, fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            ✏️ Edit Machine Sale Record
          </Typography>
          {editingInvoice && (() => {
            const editItemsList = editingInvoice.items && editingInvoice.items.length > 0 ? editingInvoice.items : [
              { machineName: editingInvoice.machineName || '', serialNo: editingInvoice.serialNo || '', qty: editingInvoice.qty || 1, unitPrice: editingInvoice.unitPrice || 0, discount: 0 }
            ];

            const editSubTotal = editItemsList.reduce((sum, i) => {
              const q = parseInt(i.qty) || 1;
              const p = parseFloat(i.unitPrice) || 0;
              const discPercent = parseFloat(i.discount) || 0;
              const gross = q * p;
              const discAmt = (gross * discPercent) / 100;
              return sum + Math.max(0, gross - discAmt);
            }, 0);

            const editPaid = parseFloat(editingInvoice.paidAmount) || 0;
            const editBalance = Math.max(0, editSubTotal - editPaid);

            return (
              <form onSubmit={handleEditInvoiceSubmit}>
                <Stack spacing={2.5}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Customer Name *"
                        fullWidth
                        required
                        value={editingInvoice.customerName}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Customer Phone"
                        fullWidth
                        value={editingInvoice.customerPhone}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, customerPhone: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="City / Address"
                        fullWidth
                        value={editingInvoice.cityAddress}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, cityAddress: e.target.value })}
                      />
                    </Grid>
                  </Grid>

                  {/* Machine Items List Section */}
                  <Box sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc'), borderRadius: 1.5, border: '1px solid #cbd5e1' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ mb: 1.5 }}>
                      MACHINES INVOICED ({editItemsList.length} Items)
                    </Typography>

                    <Stack spacing={2}>
                      {editItemsList.map((rowItem, idx) => {
                        const q = parseInt(rowItem.qty) || 1;
                        const p = parseFloat(rowItem.unitPrice) || 0;
                        const d = parseFloat(rowItem.discount) || 0;
                        const gross = q * p;
                        const lineTot = Math.max(0, gross - (gross * d) / 100);

                        return (
                          <Box key={idx} sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #cbd5e1' }}>
                            <Grid container spacing={1.5} alignItems="center">
                              <Grid item xs={12} sm={7}>
                                <Autocomplete
                                  freeSolo
                                  options={machineModels}
                                  value={rowItem.machineName}
                                  onChange={(event, newValue) => handleEditItemChange(idx, 'machineName', newValue || '')}
                                  onInputChange={(event, newInputValue) => handleEditItemChange(idx, 'machineName', newInputValue || '')}
                                  renderInput={(params) => (
                                    <TextField {...params} label="MACHINE MODEL *" size="small" required />
                                  )}
                                />
                              </Grid>
                              <Grid item xs={12} sm={5}>
                                <TextField
                                  label="SERIAL / ENGINE NO"
                                  size="small"
                                  fullWidth
                                  value={rowItem.serialNo}
                                  onChange={(e) => handleEditItemChange(idx, 'serialNo', e.target.value)}
                                />
                              </Grid>

                              <Grid item xs={4}>
                                <TextField
                                  label="QTY *"
                                  type="number"
                                  size="small"
                                  fullWidth
                                  required
                                  inputProps={{ min: 1, style: { textAlign: 'center' } }}
                                  value={rowItem.qty}
                                  onChange={(e) => handleEditItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  label="RATE (RS) *"
                                  type="number"
                                  size="small"
                                  fullWidth
                                  required
                                  inputProps={{ min: 0, style: { textAlign: 'right' } }}
                                  value={rowItem.unitPrice}
                                  onChange={(e) => handleEditItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                />
                              </Grid>
                              <Grid item xs={4}>
                                <TextField
                                  label="DISC (%)"
                                  type="number"
                                  size="small"
                                  fullWidth
                                  inputProps={{ min: 0, max: 100, style: { textAlign: 'right' } }}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                                  }}
                                  value={rowItem.discount || ''}
                                  onChange={(e) => handleEditItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                                />
                              </Grid>

                              <Grid item xs={8}>
                                <Typography variant="caption" color="textSecondary" fontWeight={600}>
                                  Line Total: <strong style={{ color: '#16a34a' }}>Rs. {lineTot.toLocaleString()}</strong>
                                </Typography>
                              </Grid>
                              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                                {editItemsList.length > 1 && (
                                  <Button
                                    size="small"
                                    color="error"
                                    startIcon={<DeleteOutlined />}
                                    onClick={() => handleRemoveEditItemRow(idx)}
                                    sx={{ textTransform: 'none' }}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </Grid>
                            </Grid>
                          </Box>
                        );
                      })}
                    </Stack>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PlusOutlined />}
                      onClick={handleAddEditItemRow}
                      sx={{ mt: 1.5, fontWeight: 700 }}
                    >
                      + Add Machine Item
                    </Button>
                  </Box>

                  {/* Financial Summary */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="TOTAL INVOICE (RS)"
                        fullWidth
                        value={`Rs. ${editSubTotal.toLocaleString()}`}
                        InputProps={{
                          readOnly: true,
                          style: { fontWeight: 800, color: '#16a34a' }
                        }}
                        sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5'), borderRadius: 1 }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="PAID AMOUNT (RS) *"
                        type="number"
                        fullWidth
                        required
                        value={editingInvoice.paidAmount}
                        onChange={(e) => setEditingInvoice({ ...editingInvoice, paidAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="REMAINING BALANCE (RS)"
                        fullWidth
                        value={`Rs. ${editBalance.toLocaleString()}`}
                        InputProps={{
                          readOnly: true,
                          style: { fontWeight: 800, color: editBalance > 0 ? '#ef4444' : '#16a34a' }
                        }}
                        sx={{
                          bgcolor: editBalance > 0 ? (theme => theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2') : (theme => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5'),
                          borderRadius: 1
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Warranty Terms & Note"
                    fullWidth
                    multiline
                    rows={2}
                    value={editingInvoice.warrantyTerms}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, warrantyTerms: e.target.value })}
                  />

                  <Button variant="contained" color="primary" type="submit" fullWidth size="large" sx={{ fontWeight: 700, mt: 1, py: 1.2 }}>
                    Update Machine Sale Record
                  </Button>
                </Stack>
              </form>
            );
          })()}
        </Box>
      </Drawer>

      {/* DELETE INDIVIDUAL MACHINE INVOICE DIALOG */}
      <Dialog open={deleteInvoiceDialogOpen} onClose={() => setDeleteInvoiceDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Machine Sale Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the machine sale invoice <strong>{invoiceToDelete?.id}</strong> for <strong>{invoiceToDelete?.customerName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteInvoiceDialogOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleConfirmDeleteInvoice} color="error" variant="contained">Delete Invoice</Button>
        </DialogActions>
      </Dialog>

      {/* PRINT OFFICIAL CUSTOMER MACHINE SALE INVOICE MODAL */}
      <Dialog open={printInvoiceModalOpen} onClose={() => setPrintInvoiceModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-single-invoice, #printable-single-invoice * {
                visibility: visible !important;
              }
              #printable-single-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>📄 Official Customer Machine Sale Invoice</Typography>
          <Chip label="Sales Invoice" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {printInvoiceData && (() => {
            const displayItems = (printInvoiceData.items && printInvoiceData.items.length > 0) ? printInvoiceData.items : [
              {
                machineName: printInvoiceData.machineName,
                serialNo: printInvoiceData.serialNo,
                qty: printInvoiceData.qty,
                unitPrice: printInvoiceData.unitPrice,
                lineTotal: printInvoiceData.lineTotal
              }
            ];

            return (
              <Box id="printable-machine-invoice" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
                {/* 🏢 Watermark Background Logo */}
                <Box
                  component="img"
                  src={rehmatLogo}
                  alt="Watermark Logo"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '55%',
                    maxWidth: 360,
                    opacity: 0.08,
                    pointerEvents: 'none',
                    zIndex: 0,
                    borderRadius: '50%'
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Typography variant="h3" fontWeight={800} align="center" sx={{ color: '#10b981', mb: 0.5, letterSpacing: '0.5px' }}>
                    REHMAT LAWN MOWERS
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} align="center" sx={{ color: '#10b981', mb: 0.5 }}>
                    FACTORY STORE MACHINE SALES & DISTRIBUTION
                  </Typography>
                  <Typography variant="caption" display="block" align="center" color="textSecondary" sx={{ mb: 2 }}>
                    Official Machine Sales & Customer Invoice Statement
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Grid container spacing={1.5} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">INVOICE NO:</Typography>
                      <Typography variant="subtitle2" fontWeight={700}>{printInvoiceData.id}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>CUSTOMER NAME:</Typography>
                      <Typography variant="h5" fontWeight={800} color="primary.main">{printInvoiceData.customerName}</Typography>
                      {printInvoiceData.customerPhone && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Contact: {printInvoiceData.customerPhone} | {printInvoiceData.cityAddress}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="textSecondary" display="block">DATE & TIME:</Typography>
                      <Typography variant="subtitle2" fontWeight={700}>{formatFullDate(printInvoiceData.time, printInvoiceData.dateISO)}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>PAYMENT STATUS:</Typography>
                      <Chip
                        label={printInvoiceData.paymentStatus || 'Paid'}
                        color={(printInvoiceData.paidAmount >= printInvoiceData.lineTotal) ? 'success' : printInvoiceData.paidAmount > 0 ? 'warning' : 'error'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Grid>
                  </Grid>

                  {/* Multi-Item Machine Table */}
                  <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: 1, mb: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f9fafb' }}>
                        <TableRow>
                          <TableCell><strong>#</strong></TableCell>
                          <TableCell><strong>MACHINE MODEL & SPECS</strong></TableCell>
                          <TableCell align="center"><strong>SERIAL NO</strong></TableCell>
                          <TableCell align="center"><strong>QTY</strong></TableCell>
                          <TableCell align="right"><strong>RATE</strong></TableCell>
                          <TableCell align="right"><strong>TOTAL AMOUNT</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {displayItems.map((item, idx) => {
                          const q = parseInt(item.qty) || 1;
                          const p = parseFloat(item.unitPrice) || 0;
                          const d = parseFloat(item.discount) || 0;
                          const gross = q * p;
                          const lineAmt = item.lineTotal !== undefined && !isNaN(item.lineTotal) ? item.lineTotal : Math.max(0, gross - (gross * d) / 100);

                          return (
                            <TableRow key={idx} hover>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" fontWeight={700}>{item.machineName || 'Machine'}</Typography>
                              </TableCell>
                              <TableCell align="center">{item.serialNo || 'N/A'}</TableCell>
                              <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                  {q}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">Rs. {p.toLocaleString()}</TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight={700}>
                                  Rs. {lineAmt.toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ bgcolor: '#ecfdf5', p: 2, borderRadius: 1.5, border: '1px solid #a7f3d0', mb: 2 }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary" display="block">TOTAL BILL: Rs. {(printInvoiceData.lineTotal || 0).toLocaleString()}</Typography>
                        <Typography variant="caption" color="textSecondary" display="block">PAID AMOUNT: Rs. {(printInvoiceData.paidAmount || 0).toLocaleString()}</Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="textSecondary" display="block">REMAINING BALANCE:</Typography>
                        <Typography variant="h3" fontWeight={800} color={(printInvoiceData.lineTotal - (printInvoiceData.paidAmount || 0)) > 0 ? '#dc2626' : '#059669'}>
                          Rs. {Math.max(0, (printInvoiceData.lineTotal || 0) - (printInvoiceData.paidAmount || 0)).toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Signatures Footer */}
                  <Grid container spacing={3} sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e5e7eb' }}>
                    <Grid item xs={6} textAlign="center">
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ textDecoration: 'overline', pt: 2 }}>
                        Customer Signature / Receiver
                      </Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="center">
                      <Typography variant="caption" color="textSecondary" display="block" sx={{ textDecoration: 'overline', pt: 2, fontWeight: 700 }}>
                        Authorized Signature (Rehmat Lawn Mowers)
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            );
          })()}
        </DialogContent>
        <DialogActions className="no-print" sx={{ p: 2 }}>
          <Button className="no-print" onClick={() => setPrintInvoiceModalOpen(false)}>Close & Continue</Button>
          <Button className="no-print" variant="contained" color="success" startIcon={<PrinterOutlined />} onClick={() => window.print()} sx={{ fontWeight: 700 }}>
            Print Customer Machine Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* 📄 PRINT REPAIR JOB CARD INVOICE RECEIPT MODAL */}
      <Dialog open={printRepairModalOpen} onClose={() => setPrintRepairModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: auto;
                margin: 8mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-ledger-repair-jobcard, #printable-ledger-repair-jobcard * {
                visibility: visible !important;
              }
              #printable-ledger-repair-jobcard {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
              }
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>📄 Machine Repairing Job Card Invoice Receipt</Typography>
          <Chip label="Repair Receipt" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {printRepairData && (
            <Box id="printable-ledger-repair-jobcard" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
              <Box
                component="img"
                src={rehmatLogo}
                alt="Watermark Logo"
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '55%',
                  maxWidth: 360,
                  opacity: 0.08,
                  pointerEvents: 'none',
                  zIndex: 0,
                  borderRadius: '50%'
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h3" fontWeight={800} align="center" sx={{ color: '#10b981', mb: 0.5, letterSpacing: '0.5px' }}>
                  REHMAT LAWN MOWERS
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} align="center" sx={{ color: '#10b981', mb: 0.5 }}>
                  FACTORY STORE REPAIRING & SERVICE
                </Typography>
                <Typography variant="caption" display="block" align="center" color="textSecondary" sx={{ mb: 2 }}>
                  Official Machine Repair & Customer Job Card Statement
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">REPAIR JOB NO:</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{printRepairData.repairNo || printRepairData.id}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>CUSTOMER NAME:</Typography>
                    <Typography variant="h5" fontWeight={800} color="primary.main">{printRepairData.customerName}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Phone: {printRepairData.customerPhone || printRepairData.phone} | Address: {printRepairData.cityAddress || printRepairData.city}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="textSecondary" display="block">DATE & TIME:</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{printRepairData.receivedDate || printRepairData.time}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>PROMISED DELIVERY:</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{printRepairData.promisedDate || '1-2 Days'}</Typography>
                  </Grid>
                </Grid>

                <TableContainer sx={{ border: '1px solid #e5e7eb', borderRadius: 1, mb: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f9fafb' }}>
                      <TableRow>
                        <TableCell><strong>#</strong></TableCell>
                        <TableCell><strong>MODEL</strong></TableCell>
                        <TableCell><strong>SPECIFICATION / REPAIR DETAIL</strong></TableCell>
                        <TableCell align="center"><strong>QTY</strong></TableCell>
                        <TableCell align="right"><strong>RATE</strong></TableCell>
                        <TableCell align="right"><strong>TOTAL AMOUNT</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {printRepairData.repairItems && printRepairData.repairItems.length > 0 ? (
                        printRepairData.repairItems.map((item, idx) => {
                          const itemQty = parseInt(item.qnty) || 1;
                          const itemRate = parseFloat(item.rate) || 0;
                          const itemTotal = item.totalAmount || (itemQty * itemRate);

                          return (
                            <TableRow key={idx} hover>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                <Typography variant="subtitle2" fontWeight={700}>{item.model}</Typography>
                              </TableCell>
                              <TableCell>{item.specification || 'General Repair & Service'}</TableCell>
                              <TableCell align="center">
                                <Typography variant="subtitle2" fontWeight={700} color="success.main">
                                  {itemQty}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">Rs. {itemRate.toLocaleString()}</TableCell>
                              <TableCell align="right">
                                <Typography variant="subtitle2" fontWeight={700}>
                                  Rs. {itemTotal.toLocaleString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow hover>
                          <TableCell>1</TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>{printRepairData.machineName}</Typography>
                          </TableCell>
                          <TableCell>{printRepairData.faultDescription}</TableCell>
                          <TableCell align="center">
                            <Typography variant="subtitle2" fontWeight={700} color="success.main">
                              1
                            </Typography>
                          </TableCell>
                          <TableCell align="right">Rs. {(printRepairData.totalCost || 0).toLocaleString()}</TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight={700}>
                              Rs. {(printRepairData.totalCost || 0).toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ bgcolor: '#ecfdf5', p: 2, borderRadius: 1.5, border: '1px solid #a7f3d0', mb: 2 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">TOTAL BILL: Rs. {(printRepairData.totalCost || printRepairData.lineTotal || 0).toLocaleString()}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block">PAID ADVANCE: Rs. {(printRepairData.paidAmount || 0).toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="textSecondary" display="block">REMAINING PAYABLE BALANCE:</Typography>
                      <Typography variant="h3" fontWeight={800} color={printRepairData.balanceAmount > 0 ? '#dc2626' : '#059669'}>
                        Rs. {(printRepairData.balanceAmount || 0).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                <Grid container spacing={3} sx={{ mt: 2, pt: 2, borderTop: '1px dashed #e5e7eb' }}>
                  <Grid item xs={6} textAlign="center">
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ textDecoration: 'overline', pt: 2 }}>
                      Customer Signature
                    </Typography>
                  </Grid>
                  <Grid item xs={6} textAlign="center">
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ textDecoration: 'overline', pt: 2, fontWeight: 700 }}>
                      Authorized Repair Specialist
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions className="no-print" sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <Button variant="outlined" color="secondary" onClick={() => setPrintRepairModalOpen(false)} size="large" className="no-print">
            Close & Continue
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            size="large"
            className="no-print"
            sx={{ px: 3, fontWeight: 700 }}
          >
            Print Machine Repair Job Card
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
