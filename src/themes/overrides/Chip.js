import { withAlpha } from 'utils/colorUtils';
import getColors from 'utils/getColors';

const CHIP_COLORS = ['primary', 'secondary', 'error', 'info', 'success', 'warning'];

// ==============================|| CHIP - COLORS ||============================== //

function getColor({ color, theme }) {
  const colors = getColors(theme, color);
  const { dark } = colors;

  return {
    '&.Mui-focusVisible': {
      outline: `2px solid ${dark}`,
      outlineOffset: 2
    }
  };
}

function getColorStyle({ color, theme }) {
  const isDark = theme.palette.mode === 'dark';
  const colors = getColors(theme, color);
  const { light, lighter, main, dark } = colors;
  const textColor = isDark ? light || main : dark || main;

  return {
    color: textColor,
    backgroundColor: isDark ? withAlpha(main, 0.16) : lighter,
    borderColor: isDark ? withAlpha(main, 0.3) : light,
    '& .MuiChip-deleteIcon': {
      color: textColor,
      '&:hover': {
        color: main
      }
    }
  };
}

/**
 * Generate color variant styles for a given variant type
 * @param theme - MUI theme object
 * @param variantType - Type of variant ('root' or 'light' or 'combined')
 * @returns Object with color-specific selectors and their styles
 */
function generateColorVariants(theme, variantType) {
  const styleBuilder = variantType === 'root' ? getColor : getColorStyle;

  return CHIP_COLORS.reduce((acc, color) => {
    acc[`&.MuiChip-color${color.charAt(0).toUpperCase() + color.slice(1)}`] = styleBuilder({
      color: color,
      theme
    });
    return acc;
  }, {});
}

// ==============================|| OVERRIDES - CHIP ||============================== //

export default function Chip(theme) {
  const defaultLightChip = getColorStyle({ color: 'secondary', theme });
  const colorVariants = generateColorVariants(theme, 'light');

  return {
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
          '&:active': {
            boxShadow: 'none'
          },
          ...generateColorVariants(theme, 'root')
        },
        sizeSmall: {
          height: 24,
          fontSize: '0.75rem'
        },
        sizeLarge: {
          fontSize: '0.95rem',
          height: 38
        },
        light: {
          ...defaultLightChip,
          ...colorVariants
        },
        combined: {
          border: '1px solid',
          ...defaultLightChip,
          ...colorVariants
        }
      }
    }
  };
}
