import PropTypes from 'prop-types';
import { useRef, useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import CardContent from '@mui/material/CardContent';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// project imports
import ProfileTab from './ProfileTab';
import SettingTab from './SettingTab';
import Avatar from 'components/@extended/Avatar';
import MainCard from 'components/MainCard';
import Transitions from 'components/@extended/Transitions';
import IconButton from 'components/@extended/IconButton';
import { useAuth } from 'context/AuthContext';

// assets
import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import CrownOutlined from '@ant-design/icons/CrownOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import avatar1 from 'assets/images/users/avatar-1.png';

// tab panel wrapper
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`profile-tabpanel-${index}`} aria-labelledby={`profile-tab-${index}`} {...other}>
      {value === index && children}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`
  };
}

// ==============================|| HEADER CONTENT - PROFILE ||============================== //

export default function Profile() {
  const theme = useTheme();
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

  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const userEmail = user?.email || 'admin@rehmat.com';
  const userRole = user?.role || 'Super Admin';
  const isSuperAdminUser = userRole === 'Super Admin' || userEmail.toLowerCase() === 'admin@rehmat.com' || user?.id === 'USR-1';

  return (
    <Box sx={{ flexShrink: 0, ml: 'auto' }}>
      <Tooltip title="Profile" disableInteractive>
        <ButtonBase
          sx={(theme) => ({
            p: 0.25,
            borderRadius: 1,
            '&:focus-visible': { outline: `2px solid ${theme.vars.palette.secondary.dark}`, outlineOffset: 2 }
          })}
          aria-label="open profile"
          ref={anchorRef}
          aria-controls={open ? 'profile-grow' : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ p: 0.5 }}>
            <Avatar alt="profile user" src={avatar1} size="sm" sx={{ '&:hover': { outline: '1px solid', outlineColor: 'primary.main' } }} />
            <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
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
                offset: [0, 9]
              }
            }
          ]
        }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position="top-right" in={open} {...TransitionProps}>
            <Paper sx={(theme) => ({ boxShadow: theme.vars.customShadows.z1, width: 310, minWidth: 260, maxWidth: { xs: 280, md: 310 } })}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard elevation={0} border={false} content={false}>
                  <CardContent sx={{ px: 2.5, pt: 3, pb: 2 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stack direction="row" sx={{ gap: 1.25, alignItems: 'center' }}>
                        <Avatar alt="profile user" src={avatar1} sx={{ width: 36, height: 36 }} />
                        <Stack>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ wordBreak: 'break-all' }}>
                            {user?.name || userEmail}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Chip
                              size="small"
                              label={userRole}
                              color={userRole === 'Super Admin' ? 'primary' : userRole === 'Admin' ? 'info' : 'warning'}
                              sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                            />
                          </Stack>
                        </Stack>
                      </Stack>
                      <Tooltip title="Logout">
                        <IconButton size="large" sx={{ color: 'text.primary' }} onClick={logout}>
                          <LogoutOutlined />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    {/* 👑 Role Switcher for Super Admin Testing */}
                    {isSuperAdminUser && userRole === 'Super Admin' && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                        <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                          👑 PREVIEW ROLE DASHBOARD:
                        </Typography>
                        <Stack spacing={1}>
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
                            sx={{ fontWeight: 700, justifyContent: 'flex-start', py: 0.5 }}
                          >
                            Preview As Store Admin
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
                            sx={{ fontWeight: 700, justifyContent: 'flex-start', py: 0.5 }}
                          >
                            Preview As Store Keeper
                          </Button>
                        </Stack>
                      </Box>
                    )}

                    {/* Return to Super Admin Button if owner switched roles */}
                    {isSuperAdminUser && userRole !== 'Super Admin' && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
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
                          sx={{ fontWeight: 700, py: 0.75 }}
                        >
                          Restore Super Admin
                        </Button>
                      </Box>
                    )}
                  </CardContent>

                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs variant="fullWidth" value={value} onChange={handleChange} aria-label="profile tabs">
                      <Tab
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textTransform: 'capitalize',
                          gap: 1.25,
                          '& .MuiTab-icon': {
                            marginBottom: 0
                          }
                        }}
                        icon={<UserOutlined />}
                        label="Profile"
                        {...a11yProps(0)}
                      />
                      <Tab
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textTransform: 'capitalize',
                          gap: 1.25,
                          '& .MuiTab-icon': {
                            marginBottom: 0
                          }
                        }}
                        icon={<SettingOutlined />}
                        label="Setting"
                        {...a11yProps(1)}
                      />
                    </Tabs>
                  </Box>
                  <TabPanel value={value} index={0} dir={theme.direction}>
                    <ProfileTab />
                  </TabPanel>
                  <TabPanel value={value} index={1} dir={theme.direction}>
                    <SettingTab />
                  </TabPanel>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}

TabPanel.propTypes = { children: PropTypes.node, value: PropTypes.number, index: PropTypes.number, other: PropTypes.any };
