import PropTypes from 'prop-types';
import { UniversalPrintModal } from 'components/common';
import {
  formatFullDate,
  formatInvoiceNo,
  normalizeMachineItems,
  resolveVoucherPrintBreakdown
} from 'utils/machineLedgerHelpers';

export { formatFullDate, formatInvoiceNo, normalizeMachineItems };

/**
 * Print modals for CustomerLedgerPage:
 * 1. Official Customer Khata Account Statement (Chronological Debit/Credit/Running Balance)
 * 2. Individual Machine Sale Invoice
 * 3. Individual Repair Job Card Receipt
 * 4. Individual Payment / Payout Voucher Receipt
 */
export default function CustomerLedgerPrintModals({
  mode = 'machine',
  printModalOpen,
  setPrintModalOpen,
  printCustomerData,
  startDate,
  endDate,
  printInvoiceModalOpen,
  setPrintInvoiceModalOpen,
  printInvoiceData,
  printRepairModalOpen,
  setPrintRepairModalOpen,
  printRepairData,
  printVoucherModalOpen,
  setPrintVoucherModalOpen,
  printVoucherData,
  statementTitle = 'Official Customer Account Statement',
  saleInvoiceTitle = 'Official Customer Machine Sale Invoice',
  purchaseInvoiceTitle = 'Official Store Vendor Receiving Bill'
}) {
  const isStoreMode = mode === 'store';
  const negativeStatementLabel = isStoreMode ? 'Vendor / Party Payable' : 'Advance Credit Remaining';
  const negativeStatusLabel = isStoreMode ? 'Payable Due' : 'Advance Credit';

  return (
    <>
      {/* 1. OFFICIAL CUSTOMER ACCOUNT STATEMENT */}
      {printCustomerData && (
        <UniversalPrintModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          title={statementTitle}
          typeTag="Account Statement"
          badgeColor={printCustomerData.balanceVal > 0 ? 'warning' : 'success'}
          partyLabel={isStoreMode ? 'Party Account Details' : 'Customer Account Details'}
          party={{
            name: printCustomerData.customerName,
            phone: printCustomerData.phone && printCustomerData.phone !== 'N/A' ? printCustomerData.phone : undefined,
            city: printCustomerData.city || (isStoreMode ? 'Factory Store' : 'Lahore'),
            subText:
              printCustomerData.netBalance > 0
                ? 'Net Balance Receivable'
                : printCustomerData.netBalance < 0
                  ? negativeStatementLabel
                  : 'Account Clear (Zero Balance)'
          }}
          invoiceLabel="Statement Period:"
          invoiceNo={startDate || endDate ? `${startDate || 'Start'} to ${endDate || 'Present'}` : 'All Time Ledger'}
          date={new Date().toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
          status={printCustomerData.netBalance > 0 ? 'Balance Due' : printCustomerData.netBalance < 0 ? negativeStatusLabel : 'Settled'}
          customTable={
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: '#f9fafb' }}>
                  <th style={{ borderRight: '1px solid #111827', padding: '5px 6px', textAlign: 'left', fontSize: '0.76rem' }}>Date</th>
                  <th style={{ borderRight: '1px solid #111827', padding: '5px 6px', textAlign: 'left', fontSize: '0.76rem' }}>Ref #</th>
                  <th style={{ borderRight: '1px solid #111827', padding: '5px 8px', textAlign: 'left', fontSize: '0.76rem' }}>
                    Particulars / Details
                  </th>
                  <th style={{ borderRight: '1px solid #111827', padding: '5px 6px', textAlign: 'right', fontSize: '0.76rem' }}>
                    Debit (Dr)
                  </th>
                  <th style={{ borderRight: '1px solid #111827', padding: '5px 6px', textAlign: 'right', fontSize: '0.76rem' }}>
                    Credit (Cr)
                  </th>
                  <th style={{ padding: '5px 6px', textAlign: 'right', fontSize: '0.76rem' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {(printCustomerData.ledgerEntries || []).map((entry, idx) => {
                  const entryItems =
                    Array.isArray(entry.items) && entry.items.length > 0
                      ? entry.items
                      : entry.recordType && entry.raw && !entry.isVoucher && !entry.isAutoAdvance
                        ? normalizeMachineItems({ ...entry.raw, recordType: entry.recordType })
                        : [];
                  const showItemized = entryItems.length > 0 && !entry.isVoucher && !entry.isAutoAdvance;
                  const orderDiscount = entry.recordType === 'Sale' ? Math.max(0, parseFloat(entry.raw?.discount) || 0) : 0;
                  const orderTax = entry.recordType === 'Sale' ? Math.max(0, parseFloat(entry.raw?.tax) || 0) : 0;

                  return (
                    <tr key={entry.id || idx} style={{ borderBottom: '1px solid #d1d5db' }}>
                      <td style={{ borderRight: '1px solid #111827', padding: '5px 6px', fontSize: '0.76rem', whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                        {entry.dateLabel}
                      </td>
                      <td style={{ borderRight: '1px solid #111827', padding: '5px 6px', fontSize: '0.76rem', fontWeight: 700, verticalAlign: 'top' }}>
                        {entry.voucherNo}
                      </td>
                      <td style={{ borderRight: '1px solid #111827', padding: '5px 8px', fontSize: '0.78rem', verticalAlign: 'top' }}>
                        {showItemized ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#111827', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                              <span>
                                {entry.recordType === 'Repair'
                                  ? `Repair Job${entry.raw?.machineName ? ` — ${entry.raw.machineName}` : ''}`
                                  : entry.recordType === 'Purchase'
                                    ? `Stock In Purchase (${entryItems.length} ${entryItems.length === 1 ? 'item' : 'items'})`
                                    : isStoreMode
                                      ? `Stock Out Issuance (${entryItems.length} ${entryItems.length === 1 ? 'item' : 'items'})`
                                      : `Sales Invoice (${entryItems.length} ${entryItems.length === 1 ? 'item' : 'items'})`}
                              </span>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: '2px' }}>
                              <thead>
                                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db' }}>
                                  <th style={{ padding: '2px 5px', textAlign: 'left', fontSize: '0.66rem', color: '#4b5563', width: '24px' }}>Sr</th>
                                  <th style={{ padding: '2px 6px', textAlign: 'left', fontSize: '0.66rem', color: '#4b5563' }}>Item</th>
                                  <th style={{ padding: '2px 5px', textAlign: 'center', fontSize: '0.66rem', color: '#4b5563', width: '34px' }}>Qty</th>
                                  <th style={{ padding: '2px 5px', textAlign: 'right', fontSize: '0.66rem', color: '#4b5563', width: '60px' }}>Rate</th>
                                  <th style={{ padding: '2px 5px', textAlign: 'right', fontSize: '0.66rem', color: '#4b5563', width: '68px' }}>Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entryItems.map((it, itemIdx) => (
                                  <tr key={itemIdx} style={{ borderBottom: itemIdx < entryItems.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                                    <td style={{ padding: '2px 5px', fontSize: '0.72rem', color: '#6b7280' }}>{itemIdx + 1}</td>
                                    <td style={{ padding: '2px 6px', fontSize: '0.73rem', fontWeight: 600, color: '#111827' }}>
                                      {it.name}
                                      {it.subtitle ? <span style={{ color: '#6b7280', fontWeight: 400 }}> ({it.subtitle})</span> : null}
                                    </td>
                                    <td style={{ padding: '2px 5px', textAlign: 'center', fontSize: '0.73rem', color: '#111827' }}>{it.qty}</td>
                                    <td style={{ padding: '2px 5px', textAlign: 'right', fontSize: '0.72rem', color: '#6b7280' }}>
                                      {(Number(it.rate) || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '2px 5px', textAlign: 'right', fontSize: '0.73rem', fontWeight: 600, color: '#111827' }}>
                                      {(Number(it.amount) || 0).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {(orderDiscount > 0 || orderTax > 0) && (
                              <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '2px' }}>
                                {orderDiscount > 0 ? `Discount: -Rs. ${orderDiscount.toLocaleString()}` : ''}
                                {orderDiscount > 0 && orderTax > 0 ? ' • ' : ''}
                                {orderTax > 0 ? `Tax: +Rs. ${orderTax.toLocaleString()}` : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div style={{ fontWeight: 600 }}>{entry.particulars}</div>
                            <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>{entry.paymentMethod}</div>
                          </>
                        )}
                      </td>
                      <td
                        style={{
                          borderRight: '1px solid #111827',
                          padding: '5px 6px',
                          textAlign: 'right',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          verticalAlign: 'top'
                        }}
                      >
                        {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                      </td>
                      <td
                        style={{
                          borderRight: '1px solid #111827',
                          padding: '5px 6px',
                          textAlign: 'right',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: '#15803d',
                          verticalAlign: 'top'
                        }}
                      >
                        {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                      </td>
                      <td style={{ padding: '5px 6px', textAlign: 'right', fontSize: '0.78rem', fontWeight: 800, verticalAlign: 'top' }}>
                        Rs. {Math.abs(entry.runningBalance || 0).toLocaleString()} {entry.runningBalance < 0 ? '(Cr)' : ''}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: '1.5px solid #111827', backgroundColor: '#f3f4f6' }}>
                  <td
                    colSpan={3}
                    style={{
                      borderRight: '1px solid #111827',
                      padding: '5px 8px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '0.82rem'
                    }}
                  >
                    TOTAL ACCOUNT TURNOVER:
                  </td>
                  <td
                    style={{
                      borderRight: '1px solid #111827',
                      padding: '5px 6px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '0.82rem'
                    }}
                  >
                    Rs. {(printCustomerData.totalDebit || 0).toLocaleString()}
                  </td>
                  <td
                    style={{
                      borderRight: '1px solid #111827',
                      padding: '5px 6px',
                      textAlign: 'right',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      color: '#15803d'
                    }}
                  >
                    Rs. {(printCustomerData.totalCredit || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '5px 6px', textAlign: 'right', fontWeight: 900, fontSize: '0.84rem' }}>
                    Rs. {Math.abs(printCustomerData.netBalance || 0).toLocaleString()} {printCustomerData.netBalance < 0 ? '(Cr)' : '(Due)'}
                  </td>
                </tr>
              </tbody>
            </table>
          }
          summary={{
            totalAmount: printCustomerData.totalDebit,
            paidAmount: printCustomerData.totalCredit,
            balanceAmount: Math.abs(printCustomerData.netBalance || 0),
            notes:
              printCustomerData.netBalance < 0
                ? isStoreMode
                  ? `Payable due to ${printCustomerData.customerName}: Rs. ${Math.abs(printCustomerData.netBalance).toLocaleString()}.`
                  : `Customer has advance credit of Rs. ${Math.abs(printCustomerData.netBalance).toLocaleString()} with Rehmat Lawn Mowers.`
                : undefined
          }}
          receiverSignatureLabel="Customer / Party Signature"
        />
      )}

      {/* 2. INDIVIDUAL SALE OR STOCK IN PURCHASE BILL */}
      {printInvoiceData && (
        <UniversalPrintModal
          open={printInvoiceModalOpen}
          onClose={() => setPrintInvoiceModalOpen(false)}
          title={printInvoiceData.recordType === 'Purchase' ? purchaseInvoiceTitle : saleInvoiceTitle}
          typeTag={printInvoiceData.recordType === 'Purchase' ? 'Stock In Bill' : 'Sales Invoice'}
          badgeColor={printInvoiceData.recordType === 'Purchase' ? 'info' : 'success'}
          partyLabel={printInvoiceData.recordType === 'Purchase' ? 'Vendor / Supplier Details' : 'Customer / Party Details'}
          party={{
            name: printInvoiceData.customerName,
            phone: printInvoiceData.customerPhone,
            city: printInvoiceData.cityAddress
          }}
          invoiceLabel="Invoice No:"
          invoiceNo={formatInvoiceNo(printInvoiceData)}
          date={formatFullDate(printInvoiceData.time, printInvoiceData.dateISO)}
          status={printInvoiceData.paymentStatus || 'Paid'}
          items={normalizeMachineItems(printInvoiceData).map((item) => ({
            name: item.name,
            subtitle: item.subtitle,
            qty: item.qty,
            rate: item.rate,
            total: item.amount
          }))}
          summary={{
            totalAmount: parseFloat(printInvoiceData.lineTotal || printInvoiceData.subTotal) || 0,
            paidAmount: parseFloat(printInvoiceData.paidAmount) || 0,
            balanceAmount: Math.max(
              0,
              (parseFloat(printInvoiceData.lineTotal || printInvoiceData.subTotal) || 0) - (parseFloat(printInvoiceData.paidAmount) || 0)
            )
          }}
          receiverSignatureLabel="Customer Signature"
        />
      )}

      {/* 3. INDIVIDUAL REPAIR JOB CARD RECEIPT */}
      {printRepairData && (
        <UniversalPrintModal
          open={printRepairModalOpen}
          onClose={() => setPrintRepairModalOpen(false)}
          title="Machine Repairing Job Card Receipt"
          typeTag="Repair Receipt"
          badgeColor="warning"
          partyLabel="Customer Details"
          party={{
            name: printRepairData.customerName,
            phone: printRepairData.customerPhone || 'N/A',
            city: printRepairData.cityAddress || 'Lahore',
            subText: `Under Repair: ${printRepairData.machineName || 'Lawn Mower Machine'}`
          }}
          invoiceLabel="Job Card No:"
          invoiceNo={formatInvoiceNo(printRepairData)}
          date={printRepairData.receivedDate || printRepairData.time}
          status={printRepairData.repairStatus || 'Received'}
          items={normalizeMachineItems({ ...printRepairData, recordType: 'Repair' }).map((item) => ({
            name: item.name,
            subtitle: item.subtitle,
            qty: item.qty,
            rate: item.rate,
            total: item.amount
          }))}
          summary={{
            totalAmount: parseFloat(printRepairData.totalCost || printRepairData.lineTotal || 0),
            paidAmount: parseFloat(printRepairData.paidAmount || 0),
            balanceAmount: parseFloat(printRepairData.balanceAmount || 0)
          }}
          receiverSignatureLabel="Customer Signature"
        />
      )}

      {/* 4. PAYMENT / PAYOUT VOUCHER RECEIPT */}
      {printVoucherData && (() => {
        const vBreakdown = resolveVoucherPrintBreakdown(printVoucherData);
        const vAmt = parseFloat(printVoucherData.amountPaid) || 0;

        return (
          <UniversalPrintModal
            open={printVoucherModalOpen}
            onClose={() => setPrintVoucherModalOpen(false)}
            title={
              printVoucherData.entryType === 'Payout'
                ? 'Official Cash Payment / Refund Voucher'
                : printVoucherData.entryType === 'Adjustment'
                  ? 'Official Discount / Settlement Voucher'
                  : 'Official Customer Payment Receipt'
            }
            typeTag={printVoucherData.entryType || 'Receipt'}
            badgeColor={printVoucherData.entryType === 'Payout' ? 'error' : 'success'}
            partyLabel={printVoucherData.entryType === 'Payout' ? 'Paid To' : 'Received From'}
            party={{
              name: printVoucherData.customerName,
              phone: printVoucherData.phone || undefined,
              city: printVoucherData.city || undefined
            }}
            invoiceLabel="Voucher No:"
            invoiceNo={formatInvoiceNo(printVoucherData)}
            date={formatFullDate(printVoucherData.time, printVoucherData.createdAt)}
            status={printVoucherData.paymentMethod || 'Cash'}
            customTable={
              vBreakdown.items.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #111827', marginBottom: '10px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1.5px solid #111827', backgroundColor: '#f8fafc' }}>
                      <th style={{ width: '8%', borderRight: '1.5px solid #111827', padding: '5px 4px', textAlign: 'center', fontSize: '0.80rem' }}>
                        <strong>Sr</strong>
                      </th>
                      <th style={{ width: '52%', borderRight: '1.5px solid #111827', padding: '5px 8px', textAlign: 'left', fontSize: '0.80rem' }}>
                        <strong>Item</strong>
                      </th>
                      <th style={{ width: '12%', borderRight: '1.5px solid #111827', padding: '5px 4px', textAlign: 'center', fontSize: '0.80rem' }}>
                        <strong>Qty</strong>
                      </th>
                      <th style={{ width: '14%', borderRight: '1.5px solid #111827', padding: '5px 8px', textAlign: 'right', fontSize: '0.80rem' }}>
                        <strong>Rate</strong>
                      </th>
                      <th style={{ width: '14%', padding: '5px 8px', textAlign: 'right', fontSize: '0.80rem' }}>
                        <strong>Amount</strong>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #111827', backgroundColor: '#f3f4f6' }}>
                      <td colSpan={4} style={{ borderRight: '1.5px solid #111827', padding: '5px 8px', textAlign: 'left', fontSize: '0.82rem' }}>
                        <strong style={{ color: '#111827' }}>{vBreakdown.typeLabel}</strong>
                        {vBreakdown.bannerMeta && (
                          <span style={{ color: '#4b5563', marginLeft: '10px', fontSize: '0.78rem' }}>{vBreakdown.bannerMeta}</span>
                        )}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, fontSize: '0.84rem', color: '#111827', whiteSpace: 'nowrap' }}>
                        Rs. {vAmt.toLocaleString()}
                      </td>
                    </tr>
                    {vBreakdown.items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: 'transparent' }}>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontWeight: 700, fontSize: '0.80rem', color: '#4b5563' }}>
                          {idx + 1}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', color: '#111827' }}>
                          {it.name}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '4px 4px', textAlign: 'center', fontWeight: 700, fontSize: '0.80rem' }}>
                          {it.qty || 1}
                        </td>
                        <td style={{ borderRight: '1.5px solid #111827', padding: '4px 8px', textAlign: 'right', fontSize: '0.80rem', color: '#6b7280' }}>
                          {it.rate ? it.rate.toLocaleString() : '—'}
                        </td>
                        <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 700, fontSize: '0.80rem', color: '#6b7280' }}>
                          {it.amount ? it.amount.toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null
            }
            items={
              vBreakdown.items.length === 0
                ? [
                    {
                      name: `${vBreakdown.typeLabel} (${printVoucherData.referenceLabel || 'General Account'})`,
                      subtitle: [printVoucherData.referenceNo ? `Ref: ${printVoucherData.referenceNo}` : '', vBreakdown.cleanNotes]
                        .filter(Boolean)
                        .join(' • '),
                      qty: 1,
                      rate: vAmt,
                      total: vAmt
                    }
                  ]
                : []
            }
            summary={{
              totalAmount: vAmt,
              paidAmount: vAmt,
              balanceAmount: printVoucherData.remainingAccountBalance ?? 0,
              notes: vBreakdown.cleanNotes || undefined
            }}
            receiverSignatureLabel="Party / Receiver Signature"
          />
        );
      })()}
    </>
  );
}

CustomerLedgerPrintModals.propTypes = {
  mode: PropTypes.oneOf(['machine', 'shop', 'store']),
  printModalOpen: PropTypes.bool,
  setPrintModalOpen: PropTypes.func,
  printCustomerData: PropTypes.object,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  printInvoiceModalOpen: PropTypes.bool,
  setPrintInvoiceModalOpen: PropTypes.func,
  printInvoiceData: PropTypes.object,
  printRepairModalOpen: PropTypes.bool,
  setPrintRepairModalOpen: PropTypes.func,
  printRepairData: PropTypes.object,
  printVoucherModalOpen: PropTypes.bool,
  setPrintVoucherModalOpen: PropTypes.func,
  printVoucherData: PropTypes.object,
  statementTitle: PropTypes.string,
  saleInvoiceTitle: PropTypes.string,
  purchaseInvoiceTitle: PropTypes.string
};
