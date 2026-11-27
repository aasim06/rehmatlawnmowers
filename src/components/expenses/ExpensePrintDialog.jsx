import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { UniversalPrintModal } from 'components/common';

const borderStyle = '1.5px solid #111827';
const cellBorder = '1px solid #111827';

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
  const isSingle = Boolean(selectedExpenseForPrint);
  const singleAmount = isSingle ? parseFloat(selectedExpenseForPrint.amount) || 0 : 0;
  const rowsToPrint = isSingle ? [selectedExpenseForPrint] : filteredExpenses;
  const isNegativeClosing = periodRemainingBalance < 0;

  const customTable = (
    <>
      {/* Cash Received Table (Only for full Closing Statement when cash entries exist) */}
      {!isSingle && periodFunds.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', color: '#047857', mb: 0.4 }}>
            Cash Received / Company Cash in Hand
          </Typography>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: borderStyle, fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: borderStyle, backgroundColor: '#f0fdf4' }}>
                <th style={{ width: '16%', borderRight: cellBorder, padding: '4px 6px', textAlign: 'left' }}>Date</th>
                <th style={{ width: '36%', borderRight: cellBorder, padding: '4px 6px', textAlign: 'left' }}>Received From</th>
                <th style={{ width: '24%', borderRight: cellBorder, padding: '4px 6px', textAlign: 'left' }}>Method / Notes</th>
                <th style={{ width: '24%', padding: '4px 6px', textAlign: 'right' }}>Cash In (PKR)</th>
              </tr>
            </thead>
            <tbody>
              {periodFunds.map((f, idx) => (
                <tr key={f.id || idx} style={{ borderBottom: '1px solid #d1d5db' }}>
                  <td style={{ borderRight: cellBorder, padding: '3px 6px', fontWeight: 600 }}>{f.fundDate}</td>
                  <td style={{ borderRight: cellBorder, padding: '3px 6px', fontWeight: 700 }}>{f.receivedFrom}</td>
                  <td style={{ borderRight: cellBorder, padding: '3px 6px' }}>
                    {f.paymentMethod}
                    {f.notes ? ` • ${f.notes}` : ''}
                  </td>
                  <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, color: '#047857' }}>
                    Rs. {(parseFloat(f.amount) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: borderStyle, backgroundColor: '#ecfdf5' }}>
                <td colSpan={3} style={{ borderRight: cellBorder, padding: '4px 6px', textAlign: 'right', fontWeight: 800 }}>
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
      <table style={{ width: '100%', borderCollapse: 'collapse', border: borderStyle, marginBottom: '10px' }}>
        <thead>
          <tr style={{ borderBottom: borderStyle }}>
            <th style={{ width: '7%', borderRight: borderStyle, padding: '4px', textAlign: 'center', fontSize: '0.80rem' }}>
              <strong>Sr</strong>
            </th>
            <th style={{ width: '13%', borderRight: borderStyle, padding: '4px', textAlign: 'center', fontSize: '0.80rem' }}>
              <strong>Date</strong>
            </th>
            <th style={{ width: '40%', borderRight: borderStyle, padding: '4px 8px', textAlign: 'left', fontSize: '0.80rem' }}>
              <strong>Expense Title / Description</strong>
            </th>
            <th style={{ width: '13%', borderRight: borderStyle, padding: '4px', textAlign: 'center', fontSize: '0.80rem' }}>
              <strong>Category</strong>
            </th>
            <th style={{ width: '13%', borderRight: borderStyle, padding: '4px 6px', textAlign: 'right', fontSize: '0.80rem' }}>
              <strong>Paid To</strong>
            </th>
            <th style={{ width: '14%', padding: '4px 6px', textAlign: 'right', fontSize: '0.80rem' }}>
              <strong>Amount (PKR)</strong>
            </th>
          </tr>
        </thead>
        <tbody>
          {rowsToPrint.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '14px', textAlign: 'center', color: '#6b7280', fontSize: '0.82rem' }}>
                No expense entries recorded for this period.
              </td>
            </tr>
          ) : (
            rowsToPrint.map((exp, idx) => (
              <tr key={exp.id || idx} style={{ borderBottom: '1px solid #d1d5db' }}>
                <td style={{ borderRight: borderStyle, padding: '3px 4px', textAlign: 'center', fontWeight: 800, fontSize: '0.78rem' }}>
                  {String(idx + 1).padStart(2, '0')}
                </td>
                <td style={{ borderRight: borderStyle, padding: '3px 4px', textAlign: 'center', fontWeight: 600, fontSize: '0.76rem' }}>
                  {exp.expenseDate}
                </td>
                <td style={{ borderRight: borderStyle, padding: '3px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.80rem', lineHeight: 1.25 }}>
                  {exp.title} {exp.notes ? `(${exp.notes})` : ''}
                </td>
                <td style={{ borderRight: borderStyle, padding: '3px 4px', textAlign: 'center', fontWeight: 700, fontSize: '0.76rem' }}>
                  {exp.category}
                </td>
                <td style={{ borderRight: borderStyle, padding: '3px 6px', textAlign: 'right', fontWeight: 700, fontSize: '0.78rem' }}>
                  {exp.paidTo || 'N/A'}
                </td>
                <td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: 800, fontSize: '0.80rem' }}>
                  {(parseFloat(exp.amount) || 0).toLocaleString()}
                </td>
              </tr>
            ))
          )}

          <tr style={{ borderTop: borderStyle }}>
            <td colSpan={5} style={{ borderRight: borderStyle, padding: '4px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.86rem' }}>
              Total Expenses:
            </td>
            <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 900, fontSize: '0.90rem', color: '#dc2626' }}>
              Rs. {(isSingle ? singleAmount : filteredTotal).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );

  const customSummary = isSingle ? undefined : (
    <Box
      sx={{
        py: 1,
        px: 1.5,
        borderRadius: 1,
        border: borderStyle,
        bgcolor: isNegativeClosing ? '#fef2f2' : '#f0fdf4',
        mb: 1.25
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
        <Typography variant="body2" fontWeight={700} color="#374151">
          Total Cash in Hand Received ({periodInfo?.shortLabel}):
        </Typography>
        <Typography variant="body2" fontWeight={800} color="#047857">
          Rs. {periodCashTotal.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="body2" fontWeight={700} color="#374151">
          Less: Total Expenses ({filteredExpenses.length} Entries):
        </Typography>
        <Typography variant="body2" fontWeight={800} color="#dc2626">
          - Rs. {periodExpensesTotal.toLocaleString()}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.6, borderTop: '1px dashed #6b7280' }}>
        <Typography variant="subtitle2" fontWeight={900} color="#111827">
          {isNegativeClosing ? 'SHORTFALL / EXTRA SPENT BALANCE:' : 'CLOSING / REMAINING CASH BALANCE:'}
        </Typography>
        <Typography variant="subtitle1" fontWeight={900} color={isNegativeClosing ? '#b91c1c' : '#065f46'} sx={{ fontSize: '1.05rem' }}>
          Rs. {periodRemainingBalance.toLocaleString()}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <UniversalPrintModal
      open={Boolean(open)}
      onClose={onClose}
      title={isSingle ? 'Expense Payment Voucher' : `Expense & Cash Closing Sheet (${periodInfo?.label || 'Daily'})`}
      typeTag={isSingle ? 'EXPENSE VOUCHER' : 'CASH & EXPENSE CLOSING'}
      partyLabel={isSingle ? 'Paid To / Recipient' : 'Account / Closing Sheet'}
      party={
        isSingle
          ? {
              name: selectedExpenseForPrint.paidTo || 'N/A',
              department: selectedExpenseForPrint.category,
              subText: selectedExpenseForPrint.notes || ''
            }
          : {
              name: 'Factory & Workshop Accounts',
              department: `${periodInfo?.label || 'Daily'} Closing Statement`,
              subText: `${filteredExpenses.length} Expense(s) • ${periodFunds.length} Cash Receipt(s)`
            }
      }
      invoiceLabel={isSingle ? 'Voucher Ref:' : 'Closing Period:'}
      invoiceNo={isSingle ? String(selectedExpenseForPrint.id).toUpperCase().slice(0, 12) : periodInfo?.rangeText || 'Daily'}
      date={isSingle ? selectedExpenseForPrint.expenseDate : periodInfo?.rangeText}
      status={isSingle ? selectedExpenseForPrint.paymentMethod || 'Cash' : isNegativeClosing ? 'Shortfall' : 'Balanced'}
      receiverSignatureLabel="Cashier / Manager Signature"
      customTable={customTable}
      customSummary={customSummary}
      summary={
        isSingle
          ? {
              totalAmount: singleAmount,
              paidAmount: singleAmount,
              balanceAmount: 0,
              notes: selectedExpenseForPrint.notes
            }
          : null
      }
    />
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
