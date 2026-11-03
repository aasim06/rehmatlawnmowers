import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

// charts
import { BarChart } from '@mui/x-charts';

// icons
import ShopOutlined from '@ant-design/icons/ShopOutlined';
import ImportOutlined from '@ant-design/icons/ImportOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import DollarOutlined from '@ant-design/icons/DollarOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import ArrowRightOutlined from '@ant-design/icons/ArrowRightOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';
import BarChartOutlined from '@ant-design/icons/BarChartOutlined';
import ShoppingCartOutlined from '@ant-design/icons/ShoppingCartOutlined';
import BookOutlined from '@ant-design/icons/BookOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';

// ==============================|| SHOP DASHBOARD — POLISHED ||============================== //

export default function ShopDashboardPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    items = [],
    usageLogs = [],
    totalInventoryCount = 0,
    totalValuation = 0,
    todayStockInQty = 0,
    todayStockOutQty = 0,
    todaySalesAmount = 0,
    totalSalesAmount = 0,
    lowStockAlerts = [],
    shopSales = [],
    resetShopDataToZero
  } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleResetShopData = async () => {
    if (!resetShopDataToZero) return;
    setResetting(true);
    await resetShopDataToZero();
    setResetting(false);
    setResetConfirmOpen(false);
  };

  // Filtered transaction logs
  const filteredLogs = useMemo(() => {
    return usageLogs.filter((log) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        (log.itemName || '').toLowerCase().includes(term) ||
        (log.usedBy || '').toLowerCase().includes(term) ||
        (log.type || '').toLowerCase().includes(term) ||
        (log.itemCode || '').toLowerCase().includes(term);

      const isIN = (log.type || '').toUpperCase().includes('IN');
      const matchesType =
        filterType === 'ALL' ||
        (filterType === 'IN' && isIN) ||
        (filterType === 'OUT' && !isIN);

      return matchesSearch && matchesType;
    });
  }, [usageLogs, searchTerm, filterType]);

  // FIX 2: Only use REAL data for chart — no fake default baseline
  const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hasAnyTransactions = usageLogs.length > 0;

  const weeklyStockIn = useMemo(() => {
    if (!hasAnyTransactions) return [0, 0, 0, 0, 0, 0, 0];
    const data = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const todayIndex = (now.getDay() + 6) % 7;
    usageLogs.forEach((log) => {
      if ((log.type || '').toUpperCase().includes('IN')) {
        let idx = todayIndex;
        if (log.time?.includes('Yesterday')) idx = (todayIndex + 6) % 7;
        data[idx] += parseInt(log.qtyUsed, 10) || 0;
      }
    });
    return data;
  }, [usageLogs, hasAnyTransactions]);

  const weeklyStockOut = useMemo(() => {
    if (!hasAnyTransactions) return [0, 0, 0, 0, 0, 0, 0];
    const data = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    const todayIndex = (now.getDay() + 6) % 7;
    usageLogs.forEach((log) => {
      if ((log.type || '').toUpperCase().includes('OUT')) {
        let idx = todayIndex;
        if (log.time?.includes('Yesterday')) idx = (todayIndex + 6) % 7;
        data[idx] += parseInt(log.qtyUsed, 10) || 0;
      }
    });
    return data;
  }, [usageLogs, hasAnyTransactions]);

  // Category breakdown for right column
  const categoryBreakdown = useMemo(() => {
    const map = {};
    items.forEach((item) => {
      const cat = item.category || 'General';
      if (!map[cat]) map[cat] = { count: 0, stock: 0 };
      map[cat].count += 1;
      map[cat].stock += parseInt(item.totalStock, 10) || 0;
    });
    return Object.entries(map)
      .map(([name, val]) => ({ name, ...val }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);
  }, [items]);

  const stockHealthPct = items.length > 0
    ? Math.round(((items.length - lowStockAlerts.length) / items.length) * 100)
    : 100;

  return (
    <Box sx={{ width: '100%', pb: 2 }}>

      {/* ── 1. HEADER ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
              Shop Dashboard
            </Typography>
            <Chip label="Live Counter" size="small" color="success" variant="outlined"
              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
          </Stack>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, fontSize: '0.8125rem' }}>
            Retail counter management • Independent sales, stock in &amp; sales out
          </Typography>
        </Box>

        {/* Action buttons at the top */}
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button size="small" variant="contained" component={Link} to="/shop/mart"
            startIcon={<ShoppingCartOutlined />} sx={{ fontWeight: 700, borderRadius: 1.5, px: 1.75, fontSize: '0.775rem', height: 35, minHeight: 35, bgcolor: '#f59e0b', color: '#fff', '&:hover': { bgcolor: '#d97706' } }}>
            Shop Mart
          </Button>
          <Button size="small" variant="contained" component={Link} to="/shop/ledger"
            startIcon={<BookOutlined />} sx={{ fontWeight: 700, borderRadius: 1.5, px: 1.75, fontSize: '0.775rem', height: 35, minHeight: 35, bgcolor: '#0284c7', color: '#fff', '&:hover': { bgcolor: '#0369a1' } }}>
            Shop Ledger
          </Button>
          <Button size="small" variant="contained" color="success" component={Link} to="/shop/add-product"
            startIcon={<PlusOutlined />} sx={{ fontWeight: 700, borderRadius: 1.5, px: 1.75, fontSize: '0.775rem', height: 35, minHeight: 35 }}>
            + Add Product
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={() => setResetConfirmOpen(true)}
            sx={{ fontWeight: 800, borderRadius: 1.5, px: 1.75, fontSize: '0.775rem', height: 35, minHeight: 35 }}
          >
            Factory Reset (0)
          </Button>
        </Stack>
      </Box>

      {/* ── 2. LOW STOCK ALERT ── */}
      {lowStockAlerts.length > 0 && (
        <Alert severity="warning" icon={<WarningOutlined />}
          sx={{ width: '100%', mb: 2, py: 0.5, borderRadius: 1.5, fontWeight: 600 }}
          action={
            <Button color="inherit" size="small" component={Link} to="/shop/add-product" sx={{ fontWeight: 800 }}>
              Restock →
            </Button>
          }
        >
          {lowStockAlerts.length} item(s) are low in the shop counter.
        </Alert>
      )}

      {/* ── 3. KPI CARDS ── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {[
          {
            label: "Today's Sales",
            value: `Rs. ${todaySalesAmount.toLocaleString()}`,
            sub: `Lifetime: Rs. ${totalSalesAmount.toLocaleString()}`,
            color: '#10B981',
            icon: <DollarOutlined style={{ fontSize: '1.1rem', color: '#10B981' }} />
          },
          {
            label: 'Units Sold Today',
            value: `−${todayStockOutQty}`,
            sub: 'Counter sales dispatched',
            color: '#EF4444',
            icon: <ExportOutlined style={{ fontSize: '1.1rem', color: '#EF4444' }} />
          },
          {
            label: 'Stock Received',
            value: `+${todayStockInQty}`,
            sub: 'Inward shipments today',
            color: '#005F56',
            icon: <ImportOutlined style={{ fontSize: '1.1rem', color: '#005F56' }} />
          },
          {
            label: 'Shop Stock Available',
            value: `${totalInventoryCount.toLocaleString()} Units`,
            sub: `Val: Rs. ${totalValuation.toLocaleString()} • ${items.length} SKUs`,
            color: '#6366F1',
            icon: <InboxOutlined style={{ fontSize: '1.1rem', color: '#6366F1' }} />
          }
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={0} sx={{
              p: 2.25, borderRadius: 2, height: '100%',
              border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
              bgcolor: isDark ? 'background.paper' : '#fff',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              {/* FIX 5: Clear label/icon row with full space-between */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {card.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {card.icon}
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: card.color, letterSpacing: -0.5, lineHeight: 1.1 }}>
                {card.value}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, mt: 0.75, display: 'block' }}>
                {card.sub}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── 4. CHART ROW ── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>

        {/* LEFT: STOCK FLOW CHART */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{
            p: 2.5, borderRadius: 2, height: '100%',
            border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
            bgcolor: isDark ? 'background.paper' : '#fff'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Stock Flow Analytics</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Weekly Stock In (Receiving) vs Stock Out (Sales)
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#005F56' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Stock In</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#0284C7' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>Stock Out</Typography>
                </Box>
              </Box>
            </Box>

            {/* FIX 2: Show empty state if no real data instead of fake bars */}
            {!hasAnyTransactions ? (
              <Box sx={{ height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                <BarChartOutlined style={{ fontSize: '2.5rem', marginBottom: 8, opacity: 0.35 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                  No transaction data yet
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Chart will show real data after first Stock In or Sale is recorded.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 210 }}>
                <BarChart
                  height={200}
                  xAxis={[{ data: chartDays, scaleType: 'band', categoryGapRatio: 0.45 }]}
                  series={[
                    { data: weeklyStockIn, label: 'Stock In', color: '#005F56' },
                    { data: weeklyStockOut, label: 'Stock Out', color: '#0284C7' }
                  ]}
                  slotProps={{ bar: { rx: 4, ry: 4 } }}
                  hideLegend
                  margin={{ top: 10, bottom: 20, left: 35, right: 10 }}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        {/* RIGHT: COUNTER OVERVIEW — FIX 1 (text overlap) + FIX 4 (more content) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{
            p: 2.5, borderRadius: 2, height: '100%',
            border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
            bgcolor: isDark ? 'background.paper' : '#fff',
            display: 'flex', flexDirection: 'column', gap: 2
          }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Counter Overview</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Live inventory health snapshot
              </Typography>
            </Box>

            {/* FIX 1: Proper spacing between label and value — no more text overlap */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0.6 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Active Catalog</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#005F56' }}>
                  {items.length}&nbsp;SKUs
                </Typography>
              </Box>
              <LinearProgress variant="determinate"
                value={Math.min(100, Math.max(5, items.length * 10))}
                sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: '#005F56' } }}
              />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0.6 }}>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>Stock Health</Typography>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 800,
                  color: stockHealthPct < 70 ? '#EF4444' : '#10B981'
                }}>
                  {stockHealthPct}&nbsp;%
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={stockHealthPct}
                sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: stockHealthPct < 70 ? '#EF4444' : '#10B981' } }}
              />
              {lowStockAlerts.length > 0 && (
                <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600, mt: 0.5, display: 'block' }}>
                  {lowStockAlerts.length} item(s) below minimum level
                </Typography>
              )}
            </Box>

            <Divider />

            {/* FIX 4: Category Breakdown instead of empty white space */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Category Breakdown
              </Typography>

              {categoryBreakdown.length === 0 ? (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  No categories yet. Stock items will appear here.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {categoryBreakdown.map((cat) => {
                    const maxStock = Math.max(...categoryBreakdown.map((c) => c.stock), 1);
                    return (
                      <Box key={cat.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 0.4 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                            {cat.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {cat.count}&nbsp;items&nbsp;•&nbsp;{cat.stock}&nbsp;units
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.round((cat.stock / maxStock) * 100)}
                          sx={{
                            height: 5, borderRadius: 2, bgcolor: 'divider',
                            '& .MuiLinearProgress-bar': { bgcolor: '#6366F1' }
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ── 5. TRANSACTION LOG + SHELF ITEMS ── */}
      <Grid container spacing={2}>

        {/* LEFT: TRANSACTION HISTORY */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper elevation={0} sx={{
            p: 2.5, borderRadius: 2,
            border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
            bgcolor: isDark ? 'background.paper' : '#fff'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Shop Transaction History</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Real-time record of all counter sales and inward stock entries
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                {/* FIX 3: No extra action buttons inside table header */}
                <Box sx={{ display: 'inline-flex', bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'grey.100', p: 0.25, borderRadius: 1 }}>
                  {['ALL', 'IN', 'OUT'].map((type) => (
                    <Button key={type} size="small" onClick={() => setFilterType(type)}
                      sx={{
                        minWidth: 40, px: 1.25, py: 0.25, fontSize: '0.75rem', fontWeight: 700, borderRadius: 1,
                        bgcolor: filterType === type ? (isDark ? 'grey.800' : '#fff') : 'transparent',
                        color: filterType === type ? 'primary.main' : 'text.secondary',
                        boxShadow: filterType === type ? 1 : 'none'
                      }}>
                      {type === 'ALL' ? 'All' : type === 'IN' ? 'Stock In' : 'Sales'}
                    </Button>
                  ))}
                </Box>
                <TextField size="small" placeholder="Search log..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ width: { xs: 120, sm: 160 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined style={{ fontSize: '0.8rem', color: '#94A3B8' }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 1, fontSize: '0.8rem' }
                  }}
                />
              </Stack>
            </Box>

            {filteredLogs.length === 0 ? (
              /* FIX 3: Empty state with only 1 pair of action buttons, not duplicated all over */
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5 }}>
                  No transactions recorded yet
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Use the <strong>+ Stock In</strong> or <strong>− Record Sale</strong> buttons above to begin.
                </Typography>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead
                    sx={{
                      bgcolor: isDark ? 'background.paper' : '#fff',
                      '& .MuiTableCell-head': {
                        bgcolor: isDark ? 'background.paper' : '#fff !important',
                        background: isDark ? 'background.paper' : '#fff !important'
                      }
                    }}
                  >
                    <TableRow sx={{ bgcolor: isDark ? 'background.paper' : '#fff !important' }}>
                      <TableCell sx={{ fontWeight: 800 }}>TYPE</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>ITEM</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>PARTY / CUSTOMER</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800 }}>QTY</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>UNIT PRICE</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>TOTAL (PKR)</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>TIME</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.slice(0, 10).map((log) => {
                      const isIN = (log.type || '').toUpperCase().includes('IN');
                      const lineVal = parseFloat(log.lineTotal) || (parseInt(log.qtyUsed, 10) || 0) * (parseFloat(log.unitPrice) || 0);
                      return (
                        <TableRow key={log.id} hover>
                          <TableCell sx={{ py: 1 }}>
                            <Chip label={isIN ? 'Stock In' : 'Sale'} size="small"
                              color={isIN ? 'success' : 'primary'} variant="outlined"
                              sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{log.itemName}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {log.itemCode || log.category || 'General'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{log.usedBy || '—'}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isIN ? '#10B981' : '#EF4444' }}>
                              {isIN ? `+${log.qtyUsed}` : `−${log.qtyUsed}`}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">Rs. {(parseFloat(log.unitPrice) || 0).toLocaleString()}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isIN ? 'inherit' : '#10B981' }}>
                              Rs. {lineVal.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{log.time || '—'}</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* RIGHT: SHOP SHELF ITEMS */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={0} sx={{
            p: 2.5, borderRadius: 2,
            border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'divider',
            bgcolor: isDark ? 'background.paper' : '#fff'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>Shop Shelf Items</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Current inventory on the retail counter
                </Typography>
              </Box>
              {/* FIX 3: Only a small text link, not a duplicate action button */}
              <Typography
                component={Link}
                to="/shop/add-product"
                variant="caption"
                sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.4 }}
              >
                Manage Products <ArrowRightOutlined style={{ fontSize: '0.75rem' }} />
              </Typography>
            </Box>

            {items.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No items in shop inventory yet.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1} sx={{ maxHeight: 320, overflowY: 'auto' }}>
                {items.slice(0, 8).map((item) => {
                  const stockNum = parseInt(item.totalStock, 10) || 0;
                  const isLow = stockNum <= (parseInt(item.minLevel, 10) || 5);
                  return (
                    <Box key={item.id} sx={{
                      p: 1.25, borderRadius: 1.5,
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'grey.50',
                      border: '1px solid',
                      borderColor: isLow
                        ? (isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)')
                        : (isDark ? 'rgba(255,255,255,0.05)' : 'divider')
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Box sx={{ minWidth: 0, pr: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {item.category || 'General'} • Rs. {(parseFloat(item.unitPrice) || 0).toLocaleString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${stockNum} ${item.unit || 'PCS'}`}
                          size="small"
                          color={isLow ? 'error' : 'default'}
                          variant="outlined"
                          sx={{ fontWeight: 700, height: 22, fontSize: '0.725rem' }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* ── 5. FACTORY RESET SHOP DATA (ZERO ALL) ── */}
      <Box sx={{ width: '100%', mt: 4, p: 2.5, borderRadius: 2, border: '1px dashed #fca5a5', bgcolor: isDark ? 'rgba(239,68,68,0.05)' : '#fff5f5' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={800} color="error.main">
              Factory Reset Shop Data to Zero (Fresh Start)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              Wipe all shop items, sales slips, inventory counts, and issue history to start completely clean at 0.
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={() => setResetConfirmOpen(true)}
              sx={{ fontWeight: 800, height: 38, borderRadius: 2, px: 3, whiteSpace: 'nowrap' }}
            >
              Factory Reset (0)
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Confirm Reset Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} slotProps={{ paper: { sx: { borderRadius: 2, maxWidth: 500 } } }}>
        <DialogTitle component="div" sx={{ fontWeight: 800, color: 'error.main' }}>
          ⚠️ Confirm Factory Reset Shop Data?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Are you sure you want to wipe all Shop inventory items, counter sales slips, and ledger records? This action will set all shop metrics and history to 0 for a completely fresh start.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetConfirmOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleResetShopData} color="error" variant="contained" disabled={resetting} sx={{ fontWeight: 800, borderRadius: 1.5, px: 3 }}>
            {resetting ? 'Resetting...' : 'Yes, Reset All Shop Data to 0'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
