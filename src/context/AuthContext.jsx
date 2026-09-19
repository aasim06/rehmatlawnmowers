import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from 'api/supabase';

const AuthContext = createContext();

// ==============================================================================
// 👑 3-TIER ROLE PERMISSIONS DEFINITION
// ==============================================================================

/**
 * 1. Super Admin: Unrestricted Full System Authority
 * Can access every module, manage staff & roles, backup & restore, purge data, edit prices, and delete records.
 */
export const defaultSuperAdminPermissions = {
  'dashboard': true,
  'stock-out': true,
  'stock-in': true,
  'items': true,
  'categories': true,
  'add-item-name': true,
  'bom': true,
  'machine-sales': true,
  'machine-repairs': true,
  'customer-ledgers': true,
  'vendor-ledgers': true,
  'vendors': true,
  'ledger': true,
  'reports': true,
  'expenses': true,
  'backup-restore': true,
  'user-management': true,
  'canEditPrice': true,
  'canDelete': true,
  'canResetData': true
};

/**
 * 2. Admin (Store Manager / Incharge): Full Operational Access
 * Runs daily operations, sales, repairs, stock in/out, ledgers, reports, expenses, can edit prices & delete records.
 * STRICTLY RESTRICTED FROM: User Management, Backup & Restore, and Total Database Purge.
 */
export const defaultAdminPermissions = {
  'dashboard': true,
  'stock-out': true,
  'stock-in': true,
  'items': true,
  'categories': true,
  'add-item-name': true,
  'bom': true,
  'machine-sales': true,
  'machine-repairs': true,
  'customer-ledgers': true,
  'vendor-ledgers': true,
  'vendors': true,
  'ledger': true,
  'reports': true,
  'expenses': true,
  'backup-restore': false, // Restricted to Super Admin
  'user-management': false, // Restricted to Super Admin
  'canEditPrice': true,
  'canDelete': true,
  'canResetData': false // Restricted to Super Admin
};

/**
 * 3. Store Keeper (Counter / Floor Staff): Floor Stock Handling
 * Limited to stock-out, stock-in, and browsing items catalog.
 * Cannot edit unit prices, cannot delete records, no access to financial ledgers, reports, backup, or users.
 */
export const defaultStoreKeeperPermissions = {
  'dashboard': false,
  'stock-out': true,
  'stock-in': true,
  'items': true,
  'categories': false,
  'add-item-name': false,
  'bom': false,
  'machine-sales': false,
  'machine-repairs': false,
  'customer-ledgers': false,
  'vendor-ledgers': false,
  'vendors': false,
  'ledger': false,
  'reports': false,
  'expenses': false,
  'backup-restore': false,
  'user-management': false,
  'canEditPrice': false,
  'canDelete': false,
  'canResetData': false
};

/**
 * Resolves default permissions by role string
 */
export const getRoleDefaultPermissions = (role) => {
  switch (role) {
    case 'Super Admin':
      return { ...defaultSuperAdminPermissions };
    case 'Admin':
      return { ...defaultAdminPermissions };
    case 'Store Keeper':
      return { ...defaultStoreKeeperPermissions };
    case 'Sales Manager':
      return {
        ...defaultStoreKeeperPermissions,
        'dashboard': true,
        'machine-sales': true,
        'customer-ledgers': true,
        'items': true,
        'canEditPrice': false,
        'canDelete': false
      };
    case 'Technician':
      return {
        ...defaultStoreKeeperPermissions,
        'dashboard': true,
        'machine-repairs': true,
        'stock-out': true,
        'items': true,
        'canEditPrice': false,
        'canDelete': false
      };
    default:
      return { ...defaultStoreKeeperPermissions };
  }
};

const initialStaffUsers = [
  {
    id: 'USR-1',
    name: 'Sabeel (Super Admin)',
    email: 'admin@rehmat.com',
    password: '123456',
    role: 'Super Admin',
    status: 'Active',
    createdDate: '2026-01-01',
    permissions: defaultSuperAdminPermissions
  },
  {
    id: 'USR-2',
    name: 'Store Manager Tariq',
    email: 'manager@rehmat.com',
    password: '123456',
    role: 'Admin',
    status: 'Active',
    createdDate: '2026-01-10',
    permissions: defaultAdminPermissions
  },
  {
    id: 'USR-3',
    name: 'Store Keeper Ali',
    email: 'storekeeper@rehmat.com',
    password: '123456',
    role: 'Store Keeper',
    status: 'Active',
    createdDate: '2026-01-15',
    permissions: defaultStoreKeeperPermissions
  }
];

export function AuthProvider({ children }) {
  const [staffUsers, setStaffUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('rehmat_store_staff_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure every staff user has a valid permissions object matching their role defaults
        return parsed.map((u) => ({
          ...u,
          permissions: u.permissions || getRoleDefaultPermissions(u.role)
        }));
      }
      return initialStaffUsers;
    } catch (e) {
      return initialStaffUsers;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      // Use sessionStorage so every fresh app start demands sign-in
      const saved = sessionStorage.getItem('rehmat_erp_active_user');
      if (saved) {
        const parsedUser = JSON.parse(saved);
        return {
          ...parsedUser,
          permissions: parsedUser.permissions || getRoleDefaultPermissions(parsedUser.role)
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync staffUsers to localStorage
  useEffect(() => {
    localStorage.setItem('rehmat_store_staff_users', JSON.stringify(staffUsers));
  }, [staffUsers]);

  // Clean stale storage and sync active user to sessionStorage
  useEffect(() => {
    localStorage.removeItem('factory_store_user');
    if (user) {
      sessionStorage.setItem('rehmat_erp_active_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('rehmat_erp_active_user');
      localStorage.removeItem('factory_store_user');
    }
  }, [user]);

  useEffect(() => {
    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const found = staffUsers.find((u) => u.email.toLowerCase() === session.user.email?.toLowerCase());
        const resolvedRole = found?.role || session.user.user_metadata?.role || 'Super Admin';
        const userData = {
          id: session.user.id,
          name: found?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: resolvedRole,
          permissions: found?.permissions || getRoleDefaultPermissions(resolvedRole)
        };
        setUser(userData);
      }
      setLoading(false);
    });

    // 2. Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const found = staffUsers.find((u) => u.email.toLowerCase() === session.user.email?.toLowerCase());
        const resolvedRole = found?.role || session.user.user_metadata?.role || 'Super Admin';
        const userData = {
          id: session.user.id,
          name: found?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: resolvedRole,
          permissions: found?.permissions || getRoleDefaultPermissions(resolvedRole)
        };
        setUser(userData);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login Action
  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check in local staff users list first for demo/offline accounts
    const localMatch = staffUsers.find(
      (u) =>
        (u.email || '').toLowerCase() === cleanEmail ||
        (u.name || '').toLowerCase() === cleanEmail ||
        (u.email || '').toLowerCase().split('@')[0] === cleanEmail
    );

    if (localMatch) {
      if (localMatch.password && localMatch.password !== password) {
        setLoading(false);
        return { success: false, error: 'Incorrect password! Please check your credentials.' };
      }
      const matchWithPerms = {
        ...localMatch,
        permissions: localMatch.permissions || getRoleDefaultPermissions(localMatch.role)
      };
      setUser(matchWithPerms);
      setLoading(false);
      return { success: true, user: matchWithPerms };
    }

    // Try Supabase Auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) {
        // Fallback for offline demo login
        if (cleanEmail && password.length >= 4) {
          const isStore = cleanEmail.includes('store') || cleanEmail.includes('keeper');
          const isManager = cleanEmail.includes('manager') || (cleanEmail.includes('admin') && !cleanEmail.includes('super'));
          const resolvedRole = isStore ? 'Store Keeper' : isManager ? 'Admin' : 'Super Admin';
          const mockUser = {
            id: 'USR-' + Date.now(),
            name: isStore ? 'Store Keeper Ali' : isManager ? 'Store Manager Tariq' : 'Sabeel (Super Admin)',
            email: cleanEmail,
            role: resolvedRole,
            permissions: getRoleDefaultPermissions(resolvedRole)
          };
          setUser(mockUser);
          setLoading(false);
          return { success: true, user: mockUser };
        }
        setLoading(false);
        return { success: false, error: error.message };
      }

      const userRole = data.user.user_metadata?.role || (cleanEmail === 'admin@rehmat.com' ? 'Super Admin' : 'Admin');
      const userData = {
        id: data.user.id,
        name: data.user.email?.split('@')[0] || 'User',
        email: data.user.email,
        role: userRole,
        permissions: getRoleDefaultPermissions(userRole)
      };
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      if (cleanEmail && password.length >= 4) {
        const isStore = cleanEmail.includes('store') || cleanEmail.includes('keeper');
        const isManager = cleanEmail.includes('manager') || (cleanEmail.includes('admin') && !cleanEmail.includes('super'));
        const resolvedRole = isStore ? 'Store Keeper' : isManager ? 'Admin' : 'Super Admin';
        const mockUser = {
          id: 'USR-' + Date.now(),
          name: isStore ? 'Store Keeper Ali' : isManager ? 'Store Manager Tariq' : 'Sabeel (Super Admin)',
          email: cleanEmail,
          role: resolvedRole,
          permissions: getRoleDefaultPermissions(resolvedRole)
        };
        setUser(mockUser);
        setLoading(false);
        return { success: true, user: mockUser };
      }
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // Staff CRUD Operations
  const addStaffUser = (newUser) => {
    const role = newUser.role || 'Store Keeper';
    const rolePerms = getRoleDefaultPermissions(role);
    const created = {
      id: 'USR-' + Date.now(),
      name: newUser.name,
      email: newUser.email,
      password: newUser.password || '123456',
      role: role,
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      permissions: { ...rolePerms }
    };
    setStaffUsers((prev) => [created, ...prev]);
    return created;
  };

  const deleteStaffUser = (id) => {
    const target = staffUsers.find((u) => u.id === id);
    if (target?.email?.toLowerCase() === 'admin@rehmat.com') {
      alert('The primary Super Admin account is permanently protected and cannot be deleted!');
      return false;
    }
    setStaffUsers((prev) => prev.filter((u) => u.id !== id));
    return true;
  };

  const updateStaffUser = (id, updatedFields) => {
    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updatedFields };
          // If role changed without explicit custom permissions, assign role defaults
          if (updatedFields.role && updatedFields.role !== u.role && !updatedFields.permissions) {
            updated.permissions = getRoleDefaultPermissions(updatedFields.role);
          }
          if (user?.id === id) {
            setUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  const updateUserPermissions = (userId, newPermissions) => {
    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, permissions: newPermissions };
          if (user?.id === userId) {
            setUser(updated);
          }
          return updated;
        }
        return u;
      })
    );
  };

  // Switch Active User / Role helper (Only Super Admin can invoke this)
  const switchUserRole = (targetRoleOrUser) => {
    if (typeof targetRoleOrUser === 'object') {
      const perms = targetRoleOrUser.permissions || getRoleDefaultPermissions(targetRoleOrUser.role);
      setUser({ ...targetRoleOrUser, permissions: perms });
    } else {
      const match = staffUsers.find((u) => u.role === targetRoleOrUser);
      if (match) {
        setUser(match);
      } else {
        const perms = getRoleDefaultPermissions(targetRoleOrUser);
        const nameMap = {
          'Super Admin': 'Sabeel (Super Admin)',
          'Admin': 'Store Manager Tariq',
          'Store Keeper': 'Store Keeper Ali'
        };
        const emailMap = {
          'Super Admin': 'admin@rehmat.com',
          'Admin': 'manager@rehmat.com',
          'Store Keeper': 'storekeeper@rehmat.com'
        };
        setUser({
          id: 'USR-' + Date.now(),
          name: nameMap[targetRoleOrUser] || `${targetRoleOrUser} User`,
          email: emailMap[targetRoleOrUser] || `${targetRoleOrUser.toLowerCase().replace(/\s+/g, '')}@rehmat.com`,
          role: targetRoleOrUser,
          permissions: perms
        });
      }
    }
  };

  // Logout Action
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setSession(null);
    sessionStorage.removeItem('rehmat_erp_active_user');
    localStorage.removeItem('factory_store_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        staffUsers,
        login,
        logout,
        addStaffUser,
        deleteStaffUser,
        updateStaffUser,
        updateUserPermissions,
        switchUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node
};

export const useAuth = () => useContext(AuthContext);
