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
          padding: 'var(--mantis-input-padding, 10px 14px)',
          lineHeight: '1.4375em',
          color: isDark ? '#f9fafb' : '#101828',
          '&::placeholder': {
            color: isDark ? '#667085' : '#98a2b3',
            opacity: 1
          }
        },
        notchedOutline: {
          borderColor: isDark ? '#344054' : '#d0d5dd',
          transition: 'border-color 0.15s ease'
        },
        root: {
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 8,
          backgroundColor: isDark ? '#1d2939' : '#ffffff',
          ...getColor({ variant: 'primary', theme }),
          '&.Mui-error': { ...getColor({ variant: 'error', theme }) },
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            minHeight: '1.4375em'
          },
          ...(isDark && {
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#475467'
            },
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(70, 95, 255, 0.2)',
              '& .MuiOutlinedInput-notchedOutline': {
                border: '1px solid',
                borderColor: '#465fff'
              }
            },
            '&.Mui-disabled': {
              backgroundColor: '#171f2f',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#2e3a47'
              }
            }
          })
        },
        sizeSmall: {
          '& .MuiOutlinedInput-input': {
            padding: 'var(--mantis-input-padding-small, 7.5px 12px)'
          },
          '&.MuiInputBase-multiline': {
            padding: '7.5px 12px'
          }
        },
        multiline: {
          padding: '10px 14px',
          alignItems: 'flex-start',
          '& .MuiOutlinedInput-input': { padding: 0 }
        },
        colorSecondary: getColor({ variant: 'secondary', theme }),
        colorError: getColor({ variant: 'error', theme }),
        colorWarning: getColor({ variant: 'warning', theme }),
        colorInfo: getColor({ variant: 'info', theme }),
        colorSuccess: getColor({ variant: 'success', theme })
      }
    }
  };
}
