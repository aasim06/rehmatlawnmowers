// ==============================|| OVERRIDES - DRAWER ||============================== //

export default function Drawer(theme) {
  const isDark = theme?.palette?.mode === 'dark';
  return {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: isDark ? '#131b2e' : (theme?.vars?.palette?.background?.paper || '#ffffff'),
          color: isDark ? '#f8fafc' : '#262626'
        }
      }
    }
  };
}
