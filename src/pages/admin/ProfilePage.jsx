import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// icons
import CameraOutlined from '@ant-design/icons/CameraOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';

// project imports
import MainCard from 'components/MainCard';
import { AppButton, FormDialog, PageHeader } from 'components/common';
import { useAuth } from 'context/AuthContext';
import { compressImageFile } from 'utils/shopHelpers';
import { getCardSurfaceSx, getToneColors } from 'utils/themeSurface';
import avatar1 from 'assets/images/users/avatar-1.png';

/**
 * TailAdmin-style Edit Profile & Account Security Page:
 * - User Meta Card with live custom profile photo upload & removal
 * - Personal Information Card + Edit Modal
 * - Address Card + Edit Modal
 * - Password & Account Security Card (?section=security)
 */
export default function ProfilePage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchParams] = useSearchParams();
  const { user, updateProfile, changePassword } = useAuth();

  const fileInputRef = useRef(null);
  const securityCardRef = useRef(null);
  const addressCardRef = useRef(null);

  const primaryTone = getToneColors(theme, 'primary');
  const cardSurface = getCardSurfaceSx(theme);

  const parsedNames = useMemo(() => {
    const cleanFull = (user?.name || 'Sabeel').replace(/\s*\([^)]*\)/g, '').trim();
    const parts = cleanFull.split(/\s+/).filter(Boolean);
    return {
      firstName: user?.firstName || parts[0] || cleanFull || 'User',
      lastName: user?.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : '')
    };
  }, [user]);

  const profileDefaults = useMemo(
    () => ({
      firstName: parsedNames.firstName,
      lastName: parsedNames.lastName,
      email: user?.email || 'admin@rehmat.com',
      phone: user?.phone || '0315-4630026',
      bio: user?.bio || `${user?.role || 'Super Admin'} • Rehmat Lawn Mowers Store & Workshop`,
      country: user?.country || 'Pakistan',
      cityState: user?.cityState || 'Lahore, Punjab',
      address: user?.address || 'Rehmat Lawn Mowers Factory Store',
      postalCode: user?.postalCode || '54000'
    }),
    [user, parsedNames]
  );

  // Modals & Form states
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoForm, setInfoForm] = useState(profileDefaults);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({
    country: profileDefaults.country,
    cityState: profileDefaults.cityState,
    address: profileDefaults.address,
    postalCode: profileDefaults.postalCode
  });

  // Password Change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState({ current: false, next: false, confirm: false });
  const [passwordStatus, setPasswordStatus] = useState({ type: '', text: '' });
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });

  useEffect(() => {
    setInfoForm(profileDefaults);
    setAddressForm({
      country: profileDefaults.country,
      cityState: profileDefaults.cityState,
      address: profileDefaults.address,
      postalCode: profileDefaults.postalCode
    });
  }, [profileDefaults]);

  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'security' && securityCardRef.current) {
      securityCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (section === 'address' && addressCardRef.current) {
      addressCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }
    try {
      const compressed = await compressImageFile(file, 320, 0.85);
      await updateProfile({ avatar: compressed });
      showToast('Profile photo updated successfully!');
    } catch {
      showToast('Could not process image file. Please try another image.', 'error');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    await updateProfile({ avatar: '' });
    showToast('Custom profile photo removed.');
  };

  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    const fName = (infoForm.firstName || '').trim();
    const lName = (infoForm.lastName || '').trim();
    if (!fName) {
      showToast('First Name is required.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const combinedName = [fName, lName].filter(Boolean).join(' ');
      await updateProfile({
        name: combinedName,
        firstName: fName,
        lastName: lName,
        phone: (infoForm.phone || '').trim(),
        bio: (infoForm.bio || '').trim(),
        ...(user?.email?.toLowerCase() !== 'admin@rehmat.com' && infoForm.email ? { email: infoForm.email.trim().toLowerCase() } : {})
      });
      setInfoDialogOpen(false);
      showToast('Personal information saved successfully!');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        country: (addressForm.country || '').trim(),
        cityState: (addressForm.cityState || '').trim(),
        address: (addressForm.address || '').trim(),
        postalCode: (addressForm.postalCode || '').trim()
      });
      setAddressDialogOpen(false);
      showToast('Address updated successfully!');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', text: '' });

    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordStatus({ type: 'error', text: 'Please fill Current Password, New Password, and Confirm New Password.' });
      return;
    }
    if (newPassword.trim().length < 4) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 4 characters long.' });
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordStatus({ type: 'error', text: 'New Password and Confirm Password do not match.' });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePassword(newPassword.trim(), currentPassword.trim());
      if (res.success) {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordStatus({ type: 'success', text: 'Password updated! Next time login with your new password.' });
        showToast('Account password changed successfully!');
      } else {
        setPasswordStatus({ type: 'error', text: res.error || 'Could not update password.' });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const displayName = user?.name || `${profileDefaults.firstName} ${profileDefaults.lastName}`.trim();
  const isMasterAdminAccount = (user?.email || '').toLowerCase() === 'admin@rehmat.com';
  const isSecurityHighlighted = searchParams.get('section') === 'security';

  const renderFieldBlock = (label, value) => (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.4 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary">
        {value || '—'}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      <PageHeader
        title="Edit Profile & Account"
        subtitle="Manage your custom profile photo, personal information, workshop address, and login password."
        sx={{ mb: 0 }}
      />

      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />

      <MainCard content={false} sx={cardSurface}>
        <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 1. USER META & CUSTOM PHOTO CARD */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.25, sm: 3 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
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
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2.5}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <Avatar
                    alt={displayName}
                    src={user?.avatar || avatar1}
                    sx={{
                      width: 84,
                      height: 84,
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: primaryTone.border,
                      cursor: 'pointer'
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <Tooltip title="Upload Custom Profile Image">
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 28,
                        height: 28,
                        bgcolor: 'primary.main',
                        color: '#ffffff',
                        border: '2px solid',
                        borderColor: 'background.paper',
                        '&:hover': { bgcolor: 'primary.dark' }
                      }}
                    >
                      <CameraOutlined style={{ fontSize: 13 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {displayName}
                    </Typography>
                    <Chip
                      icon={<SafetyCertificateOutlined />}
                      label={user?.role || 'Super Admin'}
                      size="small"
                      color="primary"
                      variant="light"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {profileDefaults.bio}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.4 }}>
                    {profileDefaults.cityState}, {profileDefaults.country} • {profileDefaults.email}
                  </Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <AppButton
                  intent="secondary"
                  size="small"
                  startIcon={<UploadOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Photo
                </AppButton>
                {user?.avatar && (
                  <AppButton intent="danger-outlined" size="small" startIcon={<DeleteOutlined />} onClick={handleRemovePhoto}>
                    Remove
                  </AppButton>
                )}
                <AppButton
                  intent="neutral"
                  size="small"
                  startIcon={<EditOutlined />}
                  onClick={() => setInfoDialogOpen(true)}
                  sx={{ borderRadius: 999, px: 2 }}
                >
                  Edit
                </AppButton>
              </Stack>
            </Box>
          </Paper>

          {/* 2. PERSONAL INFORMATION CARD */}
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.25, sm: 3 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1.5 }}>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Personal Information
              </Typography>
              <AppButton
                intent="neutral"
                size="small"
                startIcon={<EditOutlined />}
                onClick={() => setInfoDialogOpen(true)}
                sx={{ borderRadius: 999, px: 2 }}
              >
                Edit
              </AppButton>
            </Box>

            <Grid container spacing={2.5} maxWidth={860}>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('First Name', profileDefaults.firstName)}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('Last Name', profileDefaults.lastName)}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('Email address', profileDefaults.email)}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('Phone', profileDefaults.phone)}</Grid>
              <Grid size={12}>{renderFieldBlock('Bio / Designation', profileDefaults.bio)}</Grid>
            </Grid>
          </Paper>

          {/* 3. ADDRESS CARD */}
          <Paper
            ref={addressCardRef}
            elevation={0}
            sx={{
              p: { xs: 2.25, sm: 3 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, gap: 1.5 }}>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Address
              </Typography>
              <AppButton
                intent="neutral"
                size="small"
                startIcon={<EditOutlined />}
                onClick={() => setAddressDialogOpen(true)}
                sx={{ borderRadius: 999, px: 2 }}
              >
                Edit
              </AppButton>
            </Box>

            <Grid container spacing={2.5} maxWidth={860}>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('Country', profileDefaults.country)}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('City / State', profileDefaults.cityState)}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('Workshop / Store Address', profileDefaults.address)}</Grid>
              <Grid size={{ xs: 12, sm: 6 }}>{renderFieldBlock('Postal Code', profileDefaults.postalCode)}</Grid>
            </Grid>
          </Paper>

          {/* 4. ACCOUNT SECURITY & CHANGE PASSWORD CARD */}
          <Paper
            ref={securityCardRef}
            elevation={0}
            sx={{
              p: { xs: 2.25, sm: 3 },
              borderRadius: 4,
              border: '1px solid',
              borderColor: isSecurityHighlighted ? 'primary.main' : 'divider',
              boxShadow: isSecurityHighlighted ? `0 0 0 3px ${alpha(theme.palette.primary.main, isDark ? 0.2 : 0.1)}` : 'none',
              bgcolor: 'background.paper'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1.5,
                mb: 2.5
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LockOutlined style={{ color: primaryTone.main, fontSize: 18 }} />
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Account Security &amp; Change Password
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                  Update your login password anytime for {profileDefaults.email}. Changes sync across cloud &amp; active session.
                </Typography>
              </Box>
              <Chip icon={<CheckCircleOutlined />} label="Active Account" size="small" color="success" variant="light" />
            </Box>

            {passwordStatus.text && (
              <Alert severity={passwordStatus.type} sx={{ mb: 2.5, fontWeight: 600 }}>
                {passwordStatus.text}
              </Alert>
            )}

            <Box component="form" onSubmit={handlePasswordSubmit}>
              <Grid container spacing={2} alignItems="flex-end">
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    Current Password *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPass.current ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPass((p) => ({ ...p, current: !p.current }))}>
                              {showPass.current ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    New Password *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPass.next ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPass((p) => ({ ...p, next: !p.next }))}>
                              {showPass.next ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    Confirm New Password *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type={showPass.confirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPass((p) => ({ ...p, confirm: !p.confirm }))}>
                              {showPass.confirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }
                    }}
                  />
                </Grid>

                <Grid size={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
                    <AppButton type="submit" intent="primary" loading={savingPassword} startIcon={<LockOutlined />}>
                      Update Password
                    </AppButton>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </MainCard>

      {/* Edit Personal Information Modal */}
      <FormDialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        title="Edit Personal Information"
        subtitle="Update your profile photo and personal details to keep your account up-to-date."
        onSubmit={handleSavePersonalInfo}
        loading={savingProfile}
        saveText="Save Changes"
      >
        <Stack spacing={2.5}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap'
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar src={user?.avatar || avatar1} sx={{ width: 56, height: 56, borderRadius: '50%' }} />
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>
                  Profile Picture
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Supports PNG, JPG or WebP images
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <AppButton intent="secondary" size="small" startIcon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
                Upload Image
              </AppButton>
              {user?.avatar && (
                <AppButton intent="danger-outlined" size="small" onClick={handleRemovePhoto}>
                  Remove
                </AppButton>
              )}
            </Stack>
          </Box>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                required
                label="First Name"
                value={infoForm.firstName}
                onChange={(e) => setInfoForm((prev) => ({ ...prev, firstName: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                value={infoForm.lastName}
                onChange={(e) => setInfoForm((prev) => ({ ...prev, lastName: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Email Address"
                disabled={isMasterAdminAccount}
                helperText={isMasterAdminAccount ? 'Primary Super Admin email is locked' : undefined}
                value={infoForm.email}
                onChange={(e) => setInfoForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Phone"
                value={infoForm.phone}
                onChange={(e) => setInfoForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Bio / Designation"
                value={infoForm.bio}
                onChange={(e) => setInfoForm((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </Grid>
          </Grid>
        </Stack>
      </FormDialog>

      {/* Edit Address Modal */}
      <FormDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        title="Edit Address"
        subtitle="Update your workshop location & postal details."
        onSubmit={handleSaveAddress}
        loading={savingProfile}
        saveText="Save Address"
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Country"
              value={addressForm.country}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="City / State"
              value={addressForm.cityState}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, cityState: e.target.value }))}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              label="Workshop / Store Address"
              value={addressForm.address}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, address: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Postal Code"
              value={addressForm.postalCode}
              onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))}
            />
          </Grid>
        </Grid>
      </FormDialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
