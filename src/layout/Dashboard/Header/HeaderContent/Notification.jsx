import { useRef, useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { useAuth } from 'context/AuthContext';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

// project imports
import MainCard from 'components/MainCard';
import IconButton from 'components/@extended/IconButton';
import Transitions from 'components/@extended/Transitions';

// assets
import BellOutlined from '@ant-design/icons/BellOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import ImportOutlined from '@ant-design/icons/ImportOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import MessageOutlined from '@ant-design/icons/MessageOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import SendOutlined from '@ant-design/icons/SendOutlined';

const avatarSX = {
  width: 36,
  height: 36,
  fontSize: '1rem'
};

const actionSX = {
  mt: '6px',
  ml: 1,
  top: 'auto',
  right: 'auto',
  alignSelf: 'flex-start',
  transform: 'none'
};

export default function Notification() {
  const downMD = useMediaQuery((theme) => theme.breakpoints.down('md'));
  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);

  const {
    notifications = [],
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  } = useStoreInventory();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case 'stock-out':
        return <ExportOutlined />;
      case 'stock-in':
        return <ImportOutlined />;
      case 'alert':
      case 'request':
        return <WarningOutlined />;
      default:
        return <SendOutlined />;
    }
  };

  const getNotifAvatarColor = (type) => {
    switch (type) {
      case 'stock-out':
        return { color: 'warning.main', bgcolor: 'warning.lighter' };
      case 'stock-in':
        return { color: 'success.main', bgcolor: 'success.lighter' };
      case 'alert':
      case 'request':
        return { color: 'error.main', bgcolor: 'error.lighter' };
      default:
        return { color: 'primary.main', bgcolor: 'primary.lighter' };
    }
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 0.75 }}>
      <IconButton
        color="secondary"
        variant="light"
        sx={{
          color: 'text.primary',
          bgcolor: open ? 'action.hover' : 'transparent'
        }}
        aria-label="notifications"
        ref={anchorRef}
        aria-controls={open ? 'notification-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        <Badge badgeContent={unreadCount} color="error">
          <BellOutlined />
        </Badge>
      </IconButton>

      <Popper
        placement={downMD ? 'bottom' : 'bottom-end'}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{ modifiers: [{ name: 'offset', options: { offset: [downMD ? -5 : 0, 9] } }] }}
      >
        {({ TransitionProps }) => (
          <Transitions type="grow" position={downMD ? 'top' : 'top-right'} in={open} {...TransitionProps}>
            <Paper sx={{ boxShadow: (theme) => theme.customShadows.z1, width: '100%', minWidth: 320, maxWidth: { xs: 320, md: 440 } }}>
              <ClickAwayListener onClickAway={handleClose}>
                <MainCard
                  title={`Notifications (${unreadCount} Unread)`}
                  elevation={0}
                  border={false}
                  content={false}
                  secondary={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {unreadCount > 0 && (
                        <Tooltip title="Mark all as read">
                          <IconButton color="success" size="small" onClick={markAllNotificationsRead}>
                            <CheckCircleOutlined style={{ fontSize: '1.15rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {notifications.length > 0 && (
                        <Tooltip title="Clear all notifications">
                          <IconButton color="error" size="small" onClick={clearNotifications}>
                            <DeleteOutlined style={{ fontSize: '1.15rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  }
                >
                  <List
                    component="nav"
                    sx={{
                      p: 0,
                      maxHeight: 380,
                      overflowY: 'auto',
                      '& .MuiListItemButton-root': {
                        py: 1,
                        px: 2,
                        '&.Mui-selected': { bgcolor: 'action.hover', color: 'text.primary' },
                        '& .MuiAvatar-root': avatarSX,
                        '& .MuiListItemSecondaryAction-root': { ...actionSX, position: 'relative' }
                      }
                    }}
                  >
                    {notifications.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body2" color="textSecondary">
                          No notifications yet.
                        </Typography>
                      </Box>
                    ) : (
                      notifications.map((notif) => {
                        const avatarStyle = getNotifAvatarColor(notif.type);

                        return (
                          <ListItem
                            key={notif.id}
                            component={ListItemButton}
                            divider
                            selected={!notif.read}
                            onClick={() => markNotificationRead(notif.id)}
                            secondaryAction={
                              <Typography variant="caption" color="textSecondary" noWrap>
                                {notif.timestamp}
                              </Typography>
                            }
                          >
                            <ListItemAvatar>
                              <Avatar sx={avatarStyle}>{getNotifIcon(notif.type)}</Avatar>
                            </ListItemAvatar>

                            <ListItemText
                              primary={
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={700}>
                                    {notif.title}
                                  </Typography>
                                  <Typography variant="caption" color="primary.main" fontWeight={600} display="block">
                                    From: {notif.senderName || 'Store Keeper'} ({notif.senderRole || 'Staff'})
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                  {notif.message}
                                </Typography>
                              }
                            />
                          </ListItem>
                        );
                      })
                    )}
                  </List>
                </MainCard>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </Box>
  );
}
