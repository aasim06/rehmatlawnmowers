import { useAuth, defaultSuperAdminPermissions, defaultAdminPermissions, defaultStoreKeeperPermissions, getRoleDefaultPermissions } from 'context/AuthContext';

/**
 * ==============================================================================
 * 🔐 usePermission Hook
 * ==============================================================================
 * Central permission and authorization hook for the 3-tier RBAC system:
 * - Master Admin (admin@rehmat.com): Absolute root access to all modules and system controls.
 * - Staff Accounts: Strictly bounded by their individual custom permissions or role defaults.
 */
export function usePermission() {
  const { user } = useAuth();

  const userEmail = (user?.email || '').trim().toLowerCase();
  const isMasterAdmin = userEmail === 'admin@rehmat.com';

  const role = user?.role || (isMasterAdmin ? 'Super Admin' : 'Store Keeper');
  const isSuperAdmin = isMasterAdmin;
  const isStoreAdmin = role === 'Admin';
  const isAdmin = isMasterAdmin || role === 'Admin';
  const isStoreKeeper = role === 'Store Keeper';

  // Resolve user permissions: prioritize explicit custom permissions saved on user object
  const userPerms = user?.permissions && Object.keys(user.permissions).length > 0
    ? user.permissions
    : getRoleDefaultPermissions(role);

  // Permission flags
  const canEditPrice = isMasterAdmin || Boolean(userPerms.canEditPrice);
  const canDelete = isMasterAdmin || Boolean(userPerms.canDelete);
  const canManageUsers = isMasterAdmin || Boolean(userPerms['user-management']);
  const canAccessBackup = isMasterAdmin || Boolean(userPerms['backup-restore']);
  const canResetData = isMasterAdmin && Boolean(userPerms.canResetData);
  const canViewReports = isMasterAdmin || Boolean(userPerms.reports);
  const canViewExpenses = isMasterAdmin || Boolean(userPerms.expenses);
  const canViewLedgers = isMasterAdmin || Boolean(userPerms['vendor-ledgers'] || userPerms['customer-ledgers'] || userPerms.ledger);

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
    // Only the primary Master Super Admin has zero restrictions anywhere
    if (isMasterAdmin) return true;
    if (!item) return false;

    const itemId = item.id || (item.url ? urlMap[item.url] : null);

    // Direct role guard: user-management & backup-restore are strictly for users with explicit permission
    if (itemId === 'user-management' && !canManageUsers) return false;
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
