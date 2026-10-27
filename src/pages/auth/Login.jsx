import { Navigate } from 'react-router-dom';

// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import AuthWrapper from 'sections/auth/AuthWrapper';
import AuthCard from 'sections/auth/AuthCard';
import AuthLogin from 'sections/auth/AuthLogin';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';
import { useAuth } from 'context/AuthContext';

// ================================|| STORE PORTAL - LOGIN ||================================ //

export default function Login() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthWrapper>
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Centered Logo Outside Card */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Box
            sx={{
              width: 90,
              height: 90,
              minWidth: 90,
              minHeight: 90,
              maxWidth: 90,
              maxHeight: 90,
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
        </Box>

        {/* Login Card */}
        <AuthCard>
          <Stack spacing={2.5}>
            <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '1.45rem' }}>
              Sign In
            </Typography>

            <AuthLogin />
          </Stack>
        </AuthCard>
      </Box>
    </AuthWrapper>
  );
}
