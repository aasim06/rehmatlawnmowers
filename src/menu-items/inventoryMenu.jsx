// assets
import {
  DashboardOutlined,
  DatabaseOutlined,
  ImportOutlined,
  ExportOutlined,
  TeamOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ToolOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  BookOutlined,
  PayCircleOutlined,
  ShopOutlined,
  CloudSyncOutlined,
  WalletOutlined,
  LockOutlined,
  ShoppingOutlined,
  PlusSquareOutlined
} from '@ant-design/icons';

const icons = {
  DashboardOutlined,
  DatabaseOutlined,
  ImportOutlined,
  ExportOutlined,
  TeamOutlined,
  AppstoreOutlined,
  HistoryOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ToolOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  BookOutlined,
  PayCircleOutlined,
  ShopOutlined,
  CloudSyncOutlined,
  WalletOutlined,
  LockOutlined,
  ShoppingOutlined,
  PlusSquareOutlined
};

// ==============================|| 1. FACTORY STORE INVENTORY ||============================== //
export const factoryStoreGroup = {
  id: 'group-factory-store',
  title: 'Factory Store',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'items',
      title: 'Store Items',
      type: 'item',
      url: '/inventory/items',
      icon: icons.DatabaseOutlined
    },
    {
      id: 'add-item-name',
      title: 'Item Names (Directory)',
      type: 'item',
      url: '/inventory/add-item-name',
      icon: icons.PlusSquareOutlined
    },
    {
      id: 'categories',
      title: 'Categories',
      type: 'item',
      url: '/inventory/categories',
      icon: icons.AppstoreOutlined
    },
    {
      id: 'stock-in',
      title: 'Stock In',
      type: 'item',
      url: '/inventory/stock-in',
      icon: icons.ImportOutlined
    },
    {
      id: 'stock-out',
      title: 'Stock Out',
      type: 'item',
      url: '/inventory/stock-out',
      icon: icons.ExportOutlined
    },
    {
      id: 'factory-invoices',
      title: 'Factory Invoices',
      type: 'item',
      url: '/inventory/factory-invoices',
      icon: icons.FileTextOutlined
    },
    {
      id: 'store-payments',
      title: 'Store Payments',
      type: 'item',
      url: '/inventory/store-payments',
      icon: icons.WalletOutlined
    },
    {
      id: 'store-ledger',
      title: 'Store Party Ledger',
      type: 'item',
      url: '/inventory/store-ledger',
      icon: icons.BookOutlined
    },
    {
      id: 'ledger',
      title: 'Store History & Ledger',
      type: 'item',
      url: '/inventory/ledger',
      icon: icons.HistoryOutlined
    }
  ]
};

// ==============================|| 2. MACHINE PRODUCTION & ASSEMBLY ||============================== //
export const machineGroup = {
  id: 'group-machines',
  title: 'Machine Production',
  type: 'group',
  children: [
    {
      id: 'machine-dashboard',
      title: 'Machine Dashboard',
      type: 'item',
      url: '/inventory/machine-dashboard',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'machine-sales',
      title: 'Machine Sales',
      type: 'item',
      url: '/inventory/machine-sales',
      icon: icons.ShoppingCartOutlined
    },
    {
      id: 'machine-invoices',
      title: 'Machine Invoices',
      type: 'item',
      url: '/inventory/machine-invoices',
      icon: icons.FileTextOutlined
    },
    {
      id: 'machine-repairs',
      title: 'Machine Repairing',
      type: 'item',
      url: '/inventory/machine-repairs',
      icon: icons.BuildOutlined
    },
    {
      id: 'machine-payments',
      title: 'Machine Payments',
      type: 'item',
      url: '/inventory/machine-payments',
      icon: icons.WalletOutlined
    },
    {
      id: 'customer-ledgers',
      title: 'Machine Customer Ledgers',
      type: 'item',
      url: '/inventory/customer-ledgers',
      icon: icons.BookOutlined
    }
  ]
};

// ==============================|| 3. RETAIL SHOP MART ||============================== //
export const shopGroup = {
  id: 'group-shop',
  title: 'Retail Shop Mart',
  type: 'group',
  children: [
    {
      id: 'shop-dashboard',
      title: 'Shop Dashboard',
      type: 'item',
      url: '/shop/dashboard',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'shop-add-product',
      title: 'Add Product',
      type: 'item',
      url: '/shop/add-product',
      icon: icons.PlusSquareOutlined
    },
    {
      id: 'shop-mart',
      title: 'Shop Mart',
      type: 'item',
      url: '/shop/mart',
      icon: icons.ShopOutlined
    },
    {
      id: 'shop-invoices',
      title: 'Shop Invoices',
      type: 'item',
      url: '/shop/invoices',
      icon: icons.FileTextOutlined
    },
    {
      id: 'shop-payments',
      title: 'Shop Payments',
      type: 'item',
      url: '/shop/payments',
      icon: icons.WalletOutlined
    },
    {
      id: 'shop-ledger',
      title: 'Shop Customer Ledger',
      type: 'item',
      url: '/shop/ledger',
      icon: icons.BookOutlined
    }
  ]
};

// ==============================|| 4. ACCOUNTS & FINANCE ||============================== //
export const accountsGroup = {
  id: 'group-accounts',
  title: 'Accounts & Finance',
  type: 'group',
  children: [
    {
      id: 'expenses',
      title: 'Daily Expenses',
      type: 'item',
      url: '/inventory/expenses',
      icon: icons.WalletOutlined
    },
    {
      id: 'vendor-ledgers',
      title: 'Vendor Payables',
      type: 'item',
      url: '/inventory/vendor-ledgers',
      icon: icons.PayCircleOutlined
    },
    {
      id: 'vendors',
      title: 'Vendors & Suppliers',
      type: 'item',
      url: '/inventory/vendors',
      icon: icons.TeamOutlined
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      type: 'item',
      url: '/inventory/reports',
      icon: icons.BarChartOutlined
    }
  ]
};

// ==============================|| 5. SYSTEM & ADMINISTRATION ||============================== //
export const adminGroup = {
  id: 'group-admin',
  title: 'Administration',
  type: 'group',
  children: [
    {
      id: 'user-management',
      title: 'User Management & Logs',
      type: 'item',
      url: '/admin/users',
      icon: icons.SafetyCertificateOutlined
    },
    {
      id: 'backup-restore',
      title: 'Data Backup & Restore',
      type: 'item',
      url: '/inventory/backup-restore',
      icon: icons.CloudSyncOutlined
    },
    {
      id: 'app-security',
      title: 'Remote License & Security',
      type: 'item',
      url: '/admin/security',
      icon: icons.LockOutlined
    }
  ]
};

// Backward-compatible default export
export default factoryStoreGroup;
