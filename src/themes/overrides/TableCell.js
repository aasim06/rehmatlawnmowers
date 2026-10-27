// ==============================|| OVERRIDES - TABLE CELL ||============================== //

export default function TableCell(theme) {
  const isDark = theme.palette.mode === 'dark';
  const dividerColor = isDark ? '#1e293b' : theme.vars.palette.divider;

  return {
    MuiTableCell: {
      styleOverrides: {
        root: ({ ownerState }) => {
          const baseStyle = {
            fontSize: '0.875rem',
            padding: '12px 16px',
            borderColor: dividerColor,
            borderBottom: `1px solid ${dividerColor}`,
            color: isDark ? '#f8fafc' : 'inherit'
          };

          const align = ownerState.align;

          if (align === 'right') {
            return {
              ...baseStyle,
              justifyContent: 'flex-end',
              textAlign: 'right',
              '& > *': {
                justifyContent: 'flex-end',
                margin: '0 0 0 auto'
              },
              '& .MuiOutlinedInput-input': {
                textAlign: 'right'
              }
            };
          }

          if (align === 'center') {
            return {
              ...baseStyle,
              justifyContent: 'center',
              textAlign: 'center',
              '& > *': {
                justifyContent: 'center',
                margin: '0 auto'
              }
            };
          }

          return baseStyle;
        },
        sizeSmall: { padding: '8px 12px' },
        head: {
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: isDark ? '#94a3b8' : theme.vars.palette.text.secondary
        },
        footer: {
          fontSize: '0.75rem',
          color: isDark ? '#94a3b8' : theme.vars.palette.text.secondary
        }
      }
    }
  };
}
