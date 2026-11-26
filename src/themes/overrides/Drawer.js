// ==============================|| OVERRIDES - DRAWER ||============================== //

export default function Drawer(theme) {
  const isDark = theme?.palette?.mode === 'dark';
  return {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: isDark ? '#171f2f' : '#ffffff',
          color: isDark ? '#f9fafb' : '#101828',
          scrollbarWidth: 'none !important',
          msOverflowStyle: 'none !important',
          '&::-webkit-scrollbar': {
            display: 'none !important',
            width: '0 !important',
            height: '0 !important'
          }
        }
      }
    }
  };
}
