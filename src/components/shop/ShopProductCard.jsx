import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import EditOutlined from '@ant-design/icons/EditOutlined';
import PictureOutlined from '@ant-design/icons/PictureOutlined';
import PlusOutlined from '@ant-design/icons/PlusOutlined';

import { AppButton } from 'components/common';
import { getCardSurfaceSx, getSubSurfaceSx, getToneColors } from 'utils/themeSurface';
import { formatPKR } from 'utils/dashboardHelpers';

/**
 * Reusable theme-aware POS product card used across the Retail Shop Mart catalog grid.
 */
export default function ShopProductCard({ item, inCartQty = 0, availableStock = 0, onAddToCart, onEdit }) {
  const theme = useTheme();
  const stock = parseInt(item.totalStock, 10) || 0;
  const minThreshold = parseInt(item.minLevel, 10) || 5;
  const isOutOfStock = stock <= 0;
  const price = parseFloat(item.unitPrice) || 0;

  const primaryTone = getToneColors(theme, 'primary');
  const stockTone = getToneColors(theme, isOutOfStock ? 'error' : stock <= minThreshold ? 'warning' : 'success');

  return (
    <Box
      sx={getCardSurfaceSx(theme, {
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
        '&:hover': {
          borderColor: primaryTone.solid,
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)'
        }
      })}
    >
      {/* Image & Status Pills */}
      <Box
        sx={getSubSurfaceSx(theme, {
          height: 140,
          borderRadius: 0,
          border: 0,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          p: 1.5
        })}
      >
        {item.imageUrl ? (
          <Box
            component="img"
            src={item.imageUrl}
            alt={item.name}
            onError={(e) => {
              e.target.style.display = 'none';
              if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
            }}
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : null}
        <Box
          sx={{
            display: item.imageUrl ? 'none' : 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'text.disabled'
          }}
        >
          <PictureOutlined style={{ fontSize: '2rem', opacity: 0.35 }} />
        </Box>

        {/* Stock Badge */}
        <Chip
          label={isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            height: 22,
            fontSize: '0.7rem',
            fontWeight: 700,
            bgcolor: stockTone.bg,
            color: stockTone.main,
            border: '1px solid',
            borderColor: stockTone.border
          }}
        />

        {/* In-Cart Count */}
        {inCartQty > 0 && (
          <Chip
            label={`${inCartQty} in Cart`}
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              height: 22,
              fontSize: '0.7rem',
              fontWeight: 700
            }}
          />
        )}
      </Box>

      {/* Product Info & Add Button */}
      <Box sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 1.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 0.5 }}>
            <Typography
              variant="subtitle2"
              color="text.primary"
              sx={{
                fontWeight: 700,
                fontSize: '0.9rem',
                lineHeight: 1.35,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                flex: 1
              }}
            >
              {item.name}
            </Typography>
            {onEdit && (
              <Tooltip title="Edit Product">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                  sx={{
                    p: 0.5,
                    color: 'text.secondary',
                    borderRadius: 1,
                    '&:hover': { color: 'primary.main', bgcolor: primaryTone.bg }
                  }}
                >
                  <EditOutlined style={{ fontSize: 13 }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.35 }}>
            {[item.category || 'General', item.specification, item.unit || 'PCS'].filter(Boolean).join(' • ')}
          </Typography>
        </Box>

        <Box>
          <Typography
            variant="h5"
            color="text.primary"
            sx={{ fontWeight: 800, mb: 1.25, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatPKR(price)}
          </Typography>

          {availableStock <= 0 ? (
            <AppButton fullWidth intent="neutral" size="small" disabled>
              Out of Stock
            </AppButton>
          ) : (
            <AppButton fullWidth intent="primary" size="small" startIcon={<PlusOutlined />} onClick={() => onAddToCart(item)}>
              Add to Cart
            </AppButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}

ShopProductCard.propTypes = {
  item: PropTypes.object.isRequired,
  inCartQty: PropTypes.number,
  availableStock: PropTypes.number,
  onAddToCart: PropTypes.func.isRequired,
  onEdit: PropTypes.func
};

