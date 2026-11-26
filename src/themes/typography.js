// ==============================|| DEFAULT THEME - TYPOGRAPHY ||============================== //

export default function Typography(fontFamily) {
  return {
    htmlFontSize: 16,
    fontFamily,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.25,
      letterSpacing: '-0.015em'
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.015em'
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.25rem',
      lineHeight: 1.38,
      letterSpacing: '-0.01em'
    },
    h5: {
      fontWeight: 700,
      fontSize: '1.0625rem',
      lineHeight: 1.45
    },
    h6: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: 1.5
    },
    caption: {
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: 1.5
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.55
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.55
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5
    },
    subtitle2: {
      fontSize: '0.8125rem',
      fontWeight: 600,
      lineHeight: 1.45
    },
    overline: {
      lineHeight: 1.5
    },
    button: {
      textTransform: 'none'
    }
  };
}
