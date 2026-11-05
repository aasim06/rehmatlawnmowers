import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import usePermission from 'hooks/usePermission';

/**
 * ==============================================================================
 * RoleGuard Component
 * ==============================================================================
 * Route-level & component-level access gatekeeper.
 * Ensures users without appropriate roles or permission flags cannot access
 * unauthorized views via direct URL typing or client navigation.
 *
 * When access is denied, smoothly redirects the user to their permitted module
 * rather than showing a blocking error screen.
 */
export default function RoleGuard({ permission, allowedRoles, children, fallback }) {
  const location = useLocation();
  const { role, userPerms, isMasterAdmin, isSuperAdmin } = usePermission();

  // Helper to find the first route the user actually has permission to visit
  const getAllowedRedirectPath = () => {
    // 1. Factory Store Modules
    if (userPerms?.['stock-in']) return '/inventory/stock-in';
    if (userPerms?.['stock-out']) return '/inventory/stock-out';
    if (userPerms?.['items']) return '/inventory/items';
    if (userPerms?.['categories']) return '/inventory/categories';
    if (userPerms?.['machine-sales']) return '/inventory/machine-sales';
    if (userPerms?.['machine-repairs']) return '/inventory/machine-repairs';
    if (userPerms?.['ledger']) return '/inventory/ledger';
    if (userPerms?.['reports']) return '/inventory/reports';
    if (userPerms?.['expenses']) return '/inventory/expenses';
    if (userPerms?.['vendors']) return '/inventory/vendors';

    // 2. Shop Modules
    if (userPerms?.['shop-dashboard']) return '/shop/dashboard';
    if (userPerms?.['shop-mart']) return '/shop/mart';
    if (userPerms?.['shop-stock-in']) return '/shop/stock-in';
    if (userPerms?.['shop-stock-out']) return '/shop/stock-out';
    if (userPerms?.['shop-add-product']) return '/shop/add-product';
    if (userPerms?.['shop-ledger']) return '/shop/ledger';

    if (userPerms?.['dashboard']) return '/dashboard/default';

    return '/login';
  };

  const handleDenial = () => {
    if (fallback !== undefined) return fallback;
    const targetPath = getAllowedRedirectPath();
    if (location.pathname !== targetPath) {
      return <Navigate to={targetPath} replace />;
    }
    return null;
  };

  // 1. Primary Root Developer/Master Admin has unrestricted access everywhere
  if (isMasterAdmin) {
    return children;
  }

  // 2. Explicitly disabled permission must ALWAYS be blocked
  if (permission && userPerms && userPerms[permission] === false) {
    return handleDenial();
  }

  // 3. Super Admin bypass (if not explicitly disabled above)
  if (isSuperAdmin) {
    return children;
  }

  // 4. Check Module Permission Flag if specified
  if (permission) {
    if (permission.startsWith('shop-')) {
      if (userPerms && userPerms[permission] === false) {
        return handleDenial();
      }
    } else if (!userPerms || !userPerms[permission]) {
      return handleDenial();
    }
  }

  // 5. Check Role-level whitelist if specified
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) {
      return handleDenial();
    }
  }

  // Access granted
  return children;
}

RoleGuard.propTypes = {
  permission: PropTypes.string,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node
};
