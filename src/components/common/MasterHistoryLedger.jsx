import PropTypes from 'prop-types';
import { useMemo } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// icons
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import ReloadOutlined from '@ant-design/icons/ReloadOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';

// project imports
import MainCard from 'components/MainCard';
import { getActiveRangePreset, getQuickRangeDates } from 'utils/ledgerHelpers';
import { getCardSurfaceSx } from 'utils/themeSurface';
import AppButton from './AppButton';
import MasterExecutiveHeader from './MasterExecutiveHeader';
import MasterKpiGrid from './MasterKpiGrid';

/**
 * Unified Master History & Ledger shell shared across Factory Store, Machine Production,
 * and Retail Shop Mart so all three modules share consistent navigation, KPIs, date presets,
 * table surfaces, and button rules.
 */
export default function MasterHistoryLedger({
  activeDepartment,
  title,
  subtitle,
  badgeLabel = 'Live Ledger',
  headerIcon,
  headerActions,
  kpis = [],
  searchTerm = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  startDate = '',
  onStartDateChange,
  endDate = '',
  onEndDateChange,
  onResetFilters,
  hasExtraActiveFilters = false,
  extraFilters,
  quickRangeChips,
  registerTitle,
  registerCount,
  registerCountLabel = 'Records',
  registerChips,
  registerActions,
  children,
  pagination
}) {
  const theme = useTheme();
  const cardSurface = getCardSurfaceSx(theme);

  const activePreset = useMemo(() => getActiveRangePreset(startDate, endDate), [startDate, endDate]);
  const hasAnyFilter = Boolean(searchTerm || startDate || endDate || hasExtraActiveFilters);

  const handlePresetClick = (preset) => {
    const { startDate: s, endDate: e } = getQuickRangeDates(preset);
    if (onStartDateChange) onStartDateChange(s);
    if (onEndDateChange) onEndDateChange(e);
  };

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      {/* 1. Executive Header + 3-Module Ledger Switcher */}
      <MasterExecutiveHeader
        switcherMode="ledger"
        activeDepartment={activeDepartment}
        title={title}
        subtitle={subtitle}
        badgeLabel={badgeLabel}
        badgeColor="primary"
        headerIcon={headerIcon}
        actions={headerActions}
      />

      {/* 2. 4 Uniform Executive KPI Cards */}
      <MasterKpiGrid kpis={kpis} />

      {/* 3. Unified Search, Filter & Quick Date Range Bar */}
      <Paper elevation={0} sx={{ ...cardSurface, p: 2, mb: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <TextField
            size="small"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            sx={{
              flex: '1 1 240px',
              minWidth: 200,
              '& .MuiOutlinedInput-root': { height: 38 }
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlined style={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
                endAdornment: searchTerm ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange?.('')}>
                      <CloseCircleOutlined style={{ fontSize: 13, color: '#94a3b8' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
            }}
          />

          {extraFilters}

          <TextField
            label="From Date"
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => onStartDateChange?.(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              flex: '0 0 150px',
              '& .MuiOutlinedInput-root': { height: 38 }
            }}
          />

          <TextField
            label="To Date"
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => onEndDateChange?.(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
              flex: '0 0 150px',
              '& .MuiOutlinedInput-root': { height: 38 }
            }}
          />

          {hasAnyFilter && onResetFilters && (
            <AppButton intent="cancel" startIcon={<ReloadOutlined />} onClick={onResetFilters}>
              Reset
            </AppButton>
          )}
        </Box>

        {/* Quick Range Presets Strip */}
        <Box
          sx={{
            mt: 1.75,
            pt: 1.5,
            borderTop: '1px dashed',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>
              Quick Range:
            </Typography>
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'Past 7 Days' },
              { key: 'month', label: 'This Month' }
            ].map((preset) => (
              <Chip
                key={preset.key}
                label={preset.label}
                size="small"
                clickable
                color={activePreset === preset.key ? 'primary' : 'default'}
                variant={activePreset === preset.key ? 'filled' : 'outlined'}
                onClick={() => handlePresetClick(preset.key)}
                sx={{ fontWeight: 700, height: 26, fontSize: '0.75rem' }}
              />
            ))}

            {quickRangeChips}
          </Box>

          {(startDate || endDate) && (
            <Chip
              label={`Period: ${startDate || 'Start'} → ${endDate || 'Today'}`}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 700, height: 26 }}
            />
          )}
        </Box>
      </Paper>

      {/* 4. Unified Ledger Register Table Container */}
      <MainCard
        content={false}
        sx={{
          ...cardSurface,
          overflow: 'hidden'
        }}
      >
        {(registerTitle || registerActions || registerChips) && (
          <Box
            sx={{
              px: 2.5,
              py: 1.75,
              borderBottom: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 1.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h5" fontWeight={800}>
                {registerTitle}
              </Typography>
              {typeof registerCount === 'number' && (
                <Chip
                  label={`${registerCount} ${registerCountLabel}`}
                  size="small"
                  color="primary"
                  variant="light"
                  sx={{ fontWeight: 700, height: 22 }}
                />
              )}
              {registerChips}
            </Box>

            {registerActions && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                {registerActions}
              </Box>
            )}
          </Box>
        )}

        {children}

        {pagination && (
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={pagination.count}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={pagination.onPageChange}
            onRowsPerPageChange={pagination.onRowsPerPageChange}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </MainCard>
    </Box>
  );
}

MasterHistoryLedger.propTypes = {
  activeDepartment: PropTypes.oneOf(['factory-store', 'machine-production', 'shop-mart']).isRequired,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  badgeLabel: PropTypes.string,
  headerIcon: PropTypes.node,
  headerActions: PropTypes.node,
  kpis: PropTypes.arrayOf(PropTypes.object),
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  startDate: PropTypes.string,
  onStartDateChange: PropTypes.func,
  endDate: PropTypes.string,
  onEndDateChange: PropTypes.func,
  onResetFilters: PropTypes.func,
  hasExtraActiveFilters: PropTypes.bool,
  extraFilters: PropTypes.node,
  quickRangeChips: PropTypes.node,
  registerTitle: PropTypes.string,
  registerCount: PropTypes.number,
  registerCountLabel: PropTypes.string,
  registerChips: PropTypes.node,
  registerActions: PropTypes.node,
  children: PropTypes.node,
  pagination: PropTypes.shape({
    count: PropTypes.number.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    page: PropTypes.number.isRequired,
    onPageChange: PropTypes.func.isRequired,
    onRowsPerPageChange: PropTypes.func.isRequired
  })
};
