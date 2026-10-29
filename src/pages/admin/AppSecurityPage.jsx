import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Divider,
  Paper,
  InputAdornment
} from '@mui/material';
import {
  LockOutlined,
  UnlockOutlined,
  SafetyCertificateOutlined,
  WhatsAppOutlined,
  PhoneOutlined,
  CloudSyncOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EyeOutlined
} from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { useAppSecurity } from 'context/AppSecurityContext';
import { isTauriApp } from 'utils/platform';

export default function AppSecurityPage() {
  const isTauri = isTauriApp();
  const { securityConfig, updateSecurityConfig, refreshSecurityConfig, loading } = useAppSecurity();

  const [formData, setFormData] = useState({
    lockTitle: securityConfig.lockTitle || 'Application License Verification Required',
    lockMessage: securityConfig.lockMessage || 'Your application license has been temporarily locked or requires activation. Please contact the software administrator or developer to activate your license.',
    contactPhone: securityConfig.contactPhone || '+92 300 0000000',
    contactPerson: securityConfig.contactPerson || 'Software Developer',
    allowedOfflineHours: securityConfig.allowedOfflineHours || 72
  });

  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const isLocked = Boolean(securityConfig.isLocked);

  const handleToggleLock = async (newLockState) => {
    const res = await updateSecurityConfig({
      ...formData,
      isLocked: newLockState
    });
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
    setConfirmLockOpen(false);
    setConfirmUnlockOpen(false);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const res = await updateSecurityConfig(formData);
    if (res?.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', pb: 5 }}>
      {/* Executive Header */}
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <SafetyCertificateOutlined style={{ fontSize: '1.75rem', color: '#6366f1' }} />
          <Typography variant="h3" fontWeight={700}>
            Desktop Application Remote Kill Switch & License Control
          </Typography>
        </Stack>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
          Remotely control client installations of <strong>RehmatLawnMowers.exe</strong> in real-time from this Web URL. Toggle access ON or OFF with 1 click.
        </Typography>
      </Box>

      {saveSuccess && (
        <Alert severity="success" icon={<CheckCircleOutlined />} sx={{ mb: 3 }}>
          <strong>Command Synced to Cloud!</strong> The desktop application will adopt this status within seconds.
        </Alert>
      )}

      {/* Main Kill Switch Control Card */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          p: { xs: 2.5, sm: 3.5 },
          bgcolor: isLocked ? '#450a0a' : '#064e3b',
          color: '#ffffff',
          border: isLocked ? '2px solid #ef4444' : '2px solid #10b981',
          boxShadow: isLocked
            ? '0 10px 30px rgba(239, 68, 68, 0.25)'
            : '0 10px 30px rgba(16, 185, 129, 0.25)',
          transition: 'all 0.3s ease'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={3}>
          <Stack direction="row" alignItems="center" spacing={2.5}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: isLocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                border: isLocked ? '2px solid #ef4444' : '2px solid #10b981'
              }}
            >
              {isLocked ? (
                <LockOutlined style={{ fontSize: 32, color: '#fca5a5' }} />
              ) : (
                <UnlockOutlined style={{ fontSize: 32, color: '#a7f3d0' }} />
              )}
            </Box>

            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85, fontWeight: 700 }}>
                  Client Desktop App Status
                </Typography>
                <Chip
                  label={isLocked ? 'LOCKED / DISABLED' : 'ACTIVE & RUNNING'}
                  size="small"
                  sx={{
                    bgcolor: isLocked ? '#ef4444' : '#10b981',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.7rem'
                  }}
                />
              </Stack>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5 }}>
                {isLocked
                  ? 'Desktop App is CURRENTLY LOCKED'
                  : 'Desktop App is RUNNING NORMALLY'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {isLocked
                  ? 'Client cannot use the desktop application. An unclosable lock screen is being displayed on their PC.'
                  : 'Client has full authorized access to store inventory, stock, and sales features.'}
              </Typography>
            </Box>
          </Stack>

          <Box>
            {isLocked ? (
              <Button
                variant="contained"
                size="large"
                startIcon={<UnlockOutlined />}
                onClick={() => setConfirmUnlockOpen(true)}
                sx={{
                  bgcolor: '#10b981',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                  '&:hover': { bgcolor: '#059669' }
                }}
              >
                RESTORE & UNLOCK APP
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                startIcon={<LockOutlined />}
                onClick={() => setConfirmLockOpen(true)}
                sx={{
                  bgcolor: '#ef4444',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
                  '&:hover': { bgcolor: '#dc2626' }
                }}
              >
                EMERGENCY LOCK APP
              </Button>
            )}
          </Box>
        </Stack>
      </Card>

      <Grid container spacing={3}>
        {/* Left Column: Customization Form */}
        <Grid item xs={12} md={7}>
          <MainCard title="Lock Screen & Developer Contact Settings">
            <form onSubmit={handleSaveSettings}>
              <Stack spacing={2.5}>
                <TextField
                  label="Lock Screen Title"
                  fullWidth
                  required
                  value={formData.lockTitle}
                  onChange={(e) => setFormData({ ...formData, lockTitle: e.target.value })}
                  helperText="Displayed at the top of client's screen when locked."
                />

                <TextField
                  label="Lock Screen Explanation Message"
                  fullWidth
                  multiline
                  rows={3}
                  required
                  value={formData.lockMessage}
                  onChange={(e) => setFormData({ ...formData, lockMessage: e.target.value })}
                  helperText="Explain why the license is inactive (e.g. pending payment verification)."
                />

                <Divider sx={{ my: 1 }} />

                <Typography variant="subtitle1" fontWeight={700}>
                  Contact Details for Client to Reach You
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Developer / Admin Name"
                      fullWidth
                      value={formData.contactPerson}
                      onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="WhatsApp / Phone Number"
                      fullWidth
                      required
                      placeholder="+92 300 1234567"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <WhatsAppOutlined style={{ color: '#22c55e' }} />
                          </InputAdornment>
                        )
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Max Allowed Offline Hours (Security Threshold)"
                  type="number"
                  fullWidth
                  value={formData.allowedOfflineHours}
                  onChange={(e) => setFormData({ ...formData, allowedOfflineHours: parseInt(e.target.value, 10) || 72 })}
                  helperText="If client disconnects internet for longer than this time, desktop app locks automatically."
                />

                <Box sx={{ pt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={loading}
                    startIcon={<CloudSyncOutlined />}
                  >
                    {loading ? 'Saving...' : 'Save & Sync Settings'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </MainCard>
        </Grid>

        {/* Right Column: Live Client Screen Simulation Preview */}
        <Grid item xs={12} md={5}>
          <MainCard
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <EyeOutlined />
                <span>Live Client Screen Preview</span>
              </Stack>
            }
          >
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              This is exactly what the client will see on their Windows monitor when you lock the app:
            </Typography>

            {/* Miniature Lock Screen Simulator */}
            <Paper
              elevation={4}
              sx={{
                bgcolor: '#0f172a',
                color: '#f8fafc',
                borderRadius: 2.5,
                p: 2.5,
                textAlign: 'center',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)'
                }}
              />

              <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#ef4444', mx: 'auto', mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockOutlined style={{ color: '#fff', fontSize: 18 }} />
              </Box>

              <Chip
                label="LICENSE INACTIVE"
                size="small"
                sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', fontWeight: 800, fontSize: '0.65rem', mb: 1.5 }}
              />

              <Typography variant="h5" fontWeight={700} sx={{ color: '#fff', mb: 1, fontSize: '1.05rem' }}>
                {formData.lockTitle || 'Application License Verification Required'}
              </Typography>

              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 2, lineHeight: 1.5 }}>
                {formData.lockMessage || 'Please contact administrator to activate.'}
              </Typography>

              <Box sx={{ bgcolor: 'rgba(30, 41, 59, 0.8)', p: 1.5, borderRadius: 1.5, mb: 2 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', display: 'block', textTransform: 'uppercase' }}>
                  Authorized Administrator
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#38bdf8' }}>
                  {formData.contactPerson || 'Software Developer'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#e2e8f0', fontWeight: 600 }}>
                  📞 {formData.contactPhone}
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="small"
                startIcon={<WhatsAppOutlined />}
                sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 700, pointerEvents: 'none' }}
              >
                Contact via WhatsApp
              </Button>
            </Paper>
          </MainCard>
        </Grid>
      </Grid>

      {/* Confirmation Dialog: LOCK */}
      <Dialog open={confirmLockOpen} onClose={() => setConfirmLockOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>
          ⚠️ Confirm Remote Lock
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to <strong>LOCK the desktop application</strong>? The client will immediately be blocked from accessing inventory, sales, and ledger data until you reactivate it.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmLockOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => handleToggleLock(true)} variant="contained" color="error">
            Yes, Lock Desktop App
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog: UNLOCK */}
      <Dialog open={confirmUnlockOpen} onClose={() => setConfirmUnlockOpen(false)} maxWidth="xs">
        <DialogTitle sx={{ color: 'success.main', fontWeight: 700 }}>
          ✅ Confirm Remote Unlock
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to <strong>UNLOCK the desktop application</strong>? The client will immediately regain normal access to the application.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmUnlockOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={() => handleToggleLock(false)} variant="contained" color="success">
            Yes, Unlock Desktop App
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
