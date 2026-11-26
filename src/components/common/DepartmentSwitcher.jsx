import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// icons
import BuildOutlined from '@ant-design/icons/BuildOutlined';
import DatabaseOutlined from '@ant-design/icons/DatabaseOutlined';
import ShopOutlined from '@ant-design/icons/ShopOutlined';

// project imports
import usePermission from 'hooks/usePermission';

const MODE_CONFIG = {
  dashboard: {
    caption: 'Switch Department View',
    tabs: [
      { key: 'factory-store', label: 'Factory Store', url: '/dashboard/default', permissionId: 'dashboard', icon: DatabaseOutlined },
      {
        key: 'machine-production',
        label: 'Machine Production',
        url: '/inventory/machine-dashboard',
        permissionId: 'machine-sales',
        icon: BuildOutlined
      },
      { key: 'shop-mart', label: 'Retail Shop Mart', url: '/shop/dashboard', permissionId: 'shop-dashboard', icon: ShopOutlined }
    ]
  },
  ledger: {
    caption: 'Switch Module Ledger',
    tabs: [
      { key: 'factory-store', label: 'Factory Store Ledger', url: '/inventory/store-ledger', permissionId: 'store-ledger', icon: DatabaseOutlined },
      {
        key: 'machine-production',
        label: 'Machine Customer Ledger',
        url: '/inventory/customer-ledgers',
        permissionId: 'customer-ledgers',
        icon: BuildOutlined
      },
      { key: 'shop-mart', label: 'Shop Customer Ledger', url: '/shop/ledger', permissionId: 'shop-ledger', icon: ShopOutlined }
    ]
  }
};

/**
 * Shared 3-Department segmented switcher used across Dashboards and History & Ledgers
 * so users can move between Factory Store, Machine Production, and Shop Mart from one place.
 */
export default function DepartmentSwitcher({ mode = 'dashboard', activeDepartment }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasAccessToItem } = usePermission();
  const isDark = theme.palette.mode === 'dark';

  const config = MODE_CONFIG[mode] || MODE_CONFIG.dashboard;

  const visibleTabs = useMemo(() => {
    return config.tabs.filter((tab) => hasAccessToItem({ id: tab.permissionId, url: tab.url }));
  }, [config.tabs, hasAccessToItem]);

  if (visibleTabs.length <= 1) return null;

  return (
    <Box
      sx={{
        mt: 2,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 1.5
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {config.caption}
      </Typography>

      <Box
        sx={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          gap: 0.5,
          p: 0.5,
          borderRadius: 2.5,
          bgcolor: isDark ? '#1d2939' : '#f2f4f7',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {visibleTabs.map((dept) => {
          const IconComp = dept.icon;
          const isActive = activeDepartment === dept.key;
          return (
            <Button
              key={dept.key}
              size="small"
              startIcon={<IconComp style={{ fontSize: '0.85rem' }} />}
              onClick={() => {
                if (!isActive) navigate(dept.url);
              }}
              sx={{
                height: 32,
                px: 1.75,
                py: 0.5,
                borderRadius: 2,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: isActive ? (isDark ? '#101828' : '#ffffff') : 'transparent',
                color: isActive ? (isDark ? '#8098f9' : 'primary.main') : 'text.secondary',
                boxShadow: isActive ? (isDark ? '0 1px 4px rgba(0,0,0,0.45)' : '0 1px 2px rgba(16, 24, 40, 0.08)') : 'none',
                '&:hover': {
                  bgcolor: isActive ? (isDark ? '#101828' : '#ffffff') : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)',
                  color: isActive ? (isDark ? '#8098f9' : 'primary.main') : 'text.primary'
                }
              }}
            >
              {dept.label}
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

DepartmentSwitcher.propTypes = {
  mode: PropTypes.oneOf(['dashboard', 'ledger']),
  activeDepartment: PropTypes.oneOf(['factory-store', 'machine-production', 'shop-mart']).isRequired
};
