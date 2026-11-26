// material-ui
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1.5,
        alignItems: 'center',
        justifyContent: 'space-between',
        pt: 3,
        px: 2,
        mt: 'auto'
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        &copy; All rights reserved{' '}
        <Typography component="span" variant="caption" sx={{ color: 'primary.main', fontWeight: 700 }}>
          Rehmat Lawn Mowers
        </Typography>
      </Typography>
    </Box>
  );
}
