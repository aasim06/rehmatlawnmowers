// direct imports for instantaneous 0ms page switching
import DashboardDefault from 'pages/dashboard/default';
import ItemsPage from 'pages/inventory/ItemsPage';
import AddItemNamePage from 'pages/inventory/AddItemNamePage';
import StockInPage from 'pages/inventory/StockInPage';
import StockOutPage from 'pages/inventory/StockOutPage';
import VendorsPage from 'pages/inventory/VendorsPage';
import MachineSalesPage from 'pages/inventory/MachineSalesPage';
import MachineRepairsPage from 'pages/inventory/MachineRepairsPage';
import CategoriesPage from 'pages/inventory/CategoriesPage';
import UsageLogPage from 'pages/inventory/UsageLogPage';
import ReportsPage from 'pages/inventory/ReportsPage';
import MachineBOMPage from 'pages/inventory/MachineBOMPage';
import CustomerLedgerPage from 'pages/inventory/CustomerLedgerPage';
import VendorLedgerPage from 'pages/inventory/VendorLedgerPage';
import BackupRestorePage from 'pages/inventory/BackupRestorePage';
import ExpensesPage from 'pages/inventory/ExpensesPage';
import UserManagementPage from 'pages/admin/UserManagementPage';
import AppSecurityPage from 'pages/admin/AppSecurityPage';
import ShopRouteWrapper from 'pages/shop/ShopRouteWrapper';
import ShopDashboardPage from 'pages/shop/ShopDashboardPage';
import ShopAddProductPage from 'pages/shop/ShopAddProductPage';
import ShopMartPage from 'pages/shop/ShopMartPage';
import ShopLedgerPage from 'pages/shop/ShopLedgerPage';
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
  if (hasAccessToItem({ id: 'ledger' })) return <Navigate to="/inventory/ledger" replace />;
  if (hasAccessToItem({ id: 'reports' })) return <Navigate to="/inventory/reports" replace />;

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
          path: 'machine-sales',
          element: (
            <RoleGuard permission="machine-sales">
              <MachineSalesPage />
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
          element: <Navigate to="/shop/dashboard" replace />
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
        }
      ]
    }
  ]
};

export default MainRoutes;


