// material-ui
import { useTheme } from '@mui/material/styles';
import { useStoreInventory } from 'context/StoreInventoryContext';
import { axisClasses, barClasses, BarChart } from '@mui/x-charts';

const xLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ==============================|| DAILY INVENTORY USAGE BAR CHART ||============================== //

export default function MonthlyBarChart() {
  const theme = useTheme();
  const { usageLogs = [] } = useStoreInventory();

  // Real dynamic usage calculation per weekday (Mon=0 .. Sun=6)
  const weekData = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  const currentDayIndex = (now.getDay() + 6) % 7; // Mon: 0, Tue: 1 ... Sun: 6

  const stockOutLogs = usageLogs.filter((log) => log.type && log.type.toUpperCase().includes('OUT'));

  stockOutLogs.forEach((log) => {
    let dayIdx = currentDayIndex;
    if (log.time && log.time.includes('Today')) {
      dayIdx = currentDayIndex;
    } else if (log.time && log.time.includes('Yesterday')) {
      dayIdx = (currentDayIndex + 6) % 7;
    } else if (log.dateISO) {
      const logDate = new Date(log.dateISO);
      if (!isNaN(logDate.getTime())) {
        dayIdx = (logDate.getDay() + 6) % 7;
      }
    }
    const qty = parseInt(log.qtyUsed) || 0;
    weekData[dayIdx] += qty;
  });

  const isDark = theme.palette.mode === 'dark';

  return (
    <BarChart
      hideLegend
      height={380}
      series={[{ data: weekData, label: 'Units Issued' }]}
      xAxis={[{ data: xLabels, scaleType: 'band', tickSize: 7, disableLine: true, categoryGapRatio: 0.4 }]}
      yAxis={[{ position: 'none' }]}
      slotProps={{ bar: { rx: 6, ry: 6 } }}
      axisHighlight={{ x: 'none' }}
      margin={{ left: 20, right: 20 }}
      colors={[isDark ? '#6366f1' : (theme.palette.primary.main || '#0096D6')]}
      sx={{
        [`& .${barClasses.element}:hover`]: { opacity: 0.85 },
        [`& .${axisClasses.root}.${axisClasses.directionX} .${axisClasses.tick}`]: { stroke: 'transparent' },
        [`& .${axisClasses.root} .${axisClasses.tickLabel}`]: { fill: `${isDark ? '#94a3b8' : theme.palette.text.secondary} !important` }
      }}
    />
  );
}
