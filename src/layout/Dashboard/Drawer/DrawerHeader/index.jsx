import PropTypes from 'prop-types';

// project imports
import DrawerHeaderStyled from './DrawerHeaderStyled';
import Logo from 'components/logo';

// ==============================|| DRAWER HEADER ||============================== //

export default function DrawerHeader({ open }) {
  return (
    <DrawerHeaderStyled
      open={open}
      sx={{
        minHeight: open ? '115px' : '65px',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '8px',
        paddingBottom: '8px',
        paddingLeft: 0,
        paddingRight: 0
      }}
    >
      <Logo isIcon={!open} sx={{ width: open ? '100%' : 44, height: open ? 'auto' : 44, display: 'flex', justifyContent: 'center' }} />
    </DrawerHeaderStyled>
  );
}

DrawerHeader.propTypes = { open: PropTypes.bool };
