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
import UserManagementPage from 'pages/admin/UserManagementPage';
import Color from 'pages/component-overview/color';
import Typography from 'pages/component-overview/typography';
import Shadow from 'pages/component-overview/shadows';
import SamplePage from 'pages/extra-pages/sample-page';

// layout & auth
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from 'components/ProtectedRoute';

// ==============================|| MAIN ROUTING (ZERO-LATENCY INSTANT NAVIGATION) ||============================== //

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
