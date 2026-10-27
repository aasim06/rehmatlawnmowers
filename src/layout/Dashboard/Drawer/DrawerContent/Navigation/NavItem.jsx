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
import Tooltip from '@mui/material/Tooltip';

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
      <Box sx={{ position: 'relative', width: '100%', ...(!drawerOpen && { display: 'flex', justifyContent: 'center' }) }}>
        <Tooltip title={!drawerOpen ? item.title : ''} placement="right" arrow disableHoverListener={drawerOpen}>
          <ListItemButton
            component={Link}
            to={item.url}
            target={itemTarget}
            disabled={item.disabled}
            selected={isSelected}
            onClick={() => itemHandler()}
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
                        borderRight: isDark ? 'none' : `2px solid ${theme.vars.palette.primary.main}`,
                        color: isDark ? '#818cf8' : theme.vars.palette.primary.main,
                        '& .MuiListItemIcon-root': {
                          color: isDark ? '#818cf8' : theme.vars.palette.primary.main
                        },
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(99, 102, 241, 0.22)' : theme.vars.palette.primary.lighter,
                          color: isDark ? '#a5b4fc' : theme.vars.palette.primary.main,
                          '& .MuiListItemIcon-root': {
                            color: isDark ? '#a5b4fc' : theme.vars.palette.primary.main
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
                      color: isSelected
                        ? isDark ? '#818cf8' : theme.vars.palette.primary.main
                        : isDark ? '#94a3b8' : theme.palette.text.secondary,
                      bgcolor: isSelected
                        ? isDark ? 'rgba(99, 102, 241, 0.15)' : theme.vars.palette.primary.lighter
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected
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
                      ? isSelected ? '#818cf8' : '#94a3b8'
                      : isSelected ? theme.vars.palette.primary.main : theme.vars.palette.text.secondary,
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
                        ? isSelected ? '#818cf8' : '#cbd5e1'
                        : isSelected ? theme.vars.palette.primary.main : theme.vars.palette.text.primary,
                      fontWeight: isSelected ? 600 : 400
                    };
                  }}
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
      </Tooltip>
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
