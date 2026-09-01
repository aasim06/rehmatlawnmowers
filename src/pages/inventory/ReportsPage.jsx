import { useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

// icons
import { PrinterOutlined, WarningOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import AnalyticEcommerce from 'components/cards/statistics/AnalyticEcommerce';

// dashboard chart imports (EXACT DASHBOARD CHARTS)
import MonthlyBarChart from 'sections/dashboard/default/MonthlyBarChart';
import UniqueVisitorCard from 'sections/dashboard/default/UniqueVisitorCard';

export default function ReportsPage() {
  const { items = [], usageLogs = [], totalInventoryCount, totalValuation, dailyUsageCount, lowStockAlerts } = useStoreInventory();

  const [reportType, setReportType] = useState('inventory-valuation');
  const [selected, setSelected] = useState([]);

  const handlePrint = () => {
    window.print();
  };

  const handleSelectAllClick = (event, targetList) => {
    if (event.target.checked) {
      const newSelected = targetList.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header Title & Actions */}
      <Grid size={12}>
        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Factory Store Inventory Reports & Analytics
            </Typography>

          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" color="primary" startIcon={<PrinterOutlined />} onClick={handlePrint}>
              Print / Export Report
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* Row 1: Executive Key Metrics (Real-time Context Metrics) */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Total Store Valuation"
          count={(totalValuation || 0).toLocaleString()}
          extra="Total Asset Value"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Available Inventory"
          count={`${totalInventoryCount || 0} units`}
          extra="Across all SKUs"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Today's Stock Out"
          count={`${dailyUsageCount || 0} units`}
          color="warning"
          extra="Consumed Today"
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <AnalyticEcommerce
          title="Reorder Required"
          count={`${lowStockAlerts ? lowStockAlerts.length : 0} Items`}
          color={lowStockAlerts && lowStockAlerts.length > 0 ? 'error' : 'success'}
          isLoss={lowStockAlerts && lowStockAlerts.length > 0}
          extra={lowStockAlerts && lowStockAlerts.length > 0 ? 'Action Required' : 'Stock Optimal'}
        />
      </Grid>

      {/* Row 2: EXACT DASHBOARD CHARTS */}
      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <UniqueVisitorCard />
      </Grid>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Grid container sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Grid>
            <Typography variant="h5">Daily Usage Distribution</Typography>
          </Grid>
        </Grid>
        <MainCard sx={{ mt: 1.5 }} content={false}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack sx={{ gap: 2 }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                Today's Total Issued Items
              </Typography>
              <Typography variant="h3">{dailyUsageCount || 0} units</Typography>
            </Stack>
          </Box>
          <MonthlyBarChart />
        </MainCard>
      </Grid>

      {/* Row 3: Selectable Detailed Reports */}
      <Grid size={12}>
        <MainCard
          title="Detailed Inventory Reports & Statements"
          secondary={
            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Select Report Type</InputLabel>
              <Select value={reportType} label="Select Report Type" onChange={(e) => setReportType(e.target.value)}>
                <MenuItem value="inventory-valuation">Stock Valuation & Inventory Summary</MenuItem>
                <MenuItem value="low-stock">Low Stock & Reorder Alert Statement</MenuItem>
                <MenuItem value="operator-usage">Operator & Department Issuance Statement</MenuItem>
              </Select>
            </FormControl>
          }
        >
          {/* Report 1: Valuation Report */}
          {reportType === 'inventory-valuation' && (
            <TableContainer>
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < items.length}
                        checked={items.length > 0 && selected.length === items.length}
                        onChange={(e) => handleSelectAllClick(e, items)}
                      />
                    </TableCell>
                    <TableCell>SKU / Item Code</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">Total Stock</TableCell>
                    <TableCell align="center">Available Stock</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          No store inventory items available. Add items to view valuation report.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const isItemSelected = isSelected(item.id);
                      const itemValue = item.remainingStock * item.unitPrice;

                      return (
                        <TableRow key={item.id} hover selected={isItemSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              onChange={(e) => handleSelectOne(e, item.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>{item.itemCode}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>{item.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.category} size="small" variant="light" color="primary" />
                          </TableCell>
                          <TableCell align="center">{item.totalStock} {item.unit}</TableCell>
                          <TableCell align="center">
                            <Typography variant="subtitle2" fontWeight={700} color="success.main">
                              {item.remainingStock} {item.unit}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.unitPrice}</TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                              {itemValue.toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Report 2: Low Stock Report */}
          {reportType === 'low-stock' && (
            <TableContainer>
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < (lowStockAlerts?.length || 0)}
                        checked={(lowStockAlerts?.length || 0) > 0 && selected.length === lowStockAlerts.length}
                        onChange={(e) => handleSelectAllClick(e, lowStockAlerts || [])}
                      />
                    </TableCell>
                    <TableCell>Item SKU</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="center">Remaining Stock</TableCell>
                    <TableCell align="center">Reorder Threshold</TableCell>
                    <TableCell align="center">Deficit Qty</TableCell>
                    <TableCell>Location</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!lowStockAlerts || lowStockAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="success.main">
                          🎉 All store inventory levels are optimal! No low stock reorder alerts.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStockAlerts.map((item) => {
                      const isItemSelected = isSelected(item.id);
                      const deficit = item.minLevel - item.remainingStock;

                      return (
                        <TableRow key={item.id} hover selected={isItemSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              onChange={(e) => handleSelectOne(e, item.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>{item.itemCode}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>{item.name}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.category} size="small" variant="light" color="primary" />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="subtitle1" fontWeight={700} color="error.main">
                              {item.remainingStock} {item.unit}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.minLevel} {item.unit}</TableCell>
                          <TableCell align="center">
                            <Chip icon={<WarningOutlined />} label={`Reorder +${deficit > 0 ? deficit : 5}`} color="warning" size="small" />
                          </TableCell>
                          <TableCell>{item.rackLocation}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Report 3: Operator & Department Usage Report */}
          {reportType === 'operator-usage' && (
            <TableContainer>
              <Table sx={{ minWidth: 700 }}>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < usageLogs.length}
                        checked={usageLogs.length > 0 && selected.length === usageLogs.length}
                        onChange={(e) => handleSelectAllClick(e, usageLogs)}
                      />
                    </TableCell>
                    <TableCell>Log ID / Time</TableCell>
                    <TableCell>Item Issued</TableCell>
                    <TableCell align="center">Qty Used</TableCell>
                    <TableCell>Operator Name (Who Used)</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell align="right">Stock Level After</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usageLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          No store transaction logs recorded.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    usageLogs.map((log) => {
                      const isLogSelected = isSelected(log.id);

                      return (
                        <TableRow key={log.id} hover selected={isLogSelected}>
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isLogSelected}
                              onChange={(e) => handleSelectOne(e, log.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>{log.id}</Typography>
                            <Typography variant="caption" color="textSecondary">{log.time}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={600}>{log.itemName}</Typography>
                            <Typography variant="caption" color="textSecondary">{log.itemCode}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="subtitle1" fontWeight={700} color="error.main">
                              -{log.qtyUsed}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={log.usedBy} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell>{log.department}</TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                              {log.remainingStockAfter} available
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </MainCard>
      </Grid>
    </Grid>
  );
}
