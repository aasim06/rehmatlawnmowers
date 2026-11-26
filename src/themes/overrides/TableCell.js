// ==============================|| OVERRIDES - TABLE CELL ||============================== //

export default function TableCell(theme) {
  const isDark = theme.palette.mode === 'dark';
  const dividerColor = isDark ? '#2e3a47' : '#f2f4f7';

  return {
    MuiTableCell: {
      styleOverrides: {
        root: ({ ownerState }) => {
          const baseStyle = {
            fontSize: '0.8125rem',
            padding: '13px 16px',
            borderColor: dividerColor,
            borderBottom: `1px solid ${dividerColor}`,
            color: isDark ? '#f2f4f7' : '#344054'
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
        sizeSmall: { padding: '9px 12px' },
        head: {
          fontWeight: 700,
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: isDark ? '#98a2b3' : '#667085'
        },
        footer: {
          fontSize: '0.75rem',
          color: isDark ? '#98a2b3' : '#667085'
        }
      }
    }
  };
}
