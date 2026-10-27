import PropTypes from 'prop-types';
import { createContext, useMemo, useEffect } from 'react';

// project imports
import config from 'config';
import { useLocalStorage } from 'hooks/useLocalStorage';

// ==============================|| CONFIG CONTEXT ||============================== //

export const ConfigContext = createContext(undefined);

// ==============================|| CONFIG PROVIDER ||============================== //

export function ConfigProvider({ children }) {
  // Clear any legacy dark mode cache once to guarantee light mode by default
  useEffect(() => {
    try {
      if (!localStorage.getItem('rehmat_theme_initialized_v2')) {
        localStorage.removeItem('mantis-react-free-config');
        localStorage.removeItem('mode');
        localStorage.removeItem('color-scheme');
        localStorage.removeItem('mui-mode');
        localStorage.setItem('rehmat_theme_initialized_v2', 'true');
      }
    } catch {
      // Ignore storage errors in private browsing
    }
  }, []);

  const { state, setState, setField, resetState } = useLocalStorage('rehmat-store-config-v2', {
    ...config,
    mode: 'light'
  });

  const memoizedValue = useMemo(() => ({ state, setState, setField, resetState }), [state, setField, setState, resetState]);

  return <ConfigContext.Provider value={memoizedValue}>{children}</ConfigContext.Provider>;
}

ConfigProvider.propTypes = { children: PropTypes.node };
