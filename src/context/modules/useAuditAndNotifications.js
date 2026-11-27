import { useState, useCallback } from 'react';
import { db, CLOUD_SYNC_ENABLED, setDoc, deleteDoc, getDocs } from 'api/firebase';
import { collection, doc } from 'firebase/firestore';

const STORAGE_KEYS = {
  auditLogs: 'rehmat_store_audit_logs',
  notifications: 'rehmat_store_notifications_v1',
  deletedAuditLogs: 'rehmat_deleted_audit_log_ids'
};

const safeParseJSON = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const persistJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`LocalStorage write warning (${key}):`, e);
  }
};

const getCurrentActiveUser = () => {
  try {
    const active = sessionStorage.getItem('rehmat_erp_active_user');
    if (active) return JSON.parse(active);
  } catch {}
  return safeParseJSON('factory_store_user', null);
};

export function useAuditAndNotifications() {
  const [auditLogs, setAuditLogs] = useState(() => safeParseJSON(STORAGE_KEYS.auditLogs, []));
  const [notifications, setNotifications] = useState(() => safeParseJSON(STORAGE_KEYS.notifications, []));

  const logActivity = (actionType, details, userOverride = null) => {
    const activeUser = userOverride || getCurrentActiveUser() || { name: 'Admin', email: 'admin@rehmat.com', role: 'Super Admin' };

    const logId = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newLog = {
      id: logId,
      userEmail: activeUser.email || 'user@rehmat.com',
      userName: activeUser.name || activeUser.email?.split('@')[0] || 'Staff User',
      userRole: activeUser.role || 'Staff',
      actionType,
      details,
      timestamp: new Date().toLocaleString(),
      createdAt: new Date().toISOString()
    };

    setAuditLogs((prev) => {
      const updated = [newLog, ...prev].slice(0, 250);
      persistJSON(STORAGE_KEYS.auditLogs, updated);
      return updated;
    });

    if (typeof navigator === 'undefined' || navigator.onLine) {
      setDoc(doc(db, 'audit_logs', logId), newLog, { merge: true }).catch(() => {});
    }
  };

  const deleteAuditLog = (id) => {
    const strId = String(id);
    const deleted = safeParseJSON(STORAGE_KEYS.deletedAuditLogs, []);
    persistJSON(STORAGE_KEYS.deletedAuditLogs, Array.from(new Set([...deleted, strId])));
    setAuditLogs((prev) => {
      const updated = prev.filter((l) => String(l.id) !== strId);
      persistJSON(STORAGE_KEYS.auditLogs, updated);
      return updated;
    });
    deleteDoc(doc(db, 'audit_logs', strId)).catch(() => {});
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
    persistJSON(STORAGE_KEYS.auditLogs, []);
  };

  const syncAuditLogsFromCloud = useCallback(async () => {
    if (!CLOUD_SYNC_ENABLED || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    try {
      const snap = await getDocs(collection(db, 'audit_logs'));
      if (!snap?.docs) return;
      const deletedSet = new Set(safeParseJSON(STORAGE_KEYS.deletedAuditLogs, []).map(String));
      const remoteLogs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((l) => !deletedSet.has(String(l.id)))
        .sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0))
        .slice(0, 250);

      if (remoteLogs.length > 0 || !snap.metadata?.fromCache) {
        setAuditLogs(remoteLogs);
        persistJSON(STORAGE_KEYS.auditLogs, remoteLogs);
      }
    } catch {}
  }, []);

  const addNotification = ({
    title,
    message,
    type = 'alert',
    senderName = 'Store Keeper',
    senderRole = 'Store Keeper'
  }) => {
    const newNotif = {
      id: 'notif-' + Date.now(),
      senderName,
      senderRole,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, 50);
      persistJSON(STORAGE_KEYS.notifications, updated);
      return updated;
    });
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      persistJSON(STORAGE_KEYS.notifications, updated);
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persistJSON(STORAGE_KEYS.notifications, updated);
      return updated;
    });
  };

  const clearNotifications = () => {
    setNotifications([]);
    persistJSON(STORAGE_KEYS.notifications, []);
  };

  return {
    auditLogs,
    setAuditLogs,
    logActivity,
    deleteAuditLog,
    clearAuditLogs,
    syncAuditLogsFromCloud,
    notifications,
    setNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  };
}
