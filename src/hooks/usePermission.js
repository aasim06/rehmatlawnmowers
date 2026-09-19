import { useAuth, defaultSuperAdminPermissions, defaultAdminPermissions, defaultStoreKeeperPermissions, getRoleDefaultPermissions } from 'context/AuthContext';

/**
 * ==============================================================================
 * 🔐 usePermission Hook
 * ==============================================================================
 * Central permission and authorization hook for the 3-tier RBAC system:
 * - Super Admin: Full absolute access to all pages, user management & backups.
 * - Admin: Store operational manager with all features EXCEPT user management & backups.
 * - Store Keeper: Floor counter staff restricted to stock in/out & items.
 */
export function usePermission() {
  const { user } = useAuth();

  const role = user?.role || 'Super Admin';
  const isSuperAdmin = role === 'Super Admin';
  const isStoreAdmin = role === 'Admin';
  const isAdmin = role === 'Super Admin' || role === 'Admin';
  const isStoreKeeper = role === 'Store Keeper';

  // Resolve user permissions with fallback to role defaults
  const userPerms = user?.permissions || getRoleDefaultPermissions(role);

  // Permission flags
  const canEditPrice = isSuperAdmin || Boolean(userPerms.canEditPrice);
  const canDelete = isSuperAdmin || Boolean(userPerms.canDelete);
  const canManageUsers = isSuperAdmin || Boolean(userPerms['user-management']);
  const canAccessBackup = isSuperAdmin || Boolean(userPerms['backup-restore']);
  const canResetData = isSuperAdmin && Boolean(userPerms.canResetData);
  const canViewReports = isSuperAdmin || Boolean(userPerms.reports);
  const canViewExpenses = isSuperAdmin || Boolean(userPerms.expenses);
  const canViewLedgers = isSuperAdmin || Boolean(userPerms['vendor-ledgers'] || userPerms['customer-ledgers'] || userPerms.ledger);

  const urlMap = {
    '/dashboard/default': 'dashboard',
    '/inventory/stock-out': 'stock-out',
    '/inventory/stock-in': 'stock-in',
    '/inventory/items': 'items',
    '/inventory/categories': 'categories',
    '/inventory/add-item-name': 'categories',
    '/inventory/bom': 'items',
    '/inventory/machine-sales': 'machine-sales',
    '/inventory/machine-repairs': 'machine-repairs',
    '/inventory/customer-ledgers': 'customer-ledgers',
    '/inventory/vendor-ledgers': 'vendor-ledgers',
    '/inventory/vendors': 'vendors',
    '/inventory/ledger': 'ledger',
    '/inventory/usage-log': 'ledger',
    '/inventory/reports': 'reports',
    '/inventory/expenses': 'expenses',
    '/inventory/backup-restore': 'backup-restore',
    '/admin/users': 'user-management',
    '/inventory/user-management': 'user-management'
  };

  // Check if a specific navigation item (by id or url) is allowed
  const hasAccessToItem = (item) => {
    // Super Admin has zero restrictions anywhere
    if (isSuperAdmin) return true;
    if (!item) return false;

    // Direct role guard: user-management & backup-restore are strictly Super Admin unless explicitly enabled
    if ((item.id === 'user-management' || item.id === 'backup-restore') && !canManageUsers && !canAccessBackup) {
      return false;
    }

    const itemId = item.id || (item.url ? urlMap[item.url] : null);

    // If Store Keeper and trying to access dashboard, check explicit flag
    if (isStoreKeeper && (itemId === 'dashboard' || item.url === '/dashboard/default')) {
      return Boolean(userPerms.dashboard === true);
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

  return {
    role,
    user,
    userPerms,
    isSuperAdmin,
    isStoreAdmin,
    isAdmin,
    isStoreKeeper,
    canEditPrice,
    canDelete,
    canManageUsers,
    canAccessBackup,
    canResetData,
    canViewReports,
    canViewExpenses,
    canViewLedgers,
    hasAccessToItem,
    urlMap
  };
}

export { defaultSuperAdminPermissions, defaultAdminPermissions, defaultStoreKeeperPermissions };
export default usePermission;
