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
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.5)' : theme.vars.palette.action.hover
            }
          }
        }
      }
    }
  };
}
