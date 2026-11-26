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
  const hiddenScrollbar = {
    scrollbarWidth: 'none !important',
    msOverflowStyle: 'none !important',
    '&::-webkit-scrollbar': {
      display: 'none !important',
      width: '0 !important',
      height: '0 !important',
      background: 'transparent !important'
    }
  };

  return {
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundImage: 'none',
          backgroundColor: isDark ? '#171f2f' : '#ffffff',
          border: `1px solid ${isDark ? '#2e3a47' : '#e4e7ec'}`,
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.55), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
            : '0 20px 25px -5px rgba(16, 24, 40, 0.12), 0 8px 10px -6px rgba(16, 24, 40, 0.06)',
          ...hiddenScrollbar
        }
      }
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.0625rem',
          fontWeight: 700,
          lineHeight: 1.45
        }
      }
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          ...hiddenScrollbar
        }
      }
    },
    MuiMenu: {
      defaultProps: {
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left'
        },
        transformOrigin: {
          vertical: 'top',
          horizontal: 'left'
        }
      },
      styleOverrides: {
        paper: {
          maxHeight: 280,
          backgroundImage: 'none',
          backgroundColor: isDark ? '#171f2f' : '#ffffff',
          border: `1px solid ${isDark ? '#2e3a47' : '#e4e7ec'}`,
          boxShadow: isDark
            ? '0 10px 15px -3px rgba(0, 0, 0, 0.45), 0 4px 6px -4px rgba(0, 0, 0, 0.4)'
            : '0 10px 20px -5px rgba(16, 24, 40, 0.12), 0 4px 6px -2px rgba(16, 24, 40, 0.05)',
          borderRadius: 12,
          ...hiddenScrollbar
        },
        list: {
          maxHeight: 280,
          ...hiddenScrollbar
        }
      }
    },
    MuiAutocomplete: {
      styleOverrides: {
        popper: {
          zIndex: 1300
        },
        inputRoot: {
          alignItems: 'center',
          '&.MuiOutlinedInput-root': {
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 10,
            '& .MuiAutocomplete-input': {
              padding: '6px 4px !important',
              lineHeight: '1.4375em'
            },
            '&.MuiInputBase-sizeSmall': {
              paddingTop: 4,
              paddingBottom: 4,
              paddingLeft: 8,
              '& .MuiAutocomplete-input': {
                padding: '3.5px 4px !important',
                lineHeight: '1.4375em'
              }
            }
          }
        },
        paper: {
          backgroundImage: 'none',
          backgroundColor: isDark ? '#171f2f' : '#ffffff',
          border: `1px solid ${isDark ? '#2e3a47' : '#e4e7ec'}`,
          boxShadow: isDark
            ? '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)'
            : '0 10px 20px -5px rgba(16, 24, 40, 0.12), 0 4px 6px -2px rgba(16, 24, 40, 0.05)',
          borderRadius: 12,
          ...hiddenScrollbar
        },
        listbox: {
          maxHeight: '280px !important',
          padding: '6px !important',
          ...hiddenScrollbar
        },
        option: {
          fontSize: '0.875rem',
          borderRadius: 8,
          margin: '2px 4px',
          padding: '7px 12px !important',
          '&.Mui-focused': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'
          },
          '&[aria-selected="true"]': {
            backgroundColor: isDark ? 'rgba(70, 95, 255, 0.16) !important' : '#ecf3ff !important',
            color: isDark ? '#8098f9' : '#465fff',
            fontWeight: 600
          }
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          ...hiddenScrollbar
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: 6,
          color: isDark ? '#f9fafb' : '#344054',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f9fafb'
          },
          '&.Mui-selected': {
            backgroundColor: isDark ? 'rgba(70, 95, 255, 0.16)' : '#ecf3ff',
            color: isDark ? '#8098f9' : '#465fff',
            '&:hover': {
              backgroundColor: isDark ? 'rgba(70, 95, 255, 0.22)' : '#dde9ff'
            }
          }
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          ...hiddenScrollbar
        },
        body: {
          ...hiddenScrollbar,
          backgroundColor: isDark ? '#101828' : '#f9fafb',
          color: isDark ? '#f9fafb' : '#101828'
        },
        '*': {
          scrollbarWidth: 'none !important',
          msOverflowStyle: 'none !important',
          '&::-webkit-scrollbar': {
            display: 'none !important',
            width: '0 !important',
            height: '0 !important',
            background: 'transparent !important'
          }
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
