import PropTypes from 'prop-types';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import CeoSignature from 'components/CeoSignature';

export default function ExpensePrintDialog({
  open,
  onClose,
  selectedExpenseForPrint,
  periodInfo,
  periodFunds = [],
  filteredExpenses = [],
  periodCashTotal = 0,
  periodExpensesTotal = 0,
  filteredTotal = 0,
  periodRemainingBalance = 0
}) {
  const handlePrint = () => {
    window.print();
  };

  const singleExpAmount = selectedExpenseForPrint ? parseFloat(selectedExpenseForPrint.amount) || 0 : 0;
  const isNegativeClosing = periodRemainingBalance < 0;

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '@media print': {
          '& .MuiDialog-container': {
            display: 'block !important',
            padding: '0 !important',
            margin: '0 !important'
          },
          '& .MuiPaper-root': {
            boxShadow: 'none !important',
            border: 'none !important',
            maxWidth: '100% !important',
            margin: '0 !important',
            padding: '0 !important',
            borderRadius: '0 !important',
            overflow: 'visible !important'
          }
        }
      }}
    >
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 5mm 6mm;
            }
            body * {
              visibility: hidden !important;
            }
            #printable-expense-sheet, #printable-expense-sheet * {
              visibility: visible !important;
            }
            #printable-expense-sheet {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 16px 8px 8px 8px !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            .no-print, .MuiDialogTitle-root, .MuiDialogActions-root, .MuiBackdrop-root {
              display: none !important;
              visibility: hidden !important;
            }
            .MuiDialogContent-root {
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              overflow: visible !important;
            }
          }
        `}
      </style>

      <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight={700}>
          {selectedExpenseForPrint ? 'Expense Payment Voucher' : `Expense & Cash Closing Sheet (${periodInfo?.label || 'Today'})`}
        </Typography>
        <Button variant="contained" color="primary" startIcon={<PrinterOutlined />} onClick={handlePrint} className="no-print">
          Print Now
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 1, sm: 1.5 }, bgcolor: '#ffffff' }}>
        <Box
          id="printable-expense-sheet"
          sx={{
            position: 'relative',
            overflow: 'hidden',
            pt: { xs: 2, sm: 3 },
            px: { xs: 1, sm: 1.5 },
            pb: { xs: 1, sm: 1.5 },
            bgcolor: '#ffffff',
            color: '#111827',
            borderRadius: 1
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            {/* Company Title Strip */}
            <Box sx={{ textAlign: 'center', mb: 1.25, pb: 0.75, borderBottom: '2px solid #111827' }}>
              <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.6px', color: '#111827' }}>
                REHMAT LAWN MOWERS
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#4b5563' }}>
                Factory Store &amp; Workshop • Ph: 0315-4630026
              </Typography>
            </Box>

            {/* Structured Metadata Card */}
            <div
              style={{
                border: '1.5px solid #111827',
                borderRadius: '4px',
                marginBottom: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex' }}>
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
                    Statement Type
                  </div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 800, color: '#111827' }}>
                    {selectedExpenseForPrint ? 'Expense Payment Voucher' : `Cash & Expense Closing (${periodInfo?.label || 'Daily'})`}
                  </div>
                </div>

                <div style={{ flex: '1', padding: '6px 10px', backgroundColor: 'rgba(249, 250, 251, 0.45)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.80rem' }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>Period / Date:</span>
                    <span style={{ fontWeight: 700, color: '#374151' }}>
                      {selectedExpenseForPrint ? selectedExpenseForPrint.expenseDate : periodInfo?.rangeText}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.80rem' }}>
                    <span style={{ color: '#6b7280', fontWeight: 600 }}>Entries Count:</span>
                    <span style={{ fontWeight: 800, color: '#16a34a' }}>
                      {selectedExpenseForPrint ? '01 Voucher' : `${filteredExpenses.length} Expenses • ${periodFunds.length} Cash In`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash in Hand Receipts Breakdown (for Closing Sheet when Funds Exist) */}
            {!selectedExpenseForPrint && periodFunds.length > 0 && (
              <Box sx={{ mb: 1.25 }}>
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#047857', mb: 0.4 }}>
                  Cash Received / Company Cash in Hand
                </Typography>
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: '#f0fdf4' }}>
                      <th style={{ width: '16%', borderRight: '1px solid #111827', padding: '3px 6px', textAlign: 'left' }}>Date</th>
                      <th style={{ width: '36%', borderRight: '1px solid #111827', padding: '3px 6px', textAlign: 'left' }}>Received From</th>
                      <th style={{ width: '24%', borderRight: '1px solid #111827', padding: '3px 6px', textAlign: 'left' }}>Method / Notes</th>
                      <th style={{ width: '24%', padding: '3px 6px', textAlign: 'right' }}>Cash Received (PKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodFunds.map((f, i) => (
                      <tr key={f.id || i} style={{ borderBottom: '1px solid #d1d5db' }}>
                        <td style={{ borderRight: '1px solid #111827', padding: '3px 6px', fontWeight: 600 }}>{f.fundDate}</td>
                        <td style={{ borderRight: '1px solid #111827', padding: '3px 6px', fontWeight: 700 }}>{f.receivedFrom}</td>
                        <td style={{ borderRight: '1px solid #111827', padding: '3px 6px' }}>
                          {f.paymentMethod} {f.notes ? `• ${f.notes}` : ''}
                        </td>
                        <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                          Rs. {(parseFloat(f.amount) || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '1.5px solid #111827', backgroundColor: '#ecfdf5' }}>
                      <td colSpan={3} style={{ borderRight: '1px solid #111827', padding: '4px 6px', textAlign: 'right', fontWeight: 800 }}>
                        Total Cash in Hand ({periodInfo?.shortLabel || 'Period'}):
                      </td>
                      <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 900, color: '#065f46' }}>
                        Rs. {periodCashTotal.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Box>
            )}

            {/* Expenses Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '10px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #111827' }}>
                  <th style={{ width: '7%', borderRight: '1.5px solid #111827', padding: '4px', textAlign: 'center', fontSize: '0.80rem' }}>
                    <strong>Sr</strong>
                  </th>
                  <th style={{ width: '13%', borderRight: '1.5px solid #111827', padding: '4px', textAlign: 'center', fontSize: '0.80rem' }}>
                    <strong>Date</strong>
                  </th>
                  <th style={{ width: '40%', borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'left', fontSize: '0.80rem' }}>
                    <strong>Expense Title / Description</strong>
                  </th>
                  <th style={{ width: '13%', borderRight: '1.5px solid #111827', padding: '4px', textAlign: 'center', fontSize: '0.80rem' }}>
                    <strong>Category</strong>
                  </th>
                  <th style={{ width: '13%', borderRight: '1.5px solid #111827', padding: '4px 6px', textAlign: 'right', fontSize: '0.80rem' }}>
                    <strong>Paid To</strong>
                  </th>
                  <th style={{ width: '14%', padding: '4px 6px', textAlign: 'right', fontSize: '0.80rem' }}>
                    <strong>Amount (PKR)</strong>
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedExpenseForPrint ? (
                  <tr style={{ borderBottom: '1px solid #111827' }}>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.80rem' }}>
                      01
                    </td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem' }}>
                      {selectedExpenseForPrint.expenseDate}
                    </td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.80rem' }}>
                      {selectedExpenseForPrint.title} {selectedExpenseForPrint.notes ? `(${selectedExpenseForPrint.notes})` : ''}
                    </td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 700, fontSize: '0.78rem' }}>
                      {selectedExpenseForPrint.category}
                    </td>
                    <td style={{ borderRight: '1.5px solid #111827', padding: '3px 6px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem' }}>
                      {selectedExpenseForPrint.paidTo || 'N/A'}
                    </td>
                    <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, fontSize: '0.80rem' }}>
                      {singleExpAmount.toLocaleString()}
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '0.82rem' }}>
                      No expense entries recorded for this period.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp, idx) => (
                    <tr key={exp.id || idx} style={{ borderBottom: '1px solid #d1d5db' }}>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.78rem' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.76rem' }}>
                        {exp.expenseDate}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.80rem', lineHeight: 1.25 }}>
                        {exp.title} {exp.notes ? `(${exp.notes})` : ''}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 4px', textAlign: 'center', fontWeight: 700, fontSize: '0.76rem' }}>
                        {exp.category}
                      </td>
                      <td style={{ borderRight: '1.5px solid #111827', padding: '3px 6px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem' }}>
                        {exp.paidTo || 'N/A'}
                      </td>
                      <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, fontSize: '0.80rem' }}>
                        {(parseFloat(exp.amount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}

                <tr style={{ borderTop: '1.5px solid #111827' }}>
                  <td colSpan={5} style={{ borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.86rem' }}>
                    Total Expenses:
                  </td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 900, fontSize: '0.90rem', color: '#dc2626' }}>
                    Rs. {(selectedExpenseForPrint ? singleExpAmount : filteredTotal).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Day-End / Period Closing Financial Summary Box */}
            {selectedExpenseForPrint ? (
              <Box sx={{ py: 0.9, px: 1.4, borderRadius: 1, border: '1.5px solid #86efac', mb: 1.25 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={700} color="text.secondary">
                    PAID VIA: {selectedExpenseForPrint.paymentMethod || 'Cash'}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="error.main">
                    VOUCHER AMOUNT: Rs. {singleExpAmount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  py: 1,
                  px: 1.5,
                  borderRadius: 1,
                  border: '1.5px solid #111827',
                  bgcolor: isNegativeClosing ? '#fef2f2' : '#f0fdf4',
                  mb: 1.25
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', mb: 0.4 }}>
                  <Typography variant="body2" fontWeight={700} color="#374151">
                    Total Cash in Hand Received ({periodInfo?.shortLabel}):
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="#047857">
                    Rs. {periodCashTotal.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={700} color="#374151">
                    Less: Total Expenses ({filteredExpenses.length} Entries):
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="#dc2626">
                    - Rs. {periodExpensesTotal.toLocaleString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    pt: 0.6,
                    borderTop: '1px dashed #6b7280'
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={900} color="#111827">
                    {isNegativeClosing ? 'SHORTFALL / EXTRA SPENT BALANCE:' : 'CLOSING / REMAINING CASH BALANCE:'}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    fontWeight={900}
                    color={isNegativeClosing ? '#b91c1c' : '#065f46'}
                    sx={{ fontSize: '1.05rem' }}
                  >
                    Rs. {periodRemainingBalance.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Signatures Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', mt: 1.5, pt: 1 }}>
              <Box>
                <Typography variant="caption" display="block" sx={{ borderTop: '1px dashed #9ca3af', pt: 0.5, pb: 0.25, width: 175 }}>
                  Cashier / Manager Signature
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
      </DialogContent>

      <DialogActions className="no-print" sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose} color="secondary" variant="outlined" className="no-print">
          Close
        </Button>
        <Button variant="contained" color="primary" startIcon={<PrinterOutlined />} onClick={handlePrint} className="no-print" sx={{ fontWeight: 700 }}>
          Print Statement
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ExpensePrintDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedExpenseForPrint: PropTypes.object,
  periodInfo: PropTypes.object,
  periodFunds: PropTypes.array,
  filteredExpenses: PropTypes.array,
  periodCashTotal: PropTypes.number,
  periodExpensesTotal: PropTypes.number,
  filteredTotal: PropTypes.number,
  periodRemainingBalance: PropTypes.number
};
