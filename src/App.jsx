import { RouterProvider } from 'react-router-dom';

// project imports
import router from 'routes';
import ThemeCustomization from 'themes';
import { StoreInventoryProvider } from 'context/StoreInventoryContext';
import { AuthProvider } from 'context/AuthContext';

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function App() {
  return (
    <ThemeCustomization>
      <AuthProvider>
        <StoreInventoryProvider>
          <RouterProvider router={router} />
        </StoreInventoryProvider>
      </AuthProvider>
    </ThemeCustomization>
  );
}
