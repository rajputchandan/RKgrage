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
  Alert,
  Snackbar,
  Grid
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    vehicle_number: '',
    model_name: '',
    mfg_year: '',
    kilometer: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Search effect
  useEffect(() => {
    let filtered = customers;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(customer => {
        const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
        return fullName.includes(searchLower) ||
               customer.email?.toLowerCase().includes(searchLower) ||
               customer.phone?.includes(searchTerm) ||
               customer.address?.toLowerCase().includes(searchLower) ||
               customer.city?.toLowerCase().includes(searchLower) ||
               customer.state?.toLowerCase().includes(searchLower) ||
               customer.zip_code?.includes(searchTerm) ||
               customer.vehicle_number?.toLowerCase().includes(searchLower) ||
               customer.model_name?.toLowerCase().includes(searchLower) ||
               customer.mfg_year?.toString().includes(searchTerm) ||
               customer.kilometer?.toString().includes(searchTerm);
      });
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm]);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers/');
      if (response.data.success && response.data.data) {
        const customersWithId = response.data.data.map(customer => ({
          ...customer,
          id: customer._id || customer.id
        }));
        setCustomers(customersWithId);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch customers from server',
        severity: 'error'
      });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zip_code: customer.zip_code || '',
        vehicle_number: customer.vehicle_number || '',
        model_name: customer.model_name || '',
        mfg_year: customer.mfg_year || '',
        kilometer: customer.kilometer || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        vehicle_number: '',
        model_name: '',
        mfg_year: '',
        kilometer: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      vehicle_number: '',
      model_name: '',
      mfg_year: '',
      kilometer: ''
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingCustomer) {
        const response = await axios.put(`/api/customers/update/${editingCustomer.id}`, formData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Customer updated successfully!', severity: 'success' });
        }
      } else {
        const response = await axios.post('/api/customers/add', formData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Customer added successfully!', severity: 'success' });
        }
      }
      handleCloseDialog();
      fetchCustomers();
    } catch (error) {
      console.error('Submit error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Operation failed',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await axios.delete(`/api/customers/delete/${id}`);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Customer deleted successfully!', severity: 'success' });
          fetchCustomers();
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
    { 
      field: 'fullName', 
      headerName: 'Name', 
      flex: 1, 
      minWidth: 150,
      valueGetter: (params) => `${params.row.first_name || ''} ${params.row.last_name || ''}`.trim()
    },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'state', headerName: 'State', width: 100 },
    { field: 'vehicle_number', headerName: 'Vehicle No.', width: 150 },
    { field: 'model_name', headerName: 'Model Name', width: 150 },
    { field: 'mfg_year', headerName: 'Mfg Year', width: 120 },
    { field: 'kilometer', headerName: 'Kilometer', width: 120 },
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
          Customers
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Customer
        </Button>
      </Box>

      {/* Search Section */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          label="Search Customers"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 350 }}
          placeholder="Search by name, email, phone, address, vehicle number, model, kilometer..."
        />
        
        <Typography variant="body2" color="textSecondary">
          Showing {filteredCustomers.length} of {customers.length} customers
        </Typography>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredCustomers}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Zip Code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Vehicle Number"
                  name="vehicle_number"
                  value={formData.vehicle_number}
                  onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                  placeholder="e.g., MH12AB1234"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Model Name"
                  name="model_name"
                  value={formData.model_name}
                  onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                  placeholder="e.g., Toyota Camry"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mfg Year"
                  name="mfg_year"
                  type="number"
                  value={formData.mfg_year}
                  onChange={(e) => setFormData({ ...formData, mfg_year: e.target.value })}
                  placeholder="e.g., 2018"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Kilometer"
                  name="kilometer"
                  type="number"
                  value={formData.kilometer}
                  onChange={(e) => setFormData({ ...formData, kilometer: e.target.value })}
                  placeholder="e.g., 50000"
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCustomer ? 'Update' : 'Add'}
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

export default Customers;
