import { lazy } from 'react';
import Loadable from 'components/Loadable';

// Lazy-loaded route pages for instant initial load & code-splitting
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));
const ItemsPage = Loadable(lazy(() => import('pages/inventory/ItemsPage')));
const AddItemNamePage = Loadable(lazy(() => import('pages/inventory/AddItemNamePage')));
const StockInPage = Loadable(lazy(() => import('pages/inventory/StockInPage')));
const StockOutPage = Loadable(lazy(() => import('pages/inventory/StockOutPage')));
const VendorsPage = Loadable(lazy(() => import('pages/inventory/VendorsPage')));
const MachineDashboardPage = Loadable(lazy(() => import('pages/inventory/MachineDashboardPage')));
const MachineSalesPage = Loadable(lazy(() => import('pages/inventory/MachineSalesPage')));
const MachineInvoicesPage = Loadable(lazy(() => import('pages/inventory/MachineInvoicesPage')));
const MachinePaymentsPage = Loadable(lazy(() => import('pages/inventory/MachinePaymentsPage')));
const MachineRepairsPage = Loadable(lazy(() => import('pages/inventory/MachineRepairsPage')));
const CategoriesPage = Loadable(lazy(() => import('pages/inventory/CategoriesPage')));
const UsageLogPage = Loadable(lazy(() => import('pages/inventory/UsageLogPage')));
const FactoryInvoicesPage = Loadable(lazy(() => import('pages/inventory/FactoryInvoicesPage')));
const StorePaymentsPage = Loadable(lazy(() => import('pages/inventory/StorePaymentsPage')));
const StoreLedgerPage = Loadable(lazy(() => import('pages/inventory/StoreLedgerPage')));
const ReportsPage = Loadable(lazy(() => import('pages/inventory/ReportsPage')));
const MachineBOMPage = Loadable(lazy(() => import('pages/inventory/MachineBOMPage')));
const CustomerLedgerPage = Loadable(lazy(() => import('pages/inventory/CustomerLedgerPage')));
const VendorLedgerPage = Loadable(lazy(() => import('pages/inventory/VendorLedgerPage')));
const BackupRestorePage = Loadable(lazy(() => import('pages/inventory/BackupRestorePage')));
const ExpensesPage = Loadable(lazy(() => import('pages/inventory/ExpensesPage')));
const UserManagementPage = Loadable(lazy(() => import('pages/admin/UserManagementPage')));
const AppSecurityPage = Loadable(lazy(() => import('pages/admin/AppSecurityPage')));
const ProfilePage = Loadable(lazy(() => import('pages/admin/ProfilePage')));
const ShopRouteWrapper = Loadable(lazy(() => import('pages/shop/ShopRouteWrapper')));
const ShopDashboardPage = Loadable(lazy(() => import('pages/shop/ShopDashboardPage')));
const ShopAddProductPage = Loadable(lazy(() => import('pages/shop/ShopAddProductPage')));
const ShopMartPage = Loadable(lazy(() => import('pages/shop/ShopMartPage')));
const ShopLedgerPage = Loadable(lazy(() => import('pages/shop/ShopLedgerPage')));
const ShopInvoicesPage = Loadable(lazy(() => import('pages/shop/ShopInvoicesPage')));
const ShopPaymentsPage = Loadable(lazy(() => import('pages/shop/ShopPaymentsPage')));
// layout, auth & RBAC guards
import { Navigate } from 'react-router-dom';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from 'components/ProtectedRoute';
import RoleGuard from 'components/RoleGuard';
import usePermission from 'hooks/usePermission';

// Smart Home Index component: opens Dashboard if allowed, or gracefully forwards to first permitted staff module
function RootIndexRoute() {
  const { hasAccessToItem, isMasterAdmin, isSuperAdmin } = usePermission();

  if (isMasterAdmin || isSuperAdmin || hasAccessToItem({ id: 'dashboard' })) {
    return <Navigate to="/dashboard/default" replace />;
  }

  if (hasAccessToItem({ id: 'stock-in' })) return <Navigate to="/inventory/stock-in" replace />;
  if (hasAccessToItem({ id: 'stock-out' })) return <Navigate to="/inventory/stock-out" replace />;
  if (hasAccessToItem({ id: 'items' })) return <Navigate to="/inventory/items" replace />;
  if (hasAccessToItem({ id: 'machine-sales' })) return <Navigate to="/inventory/machine-sales" replace />;
  if (hasAccessToItem({ id: 'machine-repairs' })) return <Navigate to="/inventory/machine-repairs" replace />;
  if (hasAccessToItem({ id: 'expenses' })) return <Navigate to="/inventory/expenses" replace />;
  if (hasAccessToItem({ id: 'vendors' })) return <Navigate to="/inventory/vendors" replace />;
  if (hasAccessToItem({ id: 'categories' })) return <Navigate to="/inventory/categories" replace />;
  if (hasAccessToItem({ id: 'store-ledger' })) return <Navigate to="/inventory/store-ledger" replace />;
  if (hasAccessToItem({ id: 'ledger' })) return <Navigate to="/inventory/ledger" replace />;
  if (hasAccessToItem({ id: 'reports' })) return <Navigate to="/inventory/reports" replace />;
  if (hasAccessToItem({ id: 'shop-dashboard' })) return <Navigate to="/shop/dashboard" replace />;
  if (hasAccessToItem({ id: 'shop-mart' })) return <Navigate to="/shop/mart" replace />;
  if (hasAccessToItem({ id: 'shop-add-product' })) return <Navigate to="/shop/add-product" replace />;
  if (hasAccessToItem({ id: 'shop-ledger' })) return <Navigate to="/shop/ledger" replace />;
  if (hasAccessToItem({ id: 'shop-invoices' })) return <Navigate to="/shop/invoices" replace />;

  return <Navigate to="/dashboard/default" replace />;
}

// Smart Shop Index component: opens Shop Dashboard if allowed, or gracefully forwards to permitted Shop module
function ShopIndexRoute() {
  const { hasAccessToItem, isMasterAdmin } = usePermission();
  if (isMasterAdmin || hasAccessToItem({ id: 'shop-dashboard' })) return <Navigate to="/shop/dashboard" replace />;
  if (hasAccessToItem({ id: 'shop-mart' })) return <Navigate to="/shop/mart" replace />;
  if (hasAccessToItem({ id: 'shop-add-product' })) return <Navigate to="/shop/add-product" replace />;
  if (hasAccessToItem({ id: 'shop-ledger' })) return <Navigate to="/shop/ledger" replace />;
  if (hasAccessToItem({ id: 'shop-invoices' })) return <Navigate to="/shop/invoices" replace />;
  return <Navigate to="/dashboard/default" replace />;
}

// ==============================|| MAIN ROUTING (ZERO-LATENCY INSTANT NAVIGATION WITH RBAC ROLEGUARDS) ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <RootIndexRoute />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: (
            <RoleGuard permission="dashboard">
              <DashboardDefault />
            </RoleGuard>
          )
        }
      ]
    },
    {
      path: 'inventory',
      children: [
        {
          path: 'items',
          element: (
            <RoleGuard permission="items">
              <ItemsPage />
            </RoleGuard>
          )
        },
        {
          path: 'categories',
          element: (
            <RoleGuard permission="categories">
              <CategoriesPage />
            </RoleGuard>
          )
        },
        {
          path: 'add-item-name',
          element: (
            <RoleGuard permission="categories">
              <AddItemNamePage />
            </RoleGuard>
          )
        },
        {
          path: 'stock-in',
          element: (
            <RoleGuard permission="stock-in">
              <StockInPage />
            </RoleGuard>
          )
        },
        {
          path: 'stock-out',
          element: (
            <RoleGuard permission="stock-out">
              <StockOutPage />
            </RoleGuard>
          )
        },
        {
          path: 'bom',
          element: (
            <RoleGuard permission="items">
              <MachineBOMPage />
            </RoleGuard>
          )
        },
        {
          path: 'machine-dashboard',
          element: (
            <RoleGuard permission="machine-sales">
              <MachineDashboardPage />
            </RoleGuard>
          )
        },
        {
          path: 'machine-sales',
          element: (
            <RoleGuard permission="machine-sales">
              <MachineSalesPage />
            </RoleGuard>
          )
        },
        {
          path: 'machine-invoices',
          element: (
            <RoleGuard permission="machine-sales">
              <MachineInvoicesPage />
            </RoleGuard>
          )
        },
        {
          path: 'machine-repairs',
          element: (
            <RoleGuard permission="machine-repairs">
              <MachineRepairsPage />
            </RoleGuard>
          )
        },
        {
          path: 'machine-payments',
          element: (
            <RoleGuard permission="customer-ledgers">
              <MachinePaymentsPage />
            </RoleGuard>
          )
        },
        {
          path: 'customer-ledgers',
          element: (
            <RoleGuard permission="customer-ledgers">
              <CustomerLedgerPage />
            </RoleGuard>
          )
        },
        {
          path: 'vendor-ledgers',
          element: (
            <RoleGuard permission="vendor-ledgers">
              <VendorLedgerPage />
            </RoleGuard>
          )
        },
        {
          path: 'vendors',
          element: (
            <RoleGuard permission="vendors">
              <VendorsPage />
            </RoleGuard>
          )
        },
        {
          path: 'ledger',
          element: (
            <RoleGuard permission="ledger">
              <UsageLogPage />
            </RoleGuard>
          )
        },
        {
          path: 'factory-invoices',
          element: (
            <RoleGuard permission="store-ledger">
              <FactoryInvoicesPage />
            </RoleGuard>
          )
        },
        {
          path: 'store-payments',
          element: (
            <RoleGuard permission="store-ledger">
              <StorePaymentsPage />
            </RoleGuard>
          )
        },
        {
          path: 'store-ledger',
          element: (
            <RoleGuard permission="store-ledger">
              <StoreLedgerPage />
            </RoleGuard>
          )
        },
        {
          path: 'usage-log',
          element: (
            <RoleGuard permission="ledger">
              <UsageLogPage />
            </RoleGuard>
          )
        },
        {
          path: 'reports',
          element: (
            <RoleGuard permission="reports">
              <ReportsPage />
            </RoleGuard>
          )
        },
        {
          path: 'expenses',
          element: (
            <RoleGuard permission="expenses">
              <ExpensesPage />
            </RoleGuard>
          )
        },
        {
          path: 'backup-restore',
          element: (
            <RoleGuard permission="backup-restore" allowedRoles={['Super Admin']}>
              <BackupRestorePage />
            </RoleGuard>
          )
        },
        {
          path: 'user-management',
          element: (
            <RoleGuard permission="user-management" allowedRoles={['Super Admin']}>
              <UserManagementPage />
            </RoleGuard>
          )
        }
      ]
    },
    {
      path: 'profile',
      element: <ProfilePage />
    },
    {
      path: 'account-settings',
      element: <Navigate to="/profile?section=security" replace />
    },
    {
      path: 'admin',
      children: [
        {
          path: 'users',
          element: (
            <RoleGuard permission="user-management" allowedRoles={['Super Admin']}>
              <UserManagementPage />
            </RoleGuard>
          )
        },
        {
          path: 'security',
          element: (
            <RoleGuard permission="user-management" allowedRoles={['Super Admin']}>
              <AppSecurityPage />
            </RoleGuard>
          )
        }
      ]
    },
    {
      path: 'shop',
      element: <ShopRouteWrapper />,
      children: [
        {
          index: true,
          element: <ShopIndexRoute />
        },
        {
          path: 'dashboard',
          element: (
            <RoleGuard permission="shop-dashboard">
              <ShopDashboardPage />
            </RoleGuard>
          )
        },
        {
          path: 'add-product',
          element: (
            <RoleGuard permission="shop-add-product">
              <ShopAddProductPage />
            </RoleGuard>
          )
        },
        {
          path: 'products',
          element: <Navigate to="/shop/add-product" replace />
        },
        {
          path: 'stock-in',
          element: <Navigate to="/shop/add-product" replace />
        },
        {
          path: 'stock-out',
          element: <Navigate to="/shop/mart" replace />
        },
        {
          path: 'mart',
          element: (
            <RoleGuard permission="shop-mart">
              <ShopMartPage />
            </RoleGuard>
          )
        },
        {
          path: 'ledger',
          element: (
            <RoleGuard permission="shop-ledger">
              <ShopLedgerPage />
            </RoleGuard>
          )
        },
        {
          path: 'invoices',
          element: (
            <RoleGuard permission="shop-invoices">
              <ShopInvoicesPage />
            </RoleGuard>
          )
        },
        {
          path: 'payments',
          element: (
            <RoleGuard permission="shop-ledger">
              <ShopPaymentsPage />
            </RoleGuard>
          )
        }
      ]
    }
  ]
};

export default MainRoutes;
