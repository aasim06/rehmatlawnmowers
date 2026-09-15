import { motion } from 'framer-motion';
import useConfig from 'hooks/useConfig';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

export default function MagicThemeToggler() {
  const { state, setField } = useConfig();
  const isDark = state.mode === 'dark';

  const toggleTheme = () => {
    setField('mode', isDark ? 'light' : 'dark');
  };

  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
      <Box
        component={motion.div}
        whileTap={{ scale: 0.94 }}
        onClick={toggleTheme}
        sx={{
          position: 'relative',
          width: 68,
          height: 34,
          borderRadius: '999px',
          padding: '3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          background: isDark
            ? 'linear-gradient(135deg, #18181b 0%, #27272a 100%)'
            : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(203, 213, 225, 0.8)',
          boxShadow: isDark
            ? '0 2px 10px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            : '0 2px 10px rgba(0, 0, 0, 0.06), inset 0 1px 1px rgba(255, 255, 255, 0.8)',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Animated Sliding Thumb */}
        <motion.div
          animate={{
            x: isDark ? 34 : 0,
            rotate: isDark ? 360 : 0
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 25
          }}
          style={{
            position: 'absolute',
            top: 3,
            left: 3,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: isDark
              ? 'linear-gradient(135deg, #3f3f46 0%, #18181b 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: isDark
              ? '0 2px 8px rgba(0, 0, 0, 0.6)'
              : '0 2px 6px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}
        >
          {isDark ? (
            <MoonOutlined style={{ fontSize: 13, color: '#f4f4f5' }} />
          ) : (
            <SunOutlined style={{ fontSize: 13, color: '#f59e0b' }} />
          )}
        </motion.div>

        {/* Static Background Icons for Magic UI aesthetic */}
        <Box
          sx={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            opacity: isDark ? 0.4 : 0,
            transition: 'opacity 0.2s'
          }}
        >
          <SunOutlined style={{ fontSize: 12, color: '#a1a1aa' }} />
        </Box>

        <Box
          sx={{
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            opacity: isDark ? 0 : 0.4,
            transition: 'opacity 0.2s'
          }}
        >
          <MoonOutlined style={{ fontSize: 12, color: '#71717a' }} />
        </Box>
      </Box>
    </Tooltip>
  );
}
