import { useAuth, defaultSuperAdminPermissions, defaultAdminPermissions, defaultStoreKeeperPermissions, getRoleDefaultPermissions } from 'context/AuthContext';

/**
 * ==============================================================================
 * 🔐 usePermission Hook
 * ==============================================================================
 * Central permission and authorization hook for the 3-tier RBAC system:
 * - Master Admin (admin@rehmat.com) / Super Admin: Absolute root access to all modules and system controls.
 * - Staff Accounts: Strictly bounded by their individual custom permissions or role defaults.
 */
export function usePermission() {
  const { user } = useAuth();

  const userEmail = (user?.email || '').trim().toLowerCase();
  const isMasterAdmin = userEmail === 'admin@rehmat.com';

  const role = user?.role || (isMasterAdmin ? 'Super Admin' : 'Store Keeper');
  const isSuperAdmin = isMasterAdmin || role === 'Super Admin';
  const isStoreAdmin = role === 'Admin';
  const isAdmin = isSuperAdmin || role === 'Admin';
  const isStoreKeeper = role === 'Store Keeper';

  // Resolve user permissions: prioritize explicit custom permissions saved on user object
  const userPerms = user?.permissions && Object.keys(user.permissions).length > 0
    ? user.permissions
    : getRoleDefaultPermissions(role);

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
    '/inventory/user-management': 'user-management',
    '/admin/security': 'user-management',
    '/inventory/security': 'user-management'
  };

  // Check if a specific navigation item (by id or url) is allowed
  const hasAccessToItem = (item) => {
    // Super Admin has zero restrictions anywhere
    if (isSuperAdmin) return true;
    if (!item) return false;

    const itemId = item.id || (item.url ? urlMap[item.url] : null);

    // Direct role guard: user-management, backup-restore, app-security are strictly for authorized users
    if ((itemId === 'user-management' || itemId === 'app-security') && !canManageUsers) return false;
    if (itemId === 'backup-restore' && !canAccessBackup) return false;

    // Check by item ID (e.g. 'stock-out', 'stock-in', 'items', 'machine-sales', 'dashboard')
    if (itemId && userPerms[itemId] !== undefined) {
      return Boolean(userPerms[itemId]);
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
    isMasterAdmin,
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
