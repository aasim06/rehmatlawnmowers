import { useAuth, defaultAdminPermissions, defaultStoreKeeperPermissions } from 'context/AuthContext';

export function usePermission() {
  const { user } = useAuth();

  const role = user?.role || 'Super Admin';
  const isSuperAdmin = role === 'Super Admin';
  const isStoreKeeper = role === 'Store Keeper';

  const userPerms = user?.permissions || (isSuperAdmin ? defaultAdminPermissions : defaultStoreKeeperPermissions);

  // Permission flags (falling back to userPerms or role default)
  const canEditPrice = isSuperAdmin || Boolean(userPerms.canEditPrice);
  const canDelete = isSuperAdmin || Boolean(userPerms.canDelete);
  const canManageUsers = isSuperAdmin || Boolean(userPerms['user-management']);
  const canViewReports = isSuperAdmin || Boolean(userPerms.reports);
  const canViewLedgers = isSuperAdmin || Boolean(userPerms['vendor-ledgers'] || userPerms['customer-ledgers']);

  // Check if a specific navigation item (by id or url) is allowed
  const hasAccessToItem = (item) => {
    if (isSuperAdmin) return true;
    if (!item) return false;

    const itemId = item.id || (item.url ? urlMap[item.url] : null);
    if (isStoreKeeper && (itemId === 'dashboard' || item.url === '/dashboard/default')) {
      return Boolean(userPerms.dashboard === true && userPerms.adminAllowedDashboard);
    }

    // Check by item ID (e.g. 'stock-out', 'stock-in', 'items', 'machine-sales')
    if (item.id && userPerms[item.id] !== undefined) {
      return Boolean(userPerms[item.id]);
    }

    // URL mapping fallback
    const permKey = urlMap[item.url || item];
    if (permKey && userPerms[permKey] !== undefined) {
      return Boolean(userPerms[permKey]);
    }

    return false;
  };

  const urlMap = {
    '/dashboard/default': 'dashboard',
    '/inventory/stock-out': 'stock-out',
    '/inventory/stock-in': 'stock-in',
    '/inventory/items': 'items',
    '/inventory/machine-sales': 'machine-sales',
    '/inventory/machine-repairs': 'machine-repairs',
    '/inventory/customer-ledgers': 'customer-ledgers',
    '/inventory/vendor-ledgers': 'vendor-ledgers',
    '/inventory/vendors': 'vendors',
    '/inventory/ledger': 'ledger',
    '/inventory/reports': 'reports',
    '/inventory/backup-restore': 'backup-restore',
    '/admin/users': 'user-management'
  };

  return {
    role,
    user,
    userPerms,
    isSuperAdmin,
    isStoreKeeper,
    canEditPrice,
    canDelete,
    canManageUsers,
    canViewReports,
    canViewLedgers,
    hasAccessToItem
  };
}

export default usePermission;
