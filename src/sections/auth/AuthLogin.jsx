import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { useAuth } from 'context/AuthContext';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import LockOutlined from '@ant-design/icons/LockOutlined';

// ============================|| JWT - LOGIN ||============================ //

export default function AuthLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [checked, setChecked] = useState(() => {
    try {
      return localStorage.getItem('rehmat_remember_login') === 'true';
    } catch {
      return true;
    }
  });
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const savedEmail = (() => {
    try {
      return localStorage.getItem('rehmat_saved_email') || 'admin@rehmat.com';
    } catch {
      return 'admin@rehmat.com';
    }
  })();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      {authError && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {authError}
        </Alert>
      )}
      <Formik
        initialValues={{
          email: savedEmail,
          password: '123456',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().required('Username or Email is required'),
          password: Yup.string().required('Password is required')
        })}
        onSubmit={async (values, { setSubmitting }) => {
          setAuthError('');
          try {
            if (checked) {
              localStorage.setItem('rehmat_remember_login', 'true');
              localStorage.setItem('rehmat_saved_email', values.email);
            } else {
              localStorage.removeItem('rehmat_remember_login');
              localStorage.removeItem('rehmat_saved_email');
            }
          } catch {
            // Ignore localStorage errors
          }

          const result = await login(values.email, values.password);
          if (result.success) {
            navigate('/');
          } else {
            setAuthError(result.error || 'Login failed. Please check your credentials.');
          }
          setSubmitting(false);
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={2.5}>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="email-login" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Username or Email Address
                  </InputLabel>
                  <OutlinedInput
                    id="email-login"
                    type="text"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="e.g. admin@rehmat.com"
                    fullWidth
                    startAdornment={
                      <InputAdornment position="start">
                        <UserOutlined style={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    }
                    error={Boolean(touched.email && errors.email)}
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
                {touched.email && errors.email && (
                  <FormHelperText error id="standard-weight-helper-text-email-login">
                    {errors.email}
                  </FormHelperText>
                )}
              </Grid>

              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-login" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    Password
                  </InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    startAdornment={
                      <InputAdornment position="start">
                        <LockOutlined style={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Enter password"
                    sx={{ borderRadius: 2 }}
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>

              <Grid size={12} sx={{ mt: -0.5 }}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(event) => setChecked(event.target.checked)}
                        name="checked"
                        color="success"
                        size="small"
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.85rem' }}>
                        Keep me signed in
                      </Typography>
                    }
                  />
                </Stack>
              </Grid>

              <Grid size={12}>
                <AnimateButton>
                  <Button
                    disableElevation
                    disabled={isSubmitting}
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{
                      fontWeight: 700,
                      height: 48,
                      fontSize: '0.98rem',
                      borderRadius: 2
                    }}
                  >
                    {isSubmitting ? (
                      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="center">
                        <CircularProgress size={18} color="inherit" thickness={4} />
                        <span>Signing In...</span>
                      </Stack>
                    ) : (
                      'Sign In to Store'
                    )}
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}

AuthLogin.propTypes = { isDemo: PropTypes.bool };
