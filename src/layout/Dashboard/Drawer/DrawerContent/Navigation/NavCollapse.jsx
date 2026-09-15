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
    <Box sx={{ position: 'relative' }}>
      <ListItemButton
        selected={hasActiveChild}
        onClick={handleClick}
        sx={(theme) => ({
          pl: drawerOpen ? `${level * 28}px` : 1.5,
          py: !drawerOpen && level === 1 ? 1.25 : 1,
          borderRadius: 1.5,
          mx: 1,
          mb: 0.5,
          color: theme.palette.text.secondary,
          '&:hover': { bgcolor: theme.vars.palette.primary.lighter, color: theme.vars.palette.primary.main },
          '&.Mui-selected': {
            bgcolor: theme.vars.palette.primary.lighter,
            color: theme.vars.palette.primary.main,
            fontWeight: 600,
            '& .MuiListItemIcon-root': { color: theme.vars.palette.primary.main }
          },
          ...theme.applyStyles('dark', {
            color: '#a1a1aa',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.06)', color: '#f4f4f5' },
            '&.Mui-selected': {
              bgcolor: '#27272a',
              color: '#ffffff',
              '& .MuiListItemIcon-root': { color: '#ffffff' }
            }
          }),
          ...(!drawerOpen && {
            '&:hover': { bgcolor: 'transparent' },
            '&.Mui-selected': { '&:hover': { bgcolor: 'transparent' }, bgcolor: 'transparent' }
          })
        })}
      >
        {itemIcon && (
          <ListItemIcon
            sx={(theme) => ({
              minWidth: 28,
              color: hasActiveChild ? theme.vars.palette.primary.main : theme.vars.palette.text.secondary,
              ...(!drawerOpen && {
                borderRadius: 1.5,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': { bgcolor: theme.vars.palette.secondary.lighter }
              }),
              ...(!drawerOpen && hasActiveChild && {
                bgcolor: theme.vars.palette.primary.lighter,
                '&:hover': { bgcolor: theme.vars.palette.primary.lighter }
              }),
              ...theme.applyStyles('dark', {
                color: hasActiveChild ? '#ffffff' : '#a1a1aa'
              })
            })}
          >
            {itemIcon}
          </ListItemIcon>
        )}
        {drawerOpen && (
          <ListItemText
            primary={
              <Typography
                variant="h6"
                sx={(theme) => ({
                  color: hasActiveChild ? theme.vars.palette.primary.main : theme.vars.palette.text.primary,
                  fontWeight: hasActiveChild ? 600 : 500,
                  ...theme.applyStyles('dark', {
                    color: hasActiveChild ? '#ffffff' : '#f4f4f5'
                  })
                })}
              >
                {item.title}
              </Typography>
            }
          />
        )}
        {drawerOpen && (open ? <UpOutlined style={{ fontSize: '0.7rem' }} /> : <DownOutlined style={{ fontSize: '0.7rem' }} />)}
      </ListItemButton>
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
