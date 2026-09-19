import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

// assets
import LockOutlined from '@ant-design/icons/LockOutlined';
import DashboardOutlined from '@ant-design/icons/DashboardOutlined';
import RollbackOutlined from '@ant-design/icons/RollbackOutlined';

// hooks & components
import usePermission from 'hooks/usePermission';
import MainCard from 'components/MainCard';

/**
 * ==============================================================================
 * 🛡️ RoleGuard Component
 * ==============================================================================
 * Route-level & component-level access gatekeeper.
 * Ensures users without appropriate roles or permission flags cannot access
 * unauthorized views via direct URL typing or client navigation.
 *
 * - Super Admin always bypasses all restrictions.
 * - Admin has full operational access except user management & system backup.
 * - Store Keeper has restricted floor/counter-only access.
 */
export default function RoleGuard({ permission, allowedRoles, children, fallback }) {
  const navigate = useNavigate();
  const { role, userPerms, isSuperAdmin } = usePermission();

  // 1. Super Admin has unrestricted access everywhere
  if (isSuperAdmin) {
    return children;
  }

  // 2. Check Role-level whitelist if specified
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return fallback || <AccessDeniedView role={role} reason={`Exclusive to [${allowedRoles.join(', ')}]`} navigate={navigate} />;
    }
  }

  // 3. Check Module Permission Flag if specified
  if (permission && !userPerms?.[permission]) {
    return fallback || <AccessDeniedView role={role} permissionKey={permission} navigate={navigate} />;
  }

  // Access granted
  return children;
}

RoleGuard.propTypes = {
  permission: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node
};

/**
 * Polished, user-friendly fallback view when access is prohibited.
 */
function AccessDeniedView({ role, permissionKey, reason, navigate }) {
  const readableTitle = permissionKey
    ? permissionKey.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : reason || 'Restricted Section';

  return (
    <Box sx={{ p: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <MainCard
        sx={{
          maxWidth: 580,
          width: '100%',
          textAlign: 'center',
          boxShadow: 3,
          border: '1px solid',
          borderColor: 'error.light',
          borderRadius: 3
        }}
      >
        <Stack spacing={3} alignItems="center" sx={{ py: 3, px: { xs: 1, sm: 2 } }}>
          {/* Lock Icon */}
          <Paper
            elevation={0}
            sx={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              bgcolor: 'error.lighter',
              color: 'error.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem'
            }}
          >
            <LockOutlined style={{ fontSize: 38 }} />
          </Paper>

          {/* Heading */}
          <Box>
            <Typography variant="h3" fontWeight={800} color="error.main" gutterBottom>
              Access Restricted
            </Typography>
            <Typography variant="h6" fontWeight={600} color="textSecondary">
              رسائی محدود ہے — اجازت درکار ہے
            </Typography>
          </Box>

          {/* Role & Context Info */}
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              width: '100%',
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f9fafb'),
              borderRadius: 2,
              textAlign: 'left'
            }}
          >
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} color="textSecondary">
                  CURRENT ROLE:
                </Typography>
                <Chip
                  label={role}
                  color={role === 'Admin' ? 'info' : role === 'Store Keeper' ? 'warning' : 'primary'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} color="textSecondary">
                  REQUIRED PERMISSION:
                </Typography>
                <Chip label={readableTitle} color="error" variant="outlined" size="small" sx={{ fontWeight: 700 }} />
              </Stack>
            </Stack>
          </Paper>

          <Typography variant="body2" color="textSecondary">
            Your current user account does not have authorization to view this module. If you require access, please contact the <strong>Super Admin</strong>.
          </Typography>

          {/* Navigation Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%', pt: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              startIcon={<RollbackOutlined />}
              onClick={() => navigate(-1)}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Go Back
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<DashboardOutlined />}
              onClick={() => navigate('/dashboard/default')}
              sx={{ fontWeight: 700, borderRadius: 2 }}
            >
              Go to Dashboard
            </Button>
          </Stack>
        </Stack>
      </MainCard>
    </Box>
  );
}

AccessDeniedView.propTypes = {
  role: PropTypes.string,
  permissionKey: PropTypes.string,
  reason: PropTypes.string,
  navigate: PropTypes.func.isRequired
};
