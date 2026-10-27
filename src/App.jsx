import { RouterProvider } from 'react-router-dom';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';
import { StoreInventoryProvider } from 'context/StoreInventoryContext';
import { AuthProvider } from 'context/AuthContext';
import LicenseGate from 'components/LicenseGate';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <AuthProvider>
        <StoreInventoryProvider>
          <LicenseGate>
            <RouterProvider router={router} />
          </LicenseGate>
        </StoreInventoryProvider>
      </AuthProvider>
    </ThemeCustomization>
  );
}
