import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

// icons
import KeyOutlined from '@ant-design/icons/KeyOutlined';
import CopyOutlined from '@ant-design/icons/CopyOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import DesktopOutlined from '@ant-design/icons/DesktopOutlined';

import logoImg from 'assets/images/rehmat-logo.jpg';
import {
  checkLicenseStatus,
  getFormattedMachineId,
  verifyLicenseKey,
  saveLicenseData
} from 'utils/licenseManager';

export default function LicenseGate({ children }) {
  const [loading, setLoading] = useState(true);
  const [isLicensed, setIsLicensed] = useState(false);
  const [machineId, setMachineId] = useState('');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function initCheck() {
      try {
        const mId = await getFormattedMachineId();
        setMachineId(mId);

        const status = await checkLicenseStatus();
        if (status.isLicensed) {
          setIsLicensed(true);
        } else if (status.error) {
          setErrorMsg(status.error);
        }
      } catch (err) {
        console.error('License check error:', err);
      } finally {
        setLoading(false);
      }
    }
    initCheck();
  }, []);

  const handleCopyMachineId = () => {
    if (!machineId) return;
    navigator.clipboard.writeText(machineId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleActivate = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedKey = licenseKeyInput.trim().toUpperCase();
    if (!trimmedKey) {
      setErrorMsg('Please enter your 16-character License Activation Key');
      return;
    }

    setSubmitting(true);
    try {
      const isValid = await verifyLicenseKey(trimmedKey, machineId, customerNameInput);
      if (isValid) {
        saveLicenseData({
          machineId,
          licenseKey: trimmedKey,
          customerName: customerNameInput.trim() || 'Rehmat Lawn Mowers Authorized Client',
          activatedAt: new Date().toISOString(),
          status: 'ACTIVE'
        });
        setSuccessMsg('License Verified Successfully! Unlocking Workstation...');
        setTimeout(() => {
          setIsLicensed(true);
        }, 1200);
      } else {
        setErrorMsg('Invalid License Key for this machine! Each license key is cryptographically bound to its unique hardware device.');
      }
    } catch (err) {
      setErrorMsg('Activation failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          gap: 2
        }}
      >
        <CircularProgress size={42} thickness={4} />
        <Typography variant="body2" color="textSecondary" fontWeight={600}>
          Verifying Device Hardware Authorization...
        </Typography>
      </Box>
    );
  }

  // If already licensed, render the full application normally
  if (isLicensed) {
    return children;
  }

  // Otherwise, render the Executive License Activation Gateway
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#0f172a' : '#f4f6f8'),
        backgroundImage: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 50% 10%, rgba(24, 144, 255, 0.12), transparent 70%)'
            : 'radial-gradient(circle at 50% 10%, rgba(24, 144, 255, 0.08), transparent 70%)'
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 520,
          width: '100%',
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.08)',
          textAlign: 'center'
        }}
      >
        <Stack spacing={3} alignItems="center">
          {/* Logo & Header */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              p: 0.5,
              border: '2px solid',
              borderColor: 'primary.main',
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(24, 144, 255, 0.2)'
            }}
          >
            <Box
              component="img"
              src={logoImg}
              alt="Rehmat Logo"
              sx={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '50%' }}
            />
          </Box>

          <Box>
            <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ mb: 0.75 }}>
              <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                Rehmat Lawn Mowers
              </Typography>
            </Stack>
            <Chip
              icon={<SafetyCertificateOutlined style={{ color: '#1677ff' }} />}
              label="Single-Workstation Protected License"
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700, borderRadius: '6px' }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              This copy of ERP is bound to this physical machine. Please activate to proceed.
            </Typography>
          </Box>

          {/* Machine ID Box */}
          <Paper
            variant="outlined"
            sx={{
              width: '100%',
              p: 2,
              borderRadius: 2,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#f8fafc'),
              borderColor: 'primary.light',
              textAlign: 'left'
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="caption" fontWeight={700} color="textSecondary" textTransform="uppercase" letterSpacing={0.5}>
                <DesktopOutlined style={{ marginRight: 6 }} /> YOUR UNIQUE MACHINE ID
              </Typography>
              <Chip label="Hardware Fingerprint" size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
              <Typography
                variant="h4"
                fontWeight={800}
                sx={{
                  fontFamily: 'Consolas, monospace',
                  letterSpacing: '1px',
                  color: 'primary.main',
                  userSelect: 'all'
                }}
              >
                {machineId || 'GENERATING...'}
              </Typography>

              <Tooltip title={copied ? 'Copied to Clipboard!' : 'Copy Machine ID'}>
                <Button
                  size="small"
                  variant={copied ? 'contained' : 'outlined'}
                  color={copied ? 'success' : 'primary'}
                  startIcon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                  onClick={handleCopyMachineId}
                  sx={{ fontWeight: 700, textTransform: 'none', px: 1.5 }}
                >
                  {copied ? 'Copied' : 'Copy ID'}
                </Button>
              </Tooltip>
            </Stack>
          </Paper>

          {/* Feedback Alerts */}
          {errorMsg && (
            <Alert severity="error" sx={{ width: '100%', borderRadius: 1.5, textAlign: 'left', fontWeight: 600 }}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" icon={<CheckCircleOutlined />} sx={{ width: '100%', borderRadius: 1.5, textAlign: 'left', fontWeight: 600 }}>
              {successMsg}
            </Alert>
          )}

          {/* Activation Form */}
          <Box component="form" onSubmit={handleActivate} sx={{ width: '100%' }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="STORE / CLIENT NAME (OPTIONAL)"
                placeholder="e.g. Main Factory Counter, Workshop PC"
                value={customerNameInput}
                onChange={(e) => setCustomerNameInput(e.target.value)}
                size="small"
              />

              <TextField
                fullWidth
                required
                autoFocus
                label="ENTER LICENSE ACTIVATION KEY *"
                placeholder="RLM-XXXX-XXXX-XXXX-XXXX"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <KeyOutlined style={{ color: '#1677ff' }} />
                    </InputAdornment>
                  ),
                  sx: { fontFamily: 'Consolas, monospace', fontWeight: 700, letterSpacing: '0.8px' }
                }}
                helperText="Send your Machine ID to your software provider to receive your official key."
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <LockOutlined />}
                sx={{
                  py: 1.25,
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  borderRadius: 1.5,
                  boxShadow: '0 4px 14px rgba(24, 144, 255, 0.3)'
                }}
              >
                {submitting ? 'Verifying Hardware...' : 'Activate & Unlock Workstation'}
              </Button>
            </Stack>
          </Box>

          {/* Footer note */}
          <Typography variant="caption" color="textSecondary" sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider', width: '100%' }}>
            Protected by Hardware Device Binding &bull; Rehmat Lawn Mowers Enterprise &copy; {new Date().getFullYear()}
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
