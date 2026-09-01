// ==============================|| CUSTOM FUNCTION - COLORS ||============================== //

export default function getColors(theme, color) {
  const palette = theme?.vars?.palette || theme?.palette || {};

  switch (color) {
    case 'secondary':
      return palette.secondary || {};
    case 'error':
      return palette.error || {};
    case 'warning':
      return palette.warning || {};
    case 'info':
      return palette.info || {};
    case 'success':
      return palette.success || {};
    default:
      return palette.primary || {};
  }
}
