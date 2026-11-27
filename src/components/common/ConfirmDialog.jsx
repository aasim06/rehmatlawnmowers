import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import AppButton from './AppButton';

/**
 * Reusable Delete / Confirmation Dialog matching the app-wide compact delete modal:
 * bold error title, concise body text, and side-by-side Cancel / Confirm AppButtons.
 */
export default function ConfirmDialog({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirm Delete',
  message = 'Are you sure you want to delete this record?',
  confirmText = 'Confirm Delete',
  cancelText = 'Cancel',
  intent = 'danger',
  loading = false,
  maxWidth = 'xs',
  children
}) {
  return (
    <Dialog open={Boolean(open)} onClose={loading ? undefined : onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: intent === 'danger' ? 'error.main' : 'primary.main' }}>
        {title}
      </DialogTitle>

      <DialogContent>
        {children || (
          <Typography variant="body2" color="text.secondary">
            {message}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <AppButton intent="cancel" onClick={onClose} disabled={loading}>
          {cancelText}
        </AppButton>
        <AppButton intent={intent} onClick={onConfirm} loading={loading} loadingText="Deleting...">
          {confirmText}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.node,
  message: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  intent: PropTypes.string,
  loading: PropTypes.bool,
  maxWidth: PropTypes.string,
  children: PropTypes.node
};
