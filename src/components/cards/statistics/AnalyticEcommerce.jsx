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

const PILL_COLORS = {
  emerald: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10b981', border: 'rgba(16, 185, 129, 0.25)' },
  rose: { bg: 'rgba(244, 63, 94, 0.12)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.25)' },
  indigo: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8', border: 'rgba(99, 102, 241, 0.25)' },
  sky: { bg: 'rgba(14, 165, 233, 0.12)', text: '#38bdf8', border: 'rgba(14, 165, 233, 0.25)' },
  amber: { bg: 'rgba(245, 158, 11, 0.12)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)' }
};

function resolveBadge(color, pillColor, isLoss) {
  if (pillColor && PILL_COLORS[pillColor]) return PILL_COLORS[pillColor];
  if (isLoss) return PILL_COLORS.rose;
  if (color === 'success') return PILL_COLORS.emerald;
  if (color === 'error') return PILL_COLORS.rose;
  if (color === 'warning') return PILL_COLORS.amber;
  if (color === 'info') return PILL_COLORS.sky;
  return PILL_COLORS.indigo;
}

export default function AnalyticEcommerce({
  color = 'primary',
  title,
  count,
  percentage,
  isLoss,
  extra,
  accentColor,
  pillColor,
  icon
}) {
  const badge = resolveBadge(color, pillColor, isLoss);

  return (
    <MainCard
      contentSX={{ p: 2.25 }}
      sx={(theme) => ({
        border: '1px solid',
        borderColor: theme.palette.mode === 'dark' ? '#1e293b' : theme.palette.divider,
        background: theme.palette.mode === 'dark' ? '#131b2e' : theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark' ? '0 1px 3px 0 rgba(0, 0, 0, 0.35)' : '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : theme.palette.grey[300],
          boxShadow: theme.palette.mode === 'dark' ? '0 4px 14px 0 rgba(0, 0, 0, 0.45)' : '0 4px 12px 0 rgba(0, 0, 0, 0.08)'
        }
      })}
    >
      {/* Top Header Row: Title & Contextual Badge */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 1,
          mb: 0.5
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            lineHeight: 1.3
          }}
        >
          {title}
        </Typography>

        {icon && (
          <Box
            sx={{
              width: 28,
              height: 28,
              minWidth: 28,
              borderRadius: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: badge.bg,
              color: badge.text,
              border: '1px solid',
              borderColor: badge.border,
              flexShrink: 0
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      {/* Main Metric Value */}
      <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 1, mb: 0.5 }}>
        <Typography
          variant="h3"
          sx={{
            color: 'text.primary',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            fontSize: { xs: '1.4rem', sm: '1.65rem' }
          }}
        >
          {count}
        </Typography>
        {percentage && (
          <Chip
            variant="combined"
            color={color}
            icon={isLoss ? <FallOutlined style={iconSX} /> : <RiseOutlined style={iconSX} />}
            label={`${percentage}%`}
            sx={{ ml: 1, pl: 0.75 }}
            size="small"
          />
        )}
      </Stack>

      {/* Bottom Meta Indicator */}
      {extra && (
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.75 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: badge.text, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {extra}
          </Typography>
        </Stack>
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
  pillColor: PropTypes.string,
  icon: PropTypes.node
};
