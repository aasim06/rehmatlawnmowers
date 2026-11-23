import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import CeoSignature from 'components/CeoSignature';
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
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Drawer from '@mui/material/Drawer';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';

import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
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
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import BookOutlined from '@ant-design/icons/BookOutlined';

import MainCard from 'components/MainCard';
import { useStoreInventory } from 'context/StoreInventoryContext';
import usePermission from 'hooks/usePermission';

const formatInvoiceNo = (inv) => {
  if (!inv) return 'MS-10001';
  const num = typeof inv === 'string' ? inv : inv.saleNo || inv.sale_no || inv.repairNo || inv.id;
  if (!num) return 'MS-10001';
  const str = String(num).trim();
  if ((str.startsWith('MS-') || str.startsWith('PO-') || str.startsWith('REP-') || str.startsWith('INV-')) && str.length <= 15) {
    return str;
  }
  const cleanHex = str
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 5)
    .toUpperCase();
  return (inv && inv.recordType === 'Repair') ? `REP-${cleanHex || '10001'}` : `MS-${cleanHex || '10001'}`;
};

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

// Parse date string into YYYY-MM-DD
const getSlipDateString = (slip) => {
  if (slip.dateISO) {
    try {
      const d = new Date(slip.dateISO);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch {
      // ignore
    }
  }
  const dateField = slip.time || slip.date || slip.receivedDate;
  if (dateField && typeof dateField === 'string') {
    const cleaned = dateField.replace('Today,', '').trim();
    const parsed = Date.parse(cleaned);
    if (!isNaN(parsed)) {
      const d = new Date(parsed);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  }
  return '';
};

// Check if slip is within [startDate, endDate] range
const isSlipInDateRange = (slip, start, end) => {
  if (!start && !end) return true;
  const slipDay = getSlipDateString(slip);
  if (!slipDay) return true;
  if (start && slipDay < start) return false;
  if (end && slipDay > end) return false;
  return true;
};

// Normalize machine invoice items for hierarchical table
const normalizeMachineItems = (inv) => {
  if (inv.recordType === 'Repair') {
    if (Array.isArray(inv.repairItems) && inv.repairItems.length > 0) {
      return inv.repairItems.map((it) => ({
        name: it.model || it.machineName || inv.machineName || 'Repair Machine',
        subtitle: it.specification || it.faultDescription || 'Repair Service',
        qty: parseInt(it.qty || 1, 10) || 1,
        rate: parseFloat(it.cost || it.price || inv.totalCost || 0) || 0,
        amount: parseFloat(it.cost || it.price || inv.totalCost || 0) || 0
      }));
    }
    const cost = parseFloat(inv.totalCost || inv.lineTotal) || 0;
    return [
      {
        name: inv.machineName || 'Machine Repair Service',
        subtitle: inv.faultDescription || 'General Repair',
        qty: 1,
        rate: cost,
        amount: cost
      }
    ];
  }

  // Machine Sale
  if (Array.isArray(inv.items) && inv.items.length > 0) {
    return inv.items.map((it) => {
      const name = it.machineName || it.name || inv.machineName || 'Machine';
      const subtitle = it.serialNo ? `S/N: ${it.serialNo}` : '';
      const qty = parseInt(it.qty, 10) || 1;
      let rate = parseFloat(it.unitPrice ?? it.price ?? 0) || 0;
      let amount = parseFloat(it.lineTotal ?? it.amount ?? (qty * rate)) || (qty * rate);
      return { name, subtitle, qty, rate, amount };
    });
  }

  const lineTotal = parseFloat(inv.lineTotal || inv.subTotal) || 0;
  const qty = parseInt(inv.qty, 10) || 1;
  const unitPrice = parseFloat(inv.unitPrice) || (qty > 0 ? lineTotal / qty : lineTotal);
  return [
    {
      name: inv.machineName || 'Machine',
      subtitle: inv.serialNo ? `S/N: ${inv.serialNo}` : '',
      qty,
      rate: unitPrice,
      amount: lineTotal
    }
  ];
};

export default function CustomerLedgerPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    machineSales = [],
    machineRepairs = [],
    machineModels = [],
    customerPayments = [],
    updateMachineSale,
    deleteMachineSale,
    deleteMachineRepair
  } = useStoreInventory();

  const { canDelete } = usePermission();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Quick Date Presets
  const getTodayISO = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const setFilterToday = () => {
    const today = getTodayISO();
    setStartDate(today);
    setEndDate(today);
  };

  const setFilterPast7Days = () => {
    const now = new Date();
    const end = getTodayISO();
    const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    const y = past.getFullYear();
    const m = String(past.getMonth() + 1).padStart(2, '0');
    const d = String(past.getDate()).padStart(2, '0');
    setStartDate(`${y}-${m}-${d}`);
    setEndDate(end);
  };

  const setFilterThisMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setStartDate(`${y}-${m}-01`);
    setEndDate(getTodayISO());
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const isTodaySelected = useMemo(() => {
    const today = getTodayISO();
    return startDate === today && endDate === today;
  }, [startDate, endDate]);

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
  }, [searchTerm, startDate, endDate]);

  // Expand Customer Invoices Row State
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // Delete Customer State
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteCustomerModalOpen, setDeleteCustomerModalOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

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

  // Statement Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printCustomerData, setPrintCustomerData] = useState(null);

  // Group Machine Sales AND Machine Repairs by Customer, filtered by Date Range
  const customerList = useMemo(() => {
    const customerMap = {};

    // 1. Process Machine Sales
    (machineSales || []).forEach((sale) => {
      if (!isSlipInDateRange(sale, startDate, endDate)) return;

      const custKey = (sale.customerName || 'Walk-in Customer').trim();
      const lowerKey = custKey.toLowerCase();
      if (!customerMap[lowerKey]) {
        customerMap[lowerKey] = {
          key: lowerKey,
          customerName: custKey,
          phone: sale.customerPhone || '',
          city: sale.cityAddress || '',
          totalInvoicesCount: 0,
          totalMachinesCount: 0,
          totalPurchasesVal: 0,
          totalPaidVal: 0,
          balanceVal: 0,
          invoices: []
        };
      }
      const billTotal = parseFloat(sale.lineTotal || sale.subTotal) || 0;
      const paid = parseFloat(sale.paidAmount) || 0;
      const mItems = normalizeMachineItems(sale);
      const machineCount = mItems.reduce((acc, i) => acc + (parseInt(i.qty, 10) || 1), 0);

      customerMap[lowerKey].totalInvoicesCount += 1;
      customerMap[lowerKey].totalMachinesCount += machineCount;
      customerMap[lowerKey].totalPurchasesVal += billTotal;
      customerMap[lowerKey].totalPaidVal += paid;
      customerMap[lowerKey].invoices.push({
        ...sale,
        recordType: 'Sale'
      });
      if (!customerMap[lowerKey].phone && sale.customerPhone) customerMap[lowerKey].phone = sale.customerPhone;
      if (!customerMap[lowerKey].city && sale.cityAddress) customerMap[lowerKey].city = sale.cityAddress;
    });

    // 2. Process Machine Repairs
    (machineRepairs || []).forEach((repair) => {
      if (!isSlipInDateRange(repair, startDate, endDate)) return;

      const custKey = (repair.customerName || 'Walk-in Customer').trim();
      const lowerKey = custKey.toLowerCase();
      if (!customerMap[lowerKey]) {
        customerMap[lowerKey] = {
          key: lowerKey,
          customerName: custKey,
          phone: repair.customerPhone || '',
          city: repair.cityAddress || '',
          totalInvoicesCount: 0,
          totalMachinesCount: 0,
          totalPurchasesVal: 0,
          totalPaidVal: 0,
          balanceVal: 0,
          invoices: []
        };
      }
      const billTotal = parseFloat(repair.totalCost || repair.partsCost || repair.lineTotal) || 0;
      const paid = parseFloat(repair.paidAmount) || 0;
      const rItems = normalizeMachineItems({ ...repair, recordType: 'Repair' });
      const machineCount = rItems.reduce((acc, i) => acc + (parseInt(i.qty, 10) || 1), 0);

      customerMap[lowerKey].totalInvoicesCount += 1;
      customerMap[lowerKey].totalMachinesCount += machineCount;
      customerMap[lowerKey].totalPurchasesVal += billTotal;
      customerMap[lowerKey].totalPaidVal += paid;
      customerMap[lowerKey].invoices.push({
        ...repair,
        id: repair.repairNo || repair.id,
        time: repair.receivedDate || repair.time,
        lineTotal: billTotal,
        recordType: 'Repair'
      });
      if (!customerMap[lowerKey].phone && repair.customerPhone) customerMap[lowerKey].phone = repair.customerPhone;
      if (!customerMap[lowerKey].city && repair.cityAddress) customerMap[lowerKey].city = repair.cityAddress;
    });

    return Object.values(customerMap).map((cust) => {
      const balance = Math.max(0, cust.totalPurchasesVal - cust.totalPaidVal);
      return { ...cust, balanceVal: balance };
    }).sort((a, b) => b.totalPurchasesVal - a.totalPurchasesVal);
  }, [machineSales, machineRepairs, startDate, endDate]);

  // Filtered List by Search Term
  const filteredCustomers = useMemo(() => {
    return customerList.filter(
      (c) =>
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerList, searchTerm]);

  // Computed KPI Summary Data
  const kpiData = useMemo(() => {
    let totalInvoices = 0;
    let totalMachines = 0;
    let totalValue = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    customerList.forEach((c) => {
      totalInvoices += c.totalInvoicesCount;
      totalMachines += c.totalMachinesCount;
      totalValue += c.totalPurchasesVal;
      totalPaid += c.totalPaidVal;
      totalBalance += c.balanceVal;
    });

    return {
      totalCustomers: customerList.length,
      totalInvoices,
      totalMachines,
      totalValue,
      totalPaid,
      totalBalance
    };
  }, [customerList]);

  // Delete Customer Records Handler
  const handleConfirmDeleteCustomer = async () => {
    if (!customerToDelete || !customerToDelete.invoices) return;
    setDeletingCustomer(true);
    try {
      for (const inv of customerToDelete.invoices) {
        if (inv.recordType === 'Repair' && typeof deleteMachineRepair === 'function') {
          await deleteMachineRepair(inv.id);
        } else if (typeof deleteMachineSale === 'function') {
          await deleteMachineSale(inv.id);
        }
      }
      setDeleteCustomerModalOpen(false);
      setCustomerToDelete(null);
    } catch (err) {
      console.error('Delete customer ledger error:', err);
    } finally {
      setDeletingCustomer(false);
    }
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
    const itemsArray =
      inv.items && inv.items.length > 0
        ? inv.items
        : [
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

    const itemsList =
      editingInvoice.items && editingInvoice.items.length > 0
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
        : [
          {
            machineName: editingInvoice.machineName,
            serialNo: editingInvoice.serialNo,
            qty: parseInt(editingInvoice.qty) || 1,
            unitPrice: parseFloat(editingInvoice.unitPrice) || 0,
            discount: parseFloat(editingInvoice.discount) || 0,
            discountAmount:
              ((parseInt(editingInvoice.qty) || 1) *
                (parseFloat(editingInvoice.unitPrice) || 0) *
                (parseFloat(editingInvoice.discount) || 0)) /
              100,
            lineTotal: Math.max(
              0,
              (parseInt(editingInvoice.qty) || 1) * (parseFloat(editingInvoice.unitPrice) || 0) -
              ((parseInt(editingInvoice.qty) || 1) *
                (parseFloat(editingInvoice.unitPrice) || 0) *
                (parseFloat(editingInvoice.discount) || 0)) /
              100
            )
          }
        ];

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
        items: [...(prev.items || []), { machineName: '', serialNo: '', qty: 1, unitPrice: 0, discount: 0 }]
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
    const custPaymentsList = customerPayments.filter((p) => p.customerName.toLowerCase() === cust.customerName.toLowerCase());
    setPrintCustomerData({
      ...cust,
      payments: custPaymentsList
    });
    setPrintModalOpen(true);
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* 1. Header Banner */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: 'primary.lighter', color: 'primary.main', p: 1, borderRadius: 2, display: 'flex' }}>
            <BookOutlined style={{ fontSize: '1.4rem' }} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={900} sx={{ letterSpacing: -0.3 }}>
              Machine Customer Ledger
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track customer accounts, machine purchase history, filter by date range, and print statements.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 2. Top KPI Cards (4 Cards) */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Total Customers */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard sx={{ borderLeft: '4px solid #1677ff', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                  Total Customers
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                  {kpiData.totalCustomers}
                </Typography>
              </Box>
              <Box sx={{ color: '#1677ff', display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Invoices */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard sx={{ borderLeft: '4px solid #005F56', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                  Total Invoices
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                  {kpiData.totalInvoices}
                </Typography>
              </Box>
              <Box sx={{ color: '#005F56', display: 'flex', alignItems: 'center' }}>
                <FileTextOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Machines */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard sx={{ borderLeft: '4px solid #fa8c16', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                  Total Machines Qty
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                  {kpiData.totalMachines}
                </Typography>
              </Box>
              <Box sx={{ color: '#fa8c16', display: 'flex', alignItems: 'center' }}>
                <AppstoreOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Value */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MainCard sx={{ borderLeft: '4px solid #52c41a', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                  Total Sales Value
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#52c41a' }}>
                  Rs. {kpiData.totalValue.toLocaleString()}
                </Typography>
                {kpiData.totalBalance > 0 && (
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'error.main', display: 'block' }}>
                    Due: Rs. {kpiData.totalBalance.toLocaleString()}
                  </Typography>
                )}
              </Box>
              <Box sx={{ color: '#52c41a', display: 'flex', alignItems: 'center' }}>
                <DollarOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>
      </Grid>

      {/* 3. Filter & Date Range Bar */}
      <MainCard sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              placeholder="Search by Customer Name, Phone, or City..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlined style={{ color: '#94a3b8' }} />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>

          {/* From Date */}
          <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
            <TextField
              label="From Date"
              type="date"
              size="small"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true }
              }}
              sx={{
                '& .MuiInputBase-root': { height: 38 }
              }}
            />
          </Grid>

          {/* To Date */}
          <Grid size={{ xs: 6, sm: 3, md: 2.5 }}>
            <TextField
              label="To Date"
              type="date"
              size="small"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true }
              }}
              sx={{
                '& .MuiInputBase-root': { height: 38 }
              }}
            />
          </Grid>

          {/* Reset Filters Button */}
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            {(searchTerm || startDate || endDate) ? (
              <Button
                variant="outlined"
                color="secondary"
                size="small"
                startIcon={<ReloadOutlined />}
                onClick={handleResetFilters}
                fullWidth
                sx={{ height: 38, fontWeight: 700, borderRadius: 1.5 }}
              >
                Reset
              </Button>
            ) : null}
          </Grid>
        </Grid>

        {/* Quick Date Presets Bar */}
        <Box sx={{ mt: 1.75, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
            Quick Range:
          </Typography>
          <Chip
            label="All Time"
            size="small"
            clickable
            color={!startDate && !endDate ? 'primary' : 'default'}
            variant={!startDate && !endDate ? 'filled' : 'outlined'}
            onClick={() => { setStartDate(''); setEndDate(''); }}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />
          <Chip
            label="Today"
            size="small"
            clickable
            color={isTodaySelected ? 'primary' : 'default'}
            variant={isTodaySelected ? 'filled' : 'outlined'}
            onClick={setFilterToday}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />
          <Chip
            label="Past 7 Days"
            size="small"
            clickable
            color={Boolean(startDate && endDate && !isTodaySelected && startDate === getSlipDateString({ dateISO: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() })) ? 'primary' : 'default'}
            variant={Boolean(startDate && endDate && !isTodaySelected && startDate === getSlipDateString({ dateISO: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() })) ? 'filled' : 'outlined'}
            onClick={setFilterPast7Days}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />
          <Chip
            label="This Month"
            size="small"
            clickable
            color={Boolean(startDate && endDate && startDate.endsWith('-01')) ? 'primary' : 'default'}
            variant={Boolean(startDate && endDate && startDate.endsWith('-01')) ? 'filled' : 'outlined'}
            onClick={setFilterThisMonth}
            sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
          />
        </Box>
      </MainCard>

      {/* 4. Customer Table */}
      <MainCard content={false} sx={{ borderRadius: 2 }}>
        <TableContainer sx={{ minHeight: 400 }}>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'background.default' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>CUSTOMER NAME</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }}>PHONE / CITY</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">TOTAL INVOICES</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">TOTAL MACHINES QTY</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="right">TOTAL VALUE</TableCell>
                <TableCell sx={{ fontWeight: 800, py: 1.5 }} align="center">ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="h6" fontWeight={700} color="textSecondary">
                      No Customer Ledgers Found
                    </Typography>
                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 0.5 }}>
                      Create a machine sale to view customer history here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((cust) => {
                  const isExpanded = expandedCustomer === cust.customerName;

                  return (
                    <React.Fragment key={cust.customerName}>
                      <TableRow
                        hover
                        sx={{
                          '&:last-child td, &:last-child th': { border: 0 },
                          bgcolor: isExpanded
                            ? (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc')
                            : 'inherit'
                        }}
                      >
                        {/* Chevron */}
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedCustomer(isExpanded ? null : cust.customerName)}
                            sx={{ color: isExpanded ? 'primary.main' : 'text.secondary' }}
                          >
                            {isExpanded ? <UpOutlined /> : <DownOutlined />}
                          </IconButton>
                        </TableCell>

                        {/* Customer Name */}
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={800} color="textPrimary">
                            {cust.customerName}
                          </Typography>
                        </TableCell>

                        {/* Phone / City */}
                        <TableCell>
                          <Typography variant="body2" color="textSecondary">
                            {cust.phone || 'N/A'}{cust.city ? ` • ${cust.city}` : ''}
                          </Typography>
                        </TableCell>

                        {/* Invoices Chip */}
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

                        {/* Machines Count Chip */}
                        <TableCell align="center">
                          <Chip
                            label={`${cust.totalMachinesCount} Pcs`}
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>

                        {/* Total Value */}
                        <TableCell align="right">
                          <Typography variant="subtitle2" fontWeight={800} color="#005F56">
                            Rs. {cust.totalPurchasesVal.toLocaleString()}
                          </Typography>
                          {cust.balanceVal > 0 && (
                            <Typography variant="caption" color="error.main" fontWeight={700} display="block">
                              Due: Rs. {cust.balanceVal.toLocaleString()}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<PrinterOutlined />}
                              onClick={() => handlePrintStatement(cust)}
                              sx={{ fontWeight: 700, borderRadius: 1.5, textTransform: 'none' }}
                            >
                              Statement
                            </Button>
                            {canDelete && (
                              <Tooltip title={`Delete all records for ${cust.customerName}`}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setCustomerToDelete(cust);
                                    setDeleteCustomerModalOpen(true);
                                  }}
                                  sx={{
                                    bgcolor: isDark ? 'rgba(255, 77, 79, 0.15)' : '#fff1f0',
                                    '&:hover': { bgcolor: '#ff4d4f', color: '#fff' }
                                  }}
                                >
                                  <DeleteOutlined style={{ fontSize: 13 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>

                      {/* Collapsible Sub-Table with Hierarchical Format */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, bgcolor: isDark ? 'background.default' : '#f8fafc' }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2.5 }}>
                              <Typography
                                variant="subtitle2"
                                fontWeight={800}
                                color="primary.main"
                                sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                              >
                                <FileTextOutlined /> All Transactions &amp; Invoices for: {cust.customerName}
                              </Typography>
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                <Table size="small">
                                  <TableHead sx={{ bgcolor: isDark ? 'background.paper' : '#ffffff', borderBottom: '1.5px solid #e2e8f0' }}>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 50, color: 'text.secondary' }}>Sr</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>Item / Machine</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 80, color: 'text.secondary' }}>Qty</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 110, color: 'text.secondary' }}>Rate</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 110, color: 'text.secondary' }}>Amount</TableCell>
                                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', width: 80, color: 'text.secondary' }}>Action</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {cust.invoices.map((inv, invIdx) => {
                                      const machineItems = normalizeMachineItems(inv);
                                      const invNo = formatInvoiceNo(inv);
                                      const pStatus = inv.paymentStatus || (inv.paidAmount >= inv.lineTotal ? 'Paid' : inv.paidAmount > 0 ? 'Partial' : 'Unpaid');

                                      return (
                                        <React.Fragment key={inv.id || invIdx}>
                                          {/* Shaded Invoice Header Bar */}
                                          <TableRow sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                                            <TableCell colSpan={5} sx={{ py: 1, px: 1.5 }}>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                  <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.84rem', color: '#096dd9' }}>
                                                    {invNo}
                                                  </Typography>
                                                  <Typography component="span" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                                                    {formatFullDate(inv.time, inv.dateISO)}
                                                  </Typography>
                                                  <Chip
                                                    label={inv.recordType === 'Repair' ? 'Repair Job' : pStatus}
                                                    size="small"
                                                    color={inv.recordType === 'Repair' ? 'warning' : pStatus === 'Paid' ? 'success' : pStatus === 'Partial' ? 'warning' : 'error'}
                                                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800 }}
                                                  />
                                                </Box>
                                                <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.86rem', color: 'text.primary' }}>
                                                  Rs. {(parseFloat(inv.lineTotal || inv.totalCost || 0)).toLocaleString()}
                                                </Typography>
                                              </Box>
                                            </TableCell>
                                            <TableCell align="center" sx={{ py: 0.5 }}>
                                              <Stack direction="row" spacing={0.5} justifyContent="center">
                                                <Tooltip title="View &amp; Print Invoice">
                                                  <IconButton
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleOpenPrintInvoice(inv)}
                                                    sx={{ p: 0.5 }}
                                                  >
                                                    <PrinterOutlined style={{ fontSize: 13 }} />
                                                  </IconButton>
                                                </Tooltip>
                                                {inv.recordType !== 'Repair' && (
                                                  <Tooltip title="Edit Invoice">
                                                    <IconButton
                                                      size="small"
                                                      color="info"
                                                      onClick={() => handleOpenEditInvoice(inv)}
                                                      sx={{ p: 0.5 }}
                                                    >
                                                      <EditOutlined style={{ fontSize: 13 }} />
                                                    </IconButton>
                                                  </Tooltip>
                                                )}
                                                {canDelete && (
                                                  <Tooltip title="Delete this invoice">
                                                    <IconButton
                                                      size="small"
                                                      color="error"
                                                      onClick={() => {
                                                        setInvoiceToDelete(inv);
                                                        setDeleteInvoiceDialogOpen(true);
                                                      }}
                                                      sx={{
                                                        bgcolor: isDark ? 'rgba(255, 77, 79, 0.15)' : '#fff1f0',
                                                        p: 0.5,
                                                        '&:hover': { bgcolor: '#ff4d4f', color: '#fff' }
                                                      }}
                                                    >
                                                      <DeleteOutlined style={{ fontSize: 13 }} />
                                                    </IconButton>
                                                  </Tooltip>
                                                )}
                                              </Stack>
                                            </TableCell>
                                          </TableRow>

                                          {/* Child Items */}
                                          {machineItems.map((item, itemIdx) => (
                                            <TableRow key={itemIdx} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                              <TableCell sx={{ fontSize: '0.78rem', color: 'text.secondary', pl: 2 }}>
                                                {itemIdx + 1}
                                              </TableCell>
                                              <TableCell sx={{ fontSize: '0.82rem', fontWeight: 500 }}>
                                                {item.name}
                                                {item.subtitle && (
                                                  <Typography variant="caption" color="text.secondary" display="block">
                                                    {item.subtitle}
                                                  </Typography>
                                                )}
                                              </TableCell>
                                              <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 700 }}>
                                                {item.qty}
                                              </TableCell>
                                              <TableCell align="right" sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                                                {item.rate > 0 ? item.rate.toLocaleString() : '-'}
                                              </TableCell>
                                              <TableCell align="right" sx={{ fontSize: '0.82rem', fontWeight: 600 }}>
                                                {item.amount.toLocaleString()}
                                              </TableCell>
                                              <TableCell />
                                            </TableRow>
                                          ))}
                                        </React.Fragment>
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

        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </MainCard>


      {/* 5. PRINT OFFICIAL PERSON ISSUE STATEMENT DIALOG */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 6mm;
              }
              #root {
                display: none !important;
              }
              body {
                visibility: hidden !important;
                background: #fff !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              .MuiDialog-root {
                visibility: visible !important;
                position: static !important;
              }
              .MuiBackdrop-root {
                display: none !important;
              }
              .MuiDialog-container {
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .MuiDialog-paper {
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                overflow: visible !important;
              }
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                border: none !important;
              }
              #printable-customer-statement, #printable-customer-statement * {
                visibility: visible !important;
              }
              #printable-customer-statement {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 10px !important;
                margin: 0 !important;
              }
              .no-print,
              button,
              .MuiDialogActions-root,
              .MuiDialogTitle-root {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle className="no-print" component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={800}>
            Staff Material Issue Statement
          </Typography>
          <IconButton size="small" onClick={() => setPrintModalOpen(false)}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {printCustomerData && (
            <Box id="printable-customer-statement" sx={{ bgcolor: '#fff', color: '#111827', p: 3, borderRadius: 1 }}>
              {/* Header: Company Name */}
              <Box sx={{ borderBottom: '2.5px solid #005F56', pb: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#005F56', letterSpacing: -0.5 }}>
                      REHMAT LAWN MOWERS
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mt: 0.25 }}>
                      Factory Store &amp; Workshop • Internal Material Issue Statement
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Workshop Counter • Ph: 03154630026
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#096dd9' }}>
                      STAFF ISSUE LEDGER
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                      Date: {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                    {startDate || endDate ? (
                      <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 800, display: 'block', mt: 0.25 }}>
                        Period: {startDate || 'Start'} to {endDate || 'Present'}
                      </Typography>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                        Period: All Time Records
                      </Typography>
                    )}
                    <Chip label="Factory Issue" size="small" color="primary" sx={{ fontWeight: 800, mt: 0.5 }} />
                  </Box>
                </Box>
              </Box>

              {/* Person Info Card */}
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1.5, mb: 2.5, border: '1px solid #e2e8f0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Issued To / Receiver Name
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mt: 0.25 }}>
                      {printCustomerData.customerName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Department / Machine / Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.25 }}>
                      {printCustomerData.phone && printCustomerData.phone !== 'N/A'
                        ? `${printCustomerData.phone}${printCustomerData.city ? ` • ${printCustomerData.city}` : ''}`
                        : (printCustomerData.city || 'Factory Floor')}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Slips Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#005F56', mb: 1, textTransform: 'uppercase' }}>
                Issued Items Breakdown
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #cbd5e1', backgroundColor: '#fff' }}>
                    <th style={{ width: '6%', padding: '8px 10px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Sr</th>
                    <th style={{ width: '48%', padding: '8px 10px', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Item</th>
                    <th style={{ width: '12%', padding: '8px 10px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Qty</th>
                    <th style={{ width: '17%', padding: '8px 10px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Rate</th>
                    <th style={{ width: '17%', padding: '8px 10px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {printCustomerData.invoices.map((inv, invIdx) => {
                    const mItems = normalizeMachineItems(inv);
                    const invNo = formatInvoiceNo(inv);
                    return (
                      <React.Fragment key={inv.id || invIdx}>
                        {/* Slip Header Bar */}
                        <tr style={{ backgroundColor: '#f8fafc', borderTop: invIdx > 0 ? '1px solid #e2e8f0' : 'none', borderBottom: '1px solid #e2e8f0' }}>
                          <td colSpan={5} style={{ padding: '7px 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ color: '#096dd9', fontWeight: 800, fontSize: '0.85rem', marginRight: '16px' }}>
                                  {invNo}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 500 }}>
                                  {formatFullDate(inv.time, inv.dateISO)}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>
                                  Rs. {(parseFloat(inv.lineTotal || inv.totalCost || 0)).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {/* Slip Items */}
                        {mItems.map((item, itemIdx) => (
                          <tr key={itemIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '7px 10px', fontSize: '0.82rem', color: '#475569' }}>
                              {itemIdx + 1}
                            </td>
                            <td style={{ padding: '7px 10px', fontSize: '0.83rem', fontWeight: 500, color: '#1e293b' }}>
                              {item.name}
                              {item.subtitle && (
                                <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b' }}>
                                  {item.subtitle}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '0.83rem', fontWeight: 700, color: '#0f172a' }}>
                              {item.qty}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '0.83rem', color: '#334155' }}>
                              {item.rate > 0 ? item.rate.toLocaleString() : '-'}
                            </td>
                            <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: '0.83rem', fontWeight: 600, color: '#0f172a' }}>
                              {item.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #005F56' }}>
                    <td colSpan={4} style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>
                      TOTAL MATERIAL VALUE:
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1rem', color: '#005F56' }}>
                      Rs. {printCustomerData.totalPurchasesVal.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Financial Summary Box (if customer has partial/balance/paid) */}
              {(printCustomerData.totalPaidVal > 0 || printCustomerData.balanceVal > 0) && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 1.5,
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 1,
                    mb: 3
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    PAID AMOUNT: Rs. {printCustomerData.totalPaidVal.toLocaleString()}
                  </Typography>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      NET TOTAL: Rs. {printCustomerData.totalPurchasesVal.toLocaleString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: printCustomerData.balanceVal > 0 ? 'error.main' : 'success.main',
                        display: 'block'
                      }}
                    >
                      REMAINING DUE: Rs. {printCustomerData.balanceVal.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Signatures */}
              <Box sx={{ mt: 4, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ borderTop: '1px solid #94a3b8', pt: 1, width: 200, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', display: 'block' }}>
                      Receiver / Staff Signature
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                    <CeoSignature />
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions className="no-print" sx={{ p: 2 }}>
          <Button onClick={() => setPrintModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            sx={{ fontWeight: 800, px: 3 }}
          >
            Print Issue Statement
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM DELETE CUSTOMER MODAL */}
      <Dialog open={deleteCustomerModalOpen} onClose={() => setDeleteCustomerModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          Delete Customer Records
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete all machine invoices and repair records for <strong>{customerToDelete?.customerName}</strong>?
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            This action will permanently remove all {customerToDelete?.totalInvoicesCount || 0} invoices and transactions associated with this customer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteCustomerModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteCustomer}
            color="error"
            variant="contained"
            disabled={deletingCustomer}
            sx={{ fontWeight: 700 }}
          >
            {deletingCustomer ? 'Deleting...' : 'Yes, Delete All Records'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── EDIT INDIVIDUAL MACHINE INVOICE DRAWER (Right Side Drawer like Stock Out) ──── */}
      <Drawer
        anchor="right"
        open={editInvoiceDrawerOpen}
        onClose={() => setEditInvoiceDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 600, md: 740, lg: 820 },
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)'
          }
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: isDark ? 'background.paper' : '#ffffff',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Stack direction="row" spacing={1.75} alignItems="center">
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(0, 95, 86, 0.25)' : '#ecfdf5',
                  color: '#005F56',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20
                }}
              >
                <EditOutlined />
              </Box>
              <Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                    Edit Machine Sale Record
                  </Typography>
                  <Chip
                    label={editingInvoice?.invoiceNo || editingInvoice?.id || ''}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#e6f4ea',
                      color: '#005F56',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0'
                    }}
                  />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.3, fontSize: '0.84rem' }}>
                  Modify customer contact, machine models, quantities, rates, discounts, or warranty terms.
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={() => setEditInvoiceDrawerOpen(false)}
              sx={{
                color: 'text.secondary',
                bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0', color: 'text.primary' }
              }}
            >
              <CloseOutlined style={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ px: 3, pt: 3, pb: 4, flex: 1, overflowY: 'auto', bgcolor: isDark ? 'background.default' : '#ffffff' }}>
          {editingInvoice &&
            (() => {
              const editItemsList =
                editingInvoice.items && editingInvoice.items.length > 0
                  ? editingInvoice.items
                  : [
                    {
                      machineName: editingInvoice.machineName || '',
                      serialNo: editingInvoice.serialNo || '',
                      qty: editingInvoice.qty || 1,
                      unitPrice: editingInvoice.unitPrice || 0,
                      discount: 0
                    }
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
                <form id="edit-customer-ledger-invoice-form" onSubmit={handleEditInvoiceSubmit}>
                  <Stack spacing={3}>
                    {/* Customer Info Card */}
                    <Box
                      sx={{
                        p: 2.5,
                        borderRadius: 2.5,
                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                        border: '1px solid',
                        borderColor: isDark ? 'divider' : '#e2e8f0'
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        sx={{ color: 'text.primary', mb: 1.75, display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <UserOutlined style={{ color: '#005F56' }} /> Customer & Warranty Details
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                            CUSTOMER NAME *
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            required
                            placeholder="Customer Name"
                            value={editingInvoice.customerName || ''}
                            onChange={(e) => setEditingInvoice({ ...editingInvoice, customerName: e.target.value })}
                            sx={{
                              bgcolor: isDark ? 'background.paper' : '#ffffff',
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                            PHONE NUMBER
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="0300-XXXXXXX"
                            value={editingInvoice.customerPhone || ''}
                            onChange={(e) => setEditingInvoice({ ...editingInvoice, customerPhone: e.target.value })}
                            sx={{
                              bgcolor: isDark ? 'background.paper' : '#ffffff',
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                            CITY / ADDRESS
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="e.g. Lahore, Pakistan"
                            value={editingInvoice.cityAddress || ''}
                            onChange={(e) => setEditingInvoice({ ...editingInvoice, cityAddress: e.target.value })}
                            sx={{
                              bgcolor: isDark ? 'background.paper' : '#ffffff',
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" fontWeight={700} sx={{ color: '#64748b', mb: 0.6, display: 'block' }}>
                            WARRANTY TERMS
                          </Typography>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="1 Year Motor & Frame Warranty"
                            value={editingInvoice.warrantyTerms || ''}
                            onChange={(e) => setEditingInvoice({ ...editingInvoice, warrantyTerms: e.target.value })}
                            sx={{
                              bgcolor: isDark ? 'background.paper' : '#ffffff',
                              '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Items Section Header with Add Machine Button */}
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1.5 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={800}
                          sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <EditOutlined style={{ color: '#005F56' }} /> Purchased Machines ({editItemsList.length} Items)
                        </Typography>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PlusOutlined />}
                          onClick={handleAddEditItemRow}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: 1.5,
                            borderColor: isDark ? 'divider' : '#cbd5e1',
                            color: isDark ? 'text.primary' : '#334155',
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                            '&:hover': {
                              borderColor: '#005F56',
                              color: '#005F56',
                              bgcolor: isDark ? 'rgba(0, 95, 86, 0.1)' : '#f0fdf4'
                            }
                          }}
                        >
                          Add Machine Item
                        </Button>
                      </Box>

                      {/* Items Table */}
                      <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          borderColor: isDark ? 'divider' : '#e2e8f0',
                          overflow: 'hidden'
                        }}
                      >
                        <Table size="small">
                          <TableHead sx={{ bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}>
                                MACHINE MODEL
                              </TableCell>
                              <TableCell
                                sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                                width={150}
                              >
                                SERIAL NO
                              </TableCell>
                              <TableCell
                                align="center"
                                width={90}
                                sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                              >
                                QTY
                              </TableCell>
                              <TableCell
                                align="center"
                                width={150}
                                sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                              >
                                UNIT PRICE (PKR)
                              </TableCell>
                              <TableCell
                                align="center"
                                width={110}
                                sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                              >
                                DISCOUNT (%)
                              </TableCell>
                              <TableCell
                                align="right"
                                width={140}
                                sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                              >
                                LINE TOTAL
                              </TableCell>
                              <TableCell
                                align="center"
                                width={60}
                                sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#475569', py: 1.25, letterSpacing: '0.04em' }}
                              >
                                DEL
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {editItemsList.map((rowItem, idx) => {
                              const q = parseInt(rowItem.qty) || 1;
                              const p = parseFloat(rowItem.unitPrice) || 0;
                              const discPercent = parseFloat(rowItem.discount) || 0;
                              const gross = q * p;
                              const lineTot = Math.max(0, gross - (gross * discPercent) / 100);

                              return (
                                <TableRow
                                  key={idx}
                                  sx={{
                                    '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#fafafa' },
                                    '&:last-child td, &:last-child th': { border: 0 }
                                  }}
                                >
                                  <TableCell sx={{ py: 1.5 }}>
                                    <Autocomplete
                                      freeSolo
                                      size="small"
                                      options={machineModels}
                                      value={rowItem.machineName || ''}
                                      onChange={(_, val) => handleEditItemChange(idx, 'machineName', val || '')}
                                      onInputChange={(_, val) => handleEditItemChange(idx, 'machineName', val || '')}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          placeholder="Select or type model..."
                                          required
                                          size="small"
                                          sx={{
                                            bgcolor: isDark ? 'background.paper' : '#ffffff',
                                            '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                                          }}
                                        />
                                      )}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ py: 1.5 }}>
                                    <TextField
                                      fullWidth
                                      size="small"
                                      placeholder="Serial #"
                                      value={rowItem.serialNo || ''}
                                      onChange={(e) => handleEditItemChange(idx, 'serialNo', e.target.value)}
                                      sx={{
                                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="center" sx={{ py: 1.5 }}>
                                    <TextField
                                      size="small"
                                      type="number"
                                      required
                                      inputProps={{ min: 1, style: { textAlign: 'center', padding: '6px 4px', fontWeight: 700 } }}
                                      value={rowItem.qty || 1}
                                      onChange={(e) => handleEditItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                                      sx={{
                                        width: 70,
                                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="center" sx={{ py: 1.5 }}>
                                    <TextField
                                      size="small"
                                      type="number"
                                      required
                                      inputProps={{ min: 0, style: { textAlign: 'center', padding: '6px 4px', fontWeight: 600 } }}
                                      value={rowItem.unitPrice || 0}
                                      onChange={(e) => handleEditItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                      sx={{
                                        width: 110,
                                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="center" sx={{ py: 1.5 }}>
                                    <TextField
                                      size="small"
                                      type="number"
                                      inputProps={{ min: 0, max: 100, style: { textAlign: 'center', padding: '6px 4px' } }}
                                      value={rowItem.discount || 0}
                                      onChange={(e) => handleEditItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                                      sx={{
                                        width: 75,
                                        bgcolor: isDark ? 'background.paper' : '#ffffff',
                                        '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ py: 1.5 }}>
                                    <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#005F56', fontSize: '0.95rem' }}>
                                      Rs. {lineTot.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="center" sx={{ py: 1.5 }}>
                                    {editItemsList.length > 1 ? (
                                      <Tooltip title="Remove machine">
                                        <IconButton
                                          size="small"
                                          onClick={() => handleRemoveEditItemRow(idx)}
                                          sx={{
                                            color: '#ef4444',
                                            bgcolor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                                            border: '1px solid',
                                            borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2',
                                            '&:hover': { bgcolor: '#fee2e2', color: '#dc2626' }
                                          }}
                                        >
                                          <DeleteOutlined style={{ fontSize: 14 }} />
                                        </IconButton>
                                      </Tooltip>
                                    ) : (
                                      <IconButton size="small" disabled sx={{ color: 'text.disabled' }}>
                                        <DeleteOutlined style={{ fontSize: 14 }} />
                                      </IconButton>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>

                    {/* Bottom Calculations & Financial Summary */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        justifyContent: 'space-between',
                        alignItems: 'stretch',
                        gap: 2.5,
                        width: '100%'
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            p: 2.5,
                            height: '100%',
                            borderRadius: 2.5,
                            bgcolor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                            border: '1px solid',
                            borderColor: isDark ? 'divider' : '#e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            sx={{ color: '#64748b', mb: 1.5, display: 'block', letterSpacing: '0.04em' }}
                          >
                            PAYMENT DISBURSEMENT
                          </Typography>

                          <Stack direction="row" spacing={2} alignItems="center">
                            <TextField
                              size="small"
                              type="number"
                              label="Paid Amount (PKR)"
                              value={editingInvoice.paidAmount || 0}
                              onChange={(e) => setEditingInvoice({ ...editingInvoice, paidAmount: parseFloat(e.target.value) || 0 })}
                              sx={{
                                flex: 1,
                                bgcolor: isDark ? 'background.paper' : '#ffffff',
                                '& .MuiOutlinedInput-root': { borderRadius: 1.5 }
                              }}
                            />
                            <Box
                              sx={{
                                px: 2,
                                py: 1,
                                borderRadius: 1.5,
                                bgcolor: editBalance > 0 ? '#fff1f0' : '#f6ffed',
                                border: '1px solid',
                                borderColor: editBalance > 0 ? '#ffa39e' : '#b7eb8f'
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ color: editBalance > 0 ? '#cf1322' : '#389e0d', fontWeight: 800, display: 'block' }}
                              >
                                {editBalance > 0 ? `Remaining: Rs. ${editBalance.toLocaleString()}` : 'Fully Paid'}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            p: 2.5,
                            height: '100%',
                            borderRadius: 2.5,
                            bgcolor: isDark ? 'rgba(0, 95, 86, 0.08)' : '#f0fdf4',
                            border: '1px solid',
                            borderColor: isDark ? 'rgba(0, 95, 86, 0.3)' : '#bbf7d0',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                          }}
                        >
                          <Stack spacing={1}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#4b5563', fontWeight: 600 }}>
                                Total Bill Amount:
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#111827', fontWeight: 700 }}>
                                Rs. {editSubTotal.toLocaleString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" sx={{ color: '#047857', fontWeight: 600 }}>
                                Received / Paid:
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#047857', fontWeight: 700 }}>
                                Rs. {editPaid.toLocaleString()}
                              </Typography>
                            </Box>
                          </Stack>

                          <Box sx={{ pt: 1.5, mt: 1.5, borderTop: '1px solid', borderColor: isDark ? 'rgba(0, 95, 86, 0.25)' : '#bbf7d0' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  fontWeight={800}
                                  sx={{ color: '#047857', letterSpacing: '0.04em', display: 'block' }}
                                >
                                  NET PAYABLE
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                                  Balance: Rs. {editBalance.toLocaleString()}
                                </Typography>
                              </Box>
                              <Typography
                                variant="h4"
                                fontWeight={900}
                                sx={{ color: '#005F56', letterSpacing: '-0.02em', fontSize: '1.5rem' }}
                              >
                                Rs. {editSubTotal.toLocaleString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Stack>
                </form>
              );
            })()}
        </Box>

        {/* Fixed Bottom Actions */}
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: isDark ? 'background.paper' : '#f8fafc',
            position: 'sticky',
            bottom: 0,
            zIndex: 10
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Updates customer ledger balance & sales records.
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={() => setEditInvoiceDrawerOpen(false)}
              variant="outlined"
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                borderColor: isDark ? 'divider' : '#cbd5e1',
                px: 2.5,
                py: 0.8,
                borderRadius: 1.5,
                textTransform: 'none',
                fontSize: '0.9rem',
                '&:hover': { bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              form="edit-customer-ledger-invoice-form"
              sx={{
                fontWeight: 700,
                borderRadius: 1.5,
                px: 3.5,
                py: 0.9,
                bgcolor: '#003830',
                color: '#ffffff',
                textTransform: 'none',
                fontSize: '0.9rem',
                boxShadow: '0 4px 6px -1px rgba(0, 56, 48, 0.25)',
                '&:hover': { bgcolor: '#002620', boxShadow: '0 6px 10px -1px rgba(0, 56, 48, 0.35)' }
              }}
            >
              Save Changes
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* DELETE INDIVIDUAL MACHINE INVOICE DIALOG */}
      <Dialog open={deleteInvoiceDialogOpen} onClose={() => setDeleteInvoiceDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Machine Sale Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the machine sale invoice <strong>{invoiceToDelete?.id}</strong> for{' '}
            <strong>{invoiceToDelete?.customerName}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteInvoiceDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteInvoice} color="error" variant="contained">
            Delete Invoice
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRINT OFFICIAL CUSTOMER MACHINE SALE INVOICE MODAL */}
      <Dialog open={printInvoiceModalOpen} onClose={() => setPrintInvoiceModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 4mm 5mm;
              }
            #root { display: none !important; }
                body * {
                visibility: hidden !important;
              }
              #printable-machine-invoice, #printable-machine-invoice *,
              #printable-single-invoice, #printable-single-invoice * {
                visibility: visible !important;
              }
              #printable-machine-invoice,
              #printable-single-invoice {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 60px 4px 6px 4px !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .MuiDialog-root,
              .MuiDialog-container,
              .MuiDialog-paper,
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                overflow: visible !important;
                box-shadow: none !important;
              }
              .MuiBackdrop-root,
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle
          className="no-print"
          sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
        >
          <Typography variant="h5" fontWeight={700}>
            Official Customer Machine Sale Invoice
          </Typography>
          <Chip label="Sales Invoice" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {printInvoiceData &&
            (() => {
              const displayItems =
                printInvoiceData.items && printInvoiceData.items.length > 0
                  ? printInvoiceData.items
                  : [
                    {
                      machineName: printInvoiceData.machineName,
                      serialNo: printInvoiceData.serialNo,
                      qty: printInvoiceData.qty,
                      unitPrice: printInvoiceData.unitPrice,
                      lineTotal: printInvoiceData.lineTotal
                    }
                  ];

              return (
                <Box
                  id="printable-machine-invoice"
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    pt: { xs: 5, sm: 7 },
                    px: { xs: 1, sm: 1.5 },
                    pb: { xs: 1, sm: 1.5 },
                    bgcolor: '#ffffff',
                    color: '#111827',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Structured Professional Customer & Invoice Metadata Card */}
                    <div
                      style={{
                        border: '1.5px solid #111827',
                        borderRadius: '4px',
                        marginBottom: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.45)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                        {/* Left Column: Customer Details */}
                        <div style={{ flex: '1.2', padding: '6px 10px', borderRight: '1px solid #e5e7eb' }}>
                          <div
                            style={{
                              fontSize: '0.70rem',
                              fontWeight: 800,
                              color: '#6b7280',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '2px'
                            }}
                          >
                            Customer Details
                          </div>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                            {printInvoiceData.customerName}
                          </div>
                          <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                            {printInvoiceData.customerPhone && (
                              <div>
                                <strong>Phone:</strong> {printInvoiceData.customerPhone}
                              </div>
                            )}
                            {printInvoiceData.cityAddress && (
                              <div>
                                <strong>City / Address:</strong> {printInvoiceData.cityAddress}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column: Invoice Meta */}
                        <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 700 }}>Invoice No:</span>
                            <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>{printInvoiceData.id}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                            <span style={{ fontWeight: 700, color: '#374151' }}>
                              {formatFullDate(printInvoiceData.time, printInvoiceData.dateISO)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                            <span style={{ color: '#6b7280', fontWeight: 600 }}>Payment Status:</span>
                            <span
                              style={{
                                fontWeight: 800,
                                color: printInvoiceData.paidAmount >= printInvoiceData.lineTotal ? '#16a34a' : '#d97706'
                              }}
                            >
                              {printInvoiceData.paymentStatus || 'Paid'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1.5px solid #111827',
                        marginBottom: '10px',
                        backgroundColor: 'transparent'
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                          <th
                            style={{
                              width: '8%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 4px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Sr</strong>
                          </th>
                          <th
                            style={{
                              width: '52%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Specification / Model</strong>
                          </th>
                          <th
                            style={{
                              width: '12%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 4px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>QTY</strong>
                          </th>
                          <th
                            style={{
                              width: '14%',
                              borderRight: '1.5px solid #111827',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontSize: '0.82rem'
                            }}
                          >
                            <strong>Rate</strong>
                          </th>
                          <th style={{ width: '14%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                            <strong>Total Amount</strong>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayItems.map((item, idx) => {
                          const q = parseInt(item.qty) || 1;
                          const p = parseFloat(item.unitPrice) || 0;
                          const d = parseFloat(item.discount) || 0;
                          const gross = q * p;
                          const lineAmt =
                            item.lineTotal !== undefined && !isNaN(item.lineTotal)
                              ? item.lineTotal
                              : Math.max(0, gross - (gross * d) / 100);

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 4px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.82rem'
                                }}
                              >
                                {String(idx + 1).padStart(2, '0')}
                              </td>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 8px',
                                  textAlign: 'left',
                                  fontWeight: 600,
                                  fontSize: '0.82rem',
                                  lineHeight: 1.25
                                }}
                              >
                                {item.machineName || 'Machine Sale'} {item.serialNo ? `(SN: ${item.serialNo})` : ''}
                              </td>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 4px',
                                  textAlign: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.82rem'
                                }}
                              >
                                {String(q).padStart(2, '0')}
                              </td>
                              <td
                                style={{
                                  borderRight: '1.5px solid #111827',
                                  padding: '3px 8px',
                                  textAlign: 'right',
                                  fontWeight: 800,
                                  fontSize: '0.82rem'
                                }}
                              >
                                {p.toLocaleString()}
                              </td>
                              <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                                {lineAmt.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Total Amount Bottom Row */}
                        <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                          <td
                            colSpan={2}
                            style={{
                              borderRight: '1.5px solid #111827',
                              padding: '4px 8px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '0.88rem'
                            }}
                          >
                            Total amount
                          </td>
                          <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                          <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, fontSize: '0.92rem', color: '#111827' }}>
                            {(printInvoiceData.lineTotal || 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Financial Summary Box */}
                    <Box sx={{ bgcolor: 'transparent', py: 0.8, px: 1.2, borderRadius: 1, border: '1px solid #86efac', mb: 1.2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Box>
                          <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                            PAID AMOUNT: Rs. {(printInvoiceData.paidAmount || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="subtitle1" fontWeight={800} color="success.dark" sx={{ lineHeight: 1.2 }}>
                            NET TOTAL: Rs. {(printInvoiceData.lineTotal || 0).toLocaleString()}
                          </Typography>
                          <Typography
                            variant="caption"
                            fontWeight={800}
                            color={
                              (printInvoiceData.lineTotal || 0) - (printInvoiceData.paidAmount || 0) > 0 ? 'error.main' : 'success.main'
                            }
                            display="block"
                          >
                            {(printInvoiceData.lineTotal || 0) - (printInvoiceData.paidAmount || 0) > 0
                              ? `REMAINING DUE: Rs. ${Math.max(0, (printInvoiceData.lineTotal || 0) - (printInvoiceData.paidAmount || 0)).toLocaleString()}`
                              : 'FULL PAID (NO DUES)'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Signatures Footer */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', mt: 1.5, pt: 1 }}>
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 170 }}
                        >
                          Customer Signature
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
              );
            })()}
        </DialogContent>
        <DialogActions className="no-print" sx={{ p: 2 }}>
          <Button className="no-print" onClick={() => setPrintInvoiceModalOpen(false)}>
            Close & Continue
          </Button>
          <Button
            className="no-print"
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            sx={{ fontWeight: 700 }}
          >
            Print Customer Machine Bill
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRINT REPAIR JOB CARD INVOICE RECEIPT MODAL */}
      <Dialog open={printRepairModalOpen} onClose={() => setPrintRepairModalOpen(false)} maxWidth="md" fullWidth>
        <style>
          {`
            @media print {
              @page {
                size: A4 portrait;
                margin: 4mm 5mm;
              }
            #root { display: none !important; }
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
                padding: 60px 4px 6px 4px !important;
                margin: 0 !important;
                box-shadow: none !important;
              }
              .MuiDialog-root,
              .MuiDialog-container,
              .MuiDialog-paper,
              .MuiDialogContent-root {
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                overflow: visible !important;
                box-shadow: none !important;
              }
              .MuiBackdrop-root,
              .MuiDialogActions-root,
              .MuiDialogTitle-root,
              .no-print,
              button {
                display: none !important;
              }
            }
          `}
        </style>

        <DialogTitle
          className="no-print"
          sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}
        >
          <Typography variant="h5" fontWeight={700}>
            Machine Repairing Job Card Invoice Receipt
          </Typography>
          <Chip label="Repair Receipt" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {printRepairData && (
            <Box
              id="printable-ledger-repair-jobcard"
              sx={{
                position: 'relative',
                overflow: 'hidden',
                pt: { xs: 5, sm: 7 },
                px: { xs: 1, sm: 1.5 },
                pb: { xs: 1, sm: 1.5 },
                bgcolor: '#ffffff',
                color: '#111827',
                borderRadius: 1
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Structured Professional Customer & Repair Metadata Card */}
                <div
                  style={{
                    border: '1.5px solid #111827',
                    borderRadius: '4px',
                    marginBottom: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                    {/* Left Column: Customer Details */}
                    <div style={{ flex: '1.2', padding: '6px 10px', borderRight: '1px solid #e5e7eb' }}>
                      <div
                        style={{
                          fontSize: '0.70rem',
                          fontWeight: 800,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          marginBottom: '2px'
                        }}
                      >
                        Customer Details
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                        {printRepairData.customerName}
                      </div>
                      <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                        <div>
                          <strong>Phone:</strong> {printRepairData.customerPhone || printRepairData.phone || 'N/A'}
                        </div>
                        <div>
                          <strong>City / Address:</strong> {printRepairData.cityAddress || printRepairData.city || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Job Card Meta */}
                    <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 700 }}>Job Card No:</span>
                        <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>
                          {printRepairData.repairNo || printRepairData.id}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                        <span style={{ fontWeight: 700, color: '#374151' }}>{printRepairData.receivedDate || printRepairData.time}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Repair Status:</span>
                        <span style={{ fontWeight: 800, color: '#16a34a' }}>{printRepairData.repairStatus || 'Received'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Machine Model Highlight Strip */}
                  <div
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(240, 253, 244, 0.55)',
                      borderTop: '1px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.82rem'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#166534', marginRight: '8px' }}>Machine Model Under Repair:</span>
                    <span style={{ fontWeight: 800, color: '#111827' }}>
                      {printRepairData.machineName || printRepairData.machineModel || 'Lawn Mower Machine'}
                    </span>
                  </div>
                </div>

                {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1.5px solid #111827',
                    marginBottom: '10px',
                    backgroundColor: 'transparent'
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                      <th
                        style={{
                          width: '8%',
                          borderRight: '1.5px solid #111827',
                          padding: '4px 4px',
                          textAlign: 'center',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong>Sr</strong>
                      </th>
                      <th
                        style={{
                          width: '52%',
                          borderRight: '1.5px solid #111827',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong>Specification</strong>
                      </th>
                      <th
                        style={{
                          width: '12%',
                          borderRight: '1.5px solid #111827',
                          padding: '4px 4px',
                          textAlign: 'center',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong>QTY</strong>
                      </th>
                      <th
                        style={{
                          width: '14%',
                          borderRight: '1.5px solid #111827',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontSize: '0.82rem'
                        }}
                      >
                        <strong>Rate</strong>
                      </th>
                      <th style={{ width: '14%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                        <strong>Total Amount</strong>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {printRepairData.repairItems && printRepairData.repairItems.length > 0 ? (
                      printRepairData.repairItems.map((item, idx) => {
                        const itemQty = parseInt(item.qnty) || 1;
                        const itemRate = parseFloat(item.rate) || 0;
                        const itemTotal = item.totalAmount || itemQty * itemRate;

                        return (
                          <tr key={idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                            <td
                              style={{
                                borderRight: '1.5px solid #111827',
                                padding: '3px 4px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem'
                              }}
                            >
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td
                              style={{
                                borderRight: '1.5px solid #111827',
                                padding: '3px 8px',
                                textAlign: 'left',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                                lineHeight: 1.25
                              }}
                            >
                              {item.specification || item.itemName || item.model}
                            </td>
                            <td
                              style={{
                                borderRight: '1.5px solid #111827',
                                padding: '3px 4px',
                                textAlign: 'center',
                                fontWeight: 800,
                                fontSize: '0.82rem'
                              }}
                            >
                              {String(itemQty).padStart(2, '0')}
                            </td>
                            <td
                              style={{
                                borderRight: '1.5px solid #111827',
                                padding: '3px 8px',
                                textAlign: 'right',
                                fontWeight: 800,
                                fontSize: '0.82rem'
                              }}
                            >
                              {itemRate.toLocaleString()}
                            </td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                              {itemTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '3px 4px',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}
                        >
                          01
                        </td>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '3px 8px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            lineHeight: 1.25
                          }}
                        >
                          {printRepairData.faultDescription || 'General Repair & Overhauling'}
                        </td>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '3px 4px',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}
                        >
                          01
                        </td>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '3px 8px',
                            textAlign: 'right',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}
                        >
                          {(printRepairData.totalCost || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                          {(printRepairData.totalCost || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* Total Amount Bottom Row */}
                    <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                      <td
                        colSpan={2}
                        style={{
                          borderRight: '1.5px solid #111827',
                          padding: '4px 8px',
                          textAlign: 'center',
                          fontWeight: 800,
                          fontSize: '0.88rem'
                        }}
                      >
                        Total amount
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, fontSize: '0.92rem', color: '#111827' }}>
                        {(printRepairData.totalCost || printRepairData.lineTotal || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Financial Summary Box */}
                <Box sx={{ bgcolor: 'transparent', py: 0.8, px: 1.2, borderRadius: 1, border: '1px solid #86efac', mb: 1.2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                        PAID ADVANCE: Rs. {(printRepairData.paidAmount || 0).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" fontWeight={800} color="success.dark" sx={{ lineHeight: 1.2 }}>
                        NET TOTAL: Rs. {(printRepairData.totalCost || printRepairData.lineTotal || 0).toLocaleString()}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        color={(printRepairData.balanceAmount || 0) > 0 ? 'error.main' : 'success.main'}
                      >
                        {(printRepairData.balanceAmount || 0) > 0
                          ? `REMAINING DUE: Rs. ${(printRepairData.balanceAmount || 0).toLocaleString()}`
                          : 'FULL PAID (NO DUES)'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Signatures Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', mt: 3, pt: 2 }}>
                  <Box>
                    <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 1, pb: 0.5, width: 180 }}>
                      Customer Signature
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
