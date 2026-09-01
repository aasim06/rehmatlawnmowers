import PropTypes from 'prop-types';

// material-ui
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// project imports
import MainCard from 'components/MainCard';

// assets
import RiseOutlined from '@ant-design/icons/RiseOutlined';
import FallOutlined from '@ant-design/icons/FallOutlined';

const iconSX = { fontSize: '0.75rem', color: 'inherit', marginLeft: 0, marginRight: 0 };

export default function AnalyticEcommerce({
  color = 'primary',
  title,
  count,
  percentage,
  isLoss,
  extra,
  accentColor = '#3b82f6',
  bgGradient
}) {
  return (
    <MainCard
      contentSX={{ p: 2.25 }}
      sx={(theme) => ({
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : theme.palette.divider,
        background:
          theme.palette.mode === 'dark'
            ? bgGradient || `radial-gradient(circle at 12% 20%, ${accentColor}25 0%, #16171e 75%)`
            : theme.palette.background.paper
      })}
    >
      <Stack sx={{ gap: 0.5 }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          {title}
        </Typography>
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <Typography variant="h4" sx={{ color: 'text.primary' }}>
            {count}
          </Typography>
          {percentage && (
            <Chip
              variant="combined"
              color={color}
              icon={isLoss ? <FallOutlined style={iconSX} /> : <RiseOutlined style={iconSX} />}
              label={`${percentage}%`}
              sx={{ ml: 1.25, pl: 1 }}
              size="small"
            />
          )}
        </Stack>
      </Stack>
      {extra && (
        <Box sx={{ pt: 1.5 }}>
          <Typography variant="caption" sx={{ color: accentColor || `${color || 'primary'}.main`, fontWeight: 700 }}>
            {extra}
          </Typography>
        </Box>
      )}
    </MainCard>
  );
}

AnalyticEcommerce.propTypes = {
  color: PropTypes.string,
  title: PropTypes.string,
  count: PropTypes.string,
  percentage: PropTypes.number,
  isLoss: PropTypes.bool,
  extra: PropTypes.string,
  accentColor: PropTypes.string,
  bgGradient: PropTypes.string
};
