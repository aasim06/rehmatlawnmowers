import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

export default function FintechUsageLogTable({ usageLogs = [] }) {
  const displayLogs = usageLogs.slice(0, 5);

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
      {/* Header Row (NevBank style) */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ color: '#0F172A', fontWeight: 800 }}>
            Current Transactions &amp; Usage Log
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
            Real-time material dispatch to factory operators
          </Typography>
        </Box>

        {/* Filter Action Pill */}
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: '#005F56',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          🔍
        </Box>
      </Stack>

      {/* Modern NevBank Borderless Table */}
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ '& th': { borderBottom: '1px solid #F1F5F9', color: '#94A3B8', fontWeight: 700, fontSize: '0.725rem' } }}>
              <TableCell>DATE / TIME</TableCell>
              <TableCell>ITEM &amp; SKU</TableCell>
              <TableCell align="center">QTY</TableCell>
              <TableCell>OPERATOR / DEPT</TableCell>
              <TableCell align="right">TYPE</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, borderBottom: 'none' }}>
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    No recent inventory issuances recorded yet.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              displayLogs.map((log, index) => (
                <TableRow key={log.id || index} hover sx={{ '& td': { borderBottom: '1px solid #F8FAFC', py: 1.5 } }}>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                      {log.time || '10:45 AM'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 800 }}>
                      {log.itemName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#005F56', fontWeight: 700 }}>
                      {log.itemCode || log.id || 'SKU-1002'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography
                      variant="subtitle2"
                      sx={{ color: log.type && log.type.includes('IN') ? '#047857' : '#DC2626', fontWeight: 800 }}
                    >
                      {log.type && log.type.includes('IN') ? `+${log.qtyUsed}` : `-${log.qtyUsed}`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#0F172A', fontWeight: 700 }}>
                      {log.usedBy}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                      {log.department || 'Assembly Line'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip
                      label={log.type && log.type.includes('IN') ? 'Stock In' : 'Issuance'}
                      size="small"
                      sx={{
                        bgcolor: log.type && log.type.includes('IN') ? '#ECFDF5' : '#F3F4F6',
                        color: log.type && log.type.includes('IN') ? '#047857' : '#4B5563',
                        fontWeight: 800,
                        fontSize: '0.7rem',
                        borderRadius: '8px'
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

FintechUsageLogTable.propTypes = {
  usageLogs: PropTypes.array
};
