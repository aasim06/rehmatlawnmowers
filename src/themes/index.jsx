import PropTypes from 'prop-types';
import { useMemo, useEffect } from 'react';

// material-ui
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// project imports
import useConfig from 'hooks/useConfig';
import CustomShadows from './custom-shadows';
import componentsOverride from './overrides';
import { buildPalette } from './palette';
import Typography from './typography';

// ==============================|| DEFAULT THEME - MAIN ||============================== //

export default function ThemeCustomization({ children }) {
  const { state } = useConfig();
  const mode = state.mode || 'light';

  const themeTypography = useMemo(() => Typography(state.fontFamily), [state.fontFamily]);
  const palettes = useMemo(() => buildPalette(state.presetColor), [state.presetColor]);
  const currentPalette = mode === 'dark' ? palettes.dark : palettes.light;

  // Apply data-color-scheme to <html> for CSS vars
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', mode);
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  const themeOptions = useMemo(
    () => ({
      breakpoints: {
        values: { xs: 0, sm: 768, md: 1024, lg: 1266, xl: 1440 }
      },
      direction: 'ltr',
      mixins: {
        toolbar: { minHeight: 60, paddingTop: 8, paddingBottom: 8 }
      },
      typography: themeTypography,
      palette: currentPalette,
      customShadows: CustomShadows(currentPalette),
      colorSchemes: {
        light: { palette: palettes.light },
        dark: { palette: palettes.dark }
      },
      cssVariables: {
        cssVarPrefix: '',
        colorSchemeSelector: 'data-color-scheme'
      }
    }),
    [themeTypography, palettes, currentPalette]
  );

  const themes = createTheme(themeOptions);
  themes.components = componentsOverride(themes);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider disableTransitionOnChange theme={themes}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

ThemeCustomization.propTypes = { children: PropTypes.node };
