import { useState } from 'react';
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

// ant design icons
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';

import MainCard from 'components/MainCard';
import { useStoreInventory } from 'context/StoreInventoryContext';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';

export default function VendorLedgerPage() {
  const { vendors, usageLogs, vendorPayments, addVendorPayment } = useStoreInventory();

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedVendorForPay, setSelectedVendorForPay] = useState(null);
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

  // Filter Stock In logs
  const stockInLogs = usageLogs.filter((log) => log.type && log.type.toUpperCase().includes('IN'));

  // Group Stock In logs by Vendor
  const vendorMap = {};
  vendors.forEach((v) => {
    vendorMap[v.name.trim()] = {
      vendorName: v.name.trim(),
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
    const vName = (log.usedBy || 'Unknown Supplier').trim();
    if (!vendorMap[vName]) {
      vendorMap[vName] = {
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
    const logTotal = log.lineTotal || ((parseInt(log.qtyUsed) || 1) * (parseFloat(log.unitPrice) || 0));
    vendorMap[vName].totalShipmentsCount += 1;
    vendorMap[vName].totalPurchasesVal += logTotal;
    vendorMap[vName].shipments.push(log);
  });

  // Add payments made to vendor
  vendorPayments.forEach((p) => {
    const vName = p.vendorName.trim();
    if (vendorMap[vName]) {
      vendorMap[vName].totalPaidVal += parseFloat(p.amountPaid) || 0;
    }
  });

  // Calculate Net Balances
  const vendorList = Object.values(vendorMap).map((v) => {
    const balance = Math.max(0, v.totalPurchasesVal - v.totalPaidVal);
    return { ...v, balanceVal: balance };
  });

  // Filtered List
  const filteredVendors = vendorList.filter(
    (v) =>
      v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      alert('Please enter a valid payment amount');
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
    setPrintVendorData({
      ...v,
      payments: vPaymentsList
    });
    setPrintModalOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Banner Header */}
      <MainCard
        sx={{
          mb: 3,
          background: (theme) => (theme.palette.mode === 'dark' ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#ffffff'),
          borderLeft: '5px solid #a855f7'
        }}
      >
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h3" fontWeight={800} color="textPrimary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TeamOutlined style={{ color: '#a855f7' }} /> Vendor Payables & Supplier Ledger
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              Track raw material purchases from suppliers, log payment disbursements, and manage vendor balances.
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
                  PURCHASES
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main">
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
                <Typography variant="subtitle1" fontWeight={800} color="success.main">
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
                <Typography variant="caption" color="textSecondary" fontWeight={700} display="block" noWrap>
                  PAYABLE BALANCE
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="error.main">
                  Rs. {grandTotalPayables.toLocaleString()}
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
            placeholder="Search Supplier / Vendor by Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />
        </Box>

        {/* Vendor Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#fafafa') }}>
              <TableRow>
                <TableCell><strong>VENDOR / SUPPLIER NAME</strong></TableCell>
                <TableCell align="center"><strong>PHONE / CONTACT</strong></TableCell>
                <TableCell align="center"><strong>SHIPMENTS</strong></TableCell>
                <TableCell align="right"><strong>TOTAL PURCHASES</strong></TableCell>
                <TableCell align="right"><strong>AMOUNT PAID</strong></TableCell>
                <TableCell align="right"><strong>PAYABLE BALANCE</strong></TableCell>
                <TableCell align="center"><strong>ACTIONS</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No Vendor Payables Found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map((v, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight={800} color="textPrimary">
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
                      <Typography variant="subtitle1" fontWeight={800} color={v.balanceVal > 0 ? 'error.main' : 'success.main'}>
                        Rs. {v.balanceVal.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<DollarOutlined />}
                          onClick={() => handleOpenPaymentModal(v)}
                          sx={{ bgcolor: '#a855f7', '&:hover': { bgcolor: '#9333ea' }, fontWeight: 700 }}
                        >
                          Pay Vendor
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PrinterOutlined />}
                          onClick={() => handlePrintStatement(v)}
                          sx={{ fontWeight: 700 }}
                        >
                          Statement
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
          <DialogTitle sx={{ fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <DollarOutlined /> Pay Supplier / Vendor
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            {selectedVendorForPay && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#faf5ff'), borderRadius: 1.5, border: '1px solid #e9d5ff' }}>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
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
                    required
                    placeholder="Enter amount in PKR..."
                    inputProps={{ min: 1 }}
                    value={paymentForm.amountPaid}
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
            <Button onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#a855f7', '&:hover': { bgcolor: '#9333ea' }, fontWeight: 800, px: 3 }}>
              Confirm Vendor Payment
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* PRINTABLE VENDOR STATEMENT MODAL */}
      <Dialog open={printModalOpen} onClose={() => setPrintModalOpen(false)} maxWidth="md" fullWidth>
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
              #printable-vendor-statement, #printable-vendor-statement * {
                visibility: visible !important;
              }
              #printable-vendor-statement {
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
          <Typography variant="h5" fontWeight={700}>📄 Vendor Account Statement Voucher</Typography>
          <Chip label="Vendor Statement" color="success" size="small" />
        </DialogTitle>

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 3 } }}>
          {printVendorData && (
            <Box id="printable-vendor-statement" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 2, sm: 3 }, bgcolor: '#ffffff', color: '#111827', borderRadius: 1 }}>
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
                  FACTORY STORE VENDOR & SUPPLIER PAYABLE LEDGER
                </Typography>
                <Typography variant="caption" display="block" align="center" color="textSecondary" sx={{ mb: 2 }}>
                  Official Vendor Account Statement & Receiving Voucher
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary" display="block">VENDOR / SUPPLIER NAME:</Typography>
                    <Typography variant="h5" fontWeight={800} color="primary.main">{printVendorData.vendorName}</Typography>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Phone: {printVendorData.phone || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" color="textSecondary" display="block">STATEMENT DATE:</Typography>
                    <Typography variant="subtitle2" fontWeight={700}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                  </Grid>
                </Grid>

                <Box sx={{ bgcolor: '#ecfdf5', p: 2, borderRadius: 1.5, border: '1px solid #a7f3d0', mb: 2 }}>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary" display="block">TOTAL SUPPLIES BILLED: Rs. {printVendorData.totalPurchasesVal.toLocaleString()}</Typography>
                      <Typography variant="caption" color="textSecondary" display="block">TOTAL PAID TO VENDOR: Rs. {printVendorData.totalPaidVal.toLocaleString()}</Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="textSecondary" display="block">OUTSTANDING PAYABLE BALANCE:</Typography>
                      <Typography variant="h3" fontWeight={800} color={printVendorData.balanceVal > 0 ? '#dc2626' : '#059669'}>
                        Rs. {printVendorData.balanceVal.toLocaleString()}
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
          <Button
            variant="contained"
            color="success"
            startIcon={<PrinterOutlined />}
            onClick={() => window.print()}
            size="large"
            className="no-print"
            sx={{ px: 3, fontWeight: 700 }}
          >
            Print Vendor Statement
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
