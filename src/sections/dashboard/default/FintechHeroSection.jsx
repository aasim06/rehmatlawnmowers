import PropTypes from 'prop-types';
import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import ArrowRightOutlined from '@ant-design/icons/ArrowRightOutlined';
import CalendarOutlined from '@ant-design/icons/CalendarOutlined';

export default function FintechHeroSection({
  totalStock = 250,
  totalValuation = 0,
  onOpenStockIn,
  onOpenStockOut
}) {
  return (
    <Grid container spacing={3} sx={{ width: '100%', alignItems: 'stretch' }}>
      {/* Left Hero Card: NevBank Savings Account Style (~67% - 8 Cols) */}
      <Grid item xs={12} md={7} lg={8}>
        <Box
          sx={{
            height: '100%',
            bgcolor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #F1F5F9',
            boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
            p: { xs: 2.5, sm: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          {/* Top Row: Account Title (Left) vs Big Valuation Figure (Right - Exact NevBank style) */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Main Store Account
              </Typography>
              <Typography variant="h4" sx={{ color: '#0F172A', fontWeight: 800, mt: 0.5 }}>
                Factory Store Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                SKU-9902 • Primary Assembly Store
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                Total Valuation
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  color: '#0F172A',
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', sm: '2.1rem', md: '2.4rem' },
                  letterSpacing: -0.5
                }}
              >
                Rs. {totalValuation.toLocaleString()}
              </Typography>
            </Box>
          </Stack>

          {/* Middle Row: Stock Count Badge */}
          <Box sx={{ my: 2 }}>
            <Typography variant="body2" sx={{ color: '#005F56', fontWeight: 700, bgcolor: '#ECFDF5', display: 'inline-block', px: 2, py: 0.75, borderRadius: '12px' }}>
              📦 Total Available Stock: <strong>{totalStock.toLocaleString()} Units</strong>
            </Typography>
          </Box>

          {/* Bottom Row: Quick Action Buttons */}
          <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
            <Button
              variant="contained"
              onClick={onOpenStockIn}
              startIcon={<PlusOutlined />}
              sx={{
                bgcolor: '#005F56',
                color: '#ffffff',
                '&:hover': { bgcolor: '#004841' },
                fontWeight: 700,
                borderRadius: '14px',
                px: 3,
                py: 1.25,
                boxShadow: '0 4px 14px rgba(0, 95, 86, 0.25)',
                textTransform: 'none',
                fontSize: '0.9rem'
              }}
            >
              Stock In
            </Button>

            <Button
              variant="outlined"
              onClick={onOpenStockOut}
              startIcon={<ExportOutlined />}
              sx={{
                bgcolor: '#F8FAFC',
                color: '#0F172A',
                borderColor: '#E2E8F0',
                '&:hover': { bgcolor: '#F1F5F9', borderColor: '#CBD5E1' },
                fontWeight: 700,
                borderRadius: '14px',
                px: 3,
                py: 1.25,
                textTransform: 'none',
                fontSize: '0.9rem'
              }}
            >
              Issue Stock Out
            </Button>
          </Stack>
        </Box>
      </Grid>

      {/* Right Hero Card: Dark Emerald Promo Card (~33% - 4 Cols) */}
      <Grid item xs={12} md={5} lg={4}>
        <Box
          sx={{
            height: '100%',
            bgcolor: '#005F56',
            color: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px -4px rgba(0, 95, 86, 0.35)',
            p: { xs: 2.5, sm: 3.5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Top Row: Title & Right Graphic Card Badge */}
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ maxWidth: 220 }}>
              <Typography variant="h5" sx={{ color: '#ffffff', fontWeight: 800, mb: 1, leading: 1.3 }}>
                Daily Issuance &amp; Usage Log
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', lineHeight: 1.5, fontSize: '0.85rem' }}>
                Track raw material dispatch to machine operators in real-time.
              </Typography>
            </Box>

            {/* Visual Graphic Badge Icon */}
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '16px',
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
              }}
            >
              <CalendarOutlined style={{ fontSize: '1.75rem', color: '#ffffff' }} />
            </Box>
          </Stack>

          {/* Action Button */}
          <Box sx={{ pt: 3, position: 'relative', zIndex: 1 }}>
            <Button
              variant="contained"
              onClick={onOpenStockOut}
              endIcon={<ArrowRightOutlined />}
              sx={{
                bgcolor: '#ffffff',
                color: '#005F56',
                '&:hover': { bgcolor: '#F8FAFC' },
                fontWeight: 700,
                borderRadius: '14px',
                px: 3,
                py: 1.25,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                textTransform: 'none',
                fontSize: '0.9rem'
              }}
            >
              Get Issuance Record
            </Button>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}

FintechHeroSection.propTypes = {
  totalStock: PropTypes.number,
  totalValuation: PropTypes.number,
  onOpenStockIn: PropTypes.func,
  onOpenStockOut: PropTypes.func
};
