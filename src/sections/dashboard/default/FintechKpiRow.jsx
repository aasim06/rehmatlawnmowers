import PropTypes from 'prop-types';
import { Box, Grid, Stack, Typography } from '@mui/material';
import DatabaseOutlined from '@ant-design/icons/DatabaseOutlined';
import ImportOutlined from '@ant-design/icons/ImportOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';

export default function FintechKpiRow({
  totalSkus = 3,
  todayStockIn = 100,
  todayStockOut = 0,
  todayMachineSales = 0
}) {
  const cards = [
    {
      id: 'kpi-1',
      title: 'Active SKUs',
      subtitle: 'Inventory Catalog',
      count: `${totalSkus} SKUs`,
      iconBg: '#F0FDF4',
      iconColor: '#005F56',
      icon: <DatabaseOutlined style={{ fontSize: '1.4rem' }} />
    },
    {
      id: 'kpi-2',
      title: 'Stock Received',
      subtitle: 'Receiving Today',
      count: `+${todayStockIn} Units`,
      iconBg: '#ECFDF5',
      iconColor: '#10B981',
      icon: <ImportOutlined style={{ fontSize: '1.4rem' }} />
    },
    {
      id: 'kpi-3',
      title: 'Stock Issued',
      subtitle: 'Material Out',
      count: `-${todayStockOut} Units`,
      iconBg: '#F3F4F6',
      iconColor: '#6B7280',
      icon: <ExportOutlined style={{ fontSize: '1.4rem' }} />
    },
    {
      id: 'kpi-4',
      title: 'Machine Sales',
      subtitle: 'Billing Today',
      count: `Rs. ${todayMachineSales.toLocaleString()}`,
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      icon: <ShoppingCartOutlined style={{ fontSize: '1.4rem' }} />
    }
  ];

  return (
    <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
      {cards.map((card) => (
        <Grid item xs={12} sm={6} md={3} key={card.id}>
          <Box
            sx={{
              height: '100%',
              bgcolor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #F1F5F9',
              boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
              p: 2.75,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px -5px rgba(0, 0, 0, 0.08)'
              }
            }}
          >
            {/* Top Row: Title & Subtitle (Left) vs Icon Box (Top Right - Exact NevBank style) */}
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ color: '#0F172A', fontWeight: 800, leading: 1.2 }}>
                  {card.title}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                  {card.subtitle}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '14px',
                  bgcolor: card.iconBg,
                  color: card.iconColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {card.icon}
              </Box>
            </Stack>

            {/* Bottom Row: Big Bold Figure */}
            <Box>
              <Typography variant="h4" sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.35rem' }}>
                {card.count}
              </Typography>
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

FintechKpiRow.propTypes = {
  totalSkus: PropTypes.number,
  todayStockIn: PropTypes.number,
  todayStockOut: PropTypes.number,
  todayMachineSales: PropTypes.number
};
