import { alpha } from '@mui/material/styles';

/**
 * Resolves restrained TailAdmin-aligned badge & accent colors (light/dark aware).
 */
export function getToneColors(theme, tone = 'primary') {
  const isDark = theme.palette.mode === 'dark';
  const paletteEntry = theme.palette[tone] || theme.palette.primary;
  const main = tone === 'neutral' ? theme.palette.text.secondary : paletteEntry?.main || theme.palette.primary.main;
  const display = isDark && tone !== 'neutral' ? paletteEntry?.light || main : main;

  return {
    main: display,
    solid: main,
    bg: alpha(main, isDark ? 0.16 : 0.09),
    border: alpha(main, isDark ? 0.3 : 0.2)
  };
}

/**
 * Standardized TailAdmin rounded-2xl card container surface shared across dashboards,
 * ledgers, and MainCard so every panel shares crisp 1px borders and clean elevation.
 */
export function getCardSurfaceSx(theme, extra = {}) {
  const isDark = theme.palette.mode === 'dark';
  return {
    borderRadius: 4,
    border: '1px solid',
    borderColor: theme.palette.divider,
    bgcolor: theme.palette.background.paper,
    backgroundImage: 'none',
    boxShadow: isDark ? '0 1px 3px rgba(0, 0, 0, 0.32)' : '0 1px 2px rgba(16, 24, 40, 0.04)',
    ...extra
  };
}

/**
 * TailAdmin nested slate sub-surface (toolbars, summary cards, expanded table strips).
 */
export function getSubSurfaceSx(theme, extra = {}) {
  const isDark = theme.palette.mode === 'dark';
  return {
    borderRadius: 3,
    border: '1px solid',
    borderColor: theme.palette.divider,
    bgcolor: isDark ? '#1d2939' : '#f9fafb',
    backgroundImage: 'none',
    ...extra
  };
}

/**
 * Unified TableHead cell typography matching global MuiTableHead / MuiTableCell.head.
 */
export function getTableHeadCellSx(extra = {}) {
  return {
    py: 1.5,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'text.secondary',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ...extra
  };
}

/**
 * Unified compact nested/expanded sub-table header cell typography.
 */
export function getSubTableHeadCellSx(extra = {}) {
  return {
    py: 1.1,
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'text.secondary',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    ...extra
  };
}

/**
 * Shared TailAdmin pill navigation style for both NavItem and NavCollapse,
 * eliminating duplicate inline sx rules across the sidebar tree.
 */
export function getSidebarItemSx(theme, isSelected, drawerOpen, level = 1) {
  const isDark = theme.palette.mode === 'dark';
  const activeBg = isDark ? 'rgba(70, 95, 255, 0.14)' : '#ecf3ff';
  const activeHoverBg = isDark ? 'rgba(70, 95, 255, 0.2)' : '#dde9ff';
  const activeColor = isDark ? '#8098f9' : theme.palette.primary.main;
  const idleColor = isDark ? '#98a2b3' : '#344054';
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f2f4f7';

  return {
    zIndex: 1201,
    borderRadius: 2,
    mb: 0.5,
    transition: 'background-color 0.15s ease, color 0.15s ease',
    ...(drawerOpen
      ? {
          pl: `${14 + (level - 1) * 18}px`,
          pr: 1.5,
          py: 1,
          mx: 1.25,
          color: idleColor,
          '&:hover': {
            bgcolor: hoverBg,
            color: isDark ? '#f9fafb' : '#101828',
            '& .MuiListItemIcon-root': {
              color: isDark ? '#f9fafb' : '#101828'
            }
          },
          '&.Mui-selected': {
            bgcolor: activeBg,
            color: activeColor,
            '& .MuiListItemIcon-root': {
              color: activeColor
            },
            '&:hover': {
              bgcolor: activeHoverBg,
              color: activeColor,
              '& .MuiListItemIcon-root': {
                color: activeColor
              }
            }
          }
        }
      : {
          width: 44,
          height: 44,
          minWidth: 44,
          p: 0,
          mx: 'auto',
          justifyContent: 'center',
          alignItems: 'center',
          color: isSelected ? activeColor : idleColor,
          bgcolor: isSelected ? activeBg : 'transparent',
          '&:hover': {
            bgcolor: isSelected ? activeHoverBg : hoverBg,
            color: isSelected ? activeColor : isDark ? '#f9fafb' : '#101828',
            '& .MuiListItemIcon-root': {
              color: isSelected ? activeColor : isDark ? '#f9fafb' : '#101828'
            }
          },
          '&.Mui-selected': {
            bgcolor: activeBg,
            '&:hover': {
              bgcolor: activeHoverBg
            }
          }
        })
  };
}
