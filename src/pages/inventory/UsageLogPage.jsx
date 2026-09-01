import { useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
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

// icons
import { SearchOutlined, ArrowDownOutlined, ArrowUpOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

export default function UsageLogPage() {
  const { usageLogs, deleteMultipleLogs } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState([]);

  // Bulk Delete Confirmation Dialog State
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const filteredLogs = usageLogs.filter((log) => {
    // Search Term Filter
    const matchesSearch =
      log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.department.toLowerCase().includes(searchTerm.toLowerCase());

    // Type Filter
    const matchesType = filterType === 'All' || log.type.includes(filterType);

    // Date Range Filter
    let matchesDate = true;
    if (log.dateISO) {
      const logDay = log.dateISO.split('T')[0];
      if (startDate && logDay < startDate) matchesDate = false;
      if (endDate && logDay > endDate) matchesDate = false;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredLogs.map((n) => n.id);
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

  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterType('All');
    setStartDate('');
    setEndDate('');
  };

  // Bulk Delete Confirm Handler
  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleLogs(selected);
      setSelected([]);
    }
    setBulkDeleteDialogOpen(false);
  };

  return (
    <MainCard
      title="Daily Inventory Usage & Store Transaction Ledger"
      secondary={
        selected.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteOutlined />}
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            Delete Selected ({selected.length})
          </Button>
        )
      }
    >
      {/* Search & Filter Control Bar */}
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        {/* Search Field */}
        <Grid item xs={12} md={4}>
          <OutlinedInput
            fullWidth
            placeholder="Search by Item Name, SKU Code, Operator, Dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />
        </Grid>

        {/* Transaction Type Filter */}
        <Grid item xs={12} sm={6} md={2.5}>
          <FormControl fullWidth>
            <InputLabel>Transaction Type</InputLabel>
            <Select value={filterType} label="Transaction Type" onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="All">All Transactions</MenuItem>
              <MenuItem value="OUT">Daily Usage (Store OUT)</MenuItem>
              <MenuItem value="IN">Shipments (Store IN)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Calendar Date Range: From Date */}
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            label="From Date"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Grid>

        {/* Calendar Date Range: To Date */}
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            label="To Date"
            type="date"
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Grid>

        {/* Reset Filters & Log Count */}
        <Grid item xs={12} md={1.5} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
          {(startDate || endDate || searchTerm || filterType !== 'All') && (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<ReloadOutlined />}
              onClick={handleClearFilter}
              sx={{ mb: 0.5 }}
            >
              Reset
            </Button>
          )}
          <Typography variant="caption" color="textSecondary" display="block">
            {selected.length > 0 ? (
              <strong style={{ color: '#ff4d4f' }}>{selected.length} logs selected</strong>
            ) : (
              `Total ${filteredLogs.length} Records`
            )}
          </Typography>
        </Grid>
      </Grid>

      {/* Ledger Table */}
      <TableContainer>
        <Table sx={{ minWidth: 750 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < filteredLogs.length}
                  checked={filteredLogs.length > 0 && selected.length === filteredLogs.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all ledger entries' }}
                />
              </TableCell>
              <TableCell>Log ID / Time</TableCell>
              <TableCell>SKU / Item Name</TableCell>
              <TableCell align="center">Qty Used / Changed</TableCell>
              <TableCell>Who Used Each Item (Operator)</TableCell>
              <TableCell>Department</TableCell>
              <TableCell align="right">Remaining Stock After</TableCell>
              <TableCell>Issued By</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No store transaction logs found matching the selected date range and filters.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const isIN = log.type && log.type.toUpperCase().includes('IN');
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
                      <Typography variant="subtitle2" fontWeight={600}>
                        {log.id}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.time}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {log.itemName}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.itemCode}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Typography
                        variant="subtitle1"
                        fontWeight={700}
                        color={isIN ? 'success.main' : 'error.main'}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                      >
                        {isIN ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                        {isIN ? log.qtyUsed : `-${log.qtyUsed}`}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip label={log.usedBy} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{log.department}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        {log.remainingStockAfter} available
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {log.issuedBy}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="textSecondary">
                        {log.notes || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal: Confirm Bulk Delete Multiple Logs Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete All Selected Logs Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all <strong>{selected.length} selected transaction logs</strong> from history? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} variant="contained" color="error">
            Delete All {selected.length} Logs
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
