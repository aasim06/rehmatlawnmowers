import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'components/MainCard';

// ==============================|| AUTHENTICATION - CARD WRAPPER ||============================== //

export default function AuthCard({ children, ...other }) {
  const theme = useTheme();

  return (
    <MainCard
      sx={{
        width: '100%',
        maxWidth: 460,
        margin: '0 auto',
        borderRadius: { xs: 3, sm: 4 },
        border: '1px solid',
        borderColor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)'),
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.65)'
            : '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        bgcolor: 'background.paper',
        '& > *': { flexGrow: 1, flexBasis: '100%' }
      }}
      content={false}
      {...other}
      border={false}
      boxShadow
    >
      <Box sx={{ p: { xs: 2.75, sm: 4 } }}>{children}</Box>
    </MainCard>
  );
}

AuthCard.propTypes = { children: PropTypes.any, other: PropTypes.any };
