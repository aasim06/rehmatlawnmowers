import PropTypes from 'prop-types';
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from 'api/supabase';

const AuthContext = createContext();

export const defaultAdminPermissions = {
  'dashboard': true,
  'stock-out': true,
  'stock-in': true,
  'items': true,
  'machine-sales': true,
  'machine-repairs': true,
  'customer-ledgers': true,
  'vendor-ledgers': true,
  'vendors': true,
  'ledger': true,
  'reports': true,
  'backup-restore': true,
  'user-management': true,
  'canEditPrice': true,
  'canDelete': true
};

export const defaultStoreKeeperPermissions = {
  'dashboard': false,
  'stock-out': true,
  'stock-in': false,
  'items': false,
  'machine-sales': false,
  'machine-repairs': false,
  'customer-ledgers': false,
  'vendor-ledgers': false,
  'vendors': false,
  'ledger': false,
  'reports': false,
  'backup-restore': false,
  'user-management': false,
  'canEditPrice': false,
  'canDelete': false
};

const initialStaffUsers = [
  {
    id: 'USR-1',
    name: 'Sabeel (Admin)',
    email: 'admin@rehmat.com',
    password: '123456',
    role: 'Super Admin',
    status: 'Active',
    createdDate: '2026-01-01',
    permissions: defaultAdminPermissions
  },
  {
    id: 'USR-2',
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
        // Ensure every staff user has a permissions object
        return parsed.map((u) => ({
          ...u,
          permissions: u.permissions || (u.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions)
        }));
      }
      return initialStaffUsers;
    } catch (e) {
      return initialStaffUsers;
    }
  });

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('factory_store_user');
    const parsedUser = saved ? JSON.parse(saved) : initialStaffUsers[0];
    return {
      ...parsedUser,
      permissions: parsedUser.permissions || (parsedUser.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions)
    };
  });

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync staffUsers to localStorage
  useEffect(() => {
    localStorage.setItem('rehmat_store_staff_users', JSON.stringify(staffUsers));
  }, [staffUsers]);

  // Sync user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('factory_store_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('factory_store_user');
    }
  }, [user]);

  useEffect(() => {
    // 1. Get initial Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const found = staffUsers.find((u) => u.email.toLowerCase() === session.user.email?.toLowerCase());
        const userData = {
          id: session.user.id,
          name: found?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: found?.role || session.user.user_metadata?.role || 'Super Admin',
          permissions: found?.permissions || (found?.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions)
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
        const userData = {
          id: session.user.id,
          name: found?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email,
          role: found?.role || session.user.user_metadata?.role || 'Super Admin',
          permissions: found?.permissions || (found?.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions)
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
        permissions: localMatch.permissions || (localMatch.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions)
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
          const mockUser = {
            id: 'USR-' + Date.now(),
            name: isStore ? 'Store Keeper Ali' : 'Admin User',
            email: cleanEmail,
            role: isStore ? 'Store Keeper' : 'Super Admin',
            permissions: isStore ? defaultStoreKeeperPermissions : defaultAdminPermissions
          };
          setUser(mockUser);
          setLoading(false);
          return { success: true, user: mockUser };
        }
        setLoading(false);
        return { success: false, error: error.message };
      }

      const userData = {
        id: data.user.id,
        name: data.user.email?.split('@')[0] || 'User',
        email: data.user.email,
        role: data.user.user_metadata?.role || 'Super Admin',
        permissions: defaultAdminPermissions
      };
      setUser(userData);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      if (cleanEmail && password.length >= 4) {
        const isStore = cleanEmail.includes('store') || cleanEmail.includes('keeper');
        const mockUser = {
          id: 'USR-' + Date.now(),
          name: isStore ? 'Store Keeper Ali' : 'Admin User',
          email: cleanEmail,
          role: isStore ? 'Store Keeper' : 'Super Admin',
          permissions: isStore ? defaultStoreKeeperPermissions : defaultAdminPermissions
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
    const isKeeper = newUser.role === 'Store Keeper';
    const created = {
      id: 'USR-' + Date.now(),
      name: newUser.name,
      email: newUser.email,
      password: newUser.password || '123456',
      role: newUser.role || 'Store Keeper',
      status: 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      permissions: isKeeper ? { ...defaultStoreKeeperPermissions } : { ...defaultAdminPermissions }
    };
    setStaffUsers((prev) => [created, ...prev]);
    return created;
  };

  const deleteStaffUser = (id) => {
    setStaffUsers((prev) => prev.filter((u) => u.id !== id));
  };

  const updateStaffUser = (id, updatedFields) => {
    setStaffUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updatedFields };
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

  // Switch Active User / Role helper
  const switchUserRole = (targetRoleOrUser) => {
    if (typeof targetRoleOrUser === 'object') {
      const perms = targetRoleOrUser.permissions || (targetRoleOrUser.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions);
      setUser({ ...targetRoleOrUser, permissions: perms });
    } else {
      const match = staffUsers.find((u) => u.role === targetRoleOrUser);
      if (match) {
        setUser(match);
      } else {
        const isKeeper = targetRoleOrUser === 'Store Keeper';
        setUser({
          id: 'USR-' + Date.now(),
          name: isKeeper ? 'Store Keeper Ali' : 'Admin User',
          email: isKeeper ? 'storekeeper@rehmat.com' : 'admin@rehmat.com',
          role: targetRoleOrUser,
          permissions: isKeeper ? defaultStoreKeeperPermissions : defaultAdminPermissions
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
