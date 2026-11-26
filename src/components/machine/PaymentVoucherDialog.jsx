import { useState, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Autocomplete,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import { CloseOutlined, DollarOutlined, PrinterOutlined } from '@ant-design/icons';

import { AppButton } from 'components/common';
import { getSubSurfaceSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';
import { formatInvoiceNo } from 'utils/machineLedgerHelpers';

const findLedgerByCustomerName = (customerLedgers, name) => {
  const key = (name || '').trim().toLowerCase();
  if (!key) return null;
  return (customerLedgers || []).find((c) => (c.customerName || '').trim().toLowerCase() === key) || null;
};

const resolveCustomerBillSelection = (nextName, prevForm, customerLedgers) => {
  const nextLedger = findLedgerByCustomerName(customerLedgers, nextName);
  const isPayableVendor = nextLedger && nextLedger.netBalance < 0;
  const resolvedEntryType = prevForm.entryType || (isPayableVendor ? 'Payout' : 'Receipt');

  const firstOpenBill =
    resolvedEntryType === 'Payout'
      ? (nextLedger?.invoices || []).find((inv) => inv.recordType === 'Purchase' && inv.balanceAmount > 0)
      : (nextLedger?.invoices || []).find((inv) => inv.recordType !== 'Purchase' && inv.balanceAmount > 0);

  return {
    ...prevForm,
    customerName: nextName,
    refSelection: firstOpenBill ? `${firstOpenBill.recordType}:${firstOpenBill.id}` : 'ACCOUNT',
    amountPaid: firstOpenBill
      ? String(firstOpenBill.balanceAmount)
      : nextLedger && nextLedger.balanceVal > 0 && resolvedEntryType !== 'Payout'
        ? String(nextLedger.balanceVal)
        : nextLedger && nextLedger.netBalance < 0 && resolvedEntryType === 'Payout'
          ? String(Math.abs(nextLedger.netBalance))
          : prevForm.amountPaid
  };
};

const createInitialState = (initialData = {}, customerLedgers = []) => {
  const base = {
    customerName: initialData.customerName || '',
    entryType: initialData.entryType || 'Receipt',
    refSelection: initialData.refSelection || 'ACCOUNT',
    amountPaid: initialData.amountPaid !== undefined ? String(initialData.amountPaid) : '',
    paymentMethod: initialData.paymentMethod || 'Cash',
    referenceNo: initialData.referenceNo || '',
    notes: initialData.notes || ''
  };

  if (base.customerName && base.refSelection === 'ACCOUNT') {
    const ledger = findLedgerByCustomerName(customerLedgers, base.customerName);
    const firstOpenBill =
      base.entryType === 'Payout'
        ? (ledger?.invoices || []).find((inv) => inv.recordType === 'Purchase' && inv.balanceAmount > 0)
        : (ledger?.invoices || []).find((inv) => inv.recordType !== 'Purchase' && inv.balanceAmount > 0);
    if (firstOpenBill) {
      base.refSelection = `${firstOpenBill.recordType}:${firstOpenBill.id}`;
      if (!base.amountPaid) {
        base.amountPaid = String(firstOpenBill.balanceAmount);
      }
    } else if (!base.amountPaid && base.entryType === 'Payout' && ledger && ledger.netBalance < 0) {
      base.amountPaid = String(Math.abs(ledger.netBalance));
    }
  }

  return base;
};

/**
 * Reusable Payment Receipt / Cash Payout / Settlement Dialog shared between
 * Machine Payments and Machine Customer Ledgers.
 */
export default function PaymentVoucherDialog({
  open,
  onClose,
  initialData = null,
  customerDirectory = [],
  customerLedgers = [],
  onSaveVoucher
}) {
  const theme = useTheme();
  const ledgersRef = useRef(customerLedgers);
  ledgersRef.current = customerLedgers;

  const [form, setForm] = useState(() => createInitialState(initialData || {}, customerLedgers));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(createInitialState(initialData || {}, ledgersRef.current));
      setFormError('');
      setSaving(false);
    }
  }, [open, initialData]);

  const customerOptions = useMemo(() => {
    const seen = new Set();
    const list = [];
    const pushName = (raw) => {
      const clean = (raw || '').trim();
      if (!clean) return;
      const key = clean.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push(clean);
    };
    (customerDirectory || []).forEach((c) => pushName(typeof c === 'string' ? c : c?.name));
    (customerLedgers || []).forEach((c) => pushName(c?.customerName));
    return list.sort((a, b) => a.localeCompare(b));
  }, [customerDirectory, customerLedgers]);

  const selectedLedger = useMemo(
    () => findLedgerByCustomerName(customerLedgers, form.customerName),
    [customerLedgers, form.customerName]
  );

  const safeRefSelection = useMemo(() => {
    if (!form.refSelection || form.refSelection === 'ACCOUNT') return 'ACCOUNT';
    const exists = (selectedLedger?.invoices || []).some((inv) => `${inv.recordType}:${inv.id}` === form.refSelection);
    return exists ? form.refSelection : 'ACCOUNT';
  }, [form.refSelection, selectedLedger]);

  const primaryTone = getToneColors(theme, 'primary');
  const errorTone = getToneColors(theme, 'error');
  const successTone = getToneColors(theme, 'success');

  const handleSubmit = async (shouldPrint = false) => {
    if (saving) return;
    const custName = (form.customerName || '').trim();
    const amountNum = parseFloat(form.amountPaid);

    if (!custName) {
      setFormError('Please select or type a Customer / Party Name.');
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid Amount (PKR) greater than 0.');
      return;
    }

    setFormError('');
    setSaving(true);
    try {
      let referenceType = 'Account';
      let invoiceId = '';
      let repairId = '';
      let referenceLabel = 'General Account';

      if (safeRefSelection && safeRefSelection !== 'ACCOUNT') {
        const [kind, ...rest] = safeRefSelection.split(':');
        const targetId = rest.join(':');
        const matchedInv = (selectedLedger?.invoices || []).find((inv) => String(inv.id) === String(targetId));
        if (kind === 'Repair') {
          referenceType = 'Repair';
          repairId = targetId;
          referenceLabel = matchedInv ? formatInvoiceNo(matchedInv) : 'Repair Job Card';
        } else if (kind === 'Purchase') {
          referenceType = 'Purchase';
          invoiceId = targetId;
          referenceLabel = matchedInv ? formatInvoiceNo(matchedInv) : 'Purchase Bill';
        } else {
          referenceType = 'Sale';
          invoiceId = targetId;
          referenceLabel = matchedInv ? formatInvoiceNo(matchedInv) : 'Invoice';
        }
      }

      const prevSignedBal = selectedLedger?.netBalance || 0;
      const nextSignedBal =
        form.entryType === 'Payout' ? prevSignedBal + amountNum : prevSignedBal - amountNum;
      const remainingAccountBalance = Math.abs(nextSignedBal);

      await onSaveVoucher({
        customerName: custName,
        entryType: form.entryType,
        referenceType,
        invoiceId,
        repairId,
        referenceLabel,
        amountPaid: amountNum,
        paymentMethod: form.entryType === 'Adjustment' ? 'Discount / Waiver' : form.paymentMethod,
        referenceNo: form.referenceNo,
        notes: form.notes,
        shouldPrint,
        customerLedger: selectedLedger,
        remainingAccountBalance
      });
    } catch (err) {
      console.error('PaymentVoucherDialog submit error:', err);
      setFormError(err?.message || 'Unable to save payment voucher. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth="sm" fullWidth>
      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(false);
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DollarOutlined style={{ color: primaryTone.main }} /> Record Payment / Payout
          </Box>
          <IconButton size="small" onClick={onClose}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && (
              <Alert severity="error" onClose={() => setFormError('')} sx={{ fontWeight: 600 }}>
                {formError}
              </Alert>
            )}

            <Autocomplete
              freeSolo
              autoSelect
              size="small"
              options={customerOptions}
              value={form.customerName || null}
              inputValue={form.customerName}
              onChange={(e, val) => {
                setFormError('');
                setForm((prev) => resolveCustomerBillSelection(val || '', prev, customerLedgers));
              }}
              onInputChange={(e, val, reason) => {
                if (reason === 'reset') return;
                setFormError('');
                if (reason === 'clear') {
                  setForm((prev) => ({ ...prev, customerName: '', refSelection: 'ACCOUNT' }));
                  return;
                }
                const nextVal = val || '';
                const matched = findLedgerByCustomerName(customerLedgers, nextVal);
                setForm((prev) =>
                  matched ? resolveCustomerBillSelection(matched.customerName, prev, customerLedgers) : { ...prev, customerName: nextVal, refSelection: 'ACCOUNT' }
                );
              }}
              renderInput={(params) => <TextField {...params} label="Customer / Party Name" required placeholder="Select or type customer name..." />}
            />

            {selectedLedger && (
              <Box
                sx={getSubSurfaceSx(theme, {
                  p: 1.75,
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2
                })}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Current Balance ({selectedLedger.customerName})
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    Billed: {formatPKR(selectedLedger.totalDebit)} • Paid: {formatPKR(selectedLedger.totalCredit)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {selectedLedger.netBalance < 0 ? 'Payable / Advance' : 'Receivable Due'}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={800}
                    sx={{
                      fontVariantNumeric: 'tabular-nums',
                      color: selectedLedger.balanceVal > 0 ? errorTone.main : successTone.main
                    }}
                  >
                    {formatPKR(Math.abs(selectedLedger.netBalance))}
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                select
                size="small"
                label="Transaction Type *"
                value={form.entryType}
                onChange={(e) => setForm({ ...form, entryType: e.target.value })}
              >
                <MenuItem value="Receipt">Payment Received (Cash In)</MenuItem>
                <MenuItem value="Payout">Cash Paid / Refund (Cash Out)</MenuItem>
                <MenuItem value="Adjustment">Discount / Settlement Adjustment</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="Apply To Bill / Job (Optional)"
                value={safeRefSelection}
                onChange={(e) => {
                  const nextSel = e.target.value;
                  let suggestedAmt = form.amountPaid;
                  if (nextSel !== 'ACCOUNT' && selectedLedger) {
                    const [, ...rest] = nextSel.split(':');
                    const id = rest.join(':');
                    const inv = selectedLedger.invoices.find((i) => String(i.id) === String(id));
                    if (inv && inv.balanceAmount > 0) suggestedAmt = String(inv.balanceAmount);
                  }
                  setForm({ ...form, refSelection: nextSel, amountPaid: suggestedAmt });
                }}
              >
                <MenuItem value="ACCOUNT">General Account (On Account)</MenuItem>
                {(selectedLedger?.invoices || []).map((inv) => (
                  <MenuItem key={`${inv.recordType}-${inv.id}`} value={`${inv.recordType}:${inv.id}`}>
                    {formatInvoiceNo(inv)} — {inv.machineName || 'Machine'} (Due: {formatPKR(inv.balanceAmount)})
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                size="small"
                type="number"
                required
                label="Amount (PKR)"
                inputProps={{ min: 0.01, step: 'any' }}
                value={form.amountPaid}
                onChange={(e) => {
                  setFormError('');
                  setForm({ ...form, amountPaid: e.target.value });
                }}
              />

              <TextField
                select
                size="small"
                label="Payment Method"
                disabled={form.entryType === 'Adjustment'}
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer / Online</MenuItem>
                <MenuItem value="Easypaisa / JazzCash">Easypaisa / JazzCash</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                size="small"
                label="Reference / Cheque / Slip #"
                placeholder="Optional reference..."
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
              />
              <TextField
                size="small"
                label="Remarks / Notes"
                placeholder="e.g. Partial payment, advance refund..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: getSubSurfaceSx(theme).bgcolor }}>
          <AppButton intent="cancel" onClick={onClose} disabled={saving}>
            Cancel
          </AppButton>
          <AppButton
            type="button"
            intent="secondary"
            startIcon={<PrinterOutlined />}
            onClick={() => handleSubmit(true)}
            disabled={saving}
          >
            Save &amp; Print Receipt
          </AppButton>
          <AppButton type="submit" intent="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Confirm Entry'}
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

PaymentVoucherDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  customerDirectory: PropTypes.array,
  customerLedgers: PropTypes.array,
  onSaveVoucher: PropTypes.func.isRequired
};
