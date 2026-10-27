// ==============================|| OVERRIDES - LIST ITEM ICON ||============================== //

export default function ListItemButton(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : undefined
          },
          '&.Mui-selected': {
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : theme.vars.palette.primary.lighter,
            color: isDark ? '#818cf8' : theme.vars.palette.primary.main,
            '& .MuiListItemIcon-root': {
              color: isDark ? '#818cf8' : theme.vars.palette.primary.main
            },
            '&:hover': {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : undefined
            }
          }
        }
      }
    }
  };
}
