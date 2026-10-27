import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';

// project imports
import AuthFooter from 'components/cards/AuthFooter';

// assets
import AuthBackground from './AuthBackground';

// ==============================|| AUTHENTICATION - WRAPPER ||============================== //

export default function AuthWrapper({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      <AuthBackground />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 3 },
          py: { xs: 4, sm: 6 }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 460 }}>{children}</Box>
      </Box>
      <AuthFooter />
    </Box>
  );
}

AuthWrapper.propTypes = { children: PropTypes.node };
