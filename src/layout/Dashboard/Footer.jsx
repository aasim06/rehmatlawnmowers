// material-ui
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ gap: 1.5, alignItems: 'center', justifyContent: 'space-between', p: '24px 16px 0px', mt: 'auto' }}
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        &copy; All rights reserved{' '}
        <Typography component="span" variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
          Rehmat Lawn Mowers
        </Typography>
      </Typography>
    </Stack>
  );
}
