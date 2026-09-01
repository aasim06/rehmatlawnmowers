import { useLocation, useNavigate } from 'react-router-dom';
import usePermission from 'hooks/usePermission';
import { useAuth } from 'context/AuthContext';

// material-ui
import { Paper, BottomNavigation, BottomNavigationAction, Box } from '@mui/material';

// icons
import {
  ExportOutlined,
  ImportOutlined,
  DatabaseOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined
} from '@ant-design/icons';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAccessToItem, isSuperAdmin } = usePermission();
  const { user } = useAuth();

  const currentPath = location.pathname;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      value: '/dashboard/default',
      icon: <DashboardOutlined style={{ fontSize: '1.25rem' }} />,
      show: hasAccessToItem({ id: 'dashboard' })
    },
    {
      id: 'stock-out',
      label: 'Stock Out',
      value: '/inventory/stock-out',
      icon: <ExportOutlined style={{ fontSize: '1.25rem' }} />,
      show: hasAccessToItem({ id: 'stock-out' })
    },
    {
      id: 'stock-in',
      label: 'Stock In',
      value: '/inventory/stock-in',
      icon: <ImportOutlined style={{ fontSize: '1.25rem' }} />,
      show: hasAccessToItem({ id: 'stock-in' })
    },
    {
      id: 'items',
      label: 'Items',
      value: '/inventory/items',
      icon: <DatabaseOutlined style={{ fontSize: '1.25rem' }} />,
      show: hasAccessToItem({ id: 'items' })
    },
    {
      id: 'user-management',
      label: 'Admin',
      value: '/admin/users',
      icon: <SafetyCertificateOutlined style={{ fontSize: '1.25rem' }} />,
      show: isSuperAdmin || hasAccessToItem({ id: 'user-management' })
    }
  ].filter((item) => item.show);

  return (
    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1250,
          borderRadius: 0,
          borderTop: '1px solid',
          borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'divider'),
          bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'),
          backdropFilter: 'blur(12px)',
          pb: 'safe'
        }}
      >
        <BottomNavigation
          showLabels
          value={currentPath}
          onChange={(event, newValue) => {
            if (newValue) {
              navigate(newValue);
            }
          }}
          sx={{
            bgcolor: 'transparent',
            height: 62,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              px: 1,
              py: 0.75,
              color: 'text.secondary',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 700
              }
            }
          }}
        >
          {navItems.map((item) => (
            <BottomNavigationAction key={item.id} label={item.label} value={item.value} icon={item.icon} />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
