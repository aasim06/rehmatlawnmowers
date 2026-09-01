import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

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
import SafetyCertificateOutlined from '@ant-design/icons/SafetyCertificateOutlined';

// ============================|| JWT - LOGIN ||============================ //

export default function AuthLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [checked, setChecked] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleQuickLogin = async (email, password) => {
    setAuthError('');
    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setAuthError(result.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <>
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}
      <Formik
        initialValues={{
          email: 'admin@rehmat.com',
          password: '123456',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().required('Username or Email is required'),
          password: Yup.string().required('Password is required')
        })}
        onSubmit={async (values, { setSubmitting }) => {
          setAuthError('');
          const result = await login(values.email, values.password);
          if (result.success) {
            navigate('/');
          } else {
            setAuthError(result.error || 'Login failed. Please check your credentials.');
          }
          setSubmitting(false);
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values, setFieldValue }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="email-login">Username or Email Address</InputLabel>
                  <OutlinedInput
                    id="email-login"
                    type="text"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter Username or Email"
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
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
                  <InputLabel htmlFor="password-login">Password</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="-password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
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
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>

              <Grid sx={{ mt: -1 }} size={12}>
                <Stack direction="row" sx={{ gap: 2, alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={checked}
                        onChange={(event) => setChecked(event.target.checked)}
                        name="checked"
                        color="primary"
                        size="small"
                      />
                    }
                    label={<Typography variant="h6">Keep me signed in</Typography>}
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
                    sx={{ fontWeight: 700 }}
                  >
                    Sign In to Store
                  </Button>
                </AnimateButton>
              </Grid>

              {/* Quick Preset Demo Accounts */}
              <Grid size={12}>
                <Divider sx={{ my: 1 }}>
                  <Typography variant="caption" color="textSecondary" fontWeight={600}>
                    QUICK DEMO ACCOUNTS
                  </Typography>
                </Divider>

                <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<SafetyCertificateOutlined />}
                    onClick={() => handleQuickLogin('admin@rehmat.com', '123456')}
                    sx={{ fontWeight: 700 }}
                  >
                    Super Admin
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<UserOutlined />}
                    onClick={() => handleQuickLogin('storekeeper@rehmat.com', '123456')}
                    sx={{ fontWeight: 700 }}
                  >
                    Store Keeper
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}

AuthLogin.propTypes = { isDemo: PropTypes.bool };
