import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Autocomplete, InputAdornment, MenuItem, Stack, Typography } from '@mui/material';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';
import { AppTextField, FormDialog } from 'components/common';
import { getLocalDateISO } from 'context/modules/useExpensesModule';

const FUND_SOURCES = ['Owner / Head Office', 'Shop Counter Cash', 'Factory Cash', 'Bank Withdrawal', 'Opening Closing Carryover'];
const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'JazzCash', 'EasyPaisa', 'Cheque'];

export default function CashInHandDialog({ open, onClose, onSave, editingFund = null }) {
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
      setAmount(String(editingFund.amount || ''));
      setFundDate(editingFund.fundDate || getLocalDateISO());
      setReceivedFrom(editingFund.receivedFrom || 'Owner / Head Office');
      setPaymentMethod(editingFund.paymentMethod || 'Cash');
      setNotes(editingFund.notes || '');
    } else {
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
      setError('Please enter a valid cash amount greater than 0');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          amount: numAmount,
          fundDate: fundDate || getLocalDateISO(),
          receivedFrom: (receivedFrom || 'Owner / Head Office').trim(),
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
          <span>{editingFund ? 'Edit Cash in Hand Entry' : 'Add Cash in Hand'}</span>
        </Stack>
      }
      subtitle="Enter company cash received. Expenses deduct automatically from this balance."
      saveText={editingFund ? 'Save Changes' : 'Add Cash in Hand'}
      saveButtonProps={{ startIcon: <PlusOutlined /> }}
    >
      <Stack spacing={2}>
        <AppTextField
          autoFocus
          required
          type="number"
          label="Amount Received (PKR) *"
          placeholder="e.g. 20000"
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
          renderInput={(params) => <AppTextField {...params} label="Received From / Source" placeholder="Owner / Head Office" />}
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
          placeholder="e.g. Morning opening cash, 7-day imprest"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Typography variant="caption" color="text.secondary">
          This cash entry syncs automatically to Firebase Cloud for Super Admin tracking.
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
