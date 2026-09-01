import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import rehmatLogo from 'assets/images/rehmat-logo.jpg';
import { useTransparentLogo } from './LogoMain';

// ==============================|| LOGO ICON ||============================== //

export default function LogoIcon() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const transparentLogoSrc = useTransparentLogo(rehmatLogo);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        p: isDark ? 0.5 : 0,
        boxShadow: 'none'
      }}
    >
      <Box
        component="img"
        src={transparentLogoSrc}
        alt="Rehmat Lawn Mowers Logo"
        sx={{
          height: 44,
          width: 44,
          objectFit: 'contain',
          borderRadius: '50%',
          display: 'block',
          margin: '0 auto'
        }}
      />
    </Box>
  );
}

