import { useState } from 'react';
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
import { useTransparentLogo } from 'components/logo/LogoMain';

export default function VendorLedgerPage() {
  const transparentLogo = useTransparentLogo(rehmatLogo);
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
                size: A4 portrait;
                margin: 6mm;
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
                padding: 10px !important;
              }
              #printable-vendor-statement .watermark-logo {
                top: 58% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 390px !important;
                max-width: 70% !important;
                opacity: 0.15 !important;
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

        <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2 } }}>
          {printVendorData && (
            <Box
              id="printable-vendor-statement"
              sx={{
                position: 'relative',
                overflow: 'hidden',
                p: { xs: 2, sm: 3 },
                bgcolor: '#ffffff',
                color: '#111827',
                borderRadius: 1
              }}
            >
              {/* 🏢 Watermark Background Logo */}
              <Box
                component="img"
                className="watermark-logo"
                src={transparentLogo || rehmatLogo}
                alt="Watermark Logo"
                sx={{
                  position: 'absolute',
                  top: '58%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '390px',
                  maxWidth: '70%',
                  opacity: 0.15,
                  pointerEvents: 'none',
                  zIndex: 0
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 1 }}>
                {/* Brand Header with Emblem Logo */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
                    <Box
                      component="img"
                      src={transparentLogo || rehmatLogo}
                      alt="Rehmat Logo Emblem"
                      sx={{ width: 64, height: 64, objectFit: 'contain', borderRadius: '50%' }}
                    />
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="h3" fontWeight={800} sx={{ color: '#10b981', lineHeight: 1.1, letterSpacing: '0.5px' }}>
                        REHMAT LAWN MOWERS
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Structured Professional Vendor Account Details Card */}
                  <div style={{
                    border: '1.5px solid #111827',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
                      {/* Left Column: Vendor Details */}
                      <div style={{ flex: '1.2', padding: '10px 14px', borderRight: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
                          Vendor Account Details
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: '4px' }}>
                          {printVendorData.vendorName}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.6' }}>
                          <div><strong>Phone:</strong> {printVendorData.phone || 'N/A'}</div>
                          {printVendorData.category && <div><strong>Category:</strong> {printVendorData.category}</div>}
                        </div>
                      </div>

                      {/* Right Column: Statement Meta */}
                      <div style={{ flex: '1', padding: '10px 14px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 700 }}>Statement Type:</span>
                          <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.95rem' }}>Payable Ledger</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Statement Date:</span>
                          <span style={{ fontWeight: 700, color: '#374151' }}>
                            {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: '#6b7280', fontWeight: 600 }}>Total Shipments:</span>
                          <span style={{ fontWeight: 800, color: '#16a34a' }}>{printVendorData.totalShipmentsCount || 1} Entries</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXACT TABLE AS SHOWN IN OFFICIAL PRINT FORMAT */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '16px', backgroundColor: 'transparent' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: 'transparent' }}>
                        <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '8px 4px', textAlign: 'center', fontSize: '0.95rem' }}>
                          <strong>Sr</strong>
                        </th>
                        <th style={{ width: '52%', borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontSize: '0.95rem' }}>
                          <strong>Specification / Description</strong>
                        </th>
                        <th style={{ width: '12%', borderRight: '1.5px solid #111827', padding: '8px 6px', textAlign: 'center', fontSize: '0.95rem' }}>
                          <strong>QTY / Count</strong>
                        </th>
                        <th style={{ width: '14%', borderRight: '1.5px solid #111827', padding: '8px 8px', textAlign: 'center', fontSize: '0.95rem' }}>
                          <strong>Amount Paid</strong>
                        </th>
                        <th style={{ width: '14%', padding: '8px 8px', textAlign: 'center', fontSize: '0.95rem' }}>
                          <strong>Total Purchases</strong>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                          01
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.95rem' }}>
                          Vendor Cumulative Supply Invoices & Material Deliveries
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 6px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                          {String(printVendorData.totalShipmentsCount || 1).padStart(2, '0')}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                          {(printVendorData.totalPaidVal || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.95rem' }}>
                          {(printVendorData.totalPurchasesVal || 0).toLocaleString()}
                        </td>
                      </tr>

                      {/* Total Amount Bottom Row */}
                      <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                        <td colSpan={2} style={{ borderRight: '1.5px solid #111827', padding: '8px 12px', textAlign: 'center', fontWeight: 800, fontSize: '1rem' }}>
                          Total amount
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '8px' }}></td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '8px', textAlign: 'right', fontWeight: 800 }}>
                          {(printVendorData.totalPaidVal || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#111827' }}>
                          {(printVendorData.totalPurchasesVal || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Financial Summary Box */}
                  <Box sx={{ bgcolor: 'transparent', p: 1.5, borderRadius: 1, border: '1px solid #86efac', mb: 2 }}>
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" fontWeight={700} color="textSecondary" display="block">
                          TOTAL PAID TO VENDOR: Rs. {(printVendorData.totalPaidVal || 0).toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sx={{ textAlign: 'right' }}>
                        <Typography variant="h6" fontWeight={800} color="success.dark">
                          NET PURCHASES: Rs. {(printVendorData.totalPurchasesVal || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="subtitle2" fontWeight={800} color={(printVendorData.balanceVal || 0) > 0 ? 'error.main' : 'success.main'}>
                          {(printVendorData.balanceVal || 0) > 0 ? `OUTSTANDING PAYABLE BALANCE: Rs. ${(printVendorData.balanceVal || 0).toLocaleString()}` : 'FULL CLEARED (NO BALANCE DUE)'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Signatures Footer */}
                  <Grid container spacing={2} sx={{ mt: 3, pt: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 1, width: 180 }}>
                        Vendor Signature
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sx={{ textAlign: 'right' }}>
                      <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                        <CeoSignature />
                      </Box>
                    </Grid>
                  </Grid>
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
