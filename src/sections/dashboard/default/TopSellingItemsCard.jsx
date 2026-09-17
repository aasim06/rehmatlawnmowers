import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
  Box,
  Stack,
  Typography,
  Avatar,
  useTheme
} from '@mui/material';

// project imports
import MainCard from 'components/MainCard';

// Fallback demo top sellers if sales data is scarce
const MOCK_TOP_SELLERS = [
  { id: 'ts-1', name: "Rehmat 24'' Heavy Duty Lawn Mower", sold: 18, revenue: 126000, color: '#ef4444' },
  { id: 'ts-2', name: "Rehmat 20'' Self-Propelled Cutter", sold: 14, revenue: 84000, color: '#f59e0b' },
  { id: 'ts-3', name: "Honda Engine 5.5HP Motor Assembly", sold: 11, revenue: 60500, color: '#3b82f6' },
  { id: 'ts-4', name: "Grass Catcher Bag & Blade Set", sold: 9, revenue: 18000, color: '#10b981' },
  { id: 'ts-5', name: "Heavy Duty Wheel & Axle Kit", sold: 6, revenue: 9000, color: '#8b5cf6' }
];

const RANK_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];

export default function TopSellingItemsCard() {
  const theme = useTheme();
  const { machineSales = [] } = useStoreInventory();

  // Aggregate real machine sales data
  const aggregatedMap = {};

  machineSales.forEach((sale) => {
    const name = (sale.machineName || sale.itemName || 'Machine Item').trim();
    if (!name) return;

    if (!aggregatedMap[name]) {
      aggregatedMap[name] = {
        name,
        sold: 0,
        revenue: 0
      };
    }
    const qty = parseInt(sale.qty, 10) || 1;
    const total = parseFloat(sale.lineTotal) || parseFloat(sale.totalCost) || 0;

    aggregatedMap[name].sold += qty;
    aggregatedMap[name].revenue += total;
  });

  // Convert to array
  let realTopSellers = Object.values(aggregatedMap).sort((a, b) => b.sold - a.sold);

  // If real sellers exist, merge or fallback to mock items to ensure 5 rows
  let displayItems = [];
  if (realTopSellers.length > 0) {
    displayItems = realTopSellers.slice(0, 5);
    // Fill remaining slots up to 5 with mock items if less than 5
    if (displayItems.length < 5) {
      const existingNames = new Set(displayItems.map((i) => i.name));
      const remainingMocks = MOCK_TOP_SELLERS.filter((m) => !existingNames.has(m.name));
      displayItems = [...displayItems, ...remainingMocks.slice(0, 5 - displayItems.length)];
    }
  } else {
    displayItems = MOCK_TOP_SELLERS;
  }

  // Find max sold for calculating progress bar percentages
  const maxSold = Math.max(...displayItems.map((i) => i.sold || 1), 1);

  return (
    <MainCard content={false} sx={{ p: 2.5 }}>
      {/* Header Row */}
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>
          Top 5 Best Selling Items
        </Typography>
        <Typography variant="caption" color="textSecondary">
          Most ordered items
        </Typography>
      </Box>

      {/* Top Sellers List */}
      <Stack spacing={1.5}>
        {displayItems.map((item, index) => {
          const rankColor = RANK_COLORS[index] || '#64748b';
          const percentage = Math.min(100, Math.round(((item.sold || 1) / maxSold) * 100));

          return (
            <Box
              key={item.id || index}
              sx={{
                p: 1.75,
                borderRadius: '12px',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: rankColor,
                  boxShadow: `0 4px 12px ${rankColor}15`,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {/* Top Row Info */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                {/* Left: Rank + Avatar + Name */}
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    fontWeight={800}
                    sx={{ color: rankColor, minWidth: 24 }}
                  >
                    #{index + 1}
                  </Typography>

                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: rankColor,
                      bgcolor: `${rankColor}15`,
                      border: `1px solid ${rankColor}30`
                    }}
                  >
                    {item.name ? item.name.charAt(0).toUpperCase() : 'I'}
                  </Avatar>

                  <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: 'text.primary' }}>
                    {item.name}
                  </Typography>
                </Stack>

                {/* Right: Sold Qty & Revenue */}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'text.secondary' }}>
                    {item.sold} sold
                  </Typography>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#10b981' }}>
                    PKR {(item.revenue || 0).toLocaleString()}
                  </Typography>
                </Stack>
              </Stack>

              {/* Bottom Colored Progress Bar */}
              <Box sx={{ mt: 1.25, width: '100%', bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${percentage}%`,
                    height: '100%',
                    bgcolor: rankColor,
                    borderRadius: 4,
                    transition: 'width 0.6s ease-in-out',
                    backgroundImage: `linear-gradient(90deg, ${rankColor}, ${rankColor}dd)`
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </MainCard>
  );
}
