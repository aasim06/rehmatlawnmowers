import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// project imports
import { getCardSurfaceSx, getSubSurfaceSx, getToneColors } from 'utils/themeSurface';
import DepartmentSwitcher from './DepartmentSwitcher';

/**
 * Shared TailAdmin Executive Banner rendered at the top of all Dashboards
 * and History & Ledger screens with unified icon container, status pill, actions,
 * and integrated 3-department quick switcher.
 */
export default function MasterExecutiveHeader({
  switcherMode = 'dashboard',
  activeDepartment,
  title,
  subtitle,
  badgeLabel,
  badgeColor = 'primary',
  dateBadge,
  headerIcon,
  actions
}) {
  const theme = useTheme();
  const cardSurface = getCardSurfaceSx(theme);
  const primaryTone = getToneColors(theme, 'primary');

  return (
    <Paper
      elevation={0}
      sx={{
        ...cardSurface,
        p: { xs: 2, sm: 2.75 },
        mb: 2.5
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
          {headerIcon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: primaryTone.bg,
                color: primaryTone.main,
                border: '1px solid',
                borderColor: primaryTone.border,
                fontSize: '1.35rem',
                flexShrink: 0
              }}
            >
              {headerIcon}
            </Box>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.015em', color: 'text.primary' }}>
                {title}
              </Typography>
              {badgeLabel && (
                <Chip
                  label={badgeLabel}
                  size="small"
                  color={badgeColor}
                  variant="light"
                  sx={{ height: 24, fontSize: '0.72rem', fontWeight: 600 }}
                />
              )}
              {dateBadge && (
                <Typography
                  variant="caption"
                  sx={{
                    ...getSubSurfaceSx(theme),
                    color: 'text.secondary',
                    fontWeight: 600,
                    px: 1.25,
                    py: 0.3,
                    borderRadius: 999
                  }}
                >
                  {dateBadge}
                </Typography>
              )}
            </Box>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {actions && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', lg: 'flex-end' },
              flexWrap: 'wrap',
              gap: 1.25,
              width: { xs: '100%', lg: 'auto' }
            }}
          >
            {actions}
          </Box>
        )}
      </Box>

      <DepartmentSwitcher mode={switcherMode} activeDepartment={activeDepartment} />
    </Paper>
  );
}

MasterExecutiveHeader.propTypes = {
  switcherMode: PropTypes.oneOf(['dashboard', 'ledger']),
  activeDepartment: PropTypes.oneOf(['factory-store', 'machine-production', 'shop-mart']).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  badgeLabel: PropTypes.string,
  badgeColor: PropTypes.string,
  dateBadge: PropTypes.string,
  headerIcon: PropTypes.node,
  actions: PropTypes.node
};

