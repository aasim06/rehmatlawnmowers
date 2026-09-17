import { useStoreInventory } from 'context/StoreInventoryContext';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import ArrowRightOutlined from '@ant-design/icons/ArrowRightOutlined';

const MOCK_TOP_SELLERS = [
  { id: 'ts-1', name: "Rehmat 24'' Heavy Duty Lawn Mower", sold: 18, revenue: 126000 },
  { id: 'ts-2', name: "Rehmat 20'' Self-Propelled Cutter", sold: 14, revenue: 84000 },
  { id: 'ts-3', name: "Honda Engine 5.5HP Motor Assembly", sold: 11, revenue: 60500 },
  { id: 'ts-4', name: "Grass Catcher Bag & Blade Set", sold: 9, revenue: 18000 },
  { id: 'ts-5', name: "Heavy Duty Wheel & Axle Kit", sold: 6, revenue: 9000 }
];

const RANK_COLORS = ['#005F56', '#0F766E', '#2563EB', '#D97706', '#64748B'];

export default function FintechTopSellingCard() {
  const { machineSales = [] } = useStoreInventory();

  // Aggregate real machine sales data
  const aggregatedMap = {};

  machineSales.forEach((sale) => {
    const name = (sale.machineName || sale.itemName || 'Machine Item').trim();
    if (!name) return;

    if (!aggregatedMap[name]) {
      aggregatedMap[name] = { name, sold: 0, revenue: 0 };
    }
    const qty = parseInt(sale.qty, 10) || 1;
    const total = parseFloat(sale.lineTotal) || parseFloat(sale.totalCost) || 0;

    aggregatedMap[name].sold += qty;
    aggregatedMap[name].revenue += total;
  });

  let realTopSellers = Object.values(aggregatedMap).sort((a, b) => b.sold - a.sold);

  let displayItems = [];
  if (realTopSellers.length > 0) {
    displayItems = realTopSellers.slice(0, 5);
    if (displayItems.length < 5) {
      const existingNames = new Set(displayItems.map((i) => i.name));
      const remainingMocks = MOCK_TOP_SELLERS.filter((m) => !existingNames.has(m.name));
      displayItems = [...displayItems, ...remainingMocks.slice(0, 5 - displayItems.length)];
    }
  } else {
    displayItems = MOCK_TOP_SELLERS;
  }

  const maxSold = Math.max(...displayItems.map((i) => i.sold || 1), 1);

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
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 700 }}>
            Top 5 Best Selling Items
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            Highest demand products & machines
          </Typography>
        </Box>

        <IconButton
          sx={{
            bgcolor: '#005F56',
            color: '#ffffff',
            '&:hover': { bgcolor: '#004841' },
            width: 36,
            height: 36
          }}
        >
          <ArrowRightOutlined />
        </IconButton>
      </Stack>

      {/* Evenly Stretched List of 5 Items */}
      <Stack
        spacing={2}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          py: 0.5
        }}
      >
        {displayItems.map((item, index) => {
          const rankColor = RANK_COLORS[index] || '#64748B';
          const percentage = Math.min(100, Math.round(((item.sold || 1) / maxSold) * 100));

          return (
            <Box
              key={item.id || index}
              sx={{
                p: 1.75,
                borderRadius: '14px',
                bgcolor: '#F8FAFC',
                border: '1px solid #F1F5F9',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: rankColor,
                  bgcolor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              {/* Row 1: Rank Pill + Title + Units Sold & Revenue */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5} sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: '12px',
                      bgcolor: `${rankColor}15`,
                      color: rankColor,
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      minWidth: 28,
                      textAlign: 'center'
                    }}
                  >
                    #{index + 1}
                  </Box>

                  <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 700 }} noWrap>
                    {item.name}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                    {item.sold} sold
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: '#005F56', fontWeight: 800 }}>
                    PKR {(item.revenue || 0).toLocaleString()}
                  </Typography>
                </Stack>
              </Stack>

              {/* Row 2: Sleek Horizontal Progress Bar */}
              <Box sx={{ width: '100%', bgcolor: '#E2E8F0', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                <Box
                  sx={{
                    width: `${percentage}%`,
                    height: '100%',
                    bgcolor: rankColor,
                    borderRadius: 4,
                    transition: 'width 0.6s ease'
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
