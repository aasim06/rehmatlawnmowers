import { Box, Stack, Typography } from '@mui/material';

const DEPARTMENTS = [
  { id: 'd1', name: 'Assembly Line 1', percentage: 42, color: '#005F56', units: '105 Pcs' },
  { id: 'd2', name: 'Cutting Workshop', percentage: 28, color: '#0F766E', units: '70 Pcs' },
  { id: 'd3', name: 'Welding & Fab', percentage: 18, color: '#2563EB', units: '45 Pcs' },
  { id: 'd4', name: 'Maintenance', percentage: 12, color: '#D97706', units: '30 Pcs' }
];

export default function FintechDepartmentConsumptionCard() {
  const totalUnits = 250;

  return (
    <Box
      sx={{
        height: '100%',
        bgcolor: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #F1F5F9',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}
    >
      {/* Header Row */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 800 }}>
            All Material Consumption
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            Departmental Breakdown &amp; Usage Ratio
          </Typography>
        </Box>

        {/* Action / Filter Pill */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: '#005F56',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 700
          }}
        >
          ⚙
        </Box>
      </Stack>

      {/* Top Stats Row (Daily, Weekly, Monthly - NevBank style) */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, px: 1 }}>
        <Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
            Daily
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 800 }}>
            25 Units
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
            Weekly
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 800 }}>
            140 Units
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block' }}>
            Monthly
          </Typography>
          <Typography variant="subtitle2" sx={{ color: '#005F56', fontWeight: 800 }}>
            250 Units
          </Typography>
        </Box>
      </Stack>

      {/* Center Circular Donut Chart & Legend Stack (Exact NevBank Layout) */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-around" spacing={3} sx={{ flex: 1, py: 1 }}>
        {/* SVG Donut Ring Chart */}
        <Box sx={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="140" height="140" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F1F5F9" strokeWidth="12" />
            {/* Segment 1: Assembly (42%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#005F56"
              strokeWidth="12"
              strokeDasharray="100.5 138.2"
              strokeDashoffset="0"
              transform="rotate(-90 50 50)"
            />
            {/* Segment 2: Cutting (28%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#0F766E"
              strokeWidth="12"
              strokeDasharray="66.8 171.9"
              strokeDashoffset="-100.5"
              transform="rotate(-90 50 50)"
            />
            {/* Segment 3: Welding (18%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#2563EB"
              strokeWidth="12"
              strokeDasharray="43.0 195.7"
              strokeDashoffset="-167.3"
              transform="rotate(-90 50 50)"
            />
            {/* Segment 4: Maintenance (12%) */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#D97706"
              strokeWidth="12"
              strokeDasharray="28.6 210.1"
              strokeDashoffset="-210.3"
              transform="rotate(-90 50 50)"
            />
          </svg>

          {/* Donut Inner Text */}
          <Box sx={{ position: 'absolute', textAlign: 'center' }}>
            <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 800, lineHeight: 1 }}>
              {totalUnits}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Units Total
            </Typography>
          </Box>
        </Box>

        {/* Legend List (Right side of Donut - NevBank style) */}
        <Stack spacing={1.25} sx={{ flex: 1, minWidth: 150 }}>
          {DEPARTMENTS.map((dept) => (
            <Stack key={dept.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dept.color, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: '#0F172A', fontWeight: 700 }} noWrap>
                  {dept.name}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ color: dept.color, fontWeight: 800 }}>
                {dept.percentage}%
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
