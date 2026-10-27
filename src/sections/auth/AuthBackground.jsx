// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';

// ==============================|| AUTH BACKGROUND - MODERN ERP ||============================== //

export default function AuthBackground() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: isDark
          ? 'radial-gradient(circle at 50% 10%, rgba(16, 185, 129, 0.12) 0%, transparent 50%), radial-gradient(circle at 90% 90%, rgba(99, 102, 241, 0.08) 0%, transparent 45%), #090d16'
          : 'radial-gradient(circle at 50% 10%, rgba(16, 185, 129, 0.10) 0%, transparent 55%), radial-gradient(circle at 90% 90%, rgba(14, 165, 233, 0.07) 0%, transparent 45%), #f8fafc',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: isDark
            ? 'radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px)'
            : 'radial-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }
      }}
    />
  );
}
