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
      lighter: '#1e293b',
      100: '#063970',
      200: '#0b5ed7',
      light: '#40a9ff',
      400: '#1890ff',
      main: '#1890ff',
      dark: '#096dd9',
      700: '#0050b3',
      darker: '#003a8c',
      900: '#002766',
      contrastText: '#ffffff'
    },
    secondary: {
      lighter: '#1e293b',
      100: '#27272a',
      200: '#3f3f46',
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
      hover: '#334155',
      selected: '#475569',
      disabled: '#64748b',
      disabledBackground: '#1e293b'
    },
    divider: '#334155',
    background: {
      paper: '#1e293b',
      default: '#0f172a'
    },
    grey: {
      0: '#0f172a',
      50: '#1e293b',
      100: '#334155',
      200: '#475569',
      300: '#64748b',
      400: '#94a3b8',
      500: '#cbd5e1',
      600: '#e2e8f0',
      700: '#f1f5f9',
      800: '#f8fafc',
      900: '#ffffff',
      A50: '#1e293b',
      A100: '#334155',
      A200: '#475569',
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
