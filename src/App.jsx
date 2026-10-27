import { RouterProvider } from 'react-router-dom';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';
import { StoreInventoryProvider } from 'context/StoreInventoryContext';
import { AuthProvider } from 'context/AuthContext';
import { AppSecurityProvider } from 'context/AppSecurityContext';
import DesktopLockGuard from 'components/security/DesktopLockGuard';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <AuthProvider>
        <StoreInventoryProvider>
          <AppSecurityProvider>
            <RouterProvider router={router} />
            <DesktopLockGuard />
          </AppSecurityProvider>
        </StoreInventoryProvider>
      </AuthProvider>
    </ThemeCustomization>
  );
}
