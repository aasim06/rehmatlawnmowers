// ==============================|| OVERRIDES - TABLE HEAD ||============================== //

export default function TableHead(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#162033' : theme.vars.palette.grey[50],
          borderTop: '1px solid',
          borderTopColor: isDark ? '#1e293b' : theme.vars.palette.divider,
          borderBottom: '1px solid',
          borderBottomColor: isDark ? '#1e293b' : theme.vars.palette.divider,
          '& .MuiTableCell-root': {
            backgroundColor: isDark ? '#162033' : 'inherit',
            color: isDark ? '#94a3b8' : theme.vars.palette.text.primary,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderBottom: `1px solid ${isDark ? '#1e293b' : theme.vars.palette.divider}`
          }
        }
      }
    }
  };
}
