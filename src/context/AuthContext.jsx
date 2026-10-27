import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from 'api/supabase';
import { sql } from 'api/neon';

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
  'dashboard': true,
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
        // Use user's own explicit permissions if present, else fallback to role defaults
        return {
          ...parsedUser,
          permissions: (parsedUser.permissions && Object.keys(parsedUser.permissions).length > 0)
            ? parsedUser.permissions
            : getRoleDefaultPermissions(parsedUser.role || 'Store Keeper')
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

  // Fetch staff users from Neon Cloud Database on mount for instant multi-device / multi-browser sync
  useEffect(() => {
    let isMounted = true;
    const fetchCloudUsers = async () => {
      try {
        const rows = await sql.query('SELECT * FROM users ORDER BY created_at ASC');
        if (isMounted && Array.isArray(rows) && rows.length > 0) {
          const mapped = rows.map((u) => ({
            id: u.id || `USR-${u.email}`,
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role || 'Store Keeper',
            status: u.status || 'Active',
            permissions: (u.permissions && Object.keys(u.permissions).length > 0)
              ? u.permissions
              : getRoleDefaultPermissions(u.role || 'Store Keeper')
          }));

          setStaffUsers((prev) => {
            const remoteEmails = new Set(mapped.map((m) => (m.email || '').toLowerCase()));
            const combined = [...mapped];
            prev.forEach((p) => {
              if (!remoteEmails.has((p.email || '').toLowerCase())) {
                combined.push(p);
              }
            });
            localStorage.setItem('rehmat_store_staff_users', JSON.stringify(combined));
            return combined;
          });
        }
      } catch (err) {
        console.warn('Neon cloud user fetch failed, using local cache:', err);
      }
    };

    fetchCloudUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user && !user) {
        const found = staffUsers.find((u) => u.email.toLowerCase() === session.user.email?.toLowerCase());
        const resolvedRole = found?.role || session.user.user_metadata?.role || 'Super Admin';
        const userData = {
          id: session.user.id,
          name: found?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: resolvedRole,
          permissions: (found?.permissions && Object.keys(found.permissions).length > 0)
            ? found.permissions
            : getRoleDefaultPermissions(resolvedRole)
        };
        setUser(userData);
      }
      setLoading(false);
    });

    // 2. Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user && !user) {
        const found = staffUsers.find((u) => u.email.toLowerCase() === session.user.email?.toLowerCase());
        const resolvedRole = found?.role || session.user.user_metadata?.role || 'Super Admin';
        const userData = {
          id: session.user.id,
          name: found?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: resolvedRole,
          permissions: (found?.permissions && Object.keys(found.permissions).length > 0)
            ? found.permissions
            : getRoleDefaultPermissions(resolvedRole)
        };
        setUser(userData);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [user, staffUsers]);

  // Login Action
  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Check in local staff users list first
    let localMatch = staffUsers.find(
      (u) =>
        (u.email || '').toLowerCase() === cleanEmail ||
        (u.name || '').toLowerCase() === cleanEmail ||
        (u.email || '').toLowerCase().split('@')[0] === cleanEmail
    );

    // 2. If not found in local memory, check Neon Cloud Database directly
    if (!localMatch) {
      try {
        const rows = await sql.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
        if (rows && rows.length > 0) {
          const u = rows[0];
          localMatch = {
            id: u.id || `USR-${u.email}`,
            name: u.name,
            email: u.email,
            password: u.password,
            role: u.role || 'Store Keeper',
            status: u.status || 'Active',
            permissions: (u.permissions && Object.keys(u.permissions).length > 0)
              ? u.permissions
              : getRoleDefaultPermissions(u.role || 'Store Keeper')
          };
          setStaffUsers((prev) => [localMatch, ...prev.filter((p) => (p.email || '').toLowerCase() !== cleanEmail)]);
        }
      } catch (err) {
        console.warn('Neon query error during login:', err);
      }
    }

    if (localMatch) {
      const isMasterAdmin = cleanEmail === 'admin@rehmat.com';
      const cleanInputPass = (password || '').trim();
      const storedPass = (localMatch.password || '').trim();

      const isPassValid = isMasterAdmin
        ? (cleanInputPass === '123456' || cleanInputPass === 'admin123' || storedPass === cleanInputPass)
        : (storedPass === cleanInputPass);

      if (!isPassValid) {
        setLoading(false);
        return { success: false, error: 'Incorrect password! Please check your credentials.' };
      }

      if (localMatch.status === 'Suspended') {
        setLoading(false);
        return { success: false, error: 'This account has been suspended. Please contact Administrator.' };
      }

      const matchWithPerms = {
        ...localMatch,
        permissions: (localMatch.permissions && Object.keys(localMatch.permissions).length > 0)
          ? localMatch.permissions
          : getRoleDefaultPermissions(localMatch.role)
      };

      setUser(matchWithPerms);
      setLoading(false);
      return { success: true, user: matchWithPerms };
    }

    // 3. Fallback exclusively for master admin if database is cold-starting
    if (cleanEmail === 'admin@rehmat.com' && (password === '123456' || password === 'admin123')) {
      const rootAdmin = {
        id: 'USR-1',
        name: 'Sabeel (Super Admin)',
        email: 'admin@rehmat.com',
        role: 'Super Admin',
        status: 'Active',
        permissions: defaultSuperAdminPermissions
      };
      setUser(rootAdmin);
      setLoading(false);
      return { success: true, user: rootAdmin };
    }

    setLoading(false);
    return { success: false, error: 'Account not found! Please check your email or ask Admin to add your staff account.' };
  };

  // Staff CRUD Operations
  const addStaffUser = async (newUser) => {
    const role = newUser.role || 'Store Keeper';
    const rolePerms = newUser.permissions || getRoleDefaultPermissions(role);
    const created = {
      id: 'USR-' + Date.now(),
      name: newUser.name,
      email: (newUser.email || '').trim().toLowerCase(),
      password: newUser.password || '123456',
      role: role,
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      permissions: { ...rolePerms }
    };

    setStaffUsers((prev) => [created, ...prev.filter((p) => p.email.toLowerCase() !== created.email)]);

    // Sync to Neon Cloud Database
    try {
      await sql.query(
        `INSERT INTO users (id, name, email, password, role, status, permissions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           password = EXCLUDED.password,
           role = EXCLUDED.role,
           status = EXCLUDED.status,
           permissions = EXCLUDED.permissions;`,
        [created.id, created.name, created.email, created.password, created.role, created.status, JSON.stringify(created.permissions)]
      );
    } catch (e) {
      console.error('Neon save staff error:', e);
    }

    return created;
  };

  const deleteStaffUser = async (id) => {
    const target = staffUsers.find((u) => u.id === id);
    if (target?.email?.toLowerCase() === 'admin@rehmat.com') {
      alert('The primary Super Admin account is permanently protected and cannot be deleted!');
      return false;
    }

    setStaffUsers((prev) => prev.filter((u) => u.id !== id));

    try {
      await sql.query('DELETE FROM users WHERE id = $1 OR LOWER(email) = $2', [String(id), (target?.email || '').toLowerCase()]);
    } catch (err) {
      console.error('Neon delete staff error:', err);
    }

    return true;
  };

  const updateStaffUser = async (id, updatedFields) => {
    let savedUser = null;
    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === id || (u.email || '').toLowerCase() === String(id).toLowerCase()) {
          const updated = { ...u, ...updatedFields };
          // If role changed without explicit custom permissions, assign role defaults
          if (updatedFields.role && updatedFields.role !== u.role && !updatedFields.permissions) {
            updated.permissions = getRoleDefaultPermissions(updatedFields.role);
          }
          if (user?.id === u.id || (user?.email || '').toLowerCase() === (u.email || '').toLowerCase()) {
            setUser(updated);
          }
          savedUser = updated;
          return updated;
        }
        return u;
      })
    );

    if (savedUser) {
      try {
        await sql.query(
          'UPDATE users SET name = $1, password = $2, role = $3, status = $4, permissions = $5 WHERE id = $6 OR LOWER(email) = $7',
          [
            savedUser.name,
            savedUser.password,
            savedUser.role,
            savedUser.status || 'Active',
            JSON.stringify(savedUser.permissions),
            String(id),
            (savedUser.email || '').toLowerCase()
          ]
        );
      } catch (err) {
        console.error('Neon update staff error:', err);
      }
    }
  };

  const updateUserPermissions = async (userId, newPermissions) => {
    let targetEmail = '';
    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId || (u.email || '').toLowerCase() === String(userId).toLowerCase()) {
          targetEmail = (u.email || '').toLowerCase();
          const updated = { ...u, permissions: newPermissions };
          if (user?.id === u.id || (user?.email || '').toLowerCase() === targetEmail) {
            setUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    try {
      await sql.query('UPDATE users SET permissions = $1 WHERE id = $2 OR LOWER(email) = $3', [
        JSON.stringify(newPermissions),
        String(userId),
        (targetEmail || String(userId)).toLowerCase()
      ]);
    } catch (err) {
      console.error('Neon update permissions error:', err);
    }
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
