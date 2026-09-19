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
import Color from 'pages/component-overview/color';
import Typography from 'pages/component-overview/typography';
import Shadow from 'pages/component-overview/shadows';
import SamplePage from 'pages/extra-pages/sample-page';

// layout, auth & RBAC guards
import DashboardLayout from 'layout/Dashboard';
import ProtectedRoute from 'components/ProtectedRoute';
import RoleGuard from 'components/RoleGuard';

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
      path: '/',
      element: (
        <RoleGuard permission="dashboard">
          <DashboardDefault />
        </RoleGuard>
      )
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
