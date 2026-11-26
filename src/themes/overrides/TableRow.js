// ==============================|| OVERRIDES - TABLE ROW ||============================== //

export default function TableRow(theme) {
  const isDark = theme?.palette?.mode === 'dark';
  return {
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f9fafb'
          },
          '&.Mui-selected': {
            backgroundColor: isDark ? 'rgba(70, 95, 255, 0.14)' : 'rgba(70, 95, 255, 0.06)',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(70, 95, 255, 0.2)' : 'rgba(70, 95, 255, 0.1)'
            }
          },
          '&:last-of-type': {
            '& .MuiTableCell-root': {
              borderBottom: `1px solid ${isDark ? '#2e3a47' : '#f2f4f7'}`
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
