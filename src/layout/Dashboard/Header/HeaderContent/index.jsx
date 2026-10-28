// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

// project imports
import Search from './Search';
import Profile from './Profile';
import Notification from './Notification';
import MobileSection from './MobileSection';
import MagicThemeToggler from 'components/@extended/MagicThemeToggler';
import LiveCloudStatusBadge from 'components/@extended/LiveCloudStatusBadge';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  return (
    <>
      {!downLG && <Search />}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      <Stack
        direction="row"
        alignItems="center"
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ ml: 'auto', flexShrink: 0 }}
      >
        {/* Live Cloud Status Badge (Auto-Update indicator) */}
        <LiveCloudStatusBadge />

        {/* Magic UI Style Theme Toggler */}
        <MagicThemeToggler />

        <Notification />
        {!downLG && <Profile />}
        {downLG && <MobileSection />}
      </Stack>
    </>
  );
}
