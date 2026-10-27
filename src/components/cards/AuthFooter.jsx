// material-ui
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ContainerWrapper from 'components/ContainerWrapper';

// ==============================|| FOOTER - AUTHENTICATION ||============================== //

export default function AuthFooter() {
  return (
    <ContainerWrapper>
      <Box sx={{ py: 2.5, px: { xs: 1, sm: 2 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            gap: 1.5,
            alignItems: 'center',
            justifyContent: 'space-between',
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            &copy; {new Date().getFullYear()}{' '}
            <Typography component="span" variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
              Rehmat Lawn Mowers
            </Typography>
            . Factory Store & Inventory Management System.
          </Typography>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Chip
              size="small"
              label="Cloud Sync Active"
              color="success"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22, fontWeight: 600 }}
            />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              Enterprise Edition
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </ContainerWrapper>
  );
}
