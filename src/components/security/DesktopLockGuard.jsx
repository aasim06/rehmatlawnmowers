import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  LockOutlined,
  ReloadOutlined,
  WhatsAppOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined
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
    'Hello, I am using the Rehmat Lawn Mowers desktop software. Please activate my application license.'
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
        bgcolor: 'rgba(9, 13, 22, 0.94)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        userSelect: 'none'
      }}
    >
      <Card
        sx={{
          maxWidth: 540,
          width: '100%',
          bgcolor: '#0f172a',
          color: '#f8fafc',
          borderRadius: 3,
          border: '1px solid rgba(239, 68, 68, 0.35)',
          boxShadow: '0 25px 60px -15px rgba(239, 68, 68, 0.3), 0 0 40px rgba(0,0,0,0.8)',
          textAlign: 'center',
          p: { xs: 2.5, sm: 4 },
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle top glow line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)'
          }}
        />

        <Stack alignItems="center" spacing={2.5}>
          {/* Logo & Shield Icon */}
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <LogoIcon />
            <Box
              sx={{
                position: 'absolute',
                bottom: -6,
                right: -6,
                bgcolor: '#ef4444',
                color: '#fff',
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
              }}
            >
              <LockOutlined style={{ fontSize: 13 }} />
            </Box>
          </Box>

          {/* Status Chip */}
          <Chip
            icon={<SafetyCertificateOutlined style={{ color: '#ef4444' }} />}
            label={isOfflineExpired ? 'OFFLINE SECURITY LOCK' : 'APPLICATION LICENSE INACTIVE'}
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.06em'
            }}
          />

          {/* Title */}
          <Box>
            <Typography variant="h3" fontWeight={700} sx={{ color: '#f8fafc', mb: 1, fontSize: { xs: '1.4rem', sm: '1.75rem' } }}>
              {isOfflineExpired ? 'Security Verification Required' : (securityConfig.lockTitle || 'License Verification Required')}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', lineHeight: 1.6, px: { xs: 0, sm: 2 } }}>
              {isOfflineExpired
                ? 'Your desktop installation has been offline beyond the permitted grace period. Please connect to the internet to verify and activate your software license.'
                : (securityConfig.lockMessage || 'Your desktop software license is temporarily pending authorization. Please contact the administrator to continue.')}
            </Typography>
          </Box>

          {/* Developer Contact Card */}
          <Box
            sx={{
              width: '100%',
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Authorized Software Administrator
            </Typography>
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#38bdf8', mt: 0.5 }}>
              {securityConfig.contactPerson || 'System Administrator'}
            </Typography>
            {securityConfig.contactPhone && (
              <Typography variant="body2" sx={{ color: '#e2e8f0', mt: 0.25, fontWeight: 600 }}>
                📞 {securityConfig.contactPhone}
              </Typography>
            )}
          </Box>

          {/* Contact & Verification Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
            {securityConfig.contactPhone && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<WhatsAppOutlined />}
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                sx={{
                  bgcolor: '#22c55e',
                  color: '#ffffff',
                  fontWeight: 600,
                  py: 1.2,
                  '&:hover': { bgcolor: '#16a34a' }
                }}
              >
                Contact via WhatsApp
              </Button>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={checking ? <CircularProgress size={16} color="inherit" /> : <ReloadOutlined />}
              onClick={handleManualCheck}
              disabled={checking}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#f8fafc',
                py: 1.2,
                fontWeight: 600,
                '&:hover': { borderColor: '#38bdf8', bgcolor: 'rgba(56, 189, 248, 0.1)' }
              }}
            >
              {checking ? 'Checking...' : 'Re-check Activation'}
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
            System checks activation automatically every 15 seconds. Once unlocked by admin, this window will automatically dismiss.
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
