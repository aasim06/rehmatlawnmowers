import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

const INTENT_CONFIG = {
  primary: { variant: 'contained', color: 'primary' },
  secondary: { variant: 'outlined', color: 'primary' },
  print: { variant: 'contained', color: 'primary' },
  danger: { variant: 'contained', color: 'error' },
  'danger-outlined': { variant: 'outlined', color: 'error' },
  cancel: { variant: 'outlined', color: 'secondary' },
  neutral: { variant: 'outlined', color: 'secondary' },
  ghost: { variant: 'text', color: 'primary' }
};

/**
 * Master Button component enforcing uniform sizing, radius, font weight,
 * and theme-aligned color semantics across every module.
 */
export default function AppButton({
  children,
  intent = 'primary',
  size = 'medium',
  variant,
  color,
  loading = false,
  loadingText,
  disabled = false,
  startIcon,
  sx = {},
  ...props
}) {
  const preset = INTENT_CONFIG[intent] || INTENT_CONFIG.primary;
  const resolvedVariant = variant || preset.variant;
  const resolvedColor = color || preset.color;

  const sizeHeightMap = { small: 32, medium: 38, large: 44 };
  const resolvedHeight = sizeHeightMap[size] || 38;

  return (
    <Button
      variant={resolvedVariant}
      color={resolvedColor}
      size={size}
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={15} color="inherit" /> : startIcon}
      sx={{
        height: resolvedHeight,
        fontWeight: 600,
        borderRadius: '8px',
        textTransform: 'none',
        whiteSpace: 'nowrap',
        boxShadow: 'none',
        ...sx
      }}
      {...props}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}

AppButton.propTypes = {
  children: PropTypes.node,
  intent: PropTypes.oneOf(['primary', 'secondary', 'print', 'danger', 'danger-outlined', 'cancel', 'neutral', 'ghost']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.string,
  color: PropTypes.string,
  loading: PropTypes.bool,
  loadingText: PropTypes.string,
  disabled: PropTypes.bool,
  startIcon: PropTypes.node,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.func])
};
