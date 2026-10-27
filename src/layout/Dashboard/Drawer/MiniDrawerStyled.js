// material-ui
import { styled } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';

// project imports
import { DRAWER_WIDTH } from 'config';

const openedMixin = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    width: DRAWER_WIDTH,
    borderRight: '1px solid',
    borderRightColor: isDark ? '#1e293b' : theme.vars.palette.divider,
    backgroundColor: isDark ? '#0f172a' : theme.vars.palette.background.paper,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    }),
    overflowX: 'hidden',
    boxShadow: 'none'
  };
};

const closedMixin = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    overflowX: 'hidden',
    width: theme.spacing(7.5),
    borderRight: '1px solid',
    borderRightColor: isDark ? '#1e293b' : 'transparent',
    backgroundColor: isDark ? '#0f172a' : theme.vars.palette.background.paper,
    boxShadow: theme.vars.customShadows.z1
  };
};

// ==============================|| DRAWER - MINI STYLED ||============================== //

const MiniDrawerStyled = styled(Drawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme }) => ({
  width: DRAWER_WIDTH,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  variants: [
    {
      props: ({ open }) => open,
      style: { ...openedMixin(theme), '& .MuiDrawer-paper': openedMixin(theme) }
    },
    {
      props: ({ open }) => !open,
      style: { ...closedMixin(theme), '& .MuiDrawer-paper': closedMixin(theme) }
    }
  ]
}));

export default MiniDrawerStyled;
