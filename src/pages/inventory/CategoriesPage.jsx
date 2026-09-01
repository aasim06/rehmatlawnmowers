import { useState } from 'react';
import { useStoreInventory } from 'context/StoreInventoryContext';

// material-ui
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Drawer,
  Grid,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Stack,
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
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined, AppstoreOutlined } from '@ant-design/icons';

// project imports
import MainCard from 'components/MainCard';

export default function CategoriesPage() {
  const { categories = [], addCategory, updateCategory, deleteCategory, deleteMultipleCategories } = useStoreInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState([]);

  // Add Category Drawer State
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  // Edit Category Drawer State
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Single Delete Confirmation Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Bulk Delete Confirmation Dialog State
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  const filteredCategories = categories.filter((c) => {
    return (
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Checkbox Selection Handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredCategories.map((c) => c.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Submit Add Handler
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;
    addCategory(newCategory);
    setNewCategory({ name: '', description: '' });
    setAddDrawerOpen(false);
  };

  // Submit Edit Handler
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;
    updateCategory(editingCategory.id, editingCategory);
    setEditDrawerOpen(false);
    setEditingCategory(null);
  };

  // Single Delete Confirm Handler
  const handleConfirmSingleDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      setSelected((prev) => prev.filter((id) => id !== categoryToDelete.id));
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  // Bulk Delete Confirm Handler
  const handleConfirmBulkDelete = () => {
    if (selected.length > 0) {
      deleteMultipleCategories(selected);
      setSelected([]);
    }
    setBulkDeleteDialogOpen(false);
  };

  return (
    <MainCard
      title="Categories Directory"
      secondary={
        <Stack direction="row" spacing={1.5}>
          {selected.length > 0 && (
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              Delete Selected ({selected.length})
            </Button>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusOutlined />}
            onClick={() => setAddDrawerOpen(true)}
          >
            + Add Category
          </Button>
        </Stack>
      }
    >
      {/* Search Bar Controls */}
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Grid item xs={12} sm={6}>
          <OutlinedInput
            fullWidth
            placeholder="Search categories by Name or Description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />
        </Grid>

        <Grid item xs={12} sm={6} sx={{ textAlign: 'right' }}>
          <Typography variant="caption" color="textSecondary">
            {selected.length > 0 ? (
              <strong style={{ color: '#52c41a' }}>{selected.length} selected</strong>
            ) : (
              `Total ${filteredCategories.length} Categories`
            )}
          </Typography>
        </Grid>
      </Grid>

      {/* Categories Table */}
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < filteredCategories.length}
                  checked={filteredCategories.length > 0 && selected.length === filteredCategories.length}
                  onChange={handleSelectAllClick}
                  inputProps={{ 'aria-label': 'select all categories' }}
                />
              </TableCell>
              <TableCell>Category ID</TableCell>
              <TableCell>Category Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="textSecondary">
                    No categories found. Click "+ Add Category" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((c) => {
                const isCategorySelected = isSelected(c.id);

                return (
                  <TableRow key={c.id} hover selected={isCategorySelected}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isCategorySelected}
                        onChange={(e) => handleSelectOne(e, c.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {c.id}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                        🏷️ {c.name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {c.description || '-'}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Edit Category">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => {
                              setEditingCategory(c);
                              setEditDrawerOpen(true);
                            }}
                          >
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Category">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => {
                              setCategoryToDelete(c);
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

      {/* Drawer 1: Add Category */}
      <Drawer anchor="right" open={addDrawerOpen} onClose={() => setAddDrawerOpen(false)}>
        <Box sx={{ width: 420, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            🏷️ Add New Category
          </Typography>

          <form onSubmit={handleAddSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Category Name"
                fullWidth
                required
                placeholder="e.g. Electrical & Motors"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={4}
                placeholder="Enter category description or usage scope..."
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              />

              <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                <Button variant="outlined" color="secondary" onClick={() => setAddDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button variant="contained" type="submit">
                  Save Category
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Drawer>

      {/* Drawer 2: Edit Category */}
      <Drawer anchor="right" open={editDrawerOpen} onClose={() => setEditDrawerOpen(false)}>
        <Box sx={{ width: 420, p: 3 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Edit Category Details
          </Typography>

          {editingCategory && (
            <form onSubmit={handleEditSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Category ID"
                  fullWidth
                  disabled
                  value={editingCategory.id}
                />

                <TextField
                  label="Category Name"
                  fullWidth
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                />

                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={editingCategory.description}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 2 }}>
                  <Button variant="outlined" color="secondary" onClick={() => setEditDrawerOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" color="primary" type="submit">
                    Update Category
                  </Button>
                </Stack>
              </Stack>
            </form>
          )}
        </Box>
      </Drawer>

      {/* Modal 3: Confirm Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete Category Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete category <strong>"{categoryToDelete?.name}"</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmSingleDelete} variant="contained" color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal 4: Confirm Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>
          🗑️ Delete All Selected Categories Confirmation
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete all <strong>{selected.length} selected categories</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmBulkDelete} variant="contained" color="error">
            Delete All {selected.length} Categories
          </Button>
        </DialogActions>
      </Dialog>
    </MainCard>
  );
}
