import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { isTauriApp } from 'utils/platform';
import {
  useAuth,
  defaultSuperAdminPermissions,
  defaultAdminPermissions,
  defaultStoreKeeperPermissions,
  getRoleDefaultPermissions
} from 'context/AuthContext';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tooltip
} from '@mui/material';

// icons
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ControlOutlined,
  CloseOutlined,
  LockOutlined,
  CrownOutlined,
  TeamOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';
import { AppButton, MasterKpiGrid } from 'components/common';
import { getCardSurfaceSx, getSubSurfaceSx, getToneColors } from 'utils/themeSurface';

const MODULE_GROUPS = [
  {
    id: 'factory-store',
    title: 'Factory Store',
    description: 'Inventory, stock in / out and store ledger',
    accentLight: '#2563eb',
    accentDark: '#60a5fa',
    headerBgLight: '#eff6ff',
    headerBgDark: 'rgba(37, 99, 235, 0.14)',
    pages: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'items', label: 'Store Items' },
      { key: 'add-item-name', label: 'Item Names (Directory)' },
      { key: 'categories', label: 'Categories' },
      { key: 'stock-in', label: 'Stock In' },
      { key: 'stock-out', label: 'Stock Out' },
      { key: 'store-ledger', syncKeys: ['store-payments'], label: 'Store Payments & Party Ledger' },
      { key: 'ledger', label: 'Store History & Ledger' }
    ]
  },
  {
    id: 'machine-production',
    title: 'Machine Production',
    description: 'Machine sales, repairs & customer accounts',
    accentLight: '#d97706',
    accentDark: '#fbbf24',
    headerBgLight: '#fffbeb',
    headerBgDark: 'rgba(217, 119, 6, 0.14)',
    pages: [
      { key: 'machine-dashboard', label: 'Machine Dashboard' },
      { key: 'machine-sales', label: 'Machine Sales' },
      { key: 'machine-invoices', label: 'Machine Invoices' },
      { key: 'machine-repairs', label: 'Machine Repairing' },
      { key: 'machine-payments', label: 'Machine Payments' },
      { key: 'customer-ledgers', label: 'Machine Customer Ledgers' }
    ]
  },
  {
    id: 'retail-shop',
    title: 'Retail Shop Mart',
    description: 'POS counter, products and shop billing',
    accentLight: '#059669',
    accentDark: '#34d399',
    headerBgLight: '#ecfdf5',
    headerBgDark: 'rgba(5, 150, 105, 0.14)',
    pages: [
      { key: 'shop-dashboard', label: 'Shop Dashboard' },
      { key: 'shop-add-product', label: 'Add Product' },
      { key: 'shop-mart', label: 'Shop Mart (POS Counter)' },
      { key: 'shop-invoices', label: 'Shop Invoices' },
      { key: 'shop-payments', label: 'Shop Payments' },
      { key: 'shop-ledger', label: 'Shop Customer Ledger' }
    ]
  },
  {
    id: 'accounts-finance',
    title: 'Accounts & Finance',
    description: 'Expenses, vendors and business reports',
    accentLight: '#7c3aed',
    accentDark: '#a78bfa',
    headerBgLight: '#f5f3ff',
    headerBgDark: 'rgba(124, 58, 237, 0.14)',
    pages: [
      { key: 'expenses', label: 'Daily Expenses' },
      { key: 'vendor-ledgers', label: 'Vendor Payables' },
      { key: 'vendors', label: 'Vendors & Suppliers' },
      { key: 'reports', label: 'Reports & Analytics' }
    ]
  }
];

const MODULE_LIST = MODULE_GROUPS.flatMap((group) => group.pages);

const PRESET_OPTIONS = [
  { key: 'strict', label: 'Strict Keeper' },
  { key: 'fullKeeper', label: 'Standard Keeper' },
  { key: 'admin', label: 'Store Admin' },
  { key: 'superAdmin', label: 'Super Admin' }
];

const buildAllGroupKeys = (enabled) => {
  const next = {};
  MODULE_GROUPS.forEach((group) => {
    group.pages.forEach((p) => {
      next[p.key] = enabled;
      (p.syncKeys || []).forEach((sk) => {
        next[sk] = enabled;
      });
    });
  });
  return next;
};

const getPresetPermissions = (presetType) => {
  if (presetType === 'strict') {
    return {
      ...defaultStoreKeeperPermissions,
      ...buildAllGroupKeys(false),
      'stock-out': true,
      canEditPrice: false,
      canDelete: false
    };
  }
  if (presetType === 'fullKeeper') {
    return {
      ...defaultStoreKeeperPermissions,
      ...buildAllGroupKeys(false),
      dashboard: true,
      items: true,
      'add-item-name': true,
      categories: true,
      'stock-in': true,
      'stock-out': true,
      'store-ledger': true,
      'store-payments': true,
      ledger: true,
      'shop-dashboard': true,
      'shop-add-product': true,
      'shop-mart': true,
      'shop-ledger': true,
      expenses: true,
      canEditPrice: false,
      canDelete: false
    };
  }
  if (presetType === 'admin') {
    return {
      ...defaultAdminPermissions,
      ...buildAllGroupKeys(true),
      'user-management': false,
      'backup-restore': false,
      canResetData: false
    };
  }
  return {
    ...defaultSuperAdminPermissions,
    ...buildAllGroupKeys(true)
  };
};

export default function UserManagementPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const primaryTone = getToneColors(theme, 'primary');

  const { staffUsers = [], addStaffUser, deleteStaffUser, updateStaffUser, updateUserPermissions } = useAuth();
  const { auditLogs = [] } = useStoreInventory();

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [logSearchTerm, setLogSearchTerm] = useState('');

  // Staff Pagination State
  const [staffPage, setStaffPage] = useState(0);
  const [staffRowsPerPage, setStaffRowsPerPage] = useState(10);

  // Audit Logs Pagination State
  const [auditPage, setAuditPage] = useState(0);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(10);

  useEffect(() => {
    setStaffPage(0);
  }, [searchTerm, roleFilter]);

  useEffect(() => {
    setAuditPage(0);
  }, [logSearchTerm]);

  // Add Staff Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Store Keeper'
  });

  // Edit Staff Drawer
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);

  // Manage Toggles Drawer
  const [permsDrawerOpen, setPermsDrawerOpen] = useState(false);
  const [targetStaffPerms, setTargetStaffPerms] = useState(null);
  const [tempPerms, setTempPerms] = useState({});

  // Delete Staff Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Key metrics for executive stats
  const totalStaff = staffUsers.length;
  const superAdminCount = staffUsers.filter((u) => u.role === 'Super Admin').length;
  const adminCount = staffUsers.filter((u) => u.role === 'Admin').length;
  const storeKeeperCount = staffUsers.filter((u) => u.role === 'Store Keeper').length;
  const auditLogsCount = auditLogs.length;

  // Filtered staff list
  const filteredStaff = staffUsers.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Filtered audit logs
  const filteredAuditLogs = auditLogs.filter(
    (l) =>
      (l.userName || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      (l.userEmail || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      (l.actionType || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
      (l.details || '').toLowerCase().includes(logSearchTerm.toLowerCase())
  );

  const handleCreateStaff = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;

    addStaffUser(form);
    setForm({ name: '', email: '', password: '', role: 'Store Keeper' });
    setDrawerOpen(false);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    await updateStaffUser(editingStaff.id, editingStaff);
    setEditDrawerOpen(false);
    setEditingStaff(null);
  };

  const handleOpenPerms = (staff) => {
    setTargetStaffPerms(staff);
    const existing = staff.permissions || getRoleDefaultPermissions(staff.role);
    setTempPerms({ ...existing });
    setPermsDrawerOpen(true);
  };

  const handleTogglePerm = (pageObj) => {
    const key = typeof pageObj === 'string' ? pageObj : pageObj.key;
    const syncKeys = typeof pageObj === 'string' ? [] : pageObj.syncKeys || [];
    setTempPerms((prev) => {
      const nextVal = !prev[key];
      const next = { ...prev, [key]: nextVal };
      syncKeys.forEach((sk) => {
        next[sk] = nextVal;
      });
      return next;
    });
  };

  const handleToggleModuleGroup = (group) => {
    const anyEnabled = group.pages.some((p) => Boolean(tempPerms[p.key]));
    const nextVal = !anyEnabled;
    setTempPerms((prev) => {
      const next = { ...prev };
      group.pages.forEach((p) => {
        next[p.key] = nextVal;
        (p.syncKeys || []).forEach((sk) => {
          next[sk] = nextVal;
        });
      });
      return next;
    });
  };

  const handleSavePerms = () => {
    if (targetStaffPerms) {
      updateUserPermissions(targetStaffPerms.id, tempPerms);
      setPermsDrawerOpen(false);
      setTargetStaffPerms(null);
    }
  };

  const handlePresetPreset = (presetType) => {
    setTempPerms(getPresetPermissions(presetType));
  };

  const activePresetKey =
    PRESET_OPTIONS.find((preset) => {
      const target = getPresetPermissions(preset.key);
      return (
        MODULE_LIST.every((p) => Boolean(tempPerms[p.key]) === Boolean(target[p.key])) &&
        Boolean(tempPerms['user-management']) === Boolean(target['user-management'])
      );
    })?.key || '';

  const handleConfirmDeleteStaff = () => {
    if (staffToDelete) {
      deleteStaffUser(staffToDelete.id);
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const getRoleToneKey = (role) => {
    if (role === 'Super Admin') return 'primary';
    if (role === 'Admin') return 'info';
    if (role === 'Store Keeper') return 'warning';
    return 'neutral';
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Super Admin':
        return <Chip label="Super Admin" color="primary" variant="light" size="small" />;
      case 'Admin':
        return <Chip label="Admin (Manager)" color="info" variant="light" size="small" />;
      case 'Store Keeper':
        return <Chip label="Store Keeper" color="warning" variant="light" size="small" />;
      default:
        return <Chip label={role} color="secondary" variant="light" size="small" />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pb: 4 }}>
      {/* 1. Executive Page Header Card (TailAdmin Style) */}
      <Paper elevation={0} sx={{ ...getCardSurfaceSx(theme), p: { xs: 2, sm: 2.75 } }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', lg: 'center' },
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: primaryTone.bg,
                color: primaryTone.main,
                border: '1px solid',
                borderColor: primaryTone.border,
                fontSize: '1.35rem',
                flexShrink: 0
              }}
            >
              <SafetyCertificateOutlined />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h4" fontWeight={700} sx={{ letterSpacing: '-0.015em', color: 'text.primary' }}>
                  Staff & Access Control
                </Typography>
                <Chip label="RBAC Security" size="small" color="primary" variant="light" />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                Manage staff credentials, configure role access privileges, and review audit trail logs.
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: { xs: 'flex-start', lg: 'flex-end' },
              flexWrap: 'wrap',
              gap: 1.25,
              width: { xs: '100%', lg: 'auto' }
            }}
          >
            {!isTauriApp() && (
              <AppButton intent="danger-outlined" startIcon={<LockOutlined />} component={Link} to="/admin/security">
                Remote App Control
              </AppButton>
            )}

            <AppButton intent="primary" startIcon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
              Add Staff Member
            </AppButton>
          </Box>
        </Box>
      </Paper>

      {/* 2. Executive Stat Cards (Shared TailAdmin MasterKpiGrid) */}
      <MasterKpiGrid
        kpis={[
          {
            label: 'Total Staff Accounts',
            value: totalStaff.toLocaleString(),
            helper: totalStaff === 1 ? '1 active account' : `${totalStaff} active registered accounts`,
            icon: <TeamOutlined />,
            tone: 'primary'
          },
          {
            label: 'Admins & Managers',
            value: (superAdminCount + adminCount).toLocaleString(),
            helper: `${superAdminCount} Super Admin • ${adminCount} Admin`,
            icon: <CrownOutlined />,
            tone: 'info'
          },
          {
            label: 'Store Keepers',
            value: storeKeeperCount.toLocaleString(),
            helper: 'Counter & Inventory operators',
            icon: <UserOutlined />,
            tone: 'success'
          },
          {
            label: 'Security Audit Logs',
            value: auditLogsCount.toLocaleString(),
            helper: 'Recorded actions & events',
            icon: <HistoryOutlined />,
            tone: 'warning'
          }
        ]}
      />

      {/* 3. Main Data Card: Staff List & Audit Logs */}
      <MainCard content={false} sx={{ overflow: 'hidden', mt: -0.5 }}>
        <Box sx={{ px: 2.5, pt: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
            <Tab icon={<UserOutlined />} iconPosition="start" label={`Staff Users (${staffUsers.length})`} sx={{ fontWeight: 600 }} />
            <Tab
              icon={<HistoryOutlined />}
              iconPosition="start"
              label={`Immutable Audit Logs (${auditLogs.length})`}
              sx={{ fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        {/* TAB 0: STAFF USERS LIST */}
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={2} alignItems="center" sx={{ p: 2.5 }}>
              <Grid size={{ xs: 12, sm: 6, md: 5 }}>
                <OutlinedInput
                  fullWidth
                  size="small"
                  placeholder="Search staff by Name, Email or Role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  }
                  sx={{ height: 38 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControl size="small" fullWidth sx={{ '& .MuiOutlinedInput-root': { height: 38 } }}>
                  <Select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    displayEmpty
                    renderValue={(selected) => (selected === 'All' ? 'Filter: All Roles' : `Role: ${selected}`)}
                  >
                    <MenuItem value="All">All Roles ({staffUsers.length})</MenuItem>
                    <MenuItem value="Super Admin">Super Admin ({superAdminCount})</MenuItem>
                    <MenuItem value="Admin">Admin ({adminCount})</MenuItem>
                    <MenuItem value="Store Keeper">Store Keeper ({storeKeeperCount})</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid
                size={{ xs: 12, md: 4 }}
                sx={{
                  display: 'flex',
                  justifyContent: { xs: 'flex-start', md: 'flex-end' },
                  alignItems: 'center',
                  gap: 1.5
                }}
              >
                <Chip
                  label={`${filteredStaff.length} of ${staffUsers.length} staff displayed`}
                  size="small"
                  variant="light"
                  color="secondary"
                />
                <AppButton
                  size="small"
                  intent="primary"
                  startIcon={<PlusOutlined />}
                  onClick={() => setDrawerOpen(true)}
                  sx={{ display: { xs: 'inline-flex', md: 'none' } }}
                >
                  Add Staff
                </AppButton>
              </Grid>
            </Grid>

            {/* Mobile Summary Cards for Staff Users (xs & sm) */}
            <Box sx={{ display: { xs: 'block', md: 'none' }, px: 2.5, pb: 2.5 }}>
              {filteredStaff.length === 0 ? (
                <Paper elevation={0} sx={{ ...getSubSurfaceSx(theme), p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No staff users found.
                  </Typography>
                </Paper>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredStaff.map((staff) => {
                    const perms = staff.permissions || getRoleDefaultPermissions(staff.role);
                    const enabledCount = MODULE_LIST.filter((m) => Boolean(perms[m.key])).length;
                    const isProtected = staff.email?.toLowerCase() === 'admin@rehmat.com';
                    const roleTone = getToneColors(theme, getRoleToneKey(staff.role));

                    return (
                      <Paper
                        key={staff.id}
                        elevation={0}
                        sx={{
                          ...getCardSurfaceSx(theme),
                          borderRadius: 3,
                          p: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            {getRoleBadge(staff.role)}
                            <Chip
                              icon={<CheckCircleOutlined />}
                              label={staff.status || 'Active'}
                              color="success"
                              variant="light"
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor: roleTone.bg,
                                color: roleTone.main,
                                border: '1px solid',
                                borderColor: roleTone.border,
                                fontSize: '0.85rem',
                                fontWeight: 700
                              }}
                            >
                              {(staff.name || 'U').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700}>
                                {staff.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {staff.email}
                              </Typography>
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              ...getSubSurfaceSx(theme),
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              p: 1.25,
                              borderRadius: 2
                            }}
                          >
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                              ENABLED MODULES:
                            </Typography>
                            <Chip
                              label={`${enabledCount} Modules ON`}
                              color={enabledCount > 5 ? 'success' : 'secondary'}
                              variant="light"
                              size="small"
                            />
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, pt: 0.5 }}>
                            <AppButton
                              size="small"
                              intent="secondary"
                              fullWidth
                              startIcon={<ControlOutlined />}
                              onClick={() => handleOpenPerms(staff)}
                            >
                              Toggle Access
                            </AppButton>
                            <IconButton
                              color="primary"
                              size="small"
                              onClick={() => {
                                setEditingStaff(staff);
                                setEditDrawerOpen(true);
                              }}
                            >
                              <EditOutlined />
                            </IconButton>
                            {isProtected ? (
                              <Tooltip title="Primary Super Admin is Protected">
                                <span>
                                  <IconButton size="small" disabled>
                                    <LockOutlined />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <IconButton
                                color="error"
                                size="small"
                                onClick={() => {
                                  setStaffToDelete(staff);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <DeleteOutlined />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Staff Table (Visible on md and up) */}
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>STAFF MEMBER</TableCell>
                      <TableCell>ROLE</TableCell>
                      <TableCell align="center">ENABLED MODULES (TOGGLES)</TableCell>
                      <TableCell align="center">STATUS</TableCell>
                      <TableCell align="center">ACTIONS & PERMISSIONS</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                          <Typography variant="body2" color="text.secondary">
                            No staff users found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.slice(staffPage * staffRowsPerPage, staffPage * staffRowsPerPage + staffRowsPerPage).map((staff) => {
                        const perms = staff.permissions || getRoleDefaultPermissions(staff.role);
                        const enabledCount = MODULE_LIST.filter((m) => Boolean(perms[m.key])).length;
                        const isProtected = staff.email?.toLowerCase() === 'admin@rehmat.com';
                        const roleTone = getToneColors(theme, getRoleToneKey(staff.role));

                        return (
                          <TableRow key={staff.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: roleTone.bg,
                                    color: roleTone.main,
                                    border: '1px solid',
                                    borderColor: roleTone.border,
                                    fontSize: '0.85rem',
                                    fontWeight: 700
                                  }}
                                >
                                  {(staff.name || 'U').charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                                    {staff.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {staff.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>

                            <TableCell>{getRoleBadge(staff.role)}</TableCell>

                            <TableCell align="center">
                              <Chip
                                label={`${enabledCount} Modules Active`}
                                color={enabledCount > 5 ? 'success' : 'secondary'}
                                variant="light"
                                size="small"
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                icon={<CheckCircleOutlined />}
                                label={staff.status || 'Active'}
                                color="success"
                                variant="light"
                                size="small"
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                <AppButton
                                  size="small"
                                  intent="secondary"
                                  startIcon={<ControlOutlined />}
                                  onClick={() => handleOpenPerms(staff)}
                                >
                                  Toggle Access
                                </AppButton>

                                <Tooltip title="Edit Staff User">
                                  <IconButton
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                      setEditingStaff(staff);
                                      setEditDrawerOpen(true);
                                    }}
                                  >
                                    <EditOutlined />
                                  </IconButton>
                                </Tooltip>

                                {isProtected ? (
                                  <Tooltip title="Primary Super Admin is Protected">
                                    <span>
                                      <IconButton size="small" disabled>
                                        <LockOutlined />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Delete Account">
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => {
                                        setStaffToDelete(staff);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <DeleteOutlined />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={filteredStaff.length}
                rowsPerPage={staffRowsPerPage}
                page={staffPage}
                onPageChange={(e, p) => setStaffPage(p)}
                onRowsPerPageChange={(e) => {
                  setStaffRowsPerPage(parseInt(e.target.value, 10));
                  setStaffPage(0);
                }}
                sx={{ borderTop: '1px solid', borderColor: 'divider' }}
              />
            </Box>
          </Box>
        )}

        {/* TAB 1: ACTIVITY AUDIT LOGS (IMMUTABLE & TAMPER-PROOF) */}
        {activeTab === 1 && (
          <Box>
            <Grid container spacing={2} alignItems="center" sx={{ p: 2.5 }}>
              <Grid size={{ xs: 12, sm: 7 }}>
                <OutlinedInput
                  fullWidth
                  size="small"
                  placeholder="Search Audit Logs by User, Action, or Details..."
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  }
                  sx={{ height: 38 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Chip icon={<LockOutlined />} label="Immutable Audit Trail (Tamper-Proof)" color="success" variant="light" />
              </Grid>
            </Grid>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>TIMESTAMP</TableCell>
                    <TableCell>USER / ROLE</TableCell>
                    <TableCell>ACTION TYPE</TableCell>
                    <TableCell>DETAILS</TableCell>
                    <TableCell align="center">STATUS</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAuditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                        <Typography variant="body2" color="text.secondary">
                          No audit activity logs recorded.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAuditLogs.slice(auditPage * auditRowsPerPage, auditPage * auditRowsPerPage + auditRowsPerPage).map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            {log.timestamp}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {log.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {log.userEmail} ({log.userRole})
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={log.actionType}
                            color={
                              log.actionType.includes('Stock Out')
                                ? 'error'
                                : log.actionType.includes('Stock In')
                                  ? 'success'
                                  : log.actionType.includes('Sale')
                                    ? 'primary'
                                    : 'info'
                            }
                            variant="light"
                            size="small"
                          />
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2">{log.details}</Typography>
                        </TableCell>

                        <TableCell align="center">
                          <Tooltip title="Activity audit logs are permanently locked and cannot be deleted or modified.">
                            <Chip
                              icon={<LockOutlined style={{ fontSize: '0.75rem' }} />}
                              label="Locked"
                              size="small"
                              variant="light"
                              color="secondary"
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={filteredAuditLogs.length}
              rowsPerPage={auditRowsPerPage}
              page={auditPage}
              onPageChange={(e, p) => setAuditPage(p)}
              onRowsPerPageChange={(e) => {
                setAuditRowsPerPage(parseInt(e.target.value, 10));
                setAuditPage(0);
              }}
              sx={{ borderTop: '1px solid', borderColor: 'divider' }}
            />
          </Box>
        )}
      </MainCard>

      {/* CUSTOMIZE ACCESS BY MODULE DIALOG */}
      <Dialog
        open={permsDrawerOpen}
        onClose={() => setPermsDrawerOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            pt: 2.5,
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={700} color="text.primary">
              Customize access by module
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              Staff member: <strong>{targetStaffPerms?.name}</strong> ({targetStaffPerms?.role}). Turn a whole module on or off, or choose
              individual pages.
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setPermsDrawerOpen(false)} sx={{ color: 'text.secondary' }}>
            <CloseOutlined />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3.5 }, py: 2.5 }}>
          {/* Quick Preset Row + Module Status Legend */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1.5,
              mb: 2.5
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.05em', mr: 0.5 }}>
                QUICK PRESET
              </Typography>
              {PRESET_OPTIONS.map((preset) => {
                const isSelected = activePresetKey === preset.key;
                return (
                  <Box
                    key={preset.key}
                    component="button"
                    type="button"
                    onClick={() => handlePresetPreset(preset.key)}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: 2,
                      fontSize: '0.8125rem',
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? primaryTone.bg : 'background.paper',
                      color: isSelected ? 'primary.main' : 'text.primary',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    {preset.label}
                  </Box>
                );
              })}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="All on"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.16)' : '#dcfce7',
                  color: isDark ? '#34d399' : '#15803d'
                }}
              />
              <Chip
                label="Some pages"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: isDark ? 'rgba(245, 158, 11, 0.16)' : '#fef3c7',
                  color: isDark ? '#fbbf24' : '#b45309'
                }}
              />
              <Chip
                label="Module off"
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  bgcolor: isDark ? 'rgba(148, 163, 184, 0.14)' : '#f1f5f9',
                  color: 'text.secondary'
                }}
              />
            </Box>
          </Box>

          {/* 2x2 Module Cards Grid */}
          <Grid container spacing={2.5}>
            {MODULE_GROUPS.map((group) => {
              const totalCount = group.pages.length;
              const enabledCount = group.pages.filter((p) => Boolean(tempPerms[p.key])).length;
              const isAllOn = enabledCount === totalCount;
              const isOff = enabledCount === 0;
              const accentColor = isDark ? group.accentDark : group.accentLight;
              const headerBg = isOff
                ? isDark
                  ? 'rgba(148, 163, 184, 0.08)'
                  : '#fef9c3'
                : isDark
                  ? group.headerBgDark
                  : group.headerBgLight;

              const statusBadge = isAllOn
                ? {
                    label: `All ${totalCount} pages on`,
                    bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#dcfce7',
                    color: isDark ? '#34d399' : '#15803d'
                  }
                : isOff
                  ? {
                      label: 'Module off',
                      bg: isDark ? 'rgba(148, 163, 184, 0.16)' : '#f1f5f9',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }
                  : {
                      label: `${enabledCount} of ${totalCount} pages on`,
                      bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fef3c7',
                      color: isDark ? '#fbbf24' : '#b45309'
                    };

              return (
                <Grid key={group.id} size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderTop: `3px solid ${accentColor}`,
                      overflow: 'hidden',
                      bgcolor: 'background.paper',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    {/* Module Group Header */}
                    <Box
                      sx={{
                        px: 2.25,
                        py: 1.75,
                        bgcolor: headerBg,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 1.5
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h5" fontWeight={700} color="text.primary">
                          {group.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                          {isOff ? 'Hidden from the sidebar for this user' : group.description}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.75, flexShrink: 0 }}>
                        <Switch checked={!isOff} onChange={() => handleToggleModuleGroup(group)} color="primary" size="small" />
                        <Chip
                          label={statusBadge.label}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            bgcolor: statusBadge.bg,
                            color: statusBadge.color
                          }}
                        />
                      </Box>
                    </Box>

                    {/* Individual Pages Checklist */}
                    <Box sx={{ flex: 1 }}>
                      {group.pages.map((page, idx) => {
                        const checked = Boolean(tempPerms[page.key]);
                        return (
                          <Box
                            key={page.key}
                            onClick={() => handleTogglePerm(page)}
                            sx={{
                              px: 2.25,
                              py: 1.1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1.5,
                              cursor: 'pointer',
                              borderBottom: idx < group.pages.length - 1 ? '1px solid' : 'none',
                              borderColor: 'divider',
                              transition: 'background-color 0.12s ease',
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f9fafb'
                              }
                            }}
                          >
                            <Typography
                              variant="body2"
                              fontWeight={500}
                              sx={{ color: checked ? 'text.primary' : 'text.secondary' }}
                            >
                              {page.label}
                            </Typography>
                            <Switch
                              checked={checked}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleTogglePerm(page)}
                              color="primary"
                              size="small"
                            />
                          </Box>
                        );
                      })}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </DialogContent>

        <DialogActions
          sx={{
            px: { xs: 2.5, sm: 3.5 },
            py: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Administration pages (User Management, Backup, License) stay Super Admin only.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.25 }}>
            <AppButton intent="cancel" onClick={() => setPermsDrawerOpen(false)}>
              Cancel
            </AppButton>
            <AppButton intent="primary" onClick={handleSavePerms}>
              Save access
            </AppButton>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Staff Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 440 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
            Add New Staff Member
          </Typography>

          <form onSubmit={handleCreateStaff}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Full Name *"
                fullWidth
                required
                placeholder="e.g. Store Manager Tariq"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <TextField
                label="Username / Email *"
                fullWidth
                required
                placeholder="e.g. manager@rehmat.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <TextField
                label="Password *"
                type={showPass ? 'text' : 'password'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPass(!showPass)} edge="end">
                          {showPass ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
                fullWidth
                required
                placeholder="Enter login password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <TextField
                select
                label="Assign Role *"
                fullWidth
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <MenuItem value="Store Keeper">Store Keeper (Stock In/Out & Catalog Only)</MenuItem>
                <MenuItem value="Admin">Admin (Store Manager - Operational Access)</MenuItem>
                <MenuItem value="Super Admin">Super Admin (Full Control & Users)</MenuItem>
                <MenuItem value="Sales Manager">Sales Manager (Sales Access)</MenuItem>
                <MenuItem value="Technician">Workshop Technician (Repairs Access)</MenuItem>
              </TextField>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, pt: 1.5 }}>
                <AppButton intent="cancel" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </AppButton>
                <AppButton intent="primary" type="submit">
                  Save Staff User
                </AppButton>
              </Box>
            </Box>
          </form>
        </Box>
      </Drawer>

      {/* Edit Staff Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 440 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
            Edit Staff Account
          </Typography>

          {editingStaff && (
            <form onSubmit={handleUpdateStaff}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Full Name *"
                  fullWidth
                  required
                  value={editingStaff.name}
                  onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                />

                <TextField
                  label="Username / Email *"
                  fullWidth
                  required
                  value={editingStaff.email}
                  onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                />

                <TextField
                  label="Password"
                  type={showEditPass ? 'text' : 'password'}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowEditPass(!showEditPass)} edge="end">
                            {showEditPass ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  fullWidth
                  placeholder="Enter new password (optional)"
                  value={editingStaff.password || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                />

                <TextField
                  select
                  label="Assign Role *"
                  fullWidth
                  value={editingStaff.role}
                  onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                >
                  <MenuItem value="Store Keeper">Store Keeper (Stock In/Out & Catalog)</MenuItem>
                  <MenuItem value="Admin">Admin (Store Manager - Operational Access)</MenuItem>
                  <MenuItem value="Super Admin">Super Admin (Full Control & Users)</MenuItem>
                  <MenuItem value="Sales Manager">Sales Manager (Sales Access)</MenuItem>
                  <MenuItem value="Technician">Workshop Technician (Repairs Access)</MenuItem>
                </TextField>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, pt: 1.5 }}>
                  <AppButton intent="cancel" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </AppButton>
                  <AppButton intent="primary" type="submit">
                    Update Staff User
                  </AppButton>
                </Box>
              </Box>
            </form>
          )}
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Delete Staff Member</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete staff account <strong>{staffToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <AppButton intent="cancel" onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </AppButton>
          <AppButton intent="danger" onClick={handleConfirmDeleteStaff}>
            Delete Staff
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
