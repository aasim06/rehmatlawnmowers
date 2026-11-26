// ==============================|| OVERRIDES - TABLE ROW ||============================== //

export default function TableBody(theme) {
  const isDark = theme?.palette?.mode === 'dark';
  return {
    MuiTableBody: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          '& .MuiTableRow-root': {
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f9fafb'
            }
          }
        }
      }
    }
  };
}
