import PropTypes from 'prop-types';
import { Stack, Typography } from '@mui/material';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import FormDialog from './FormDialog';

/**
 * Reusable confirmation dialog built on FormDialog and AppButton for delete
 * and destructive actions across all modules.
 */
export default function ConfirmDialog({
  open = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  subtitle,
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm Delete',
  cancelText = 'Cancel',
  intent = 'danger',
  loading = false,
  maxWidth = 'xs',
  children
}) {
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <FormDialog
      open={Boolean(open)}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={loading}
      maxWidth={maxWidth}
      title={
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: intent === 'danger' ? 'error.main' : 'primary.main' }}>
          {intent === 'danger' ? <DeleteOutlined style={{ fontSize: 18 }} /> : <ExclamationCircleOutlined style={{ fontSize: 18 }} />}
          <span>{title}</span>
        </Stack>
      }
      subtitle={subtitle}
      saveText={confirmText}
      cancelText={cancelText}
      saveButtonProps={{
        intent,
        startIcon: intent === 'danger' ? <DeleteOutlined /> : undefined
      }}
    >
      {children || (
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {message}
        </Typography>
      )}
    </FormDialog>
  );
}

ConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.node,
  subtitle: PropTypes.string,
  message: PropTypes.node,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  intent: PropTypes.string,
  loading: PropTypes.bool,
  maxWidth: PropTypes.string,
  children: PropTypes.node
};
