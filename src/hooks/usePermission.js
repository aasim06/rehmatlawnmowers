import { useAuth, defaultSuperAdminPermissions, defaultAdminPermissions, defaultStoreKeeperPermissions, getRoleDefaultPermissions } from 'context/AuthContext';
import { isTauriApp } from 'utils/platform';

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
  const userPerms = (user?.permissions && Object.keys(user.permissions).length > 0)
    ? user.permissions
    : (getRoleDefaultPermissions(role) || {});

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
    '/inventory/security': 'user-management',
    '/shop/dashboard': 'shop-dashboard',
    '/shop/add-product': 'shop-add-product',
    '/shop/stock-in': 'shop-add-product',
    '/shop/stock-out': 'shop-mart',
    '/shop/mart': 'shop-mart',
    '/shop/ledger': 'shop-ledger'
  };

  // Check if a specific navigation item (by id or url) is allowed
  const hasAccessToItem = (item) => {
    if (!item) return false;

    const itemId = item.id || (item.url ? urlMap[item.url] : null);

    // 🔒 REMOTE SOFTWARE BLOCK & LICENSE CONTROL:
    // Strictly available ONLY on the Web Administration URL (Vercel).
    // NEVER available inside the Desktop (.exe) application under any circumstances.
    if (itemId === 'app-security' || item.url === '/admin/security' || item.url === '/inventory/security') {
      if (isTauriApp()) return false;
      return isSuperAdmin;
    }

    // 1. Root developer/system admin has unrestricted access
    if (isMasterAdmin) return true;

    // 2. Direct role guard: user-management, backup-restore are strictly for authorized users
    if (itemId === 'user-management' && !canManageUsers) return false;
    if (itemId === 'backup-restore' && !canAccessBackup) return false;

    // 3. Strict Check: If this item is explicitly disabled in user's permissions, ALWAYS deny access
    if (itemId && userPerms[itemId] === false) {
      return false;
    }
    const permKey = urlMap[item.url || item];
    if (permKey && userPerms[permKey] === false) {
      return false;
    }

    // 4. Strict Check: If this item is explicitly enabled in user's permissions, ALWAYS allow access
    if (itemId && userPerms[itemId] === true) {
      return true;
    }
    if (permKey && userPerms[permKey] === true) {
      return true;
    }

    // 5. Super Admin role general fallback (if not explicitly disabled above)
    if (isSuperAdmin) return true;

    // 6. Shop management parent folder: allow if any child module is permitted
    if (itemId === 'shop-management') {
      return Boolean(
        userPerms['shop-dashboard'] ||
        userPerms['shop-mart'] ||
        userPerms['shop-add-product'] ||
        userPerms['shop-ledger']
      );
    }

    // 7. By default, individual shop items must be enabled in userPerms
    if (itemId === 'shop-dashboard' || itemId === 'shop-add-product' || itemId === 'shop-mart' || itemId === 'shop-ledger') {
      return Boolean(userPerms[itemId]);
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
