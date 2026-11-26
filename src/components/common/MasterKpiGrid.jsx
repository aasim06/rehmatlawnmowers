import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// project imports
import { getCardSurfaceSx, getToneColors } from 'utils/themeSurface';

/**
 * Shared 4-card TailAdmin KPI metric grid reused by MasterDashboard and
 * MasterHistoryLedger so KPI geometry, hover states, and typography stay identical.
 */
export default function MasterKpiGrid({ kpis = [] }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';
  const cardSurface = getCardSurfaceSx(theme);

  return (
    <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
      {kpis.slice(0, 4).map((kpi, idx) => {
        const tone = getToneColors(theme, kpi.tone || 'primary');
        const clickable = Boolean(kpi.to || kpi.onClick);

        return (
          <Grid key={kpi.label || idx} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Paper
              elevation={0}
              onClick={kpi.onClick ? kpi.onClick : kpi.to ? () => navigate(kpi.to) : undefined}
              sx={{
                ...cardSurface,
                p: { xs: 2.25, sm: 2.5 },
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, clickable ? 0.5 : 0.35),
                  boxShadow: isDark ? '0 8px 20px rgba(0, 0, 0, 0.4)' : '0 6px 18px rgba(16, 24, 40, 0.06)',
                  transform: clickable ? 'translateY(-2px)' : 'none'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, width: '100%' }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 600,
                    fontSize: '0.8125rem'
                  }}
                >
                  {kpi.label}
                </Typography>
                {kpi.icon && (
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: tone.bg,
                      color: tone.main,
                      border: '1px solid',
                      borderColor: tone.border,
                      fontSize: '1.15rem',
                      flexShrink: 0
                    }}
                  >
                    {kpi.icon}
                  </Box>
                )}
              </Box>

              <Typography
                variant="h3"
                sx={{
                  mt: 1.5,
                  mb: 1,
                  fontWeight: 700,
                  fontSize: { xs: '1.45rem', sm: '1.65rem' },
                  letterSpacing: '-0.02em',
                  fontVariantNumeric: 'tabular-nums',
                  color: kpi.highlightValue ? tone.main : 'text.primary'
                }}
              >
                {kpi.value}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: tone.main, flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                  {kpi.helper}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
}

MasterKpiGrid.propTypes = {
  kpis: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.node.isRequired,
      helper: PropTypes.string,
      icon: PropTypes.node,
      tone: PropTypes.oneOf(['primary', 'success', 'warning', 'error', 'info', 'neutral']),
      highlightValue: PropTypes.bool,
      to: PropTypes.string,
      onClick: PropTypes.func
    })
  )
};

