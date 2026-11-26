import PropTypes from 'prop-types';
import { Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { AppButton } from 'components/common';

/**
 * Reusable Factory Reset confirmation dialog shared across Retail Shop Mart views.
 */
export default function ShopResetDialog({
  open,
  onClose,
  onConfirm,
  loading = false,
  title = 'Confirm Reset Shop Data?',
  message = 'Are you sure you want to wipe all Shop inventory items, stock counts, counter sales slips, and ledger records? This action will reset all shop metrics to 0.'
}) {
  return (
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton intent="cancel" onClick={onClose} disabled={loading}>
          Cancel
        </AppButton>
        <AppButton intent="danger" loading={loading} loadingText="Resetting..." onClick={onConfirm}>
          Yes, Reset Shop Data
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}

ShopResetDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  title: PropTypes.string,
  message: PropTypes.string
};

