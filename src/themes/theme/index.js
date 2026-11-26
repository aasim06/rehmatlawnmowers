// ==============================|| PRESET THEME - TAILADMIN ||============================== //

export default function Default() {
  const greyColors = {
    0: '#ffffff',
    50: '#f9fafb',
    100: '#f2f4f7',
    200: '#e4e7ec',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1d2939',
    900: '#101828',
    A50: '#f9fafb',
    A100: '#f2f4f7',
    A200: '#e4e7ec',
    A400: '#98a2b3',
    A700: '#344054',
    A800: '#1d2939'
  };
  const contrastText = '#ffffff';

  return {
    primary: {
      lighter: '#ecf3ff',
      100: '#dde9ff',
      200: '#c2d6ff',
      light: '#7592ff',
      400: '#7592ff',
      main: '#465fff',
      dark: '#3641f5',
      700: '#2a31d8',
      darker: '#252dae',
      900: '#19216c',
      contrastText
    },
    secondary: {
      lighter: greyColors[50],
      100: greyColors[100],
      200: greyColors[200],
      light: greyColors[300],
      400: greyColors[400],
      main: greyColors[500],
      600: greyColors[600],
      dark: greyColors[700],
      800: greyColors[800],
      darker: greyColors[900],
      A100: greyColors[0],
      A200: greyColors[400],
      A300: greyColors[700],
      contrastText: greyColors[0]
    },
    error: {
      lighter: '#fef3f2',
      light: '#fecdca',
      main: '#f04438',
      dark: '#d92d20',
      darker: '#912018',
      contrastText
    },
    warning: {
      lighter: '#fffaeb',
      light: '#fedf89',
      main: '#f79009',
      dark: '#dc6803',
      darker: '#93370d',
      contrastText
    },
    info: {
      lighter: '#f0f9ff',
      light: '#b9e6fe',
      main: '#0ba5ec',
      dark: '#0086c9',
      darker: '#065986',
      contrastText
    },
    success: {
      lighter: '#ecfdf3',
      light: '#a6f4c5',
      main: '#12b76a',
      dark: '#039855',
      darker: '#05603a',
      contrastText
    },
    grey: greyColors
  };
}
