// project imports
import getColors from 'utils/getColors';
import getShadow from 'utils/getShadow';

// ==============================|| OVERRIDES - INPUT BORDER & SHADOWS ||============================== //

function getColor({ variant, theme }) {
  const colors = getColors(theme, variant);
  const { light } = colors;

  const shadows = getShadow(theme, `${variant}`);

  return {
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: light },
    '&.Mui-focused': { boxShadow: shadows, '& .MuiOutlinedInput-notchedOutline': { border: '1px solid', borderColor: light } }
  };
}

// ==============================|| OVERRIDES - OUTLINED INPUT ||============================== //

export default function OutlinedInput(theme) {
  const isDark = theme.palette.mode === 'dark';
  return {
    MuiOutlinedInput: {
      styleOverrides: {
        input: {
          padding: 'var(--mantis-input-padding, 10.5px 14px 10.5px 12px)',
          color: isDark ? '#f8fafc' : 'inherit',
          '&::placeholder': {
            color: isDark ? '#64748b' : theme.vars.palette.grey[400],
            opacity: 1
          }
        },
        notchedOutline: {
          borderColor: isDark ? '#1e293b' : theme.vars.palette.grey[300]
        },
        root: {
          backgroundColor: isDark ? '#162033' : 'transparent',
          ...getColor({ variant: 'primary', theme }),
          '&.Mui-error': { ...getColor({ variant: 'error', theme }) },
          ...(isDark && {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#334155'
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 1px #6366f1',
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid',
                borderColor: '#6366f1'
              }
            },
            '&.Mui-disabled': {
              backgroundColor: '#131b2e',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#1e293b'
              }
            }
          })
        },
        sizeSmall: { '& .MuiOutlinedInput-input': { padding: 'var(--mantis-input-padding-small, 7.5px 8px 7.5px 12px)' } },
        multiline: { '& .MuiOutlinedInput-input': { padding: 0 } },
        colorSecondary: getColor({ variant: 'secondary', theme }),
        colorError: getColor({ variant: 'error', theme }),
        colorWarning: getColor({ variant: 'warning', theme }),
        colorInfo: getColor({ variant: 'info', theme }),
        colorSuccess: getColor({ variant: 'success', theme })
      }
    }
  };
}
