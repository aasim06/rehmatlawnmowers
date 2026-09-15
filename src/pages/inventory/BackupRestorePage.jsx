import { useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// ant design icons
import DownloadOutlined from '@ant-design/icons/DownloadOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import CloudDownloadOutlined from '@ant-design/icons/CloudDownloadOutlined';
import CloudUploadOutlined from '@ant-design/icons/CloudUploadOutlined';

import MainCard from 'components/MainCard';
import { useStoreInventory } from 'context/StoreInventoryContext';

export default function BackupRestorePage() {
  const {
    items,
    usageLogs,
    machineSales,
    machineRecipes,
    customerPayments,
    vendorPayments,
    exportFullBackupData,
    importFullBackupData,
    resetAllDataToZero
  } = useStoreInventory();

  const [restoreStatus, setRestoreStatus] = useState(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleResetData = async () => {
    const res = await resetAllDataToZero();
    setRestoreStatus({ type: res.success ? 'success' : 'error', message: res.message });
    setResetConfirmOpen(false);
  };

  // 1-Click Backup Export Handler
  const handleDownloadBackup = () => {
    const jsonStr = exportFullBackupData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rehmat_Lawn_Mowers_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Restore Backup File Handler
  const handleFileRestoreUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const res = await importFullBackupData(content);
      if (res.success) {
        setRestoreStatus({ type: 'success', message: res.message });
      } else {
        setRestoreStatus({ type: 'error', message: res.message });
      }
    };
    reader.readAsText(file);
  };

  const totalRecords = items.length + usageLogs.length + machineSales.length + customerPayments.length + vendorPayments.length;

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      <MainCard title="💾 Data Backup & System Restore">
        {/* Status Alert if Restored */}
        {restoreStatus && (
          <Alert
            severity={restoreStatus.type}
            icon={restoreStatus.type === 'success' ? <CheckCircleOutlined /> : undefined}
            onClose={() => setRestoreStatus(null)}
            sx={{ mb: 3, fontWeight: 600, borderRadius: 2 }}
          >
            {restoreStatus.message}
          </Alert>
        )}

        {/* System Summary Header Chips */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" sx={{ mb: 3, gap: 1 }}>
          <Chip
            icon={<CheckCircleOutlined style={{ color: '#10b981' }} />}
            label="Database Operational"
            color="success"
            variant="light"
            size="small"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={`Items: ${items.length}`}
            size="small"
            sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9'), fontWeight: 600 }}
          />
          <Chip
            label={`Logs: ${usageLogs.length}`}
            size="small"
            sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9'), fontWeight: 600 }}
          />
          <Chip
            label={`Sales: ${machineSales.length}`}
            size="small"
            sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9'), fontWeight: 600 }}
          />
          <Chip
            label={`Total Database Records: ${totalRecords}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        {/* Primary Action Cards */}
        <Grid container spacing={3}>
          {/* Download Backup */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', transition: 'all 0.2s', '&:hover': { borderColor: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ecfdf5', color: '#10b981' }}>
                    <CloudDownloadOutlined style={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Download System Backup
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                      Export all items, stock logs, customer bills & payment histories into a single secure JSON file.
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<DownloadOutlined />}
                  onClick={handleDownloadBackup}
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    fontWeight: 700,
                    height: 42,
                    borderRadius: 2,
                    mt: 1
                  }}
                >
                  Download JSON Backup
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Restore Backup */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderRadius: 2, height: '100%', transition: 'all 0.2s', '&:hover': { borderColor: '#3b82f6', boxShadow: '0 4px 12px rgba(59,130,246,0.1)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#eff6ff', color: '#3b82f6' }}>
                    <CloudUploadOutlined style={{ fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      Restore From Backup File
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                      Upload a previously saved JSON backup file to instantly restore complete system state.
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  startIcon={<UploadOutlined />}
                  sx={{
                    bgcolor: '#3b82f6',
                    '&:hover': { bgcolor: '#2563eb' },
                    fontWeight: 700,
                    height: 42,
                    borderRadius: 2,
                    mt: 1
                  }}
                >
                  Upload & Restore File
                  <input type="file" accept=".json" hidden onChange={handleFileRestoreUpload} />
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Danger Zone Section */}
        <Divider sx={{ my: 4 }} />

        <Box sx={{ width: '100%', p: 2.5, borderRadius: 2, border: '1px dashed #fca5a5', bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.05)' : '#fff5f5') }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} color="error.main">
                Reset System Data to Zero (Fresh Start)
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Wipe all test records, items, stock logs and customer ledgers to start completely clean.
              </Typography>
            </Box>
            <Box sx={{ ml: { sm: 'auto' } }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutlined />}
                onClick={() => setResetConfirmOpen(true)}
                sx={{ fontWeight: 700, height: 38, borderRadius: 2, whiteSpace: 'nowrap' }}
              >
                Reset Data to 0
              </Button>
            </Box>
          </Box>
        </Box>
      </MainCard>

      {/* Confirm Reset Dialog */}
      <Dialog open={resetConfirmOpen} onClose={() => setResetConfirmOpen(false)} paperProps={{ sx: { borderRadius: 2 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: 'error.main' }}>
          ⚠️ Confirm Reset All Data to Zero?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            Are you sure you want to wipe all store items, stock history, customer ledgers, and vendor transactions? This action will set all system metrics to 0 for a completely fresh start.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setResetConfirmOpen(false)} color="secondary" sx={{ fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleResetData} color="error" variant="contained" sx={{ fontWeight: 700, borderRadius: 1.5 }}>
            Yes, Reset All Data to 0
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
