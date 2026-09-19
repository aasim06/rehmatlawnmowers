import { useState } from 'react';
import {
  useAuth,
  defaultSuperAdminPermissions,
  defaultAdminPermissions,
  defaultStoreKeeperPermissions,
  getRoleDefaultPermissions
} from 'context/AuthContext';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
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
  LockOutlined,
  CrownOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

const MODULE_LIST = [
  { key: 'dashboard', label: 'Main Store Dashboard', desc: 'Allows viewing executive dashboard analytics & alerts' },
  { key: 'stock-out', label: 'Stock Out Page', desc: 'Allows recording stock issuance & daily usage' },
  { key: 'stock-in', label: 'Stock In Page', desc: 'Allows receiving new stock shipments from vendors' },
  { key: 'items', label: 'Store Items Catalogue', desc: 'View store items stock levels & rack locations' },
  { key: 'categories', label: 'Categories Master', desc: 'Manage item categories and racks' },
  { key: 'machine-sales', label: 'Machine Sales Page', desc: 'Allows selling machines to customers' },
  { key: 'machine-repairs', label: 'Machine Repairing', desc: 'Allows managing workshop repair jobs' },
  { key: 'customer-ledgers', label: 'Machine & Customer Ledgers', desc: 'View customer balance history' },
  { key: 'vendor-ledgers', label: 'Vendor Payables', desc: 'View supplier payment ledgers' },
  { key: 'vendors', label: 'Vendors & Parties Master', desc: 'Add/edit supplier and customer contacts' },
  { key: 'ledger', label: 'Store History Log', desc: 'View complete item transaction history' },
  { key: 'reports', label: 'Reports & Analytics', desc: 'View store financial reports & graphs' },
  { key: 'expenses', label: 'Daily Expenses', desc: 'Record and track shop daily expenses' },
  { key: 'backup-restore', label: 'Data Backup & Restore', desc: 'Export & import system data (Super Admin Only)' },
  { key: 'user-management', label: 'User Management & Logs', desc: 'Manage staff accounts and permissions (Super Admin Only)' },
  { key: 'canEditPrice', label: 'Edit Unit Prices Permission', desc: 'Allow user to change prices on sales/stock out' },
  { key: 'canDelete', label: 'Delete Records Permission', desc: 'Allow user to delete logs or catalog items' }
];

export default function UserManagementPage() {
  const {
    staffUsers = [],
    addStaffUser,
    deleteStaffUser,
    updateStaffUser,
    updateUserPermissions,
    user: activeUser,
    switchUserRole
  } = useAuth();
  const { auditLogs = [] } = useStoreInventory();

  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [logSearchTerm, setLogSearchTerm] = useState('');

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

  // Manage Toggles Drawer
  const [permsDrawerOpen, setPermsDrawerOpen] = useState(false);
  const [targetStaffPerms, setTargetStaffPerms] = useState(null);
  const [tempPerms, setTempPerms] = useState({});

  // Delete Staff Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // Filtered staff list
  const filteredStaff = staffUsers.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleUpdateStaff = (e) => {
    e.preventDefault();
    if (!editingStaff) return;

    updateStaffUser(editingStaff.id, editingStaff);
    setEditDrawerOpen(false);
    setEditingStaff(null);
  };

  const handleOpenPerms = (staff) => {
    setTargetStaffPerms(staff);
    const existing = staff.permissions || getRoleDefaultPermissions(staff.role);
    setTempPerms({ ...existing });
    setPermsDrawerOpen(true);
  };

  const handleTogglePerm = (key) => {
    setTempPerms((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePerms = () => {
    if (targetStaffPerms) {
      updateUserPermissions(targetStaffPerms.id, tempPerms);
      setPermsDrawerOpen(false);
      setTargetStaffPerms(null);
    }
  };

  const handlePresetPreset = (presetType) => {
    if (presetType === 'strict') {
      setTempPerms({
        ...defaultStoreKeeperPermissions,
        'stock-out': true,
        'stock-in': false,
        'items': false
      });
    } else if (presetType === 'fullKeeper') {
      setTempPerms({
        ...defaultStoreKeeperPermissions,
        'stock-in': true,
        'stock-out': true,
        'items': true
      });
    } else if (presetType === 'admin') {
      setTempPerms({ ...defaultAdminPermissions });
    } else if (presetType === 'superAdmin' || presetType === 'allowAll') {
      setTempPerms({ ...defaultSuperAdminPermissions });
    }
  };

  const handleConfirmDeleteStaff = () => {
    if (staffToDelete) {
      deleteStaffUser(staffToDelete.id);
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Super Admin':
        return <Chip icon={<CrownOutlined />} label="Super Admin" color="primary" size="small" sx={{ fontWeight: 700 }} />;
      case 'Admin':
        return <Chip icon={<SafetyCertificateOutlined />} label="Admin (Manager)" color="info" size="small" sx={{ fontWeight: 700 }} />;
      case 'Store Keeper':
        return <Chip icon={<UserOutlined />} label="Store Keeper" color="warning" size="small" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={role} color="secondary" size="small" sx={{ fontWeight: 700 }} />;
    }
  };

  return (
    <Stack spacing={3}>
      {/* 1. Header Card & Active User Badge */}
      <MainCard>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2,
                  bgcolor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'primary.main',
                  fontSize: '1.6rem'
                }}
              >
                <SafetyCertificateOutlined />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  User Management & Access Control (RBAC)
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Manage Super Admin, Admin, and Store Keeper accounts with fine-grained page & action toggles.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Chip
                avatar={<UserOutlined />}
                label={`Logged as: ${activeUser?.name || 'Admin'} (${activeUser?.role || 'Super Admin'})`}
                color={activeUser?.role === 'Super Admin' ? 'primary' : activeUser?.role === 'Admin' ? 'info' : 'warning'}
                variant="outlined"
                sx={{ fontWeight: 700, p: 0.5, py: 1 }}
              />
              {activeUser?.role === 'Super Admin' && (
                <Button
                  variant="outlined"
                  color="warning"
                  size="small"
                  onClick={() => switchUserRole('Store Keeper')}
                  sx={{ fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
                >
                  Test As Store Keeper
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </MainCard>

      {/* 2. Tabs: Staff List vs Activity Audit Logs */}
      <MainCard>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2.5 }}>
          <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)}>
            <Tab icon={<UserOutlined />} iconPosition="start" label={`Staff Users (${staffUsers.length})`} sx={{ fontWeight: 700 }} />
            <Tab icon={<HistoryOutlined />} iconPosition="start" label={`Immutable Audit Logs (${auditLogs.length})`} sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>

        {/* TAB 0: STAFF USERS LIST */}
        {activeTab === 0 && (
          <Stack spacing={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 8 }}>
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
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} textAlign={{ xs: 'left', sm: 'right' }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth={{ xs: true, sm: false }}
                  startIcon={<PlusOutlined />}
                  onClick={() => setDrawerOpen(true)}
                  sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
                >
                  Add Staff Member
                </Button>
              </Grid>
            </Grid>

            {/* Mobile Summary Cards for Staff Users (xs & sm) */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {filteredStaff.length === 0 ? (
                <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">
                    No staff users found.
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={2}>
                  {filteredStaff.map((staff) => {
                    const perms = staff.permissions || getRoleDefaultPermissions(staff.role);
                    const enabledCount = MODULE_LIST.filter((m) => Boolean(perms[m.key])).length;
                    const isProtected = staff.email?.toLowerCase() === 'admin@rehmat.com';

                    return (
                      <Paper
                        key={staff.id}
                        variant="outlined"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          borderColor: 'divider',
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Stack spacing={1.5}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            {getRoleBadge(staff.role)}
                            <Chip
                              icon={<CheckCircleOutlined />}
                              label={staff.status || 'Active'}
                              color="success"
                              variant="light"
                              size="small"
                            />
                          </Stack>

                          <Box>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {staff.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {staff.email}
                            </Typography>
                          </Box>

                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'action.hover', p: 1.25, borderRadius: 1.5 }}>
                            <Typography variant="caption" fontWeight={600} color="textSecondary">
                              ENABLED MODULES:
                            </Typography>
                            <Chip
                              label={`${enabledCount} Modules ON`}
                              color={enabledCount > 5 ? 'success' : 'secondary'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </Stack>

                          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
                            <Button
                              variant="contained"
                              color="warning"
                              size="small"
                              fullWidth
                              startIcon={<ControlOutlined />}
                              onClick={() => handleOpenPerms(staff)}
                              sx={{ fontWeight: 700, textTransform: 'none', py: 0.75 }}
                            >
                              Toggle Access
                            </Button>
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
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
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
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="textSecondary">
                            No staff users found.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStaff.map((staff) => {
                        const perms = staff.permissions || getRoleDefaultPermissions(staff.role);
                        const enabledCount = MODULE_LIST.filter((m) => Boolean(perms[m.key])).length;
                        const isProtected = staff.email?.toLowerCase() === 'admin@rehmat.com';

                        return (
                          <TableRow key={staff.id} hover>
                            <TableCell>
                              <Typography variant="subtitle2" fontWeight={700}>
                                {staff.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {staff.email}
                              </Typography>
                            </TableCell>

                            <TableCell>{getRoleBadge(staff.role)}</TableCell>

                            <TableCell align="center">
                              <Chip
                                label={`${enabledCount} Modules Active`}
                                color={enabledCount > 5 ? 'success' : 'secondary'}
                                size="small"
                                sx={{ fontWeight: 600 }}
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
                              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                                <Button
                                  variant="contained"
                                  color="warning"
                                  size="small"
                                  startIcon={<ControlOutlined />}
                                  onClick={() => handleOpenPerms(staff)}
                                  sx={{ fontWeight: 700, textTransform: 'none' }}
                                >
                                  Toggle Access
                                </Button>

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
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Stack>
        )}

        {/* TAB 1: ACTIVITY AUDIT LOGS (IMMUTABLE & TAMPER-PROOF) */}
        {activeTab === 1 && (
          <Stack spacing={2}>
            <Grid container spacing={2} alignItems="center">
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
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 5 }} textAlign={{ xs: 'left', sm: 'right' }}>
                <Chip
                  icon={<LockOutlined />}
                  label="🔒 Immutable Audit Trail (Tamper-Proof)"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, p: 1 }}
                />
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
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="textSecondary">
                          No audit activity logs recorded.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAuditLogs.map((log) => (
                      <TableRow key={log.id} hover>
                        <TableCell whiteSpace="nowrap">
                          <Typography variant="caption" fontWeight={600} color="textSecondary">
                            {log.timestamp}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {log.userName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
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
                            size="small"
                            sx={{ fontWeight: 700 }}
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
                              variant="outlined"
                              color="default"
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </MainCard>

      {/* 🎛️ MANAGE PERMISSIONS TOGGLES DRAWER */}
      <Drawer anchor="right" open={permsDrawerOpen} onClose={() => setPermsDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 500 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            🎛️ Customize Access Toggles
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Turn ON or OFF specific pages & actions for <strong>{targetStaffPerms?.name}</strong> ({targetStaffPerms?.role}).
          </Typography>

          {/* Preset Buttons */}
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              mb: 2.5,
              bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f9fafb'),
              borderRadius: 1.5
            }}
          >
            <Typography variant="caption" fontWeight={700} color="textSecondary" sx={{ display: 'block', mb: 1 }}>
              QUICK ROLE PRESETS:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Button size="small" variant="outlined" color="error" onClick={() => handlePresetPreset('strict')}>
                Strict Keeper
              </Button>
              <Button size="small" variant="outlined" color="warning" onClick={() => handlePresetPreset('fullKeeper')}>
                Standard Keeper
              </Button>
              <Button size="small" variant="outlined" color="info" onClick={() => handlePresetPreset('admin')}>
                Store Admin
              </Button>
              <Button size="small" variant="outlined" color="success" onClick={() => handlePresetPreset('superAdmin')}>
                Super Admin
              </Button>
            </Stack>
          </Paper>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={1.5} sx={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', pr: 1 }}>
            {MODULE_LIST.map((mod) => {
              const isChecked = Boolean(tempPerms[mod.key]);

              return (
                <Paper
                  key={mod.key}
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    borderColor: (theme) => (isChecked ? 'primary.main' : theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'divider'),
                    bgcolor: (theme) =>
                      isChecked
                        ? theme.palette.mode === 'dark'
                          ? 'rgba(24, 144, 255, 0.15)'
                          : 'primary.lighter'
                        : theme.palette.mode === 'dark'
                        ? 'rgba(255, 255, 255, 0.02)'
                        : '#ffffff',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Box sx={{ flexGrow: 1, textAlign: 'left' }}>
                      <Typography variant="subtitle2" fontWeight={700} align="left">
                        {mod.label}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" align="left" sx={{ display: 'block', mt: 0.25 }}>
                        {mod.desc}
                      </Typography>
                    </Box>

                    <Switch
                      checked={isChecked}
                      onChange={() => handleTogglePerm(mod.key)}
                      color="primary"
                    />
                  </Stack>
                </Paper>
              );
            })}
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 3 }}>
            <Button variant="outlined" color="secondary" onClick={() => setPermsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleSavePerms} sx={{ fontWeight: 700 }}>
              Save Toggles & Update Access
            </Button>
          </Stack>
        </Box>
      </Drawer>

      {/* Add Staff Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 440 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
            👤 Add New Staff Member
          </Typography>

          <form onSubmit={handleCreateStaff}>
            <Stack spacing={2.5}>
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
                type="password"
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
                <MenuItem value="Store Keeper">👷 Store Keeper (Stock In/Out & Catalog Only)</MenuItem>
                <MenuItem value="Admin">🛡️ Admin (Store Manager - Operational Access)</MenuItem>
                <MenuItem value="Super Admin">👑 Super Admin (Full Control & Users)</MenuItem>
                <MenuItem value="Sales Manager">💼 Sales Manager (Sales Access)</MenuItem>
                <MenuItem value="Technician">🔧 Workshop Technician (Repairs Access)</MenuItem>
              </TextField>

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" type="submit" sx={{ fontWeight: 700 }}>
                  Save Staff User
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Drawer>

      {/* Edit Staff Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 440 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
            ✏️ Edit Staff Account
          </Typography>

          {editingStaff && (
            <form onSubmit={handleUpdateStaff}>
              <Stack spacing={2.5}>
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
                  type="password"
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
                  <MenuItem value="Store Keeper">👷 Store Keeper (Stock In/Out & Catalog)</MenuItem>
                  <MenuItem value="Admin">🛡️ Admin (Store Manager - Operational Access)</MenuItem>
                  <MenuItem value="Super Admin">👑 Super Admin (Full Control & Users)</MenuItem>
                  <MenuItem value="Sales Manager">💼 Sales Manager (Sales Access)</MenuItem>
                  <MenuItem value="Technician">🔧 Workshop Technician (Repairs Access)</MenuItem>
                </TextField>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" color="primary" type="submit" sx={{ fontWeight: 700 }}>
                    Update Staff User
                  </Button>
                </Stack>
              </Stack>
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
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteStaff} color="error" variant="contained">
            Delete Staff
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
