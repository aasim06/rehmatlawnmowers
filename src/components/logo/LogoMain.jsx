import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

// assets
import rehmatLogo from 'assets/images/rehmat-logo.jpg';

// Helper hook to convert white background pixels to transparent PNG in real-time
export function useTransparentLogo(src) {
  const [transparentSrc, setTransparentSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = src;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Near-white pixels threshold transparency
          if (r > 220 && g > 220 && b > 220) {
            const minVal = Math.min(r, g, b);
            const alpha = Math.max(0, Math.floor(255 - (minVal - 220) * 7.2));
            data[i + 3] = alpha;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setTransparentSrc(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Error creating transparent logo:', err);
      }
    };
  }, [src]);

  return transparentSrc;
}

// ==============================|| LOGO MAIN ||============================== //

export default function LogoMain() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const transparentLogoSrc = useTransparentLogo(rehmatLogo);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
        height: 100,
        borderRadius: '50%',
        bgcolor: isDark ? 'rgba(255, 255, 255, 0.95)' : '#ffffff',
        boxShadow: 'none',
        p: 0.5,
        transition: 'all 0.3s ease'
      }}
    >
      <Box
        component="img"
        src={transparentLogoSrc}
        alt="Rehmat Lawn Mowers Logo"
        sx={{
          height: 90,
          width: 90,
          objectFit: 'contain',
          borderRadius: '50%',
          display: 'block',
          margin: '0 auto'
        }}
      />
    </Box>
  );
}

