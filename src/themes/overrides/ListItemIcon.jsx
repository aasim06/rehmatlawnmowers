// ==============================|| OVERRIDES - LIST ITEM ICON ||============================== //

export default function ListItemIcon(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 24,
          color: isDark ? '#94a3b8' : theme.vars.palette.text.primary
        }
      }
    }
  };
}
