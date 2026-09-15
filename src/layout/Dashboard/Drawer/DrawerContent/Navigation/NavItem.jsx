import PropTypes from 'prop-types';
import { Link, useLocation, matchPath } from 'react-router-dom';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import IconButton from 'components/@extended/IconButton';
import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| NAVIGATION - LIST ITEM ||============================== //

export default function NavItem({ item, level, isParents = false, setSelectedID }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  let itemTarget = '_self';
  if (item.target) itemTarget = '_blank';

  const itemHandler = () => {
    if (downLG) handlerDrawerOpen(false);
    if (isParents && setSelectedID) setSelectedID(item.id);
  };

  const Icon = item.icon;
  const itemIcon = item.icon ? (
    <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem', ...(isParents && { fontSize: 20, stroke: '1.5' }) }} />
  ) : false;

  const { pathname } = useLocation();
  const isSelected = !!matchPath({ path: item?.link ? item.link : item.url, end: false }, pathname);

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <ListItemButton
          component={Link}
          to={item.url}
          target={itemTarget}
          disabled={item.disabled}
          selected={isSelected}
          onClick={() => itemHandler()}
          sx={(theme) => ({
            zIndex: 1201,
            pl: drawerOpen ? `${level * 28}px` : 1.5,
            py: !drawerOpen && level === 1 ? 1.25 : 1,
            borderRadius: 1.5,
            mx: 1,
            mb: 0.5,

            // Light mode
            color: theme.palette.text.secondary,
            '&:hover': { bgcolor: theme.vars.palette.primary.lighter, color: theme.vars.palette.primary.main },
            '&.Mui-selected': {
              bgcolor: theme.vars.palette.primary.lighter,
              borderRight: `2px solid ${theme.vars.palette.primary.main}`,
              color: theme.vars.palette.primary.main,
              '& .MuiListItemIcon-root': { color: theme.vars.palette.primary.main },
              '&:hover': { color: theme.vars.palette.primary.main, bgcolor: theme.vars.palette.primary.lighter }
            },

            // Dark mode overrides via applyStyles - Magic UI Pure Neutral Black / Zinc
            ...theme.applyStyles('dark', {
              color: '#a1a1aa',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.06)',
                color: '#f4f4f5'
              },
              '&.Mui-selected': {
                bgcolor: '#27272a',
                borderRight: '2px solid #ffffff',
                color: '#ffffff',
                '& .MuiListItemIcon-root': { color: '#ffffff' },
                '&:hover': { bgcolor: '#3f3f46', color: '#ffffff' }
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
                color: isSelected ? theme.vars.palette.primary.main : theme.vars.palette.text.secondary,
                ...(!drawerOpen && {
                  borderRadius: 1.5,
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': { bgcolor: theme.vars.palette.secondary.lighter }
                }),
                ...(!drawerOpen && isSelected && {
                  bgcolor: theme.vars.palette.primary.lighter,
                  '&:hover': { bgcolor: theme.vars.palette.primary.lighter }
                }),
                ...theme.applyStyles('dark', {
                  color: isSelected ? '#ffffff' : '#a1a1aa'
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
                    color: isSelected ? theme.vars.palette.primary.main : theme.vars.palette.text.primary,
                    fontWeight: isSelected ? 600 : 400,
                    ...theme.applyStyles('dark', {
                      color: isSelected ? '#ffffff' : '#f4f4f5'
                    })
                  })}
                >
                  {item.title}
                </Typography>
              }
            />
          )}
          {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
            <Chip
              color={item.chip.color}
              variant={item.chip.variant}
              size={item.chip.size}
              label={item.chip.label}
              avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
            />
          )}
        </ListItemButton>
        {(drawerOpen || (!drawerOpen && level !== 1)) &&
          item?.actions &&
          item?.actions.map((action, index) => {
            const ActionIcon = action.icon;
            const callAction = action?.function;
            return (
              <IconButton
                key={index}
                {...(action.type === 'function' && {
                  onClick: (event) => { event.stopPropagation(); callAction(); }
                })}
                {...(action.type === 'link' && {
                  component: Link,
                  to: action.url,
                  target: action.target ? '_blank' : '_self'
                })}
                color="secondary"
                variant="outlined"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 20,
                  zIndex: 1202,
                  width: 20,
                  height: 20,
                  mr: -1,
                  ml: 1,
                  color: 'secondary.dark',
                  borderColor: isSelected ? 'primary.light' : 'secondary.light',
                  '&:hover': { borderColor: isSelected ? 'primary.main' : 'secondary.main' }
                }}
              >
                <ActionIcon style={{ fontSize: '0.625rem' }} />
              </IconButton>
            );
          })}
      </Box>
    </>
  );
}

NavItem.propTypes = {
  item: PropTypes.any,
  level: PropTypes.number,
  isParents: PropTypes.bool,
  setSelectedID: PropTypes.oneOfType([PropTypes.any, PropTypes.func])
};
