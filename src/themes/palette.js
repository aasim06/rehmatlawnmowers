// third-party
import { presetPalettes } from '@ant-design/colors';

// project imports
import ThemeOption from './theme';
import { extendPaletteWithChannels } from 'utils/colorUtils';

// ==============================|| GREY COLORS BUILDER ||============================== //

function buildGrey() {
  const greyPrimary = [
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#f0f0f0',
    '#d9d9d9',
    '#bfbfbf',
    '#8c8c8c',
    '#595959',
    '#262626',
    '#141414',
    '#000000'
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
      primary: '#101828',
      secondary: '#667085',
      disabled: '#98a2b3'
    },
    action: {
      active: '#667085',
      hover: '#f9fafb',
      selected: 'rgba(70, 95, 255, 0.08)',
      disabled: '#98a2b3',
      disabledBackground: '#f2f4f7'
    },
    divider: '#e4e7ec',
    background: {
      paper: '#ffffff',
      default: '#f9fafb'
    }
  });

  const darkPalette = extendPaletteWithChannels({
    mode: 'dark',
    ...extendedCommon,
    ...extendedLight,
    primary: {
      ...extendedLight.primary,
      lighter: '#1b2342',
      100: '#252dae',
      200: '#2a31d8',
      light: '#8098f9',
      400: '#7592ff',
      main: '#465fff',
      dark: '#3641f5',
      700: '#2a31d8',
      darker: '#c2d6ff',
      900: '#dde9ff',
      contrastText: '#ffffff'
    },
    secondary: {
      lighter: '#1d2939',
      100: '#1d2939',
      200: '#2e3a47',
      light: '#d0d5dd',
      400: '#98a2b3',
      main: '#98a2b3',
      dark: '#e4e7ec',
      700: '#e4e7ec',
      darker: '#f9fafb',
      900: '#ffffff',
      contrastText: '#101828'
    },
    text: {
      primary: '#f9fafb',
      secondary: '#98a2b3',
      disabled: '#667085'
    },
    action: {
      active: '#98a2b3',
      hover: 'rgba(255, 255, 255, 0.04)',
      selected: 'rgba(70, 95, 255, 0.14)',
      disabled: '#475467',
      disabledBackground: '#1d2939'
    },
    divider: '#2e3a47',
    background: {
      paper: '#171f2f',
      default: '#101828'
    },
    grey: {
      0: '#101828',
      50: '#171f2f',
      100: '#1d2939',
      200: '#2e3a47',
      300: '#344054',
      400: '#475467',
      500: '#667085',
      600: '#98a2b3',
      700: '#d0d5dd',
      800: '#e4e7ec',
      900: '#f9fafb',
      A50: '#171f2f',
      A100: '#1d2939',
      A200: '#2e3a47',
      A400: '#98a2b3',
      A700: '#d0d5dd',
      A800: '#667085'
    }
  });

  return {
    light: lightPalette,
    dark: darkPalette
  };
}
