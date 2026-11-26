import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Autocomplete, Box, Divider, Drawer, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import UploadOutlined from '@ant-design/icons/UploadOutlined';

import { AppButton } from 'components/common';
import { getSubSurfaceSx } from 'utils/themeSurface';
import { compressImageFile, SHOP_UNITS } from 'utils/shopHelpers';

/**
 * Reusable Add / Edit Product slide-out drawer shared across Retail Shop Mart views.
 */
export default function ShopProductDrawer({
  open,
  onClose,
  editingItem = null,
  formData,
  onChangeFormData,
  categoryOptions = [],
  onSave,
  onDelete,
  saving = false
}) {
  const theme = useTheme();

  const handleLocalFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedBase64 = await compressImageFile(file);
      onChangeFormData((prev) => ({ ...prev, imageUrl: compressedBase64 }));
    } catch (err) {
      console.error('Product image read error:', err);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={Boolean(open)}
      onClose={onClose}
      sx={{
        zIndex: 1300,
        '& .MuiDrawer-paper': {
          width: { xs: '100vw', sm: 380 },
          bgcolor: 'background.paper',
          backgroundImage: 'none',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="h5" fontWeight={700} color="text.primary">
          {editingItem ? 'Edit Shop Product' : 'Add Product to Shop Mart'}
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseOutlined style={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* Form Fields */}
      <Box
        component="form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
          <Stack spacing={2}>
            <TextField
              label="Product Name *"
              required
              fullWidth
              size="small"
              placeholder="e.g. Lawn Mower Rotary Blade"
              value={formData.name || ''}
              onChange={(e) => onChangeFormData((prev) => ({ ...prev, name: e.target.value }))}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 1.5 }}>
              <Autocomplete
                freeSolo
                size="small"
                options={categoryOptions}
                value={formData.category || null}
                inputValue={formData.category || ''}
                onChange={(e, val) => onChangeFormData((prev) => ({ ...prev, category: val || '' }))}
                onInputChange={(e, val, reason) => {
                  if (reason !== 'reset') onChangeFormData((prev) => ({ ...prev, category: val || '' }));
                }}
                renderInput={(params) => <TextField {...params} label="Category" placeholder="General" />}
              />

              <TextField
                select
                label="Unit"
                size="small"
                value={SHOP_UNITS.includes(formData.unit) ? formData.unit : 'PCS'}
                onChange={(e) => onChangeFormData((prev) => ({ ...prev, unit: e.target.value }))}
              >
                {SHOP_UNITS.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Price (PKR) *"
                type="number"
                fullWidth
                size="small"
                placeholder="0"
                inputProps={{ min: 0, step: 'any' }}
                value={formData.unitPrice ?? ''}
                onChange={(e) => onChangeFormData((prev) => ({ ...prev, unitPrice: e.target.value }))}
              />
              <TextField
                label="Stock Qty *"
                type="number"
                fullWidth
                size="small"
                placeholder="0"
                inputProps={{ min: 0 }}
                value={formData.totalStock ?? ''}
                onChange={(e) => onChangeFormData((prev) => ({ ...prev, totalStock: e.target.value }))}
              />
            </Box>

            <TextField
              label="Specification / Note (Optional)"
              fullWidth
              size="small"
              placeholder="e.g. Heavy duty hardened steel"
              value={formData.specification || ''}
              onChange={(e) => onChangeFormData((prev) => ({ ...prev, specification: e.target.value }))}
            />

            {/* Product Image Picker */}
            <Box sx={getSubSurfaceSx(theme, { p: 2, borderStyle: 'dashed' })}>
              <Typography
                variant="caption"
                fontWeight={700}
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1.25 }}
              >
                Product Picture (Optional)
              </Typography>

              <AppButton
                fullWidth
                component="label"
                intent="secondary"
                size="small"
                startIcon={<UploadOutlined />}
                sx={{ mb: 0.75 }}
              >
                Choose Picture from PC
                <input type="file" hidden accept="image/*" onChange={handleLocalFileUpload} />
              </AppButton>
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mb: 1.25 }}>
                JPG, PNG or WEBP from your computer
              </Typography>

              <Divider sx={{ my: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  OR IMAGE LINK
                </Typography>
              </Divider>

              <TextField
                label="Photo / Image URL"
                fullWidth
                size="small"
                placeholder="https://..."
                value={formData.imageUrl || ''}
                onChange={(e) => onChangeFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                sx={{ mt: 1 }}
              />

              {formData.imageUrl && (
                <Box
                  sx={{
                    mt: 1.5,
                    position: 'relative',
                    width: '100%',
                    height: 120,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    component="img"
                    src={formData.imageUrl}
                    alt="Preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    sx={{ width: '100%', height: '100%', objectFit: 'contain', bgcolor: 'background.paper' }}
                  />
                  <AppButton
                    size="small"
                    intent="danger"
                    onClick={() => onChangeFormData((prev) => ({ ...prev, imageUrl: '' }))}
                    sx={{ position: 'absolute', top: 6, right: 6, height: 26, px: 1, fontSize: '0.72rem' }}
                  >
                    Remove
                  </AppButton>
                </Box>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Drawer Footer */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          {editingItem && onDelete ? (
            <AppButton intent="danger-outlined" size="small" startIcon={<DeleteOutlined />} onClick={onDelete} disabled={saving}>
              Delete
            </AppButton>
          ) : (
            <Box />
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AppButton intent="cancel" size="small" onClick={onClose} disabled={saving}>
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              intent="primary"
              size="small"
              loading={saving}
              loadingText="Saving..."
              disabled={!(formData.name || '').trim()}
            >
              {editingItem ? 'Update Product' : 'Save Product'}
            </AppButton>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}

ShopProductDrawer.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  editingItem: PropTypes.object,
  formData: PropTypes.object.isRequired,
  onChangeFormData: PropTypes.func.isRequired,
  categoryOptions: PropTypes.arrayOf(PropTypes.string),
  onSave: PropTypes.func.isRequired,
  onDelete: PropTypes.func,
  saving: PropTypes.bool
};

