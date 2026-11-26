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
import { getSidebarItemSx } from 'utils/themeSurface';

// ==============================|| NAVIGATION - LIST COLLAPSE ||============================== //

const hasMatchingRoute = (childrenList, currentPath) =>
  childrenList?.some((child) => {
    if (child.url && currentPath.includes(child.url)) return true;
    if (child.children) return hasMatchingRoute(child.children, currentPath);
    return false;
  });

export default function NavCollapse({ item, level = 1 }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const { pathname } = useLocation();

  const [open, setOpen] = useState(() => hasMatchingRoute(item.children, pathname));

  useEffect(() => {
    if (hasMatchingRoute(item.children, pathname)) {
      setOpen(true);
    }
  }, [item.children, pathname]);

  const handleClick = () => {
    if (!drawerOpen) {
      handlerDrawerOpen(true);
      setOpen(true);
    } else {
      setOpen(!open);
    }
  };

  const Icon = item.icon;
  const itemIcon = item.icon ? <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} /> : false;

  const hasActiveChild = hasMatchingRoute(item.children, pathname);

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
          sx={(theme) => getSidebarItemSx(theme, hasActiveChild, drawerOpen, level)}
        >
          {itemIcon && (
            <ListItemIcon
              sx={(theme) => {
                const isDark = theme.palette.mode === 'dark';
                const activeColor = isDark ? '#8098f9' : theme.palette.primary.main;
                const idleColor = isDark ? '#98a2b3' : '#667085';
                return {
                  color: hasActiveChild ? activeColor : idleColor,
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
                      color: hasActiveChild ? (isDark ? '#8098f9' : theme.palette.primary.main) : isDark ? '#d0d5dd' : '#344054',
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
