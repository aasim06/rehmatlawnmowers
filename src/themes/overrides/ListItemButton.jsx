// ==============================|| OVERRIDES - LIST ITEM ICON ||============================== //

export default function ListItemButton(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f9fafb'
          },
          '&.Mui-selected': {
            backgroundColor: isDark ? 'rgba(70, 95, 255, 0.14)' : '#ecf3ff',
            color: isDark ? '#8098f9' : '#465fff',
            '& .MuiListItemIcon-root': {
              color: isDark ? '#8098f9' : '#465fff'
            },
            '&:hover': {
              backgroundColor: isDark ? 'rgba(70, 95, 255, 0.2)' : '#dde9ff'
            }
          }
        }
      }
    }
  };
}
