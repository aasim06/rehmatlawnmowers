import React from 'react';
import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// icons
import BookOutlined from '@ant-design/icons/BookOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import DownOutlined from '@ant-design/icons/DownOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import FileTextOutlined from '@ant-design/icons/FileTextOutlined';
import PrinterOutlined from '@ant-design/icons/PrinterOutlined';
import UpOutlined from '@ant-design/icons/UpOutlined';

// project imports
import AppButton from 'components/common/AppButton';
import { getTableHeadCellSx } from 'utils/themeSurface';

const subHeadCellSx = getTableHeadCellSx({ py: 1.25 });

/**
 * Shared expandable hierarchical account ledger table used by Machine Customer Ledger
 * and Shop Customer Ledger so parent accounts and child bills look 100% consistent.
 */
export default function HierarchicalLedgerTable({
  accounts = [],
  expandedKey,
  onToggleExpand,
  onPrintAccount,
  onDeleteAccount,
  onPrintChild,
  onEditChild,
  onDeleteChild,
  canDelete = true,
  labels = {
    accountCol: 'ACCOUNT / PERSON NAME',
    contactCol: 'CONTACT / DEPARTMENT',
    countCol: 'TOTAL SLIPS',
    qtyCol: 'TOTAL QTY',
    valueCol: 'TOTAL VALUE',
    countSuffix: 'Slips',
    childHeading: 'All Transactions & Slips for:',
    itemCol: 'Item / Specification',
    emptyTitle: 'No Ledger Accounts Found',
    emptySubtitle: 'Records will appear here automatically once entries are saved.'
  }
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <TableContainer sx={{ minHeight: 380 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 48 }} />
            <TableCell sx={{ fontWeight: 600 }}>{labels.accountCol}</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>{labels.contactCol}</TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              {labels.countCol}
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="center">
              {labels.qtyCol}
            </TableCell>
            <TableCell sx={{ fontWeight: 600 }} align="right">
              {labels.valueCol}
            </TableCell>
            <TableCell sx={{ fontWeight: 600, width: 200 }} align="center">
              ACTIONS
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 7 }}>
                <BookOutlined
                  style={{ fontSize: '2.25rem', color: theme.palette.text.disabled, display: 'block', margin: '0 auto 10px' }}
                />
                <Typography variant="h6" fontWeight={700} color="text.secondary">
                  {labels.emptyTitle}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {labels.emptySubtitle}
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((acc) => {
              const isExpanded = expandedKey === acc.rowKey;
              return (
                <React.Fragment key={acc.rowKey}>
                  <TableRow
                    hover
                    onClick={() => onToggleExpand(isExpanded ? null : acc.rowKey)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: isExpanded ? (isDark ? 'rgba(255,255,255,0.03)' : 'grey.50') : 'inherit'
                    }}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleExpand(isExpanded ? null : acc.rowKey);
                        }}
                        sx={{ color: isExpanded ? 'primary.main' : 'text.secondary' }}
                      >
                        {isExpanded ? <UpOutlined style={{ fontSize: 12 }} /> : <DownOutlined style={{ fontSize: 12 }} />}
                      </IconButton>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                        {acc.name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {acc.contact || 'N/A'}
                      </Typography>
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={`${acc.recordsCount} ${labels.countSuffix}`}
                        size="small"
                        color={isExpanded ? 'primary' : 'default'}
                        variant={isExpanded ? 'filled' : 'outlined'}
                        sx={{ fontWeight: 700 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip label={`${acc.totalQty} Pcs`} size="small" color="info" variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                        Rs. {(acc.totalValue || 0).toLocaleString()}
                      </Typography>
                      {acc.balanceValue > 0 && (
                        <Typography variant="caption" color="error.main" fontWeight={700} display="block">
                          Due: Rs. {acc.balanceValue.toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                        <AppButton size="small" intent="secondary" startIcon={<PrinterOutlined />} onClick={() => onPrintAccount(acc)}>
                          Statement
                        </AppButton>

                        {canDelete && onDeleteAccount && (
                          <Tooltip title={`Delete all records for ${acc.name}`}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onDeleteAccount(acc)}
                              sx={{
                                bgcolor: isDark ? 'rgba(255, 77, 79, 0.14)' : '#fff1f0',
                                '&:hover': { bgcolor: '#ff4d4f', color: '#fff' }
                              }}
                            >
                              <DeleteOutlined style={{ fontSize: 13 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Child Records */}
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, bgcolor: isDark ? '#101828' : '#f9fafb' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2.5 }}>
                          <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            color="primary.main"
                            sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            <FileTextOutlined /> {labels.childHeading} {acc.name}
                          </Typography>

                          <TableContainer
                            component={Paper}
                            elevation={0}
                            sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell sx={{ ...subHeadCellSx, width: 50 }}>Sr</TableCell>
                                  <TableCell sx={subHeadCellSx}>{labels.itemCol}</TableCell>
                                  <TableCell align="right" sx={{ ...subHeadCellSx, width: 80 }}>
                                    Qty
                                  </TableCell>
                                  <TableCell align="right" sx={{ ...subHeadCellSx, width: 110 }}>
                                    Rate
                                  </TableCell>
                                  <TableCell align="right" sx={{ ...subHeadCellSx, width: 110 }}>
                                    Amount
                                  </TableCell>
                                  <TableCell align="center" sx={{ ...subHeadCellSx, width: 100 }}>
                                    Action
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(acc.records || []).map((rec, recIdx) => (
                                  <React.Fragment key={rec.key || recIdx}>
                                    <TableRow
                                      sx={{
                                        bgcolor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'grey.50',
                                        borderTop: '1px solid',
                                        borderBottom: '1px solid',
                                        borderColor: 'divider'
                                      }}
                                    >
                                      <TableCell colSpan={5} sx={{ py: 1, px: 1.5 }}>
                                        <Box
                                          sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: 1
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
                                            <Typography
                                              component="span"
                                              sx={{ fontWeight: 700, fontSize: '0.8125rem', color: 'primary.main' }}
                                            >
                                              {rec.voucherNo}
                                            </Typography>
                                            <Typography component="span" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                                              {rec.dateLabel}
                                            </Typography>
                                            {rec.statusLabel && (
                                              <Chip
                                                label={rec.statusLabel}
                                                size="small"
                                                color={rec.statusColor || 'default'}
                                                sx={{ height: 22, fontSize: '0.75rem', fontWeight: 700 }}
                                              />
                                            )}
                                          </Box>
                                          <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.875rem', color: 'text.primary' }}>
                                            Rs. {(rec.totalAmount || 0).toLocaleString()}
                                          </Typography>
                                        </Box>
                                      </TableCell>
                                      <TableCell align="center" sx={{ py: 0.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                                          {onPrintChild && (
                                            <Tooltip title="Print Invoice / Slip">
                                              <IconButton size="small" color="primary" onClick={() => onPrintChild(rec.raw)}>
                                                <PrinterOutlined style={{ fontSize: 13 }} />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                          {onEditChild && rec.editable !== false && (
                                            <Tooltip title="Edit Record">
                                              <IconButton size="small" color="info" onClick={() => onEditChild(rec.raw)}>
                                                <EditOutlined style={{ fontSize: 13 }} />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                          {canDelete && onDeleteChild && (
                                            <Tooltip title="Delete Entry">
                                              <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => onDeleteChild(rec.raw)}
                                                sx={{
                                                  bgcolor: isDark ? 'rgba(255, 77, 79, 0.14)' : '#fff1f0',
                                                  '&:hover': { bgcolor: '#ff4d4f', color: '#fff' }
                                                }}
                                              >
                                                <DeleteOutlined style={{ fontSize: 13 }} />
                                              </IconButton>
                                            </Tooltip>
                                          )}
                                        </Box>
                                      </TableCell>
                                    </TableRow>

                                    {(rec.lineItems || []).map((item, itemIdx) => (
                                      <TableRow key={itemIdx} hover>
                                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', pl: 2 }}>{itemIdx + 1}</TableCell>
                                        <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                                          {item.name}
                                          {item.subtitle && (
                                            <Typography variant="caption" color="text.secondary" display="block">
                                              {item.subtitle}
                                            </Typography>
                                          )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                                          {item.qty}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.8125rem', color: 'text.secondary' }}>
                                          {item.rate > 0 ? item.rate.toLocaleString() : '-'}
                                        </TableCell>
                                        <TableCell align="right" sx={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                                          {item.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell />
                                      </TableRow>
                                    ))}
                                  </React.Fragment>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

HierarchicalLedgerTable.propTypes = {
  accounts: PropTypes.arrayOf(PropTypes.object),
  expandedKey: PropTypes.string,
  onToggleExpand: PropTypes.func.isRequired,
  onPrintAccount: PropTypes.func.isRequired,
  onDeleteAccount: PropTypes.func,
  onPrintChild: PropTypes.func,
  onEditChild: PropTypes.func,
  onDeleteChild: PropTypes.func,
  canDelete: PropTypes.bool,
  labels: PropTypes.object
};
