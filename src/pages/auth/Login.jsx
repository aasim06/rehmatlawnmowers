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
      <AuthCard>
        <Stack spacing={2.5} alignItems="center">
          {/* Centered Logo on top of Form */}
          <Box
            sx={{
              width: 84,
              height: 84,
              minWidth: 84,
              minHeight: 84,
              maxWidth: 84,
              maxHeight: 84,
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

          <Typography variant="h3" sx={{ fontWeight: 700, fontSize: '1.45rem', textAlign: 'center' }}>
            Sign In
          </Typography>

          <Box sx={{ width: '100%' }}>
            <AuthLogin />
          </Box>
        </Stack>
      </AuthCard>
    </AuthWrapper>
  );
}
