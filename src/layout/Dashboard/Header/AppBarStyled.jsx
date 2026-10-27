// material-ui
import { styled } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';

// project imports
import { DRAWER_WIDTH } from 'config';

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1e293b' : theme.vars.palette.divider}`,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen
  }),
  variants: [
    {
      props: ({ open }) => !open,
      style: {
        width: `calc(100% - ${theme.spacing(7.5)})`
      }
    },
    {
      props: ({ open }) => open,
      style: {
        marginLeft: DRAWER_WIDTH,
        width: `calc(100% - ${DRAWER_WIDTH}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen
        })
      }
    }
  ]
}));

export default AppBarStyled;
