import PropTypes from 'prop-types';
import { useId, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// material-ui
import { alpha, useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

// charts
import { BarChart, Gauge, LineChart, axisClasses, chartsGridClasses, gaugeClasses, lineClasses } from '@mui/x-charts';

// icons
import ArrowRightOutlined from '@ant-design/icons/ArrowRightOutlined';
import BarChartOutlined from '@ant-design/icons/BarChartOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';

// project imports
import { getCardSurfaceSx, getSubSurfaceSx, getToneColors } from 'utils/themeSurface';
import AppButton from './AppButton';
import MasterExecutiveHeader from './MasterExecutiveHeader';
import MasterKpiGrid from './MasterKpiGrid';

/**
 * Shared TailAdmin pill toggle used for chart style, timeframe, and activity filters.
 */
function SegmentedToggle({ options, value, onChange, theme }) {
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        ...getSubSurfaceSx(theme),
        display: 'inline-flex',
        p: 0.35,
        borderRadius: 2
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <Button
            key={opt.key}
            size="small"
            onClick={() => onChange(opt.key)}
            sx={{
              minWidth: 46,
              px: 1.2,
              py: 0.35,
              borderRadius: 1.5,
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'none',
              bgcolor: isActive ? (isDark ? '#101828' : '#ffffff') : 'transparent',
              color: isActive ? (isDark ? '#8098f9' : 'primary.main') : 'text.secondary',
              boxShadow: isActive ? (isDark ? '0 1px 3px rgba(0,0,0,0.45)' : '0 1px 2px rgba(16,24,40,0.08)') : 'none'
            }}
          >
            {opt.label}
          </Button>
        );
      })}
    </Box>
  );
}

SegmentedToggle.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired
};

/**
 * Unified Master Dashboard layout used across Factory Store, Machine Production,
 * and Retail Shop Mart so all three departments share consistent UX and theme fidelity.
 */
export default function MasterDashboard({
  activeDepartment,
  title,
  subtitle,
  badgeLabel = 'Live',
  headerIcon,
  quickActions = [],
  alertBanner,
  healthyMessage,
  kpis = [],
  chartConfig,
  overviewPanel,
  activityPanel,
  watchlistPanel,
  footerSlot
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDark = theme.palette.mode === 'dark';

  const [chartView, setChartView] = useState(chartConfig?.defaultView || 'weekly');
  const [chartStyle, setChartStyle] = useState(null);
  const [activityFilter, setActivityFilter] = useState('ALL');
  const areaGradientPrefix = `tailadmin-area-${useId().replace(/:/g, '')}`;

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  const activeChartSeries = useMemo(() => {
    if (!chartConfig) return null;
    if (chartView === 'monthly' && chartConfig.monthly) return chartConfig.monthly;
    return chartConfig.weekly || chartConfig.monthly || null;
  }, [chartConfig, chartView]);

  const hasChartData = useMemo(() => {
    if (!activeChartSeries || !Array.isArray(activeChartSeries.series)) return false;
    return activeChartSeries.series.some((s) => Array.isArray(s.data) && s.data.some((v) => Number(v) > 0));
  }, [activeChartSeries]);

  const filteredActivities = useMemo(() => {
    const items = activityPanel?.items || [];
    if (activityFilter === 'ALL') return items;
    return items.filter((entry) => entry.filterKey === activityFilter);
  }, [activityPanel, activityFilter]);

  const cardSurface = getCardSurfaceSx(theme);

  return (
    <Box sx={{ width: '100%', pb: 3 }}>
      {/* 1. Executive Header + 3-Department Quick Switcher */}
      <MasterExecutiveHeader
        switcherMode="dashboard"
        activeDepartment={activeDepartment}
        title={title}
        subtitle={subtitle}
        badgeLabel={badgeLabel}
        badgeColor="success"
        dateBadge={todayFormatted}
        headerIcon={headerIcon}
        actions={
          quickActions.length > 0 &&
          quickActions.map((action, idx) => (
            <AppButton
              key={action.label || idx}
              intent={
                action.intent || (action.variant === 'outlined' ? 'secondary' : idx === quickActions.length - 1 ? 'primary' : 'secondary')
              }
              color={action.color}
              size="medium"
              startIcon={action.icon}
              onClick={() => (action.onClick ? action.onClick() : action.to && navigate(action.to))}
            >
              {action.label}
            </AppButton>
          ))
        }
      />

      {/* 2. Contextual Health or Warning Strip */}
      {alertBanner ? (
        <Alert
          severity={alertBanner.severity || 'warning'}
          icon={alertBanner.icon || <WarningOutlined />}
          sx={{
            mb: 2.5,
            borderRadius: 2,
            border: '1px solid',
            borderColor: alertBanner.severity === 'error' ? alpha(theme.palette.error.main, 0.35) : alpha(theme.palette.warning.main, 0.35),
            fontWeight: 600,
            alignItems: 'center'
          }}
          action={
            alertBanner.actionLabel && (
              <Button
                color="inherit"
                size="small"
                component={alertBanner.actionTo ? Link : 'button'}
                to={alertBanner.actionTo}
                onClick={alertBanner.onActionClick}
                endIcon={<ArrowRightOutlined />}
                sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {alertBanner.actionLabel}
              </Button>
            )
          }
        >
          {alertBanner.message}
        </Alert>
      ) : (
        healthyMessage && (
          <Alert
            severity="success"
            icon={<CheckCircleOutlined />}
            sx={{
              mb: 2.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(theme.palette.success.main, 0.3),
              bgcolor: alpha(theme.palette.success.main, isDark ? 0.1 : 0.06),
              fontWeight: 600
            }}
          >
            {healthyMessage}
          </Alert>
        )
      )}

      {/* 3. 4 Balanced Executive KPI Cards */}
      <MasterKpiGrid kpis={kpis} />

      {/* 4. Visual Insights Row: Left TailAdmin Flow Chart + Right Radial Target / Health Gauge */}
      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* Left: TailAdmin Bar & Gradient Area Chart Panel */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{ ...cardSurface, p: { xs: 2.25, sm: 2.75 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1.5,
                mb: 2.25
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary' }}>
                  {chartConfig?.title || 'Activity Flow'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {chartConfig?.subtitle || 'Real-time operational performance'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
                {/* Series Legend */}
                {activeChartSeries?.series?.map((ser) => (
                  <Box key={ser.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ser.color || theme.palette.primary.main }} />
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {ser.label}
                    </Typography>
                  </Box>
                ))}

                {/* TailAdmin Bar vs Smooth Area Toggle */}
                {hasChartData && (
                  <SegmentedToggle
                    theme={theme}
                    value={chartStyle || activeChartSeries?.type || 'bar'}
                    onChange={setChartStyle}
                    options={[
                      { key: 'bar', label: 'Bars' },
                      { key: 'line', label: 'Area' }
                    ]}
                  />
                )}

                {/* Weekly / Monthly Toggle */}
                {chartConfig?.weekly && chartConfig?.monthly && (
                  <SegmentedToggle
                    theme={theme}
                    value={chartView}
                    onChange={(nextView) => {
                      setChartView(nextView);
                      setChartStyle(null);
                    }}
                    options={[
                      { key: 'weekly', label: 'Week' },
                      { key: 'monthly', label: 'Month' }
                    ]}
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ flex: 1, minHeight: 285, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!hasChartData ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    gap: 1,
                    py: 5,
                    px: 2
                  }}
                >
                  <BarChartOutlined style={{ fontSize: '2.5rem', color: theme.palette.text.disabled }} />
                  <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
                    {chartConfig?.emptyTitle || 'No activity recorded for this timeframe yet'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 360 }}>
                    {chartConfig?.emptySubtitle ||
                      'Once entries are recorded using the action buttons above, your trend graph will appear automatically.'}
                  </Typography>
                </Box>
              ) : (chartStyle || activeChartSeries?.type) === 'line' ? (
                <LineChart
                  hideLegend
                  height={295}
                  grid={{ horizontal: true, vertical: false }}
                  xAxis={[{ scaleType: 'point', data: activeChartSeries.labels, tickSize: 0, disableLine: true }]}
                  yAxis={[{ tickSize: 0, disableLine: true }]}
                  margin={{ top: 20, bottom: 26, left: 46, right: 18 }}
                  series={activeChartSeries.series.map((s, idx) => ({
                    type: 'line',
                    id: `master-series-${idx}`,
                    curve: 'monotoneX',
                    data: s.data,
                    label: s.label,
                    area: true,
                    showMark: false,
                    color: s.color || (idx === 0 ? theme.palette.primary.main : theme.palette.success.main),
                    strokeWidth: 2.5
                  }))}
                  sx={{
                    [`& .${chartsGridClasses.line}`]: {
                      strokeDasharray: '4 4',
                      stroke: isDark ? '#2e3a47' : '#e4e7ec'
                    },
                    ...Object.fromEntries(
                      activeChartSeries.series.map((_, idx) => [
                        `& .${lineClasses.area}[data-series="master-series-${idx}"]`,
                        {
                          fill: `url(#${areaGradientPrefix}-${idx})`,
                          fillOpacity: 1
                        }
                      ])
                    ),
                    [`& .${axisClasses.root} .${axisClasses.tick}`]: { stroke: 'transparent' },
                    [`& .${axisClasses.root} .${axisClasses.tickLabel}`]: {
                      fill: `${theme.palette.text.secondary} !important`,
                      fontSize: '0.75rem',
                      fontFamily: theme.typography.fontFamily
                    }
                  }}
                >
                  <defs>
                    {activeChartSeries.series.map((s, idx) => {
                      const stopColor = s.color || (idx === 0 ? theme.palette.primary.main : theme.palette.success.main);
                      return (
                        <linearGradient key={`grad-${idx}`} id={`${areaGradientPrefix}-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stopColor} stopOpacity={isDark ? 0.36 : 0.28} />
                          <stop offset="95%" stopColor={stopColor} stopOpacity={0.01} />
                        </linearGradient>
                      );
                    })}
                  </defs>
                </LineChart>
              ) : (
                <BarChart
                  hideLegend
                  height={295}
                  borderRadius={6}
                  grid={{ horizontal: true, vertical: false }}
                  xAxis={[
                    {
                      data: activeChartSeries.labels,
                      scaleType: 'band',
                      categoryGapRatio: 0.46,
                      barGapRatio: 0.2,
                      disableLine: true
                    }
                  ]}
                  yAxis={[{ disableLine: true }]}
                  margin={{ top: 20, bottom: 26, left: 46, right: 18 }}
                  series={activeChartSeries.series.map((s, idx) => ({
                    data: s.data,
                    label: s.label,
                    color: s.color || (idx === 0 ? theme.palette.primary.main : theme.palette.success.main)
                  }))}
                  sx={{
                    [`& .${chartsGridClasses.line}`]: {
                      strokeDasharray: '4 4',
                      stroke: isDark ? '#2e3a47' : '#e4e7ec'
                    },
                    [`& .${axisClasses.root} .${axisClasses.tick}`]: { stroke: 'transparent' },
                    [`& .${axisClasses.root} .${axisClasses.tickLabel}`]: {
                      fill: `${theme.palette.text.secondary} !important`,
                      fontSize: '0.75rem',
                      fontFamily: theme.typography.fontFamily
                    }
                  }}
                />
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right: TailAdmin Radial Gauge Target & Breakdown Card */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            elevation={0}
            sx={{
              ...cardSurface,
              p: { xs: 2.25, sm: 2.75 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.25 }}>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ color: 'text.primary' }}>
                  {overviewPanel?.title || 'Department Health'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {overviewPanel?.subtitle || 'Quick status check'}
                </Typography>
              </Box>

              {overviewPanel?.health && (
                <Chip
                  size="small"
                  label={overviewPanel.health.statusLabel}
                  color={overviewPanel.health.percent >= 75 ? 'success' : overviewPanel.health.percent >= 45 ? 'warning' : 'error'}
                  variant="light"
                  sx={{ fontWeight: 600, flexShrink: 0 }}
                />
              )}
            </Box>

            {/* TailAdmin Semi-Circle Radial Target Gauge */}
            {overviewPanel?.health && (
              <Box
                sx={{
                  ...getSubSurfaceSx(theme),
                  px: 2,
                  pt: 1.25,
                  pb: 2,
                  textAlign: 'center'
                }}
              >
                <Box sx={{ width: '100%', maxWidth: 250, height: 144, mx: 'auto' }}>
                  <Gauge
                    value={Math.max(0, Math.min(100, overviewPanel.health.percent || 0))}
                    valueMin={0}
                    valueMax={100}
                    startAngle={-90}
                    endAngle={90}
                    innerRadius="80%"
                    outerRadius="100%"
                    cornerRadius="50%"
                    cy="82%"
                    text={({ value }) => `${value}%`}
                    sx={{
                      [`& .${gaugeClasses.valueText}`]: {
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        fontFamily: theme.typography.fontFamily,
                        transform: 'translate(0px, -12px)',
                        fill: theme.palette.text.primary
                      },
                      [`& .${gaugeClasses.valueArc}`]: {
                        fill:
                          overviewPanel.health.percent >= 75
                            ? theme.palette.primary.main
                            : overviewPanel.health.percent >= 45
                              ? theme.palette.warning.main
                              : theme.palette.error.main
                      },
                      [`& .${gaugeClasses.referenceArc}`]: {
                        fill: isDark ? '#2e3a47' : '#e4e7ec'
                      }
                    }}
                  />
                </Box>

                <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mt: -0.5 }}>
                  {overviewPanel.health.label}
                </Typography>
                {overviewPanel.health.helper && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.35 }}>
                    {overviewPanel.health.helper}
                  </Typography>
                )}
              </Box>
            )}

            <Divider />

            {/* Breakdown List */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.primary' }}>
                {overviewPanel?.breakdownTitle || 'Top Breakdown'}
              </Typography>

              {!overviewPanel?.breakdownItems || overviewPanel.breakdownItems.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  {overviewPanel?.emptyText || 'No records available yet.'}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {overviewPanel.breakdownItems.map((row, idx) => (
                    <Box key={row.label || idx}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.6 }}>
                        <Typography variant="caption" fontWeight={600} color="text.primary" noWrap sx={{ pr: 1 }}>
                          {row.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
                          {row.valueText}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, row.percent || 0))}
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          bgcolor: isDark ? '#2e3a47' : '#e4e7ec',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 999,
                            bgcolor: row.tone ? getToneColors(theme, row.tone).solid : theme.palette.primary.main
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 5. Bottom Operational Panels: Clean Live Activity Stream + Watchlist */}
      <Grid container spacing={2.25}>
        {/* Left: Live Operations Feed */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper elevation={0} sx={{ ...cardSurface, p: 2.5, height: '100%' }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1.25,
                mb: 2
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  {activityPanel?.title || 'Recent Live Activity'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activityPanel?.subtitle || 'Latest movements in plain language'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                {activityPanel?.filters && (
                  <SegmentedToggle theme={theme} value={activityFilter} onChange={setActivityFilter} options={activityPanel.filters} />
                )}

                {activityPanel?.viewAllTo && (
                  <Button
                    size="small"
                    component={Link}
                    to={activityPanel.viewAllTo}
                    endIcon={<ArrowRightOutlined style={{ fontSize: '0.72rem' }} />}
                    sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.8rem' }}
                  >
                    {activityPanel.viewAllLabel || 'View All'}
                  </Button>
                )}
              </Box>
            </Box>

            {filteredActivities.length === 0 ? (
              <Box sx={{ py: 5, textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  {activityPanel?.emptyTitle || 'No recent activity recorded'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {activityPanel?.emptySubtitle || 'New records will show up here automatically.'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {filteredActivities.slice(0, 7).map((item, idx) => {
                  const tone = getToneColors(theme, item.tone || 'primary');
                  return (
                    <Box
                      key={item.id || idx}
                      onClick={item.to ? () => navigate(item.to) : undefined}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'divider',
                        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'grey.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        cursor: item.to ? 'pointer' : 'default',
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#fff'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.75,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: tone.bg,
                            color: tone.main,
                            border: '1px solid',
                            borderColor: tone.border,
                            flexShrink: 0
                          }}
                        >
                          {item.icon}
                        </Box>

                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>
                              {item.title}
                            </Typography>
                            {item.badge && (
                              <Chip
                                label={item.badge}
                                size="small"
                                color={item.badgeColor || 'default'}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                              />
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: 0.25 }}>
                            {item.subtitle}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ color: tone.main }}>
                          {item.rightPrimary}
                        </Typography>
                        {item.rightSecondary && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {item.rightSecondary}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right: Priority Watchlist / Quick Summary */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper elevation={0} sx={{ ...cardSurface, p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  {watchlistPanel?.title || 'Attention Watchlist'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {watchlistPanel?.subtitle || 'Items that need your eye today'}
                </Typography>
              </Box>
              {watchlistPanel?.viewAllTo && (
                <Button
                  size="small"
                  component={Link}
                  to={watchlistPanel.viewAllTo}
                  endIcon={<ArrowRightOutlined style={{ fontSize: '0.72rem' }} />}
                  sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.8rem' }}
                >
                  {watchlistPanel.viewAllLabel || 'Manage'}
                </Button>
              )}
            </Box>

            {!watchlistPanel?.items || watchlistPanel.items.length === 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  gap: 1,
                  py: 5,
                  px: 2
                }}
              >
                <CheckCircleOutlined style={{ fontSize: '2.2rem', color: theme.palette.success.main, opacity: 0.75 }} />
                <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                  {watchlistPanel?.emptyTitle || 'Everything looks balanced'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {watchlistPanel?.emptySubtitle || 'No urgent action needed right now.'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {watchlistPanel.items.slice(0, 7).map((entry, idx) => {
                  const tone = getToneColors(theme, entry.tone || 'neutral');
                  return (
                    <Box
                      key={entry.id || idx}
                      onClick={entry.to ? () => navigate(entry.to) : undefined}
                      sx={{
                        p: 1.4,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: entry.urgent ? alpha(theme.palette.error.main, 0.3) : 'divider',
                        bgcolor: entry.urgent
                          ? alpha(theme.palette.error.main, isDark ? 0.08 : 0.03)
                          : isDark
                            ? 'rgba(255,255,255,0.02)'
                            : 'grey.50',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1.5,
                        cursor: entry.to ? 'pointer' : 'default'
                      }}
                    >
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} noWrap>
                          {entry.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                          {entry.subtitle}
                        </Typography>
                      </Box>

                      <Chip
                        label={entry.statusText}
                        size="small"
                        color={entry.chipColor || 'default'}
                        variant="outlined"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.73rem',
                          borderColor: entry.chipColor ? undefined : tone.border,
                          flexShrink: 0
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 6. Optional Department-Specific Footer Slot */}
      {footerSlot && <Box sx={{ mt: 3 }}>{footerSlot}</Box>}
    </Box>
  );
}

MasterDashboard.propTypes = {
  activeDepartment: PropTypes.oneOf(['factory-store', 'machine-production', 'shop-mart']).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  badgeLabel: PropTypes.string,
  headerIcon: PropTypes.node,
  quickActions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      to: PropTypes.string,
      onClick: PropTypes.func,
      variant: PropTypes.string,
      color: PropTypes.string
    })
  ),
  alertBanner: PropTypes.shape({
    severity: PropTypes.oneOf(['error', 'warning', 'info', 'success']),
    message: PropTypes.string.isRequired,
    actionLabel: PropTypes.string,
    actionTo: PropTypes.string,
    onActionClick: PropTypes.func,
    icon: PropTypes.node
  }),
  healthyMessage: PropTypes.string,
  kpis: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
      helper: PropTypes.string,
      icon: PropTypes.node,
      tone: PropTypes.oneOf(['primary', 'success', 'warning', 'error', 'info', 'neutral']),
      highlightValue: PropTypes.bool,
      to: PropTypes.string
    })
  ),
  chartConfig: PropTypes.object,
  overviewPanel: PropTypes.object,
  activityPanel: PropTypes.object,
  watchlistPanel: PropTypes.object,
  footerSlot: PropTypes.node
};
