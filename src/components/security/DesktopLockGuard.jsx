import { useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  LockOutlined,
  ReloadOutlined,
  WhatsAppOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { useAppSecurity } from 'context/AppSecurityContext';
import LogoIcon from 'components/logo/LogoIcon';

export default function DesktopLockGuard() {
  const { isAppLocked, securityConfig, refreshSecurityConfig, isOfflineExpired } = useAppSecurity();
  const [checking, setChecking] = useState(false);

  if (!isAppLocked) return null;

  const handleManualCheck = async () => {
    setChecking(true);
    await refreshSecurityConfig();
    setTimeout(() => setChecking(false), 800);
  };

  const cleanPhone = (securityConfig.contactPhone || '').replace(/[^0-9+]/g, '');
  const waUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(
    'Hello, I am using the Rehmat Lawn Mowers desktop software. Please activate my workstation license.'
  )}`;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999999,
        background: 'radial-gradient(ellipse at 50% 25%, #172554 0%, #0a0f1d 70%, #030712 100%)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        userSelect: 'none'
      }}
    >
      <Card
        sx={{
          maxWidth: 560,
          width: '100%',
          background: 'linear-gradient(160deg, rgba(23, 37, 84, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%)',
          backdropFilter: 'blur(30px)',
          color: '#f8fafc',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.8), 0 0 50px rgba(59, 130, 246, 0.15)',
          p: { xs: 3, sm: 4.5 },
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center'
        }}
      >
        {/* Top elegant accent light strip */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: '10%',
            right: '10%',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, rgba(56, 189, 248, 0.8), transparent)'
          }}
        />

        <Stack alignItems="center" spacing={3}>
          {/* Official Logo with Glowing Shield Badge */}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.98)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px -5px rgba(56, 189, 248, 0.4), 0 0 0 4px rgba(255, 255, 255, 0.1)'
              }}
            >
              <LogoIcon />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                bgcolor: '#f59e0b',
                color: '#0f172a',
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.5)',
                border: '2px solid #0f172a'
              }}
            >
              <LockOutlined style={{ fontSize: 13, fontWeight: 'bold' }} />
            </Box>
          </Box>

          {/* Status Chip */}
          <Chip
            icon={<SafetyCertificateOutlined style={{ color: '#f59e0b', fontSize: 14 }} />}
            label={isOfflineExpired ? 'OFFLINE SECURITY LIMIT' : 'LICENSE ACTIVATION REQUIRED'}
            sx={{
              bgcolor: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontWeight: 700,
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              px: 1,
              py: 0.5
            }}
          />

          {/* Heading & Notice Message */}
          <Box>
            <Typography
              variant="h3"
              sx={{
                color: '#ffffff',
                fontWeight: 800,
                fontSize: { xs: '1.45rem', sm: '1.75rem' },
                letterSpacing: '-0.02em',
                mb: 1.2
              }}
            >
              {isOfflineExpired ? 'Workstation Offline Verification' : (securityConfig.lockTitle || 'Application License Verification Required')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#94a3b8',
                lineHeight: 1.65,
                fontSize: '0.92rem',
                maxWidth: 460,
                mx: 'auto'
              }}
            >
              {isOfflineExpired
                ? 'This workstation has been operating offline beyond the approved grace window. Connect to the internet to verify your license and resume operations.'
                : (securityConfig.lockMessage || 'Your workstation license is currently pending activation or authorization. Please contact the administrator below to enable access.')}
            </Typography>
          </Box>

          {/* Contact Administrator Glass Panel */}
          <Box
            sx={{
              width: '100%',
              p: 2.5,
              borderRadius: 3,
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              textAlign: 'left'
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <CustomerServiceOutlined style={{ color: '#38bdf8', fontSize: 18 }} />
              <Typography
                variant="caption"
                sx={{
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}
              >
                Authorized Software Support
              </Typography>
            </Stack>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 1.5 }} />

            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Administrator
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f1f5f9' }}>
                  {securityConfig.contactPerson || 'Software Administrator'}
                </Typography>
              </Box>

              {securityConfig.contactPhone && (
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Helpline / Phone
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#38bdf8' }}>
                    {securityConfig.contactPhone}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
            {securityConfig.contactPhone && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<WhatsAppOutlined style={{ fontSize: 18 }} />}
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                sx={{
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  py: 1.3,
                  borderRadius: 2.5,
                  boxShadow: '0 8px 20px -4px rgba(34, 197, 94, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    boxShadow: '0 10px 25px -4px rgba(34, 197, 94, 0.6)'
                  }
                }}
              >
                Contact via WhatsApp
              </Button>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={checking ? <CircularProgress size={16} color="inherit" /> : <ReloadOutlined style={{ fontSize: 16 }} />}
              onClick={handleManualCheck}
              disabled={checking}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#f8fafc',
                py: 1.3,
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRadius: 2.5,
                background: 'rgba(255, 255, 255, 0.03)',
                '&:hover': {
                  borderColor: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8'
                }
              }}
            >
              {checking ? 'Checking Status...' : 'Re-check Activation'}
            </Button>
          </Stack>

          {/* Auto-dismissing real-time subtext */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: '#22c55e',
                boxShadow: '0 0 10px #22c55e',
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
              Automatic cloud handshake active (15s). Once unlocked by admin, this window dismisses instantly.
            </Typography>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}
