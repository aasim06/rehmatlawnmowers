import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// material-ui
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

// icons
import { DownOutlined, UpOutlined } from '@ant-design/icons';

// project imports
import NavItem from './NavItem';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| NAVIGATION - LIST COLLAPSE ||============================== //

export default function NavCollapse({ item, level = 1 }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const { pathname } = useLocation();

  // Auto-expand if current route matches any child item URL
  const checkOpen = (childrenList) => {
    return childrenList?.some((child) => {
      if (child.url && pathname.includes(child.url)) return true;
      if (child.children) return checkOpen(child.children);
      return false;
    });
  };

  const [open, setOpen] = useState(() => checkOpen(item.children));

  useEffect(() => {
    if (checkOpen(item.children)) {
      setOpen(true);
    }
  }, [pathname]);

  const handleClick = () => {
    if (!drawerOpen) {
      handlerDrawerOpen(true);
      setOpen(true);
    } else {
      setOpen(!open);
    }
  };

  const Icon = item.icon;
  const itemIcon = item.icon ? (
    <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} />
  ) : false;

  const hasActiveChild = checkOpen(item.children);

  const navChildren = item.children?.map((menuItem) => {
    switch (menuItem.type) {
      case 'collapse':
        return <NavCollapse key={menuItem.id} item={menuItem} level={level + 1} />;
      case 'item':
        return <NavItem key={menuItem.id} item={menuItem} level={level + 1} />;
      default:
        return (
          <Typography key={menuItem.id} variant="h6" sx={{ color: 'error.main', textAlign: 'center' }}>
            Fix - Group Items
          </Typography>
        );
    }
  });

  return (
    <Box sx={{ position: 'relative', width: '100%', ...(!drawerOpen && { display: 'flex', justifyContent: 'center' }) }}>
      <Tooltip title={!drawerOpen ? item.title : ''} placement="right" arrow disableHoverListener={drawerOpen}>
        <ListItemButton
          selected={hasActiveChild}
          onClick={handleClick}
          sx={(theme) => {
            const isDark = theme.palette.mode === 'dark';
            return {
              zIndex: 1201,
              borderRadius: 1.5,
              mb: 0.5,
              ...(drawerOpen
                ? {
                    pl: `${level * 28}px`,
                    py: 1,
                    mx: 1,
                    color: isDark ? '#94a3b8' : theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : theme.vars.palette.primary.lighter,
                      color: isDark ? '#f8fafc' : theme.vars.palette.primary.main,
                      '& .MuiListItemIcon-root': {
                        color: isDark ? '#f8fafc' : theme.vars.palette.primary.main
                      }
                    },
                    '&.Mui-selected': {
                      bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : theme.vars.palette.primary.lighter,
                      borderLeft: isDark ? '3px solid #6366f1' : 'none',
                      color: isDark ? '#818cf8' : theme.vars.palette.primary.main,
                      fontWeight: 600,
                      '& .MuiListItemIcon-root': {
                        color: isDark ? '#818cf8' : theme.vars.palette.primary.main
                      },
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.22)' : theme.vars.palette.primary.lighter,
                        color: isDark ? '#a5b4fc' : theme.vars.palette.primary.main
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
                    color: hasActiveChild
                      ? isDark ? '#818cf8' : theme.vars.palette.primary.main
                      : isDark ? '#94a3b8' : theme.palette.text.secondary,
                    bgcolor: hasActiveChild
                      ? isDark ? 'rgba(99, 102, 241, 0.15)' : theme.vars.palette.primary.lighter
                      : 'transparent',
                    '&:hover': {
                      bgcolor: hasActiveChild
                        ? isDark ? 'rgba(99, 102, 241, 0.22)' : theme.vars.palette.primary.lighter
                        : isDark ? 'rgba(255, 255, 255, 0.05)' : theme.vars.palette.secondary.lighter,
                      color: isDark ? '#f8fafc' : theme.vars.palette.primary.main,
                      '& .MuiListItemIcon-root': {
                        color: isDark ? '#f8fafc' : theme.vars.palette.primary.main
                      }
                    },
                    '&.Mui-selected': {
                      bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : theme.vars.palette.primary.lighter,
                      borderLeft: 'none',
                      borderRight: 'none',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.22)' : theme.vars.palette.primary.lighter
                      }
                    }
                  })
            };
          }}
        >
          {itemIcon && (
            <ListItemIcon
              sx={(theme) => {
                const isDark = theme.palette.mode === 'dark';
                return {
                  color: isDark
                    ? hasActiveChild ? '#818cf8' : '#94a3b8'
                    : hasActiveChild ? theme.vars.palette.primary.main : theme.vars.palette.text.secondary,
                  ...(drawerOpen
                    ? {
                        minWidth: 28
                      }
                    : {
                        minWidth: 'unset',
                        m: 0,
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      })
                };
              }}
            >
              {itemIcon}
            </ListItemIcon>
          )}
          {drawerOpen && (
            <ListItemText
              primary={
                <Typography
                  variant="h6"
                  sx={(theme) => {
                    const isDark = theme.palette.mode === 'dark';
                    return {
                      color: isDark
                        ? hasActiveChild ? '#818cf8' : '#cbd5e1'
                        : hasActiveChild ? theme.vars.palette.primary.main : theme.vars.palette.text.primary,
                      fontWeight: hasActiveChild ? 600 : 500
                    };
                  }}
                >
                  {item.title}
                </Typography>
              }
            />
          )}
          {drawerOpen && (open ? <UpOutlined style={{ fontSize: '0.7rem' }} /> : <DownOutlined style={{ fontSize: '0.7rem' }} />)}
        </ListItemButton>
      </Tooltip>
      <Collapse in={drawerOpen && open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {navChildren}
        </List>
      </Collapse>
    </Box>
  );
}

NavCollapse.propTypes = {
  item: PropTypes.object,
  level: PropTypes.number
};
