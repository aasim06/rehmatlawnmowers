import React from 'react';
import { Box, Typography } from '@mui/material';
import ilyasSignatureImg from 'assets/images/ilyas-signature-clean.png';

const CeoSignature = ({ width = 165 }) => {
  return (
    <Box sx={{ width, textAlign: 'left', display: 'inline-block' }}>
      {/* Top Company Title */}
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 900,
          fontStyle: 'italic',
          color: '#000000',
          fontSize: '0.80rem',
          mb: 0.1,
          lineHeight: 1.1
        }}
      >
        Rehmat Lawn Mowers
      </Typography>

      {/* Clean Handwritten Signature Image & Proprietor Label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, my: 0.2 }}>
        <Box
          component="img"
          src={ilyasSignatureImg}
          alt="Ilyas Signature"
          sx={{
            height: 28,
            maxWidth: 90,
            objectFit: 'contain',
            mixBlendMode: 'multiply'
          }}
        />
        <Typography
          variant="body2"
          sx={{
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            fontStyle: 'italic',
            color: '#000000',
            fontSize: '0.80rem'
          }}
        >
          Proprietor
        </Typography>
      </Box>

      {/* Solid Underline */}
      <Box sx={{ borderBottom: '1.5px solid #000000', width: '100%', mb: 0.4 }} />

      {/* CEO Name & Title */}
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 800,
          color: '#000000',
          fontSize: '0.78rem',
          lineHeight: 1.2
        }}
      >
        Ilyas Rehmat Ali
      </Typography>
      <Typography
        variant="body2"
        sx={{
          fontFamily: 'Arial, sans-serif',
          fontWeight: 800,
          color: '#000000',
          fontSize: '0.70rem',
          lineHeight: 1.2
        }}
      >
        CEO
      </Typography>
    </Box>
  );
};

export default CeoSignature;
