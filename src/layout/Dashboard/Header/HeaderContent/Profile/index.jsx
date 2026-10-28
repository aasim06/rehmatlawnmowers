import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// project imports
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import IconButton from 'components/@extended/IconButton';
import { useAuth } from 'context/AuthContext';

// assets
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import CrownOutlined from '@ant-design/icons/CrownOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import CloudSyncOutlined from '@ant-design/icons/CloudSyncOutlined';
import DashboardOutlined from '@ant-design/icons/DashboardOutlined';
import avatar1 from 'assets/images/users/avatar-1.png';

// ==============================|| HEADER CONTENT - CLEAN ERP PROFILE ||============================== //

export default function Profile() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout, switchUserRole } = useAuth();

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

  const userEmail = user?.email || 'admin@rehmat.com';
  const userRole = user?.role || 'Super Admin';

  return (
    <Box sx={{ flexShrink: 0 }}>
      <Tooltip title="Profile & Account" disableInteractive>
        <ButtonBase
          sx={(theme) => ({
            p: '3px 8px',
            borderRadius: 2,
            border: '1px solid',
            borderColor: open ? 'primary.main' : 'divider',
            bgcolor: open ? 'action.hover' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: 'primary.light', bgcolor: 'action.hover' },
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.secondary.dark}`, outlineOffset: 2 }
          })}
          aria-label="open profile"
          ref={anchorRef}
          aria-controls={open ? 'profile-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="center">
            <Avatar alt="profile user" src={avatar1} size="sm" sx={{ width: 28, height: 28 }} />
            <Typography
              variant="subtitle2"
              fontWeight={700}
              sx={{
                textTransform: 'capitalize',
                color: 'text.primary',
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 1,
                m: 0,
                p: 0,
                userSelect: 'none'
              }}
            >
              {userRole}
            </Typography>
          </Stack>
        </ButtonBase>
      </Tooltip>
      <Popper
        placement="bottom-end"
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 8]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper
              sx={(theme) => ({
                boxShadow: theme.vars.customShadows.z1,
                width: 300,
                borderRadius: 2.5,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider'
              })}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  {/* User Profile Header Card */}
                  <CardContent sx={{ p: 2, pb: 1.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar alt="profile user" src={avatar1} sx={{ width: 44, height: 44, border: '2px solid', borderColor: 'primary.lighter' }} />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {user?.name || 'Sabeel (Super Admin)'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" noWrap display="block" sx={{ mb: 0.5 }}>
                          {userEmail}
                        </Typography>
                        <Chip
                          size="small"
                          label={userRole}
                          color={userRole === 'Super Admin' ? 'primary' : userRole === 'Admin' ? 'info' : 'warning'}
                          sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                      <Tooltip title="Sign Out">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setOpen(false);
                            logout();
                          }}
                          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                        >
                          <LogoutOutlined />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    {/* Role Preview Switcher for Super Admin Testing */}
                    {userRole === 'Super Admin' && (
                      <Box sx={{ mt: 1.5, p: 1.25, bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                        <Stack direction="row" spacing={1}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            color="info"
                            startIcon={<SafetyCertificateOutlined />}
                            onClick={() => {
                              switchUserRole('Admin');
                              setOpen(false);
                            }}
                            sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.4, borderRadius: 1.5 }}
                          >
                            Admin
                          </Button>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            color="warning"
                            startIcon={<UserOutlined />}
                            onClick={() => {
                              switchUserRole('Store Keeper');
                              setOpen(false);
                            }}
                            sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.4, borderRadius: 1.5 }}
                          >
                            Store Keeper
                          </Button>
                        </Stack>
                      </Box>
                    )}

                    {/* Return to Super Admin Button only if currently previewing another role as Master Admin */}
                    {userRole !== 'Super Admin' && userEmail === 'admin@rehmat.com' && (
                      <Box sx={{ mt: 1.5 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<CrownOutlined />}
                          onClick={() => {
                            switchUserRole('Super Admin');
                            setOpen(false);
                          }}
                          sx={{ fontWeight: 700, py: 0.75, borderRadius: 1.5 }}
                        >
                          Restore Super Admin
                        </Button>
                      </Box>
                    )}
                  </CardContent>

                  <Divider />

                  {/* Clean ERP Navigation Quick Links */}
                  <List component="nav" sx={{ p: 0.75, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
                    <ListItemButton
                      sx={{ borderRadius: 1.5, py: 0.75 }}
                      onClick={() => {
                        navigate('/dashboard/default');
                        setOpen(false);
                      }}
                    >
                      <ListItemIcon>
                        <DashboardOutlined style={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2" fontWeight={600}>Main Dashboard</Typography>} />
                    </ListItemButton>

                    {userRole === 'Super Admin' && (
                      <ListItemButton
                        sx={{ borderRadius: 1.5, py: 0.75 }}
                        onClick={() => {
                          navigate('/inventory/user-management');
                          setOpen(false);
                        }}
                      >
                        <ListItemIcon>
                          <TeamOutlined style={{ fontSize: 16 }} />
                        </ListItemIcon>
                        <ListItemText primary={<Typography variant="body2" fontWeight={600}>Staff & Access Control</Typography>} />
                      </ListItemButton>
                    )}

                    <ListItemButton
                      sx={{ borderRadius: 1.5, py: 0.75 }}
                      onClick={() => {
                        navigate('/inventory/backup-restore');
                        setOpen(false);
                      }}
                    >
                      <ListItemIcon>
                        <CloudSyncOutlined style={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2" fontWeight={600}>Data Backup & Cloud</Typography>} />
                    </ListItemButton>
                  </List>

                  <Divider />

                  {/* Sign Out Action Button */}
                  <Box sx={{ p: 0.75 }}>
                    <ListItemButton
                      sx={{
                        borderRadius: 1.5,
                        py: 0.75,
                        color: 'error.main',
                        '&:hover': { bgcolor: 'error.lighter' }
                      }}
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                    >
                      <ListItemIcon sx={{ color: 'inherit' }}>
                        <LogoutOutlined style={{ fontSize: 16 }} />
                      </ListItemIcon>
                      <ListItemText primary={<Typography variant="body2" fontWeight={700}>Sign Out</Typography>} />
                    </ListItemButton>
                  </Box>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
