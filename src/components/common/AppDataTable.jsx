import PropTypes from 'prop-types';
import { useState, useEffect, useMemo } from 'react';

// material-ui
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';

// icons
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import CloseCircleOutlined from '@ant-design/icons/CloseCircleOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';

// project imports
import MainCard from 'components/MainCard';

/**
 * Universal Master Data Table component with built-in Search, Sort, Pagination,
 * Empty State, Selection, and Skeleton Loading.
 */
export default function AppDataTable({
  columns = [],
  data = [],
  loading = false,
  rowKey = 'id',
  searchable = true,
  searchPlaceholder = 'Search records...',
  searchKeys = [],
  initialSearch = '',
  emptyTitle = 'No Records Found',
  emptySubtitle = 'There are no records to display matching your criteria.',
  emptyAction,
  actions,
  actionsLabel = 'Actions',
  selectable = false,
  selected = [],
  onSelect,
  onRowClick,
  defaultRowsPerPage = 10,
  rowsPerPageOptions = [10, 25, 50, 100],
  toolbarLeft,
  toolbarRight,
  footerRows,
  cardProps = {},
  sx = {}
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [orderBy, setOrderBy] = useState('');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  // Helper to extract row ID
  const getRowId = (row, index) => {
    if (typeof rowKey === 'function') return rowKey(row, index);
    return row[rowKey] !== undefined ? row[rowKey] : index;
  };

  // Handle column header sort
  const handleSort = (columnId) => {
    const isAsc = orderBy === columnId && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(columnId);
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    if (!searchable || !searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase().trim();

    return data.filter((row) => {
      // If specific search keys are provided
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = row[key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(term);
        });
      }

      // Default: search all string/number fields of row
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(term);
        }
        return false;
      });
    });
  }, [data, searchable, searchTerm, searchKeys]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: 'base' });
      }

      return order === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, orderBy, order]);

  // Paginate sorted data
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  // Selection handlers
  const handleSelectAll = (event) => {
    if (!onSelect) return;
    if (event.target.checked) {
      const allIds = sortedData.map((row, idx) => getRowId(row, idx));
      onSelect(allIds);
    } else {
      onSelect([]);
    }
  };

  const handleSelectRow = (id, event) => {
    event.stopPropagation();
    if (!onSelect) return;
    const isSelected = selected.includes(id);
    if (isSelected) {
      onSelect(selected.filter((item) => item !== id));
    } else {
      onSelect([...selected, id]);
    }
  };

  const isAllSelected = sortedData.length > 0 && selected.length === sortedData.length;
  const isIndeterminate = selected.length > 0 && selected.length < sortedData.length;

  return (
    <MainCard content={false} {...cardProps} sx={{ borderRadius: 4, overflow: 'hidden', ...sx }}>
      {/* Search & Toolbar Header */}
      {(searchable || toolbarLeft || toolbarRight) && (
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, flexGrow: 1 }}>
            {searchable && (
              <OutlinedInput
                size="small"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                startAdornment={
                  <InputAdornment position="start">
                    <SearchOutlined style={{ color: '#8c8c8c' }} />
                  </InputAdornment>
                }
                endAdornment={
                  searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <CloseCircleOutlined style={{ fontSize: 13, color: '#8c8c8c' }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
                sx={{ width: { xs: '100%', sm: 280, md: 340 } }}
              />
            )}
            {toolbarLeft}
          </Box>

          {toolbarRight && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, flexWrap: 'wrap', gap: 1 }}
            >
              {toolbarRight}
            </Box>
          )}
        </Box>
      )}

      {/* Table Container */}
      <TableContainer sx={{ maxHeight: 680, overflowX: 'auto' }}>
        <Table stickyHeader size="medium" sx={{ minWidth: 650 }}>
          {/* Table Header */}
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell padding="checkbox" sx={{ width: 48 }}>
                  <Checkbox
                    color="primary"
                    indeterminate={isIndeterminate}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    inputProps={{ 'aria-label': 'Select all' }}
                  />
                </TableCell>
              )}

              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  sx={{
                    minWidth: col.minWidth || 'auto',
                    width: col.width || 'auto',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    color: 'text.secondary'
                  }}
                >
                  {col.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}

              {actions && (
                <TableCell
                  align="center"
                  sx={{
                    minWidth: 100,
                    width: 120,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    color: 'text.secondary'
                  }}
                >
                  {actionsLabel}
                </TableCell>
              )}
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: rowsPerPage > 10 ? 10 : rowsPerPage }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  {selectable && (
                    <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={20} height={20} sx={{ borderRadius: 0.5 }} />
                    </TableCell>
                  )}
                  {columns.map((col, colIdx) => (
                    <TableCell key={`col-skel-${colIdx}`}>
                      <Skeleton variant="text" width={colIdx === 0 ? '75%' : '50%'} height={24} />
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell align="center">
                      <Skeleton variant="circular" width={28} height={28} sx={{ mx: 'auto' }} />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)} align="center" sx={{ py: 6 }}>
                  <InboxOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 12 }} />
                  <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {emptyTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', mb: emptyAction ? 2 : 0 }}>
                    {emptySubtitle}
                  </Typography>
                  {emptyAction && <Box sx={{ mt: 2 }}>{emptyAction}</Box>}
                </TableCell>
              </TableRow>
            ) : (
              // Render Data Rows
              paginatedData.map((row, index) => {
                const id = getRowId(row, index);
                const isSelected = selected.includes(id);

                return (
                  <TableRow
                    key={id}
                    hover
                    selected={isSelected}
                    onClick={() => onRowClick && onRowClick(row)}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'default',
                      transition: 'background-color 0.15s ease',
                      '&:last-child td, &:last-child th': { border: 0 }
                    }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox" onClick={(e) => handleSelectRow(id, e)}>
                        <Checkbox color="primary" checked={isSelected} />
                      </TableCell>
                    )}

                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align || 'left'} sx={col.sx || {}}>
                        {col.render ? col.render(row, index) : row[col.id] !== undefined ? row[col.id] : '—'}
                      </TableCell>
                    ))}

                    {actions && (
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        {actions(row, index)}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
            {!loading && footerRows}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Footer */}
      {!loading && sortedData.length > 0 && (
        <TablePagination
          component="div"
          count={sortedData.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={rowsPerPageOptions}
          sx={{ borderTop: '1px solid', borderColor: 'divider' }}
        />
      )}
    </MainCard>
  );
}

AppDataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.node.isRequired,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      minWidth: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      sortable: PropTypes.bool,
      render: PropTypes.func,
      sx: PropTypes.object
    })
  ).isRequired,
  data: PropTypes.array,
  loading: PropTypes.bool,
  rowKey: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  searchable: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  searchKeys: PropTypes.arrayOf(PropTypes.string),
  emptyTitle: PropTypes.string,
  emptySubtitle: PropTypes.string,
  emptyAction: PropTypes.node,
  actions: PropTypes.func,
  actionsLabel: PropTypes.string,
  selectable: PropTypes.bool,
  selected: PropTypes.array,
  onSelect: PropTypes.func,
  onRowClick: PropTypes.func,
  defaultRowsPerPage: PropTypes.number,
  rowsPerPageOptions: PropTypes.arrayOf(PropTypes.number),
  toolbarLeft: PropTypes.node,
  toolbarRight: PropTypes.node,
  footerRows: PropTypes.node,
  cardProps: PropTypes.object,
  sx: PropTypes.object
};
