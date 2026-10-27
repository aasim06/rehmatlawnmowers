// third-party
import { merge } from 'lodash-es';

// project imports
import Badge from './Badge';
import Button from './Button';
import ButtonBase from './ButtonBase';
import CardContent from './CardContent';
import Checkbox from './Checkbox';
import Chip from './Chip';
import Drawer from './Drawer';
import FormHelperText from './FormHelperText';
import IconButton from './IconButton';
import InputLabel from './InputLabel';
import LinearProgress from './LinearProgress';
import Link from './Link';
import ListItemButton from './ListItemButton';
import ListItemIcon from './ListItemIcon';
import OutlinedInput from './OutlinedInput';
import Tab from './Tab';
import TableBody from './TableBody';
import TableCell from './TableCell';
import TableHead from './TableHead';
import TableRow from './TableRow';
import Tabs from './Tabs';
import Tooltip from './Tooltip';
import Typography from './Typography';

function DialogAndMenu(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: isDark ? '#131b2e' : theme.vars.palette.background.paper,
          border: isDark ? '1px solid #1e293b' : 'none',
          boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)' : undefined
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: isDark ? '#131b2e' : theme.vars.palette.background.paper,
          border: isDark ? '1px solid #1e293b' : 'none',
          boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)' : undefined
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          color: isDark ? '#f8fafc' : 'inherit',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : undefined
          },
          '&.Mui-selected': {
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : undefined,
            color: isDark ? '#818cf8' : undefined,
            '&:hover': {
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.18)' : undefined
            }
          }
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: isDark ? '#090d16' : 'rgb(247, 246, 242)',
          color: isDark ? '#f8fafc' : undefined
        }
      }
    }
  };
}

// ==============================|| OVERRIDES - MAIN ||============================== //

export default function ComponentsOverrides(theme) {
  return merge(
    Badge(theme),
    Button(theme),
    ButtonBase(),
    CardContent(),
    Checkbox(theme),
    Chip(theme),
    Drawer(theme),
    FormHelperText(),
    IconButton(theme),
    InputLabel(theme),
    LinearProgress(),
    Link(),
    ListItemButton(theme),
    ListItemIcon(theme),
    OutlinedInput(theme),
    Tab(theme),
    TableBody(theme),
    TableCell(theme),
    TableHead(theme),
    TableRow(theme),
    Tabs(),
    Tooltip(theme),
    Typography(),
    DialogAndMenu(theme)
  );
}
