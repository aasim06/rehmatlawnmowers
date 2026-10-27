import { Navigate } from 'react-router-dom';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// project imports
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthCard from 'sections/auth/AuthCard';
import AuthLogin from 'sections/auth/AuthLogin';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';
import { useAuth } from 'context/AuthContext';

// assets
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';

// ================================|| STORE PORTAL - LOGIN ||================================ //

export default function Login() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthWrapper>
      {/* Brand Hero Header */}
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 3.5, textAlign: 'center' }}>
        <Box
          sx={{
            width: 88,
            height: 88,
            minWidth: 88,
            minHeight: 88,
            maxWidth: 88,
            maxHeight: 88,
            borderRadius: '50%',
            p: '4px',
            bgcolor: '#ffffff',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.22)',
            border: '2.5px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          <Box
            component="img"
            src={rehmatLogo}
            alt="Rehmat Lawn Mowers Logo"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              borderRadius: '50%',
              display: 'block'
            }}
          />
        </Box>
        <Box>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              fontSize: { xs: '1.45rem', sm: '1.75rem' }
            }}
          >
            Rehmat Lawn Mowers
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.5,
              fontWeight: 500,
              fontSize: { xs: '0.85rem', sm: '0.9rem' }
            }}
          >
            Factory Store, Inventory & Billing System
          </Typography>
        </Box>
      </Stack>

      {/* Login Card */}
      <AuthCard>
        <Stack spacing={2.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.35rem' }}>
              Sign In
            </Typography>
            <Chip
              icon={<SafetyCertificateOutlined style={{ fontSize: 13 }} />}
              label="Staff Portal"
              size="small"
              color="success"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.72rem', height: 24 }}
            />
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: -1.5, fontSize: '0.85rem' }}>
            Enter your authorized account credentials to continue.
          </Typography>

          <AuthLogin />
        </Stack>
      </AuthCard>
    </AuthWrapper>
  );
}
