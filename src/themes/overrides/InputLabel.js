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
          top: 0,
          lineHeight: '1.4375em',
          '&:not(.MuiInputLabel-shrink)': {
            transform: 'translate(14px, 10px) scale(1)',
            '&.MuiInputLabel-sizeSmall': {
              transform: 'translate(14px, 7.5px) scale(1)'
            }
          },
          '&.MuiInputLabel-shrink': {
            background: 'transparent',
            padding: 0,
            marginLeft: 0,
            top: 0,
            lineHeight: '1.4375em',
            transform: 'translate(14px, -9px) scale(0.75)'
          }
        }
      }
    }
  };
}
