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

  return (
    <BarChart
      hideLegend
      height={380}
      series={[{ data: weekData, label: 'Units Issued' }]}
      xAxis={[{ data: xLabels, scaleType: 'band', tickSize: 7, disableLine: true, categoryGapRatio: 0.4 }]}
      yAxis={[{ position: 'none' }]}
      slotProps={{ bar: { rx: 5, ry: 5 } }}
      axisHighlight={{ x: 'none' }}
      margin={{ left: 20, right: 20 }}
      colors={[theme.palette.primary.main || theme.vars.palette.info.light]}
      sx={{
        [`& .${barClasses.element}:hover`]: { opacity: 0.6 },
        [`& .${axisClasses.root}.${axisClasses.directionX} .${axisClasses.tick}`]: { stroke: 'transparent' },
        [`& .${axisClasses.root} .${axisClasses.tickLabel}`]: { fill: `${theme.palette.text.secondary} !important` }
      }}
    />
  );
}
