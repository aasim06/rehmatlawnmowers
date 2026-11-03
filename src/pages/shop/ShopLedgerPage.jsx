import React, { useState, useMemo } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { useTheme } from '@mui/material/styles';

// material-ui
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

// components & icons
import MainCard from 'components/MainCard';
import CeoSignature from 'components/CeoSignature';

// ant design icons
import BookOutlined from '@ant-design/icons/BookOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import AppstoreOutlined from '@ant-design/icons/AppstoreOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';

// ==============================|| SHOP MATERIAL ISSUE LEDGER ||============================== //

export default function ShopLedgerPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { shopSales = [], resetShopDataToZero } = useStoreInventory();

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPerson, setExpandedPerson] = useState(null);

  // Factory Reset Dialog State
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetShopData = async () => {
    if (!resetShopDataToZero) return;
    setResetting(true);
    await resetShopDataToZero();
    setResetting(false);
    setResetConfirmOpen(false);
  };

  // Print Statement Modal State
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState(null);

  // Group Shop Issues by Person Name ("Kon Le Gaya")
  const personLedgers = useMemo(() => {
    const personMap = {};

    shopSales.forEach((slip) => {
      const rawName = (slip.customerName || slip.customer || slip.issuedTo || 'Factory Staff').trim();
      const personKey = rawName.toLowerCase();

      if (!personMap[personKey]) {
        personMap[personKey] = {
          key: personKey,
          personName: rawName,
          phoneOrDept: slip.customerPhone || slip.phone || slip.department || 'Factory Floor',
          slips: [],
          totalSlips: 0,
          totalItemsCount: 0,
          totalValue: 0
        };
      }

      if (slip.customerPhone || slip.phone || slip.department) {
        personMap[personKey].phoneOrDept = slip.customerPhone || slip.phone || slip.department;
      }

      const totalVal = parseFloat(slip.totalAmount) || 0;
      const itemsCount = (slip.items || []).reduce((sum, it) => sum + (parseInt(it.qty, 10) || 1), 0);

      personMap[personKey].slips.push(slip);
      personMap[personKey].totalSlips += 1;
      personMap[personKey].totalItemsCount += itemsCount;
      personMap[personKey].totalValue += totalVal;
    });

    return Object.values(personMap).sort((a, b) => b.totalValue - a.totalValue);
  }, [shopSales]);

  // Filtered Persons
  const filteredPersons = useMemo(() => {
    return personLedgers.filter((p) => {
      const term = searchTerm.toLowerCase();
      return (
        p.personName.toLowerCase().includes(term) ||
        p.phoneOrDept.toLowerCase().includes(term)
      );
    });
  }, [personLedgers, searchTerm]);

  // Overall KPIs
  const kpiData = useMemo(() => {
    let totalValue = 0;
    let totalItems = 0;
    let totalSlips = 0;

    personLedgers.forEach((p) => {
      totalValue += p.totalValue;
      totalItems += p.totalItemsCount;
      totalSlips += p.totalSlips;
    });

    return {
      totalPersons: personLedgers.length,
      totalSlips,
      totalItems,
      totalValue
    };
  }, [personLedgers]);

  // Open Print Statement Modal
  const handleOpenPrintStatement = (person) => {
    setPrintData(person);
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
              Shop Issue Ledger (Material Issue History)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track factory workers, technicians &amp; staff who took parts/items from store, total items count, and dates.
            </Typography>
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteOutlined />}
          onClick={() => setResetConfirmOpen(true)}
          sx={{ fontWeight: 800, borderRadius: 1.5, height: 36, px: 2, fontSize: '0.8rem' }}
        >
          Factory Reset (0)
        </Button>
      </Box>

      {/* 2. Top Metric KPI Cards - 4 Columns Across Full Width */}
      <Grid container spacing={2.5} sx={{ mb: 3.5, width: '100%' }}>
        {/* Total Persons */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #1677ff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Staff / Persons
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ mt: 0.5, color: '#1677ff' }}>
                  {kpiData.totalPersons}
                </Typography>
              </Box>
              <Box sx={{ color: '#1677ff', display: 'flex', alignItems: 'center' }}>
                <UserOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Issue Slips */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #005F56' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Issue Slips
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ mt: 0.5, color: '#005F56' }}>
                  {kpiData.totalSlips}
                </Typography>
              </Box>
              <Box sx={{ color: '#005F56', display: 'flex', alignItems: 'center' }}>
                <FileTextOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Items Issued */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #fa8c16' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Items Issued
                </Typography>
                <Typography variant="h3" fontWeight={900} sx={{ mt: 0.5, color: '#d46b08' }}>
                  {kpiData.totalItems}
                </Typography>
              </Box>
              <Box sx={{ color: '#fa8c16', display: 'flex', alignItems: 'center' }}>
                <AppstoreOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>

        {/* Total Value Issued */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
          <MainCard sx={{ width: '100%', height: '100%', bgcolor: isDark ? 'background.paper' : '#fff', borderLeft: '4px solid #52c41a' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Issued Value
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5, color: '#389e0d' }}>
                  Rs. {kpiData.totalValue.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ color: '#52c41a', display: 'flex', alignItems: 'center' }}>
                <DollarOutlined style={{ fontSize: '1.75rem' }} />
              </Box>
            </Box>
          </MainCard>
        </Grid>
      </Grid>

      {/* 3. Search Bar */}
      <MainCard sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by Person Name, Department, or Phone..."
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
      </MainCard>

      {/* 4. Person / Staff Issue Table */}
      <MainCard content={false} sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: isDark ? 'background.neutral' : '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ fontWeight: 800 }}>Person / Staff Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Dept / Machine / Phone</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Total Slips</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800 }}>Total Items Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Total Value</TableCell>
                <TableCell align="center" sx={{ fontWeight: 800, width: 180 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPersons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <BookOutlined style={{ fontSize: '2.5rem', color: '#94a3b8', display: 'block', margin: '0 auto 12px' }} />
                    <Typography variant="h6" fontWeight={700} color="text.secondary">
                      No issue records found.
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      When staff takes items from Shop Mart, their records will automatically appear here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPersons.map((person) => {
                  const isExpanded = expandedPerson === person.key;

                  return (
                    <React.Fragment key={person.key}>
                      <TableRow
                        hover
                        sx={{
                          cursor: 'pointer',
                          bgcolor: isExpanded ? (isDark ? 'rgba(255,255,255,0.03)' : '#f1f5f9') : 'inherit'
                        }}
                      >
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => setExpandedPerson(isExpanded ? null : person.key)}
                          >
                            {isExpanded ? <UpOutlined style={{ fontSize: '0.8rem' }} /> : <DownOutlined style={{ fontSize: '0.8rem' }} />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                            {person.personName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {person.phoneOrDept}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${person.totalSlips} Slips`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={`${person.totalItemsCount} Pcs`} color="info" size="small" sx={{ fontWeight: 800 }} />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" fontWeight={800} color="#005F56">
                            Rs. {person.totalValue.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            startIcon={<PrinterOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPrintStatement(person);
                            }}
                            sx={{ fontWeight: 700, borderRadius: 1.5, fontSize: '0.78rem' }}
                          >
                            Print Statement
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded History Row */}
                      <TableRow>
                        <TableCell colSpan={7} sx={{ py: 0, bgcolor: isDark ? 'background.default' : '#f8fafc' }}>
                          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                            <Box sx={{ p: 2.5 }}>
                              <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FileTextOutlined /> All Material Issue Slips for: {person.personName}
                              </Typography>
                              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                <Table size="small">
                                  <TableHead sx={{ bgcolor: isDark ? 'background.paper' : '#f1f5f9' }}>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Slip #</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Date &amp; Time</TableCell>
                                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Items Issued Description</TableCell>
                                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Value (Rs.)</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {person.slips.map((s, idx) => (
                                      <TableRow key={s.id || s.invoiceNo || idx}>
                                        <TableCell sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#096dd9' }}>
                                          {s.invoiceNo || s.saleNo || 'SLIP'}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '0.78rem' }}>{s.date || s.time || 'N/A'}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                          {s.items && s.items.length > 0
                                            ? s.items.map((i) => `${i.qty}x ${i.name}`).join(', ')
                                            : 'Factory parts'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.82rem', color: '#005F56' }}>
                                          Rs. {(parseFloat(s.totalAmount) || 0).toLocaleString()}
                                        </TableCell>
                                      </TableRow>
                                    ))}
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
              #printable-person-statement, #printable-person-statement * {
                visibility: visible !important;
              }
              #printable-person-statement {
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
          {printData && (
            <Box id="printable-person-statement" sx={{ bgcolor: '#fff', color: '#111827', p: 3, borderRadius: 1 }}>
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
                      Workshop Counter • Ph: 0300-XXXXXXX
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#096dd9' }}>
                      STAFF ISSUE LEDGER
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                      Date: {new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
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
                      {printData.personName}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      Department / Machine / Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.25 }}>
                      {printData.phoneOrDept}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Slips Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#005F56', mb: 1, textTransform: 'uppercase' }}>
                Issued Items Breakdown
              </Typography>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #005F56', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#005F56', color: '#fff' }}>
                    <th style={{ width: '6%', padding: '6px', textAlign: 'center', fontSize: '0.78rem' }}>Sr</th>
                    <th style={{ width: '18%', padding: '6px', textAlign: 'center', fontSize: '0.78rem' }}>Slip #</th>
                    <th style={{ width: '22%', padding: '6px', textAlign: 'left', fontSize: '0.78rem' }}>Date</th>
                    <th style={{ width: '38%', padding: '6px 8px', textAlign: 'left', fontSize: '0.78rem' }}>Items Issued</th>
                    <th style={{ width: '16%', padding: '6px 8px', textAlign: 'right', fontSize: '0.78rem' }}>Value (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.slips.map((s, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '6px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, color: '#096dd9' }}>
                        {s.invoiceNo || s.saleNo || 'SLIP'}
                      </td>
                      <td style={{ padding: '6px', fontSize: '0.78rem' }}>{s.date || s.time || 'N/A'}</td>
                      <td style={{ padding: '6px 8px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {s.items && s.items.length > 0 ? s.items.map((i) => `${i.qty}x ${i.name}`).join(', ') : 'Factory parts'}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.82rem', fontWeight: 800, color: '#005F56' }}>
                        Rs. {(parseFloat(s.totalAmount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f1f5f9', borderTop: '2px solid #005F56' }}>
                    <td colSpan={4} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: '0.92rem' }}>
                      TOTAL MATERIAL VALUE:
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#005F56' }}>
                      Rs. {printData.totalValue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>

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

      {/* Confirm Reset Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 500 } } }}>
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main' }}>
          ⚠️ Confirm Factory Reset Shop Data?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to wipe all Shop inventory items, issue history, and sales slips? This action will set all shop ledger metrics to 0 for a completely fresh start.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleResetShopData} color="error" variant="contained" disabled={resetting} sx={{ fontWeight: 800, borderRadius: 1.5, px: 3 }}>
            {resetting ? 'Resetting...' : 'Yes, Reset All Shop Data to 0'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
