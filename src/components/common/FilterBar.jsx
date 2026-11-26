import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ClearOutlined from '@ant-design/icons/ClearOutlined';
import { getSubSurfaceSx } from 'utils/themeSurface';
import AppButton from './AppButton';

/**
 * Reusable FilterBar component for table/list filters.
 */
export default function FilterBar({ children, onClear, hasActiveFilters = false, activeCount, sx = {} }) {
  return (
    <Box
      sx={(theme) => ({
        ...getSubSurfaceSx(theme),
        p: 1.75,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
        mb: 2.25,
        ...sx
      })}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          flexWrap: 'wrap',
          flexGrow: 1,
          gap: 1.25
        }}
      >
        {children}
      </Box>

      {hasActiveFilters && onClear && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
          {typeof activeCount === 'number' && activeCount > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {activeCount} active filter{activeCount > 1 ? 's' : ''}
            </Typography>
          )}
          <AppButton size="small" intent="ghost" color="error" startIcon={<ClearOutlined />} onClick={onClear}>
            Reset
          </AppButton>
        </Box>
      )}
    </Box>
  );
}

FilterBar.propTypes = {
  children: PropTypes.node,
  onClear: PropTypes.func,
  hasActiveFilters: PropTypes.bool,
  activeCount: PropTypes.number,
  sx: PropTypes.object
};
