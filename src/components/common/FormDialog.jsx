import PropTypes from 'prop-types';

// material-ui
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// icons
import CloseOutlined from '@ant-design/icons/CloseOutlined';

// project imports
import AppButton from './AppButton';

/**
 * Universal FormDialog modal for Add / Edit forms and popups.
 */
export default function FormDialog({
  open = false,
  onClose,
  title,
  subtitle,
  children,
  onSubmit,
  loading = false,
  saveText = 'Save',
  cancelText = 'Cancel',
  saveButtonProps = {},
  cancelButtonProps = {},
  actions,
  maxWidth = 'sm',
  fullWidth = true,
  disableBackdropClick = false,
  sx = {}
}) {
  const handleClose = (event, reason) => {
    if (disableBackdropClick && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    if (onClose) onClose();
  };

  const content = (
    <>
      {/* Dialog Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          pb: subtitle ? 1 : 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Stack>

        {onClose && (
          <IconButton size="small" onClick={onClose} disabled={loading} sx={{ color: 'text.secondary', ml: 1 }}>
            <CloseOutlined style={{ fontSize: 13 }} />
          </IconButton>
        )}
      </DialogTitle>

      {/* Dialog Body */}
      <DialogContent sx={{ p: 2.5, pt: '20px !important' }}>{children}</DialogContent>

      {/* Dialog Actions Footer */}
      <DialogActions
        sx={{
          p: 2,
          px: 2.5,
          borderTop: '1px solid',
          borderColor: 'divider',
          justifyContent: 'space-between'
        }}
      >
        {actions ? (
          actions
        ) : (
          <>
            <AppButton intent="cancel" onClick={onClose} disabled={loading} {...cancelButtonProps}>
              {cancelText}
            </AppButton>
            <AppButton
              intent="primary"
              type={onSubmit ? 'submit' : 'button'}
              loading={loading}
              loadingText="Saving..."
              onClick={onSubmit ? undefined : onSubmit}
              {...saveButtonProps}
            >
              {saveText}
            </AppButton>
          </>
        )}
      </DialogActions>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)'
        },
        ...sx
      }}
    >
      {onSubmit ? (
        <form onSubmit={onSubmit} style={{ display: 'contents' }}>
          {content}
        </form>
      ) : (
        content
      )}
    </Dialog>
  );
}

FormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  onSubmit: PropTypes.func,
  loading: PropTypes.bool,
  saveText: PropTypes.string,
  cancelText: PropTypes.string,
  saveButtonProps: PropTypes.object,
  cancelButtonProps: PropTypes.object,
  actions: PropTypes.node,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  fullWidth: PropTypes.bool,
  disableBackdropClick: PropTypes.bool,
  sx: PropTypes.object
};
