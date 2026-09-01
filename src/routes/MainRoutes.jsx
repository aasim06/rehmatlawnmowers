import { lazy } from 'react';

// project imports
import Loadable from 'components/Loadable';
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from 'components/ProtectedRoute';

// render - Dashboard
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/default')));

// render - Inventory Store Pages
const ItemsPage = Loadable(lazy(() => import('pages/inventory/ItemsPage')));
const AddItemNamePage = Loadable(lazy(() => import('pages/inventory/AddItemNamePage')));
const StockInPage = Loadable(lazy(() => import('pages/inventory/StockInPage')));
const StockOutPage = Loadable(lazy(() => import('pages/inventory/StockOutPage')));
const VendorsPage = Loadable(lazy(() => import('pages/inventory/VendorsPage')));
const MachineSalesPage = Loadable(lazy(() => import('pages/inventory/MachineSalesPage')));
const MachineRepairsPage = Loadable(lazy(() => import('pages/inventory/MachineRepairsPage')));
const CategoriesPage = Loadable(lazy(() => import('pages/inventory/CategoriesPage')));
const UsageLogPage = Loadable(lazy(() => import('pages/inventory/UsageLogPage')));
const ReportsPage = Loadable(lazy(() => import('pages/inventory/ReportsPage')));
const MachineBOMPage = Loadable(lazy(() => import('pages/inventory/MachineBOMPage')));
const CustomerLedgerPage = Loadable(lazy(() => import('pages/inventory/CustomerLedgerPage')));
const VendorLedgerPage = Loadable(lazy(() => import('pages/inventory/VendorLedgerPage')));
const BackupRestorePage = Loadable(lazy(() => import('pages/inventory/BackupRestorePage')));
const UserManagementPage = Loadable(lazy(() => import('pages/admin/UserManagementPage')));

// render - Overview Utilities
const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'inventory',
      children: [
        {
          path: 'items',
          element: <ItemsPage />
        },
        {
          path: 'add-item-name',
          element: <AddItemNamePage />
        },
        {
          path: 'stock-in',
          element: <StockInPage />
        },
        {
          path: 'stock-out',
          element: <StockOutPage />
        },
        {
          path: 'bom',
          element: <MachineBOMPage />
        },
        {
          path: 'machine-sales',
          element: <MachineSalesPage />
        },
        {
          path: 'machine-repairs',
          element: <MachineRepairsPage />
        },
        {
          path: 'customer-ledgers',
          element: <CustomerLedgerPage />
        },
        {
          path: 'vendor-ledgers',
          element: <VendorLedgerPage />
        },
        {
          path: 'vendors',
          element: <VendorsPage />
        },
        {
          path: 'ledger',
          element: <UsageLogPage />
        },
        {
          path: 'usage-log',
          element: <UsageLogPage />
        },
        {
          path: 'reports',
          element: <ReportsPage />
        },
        {
          path: 'backup-restore',
          element: <BackupRestorePage />
        },
        {
          path: 'user-management',
          element: <UserManagementPage />
        }
      ]
    },
    {
      path: 'admin',
      children: [
        {
          path: 'users',
          element: <UserManagementPage />
        }
      ]
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    }
  ]
};

export default MainRoutes;
