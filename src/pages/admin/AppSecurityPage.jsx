import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import MainCard from 'components/MainCard';
import { AppButton, PageHeader } from 'components/common';
import { useAppSecurity } from 'context/AppSecurityContext';
import { isTauriApp } from 'utils/platform';
import { getCardSurfaceSx, getToneColors } from 'utils/themeSurface';

const DEFAULT_LOCK_TITLE = 'Application License Verification Required';
const DEFAULT_LOCK_MESSAGE =
  'Your application license has been temporarily locked or requires activation. Please contact the software administrator or developer to activate your license.';
const DEFAULT_CONTACT_PHONE = '+92 300 0000000';
const DEFAULT_CONTACT_PERSON = 'Software Developer';
const DEFAULT_OFFLINE_HOURS = 72;

const CONFIRM_DIALOGS = {
  lock: {
    title: 'Confirm Remote Lock',
    titleColor: 'error.main',
    description:
      'Are you sure you want to remotely LOCK all connected client installations? Users on the Windows desktop app will immediately see the full-screen activation lock and cannot access any records until unlocked.',
    confirmLabel: 'Yes, Lock Application',
    confirmIntent: 'danger',
    confirmSx: {},
    nextState: true
  },
  unlock: {
    title: 'Confirm Remote Unlock',
    titleColor: 'success.main',
    description:
      'Are you sure you want to UNLOCK client access? Connected desktop installations will automatically restore full normal functionality within seconds.',
    confirmLabel: 'Yes, Unlock Application',
    confirmIntent: 'primary',
    confirmSx: { bgcolor: 'success.dark', '&:hover': { bgcolor: 'success.main' } },
    nextState: false
  }
};

function buildFormState(config = {}) {
  return {
    lockTitle: config.lockTitle || DEFAULT_LOCK_TITLE,
    lockMessage: config.lockMessage || DEFAULT_LOCK_MESSAGE,
    contactPhone: config.contactPhone || DEFAULT_CONTACT_PHONE,
    contactPerson: config.contactPerson || DEFAULT_CONTACT_PERSON,
    allowedOfflineHours: Number(config.allowedOfflineHours) || DEFAULT_OFFLINE_HOURS
  };
}

export default function AppSecurityPage() {
  const theme = useTheme();
  const isTauri = isTauriApp();
  const { securityConfig, updateSecurityConfig, loading } = useAppSecurity();

  const [formData, setFormData] = useState(() => buildFormState(securityConfig));
  const [confirmAction, setConfirmAction] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setFormData(buildFormState(securityConfig));
  }, [securityConfig]);

  if (isTauri) {
    return <Navigate to="/dashboard/default" replace />;
  }

  const isLocked = Boolean(securityConfig.isLocked);
  const statusTone = getToneColors(theme, isLocked ? 'error' : 'success');
  const activeDialog = confirmAction ? CONFIRM_DIALOGS[confirmAction] : null;

  const sectionEyebrowSx = {
    fontSize: '0.75rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: 'primary.main',
    mb: 2
  };

  const fieldLabelSx = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'text.primary',
    mb: 0.75
  };

  const statusMeta = isLocked
    ? {
        pillLabel: 'Locked / blocked',
        heading: 'Desktop app is currently locked',
        description: 'Client installations cannot access store inventory, stock, or billing until you restore access.',
        buttonLabel: 'Restore & unlock app',
        buttonHint: 'Restores authorized client access immediately',
        buttonIntent: 'primary',
        buttonSx: { bgcolor: 'success.dark', '&:hover': { bgcolor: 'success.main' } },
        actionType: 'unlock'
      }
    : {
        pillLabel: 'Active & running',
        heading: 'Desktop app is running normally',
        description: 'Client has full authorized access to store inventory, stock and sales features.',
        buttonLabel: 'Emergency lock app',
        buttonHint: 'Shows the lock screen on the client at once',
        buttonIntent: 'danger',
        buttonSx: { bgcolor: '#b91c1c', '&:hover': { bgcolor: '#991b1b' } },
        actionType: 'lock'
      };

  const normalizePayload = (data) => ({
    ...data,
    lockTitle: (data.lockTitle || '').trim() || DEFAULT_LOCK_TITLE,
    lockMessage: (data.lockMessage || '').trim() || DEFAULT_LOCK_MESSAGE,
    contactPerson: (data.contactPerson || '').trim() || DEFAULT_CONTACT_PERSON,
    contactPhone: (data.contactPhone || '').trim() || DEFAULT_CONTACT_PHONE,
    allowedOfflineHours: Math.max(1, Number(data.allowedOfflineHours) || DEFAULT_OFFLINE_HOURS)
  });

  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleToggleLock = async (newLockState) => {
    setSaveSuccess(false);
    setSaveError('');
    const res = await updateSecurityConfig({
      ...normalizePayload(formData),
      isLocked: newLockState
    });
    if (res?.success) {
      setSaveSuccess(true);
    } else if (res?.error) {
      setSaveError(res.error);
    }
    setConfirmAction(null);
  };

  const handleSaveSettings = async (event) => {
    event.preventDefault();
    setSaveSuccess(false);
    setSaveError('');
    const payload = normalizePayload(formData);
    setFormData(payload);
    const res = await updateSecurityConfig(payload);
    if (res?.success) {
      setSaveSuccess(true);
    } else if (res?.error) {
      setSaveError(res.error);
    }
  };

  const handleReset = () => {
    setFormData(buildFormState(securityConfig));
    setSaveSuccess(false);
    setSaveError('');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <PageHeader
        title="Remote License & Security"
        subtitle={
          <>
            Remotely control client installations of <strong>RehmatLawnMowers.exe</strong> in real time. Lock or unlock access with one click.
          </>
        }
        sx={{ mb: 0 }}
      />

      {saveSuccess && (
        <Alert severity="success" icon={<CheckCircleOutlined />} onClose={() => setSaveSuccess(false)}>
          <strong>Command synced to cloud!</strong> The desktop application will adopt these security settings within seconds.
        </Alert>
      )}

      {saveError && (
        <Alert severity="error" onClose={() => setSaveError('')}>
          {saveError}
        </Alert>
      )}

      {/* Client Desktop App Status Banner */}
      <Paper
        elevation={0}
        sx={getCardSurfaceSx(theme, {
          p: { xs: 2, sm: 2.75 },
          borderLeftWidth: 3,
          borderLeftStyle: 'solid',
          borderLeftColor: statusTone.solid
        })}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            gap: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                bgcolor: statusTone.bg,
                border: '1px solid',
                borderColor: statusTone.border,
                color: statusTone.text
              }}
            >
              <LockOutlined style={{ fontSize: 20 }} />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'text.secondary'
                  }}
                >
                  Client Desktop App Status
                </Typography>
                <Chip
                  size="small"
                  label={statusMeta.pillLabel}
                  sx={{
                    height: 22,
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    bgcolor: statusTone.bg,
                    color: statusTone.text,
                    border: '1px solid',
                    borderColor: statusTone.border
                  }}
                />
              </Box>
              <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.35 }}>
                {statusMeta.heading}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {statusMeta.description}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              gap: 0.75,
              flexShrink: 0
            }}
          >
            <AppButton
              intent={statusMeta.buttonIntent}
              size="medium"
              onClick={() => setConfirmAction(statusMeta.actionType)}
              disabled={loading}
              sx={{ px: 2.5, py: 1, ...statusMeta.buttonSx }}
            >
              {statusMeta.buttonLabel}
            </AppButton>
            <Typography variant="caption" color="text.secondary">
              {statusMeta.buttonHint}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main Two-Column Settings & Live Screen Preview */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{ xs: 12, lg: 6 }}>
          <MainCard
            content={false}
            sx={getCardSurfaceSx(theme, {
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            })}
          >
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h5" fontWeight={700}>
                Lock screen &amp; developer contact
              </Typography>
            </Box>

            <Box
              component="form"
              onSubmit={handleSaveSettings}
              sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              {/* Section 1 */}
              <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
                <Typography sx={sectionEyebrowSx}>1. Lock Screen Message</Typography>

                <Box sx={{ mb: 2.25 }}>
                  <Typography component="label" htmlFor="security-lock-title" sx={fieldLabelSx}>
                    Lock screen title *
                  </Typography>
                  <TextField
                    id="security-lock-title"
                    fullWidth
                    size="small"
                    required
                    value={formData.lockTitle}
                    onChange={handleFieldChange('lockTitle')}
                    placeholder={DEFAULT_LOCK_TITLE}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    Shown at the top of the client&apos;s screen when locked.
                  </Typography>
                </Box>

                <Box>
                  <Typography component="label" htmlFor="security-lock-message" sx={fieldLabelSx}>
                    Explanation message *
                  </Typography>
                  <TextField
                    id="security-lock-message"
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                    required
                    value={formData.lockMessage}
                    onChange={handleFieldChange('lockMessage')}
                    placeholder="Explain why the license is inactive..."
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    Explain why the license is inactive (e.g. pending payment verification).
                  </Typography>
                </Box>
              </Box>

              <Divider />

              {/* Section 2 */}
              <Box sx={{ px: { xs: 2, sm: 3 }, py: 2.5 }}>
                <Typography sx={sectionEyebrowSx}>2. Contact Details For Client</Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography component="label" htmlFor="security-contact-person" sx={fieldLabelSx}>
                      Developer / admin name
                    </Typography>
                    <TextField
                      id="security-contact-person"
                      fullWidth
                      size="small"
                      value={formData.contactPerson}
                      onChange={handleFieldChange('contactPerson')}
                      placeholder={DEFAULT_CONTACT_PERSON}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography component="label" htmlFor="security-contact-phone" sx={fieldLabelSx}>
                      WhatsApp / phone number *
                    </Typography>
                    <TextField
                      id="security-contact-phone"
                      fullWidth
                      size="small"
                      required
                      value={formData.contactPhone}
                      onChange={handleFieldChange('contactPhone')}
                      placeholder={DEFAULT_CONTACT_PHONE}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Section 3 & Form Footer */}
              <Box
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}
              >
                <Typography sx={sectionEyebrowSx}>3. Security Threshold</Typography>

                <Box>
                  <Typography component="label" htmlFor="security-offline-hours" sx={fieldLabelSx}>
                    Max allowed offline hours
                  </Typography>
                  <TextField
                    id="security-offline-hours"
                    size="small"
                    type="number"
                    value={formData.allowedOfflineHours}
                    onChange={handleFieldChange('allowedOfflineHours')}
                    slotProps={{ htmlInput: { min: 1, max: 720 } }}
                    sx={{ width: 150 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                    If the client stays offline longer than this, the desktop app locks automatically.
                  </Typography>
                </Box>

                <Box sx={{ mt: 'auto', pt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                  <AppButton intent="cancel" size="medium" onClick={handleReset} disabled={loading}>
                    Reset
                  </AppButton>
                  <AppButton intent="primary" size="medium" type="submit" loading={loading} loadingText="Saving...">
                    Save &amp; sync settings
                  </AppButton>
                </Box>
              </Box>
            </Box>
          </MainCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <MainCard
            content={false}
            sx={getCardSurfaceSx(theme, {
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            })}
          >
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5
              }}
            >
              <Typography variant="h5" fontWeight={700}>
                Live client screen preview
              </Typography>
              <Chip
                label="Preview only"
                size="small"
                variant="outlined"
                sx={{
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'text.secondary',
                  borderColor: 'divider'
                }}
              />
            </Box>

            <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is exactly what the client sees on their Windows monitor when you lock the app.
              </Typography>

              <Paper
                elevation={0}
                sx={{
                  bgcolor: '#0a1220',
                  color: '#f8fafc',
                  borderRadius: 2.5,
                  border: '1px solid #1e293b',
                  borderTop: '4px solid #b91c1c',
                  p: { xs: 2.5, sm: 3.5 },
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.75
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    bgcolor: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <LockOutlined style={{ color: '#fecaca', fontSize: 22 }} />
                </Box>

                <Box
                  sx={{
                    px: 1.75,
                    py: 0.45,
                    borderRadius: '999px',
                    bgcolor: 'rgba(153, 27, 27, 0.35)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#fca5a5',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}
                >
                  LICENSE INACTIVE
                </Box>

                <Typography variant="h4" fontWeight={700} sx={{ color: '#ffffff', lineHeight: 1.3 }}>
                  {formData.lockTitle || DEFAULT_LOCK_TITLE}
                </Typography>

                <Typography variant="body2" sx={{ color: '#cbd5e1', lineHeight: 1.6, maxWidth: 420 }}>
                  {formData.lockMessage || DEFAULT_LOCK_MESSAGE}
                </Typography>

                <Box
                  sx={{
                    width: '100%',
                    bgcolor: '#172133',
                    border: '1px solid #283548',
                    borderRadius: 1.75,
                    py: 2,
                    px: 2.5,
                    mt: 0.5
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: '#94a3b8',
                      mb: 0.5
                    }}
                  >
                    AUTHORIZED ADMINISTRATOR
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#60a5fa' }}>
                    {formData.contactPerson || DEFAULT_CONTACT_PERSON}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#f8fafc', mt: 0.25 }}>
                    {formData.contactPhone || DEFAULT_CONTACT_PHONE}
                  </Typography>
                </Box>

                <AppButton
                  variant="contained"
                  fullWidth
                  size="medium"
                  tabIndex={-1}
                  sx={{
                    mt: 0.5,
                    py: 1.15,
                    borderRadius: 1.5,
                    bgcolor: '#047857',
                    color: '#ffffff',
                    fontWeight: 700,
                    boxShadow: 'none',
                    pointerEvents: 'none',
                    '&:hover': { bgcolor: '#047857', boxShadow: 'none' }
                  }}
                >
                  Contact via WhatsApp
                </AppButton>
              </Paper>
            </Box>
          </MainCard>
        </Grid>
      </Grid>

      {/* Confirm Remote Lock / Unlock Dialog */}
      <Dialog open={Boolean(activeDialog)} onClose={() => setConfirmAction(null)} maxWidth="xs" fullWidth>
        {activeDialog && (
          <>
            <DialogTitle sx={{ color: activeDialog.titleColor, fontWeight: 700 }}>
              {activeDialog.title}
            </DialogTitle>
            <DialogContent>
              <DialogContentText>{activeDialog.description}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <AppButton intent="cancel" onClick={() => setConfirmAction(null)} disabled={loading}>
                Cancel
              </AppButton>
              <AppButton
                intent={activeDialog.confirmIntent}
                onClick={() => handleToggleLock(activeDialog.nextState)}
                disabled={loading}
                loading={loading}
                sx={activeDialog.confirmSx}
              >
                {activeDialog.confirmLabel}
              </AppButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
