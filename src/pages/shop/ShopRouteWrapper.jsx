import { Outlet } from 'react-router-dom';
import { ShopInventoryProvider } from 'context/ShopInventoryContext';

/**
 * ==============================================================================
 * 🏪 ShopRouteWrapper Component
 * ==============================================================================
 * Encapsulates the entire `/shop/*` sub-system with its own isolated
 * ShopInventoryProvider.
 *
 * Any child route (ShopDashboardPage, StockInPage, StockOutPage) accessing
 * useStoreInventory() automatically operates on Shop collections and localStorage,
 * completely segregated from the Factory Store / Main Warehouse inventory.
 */
export default function ShopRouteWrapper() {
  return (
    <ShopInventoryProvider>
      <Outlet />
    </ShopInventoryProvider>
  );
}

