import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// project imports
import Avatar from 'components/@extended/Avatar';
import Transitions from 'components/@extended/Transitions';
import { useAuth } from 'context/AuthContext';
import usePermission from 'hooks/usePermission';
import { getToneColors } from 'utils/themeSurface';

// assets
import DownOutlined from '@ant-design/icons/DownOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import avatar1 from 'assets/images/users/avatar-1.png';

// ==============================|| HEADER CONTENT - TAILADMIN PROFILE DROPDOWN ||============================== //

export default function Profile() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isSuperAdmin } = usePermission();

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && event?.target && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  const fullName = user?.name || 'Sabeel (Super Admin)';
  const shortTriggerName = (user?.firstName || fullName.split(' (')[0] || fullName).trim();
  const userEmail = user?.email || 'admin@rehmat.com';
  const userRole = user?.role || 'Super Admin';
  const avatarSrc = user?.avatar || avatar1;
  const errorTone = getToneColors(theme, 'error');

  const menuItemSx = {
    borderRadius: 2,
    px: 1.5,
    py: 1.1,
    minHeight: 42,
    gap: 1.5,
    color: 'text.primary',
    '&:hover': {
      bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f2f4f7'
    }
  };

  return (
    <Box sx={{ flexShrink: 0 }}>
      <ButtonBase
        ref={anchorRef}
        aria-label="open profile"
        aria-controls={open ? 'profile-tailadmin-menu' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        sx={{
          px: 1,
          py: 0.5,
          borderRadius: 999,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1.25,
          transition: 'background-color 0.15s ease',
          '&:hover': {
            bgcolor: isDark ? 'rgba(255, 255, 255, 0.05)' : alpha(theme.palette.grey[200], 0.55)
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2
          }
        }}
      >
        <Avatar
          alt={fullName}
          src={avatarSrc}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '1px solid',
            borderColor: 'divider',
            '& img': { objectFit: 'cover' }
          }}
        />
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Typography
            variant="body1"
            sx={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: 'text.primary',
              lineHeight: 1.2,
              maxWidth: 120,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {shortTriggerName}
          </Typography>
          <DownOutlined
            style={{
              fontSize: 11,
              color: theme.palette.text.secondary,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </Stack>
      </ButtonBase>

      <Popper
        id="profile-tailadmin-menu"
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        sx={{ zIndex: 1300 }}
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 12]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper
              elevation={0}
              sx={{
                width: 260,
                p: 2,
                borderRadius: 4,
                bgcolor: isDark ? '#1e293b' : '#ffffff',
                border: '1px solid',
                borderColor: isDark ? '#2e3a47' : '#e4e7ec',
                boxShadow: isDark
                  ? '0 20px 25px -5px rgba(0, 0, 0, 0.55), 0 8px 10px -6px rgba(0, 0, 0, 0.45)'
                  : '0 12px 16px -4px rgba(16, 24, 40, 0.08), 0 4px 6px -2px rgba(16, 24, 40, 0.03)'
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <Box>
                  {/* User Identity Header */}
                  <Box sx={{ pb: 1.5 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary', lineHeight: 1.35 }}
                      noWrap
                    >
                      {fullName}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontSize: '0.75rem', display: 'block', mt: 0.25 }}
                      noWrap
                    >
                      {userEmail}
                    </Typography>
                  </Box>

                  <Divider />

                  {/* Navigation Links (TailAdmin Compact Height & Spacing) */}
                  <List
                    component="nav"
                    disablePadding
                    sx={{
                      py: 1.25,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.35,
                      '& .MuiListItemIcon-root': {
                        minWidth: 'auto',
                        color: 'text.secondary'
                      }
                    }}
                  >
                    <ListItemButton sx={menuItemSx} onClick={() => handleNavigate('/profile')}>
                      <ListItemIcon>
                        <UserOutlined style={{ fontSize: 17 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500} fontSize="0.875rem">
                            Edit profile
                          </Typography>
                        }
                      />
                    </ListItemButton>

                    <ListItemButton sx={menuItemSx} onClick={() => handleNavigate('/profile?section=security')}>
                      <ListItemIcon>
                        <SettingOutlined style={{ fontSize: 17 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={500} fontSize="0.875rem">
                            Account settings
                          </Typography>
                        }
                      />
                    </ListItemButton>

                    {isSuperAdmin ? (
                      <ListItemButton sx={menuItemSx} onClick={() => handleNavigate('/admin/users')}>
                        <ListItemIcon>
                          <TeamOutlined style={{ fontSize: 17 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={500} fontSize="0.875rem">
                              Staff &amp; Access
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    ) : (
                      <ListItemButton sx={menuItemSx} onClick={() => handleNavigate('/profile?section=address')}>
                        <ListItemIcon>
                          <InfoCircleOutlined style={{ fontSize: 17 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={500} fontSize="0.875rem">
                              Workshop info
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    )}

                    <ListItemButton sx={menuItemSx} onClick={() => handleNavigate('/profile')}>
                      <ListItemIcon>
                        <SafetyCertificateOutlined style={{ fontSize: 17 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Typography variant="body2" fontWeight={500} fontSize="0.875rem">
                              Access role
                            </Typography>
                            <Chip
                              label={userRole}
                              size="small"
                              variant="outlined"
                              sx={{
                                height: 22,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                borderRadius: 999
                              }}
                            />
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </List>

                  <Divider />

                  {/* Sign Out Row */}
                  <Box sx={{ pt: 1 }}>
                    <ListItemButton
                      sx={{
                        ...menuItemSx,
                        color: errorTone.main,
                        '&:hover': { bgcolor: errorTone.bg }
                      }}
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit !important' }}>
                        <LogoutOutlined style={{ fontSize: 17 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} fontSize="0.875rem" color="inherit">
                            Sign out
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
