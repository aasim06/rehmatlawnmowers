// ==============================|| OVERRIDES - TABLE ROW ||============================== //

export default function TableRow(theme) {
  const isDark = theme?.palette?.mode === 'dark';
  return {
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(0, 0, 0, 0.03)'
          },
          '&.Mui-selected': {
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0, 150, 214, 0.08)',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(0, 150, 214, 0.12)'
            }
          },
          '&:last-of-type': {
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${isDark ? '#1e293b' : 'inherit'}`
            }
          },
          '& .MuiTableCell-root': {
            '&:last-of-type': {
              paddingRight: 20
            },
            '&:first-of-type': {
              paddingLeft: 20
            }
          }
        }
      }
    }
  };
}
