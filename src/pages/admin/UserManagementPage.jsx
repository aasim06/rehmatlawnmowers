import { useState } from 'react';
import { useAuth, defaultAdminPermissions, defaultStoreKeeperPermissions } from 'context/AuthContext';
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
  FormControlLabel,
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
  ControlOutlined
} from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

const MODULE_LIST = [
  { key: 'stock-out', label: 'Stock Out Page', desc: 'Allows recording stock issuance & daily usage' },
  { key: 'stock-in', label: 'Stock In Page', desc: 'Allows receiving new stock from vendors' },
  { key: 'items', label: 'Store Items Catalogue', desc: 'View store items stock levels & rack locations' },
  { key: 'machine-sales', label: 'Machine Sales Page', desc: 'Allows selling machines to customers' },
  { key: 'machine-repairs', label: 'Machine Repairing', desc: 'Allows managing workshop repair jobs' },
  { key: 'customer-ledgers', label: 'Machine & Customer Ledgers', desc: 'View customer balance history' },
  { key: 'vendor-ledgers', label: 'Vendor Payables', desc: 'View supplier payment ledgers' },
  { key: 'vendors', label: 'Vendors & Parties Master', desc: 'Add/edit supplier and customer contacts' },
  { key: 'ledger', label: 'Store History Log', desc: 'View complete item transaction history' },
  { key: 'reports', label: 'Reports & Analytics', desc: 'View store financial reports & graphs' },
  { key: 'backup-restore', label: 'Data Backup & Restore', desc: 'Export & import system data' },
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
  const { auditLogs = [], deleteAuditLog, clearAuditLogs } = useStoreInventory();

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
    const existing = staff.permissions || (staff.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions);
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
      setTempPerms({ ...defaultStoreKeeperPermissions });
    } else if (presetType === 'fullKeeper') {
      setTempPerms({
        ...defaultStoreKeeperPermissions,
        'stock-in': true,
        'stock-out': true,
        'items': true
      });
    } else if (presetType === 'allowAll') {
      setTempPerms({ ...defaultAdminPermissions });
    }
  };

  const handleConfirmDeleteStaff = () => {
    if (staffToDelete) {
      deleteStaffUser(staffToDelete.id);
      setDeleteDialogOpen(false);
      setStaffToDelete(null);
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
                  Admin Panel — Staff Users & Access Toggles
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Create staff login credentials and toggle ON/OFF individual module access for each worker.
                </Typography>
              </Box>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent={{ xs: 'flex-start', md: 'flex-end' }} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Chip
                avatar={<UserOutlined />}
                label={`Active: ${activeUser?.name || 'Admin'} (${activeUser?.role || 'Super Admin'})`}
                color={activeUser?.role === 'Store Keeper' ? 'warning' : 'primary'}
                variant="outlined"
                sx={{ fontWeight: 700, p: 0.5, py: 1 }}
              />
              {activeUser?.role !== 'Store Keeper' && (
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  onClick={() => switchUserRole('Store Keeper')}
                  sx={{ fontWeight: 600, width: { xs: '100%', sm: 'auto' } }}
                >
                  Switch To Store Keeper
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
            <Tab icon={<HistoryOutlined />} iconPosition="start" label={`User Audit Logs (${auditLogs.length})`} sx={{ fontWeight: 700 }} />
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
                    const perms = staff.permissions || (staff.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions);
                    const moduleKeys = [
                      'stock-out',
                      'stock-in',
                      'items',
                      'machine-sales',
                      'machine-repairs',
                      'customer-ledgers',
                      'vendor-ledgers',
                      'vendors',
                      'ledger',
                      'reports',
                      'backup-restore'
                    ];
                    const enabledCount = moduleKeys.filter((k) => Boolean(perms[k])).length;

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
                            <Chip
                              label={staff.role}
                              color={staff.role === 'Super Admin' ? 'primary' : staff.role === 'Store Keeper' ? 'warning' : 'info'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
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
                              color={enabledCount > 1 ? 'success' : 'secondary'}
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
                        const perms = staff.permissions || (staff.role === 'Super Admin' ? defaultAdminPermissions : defaultStoreKeeperPermissions);
                        const moduleKeys = [
                          'stock-out',
                          'stock-in',
                          'items',
                          'machine-sales',
                          'machine-repairs',
                          'customer-ledgers',
                          'vendor-ledgers',
                          'vendors',
                          'ledger',
                          'reports',
                          'backup-restore'
                        ];
                        const enabledCount = moduleKeys.filter((k) => Boolean(perms[k])).length;

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

                            <TableCell>
                              <Chip
                                label={staff.role}
                                color={
                                  staff.role === 'Super Admin'
                                    ? 'primary'
                                    : staff.role === 'Store Keeper'
                                    ? 'warning'
                                    : 'info'
                                }
                                size="small"
                                sx={{ fontWeight: 700 }}
                              />
                            </TableCell>

                            <TableCell align="center">
                              <Chip
                                label={`${enabledCount} Modules ON`}
                                color={enabledCount > 1 ? 'success' : 'secondary'}
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
                              <Stack direction="row" spacing={1} justifyContent="center">
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

        {/* TAB 1: ACTIVITY AUDIT LOGS */}
        {activeTab === 1 && (
          <Stack spacing={2}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 8 }}>
                <OutlinedInput
                  fullWidth
                  size="small"
                  placeholder="Search Audit Logs by User, Action, or Item..."
                  value={logSearchTerm}
                  onChange={(e) => setLogSearchTerm(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchOutlined />
                    </InputAdornment>
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} textAlign={{ xs: 'left', sm: 'right' }}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteOutlined />}
                  onClick={clearAuditLogs}
                  size="small"
                  sx={{ fontWeight: 600 }}
                >
                  Clear All Logs
                </Button>
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
                    <TableCell align="center">ACTION</TableCell>
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
                          <IconButton color="error" size="small" onClick={() => deleteAuditLog(log.id)}>
                            <DeleteOutlined />
                          </IconButton>
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
        <Box sx={{ width: { xs: '100vw', sm: 480 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            🎛️ Customize Access Toggles
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Turn ON or OFF specific pages & actions for <strong>{targetStaffPerms?.name}</strong>.
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
              QUICK PRESETS:
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="outlined" color="error" onClick={() => handlePresetPreset('strict')}>
                Only Stock Out
              </Button>
              <Button size="small" variant="outlined" color="warning" onClick={() => handlePresetPreset('fullKeeper')}>
                In + Out + Catalog
              </Button>
              <Button size="small" variant="outlined" color="success" onClick={() => handlePresetPreset('allowAll')}>
                Enable All
              </Button>
            </Stack>
          </Paper>

          <Divider sx={{ mb: 2 }} />

          <Stack spacing={2} sx={{ maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', pr: 1 }}>
            {MODULE_LIST.map((mod) => {
              const isChecked = Boolean(tempPerms[mod.key]);

              return (
                <Paper
                  key={mod.key}
                  variant="outlined"
                  sx={{
                    p: 1.75,
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
                      <Typography variant="subtitle2" fontWeight={700} align="left" sx={{ textAlign: 'left' }}>
                        {mod.label}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" align="left" sx={{ textAlign: 'left', display: 'block', mt: 0.25 }}>
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
        <Box sx={{ width: { xs: '100vw', sm: 420 }, p: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
            👤 Add New Staff Member
          </Typography>

          <form onSubmit={handleCreateStaff}>
            <Stack spacing={2.5}>
              <TextField
                label="Full Name *"
                fullWidth
                required
                placeholder="e.g. Store Keeper Ali"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <TextField
                label="Username / Email *"
                fullWidth
                required
                placeholder="e.g. storekeeper@rehmat.com"
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
                <MenuItem value="Store Keeper">👷 Store Keeper (Customizable Toggles)</MenuItem>
                <MenuItem value="Super Admin">👑 Super Admin (Full Access)</MenuItem>
                <MenuItem value="Sales Manager">💼 Sales Manager (Sales Access)</MenuItem>
                <MenuItem value="Technician">🔧 Workshop Technician (Repairs Access)</MenuItem>
              </TextField>

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => setDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" type="submit">
                  Save Staff User
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Drawer>

      {/* Edit Staff Drawer */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: { xs: '100vw', sm: 420 }, p: { xs: 2, sm: 3 } }}>
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
                  <MenuItem value="Store Keeper">👷 Store Keeper</MenuItem>
                  <MenuItem value="Super Admin">👑 Super Admin</MenuItem>
                  <MenuItem value="Sales Manager">💼 Sales Manager</MenuItem>
                  <MenuItem value="Technician">🔧 Workshop Technician</MenuItem>
                </TextField>

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" color="primary" type="submit">
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
