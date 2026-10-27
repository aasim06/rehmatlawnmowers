// third-party
import { presetPalettes } from '@ant-design/colors';

// project imports
import ThemeOption from './theme';
import { extendPaletteWithChannels } from 'utils/colorUtils';

// ==============================|| GREY COLORS BUILDER ||============================== //

function buildGrey() {
  const greyPrimary = [
    '#ffffff', '#fafafa', '#f5f5f5', '#f0f0f0', '#d9d9d9',
    '#bfbfbf', '#8c8c8c', '#595959', '#262626', '#141414', '#000000'
  ];
  const greyAscent = ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];
  const greyConstant = ['#fafafb', '#e6ebf1'];
  return [...greyPrimary, ...greyAscent, ...greyConstant];
}

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export function buildPalette(presetColor) {
  const colors = { ...presetPalettes, grey: buildGrey() };
  const paletteColor = ThemeOption(colors, presetColor);
  const commonColor = { common: { black: '#000000', white: '#ffffff' } };

  const extendedLight = extendPaletteWithChannels(paletteColor);
  const extendedCommon = extendPaletteWithChannels(commonColor);

  const lightPalette = extendPaletteWithChannels({
    mode: 'light',
    ...extendedCommon,
    ...extendedLight,
    text: {
      primary: extendedLight.grey[700],
      secondary: extendedLight.grey[500],
      disabled: extendedLight.grey[400]
    },
    action: { disabled: extendedLight.grey[300] },
    divider: extendedLight.grey[200],
    background: {
      paper: extendedLight.grey[0],
      default: 'rgb(247, 246, 242)'
    }
  });

  const darkPalette = extendPaletteWithChannels({
    mode: 'dark',
    ...extendedCommon,
    ...extendedLight,
    primary: {
      ...extendedLight.primary,
      lighter: '#1e1b4b',
      100: '#312e81',
      200: '#3730a3',
      light: '#818cf8',
      400: '#818cf8',
      main: '#6366f1',
      dark: '#4f46e5',
      700: '#4338ca',
      darker: '#312e81',
      900: '#1e1b4b',
      contrastText: '#ffffff'
    },
    secondary: {
      lighter: '#162033',
      100: '#1e293b',
      200: '#334155',
      light: '#cbd5e1',
      400: '#94a3b8',
      main: '#94a3b8',
      dark: '#cbd5e1',
      700: '#e2e8f0',
      darker: '#f8fafc',
      900: '#ffffff',
      contrastText: '#0f172a'
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      disabled: '#64748b'
    },
    action: {
      active: '#94a3b8',
      hover: '#1e293b',
      selected: '#27273a',
      disabled: '#475569',
      disabledBackground: '#162033'
    },
    divider: '#1e293b',
    background: {
      paper: '#131b2e',
      default: '#090d16'
    },
    grey: {
      0: '#090d16',
      50: '#0f172a',
      100: '#131b2e',
      200: '#162033',
      300: '#1e293b',
      400: '#334155',
      500: '#64748b',
      600: '#94a3b8',
      700: '#cbd5e1',
      800: '#e2e8f0',
      900: '#f8fafc',
      A50: '#0f172a',
      A100: '#131b2e',
      A200: '#162033',
      A400: '#94a3b8',
      A700: '#cbd5e1',
      A800: '#64748b'
    }
  });

  return {
    light: lightPalette,
    dark: darkPalette
  };
}
