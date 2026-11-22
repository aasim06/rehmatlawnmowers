import { useState, useEffect } from 'react';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloudSyncOutlined from '@ant-design/icons/CloudSyncOutlined';
import DisconnectOutlined from '@ant-design/icons/DisconnectOutlined';
import RocketOutlined from '@ant-design/icons/RocketOutlined';
import { useAppUpdate } from 'hooks/useAppUpdate';
import { useStoreInventory } from 'context/StoreInventoryContext';

export default function LiveCloudStatusBadge() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const { hasUpdate, checking, applyUpdate, checkForUpdate } = useAppUpdate();
  const { fetchFirebaseData } = useStoreInventory();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClick = async () => {
    if (hasUpdate) {
      applyUpdate();
    } else {
      if (fetchFirebaseData) {
        try {
          await fetchFirebaseData();
        } catch (err) {
          console.warn('Manual cloud sync failed:', err);
        }
      }
      checkForUpdate();
    }
  };

  if (hasUpdate) {
    return (
      <Tooltip title="A new version of the app was published! Click to apply updates instantly.">
        <Chip
          icon={checking ? <CircularProgress size={13} color="inherit" /> : <RocketOutlined style={{ fontSize: 13 }} />}
          label={checking ? 'Updating...' : 'New Update Available! (Click)'}
          size="small"
          color="warning"
          variant="filled"
          onClick={handleClick}
          sx={{
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '0.74rem',
            height: 28,
            px: 1,
            borderRadius: 2,
            bgcolor: '#f59e0b',
            color: '#ffffff',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.6)',
            animation: 'pulse 1.8s infinite',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)' },
              '70%': { transform: 'scale(1.04)', boxShadow: '0 0 0 8px rgba(245, 158, 11, 0)' },
              '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)' }
            },
            '&:hover': {
              bgcolor: '#d97706'
            }
          }}
        />
      </Tooltip>
    );
  }

  const isCloud = isOnline;

  return (
    <Tooltip
      title={
        isCloud
          ? 'Live Cloud Active: Connected to Firebase Cloud Database. Click to sync now.'
          : 'Offline Mode: No internet connection. Click to retry connection.'
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
        label={checking ? 'Syncing...' : isCloud ? 'Cloud Live' : 'Offline'}
        size="small"
        color={isCloud ? 'success' : 'default'}
        variant="outlined"
        onClick={handleClick}
        sx={{
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: '0.74rem',
          height: 28,
          px: 0.75,
          borderRadius: 2,
          borderColor: isCloud ? 'success.main' : 'divider',
          '&:hover': {
            backgroundColor: isCloud ? 'rgba(82, 196, 26, 0.1)' : 'rgba(0, 0, 0, 0.05)'
          }
        }}
      />
    </Tooltip>
  );
}
