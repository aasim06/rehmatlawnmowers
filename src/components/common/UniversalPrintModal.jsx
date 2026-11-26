import { useState } from 'react';
import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

// icons
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import FileDoneOutlined from '@ant-design/icons/FileDoneOutlined';

// project imports
import AppButton from './AppButton';
import CeoSignature from 'components/CeoSignature';
import { getSubSurfaceSx } from 'utils/themeSurface';

/**
 * Universal Master Print Component for Rehmat Lawn Mowers
 * Provides identical A4 portrait styling, metadata header, itemized table,
 * financial summary, and CEO / receiver signatures across the whole app.
 */
export default function UniversalPrintModal({
  open,
  onClose,
  title = 'Official Document Receipt',
  typeTag = 'Official Receipt',
  badgeColor = 'success',
  // Company Header
  companyName = 'REHMAT LAWN MOWERS',
  companyTagline = 'Factory Store & Workshop • Sales, Spares & Machine Services',
  companyAddress = 'Workshop Counter • Ph: 0315-4630026 / 0300-8438183',
  showCompanyHeader = true,
  // Party / Customer / Vendor
  partyLabel = 'Customer / Party Details',
  party = {},
  // Invoice / Voucher Details
  invoiceLabel = 'Invoice / PO No:',
  invoiceNo = '',
  date = '',
  status = '',
  extraMeta = [],
  // Items Table
  columns = null,
  items = [],
  customTable = null,
  customSummary = null,
  // Financial Summary
  summary = null,
  // Signatures
  showSignatures = true,
  receiverSignatureLabel = 'Customer / Receiver Signature',
  maxWidth = 'md'
}) {
  // Option to switch between "Plain A4 Paper" and "Pre-printed Letterhead Pad"
  const theme = useTheme();
  const brandPrimary = theme.palette.primary.main;
  const [onLetterheadPad, setOnLetterheadPad] = useState(false);

  const formattedDate =
    date ||
    new Date().toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

  // Calculate totals if summary is not explicitly provided
  const computedTotal = items.reduce((sum, it) => {
    const q = parseFloat(it.qty ?? it.qtyUsed ?? it.qnty ?? 1) || 1;
    const r = parseFloat(it.rate ?? it.unitPrice ?? 0) || 0;
    const line = parseFloat(it.total ?? it.lineTotal ?? it.totalAmount ?? q * r) || q * r;
    return sum + line;
  }, 0);

  const finalTotal = summary?.totalAmount ?? summary?.grandTotal ?? summary?.netTotal ?? computedTotal;
  const finalPaid = summary?.paidAmount !== undefined ? parseFloat(summary.paidAmount) : null;
  const finalBalance =
    summary?.balanceAmount !== undefined
      ? parseFloat(summary.balanceAmount)
      : finalPaid !== null
        ? Math.max(0, finalTotal - finalPaid)
        : null;

  return (
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm 6mm;
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
            .rehmat-universal-print-sheet, .rehmat-universal-print-sheet * {
              visibility: visible !important;
            }
            .rehmat-universal-print-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              box-sizing: border-box !important;
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

      {/* Screen Dialog Header (Hidden in Print) */}
      <DialogTitle
        className="no-print"
        component="div"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <FileDoneOutlined style={{ fontSize: '1.25rem', color: brandPrimary }} />
          <Typography variant="h5" fontWeight={800}>
            {title}
          </Typography>
          {typeTag && <Chip label={typeTag} color={badgeColor} size="small" sx={{ fontWeight: 700 }} />}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch size="small" checked={onLetterheadPad} onChange={(e) => setOnLetterheadPad(e.target.checked)} color="primary" />
            }
            label={
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                Print on Pad
              </Typography>
            }
            sx={{ m: 0 }}
          />
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseOutlined />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Printable Sheet Content */}
      <DialogContent dividers sx={getSubSurfaceSx(theme, { p: { xs: 1.5, sm: 2.5 }, borderRadius: 0, border: 0 })}>
        <Box
          className="rehmat-universal-print-sheet"
          sx={{
            bgcolor: '#ffffff',
            color: '#111827',
            p: { xs: 2, sm: 2.5 },
            borderRadius: 1,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            pt: onLetterheadPad ? '100px !important' : '16px'
          }}
        >
          {/* 1. TOP COMPANY BRANDING HEADER (Hidden if onLetterheadPad is true) */}
          {showCompanyHeader && !onLetterheadPad && (
            <Box
              sx={{
                borderBottom: `2.5px solid ${brandPrimary}`,
                pb: 1.5,
                mb: 1.5,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}
            >
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    color: brandPrimary,
                    letterSpacing: '-0.02em',
                    fontSize: { xs: '1.25rem', sm: '1.6rem' },
                    lineHeight: 1.15
                  }}
                >
                  {companyName}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block', mt: 0.25 }}>
                  {companyTagline}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                  {companyAddress}
                </Typography>
              </Box>

              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    color: brandPrimary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontSize: '0.95rem'
                  }}
                >
                  {typeTag}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.25 }}>
                  Date: {formattedDate}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 2. STRUCTURED PARTY & INVOICE METADATA BOX */}
          <div
            style={{
              border: '1.5px solid #111827',
              borderRadius: '4px',
              marginBottom: '10px',
              backgroundColor: '#ffffff',
              overflow: 'hidden'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #e5e7eb' }}>
              {/* Left Column: Party Details */}
              <div
                style={{
                  flex: '1.2',
                  minWidth: '220px',
                  padding: '6px 10px',
                  borderRight: '1px solid #e5e7eb'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}
                >
                  {partyLabel}
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#111827', marginBottom: '2px' }}>
                  {party?.name || 'Walk-in Customer'}
                </div>
                <div style={{ fontSize: '0.80rem', color: '#374151', lineHeight: '1.4' }}>
                  {party?.phone && (
                    <div>
                      <strong>Phone:</strong> {party.phone}
                    </div>
                  )}
                  {(party?.city || party?.address) && (
                    <div>
                      <strong>Location:</strong> {[party.city, party.address].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {party?.department && (
                    <div>
                      <strong>Dept / Machine:</strong> {party.department}
                    </div>
                  )}
                  {party?.subText && <div>{party.subText}</div>}
                </div>
              </div>

              {/* Right Column: Invoice / Voucher Metadata */}
              <div
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '6px 10px',
                  backgroundColor: 'rgba(249, 250, 251, 0.65)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.80rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 700 }}>{invoiceLabel}</span>
                  <span style={{ fontWeight: 800, color: '#096dd9', fontSize: '0.88rem' }}>{invoiceNo || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.80rem' }}>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>Date &amp; Time:</span>
                  <span style={{ fontWeight: 700, color: '#374151' }}>{formattedDate}</span>
                </div>

                {status && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '0.80rem' }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>Payment Status:</span>
                    <span
                      style={{
                        fontWeight: 800,
                        color:
                          status.toLowerCase() === 'paid' || status.toLowerCase() === 'received'
                            ? '#16a34a'
                            : status.toLowerCase() === 'partial'
                              ? '#d97706'
                              : '#dc2626'
                      }}
                    >
                      {status}
                    </span>
                  </div>
                )}

                {extraMeta.map((meta, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>{meta.label}:</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{meta.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. ITEM SPECIFICATION TABLE */}
          {customTable ? (
            customTable
          ) : (
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
                      padding: '5px 4px',
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
                      padding: '5px 8px',
                      textAlign: 'center',
                      fontSize: '0.82rem'
                    }}
                  >
                    <strong>Specification / Item Name</strong>
                  </th>
                  <th
                    style={{
                      width: '12%',
                      borderRight: '1.5px solid #111827',
                      padding: '5px 4px',
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
                      padding: '5px 8px',
                      textAlign: 'center',
                      fontSize: '0.82rem'
                    }}
                  >
                    <strong>Rate</strong>
                  </th>
                  <th style={{ width: '14%', padding: '5px 8px', textAlign: 'center', fontSize: '0.82rem' }}>
                    <strong>Total Amount</strong>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px 12px', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                      No line items recorded for this invoice.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const itName = it.name || it.itemName || it.machineName || it.model || 'Item';
                    const itSub = it.subtitle || it.serialNo || it.specification || it.faultDescription || it.rackLocation || '';
                    const itQty = parseFloat(it.qty ?? it.qtyUsed ?? it.qnty ?? 1) || 1;
                    const itRate = parseFloat(it.rate ?? it.unitPrice ?? 0) || 0;
                    const itTotal = parseFloat(it.total ?? it.lineTotal ?? it.totalAmount ?? itQty * itRate) || itQty * itRate;

                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #111827', backgroundColor: 'transparent' }}>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '4px 4px',
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
                            padding: '4px 8px',
                            textAlign: 'left',
                            fontWeight: 600,
                            fontSize: '0.82rem',
                            lineHeight: 1.25
                          }}
                        >
                          <div>{itName}</div>
                          {itSub && (
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                              {itSub.startsWith('SN:') || itSub.startsWith('S/N:') ? itSub : `Desc: ${itSub}`}
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '4px 4px',
                            textAlign: 'center',
                            fontWeight: 800,
                            fontSize: '0.82rem'
                          }}
                        >
                          {String(itQty).padStart(2, '0')}
                        </td>
                        <td
                          style={{
                            borderRight: '1.5px solid #111827',
                            padding: '4px 8px',
                            textAlign: 'right',
                            fontWeight: 700,
                            fontSize: '0.82rem'
                          }}
                        >
                          {itRate > 0 ? itRate.toLocaleString() : '-'}
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.82rem' }}>
                          {itTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Total Amount Bottom Row */}
                <tr style={{ backgroundColor: 'transparent', borderTop: '1.5px solid #111827' }}>
                  <td
                    colSpan={2}
                    style={{
                      borderRight: '1.5px solid #111827',
                      padding: '5px 8px',
                      textAlign: 'center',
                      fontWeight: 800,
                      fontSize: '0.88rem'
                    }}
                  >
                    Total amount
                  </td>
                  <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                  <td style={{ borderRight: '1.5px solid #111827', padding: '4px' }}></td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 900, fontSize: '0.92rem', color: '#111827' }}>
                    {finalTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* 4. FINANCIAL SUMMARY BOX */}
          {customSummary ? (
            customSummary
          ) : (
            <Box
              sx={{
                bgcolor: 'transparent',
                py: 0.8,
                px: 1.2,
                borderRadius: 1,
                border: `1.5px solid ${brandPrimary}`,
                mb: 1.2
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <Box>
                  {finalPaid !== null && (
                    <Typography variant="body2" fontWeight={700} color="textSecondary" display="block">
                      PAID AMOUNT: Rs. {finalPaid.toLocaleString()}
                    </Typography>
                  )}
                  {summary?.notes && (
                    <Typography variant="caption" color="textSecondary">
                      Notes: {summary.notes}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle1" fontWeight={800} color="success.dark" sx={{ lineHeight: 1.2 }}>
                    NET TOTAL: Rs. {finalTotal.toLocaleString()}
                  </Typography>
                  {finalBalance !== null && (
                    <Typography variant="caption" fontWeight={800} color={finalBalance > 0 ? 'error.main' : 'success.main'} display="block">
                      {finalBalance > 0 ? `REMAINING DUE: Rs. ${finalBalance.toLocaleString()}` : 'FULL PAID (NO DUES)'}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}

          {/* 5. SIGNATURES FOOTER */}
          {showSignatures && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                width: '100%',
                mt: 2.5,
                pt: 1.5
              }}
            >
              <Box>
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ borderTop: '1px dashed #9ca3af', pt: 0.75, pb: 0.25, width: 170, fontWeight: 700, color: '#475569' }}
                >
                  {receiverSignatureLabel}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ display: 'inline-block', textAlign: 'left' }}>
                  <CeoSignature />
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Screen Dialog Actions (Hidden in Print) */}
      <DialogActions className="no-print" sx={{ p: 2, px: 2.5, justifyContent: 'space-between' }}>
        <AppButton intent="cancel" onClick={onClose}>
          Close
        </AppButton>
        <AppButton intent="print" startIcon={<PrinterOutlined />} onClick={() => window.print()}>
          Print Invoice Receipt
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}

UniversalPrintModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  typeTag: PropTypes.string,
  badgeColor: PropTypes.string,
  companyName: PropTypes.string,
  companyTagline: PropTypes.string,
  companyAddress: PropTypes.string,
  showCompanyHeader: PropTypes.bool,
  partyLabel: PropTypes.string,
  party: PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string,
    city: PropTypes.string,
    address: PropTypes.string,
    department: PropTypes.string,
    subText: PropTypes.string
  }),
  invoiceLabel: PropTypes.string,
  invoiceNo: PropTypes.string,
  date: PropTypes.string,
  status: PropTypes.string,
  extraMeta: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string
    })
  ),
  items: PropTypes.arrayOf(PropTypes.object),
  summary: PropTypes.shape({
    totalAmount: PropTypes.number,
    paidAmount: PropTypes.number,
    balanceAmount: PropTypes.number,
    discountAmount: PropTypes.number,
    notes: PropTypes.string
  }),
  showSignatures: PropTypes.bool,
  receiverSignatureLabel: PropTypes.string,
  maxWidth: PropTypes.string
};
