import { useState } from 'react';
import PropTypes from 'prop-types';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';

// project imports
import Dot from 'components/@extended/Dot';

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc' ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = [...array.map((el, index) => [el, index])];
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

const headCells = [
  {
    id: 'itemCode',
    align: 'left',
    disablePadding: false,
    label: 'Tracking / Item Code'
  },
  {
    id: 'itemName',
    align: 'left',
    disablePadding: true,
    label: 'Inventory Item Name'
  },
  {
    id: 'qtyUsed',
    align: 'center',
    disablePadding: false,
    label: 'Qty Used Today'
  },
  {
    id: 'usedBy',
    align: 'left',
    disablePadding: false,
    label: 'Who Used (Operator & Dept)'
  },
  {
    id: 'remainingStockAfter',
    align: 'right',
    disablePadding: false,
    label: 'Remaining Stock After'
  }
];

// ==============================|| STORE USAGE TABLE - HEADER ||============================== //

function OrderTableHead({ order, orderBy, onSelectAllClick, numSelected, rowCount }) {
  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all items'
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            {headCell.label}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

// ==============================|| STORE INVENTORY USAGE TABLE ||============================== //

export default function OrderTable() {
  const { usageLogs } = useStoreInventory();
  const [selected, setSelected] = useState([]);
  const order = 'desc';
  const orderBy = 'dateISO';

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = usageLogs.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
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
    <Box>
      <TableContainer
        sx={{
          width: '100%',
          overflowX: 'auto',
          position: 'relative',
          display: 'block',
          maxWidth: '100%',
          '& td, & th': { whiteSpace: 'nowrap' }
        }}
      >
        <Table aria-labelledby="tableTitle">
          <OrderTableHead
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            numSelected={selected.length}
            rowCount={usageLogs.length}
          />
          <TableBody>
            {stableSort(usageLogs, getComparator(order, orderBy)).map((row, index) => {
              const isItemSelected = isSelected(row.id);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  onClick={(event) => handleClick(event, row.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  selected={isItemSelected}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 }, cursor: 'pointer' }}
                  tabIndex={-1}
                  key={row.id}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      inputProps={{
                        'aria-labelledby': labelId
                      }}
                    />
                  </TableCell>

                  <TableCell component="th" id={labelId} scope="row">
                    <Link sx={{ color: 'secondary.main', fontWeight: 600 }}>{row.itemCode}</Link>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {row.time}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {row.itemName}
                    </Typography>
                    <Chip label={row.type} size="small" variant="light" color={row.type && row.type.toUpperCase().includes('IN') ? 'success' : 'primary'} sx={{ mt: 0.5 }} />
                  </TableCell>

                  <TableCell align="center">
                    <Typography variant="subtitle1" fontWeight={700} color={row.type && row.type.toUpperCase().includes('IN') ? 'success.main' : 'error.main'}>
                      {row.type && row.type.toUpperCase().includes('IN') ? row.qtyUsed : `-${row.qtyUsed}`}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="subtitle2">{row.usedBy}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      Dept: {row.department}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                      {row.remainingStockAfter} available
                    </Typography>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

OrderTableHead.propTypes = {
  order: PropTypes.any,
  orderBy: PropTypes.string,
  onSelectAllClick: PropTypes.func,
  numSelected: PropTypes.number,
  rowCount: PropTypes.number
};
