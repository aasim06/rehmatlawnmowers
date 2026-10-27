// ==============================|| OVERRIDES - INPUT LABEL ||============================== //

export default function InputLabel(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: isDark ? '#94a3b8' : theme.vars.palette.grey[600],
          '&.Mui-focused': {
            color: isDark ? '#818cf8' : theme.vars.palette.primary.main
          }
        },
        outlined: {
          lineHeight: '1rem',
          top: -4,
          '&.MuiInputLabel-sizeSmall': {
            lineHeight: '1em'
          },
          '&.MuiInputLabel-shrink': {
            background: isDark ? '#162033' : theme.vars.palette.background.paper,
            padding: '0 8px',
            marginLeft: -6,
            top: 2,
            lineHeight: '1rem'
          }
        }
      }
    }
  };
}
