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
        width: 44,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        boxShadow: 'none',
        overflow: 'hidden'
      }}
    >
      <Box
        component="img"
        src={transparentLogoSrc}
        alt="Rehmat Lawn Mowers Logo"
        sx={{
          height: isDark ? 36 : 44,
          width: isDark ? 36 : 44,
          objectFit: 'contain',
          borderRadius: '50%',
          display: 'block',
          margin: '0 auto'
        }}
      />
    </Box>
  );
}

