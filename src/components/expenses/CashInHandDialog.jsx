import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import WalletOutlined from '@ant-design/icons/WalletOutlined';
import { AppButton } from 'components/common';
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
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <WalletOutlined style={{ color: '#10b981', fontSize: 20 }} />
          <Typography variant="h5" fontWeight={700}>
            {editingFund ? 'Edit Cash in Hand Entry' : 'Add Cash in Hand (Company Cash)'}
          </Typography>
        </Stack>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Enter cash received from the owner or company. Expenses will automatically deduct from this balance.
            </Typography>

            <TextField
              fullWidth
              autoFocus
              required
              type="number"
              label="AMOUNT RECEIVED (PKR) *"
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
              onChange={(e, val) => setReceivedFrom(typeof val === 'string' ? val : val || '')}
              onInputChange={(e, val) => setReceivedFrom(val)}
              renderInput={(params) => (
                <TextField {...params} label="RECEIVED FROM / SOURCE" placeholder="e.g. Owner / Head Office" />
              )}
            />

            <Stack direction="row" spacing={1.5}>
              <TextField
                fullWidth
                type="date"
                label="DATE"
                value={fundDate}
                onChange={(e) => setFundDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                select
                fullWidth
                label="METHOD"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {PAYMENT_METHODS.map((pm) => (
                  <MenuItem key={pm} value={pm}>
                    {pm}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              fullWidth
              label="NOTES / REFERENCE (OPTIONAL)"
              placeholder="e.g. Morning opening cash, 7-day imprest"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, justifyContent: 'space-between' }}>
          <AppButton intent="cancel" onClick={onClose} disabled={saving}>
            Cancel
          </AppButton>
          <AppButton intent="primary" type="submit" startIcon={<PlusOutlined />} disabled={saving}>
            {editingFund ? 'Save Changes' : 'Add Cash in Hand'}
          </AppButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

CashInHandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  editingFund: PropTypes.object
};
