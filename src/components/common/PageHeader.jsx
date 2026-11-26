import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

/**
 * Universal PageHeader component for consistent page titles, counts & action buttons.
 */
export default function PageHeader({
  title,
  subtitle,
  count,
  countLabel = 'Total',
  actions,
  sx = {}
}) {
  return (
    <Box
      sx={{
        mb: 2.5,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        gap: 1.5,
        ...sx
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.2 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {title}
          </Typography>
          {typeof count === 'number' && (
            <Chip
              label={`${count} ${countLabel}`}
              size="small"
              color="primary"
              variant="light"
              sx={{ fontWeight: 700, height: 24, fontSize: '0.75rem' }}
            />
          )}
        </Box>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {actions && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          {actions}
        </Box>
      )}
    </Box>
  );
}

PageHeader.propTypes = {
  title: PropTypes.node.isRequired,
  subtitle: PropTypes.string,
  count: PropTypes.number,
  countLabel: PropTypes.string,
  actions: PropTypes.node,
  sx: PropTypes.object
};

