import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const Parts = () => {
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPart, setEditingPart] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState({ lowStock: [], outOfStock: [], critical: [], summary: {} });
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    part_number: '',
    category: '',
    stock_quantity: '',
    cost_price: '',
    selling_price: '',
    gst_rate: '',
    supplier: '',
    rack_location: '',
    min_stock_level: ''
  });

  useEffect(() => {
    fetchParts();
    fetchLowStockAlerts();
  }, []);

  // Search effect
  useEffect(() => {
    let filtered = parts;

    // Apply low stock filter
    if (showLowStockOnly) {
      filtered = filtered.filter(part => part.stock_quantity <= part.min_stock_level);
    }

    // Apply comprehensive search filter across all columns
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(part =>
        part.name.toLowerCase().includes(searchLower) ||
        part.part_number.toLowerCase().includes(searchLower) ||
        part.category.toLowerCase().includes(searchLower) ||
        part.supplier.toLowerCase().includes(searchLower) ||
        part.rack_location?.toLowerCase().includes(searchLower) ||
        part.stock_quantity.toString().includes(searchTerm) ||
        part.cost_price?.toString().includes(searchTerm) ||
        part.selling_price.toString().includes(searchTerm) ||
        part.gst_rate.toString().includes(searchTerm) ||
        part.min_stock_level.toString().includes(searchTerm)
      );
    }

    setFilteredParts(filtered);
  }, [parts, searchTerm, showLowStockOnly]);

  const fetchParts = async () => {
    try {
      console.log('Fetching parts from API...');
      const response = await axios.get('/api/parts/');
      console.log('API response:', response.data);
      
      if (response.data.success && response.data.data) {
        // Map the data to include id field for DataGrid
        const partsWithId = response.data.data.map(part => ({
          ...part,
          id: part._id || part.id
        }));
        setParts(partsWithId);
      } else {
        setParts([]);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch parts from server',
        severity: 'error'
      });
      setParts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockAlerts = async () => {
    try {
      const response = await axios.get('/api/parts/alerts/low-stock');
      if (response.data.success) {
        setLowStockAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching low stock alerts:', error);
    }
  };

  const handleOpenDialog = (part = null) => {
    if (part) {
      setEditingPart(part);
      setFormData({
        name: part.name,
        part_number: part.part_number,
        category: part.category,
        stock_quantity: part.stock_quantity,
        cost_price: part.cost_price || '',
        selling_price: part.selling_price,
        gst_rate: part.gst_rate || '',
        supplier: part.supplier,
        rack_location: part.rack_location || '',
        min_stock_level: part.min_stock_level
      });
    } else {
      setEditingPart(null);
      setFormData({
        name: '',
        part_number: '',
        category: '',
        stock_quantity: '',
        cost_price: '',
        selling_price: '',
        gst_rate: '',
        supplier: '',
        rack_location: '',
        min_stock_level: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPart(null);
    setFormData({
      name: '',
      part_number: '',
      category: '',
      stock_quantity: '',
      cost_price: '',
      selling_price: '',
      gst_rate: '',
      supplier: '',
      rack_location: '',
      min_stock_level: ''
    });
  };

  const handleSubmit = async () => {
    try {
      console.log('🔍 Frontend form data before conversion:', formData);
      
      // Validate required fields
      if (!formData.cost_price || formData.cost_price === '' || isNaN(Number(formData.cost_price))) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid cost price',
          severity: 'error'
        });
        return;
      }
      
      // Convert string values to numbers for numeric fields with proper validation
      const submitData = {
        ...formData,
        stock_quantity: formData.stock_quantity && !isNaN(Number(formData.stock_quantity)) ? Number(formData.stock_quantity) : 0,
        cost_price: formData.cost_price && !isNaN(Number(formData.cost_price)) ? Number(formData.cost_price) : 0,
        selling_price: formData.selling_price && !isNaN(Number(formData.selling_price)) ? Number(formData.selling_price) : 0,
        gst_rate: formData.gst_rate && !isNaN(Number(formData.gst_rate)) ? Number(formData.gst_rate) : 18,
        min_stock_level: formData.min_stock_level && !isNaN(Number(formData.min_stock_level)) ? Number(formData.min_stock_level) : 5
      };

      console.log('🔍 Frontend submit data after conversion:', submitData);
      console.log('🔍 Cost price specifically:', {
        original: formData.cost_price,
        converted: submitData.cost_price,
        isValid: !isNaN(submitData.cost_price) && submitData.cost_price > 0
      });

      if (editingPart) {
        console.log('🔄 Updating part:', editingPart.id);
        const response = await axios.put(`/api/parts/update/${editingPart.id}`, submitData);
        if (response.data.success) {
          console.log('✅ Part updated successfully:', response.data.data);
          setSnackbar({ open: true, message: 'Part updated successfully!', severity: 'success' });
        }
      } else {
        console.log('➕ Adding new part');
        const response = await axios.post('/api/parts/add', submitData);
        if (response.data.success) {
          console.log('✅ Part added successfully:', response.data.data);
          setSnackbar({ open: true, message: 'Part added successfully!', severity: 'success' });
        }
      }
      
      handleCloseDialog();
      fetchParts();
      fetchLowStockAlerts();
    } catch (error) {
      console.error('❌ Submit error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Operation failed',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      try {
        const response = await axios.delete(`/api/parts/delete/${id}`);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Part deleted successfully!', severity: 'success' });
          fetchParts();
          fetchLowStockAlerts();
        }
      } catch (error) {
        console.error('Delete error:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Delete failed',
          severity: 'error'
        });
      }
    }
  };

  const columns = [
    { field: 'name', headerName: 'Part Name', flex: 1, minWidth: 150 },
    { field: 'part_number', headerName: 'Part Number', width: 130 },
    { field: 'category', headerName: 'Category', width: 120 },
    { field: 'rack_location', headerName: 'Rack', width: 100 },
    {
      field: 'stock_quantity',
      headerName: 'Quantity',
      width: 100,
      type: 'number',
      renderCell: (params) => {
        const stockLevel = params.value;
        const minLevel = params.row.min_stock_level;
        let color = 'success.main';
        let bgColor = 'success.light';
        
        if (stockLevel === 0) {
          color = 'error.main';
          bgColor = 'error.light';
        } else if (stockLevel <= minLevel) {
          color = 'warning.main';
          bgColor = 'warning.light';
        }
        
        return (
          <Box
            sx={{
              backgroundColor: bgColor,
              color: color,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 'bold',
              minWidth: '60px',
              textAlign: 'center'
            }}
          >
            {stockLevel}
          </Box>
        );
      }
    },
    {
      field: 'cost_price',
      headerName: 'Cost (₹)',
      width: 110,
      type: 'number',
      valueFormatter: (params) => {
        const value = params.value;
        if (value != null && value !== undefined && !isNaN(value) && value !== '') {
          return `₹${Number(value).toFixed(2)}`;
        }
        return '₹0.00';
      },
      renderCell: (params) => {
        const value = params.value;
        const displayValue = (value != null && value !== undefined && !isNaN(value) && value !== '')
          ? `₹${Number(value).toFixed(2)}`
          : '₹0.00';
        
        return (
          <Box sx={{
            color: (value == null || value === undefined || value === 0) ? 'error.main' : 'text.primary',
            fontWeight: (value == null || value === undefined || value === 0) ? 'normal' : 'medium'
          }}>
            {displayValue}
          </Box>
        );
      }
    },
    { field: 'selling_price', headerName: 'Selling (₹)', width: 120, type: 'number',
      valueFormatter: (params) => {
        if (params.value != null && !isNaN(params.value)) {
          return `₹${Number(params.value).toFixed(2)}`;
        }
        return '₹0.00';
      } },
    { field: 'gst_rate', headerName: 'GST %', width: 80, type: 'number',
      valueFormatter: (params) => {
        if (params.value != null && !isNaN(params.value)) {
          return `${Number(params.value)}%`;
        }
        return '0%';
      } },
    { field: 'gst_amount', headerName: 'GST Amount (₹)', width: 130, type: 'number',
      valueFormatter: (params) => {
        if (params.value != null && !isNaN(params.value)) {
          return `₹${Number(params.value).toFixed(2)}`;
        }
        return '₹0.00';
      } },
    { field: 'supplier', headerName: 'Supplier', width: 150 },
    { field: 'min_stock_level', headerName: 'Min Stock', width: 100, type: 'number' },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Button
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Parts Inventory
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Part
        </Button>
      </Box>

      {/* Search Section */}
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          label="Search Parts"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 350 }}
          placeholder="Search by name, part number, category, rack, supplier, cost, selling price, stock..."
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              color="warning"
            />
          }
          label="Show Low Stock Only"
        />
        
        {lowStockAlerts.summary.totalAlerts > 0 && (
          <Alert severity="warning" sx={{ ml: 2 }}>
            {lowStockAlerts.summary.totalOutOfStock} out of stock, {lowStockAlerts.summary.totalLowStock} low stock
          </Alert>
        )}
        
        <Typography variant="body2" color="textSecondary">
          Showing {filteredParts.length} of {parts.length} parts
        </Typography>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredParts}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0'
            }
          }}
        />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPart ? 'Edit Part' : 'Add New Part'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Part Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Part Number"
                  name="part_number"
                  value={formData.part_number}
                  onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    label="Category"
                  >
                    <MenuItem value="Brakes">Brakes</MenuItem>
                    <MenuItem value="Engine">Engine</MenuItem>
                    <MenuItem value="Exterior">Exterior</MenuItem>
                    <MenuItem value="Interior">Interior</MenuItem>
                    <MenuItem value="Suspension">Suspension</MenuItem>
                    <MenuItem value="Electrical">Electrical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rack Location"
                  name="rack_location"
                  value={formData.rack_location}
                  onChange={(e) => setFormData({ ...formData, rack_location: e.target.value })}
                  required
                  placeholder="e.g., A1, B2, C3"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cost Price (₹)"
                  name="cost_price"
                  type="number"
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  required
                  helperText="Purchase/Cost price"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Selling Price (₹)"
                  name="selling_price"
                  type="number"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GST Rate (%)"
                  name="gst_rate"
                  type="number"
                  value={formData.gst_rate}
                  onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                  required
                  helperText="Enter GST percentage (e.g., 18 for 18%)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Minimum Stock Level"
                  name="min_stock_level"
                  type="number"
                  value={formData.min_stock_level}
                  onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                  required
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingPart ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Parts;
