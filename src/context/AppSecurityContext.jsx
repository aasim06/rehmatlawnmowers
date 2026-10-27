import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { supabase } from 'api/supabase';
import { isTauriApp, isWebApp } from 'utils/platform';

const AppSecurityContext = createContext();

const DEFAULT_SECURITY_CONFIG = {
  isLocked: false,
  lockTitle: 'Application License Verification Required',
  lockMessage: 'Your application license has been temporarily locked or requires activation. Please contact the software administrator or developer to activate your license.',
  contactPhone: '+92 300 0000000',
  contactPerson: 'Software Developer',
  allowedOfflineHours: 72,
  updatedAt: new Date().toISOString()
};

const safeParseJSON = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export function AppSecurityProvider({ children }) {
  const isTauri = isTauriApp();
  const isWeb = isWebApp();

  const [securityConfig, setSecurityConfig] = useState(() => {
    return safeParseJSON('rehmat_desktop_security_v1', DEFAULT_SECURITY_CONFIG);
  });

  const [loading, setLoading] = useState(false);
  const [lastHandshakeTime, setLastHandshakeTime] = useState(() => {
    const saved = localStorage.getItem('rehmat_last_security_handshake');
    return saved ? parseInt(saved, 10) : Date.now();
  });

  // Calculate offline lock state
  const allowedOfflineMs = (securityConfig.allowedOfflineHours || 72) * 3600 * 1000;
  const offlineMsElapsed = Date.now() - lastHandshakeTime;
  const isOfflineExpired = isTauri && offlineMsElapsed > allowedOfflineMs;

  // The application is only ever locked if running in Tauri desktop mode AND locked via Supabase or offline limit
  const isAppLocked = isTauri && (Boolean(securityConfig.isLocked) || isOfflineExpired);

  // Fetch latest security state from Supabase
  const refreshSecurityConfig = useCallback(async () => {
    try {
      setLoading(true);
      // Query the reserved system control record
      const { data, error } = await supabase
        .from('machine_recipes')
        .select('*')
        .eq('id', '__APP_SECURITY__')
        .maybeSingle();

      if (!error && data?.ingredients) {
        const config = {
          ...DEFAULT_SECURITY_CONFIG,
          ...data.ingredients,
          isLocked: Boolean(data.ingredients.isLocked)
        };
        setSecurityConfig(config);
        localStorage.setItem('rehmat_desktop_security_v1', JSON.stringify(config));

        const now = Date.now();
        setLastHandshakeTime(now);
        localStorage.setItem('rehmat_last_security_handshake', now.toString());
      }
    } catch (err) {
      console.warn('AppSecurity check offline or failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update security configuration (Called from Web URL Vercel admin dashboard)
  const updateSecurityConfig = useCallback(async (newConfig) => {
    const merged = {
      ...securityConfig,
      ...newConfig,
      updatedAt: new Date().toISOString()
    };

    setSecurityConfig(merged);
    localStorage.setItem('rehmat_desktop_security_v1', JSON.stringify(merged));

    try {
      setLoading(true);
      const { error } = await supabase
        .from('machine_recipes')
        .upsert([{
          id: '__APP_SECURITY__',
          model_name: '__APP_CONTROL__',
          description: merged.isLocked ? 'LOCKED' : 'ACTIVE',
          ingredients: merged
        }]);

      if (error) {
        console.error('Failed to sync security config to Supabase:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      console.error('Exception syncing security config:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [securityConfig]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    refreshSecurityConfig();

    // Subscribe to real-time changes
    let channel;
    try {
      channel = supabase
        .channel('app_security_sync')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'machine_recipes', filter: 'id=eq.__APP_SECURITY__' },
          (payload) => {
            if (payload?.new?.ingredients) {
              const updated = {
                ...DEFAULT_SECURITY_CONFIG,
                ...payload.new.ingredients,
                isLocked: Boolean(payload.new.ingredients.isLocked)
              };
              setSecurityConfig(updated);
              localStorage.setItem('rehmat_desktop_security_v1', JSON.stringify(updated));
              const now = Date.now();
              setLastHandshakeTime(now);
              localStorage.setItem('rehmat_last_security_handshake', now.toString());
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime channel subscription error:', e);
    }

    // Periodic check every 15 seconds in Tauri
    const interval = setInterval(() => {
      refreshSecurityConfig();
    }, isTauri ? 15000 : 30000);

    return () => {
      clearInterval(interval);
      if (channel) supabase.removeChannel(channel);
    };
  }, [isTauri, refreshSecurityConfig]);

  const value = {
    securityConfig,
    isAppLocked,
    isOfflineExpired,
    offlineHoursElapsed: Math.round(offlineMsElapsed / 3600000),
    loading,
    isTauri,
    isWeb,
    updateSecurityConfig,
    refreshSecurityConfig
  };

  return (
    <AppSecurityContext.Provider value={value}>
      {children}
    </AppSecurityContext.Provider>
  );
}

AppSecurityProvider.propTypes = {
  children: PropTypes.node
};

export const useAppSecurity = () => useContext(AppSecurityContext);
