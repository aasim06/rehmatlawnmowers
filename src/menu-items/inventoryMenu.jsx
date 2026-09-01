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
  CloudSyncOutlined
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
  CloudSyncOutlined
};

// ==============================|| MENU ITEMS - FACTORY STORE INVENTORY ||============================== //

const inventoryMenu = {
  id: 'group-inventory',
  title: 'Store Inventory',
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
      title: 'Items',
      type: 'item',
      url: '/inventory/items',
      icon: icons.DatabaseOutlined
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
      id: 'machine-management',
      title: 'Machine Management',
      type: 'collapse',
      icon: icons.SettingOutlined,
      children: [
        {
          id: 'machine-sales',
          title: 'Machine Sales',
          type: 'item',
          url: '/inventory/machine-sales',
          icon: icons.ShoppingCartOutlined
        },
        {
          id: 'machine-repairs',
          title: 'Machine Repairing',
          type: 'item',
          url: '/inventory/machine-repairs',
          icon: icons.BuildOutlined
        },
        {
          id: 'customer-ledgers',
          title: 'Machine Ledgers',
          type: 'item',
          url: '/inventory/customer-ledgers',
          icon: icons.BookOutlined
        }
      ]
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
      title: 'Vendors & Parties',
      type: 'item',
      url: '/inventory/vendors',
      icon: icons.ShopOutlined
    },
    {
      id: 'ledger',
      title: 'Store Ledger & History',
      type: 'item',
      url: '/inventory/ledger',
      icon: icons.HistoryOutlined
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      type: 'item',
      url: '/inventory/reports',
      icon: icons.BarChartOutlined
    },
    {
      id: 'backup-restore',
      title: 'Data Backup & Restore',
      type: 'item',
      url: '/inventory/backup-restore',
      icon: icons.CloudSyncOutlined
    },
    {
      id: 'user-management',
      title: 'User Management & Logs',
      type: 'item',
      url: '/admin/users',
      icon: icons.SafetyCertificateOutlined
    }
  ]
};

export default inventoryMenu;
