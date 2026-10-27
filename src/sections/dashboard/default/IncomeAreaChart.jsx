import PropTypes from 'prop-types';
import { useState } from 'react';

// material-ui
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { axisClasses, chartsGridClasses, lineClasses } from '@mui/x-charts';
import { LineChart } from '@mui/x-charts/LineChart';

// project imports
import { withAlpha } from 'utils/colorUtils';
import { useStoreInventory } from 'context/StoreInventoryContext';

// Labels
const monthlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weeklyLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Base Store Flow Data
const baseMonthlyStockIn = [76, 85, 101, 98, 87, 105, 91, 114, 94, 86, 115, 83];
const baseWeeklyStockIn = [31, 40, 28, 51, 42, 60, 83];

const baseMonthlyStockOut = [50, 45, 70, 35, 60, 36, 26, 45, 65, 52, 53, 28];
const baseWeeklyStockOut = [11, 32, 45, 32, 34, 25, 18];

function Legend({ items, onToggle }) {
  return (
    <Stack direction="row" sx={{ gap: 3, alignItems: 'center', justifyContent: 'center', mt: 2.5, mb: 1.5 }}>
      {items.map((item) => (
        <Stack
          key={item.label}
          direction="row"
          sx={{ gap: 1.25, alignItems: 'center', cursor: 'pointer' }}
          onClick={() => onToggle(item.label)}
        >
          <Box sx={{ width: 12, height: 12, bgcolor: item.visible ? item.color : 'text.secondary', borderRadius: '50%' }} />
          <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

// ==============================|| STOCK FLOW AREA CHART ||============================== //

export default function IncomeAreaChart({ view }) {
  const theme = useTheme();
  const { usageLogs = [] } = useStoreInventory();

  const [visibility, setVisibility] = useState({
    'Stock In (Receiving)': true,
    'Stock Out (Issuance)': true
  });

  const labels = view === 'monthly' ? monthlyLabels : weeklyLabels;

  // Real Dynamic Calculations from usageLogs
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Mon: 0 .. Sun: 6
  const currentMonthIndex = now.getMonth(); // Jan: 0 .. Dec: 11

  const stockInWeekly = [0, 0, 0, 0, 0, 0, 0];
  const stockOutWeekly = [0, 0, 0, 0, 0, 0, 0];

  const stockInMonthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const stockOutMonthly = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  usageLogs.forEach((log) => {
    const isIN = log.type && log.type.toUpperCase().includes('IN');
    const qty = parseInt(log.qtyUsed) || 0;

    let dayIdx = currentDayIndex;
    let monthIdx = currentMonthIndex;

    if (log.time && log.time.includes('Today')) {
      dayIdx = currentDayIndex;
      monthIdx = currentMonthIndex;
    } else if (log.time && log.time.includes('Yesterday')) {
      dayIdx = (currentDayIndex + 6) % 7;
      monthIdx = currentMonthIndex;
    } else if (log.dateISO) {
      const logDate = new Date(log.dateISO);
      if (!isNaN(logDate.getTime())) {
        dayIdx = (logDate.getDay() + 6) % 7;
        monthIdx = logDate.getMonth();
      }
    }

    if (isIN) {
      stockInWeekly[dayIdx] += qty;
      stockInMonthly[monthIdx] += qty;
    } else {
      stockOutWeekly[dayIdx] += qty;
      stockOutMonthly[monthIdx] += qty;
    }
  });

  const stockInData = view === 'monthly' ? stockInMonthly : stockInWeekly;
  const stockOutData = view === 'monthly' ? stockOutMonthly : stockOutWeekly;

  const isDark = theme.palette.mode === 'dark';
  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  const toggleVisibility = (label) => {
    setVisibility((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const visibleSeries = [
    {
      data: stockInData,
      label: 'Stock In (Receiving)',
      showMark: false,
      area: true,
      id: 'stock-in',
      color: '#0ea5e9',
      visible: visibility['Stock In (Receiving)']
    },
    {
      data: stockOutData,
      label: 'Stock Out (Issuance)',
      showMark: false,
      area: true,
      id: 'stock-out',
      color: '#6366f1',
      visible: visibility['Stock Out (Issuance)']
    }
  ];

  return (
    <>
      <LineChart
        hideLegend
        grid={{ horizontal: true, vertical: false }}
        xAxis={[{ scaleType: 'point', data: labels, tickSize: 7, disableLine: true }]}
        yAxis={[{ tickSize: 7, disableLine: true }]}
        height={450}
        margin={{ top: 40, bottom: -5, right: 20, left: 5 }}
        series={visibleSeries
          .filter((series) => series.visible)
          .map((series) => ({
            type: 'line',
            data: series.data,
            label: series.label,
            showMark: series.showMark,
            area: series.area,
            id: series.id,
            color: series.color,
            stroke: series.color,
            strokeWidth: 2
          }))}
        sx={{
          [`& .${chartsGridClasses.line}`]: { strokeDasharray: '4 4', stroke: `${gridLineColor} !important` },
          [`& .${lineClasses.area}`]: {
            '&[data-series-id="stock-in"]': { fill: "url('#myGradient1')", strokeWidth: 2 },
            '&[data-series-id="stock-out"]': { fill: "url('#myGradient2')", strokeWidth: 2 }
          },
          [`& .${axisClasses.root}.${axisClasses.directionX} .${axisClasses.tick}`]: { stroke: 'transparent' },
          [`& .${axisClasses.root}.${axisClasses.directionY} .${axisClasses.tick}`]: { stroke: 'transparent' },
          [`& .${axisClasses.root} .${axisClasses.tickLabel}`]: { fill: `${isDark ? '#94a3b8' : theme.palette.text.secondary} !important` }
        }}
      >
        <defs>
          <linearGradient id="myGradient1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
          </linearGradient>
          <linearGradient id="myGradient2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
          </linearGradient>
        </defs>
      </LineChart>
      <Legend items={visibleSeries} onToggle={toggleVisibility} />
    </>
  );
}

Legend.propTypes = { items: PropTypes.array, onToggle: PropTypes.func };

IncomeAreaChart.propTypes = { view: PropTypes.oneOf(['monthly', 'weekly']) };
