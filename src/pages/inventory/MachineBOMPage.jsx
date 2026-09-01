import { useState } from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

// ant design icons
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import EditOutlined from '@ant-design/icons/EditOutlined';
import BuildOutlined from '@ant-design/icons/BuildOutlined';
import ToolOutlined from '@ant-design/icons/ToolOutlined';
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined';
import SearchOutlined from '@ant-design/icons/SearchOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import WarningOutlined from '@ant-design/icons/WarningOutlined';

import MainCard from 'components/MainCard';
import { useStoreInventory } from 'context/StoreInventoryContext';

export default function MachineBOMPage() {
  const {
    machineModels,
    machineRecipes,
    masterItemNames,
    items,
    saveMachineRecipe,
    deleteMachineRecipe,
    assembleMachine
  } = useStoreInventory();

  // Search Filter State
  const [searchTerm, setSearchTerm] = useState('');

  // View Details Modal State
  const [viewRecipeModalOpen, setViewRecipeModalOpen] = useState(false);
  const [selectedRecipeForView, setSelectedRecipeForView] = useState(null);

  // Recipe Form Modal State
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeForm, setRecipeForm] = useState({
    modelName: '',
    description: '',
    ingredients: [{ itemName: '', qty: 1, unit: 'pcs' }]
  });

  // Assemble Production Modal State
  const [assembleModalOpen, setAssembleModalOpen] = useState(false);
  const [selectedRecipeForBuild, setSelectedRecipeForBuild] = useState(null);
  const [buildQty, setBuildQty] = useState(1);
  const [buildSuccessAlert, setBuildSuccessAlert] = useState(null);

  // Filtered Recipes
  const filteredRecipes = machineRecipes.filter((r) => {
    const matchesModel = r.modelName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIngredient = r.ingredients.some((ing) =>
      ing.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesModel || matchesIngredient;
  });

  // Helper to find live store stock for an item name
  const getLiveItemStock = (itemName) => {
    const matched = items.find((i) => (i.name || '').toLowerCase() === (itemName || '').toLowerCase());
    return matched ? matched.remainingStock : 0;
  };

  // Calculate maximum machines that can be assembled based on current store stock limits
  const getMaxManufacturableQty = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return 0;
    let minPossible = Infinity;
    ingredients.forEach((ing) => {
      const liveStock = getLiveItemStock(ing.itemName);
      const reqQtyPerMachine = parseFloat(ing.qty) || 1;
      const maxPossibleForThisIngredient = Math.floor(liveStock / reqQtyPerMachine);
      if (maxPossibleForThisIngredient < minPossible) {
        minPossible = maxPossibleForThisIngredient;
      }
    });
    return minPossible === Infinity ? 0 : minPossible;
  };

  // Master Items names list for autocomplete
  const itemOptions = Array.from(
    new Set([
      ...items.map((i) => i.name),
      ...masterItemNames.map((m) => m.name)
    ])
  ).filter(Boolean);

  // Open View Details Modal
  const handleOpenViewModal = (recipe) => {
    setSelectedRecipeForView(recipe);
    setViewRecipeModalOpen(true);
  };

  // Open Create/Edit Recipe Modal
  const handleOpenRecipeModal = (recipe = null) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setRecipeForm({
        modelName: recipe.modelName,
        description: recipe.description || '',
        ingredients: recipe.ingredients || [{ itemName: '', qty: 1, unit: 'pcs' }]
      });
    } else {
      setEditingRecipe(null);
      setRecipeForm({
        modelName: '',
        description: '',
        ingredients: [{ itemName: '', qty: 1, unit: 'pcs' }]
      });
    }
    setRecipeModalOpen(true);
  };

  // Recipe Ingredient Handlers
  const handleAddIngredientRow = () => {
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { itemName: '', qty: 1, unit: 'pcs' }]
    }));
  };

  const handleRemoveIngredientRow = (index) => {
    if (recipeForm.ingredients.length <= 1) return;
    setRecipeForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, idx) => idx !== index)
    }));
  };

  const handleIngredientChange = (index, field, value) => {
    setRecipeForm((prev) => {
      const updated = [...prev.ingredients];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ingredients: updated };
    });
  };

  // Save Recipe Handler
  const handleSaveRecipeSubmit = (e) => {
    e.preventDefault();
    if (!recipeForm.modelName.trim()) {
      alert('Please enter Machine Model Name');
      return;
    }
    const validIngredients = recipeForm.ingredients.filter((i) => i.itemName && i.itemName.trim());
    if (validIngredients.length === 0) {
      alert('Please add at least one valid raw material component');
      return;
    }

    saveMachineRecipe({
      id: editingRecipe ? editingRecipe.id : undefined,
      modelName: recipeForm.modelName.trim(),
      description: recipeForm.description.trim(),
      ingredients: validIngredients
    });

    setRecipeModalOpen(false);
  };

  // Open Assemble Modal
  const handleOpenAssembleModal = (recipe) => {
    setSelectedRecipeForBuild(recipe);
    setBuildQty(1);
    setBuildSuccessAlert(null);
    setAssembleModalOpen(true);
  };

  // Execute Machine Production Batch Assembly
  const handleExecuteAssembly = () => {
    if (!selectedRecipeForBuild || buildQty < 1) return;

    const res = assembleMachine(selectedRecipeForBuild.modelName, buildQty);
    if (res.success) {
      setBuildSuccessAlert(`Successfully assembled ${buildQty}x ${selectedRecipeForBuild.modelName}! Raw materials automatically deducted from store stock.`);
      setTimeout(() => {
        setAssembleModalOpen(false);
      }, 2500);
    } else {
      alert(res.message || 'Error during machine assembly.');
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      {/* Header Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h3" fontWeight={700} color="textPrimary">
            Machine Recipes (BOM)
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 0.25 }}>
            Manufactured machine raw part formulas & batch stock deduction
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<PlusOutlined />}
          onClick={() => handleOpenRecipeModal()}
          sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, px: 2.5, py: 1 }}
        >
          + Add New Recipe
        </Button>
      </Box>

      {/* Main Clean Table Card */}
      <MainCard content={false}>
        {/* Search Bar */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <OutlinedInput
            size="small"
            placeholder="Search recipe by machine model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 360 }}
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlined />
              </InputAdornment>
            }
          />
        </Box>

        {/* Master Clean Data Table */}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc') }}>
              <TableRow>
                <TableCell style={{ width: '5%' }}><strong>#</strong></TableCell>
                <TableCell style={{ width: '40%' }}><strong>MACHINE MODEL NAME</strong></TableCell>
                <TableCell align="center" style={{ width: '20%' }}><strong>FORMULA COMPONENTS</strong></TableCell>
                <TableCell align="center" style={{ width: '15%' }}><strong>STATUS</strong></TableCell>
                <TableCell align="right" style={{ width: '20%' }}><strong>ACTIONS</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRecipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1" color="textSecondary">
                      No Machine Recipes Found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecipes.map((recipe, idx) => {
                  const maxBuildable = getMaxManufacturableQty(recipe.ingredients);

                  return (
                    <TableRow key={recipe.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary' }}>{idx + 1}</TableCell>
                      
                      {/* Machine Model Name & Notes */}
                      <TableCell>
                        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                          {recipe.modelName}
                        </Typography>
                        {recipe.description && (
                          <Typography variant="caption" color="textSecondary" display="block">
                            {recipe.description}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Clean Component Count Button */}
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EyeOutlined />}
                          onClick={() => handleOpenViewModal(recipe)}
                          sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600 }}
                        >
                          View Formula ({recipe.ingredients.length} Parts)
                        </Button>
                      </TableCell>

                      {/* Intelligent Production Capacity Status Badge */}
                      <TableCell align="center">
                        <Chip
                          icon={maxBuildable >= 5 ? <CheckCircleOutlined /> : <WarningOutlined />}
                          label={
                            maxBuildable >= 5
                              ? `Ready (${maxBuildable} Machines)`
                              : maxBuildable > 0
                              ? `Low Stock (${maxBuildable} Machines)`
                              : 'Shortage (0 Machines)'
                          }
                          color={maxBuildable >= 5 ? 'success' : maxBuildable > 0 ? 'warning' : 'error'}
                          size="small"
                          sx={{ fontWeight: 700, borderRadius: 1 }}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<BuildOutlined />}
                            onClick={() => handleOpenAssembleModal(recipe)}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, px: 1.5, py: 0.5, fontSize: '0.75rem' }}
                          >
                            Assemble
                          </Button>
                          <Tooltip title="Edit Recipe">
                            <IconButton size="small" onClick={() => handleOpenRecipeModal(recipe)}>
                              <EditOutlined style={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Recipe">
                            <IconButton size="small" color="error" onClick={() => deleteMachineRecipe(recipe.id)}>
                              <DeleteOutlined style={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MainCard>

      {/* VIEW RECIPE PARTS FORMULA MODAL DIALOG */}
      <Dialog
        open={viewRecipeModalOpen}
        onClose={() => setViewRecipeModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 16px 32px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'), borderBottom: '1px solid', borderColor: 'divider' }}>
          {selectedRecipeForView?.modelName} - Formula Parts
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2.5 }}>
          {selectedRecipeForView && (
            <Box>
              {(() => {
                const maxBuildable = getMaxManufacturableQty(selectedRecipeForView.ingredients);
                return (
                  <Alert
                    severity={maxBuildable >= 5 ? 'success' : maxBuildable > 0 ? 'warning' : 'error'}
                    sx={{ mb: 2, fontWeight: 700 }}
                  >
                    ⚡ Factory Production Capacity: Current store stock allows assembling up to <strong>{maxBuildable} full machines</strong> before reordering raw materials.
                  </Alert>
                );
              })()}

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc') }}>
                  <TableRow>
                    <TableCell style={{ width: '8%' }}><strong>#</strong></TableCell>
                    <TableCell><strong>RAW SPARE PART NAME</strong></TableCell>
                    <TableCell align="center"><strong>REQUIRED QTY</strong></TableCell>
                    <TableCell align="right"><strong>STORE STOCK</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedRecipeForView.ingredients.map((ing, idx) => {
                    const liveStock = getLiveItemStock(ing.itemName);
                    const isLow = liveStock < (parseFloat(ing.qty) || 1);

                    return (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                            {ing.itemName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontWeight={700} color="text.primary">
                            {ing.qty} {ing.unit || 'pcs'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${liveStock} ${ing.unit || 'pcs'}`}
                            color={isLow ? 'error' : 'success'}
                            size="small"
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'), borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setViewRecipeModalOpen(false)} sx={{ fontWeight: 600 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* CREATE / EDIT RECIPE MODAL DIALOG */}
      <Dialog
        open={recipeModalOpen}
        onClose={() => setRecipeModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 16px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <form onSubmit={handleSaveRecipeSubmit}>
          <DialogTitle sx={{ fontWeight: 700, fontSize: '1.15rem', bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'), borderBottom: '1px solid', borderColor: 'divider' }}>
            {editingRecipe ? 'Edit Machine Recipe' : 'Add New Machine Recipe'}
          </DialogTitle>
          <DialogContent dividers sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                  MACHINE MODEL NAME *
                </Typography>
                <Autocomplete
                  freeSolo
                  options={machineModels}
                  value={recipeForm.modelName}
                  onChange={(e, val) => setRecipeForm({ ...recipeForm, modelName: val || '' })}
                  onInputChange={(e, val) => setRecipeForm({ ...recipeForm, modelName: val || '' })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="e.g. Rehmat 20 Lawn Mower (Petrol Engine)"
                      required
                      fullWidth
                    />
                  )}
                />
              </Box>

              <Box>
                <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                  DESCRIPTION / NOTES
                </Typography>
                <TextField
                  placeholder="Optional assembly notes..."
                  fullWidth
                  value={recipeForm.description}
                  onChange={(e) => setRecipeForm({ ...recipeForm, description: e.target.value })}
                />
              </Box>

              {/* Recipe Components List */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
                  Raw Material Components Formula ({recipeForm.ingredients.length} Items)
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc') }}>
                      <TableRow>
                        <TableCell style={{ width: '5%' }}><strong>#</strong></TableCell>
                        <TableCell style={{ width: '50%' }}><strong>RAW PART ITEM *</strong></TableCell>
                        <TableCell align="center" style={{ width: '22%' }}><strong>QTY PER MACHINE *</strong></TableCell>
                        <TableCell style={{ width: '18%' }}><strong>UNIT</strong></TableCell>
                        <TableCell align="center" style={{ width: '5%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recipeForm.ingredients.map((ing, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>
                            <Autocomplete
                              freeSolo
                              options={itemOptions}
                              value={ing.itemName}
                              onChange={(e, val) => handleIngredientChange(idx, 'itemName', val || '')}
                              onInputChange={(e, val) => handleIngredientChange(idx, 'itemName', val || '')}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Select or type part..." size="small" required fullWidth />
                              )}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              fullWidth
                              inputProps={{ min: 0.1, step: 0.1, style: { textAlign: 'center' } }}
                              value={ing.qty}
                              onChange={(e) => handleIngredientChange(idx, 'qty', parseFloat(e.target.value) || 1)}
                              required
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="pcs"
                              value={ing.unit}
                              onChange={(e) => handleIngredientChange(idx, 'unit', e.target.value)}
                            />
                          </TableCell>
                          <TableCell align="center">
                            {recipeForm.ingredients.length > 1 && (
                              <IconButton color="error" size="small" onClick={() => handleRemoveIngredientRow(idx)}>
                                <DeleteOutlined style={{ fontSize: '0.9rem' }} />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlusOutlined />}
                  onClick={handleAddIngredientRow}
                  sx={{ mt: 1.5, fontWeight: 700 }}
                >
                  + Add Component
                </Button>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'), borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setRecipeModalOpen(false)} sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, px: 2.5 }}>
              Save Recipe Formula
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* EXECUTE BATCH MACHINE PRODUCTION ASSEMBLY MODAL */}
      <Dialog
        open={assembleModalOpen}
        onClose={() => setAssembleModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 16px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <BuildOutlined /> Execute Machine Batch Assembly
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {selectedRecipeForBuild && (
            <Box>
              <Typography variant="h4" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
                {selectedRecipeForBuild.modelName}
              </Typography>

              {buildSuccessAlert && (
                <Alert icon={<CheckCircleOutlined fontSize="inherit" />} severity="success" sx={{ mb: 2, fontWeight: 700 }}>
                  {buildSuccessAlert}
                </Alert>
              )}

              <Box sx={{ mb: 2.5 }}>
                <Typography variant="caption" fontWeight={700} color="textSecondary" display="block" sx={{ mb: 0.5 }}>
                  PRODUCTION BATCH QUANTITY (MACHINES PRODUCED) *
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  placeholder="e.g. 5"
                  inputProps={{ min: 1 }}
                  value={buildQty}
                  onChange={(e) => setBuildQty(parseInt(e.target.value) || 1)}
                />
              </Box>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.primary' }}>
                Automatic Raw Material Stock Deduction Preview:
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc') }}>
                    <TableRow>
                      <TableCell><strong>PART NAME</strong></TableCell>
                      <TableCell align="center"><strong>STORE STOCK</strong></TableCell>
                      <TableCell align="right"><strong>AFTER DEDUCTION</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRecipeForBuild.ingredients.map((ing, idx) => {
                      const liveStock = getLiveItemStock(ing.itemName);
                      const totalToDeduct = (parseFloat(ing.qty) || 1) * buildQty;
                      const remainingAfter = liveStock - totalToDeduct;
                      const isInsufficient = remainingAfter < 0;

                      return (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {ing.itemName}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{liveStock} {ing.unit || 'pcs'}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${remainingAfter} ${ing.unit || 'pcs'}`}
                              color={isInsufficient ? 'error' : 'success'}
                              size="small"
                              sx={{ fontWeight: 700 }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'), borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setAssembleModalOpen(false)}>Cancel</Button>
          <Button
            onClick={handleExecuteAssembly}
            variant="contained"
            disabled={Boolean(buildSuccessAlert)}
            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, px: 2.5 }}
          >
            ⚡ Confirm & Deduct Stock
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
