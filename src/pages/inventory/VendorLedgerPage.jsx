import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import Chip from '@mui/material/Chip';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// ant design icons
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import HistoryOutlined from '@ant-design/icons/HistoryOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';

import MainCard from 'components/MainCard';
import { AppButton, ConfirmDialog } from 'components/common';
import { useStoreInventory } from 'context/StoreInventoryContext';

export default function VendorLedgerPage() {
  const { vendors, usageLogs, vendorPayments, addVendorPayment, deleteVendorPayment, deleteVendor, deleteMultipleLogs } = useStoreInventory();

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

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
  }, [searchTerm]);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedVendorForPay, setSelectedVendorForPay] = useState(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedVendorForHistory, setSelectedVendorForHistory] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    vendorName: '',
    amountPaid: '',
    paymentMethod: 'Cash',
    referenceNo: '',
    notes: ''
  });

  // Statement Print Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printVendorData, setPrintVendorData] = useState(null);

  // Vendor Delete & Payment Delete Confirmation State
  const [deleteVendorModalOpen, setDeleteVendorModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [vendorToast, setVendorToast] = useState({ open: false, message: '', severity: 'warning' });
  const [deletedVendorNames, setDeletedVendorNames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rehmat_deleted_vendor_ledger_names') || '[]');
    } catch {
      return [];
    }
  });

  // Filter Stock In logs
  const stockInLogs = usageLogs.filter((log) => log.type && log.type.toUpperCase().includes('IN'));

  // Group Stock In logs by Vendor (normalized lowerCase keys)
  const vendorMap = {};
  vendors.forEach((v) => {
    const rawName = (v.name || '').trim();
    if (!rawName) return;
    const key = rawName.toLowerCase();
    vendorMap[key] = {
      vendorName: rawName,
      contactPerson: v.contactPerson || '',
      phone: v.phone || '',
      category: v.category || '',
      totalShipmentsCount: 0,
      totalPurchasesVal: 0,
      totalPaidVal: 0,
      balanceVal: 0,
      shipments: []
    };
  });

  stockInLogs.forEach((log) => {
    const vName = (log.usedBy || log.vendor || log.department || 'Unknown Supplier').trim();
    const key = vName.toLowerCase();
    if (!vendorMap[key]) {
      vendorMap[key] = {
        vendorName: vName,
        contactPerson: '',
        phone: '',
        category: '',
        totalShipmentsCount: 0,
        totalPurchasesVal: 0,
        totalPaidVal: 0,
        balanceVal: 0,
        shipments: []
      };
    }
    const logTotal = (log.lineTotal && log.lineTotal > 0) ? log.lineTotal : ((parseInt(log.qtyUsed) || 1) * (parseFloat(log.unitPrice) || 0));
    vendorMap[key].totalShipmentsCount += 1;
    vendorMap[key].totalPurchasesVal += logTotal;
    vendorMap[key].shipments.push(log);
  });

  // Add payments made to vendor
  vendorPayments.forEach((p) => {
    const key = (p.vendorName || '').trim().toLowerCase();
    if (vendorMap[key]) {
      vendorMap[key].totalPaidVal += parseFloat(p.amountPaid) || 0;
    }
  });

  // Calculate Net Balances - Only include vendors who have transactions / hisab (purchases, payments, or shipments)
  const vendorList = Object.values(vendorMap)
    .filter((v) => !deletedVendorNames.includes((v.vendorName || '').trim().toLowerCase()))
    .filter((v) => v.totalPurchasesVal > 0 || v.totalPaidVal > 0 || v.totalShipmentsCount > 0)
    .map((v) => {
      const balance = Math.max(0, v.totalPurchasesVal - v.totalPaidVal);
      return { ...v, balanceVal: balance };
    });

  // Sort: Vendors with balance due first, then highest purchases
  vendorList.sort((a, b) => (b.balanceVal - a.balanceVal) || (b.totalPurchasesVal - a.totalPurchasesVal));

  // Filtered List - Show all vendors by default! Filter when search term entered
  const filteredVendors = searchTerm.trim()
    ? vendorList.filter(
      (v) =>
        v.vendorName.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        v.phone.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
        v.category.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    : vendorList;

  // Overall Summary
  const grandTotalPurchases = vendorList.reduce((acc, v) => acc + v.totalPurchasesVal, 0);
  const grandTotalPaid = vendorList.reduce((acc, v) => acc + v.totalPaidVal, 0);
  const grandTotalPayables = vendorList.reduce((acc, v) => acc + v.balanceVal, 0);

  // Open Payment Modal
  const handleOpenPaymentModal = (v) => {
    setSelectedVendorForPay(v);
    setPaymentForm({
      vendorName: v.vendorName,
      amountPaid: '',
      remainingBalance: v.balanceVal,
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
      setVendorToast({ open: true, message: 'Please enter a valid payment amount', severity: 'warning' });
      return;
    }

    addVendorPayment({
      vendorName: paymentForm.vendorName,
      amountPaid: paidNum,
      paymentMethod: paymentForm.paymentMethod,
      referenceNo: paymentForm.referenceNo,
      notes: paymentForm.notes
    });

    setPaymentModalOpen(false);
  };

  // Open Print Statement
  const handlePrintStatement = (v) => {
    const vPaymentsList = vendorPayments.filter((p) => p.vendorName.toLowerCase() === v.vendorName.toLowerCase());
    const biltyNos = Array.from(new Set((v.shipments || []).map((s) => s.biltyNo).filter(Boolean)));
    setPrintVendorData({
      ...v,
      payments: vPaymentsList,
      biltyNo: biltyNos.join(', '),
      voucherNo: biltyNos.length > 0 ? `Bill #${biltyNos.join(', #')}` : `VND-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setPrintModalOpen(true);
  };

  // Open Delete Vendor Confirmation
  const handleOpenDeleteVendor = (vendor) => {
    setVendorToDelete(vendor);
    setDeleteVendorModalOpen(true);
  };

  // Confirm Delete Vendor
  const handleConfirmDeleteVendor = () => {
    if (!vendorToDelete) return;
    const targetName = (vendorToDelete.vendorName || '').trim();
    const targetKey = targetName.toLowerCase();

    // 1. Delete matching vendor entity from Store vendors if exists
    const matched = vendors.find((vend) => (vend.name || '').trim().toLowerCase() === targetKey);
    if (matched?.id && deleteVendor) {
      deleteVendor(matched.id);
    }

    // 2. Delete all payment records for this vendor
    const matchingPayments = vendorPayments.filter((p) => (p.vendorName || '').trim().toLowerCase() === targetKey);
    matchingPayments.forEach((p) => {
      if (deleteVendorPayment) deleteVendorPayment(p.id);
    });

    // 3. Delete shipment/stock-in logs for this vendor
    if (vendorToDelete.shipments && vendorToDelete.shipments.length > 0 && deleteMultipleLogs) {
      deleteMultipleLogs(vendorToDelete.shipments.map((s) => s.id));
    }

    // 4. Record in deleted list to guarantee immediate removal
    const updated = Array.from(new Set([...deletedVendorNames, targetKey]));
    setDeletedVendorNames(updated);
    try {
      localStorage.setItem('rehmat_deleted_vendor_ledger_names', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    setDeleteVendorModalOpen(false);
    setVendorToDelete(null);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Banner Header & Metric Summary Cards */}
      <MainCard
        sx={{
          mb: 3,
          background: (theme) => (theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#ffffff'),
          borderLeft: '5px solid #a855f7'
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h4" fontWeight={700} color="textPrimary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TeamOutlined style={{ color: '#a855f7' }} /> Vendor Payables &amp; Supplier Ledger
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Track raw material purchases from suppliers, log payment disbursements, and manage vendor balances.
            </Typography>
          </Grid>

          {/* Metric Summary Cards */}
          <Grid size={{ xs: 12, md: 6 }}>
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
                  TOTAL PURCHASES
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                  Rs. {grandTotalPurchases.toLocaleString()}
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
                  PAID TO VENDORS
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="success.main">
                  Rs. {grandTotalPaid.toLocaleString()}
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
                <Typography variant="caption" color="error.main" fontWeight={700} display="block" noWrap>
                  OUTSTANDING PAYABLE
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} color="error.main">
                  Rs. {grandTotalPayables.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </MainCard>

      {/* Main Ledger Card */}
      <MainCard
        title="Vendor Payables & Accounts Directory"
        secondary={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <AppButton intent="secondary" size="small" component={Link} to="/inventory/store-payments">
              Store Payments &amp; Cashbook
            </AppButton>
            <AppButton intent="primary" size="small" component={Link} to="/inventory/store-ledger">
              Full Store Party Ledger
            </AppButton>
          </Box>
        }
      >
        {/* Search Bar */}
        <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <OutlinedInput
            sx={{ maxWidth: 450, flexGrow: 1 }}
            placeholder="Type vendor / supplier name to search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
            endAdornment={
              searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm('')} edge="end">
                    <CloseCircleOutlined style={{ fontSize: '0.95rem', color: '#9ca3af' }} />
                  </IconButton>
                </InputAdornment>
              ) : null
            }
          />
          {searchTerm && (
            <Button
              variant="text"
              color="secondary"
              size="small"
              onClick={() => setSearchTerm('')}
              sx={{ fontWeight: 600 }}
            >
              Clear Search
            </Button>
          )}
        </Box>

        {/* Vendor Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Vendor / Supplier Name</TableCell>
                <TableCell align="center">Phone / Contact</TableCell>
                <TableCell align="center">Shipments</TableCell>
                <TableCell align="right">Total Purchases</TableCell>
                <TableCell align="right">Amount Paid</TableCell>
                <TableCell align="right">Remaining Balance</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" fontWeight={700} color="textSecondary">
                      {searchTerm ? `No Vendor Found Matching "${searchTerm}"` : 'No Vendor Records Found'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                      {searchTerm ? 'Please check the vendor name or phone number.' : 'Stock in items will automatically list vendors and their payables here.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((v, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>
                        <Typography variant="subtitle1" fontWeight={700} color="textPrimary">
                          {v.vendorName}
                        </Typography>
                        {v.category && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            Category: {v.category}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600} color="textSecondary">
                          {v.phone || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={`${v.totalShipmentsCount} Shipments`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700}>
                          Rs. {v.totalPurchasesVal.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle2" fontWeight={700} color="success.main">
                          Rs. {v.totalPaidVal.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight={700} color={v.balanceVal > 0 ? 'error.main' : 'success.main'}>
                          Rs. {v.balanceVal.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <Tooltip title="Pay Vendor (Record Payment)">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPaymentModal(v)}
                              sx={{
                                color: '#ffffff',
                                bgcolor: '#a855f7',
                                borderRadius: 1.5,
                                p: 0.85,
                                boxShadow: '0 1px 2px rgba(168, 85, 247, 0.3)',
                                '&:hover': { bgcolor: '#9333ea', transform: 'translateY(-1px)' },
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <DollarOutlined style={{ fontSize: '1.05rem' }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="View Payment & Shipment History">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedVendorForHistory(v);
                                setHistoryModalOpen(true);
                              }}
                              sx={{
                                color: '#0284c7',
                                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(2, 132, 199, 0.2)' : '#e0f2fe'),
                                border: '1px solid',
                                borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(2, 132, 199, 0.4)' : '#bae6fd'),
                                borderRadius: 1.5,
                                p: 0.85,
                                '&:hover': { bgcolor: '#0284c7', color: '#fff', transform: 'translateY(-1px)' },
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <HistoryOutlined style={{ fontSize: '1.05rem' }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Print Vendor Statement">
                            <IconButton
                              size="small"
                              onClick={() => handlePrintStatement(v)}
                              sx={{
                                color: '#059669',
                                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5'),
                                border: '1px solid',
                                borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(5, 150, 105, 0.4)' : '#a7f3d0'),
                                borderRadius: 1.5,
                                p: 0.85,
                                '&:hover': { bgcolor: '#059669', color: '#fff', transform: 'translateY(-1px)' },
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <PrinterOutlined style={{ fontSize: '1.05rem' }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Vendor / Clear Records">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDeleteVendor(v)}
                              sx={{
                                color: '#dc2626',
                                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2'),
                                border: '1px solid',
                                borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(220, 38, 38, 0.4)' : '#fecaca'),
                                borderRadius: 1.5,
                                p: 0.85,
                                '&:hover': { bgcolor: '#dc2626', color: '#fff', transform: 'translateY(-1px)' },
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: '1.05rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredVendors.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredVendors.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </MainCard>

      {/* RECORD VENDOR PAYMENT MODAL */}
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
          <DialogTitle sx={{ fontWeight: 700, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <DollarOutlined /> Pay Supplier / Vendor
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedVendorForPay && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#faf5ff'), borderRadius: 1.5, border: '1px solid #e9d5ff' }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {selectedVendorForPay.vendorName}
                  </Typography>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 0.5 }}>
                    Current Payable Balance: <strong style={{ color: '#ef4444' }}>Rs. {selectedVendorForPay.balanceVal.toLocaleString()}</strong>
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                    AMOUNT PAID TO VENDOR (PKR) *
                  </Typography>
                  <TextField
                    type="number"
                    fullWidth
                    autoFocus
                    required
                    placeholder="Enter amount in PKR..."
                    inputProps={{ min: 1 }}
                    value={paymentForm.amountPaid}
                    onFocus={(e) => e.target.select?.()}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                  />
                </Box>

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
                  </TextField>
                </Box>

                <Box>
                  <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                    REFERENCE / CHEQUE NO
                  </Typography>
                  <TextField
                    placeholder="e.g. CHQ-880912"
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
                    placeholder="Payment details..."
                    fullWidth
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'), borderTop: '1px solid', borderColor: 'divider' }}>
            <AppButton intent="cancel" onClick={() => setPaymentModalOpen(false)}>
              Cancel
            </AppButton>
            <AppButton intent="primary" type="submit">
              Confirm Vendor Payment
            </AppButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* VENDOR PAYMENT HISTORY & DELETE MODAL */}
      <Dialog
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'text.primary', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Payment History & Vouchers — {selectedVendorForHistory?.vendorName}</span>
          <Chip
            label={`Total Paid: Rs. ${(selectedVendorForHistory?.totalPaidVal || 0).toLocaleString()}`}
            color="success"
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {(() => {
            const list = vendorPayments.filter(
              (p) => (p.vendorName || '').toLowerCase() === (selectedVendorForHistory?.vendorName || '').toLowerCase()
            );
            if (list.length === 0) {
              return (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary" fontWeight={600}>
                    No payment records found for this vendor.
                  </Typography>
                </Box>
              );
            }
            return (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date &amp; Time</TableCell>
                      <TableCell align="right">Amount Paid</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Reference / Cheque</TableCell>
                      <TableCell>Notes</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {list.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{p.time}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                          Rs. {(parseFloat(p.amountPaid) || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip label={p.paymentMethod || 'Cash'} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{p.referenceNo || '—'}</TableCell>
                        <TableCell>{p.notes || '—'}</TableCell>
                        <TableCell align="center">
                          <AppButton
                            size="small"
                            intent="danger-outlined"
                            startIcon={<DeleteOutlined />}
                            onClick={() => setPaymentToDelete(p)}
                          >
                            Delete
                          </AppButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            );
          })()}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setHistoryModalOpen(false)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* PRINTABLE VENDOR STATEMENT MODAL */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
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
              #printable-vendor-statement, #printable-vendor-statement * {
                visibility: visible !important;
              }
              #printable-vendor-statement {
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

        <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>Vendor Stock Receiving Invoice & Statement</Typography>
          <Chip label="Vendor Statement" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1, sm: 1.5 } }}>
          {printVendorData && (
            <Box
              id="printable-vendor-statement"
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
                {/* Structured Professional Vendor & Metadata Card */}
                <div style={{
                  border: '1.5px solid #111827',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.45)',
                  overflow: 'hidden'
                }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                    {/* Left Column: Vendor Details */}
                    <div style={{ flex: '1.2', padding: '6px 10px', borderRight: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.70rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        Vendor / Supplier Details
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                        {printVendorData.vendorName}
                      </div>
                      <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                        <div><strong>Stock In Entry Type:</strong> Stock In (Receiving Invoice)</div>
                        {printVendorData.phone && printVendorData.phone !== 'N/A' && <div><strong>Phone:</strong> {printVendorData.phone}</div>}
                      </div>
                    </div>

                    {/* Right Column: Meta */}
                    <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 700 }}>PO / Voucher No:</span>
                        <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>{printVendorData.voucherNo || `VND-${Math.floor(1000 + Math.random() * 9000)}`}</span>
                      </div>
                      {printVendorData.biltyNo && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Vendor Bill / Bilty #:</span>
                          <span style={{ fontWeight: 800, color: '#111827' }}>{printVendorData.biltyNo}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Date & Time:</span>
                        <span style={{ fontWeight: 700, color: '#374151' }}>
                          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                        <span style={{ color: '#6b7280', fontWeight: 600 }}>Status:</span>
                        <span style={{ fontWeight: 800, color: (printVendorData.balanceVal || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                          {(printVendorData.balanceVal || 0) > 0 ? 'Balance Outstanding' : 'Received & Cleared'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* EXACT TABLE AS SHOWN IN STOCK IN PRINT FORMAT */}
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '10px', backgroundColor: 'transparent' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                      <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontSize: '0.82rem' }}>
                        <strong>Sr</strong>
                      </th>
                      <th style={{ width: '62%', borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                        <strong>Specification / Item Name</strong>
                      </th>
                      <th style={{ width: '14%', borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontSize: '0.82rem' }}>
                        <strong>QTY</strong>
                      </th>
                      <th style={{ width: '16%', padding: '4px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                        <strong>Total Amount</strong>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {printVendorData.shipments && printVendorData.shipments.length > 0 ? (
                      printVendorData.shipments.map((item, idx) => {
                        const itemQty = item.qtyUsed || 1;
                        const itemUnitPrice = item.unitPrice || 0;
                        const itemLineTotal = item.lineTotal || (itemQty * itemUnitPrice);

                        return (
                          <tr key={item.id || idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                              {String(idx + 1).padStart(2, '0')}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.25 }}>
                              {(item.itemName || '').replace(/\s*\([^)]*SKU-[^)]*\)/gi, '').trim()}
                            </td>
                            <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                              {String(itemQty).padStart(2, '0')}
                            </td>
                            <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                              {itemLineTotal.toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                          01
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem' }}>
                          Vendor Stock Deliveries & Supplies
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.82rem' }}>
                          {String(printVendorData.totalShipmentsCount || 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '3px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                          {(printVendorData.totalPurchasesVal || 0).toLocaleString()}
                        </td>
                      </tr>
                    )}

                    {/* Total Amount Bottom Row */}
                    <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                      <td colSpan={2} style={{ borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'center', fontWeight: 800, fontSize: '0.88rem' }}>
                        Total amount
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, fontSize: '0.92rem', color: '#111827' }}>
                        {(printVendorData.totalPurchasesVal || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Financial Summary Box */}
                <Box sx={{ bgcolor: 'transparent', py: 0.8, px: 1.2, borderRadius: 1, border: '1px solid #86efac', mb: 1.2 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                        TOTAL RECEIVING ITEMS: {printVendorData.shipments?.length || printVendorData.totalShipmentsCount || 1}
                      </Typography>
                      {Number(printVendorData.totalPaidVal) > 0 ? (
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', display: 'block', mt: 0.3 }}>
                          Paid to Vendor: Rs. {Number(printVendorData.totalPaidVal || 0).toLocaleString()}
                        </Typography>
                      ) : (
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', display: 'block', mt: 0.3 }}>
                          Payment: Full Credit Purchase (Unpaid)
                        </Typography>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Typography variant="subtitle1" fontWeight={800} color="success.dark" sx={{ lineHeight: 1.2 }}>
                        NET TOTAL: Rs. {(printVendorData.totalPurchasesVal || 0).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: Number(printVendorData.balanceVal) > 0 ? '#dc2626' : '#16a34a', display: 'block', mt: 0.3 }}>
                        {Number(printVendorData.balanceVal) > 0
                          ? `Remaining Balance Due: Rs. ${Number(printVendorData.balanceVal || 0).toLocaleString()}`
                          : 'Full Cleared (No Balance Due)'}
                      </Typography>
                    </div>
                  </div>
                </Box>

                {/* Signatures Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', mt: 1.5, pt: 1 }}>
                  <Box>
                    <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 170 }}>
                      Vendor Signature
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
          )
          }
        </DialogContent >

        <DialogActions className="no-print" sx={{ p: 2.5, justifyContent: 'space-between' }}>
          <AppButton intent="cancel" onClick={() => setPrintModalOpen(false)} className="no-print">
            Close &amp; Continue
          </AppButton>
          <AppButton intent="print" startIcon={<PrinterOutlined />} onClick={() => window.print()} className="no-print">
            Print Vendor Statement
          </AppButton>
        </DialogActions>
      </Dialog >

      {/* VENDOR DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteVendorModalOpen}
        onClose={() => setDeleteVendorModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlined />
          <span>Delete Vendor Confirmation</span>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          <Typography variant="body1" color="textPrimary">
            Are you sure you want to delete vendor <strong>&quot;{vendorToDelete?.vendorName}&quot;</strong>?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            This action will delete the vendor profile, clear their payment records, and remove them from the Vendor Payables directory.
          </Typography>
          {vendorToDelete && Number(vendorToDelete.balanceVal) > 0 && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: '#fef2f2', borderRadius: 1.5, border: '1px solid #fecaca' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#b91c1c' }}>
                Note: This vendor has an outstanding balance of Rs. {Number(vendorToDelete.balanceVal).toLocaleString()}.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setDeleteVendorModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteVendor} variant="contained" color="error" startIcon={<DeleteOutlined />} sx={{ fontWeight: 700 }}>
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(paymentToDelete)}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={async () => {
          if (paymentToDelete) {
            await deleteVendorPayment(paymentToDelete.id);
            setVendorToast({ open: true, message: 'Vendor payment deleted', severity: 'success' });
            setPaymentToDelete(null);
          }
        }}
        title="Delete Vendor Payment"
        message={
          <>
            Are you sure you want to delete this payment of{' '}
            <strong>Rs. {(parseFloat(paymentToDelete?.amountPaid) || 0).toLocaleString()}</strong>?
          </>
        }
        confirmText="Confirm Delete"
      />

      <Snackbar
        open={vendorToast.open}
        autoHideDuration={3500}
        onClose={() => setVendorToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setVendorToast((prev) => ({ ...prev, open: false }))}
          severity={vendorToast.severity}
          variant="filled"
          sx={{ fontWeight: 600 }}
        >
          {vendorToast.message}
        </Alert>
      </Snackbar>
    </Box >
  );
}
