import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Autocomplete, InputAdornment, MenuItem, Stack, Typography } from '@mui/material';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';
import { AppTextField, FormDialog } from 'components/common';
import { getLocalDateISO } from 'context/modules/useExpensesModule';

const FUND_SOURCES = ['Owner / Head Office', 'Shop Counter Cash', 'Factory Cash', 'Online Settlement', 'Bank Withdrawal'];
const PAYMENT_METHODS = ['Cash', 'Online / Bank Transfer', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Cheque'];

export default function CashInHandDialog({ open, onClose, onSave, editingFund = null }) {
  const [entryType, setEntryType] = useState('received');
  const [amount, setAmount] = useState('');
  const [fundDate, setFundDate] = useState(getLocalDateISO());
  const [receivedFrom, setReceivedFrom] = useState('Owner / Head Office');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingFund) {
      setEntryType(editingFund.entryType === 'returned' ? 'returned' : 'received');
      setAmount(String(editingFund.amount || ''));
      setFundDate(editingFund.fundDate || getLocalDateISO());
      setReceivedFrom(editingFund.receivedFrom || 'Owner / Head Office');
      setPaymentMethod(editingFund.paymentMethod || 'Cash');
      setNotes(editingFund.notes || '');
    } else {
      setEntryType('received');
      setAmount('');
      setFundDate(getLocalDateISO());
      setReceivedFrom('Owner / Head Office');
      setPaymentMethod('Cash');
      setNotes('');
    }
    setError('');
  }, [open, editingFund]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          entryType,
          amount: numAmount,
          fundDate: fundDate || getLocalDateISO(),
          receivedFrom: (
            receivedFrom || (entryType === 'returned' ? 'Returned to Owner' : 'Owner / Head Office')
          ).trim(),
          paymentMethod,
          notes: notes.trim()
        },
        editingFund?.id || null
      );
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormDialog
      open={Boolean(open)}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={saving}
      maxWidth="xs"
      title={
        <Stack direction="row" spacing={1} alignItems="center">
          <WalletOutlined style={{ fontSize: 18 }} />
          <span>{editingFund ? 'Edit Cash Entry' : 'Add Cash in Hand / Handover'}</span>
        </Stack>
      }
      subtitle="Log cash received from boss/online or cash returned to owner at settlement."
      saveText={editingFund ? 'Save Changes' : entryType === 'returned' ? 'Record Cash Returned' : 'Add Cash in Hand'}
      saveButtonProps={{ startIcon: <PlusOutlined /> }}
    >
      <Stack spacing={2}>
        <AppTextField
          select
          label="Entry Type"
          value={entryType}
          onChange={(e) => {
            const next = e.target.value;
            setEntryType(next);
            if (!editingFund) {
              setReceivedFrom(next === 'returned' ? 'Returned to Owner / Boss' : 'Owner / Head Office');
            }
          }}
        >
          <MenuItem value="received">Cash Received (+ Add to Cash in Hand)</MenuItem>
          <MenuItem value="returned">Cash Returned to Owner (- Handover / Settlement)</MenuItem>
        </AppTextField>

        <AppTextField
          autoFocus
          required
          type="number"
          label="Amount (PKR) *"
          placeholder="e.g. 11000"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (error) setError('');
          }}
          error={Boolean(error)}
          helperText={error}
          InputProps={{
            startAdornment: <InputAdornment position="start">PKR</InputAdornment>
          }}
        />

        <Autocomplete
          freeSolo
          options={FUND_SOURCES}
          value={receivedFrom}
          onChange={(_, val) => setReceivedFrom(typeof val === 'string' ? val : val || '')}
          onInputChange={(_, val) => setReceivedFrom(val)}
          renderInput={(params) => (
            <AppTextField
              {...params}
              label={entryType === 'returned' ? 'Handed Over To' : 'Received From / Source'}
              placeholder="Owner / Head Office"
            />
          )}
        />

        <Stack direction="row" spacing={1.5}>
          <AppTextField
            type="date"
            label="Date"
            value={fundDate}
            onChange={(e) => setFundDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <AppTextField select label="Method" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((pm) => (
              <MenuItem key={pm} value={pm}>
                {pm}
              </MenuItem>
            ))}
          </AppTextField>
        </Stack>

        <AppTextField
          label="Notes / Reference (Optional)"
          placeholder="e.g. Morning cash, Evening online transfer"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Typography variant="caption" color="text.secondary">
          Remaining cash balance rolls forward automatically into the next day&rsquo;s Opening Balance and syncs live to Firebase Cloud.
        </Typography>
      </Stack>
    </FormDialog>
  );
}

CashInHandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editingFund: PropTypes.object
};
