// ==============================|| OVERRIDES - TABLE HEAD ||============================== //

export default function TableHead(theme) {
  const isDark = theme.palette.mode === 'dark';
  const headBg = isDark ? '#1d2939' : '#f9fafb';
  const borderCol = isDark ? '#2e3a47' : '#e4e7ec';
  const textCol = isDark ? '#98a2b3' : '#667085';

  return {
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: headBg,
          borderTop: '1px solid',
          borderTopColor: borderCol,
          borderBottom: '1px solid',
          borderBottomColor: borderCol,
          '& .MuiTableCell-root': {
            backgroundColor: headBg,
            color: textCol,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            paddingTop: 12,
            paddingBottom: 12,
            borderBottom: `1px solid ${borderCol}`
          }
        }
      }
    }
  };
}
