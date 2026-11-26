import { useState } from 'react';

const safeParseJSON = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const initialAuditLogs = [
  {
    id: 'LOG-1',
    userEmail: 'admin@rehmat.com',
    userName: 'Super Admin',
    userRole: 'Super Admin',
    actionType: 'Stock In',
    details: 'Added Received Stock +10 Pcs SKF Ball Bearing',
    timestamp: new Date(Date.now() - 7200000).toLocaleString()
  }
];

const initialNotifications = [
  {
    id: 'notif-1',
    senderName: 'Store Keeper Ali',
    senderRole: 'Store Keeper',
    title: 'Stock Out Issued',
    message: 'Issued 25x SKF Ball Bearings for Worker Aslam',
    type: 'stock-out',
    timestamp: '10 mins ago',
    read: false
  },
  {
    id: 'notif-2',
    senderName: 'Store Keeper Ali',
    senderRole: 'Store Keeper',
    title: 'Low Stock Reorder Request',
    message: '3HP Electric Motor stock is below 5 units. Please reorder.',
    type: 'alert',
    timestamp: '1 hour ago',
    read: false
  }
];

export function useAuditAndNotifications() {
  const [auditLogs, setAuditLogs] = useState(() => safeParseJSON('rehmat_store_audit_logs', initialAuditLogs));
  const [notifications, setNotifications] = useState(() => safeParseJSON('rehmat_store_notifications_v1', initialNotifications));

  const logActivity = (actionType, details, userOverride = null) => {
    const savedUser = safeParseJSON('factory_store_user', null);
    const activeUser = userOverride || savedUser || { name: 'Admin', email: 'admin@rehmat.com', role: 'Super Admin' };

    const newLog = {
      id: 'LOG-' + Date.now(),
      userEmail: activeUser.email || 'user@rehmat.com',
      userName: activeUser.name || activeUser.email?.split('@')[0] || 'Staff User',
      userRole: activeUser.role || 'Staff',
      actionType,
      details,
      timestamp: new Date().toLocaleString()
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const deleteAuditLog = (id) => {
    setAuditLogs((prev) => prev.filter((l) => l.id !== id));
  };

  const clearAuditLogs = () => {
    setAuditLogs([]);
  };

  const addNotification = ({
    title,
    message,
    type = 'alert',
    senderName = 'Store Keeper Ali',
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
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    auditLogs,
    setAuditLogs,
    logActivity,
    deleteAuditLog,
    clearAuditLogs,
    notifications,
    setNotifications,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  };
}

