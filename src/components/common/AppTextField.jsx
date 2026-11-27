import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';

/**
 * Reusable themed form field enforcing uniform control heights and alignment
 * across data-entry forms and dialogs alongside AppButton.
 */
export default function AppTextField({ size = 'medium', fullWidth = true, sx = {}, ...props }) {
  const controlHeight = size === 'small' ? 38 : 42;

  return (
    <TextField
      size={size}
      fullWidth={fullWidth}
      sx={{
        '& .MuiOutlinedInput-root': {
          minHeight: controlHeight,
          ...(!props.multiline && { height: controlHeight })
        },
        ...sx
      }}
      {...props}
    />
  );
}

AppTextField.propTypes = {
  size: PropTypes.oneOf(['small', 'medium']),
  fullWidth: PropTypes.bool,
  multiline: PropTypes.bool,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.func])
};
