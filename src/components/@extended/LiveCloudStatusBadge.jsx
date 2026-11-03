import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import CloudSyncOutlined from '@ant-design/icons/CloudSyncOutlined';
import DisconnectOutlined from '@ant-design/icons/DisconnectOutlined';
import RocketOutlined from '@ant-design/icons/RocketOutlined';
import { isLiveCloudMode } from 'utils/platform';
import { useAppUpdate } from 'hooks/useAppUpdate';

export default function LiveCloudStatusBadge() {
  const isCloud = isLiveCloudMode();
  const { hasUpdate, checking, applyUpdate, checkForUpdate } = useAppUpdate();

  const handleClick = () => {
    if (hasUpdate) {
      applyUpdate();
    } else {
      checkForUpdate();
    }
  };

  if (hasUpdate) {
    return (
      <Tooltip title="🚀 A new version of the app was published! Click to apply updates instantly.">
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

  return (
    <Tooltip
      title={
        isCloud
          ? 'Live Cloud Active: Connected to live cloud. Click to check for updates.'
          : 'Offline Fast Mode: Running cached local copy. Click to check for live updates.'
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
