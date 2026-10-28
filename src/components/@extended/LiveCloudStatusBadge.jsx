import { useState } from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloudSyncOutlined from '@ant-design/icons/CloudSyncOutlined';
import DisconnectOutlined from '@ant-design/icons/DisconnectOutlined';
import { isLiveCloudMode } from 'utils/platform';

export default function LiveCloudStatusBadge() {
  const isCloud = isLiveCloudMode();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    if (!isCloud) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3000);
        await fetch('https://rehmatlawnmowers.vercel.app/favicon.svg', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
          signal: controller.signal
        });
        clearTimeout(timer);
        window.location.href = 'https://rehmatlawnmowers.vercel.app/?platform=tauri';
        return;
      } catch {
        alert('Live cloud is currently unreachable. Please check your internet connection.');
        setChecking(false);
      }
    } else {
      window.location.reload();
    }
  };

  return (
    <Tooltip
      title={
        isCloud
          ? 'Live Cloud Active: Connected to live Vercel cloud. Click to check & load latest updates.'
          : 'Offline Mode: Running local copy. Click to connect to live cloud.'
      }
    >
      <Chip
        icon={
          checking ? (
            <CircularProgress size={13} color="inherit" />
          ) : isCloud ? (
            <CloudSyncOutlined style={{ fontSize: 13 }} />
          ) : (
            <DisconnectOutlined style={{ fontSize: 13 }} />
          )
        }
        label={checking ? 'Checking...' : isCloud ? 'Cloud Live' : 'Offline'}
        size="small"
        color={isCloud ? 'success' : 'warning'}
        variant="outlined"
        onClick={handleRefresh}
        sx={{
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.72rem',
          height: 26,
          px: 0.5,
          ml: 1,
          borderColor: isCloud ? 'success.main' : 'warning.main',
          '&:hover': {
            backgroundColor: isCloud ? 'rgba(82, 196, 26, 0.1)' : 'rgba(250, 173, 20, 0.1)'
          }
        }}
      />
    </Tooltip>
  );
}

