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
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AddCircle as AddCircleIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const JobCards = () => {
  const navigate = useNavigate();
  const [jobCards, setJobCards] = useState([]);
  const [filteredJobCards, setFilteredJobCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJobCard, setEditingJobCard] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    service_type: '',
    complaint: '',
    discount: '',
    mechanic_assigned: '',
    notes: '',
    priority: 'Medium',
    estimated_completion: ''
  });

  const [selectedParts, setSelectedParts] = useState([]);
  const [newPart, setNewPart] = useState({
    part_id: '',
    quantity: 1
  });

  const [laborEntries, setLaborEntries] = useState([]);
  const [newLabor, setNewLabor] = useState({
    labor_type: '',
    total_amount: ''
  });

  useEffect(() => {
    fetchJobCards();
    fetchCustomers();
    fetchParts();
  }, []);

  // Filter job cards based on search term
  useEffect(() => {
    let filtered = jobCards;
    
    // Apply comprehensive search filter across all columns
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(jobCard =>
        jobCard.job_card_number?.toLowerCase().includes(searchLower) ||
        jobCard.customer_name?.toLowerCase().includes(searchLower) ||
        jobCard.customer_phone?.includes(searchTerm) ||
        jobCard.vehicle_info?.toLowerCase().includes(searchLower) ||
        jobCard.service_type?.toLowerCase().includes(searchLower) ||
        jobCard.status?.toLowerCase().includes(searchLower) ||
        jobCard.priority?.toLowerCase().includes(searchLower) ||
        jobCard.complaint?.toLowerCase().includes(searchLower) ||
        jobCard.mechanic_assigned?.toLowerCase().includes(searchLower) ||
        jobCard.notes?.toLowerCase().includes(searchLower) ||
        jobCard.total_amount?.toString().includes(searchTerm) ||
        jobCard.discount?.toString().includes(searchTerm) ||
        (jobCard.parts_used && jobCard.parts_used.some(part =>
          part.part_name?.toLowerCase().includes(searchLower) ||
          part.part_number?.toLowerCase().includes(searchLower)
        )) ||
        (jobCard.labor_entries && jobCard.labor_entries.some(labor =>
          labor.labor_type?.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    setFilteredJobCards(filtered);
  }, [jobCards, searchTerm]);

  const fetchJobCards = async () => {
    try {
      console.log('Fetching job cards from API...');
      const response = await axios.get('/api/jobcards/');
      console.log('Job Cards API response:', response.data);
      
      if (response.data.success && response.data.data) {
        const jobCardsWithId = response.data.data.map(jobCard => ({
          ...jobCard,
          id: jobCard._id || jobCard.id
        }));
        setJobCards(jobCardsWithId);
        setFilteredJobCards(jobCardsWithId);
      } else {
        setJobCards([]);
        setFilteredJobCards([]);
      }
    } catch (error) {
      console.error('Error fetching job cards:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch job cards from server',
        severity: 'error'
      });
      setJobCards([]);
      setFilteredJobCards([]);
    } finally {
      setLoading(false);
    }
  };
  // calculation of labor and total
  

  const fetchCustomers = async () => {
    try {
      const response = await axios.get('/api/customers/');
      if (response.data.success && response.data.data) {
        setCustomers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchParts = async () => {
    try {
      const response = await axios.get('/api/parts/');
      if (response.data.success && response.data.data) {
        setParts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  const handleOpenDialog = (jobCard = null) => {
    if (jobCard) {
      setEditingJobCard(jobCard);
      setFormData({
      customer_id: jobCard.customer_id?._id || jobCard.customer_id || '',

        service_type: jobCard.service_type || '',
        complaint: jobCard.complaint || '',
        discount: jobCard.discount || '',
        mechanic_assigned: jobCard.mechanic_assigned || '',
        notes: jobCard.notes || '',
        priority: jobCard.priority || 'Medium',
        estimated_completion: jobCard.estimated_completion ? jobCard.estimated_completion.split('T')[0] : ''
      });
      setSelectedParts(jobCard.parts_used || []);
      setLaborEntries(jobCard.labor_entries || []);
    } else {
      setEditingJobCard(null);
      setFormData({
        customer_id: '',
        service_type: '',
        complaint: '',
        discount: '',
        mechanic_assigned: '',
        notes: '',
        priority: 'Medium',
        estimated_completion: ''
      });
      setSelectedParts([]);
      setLaborEntries([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingJobCard(null);
    setSelectedParts([]);
    setLaborEntries([]);
  };

const handleSubmit = async () => {
  try {
    // 👇 Calculate grand total from parts + labor - discount
    const calculateTotalAmount = () => {
      const partsTotal = selectedParts.reduce((sum, part) => sum + (part.total_price || 0), 0);
      const laborTotal = laborEntries.reduce((sum, labor) => sum + (Number(labor.total_amount) || 0), 0);
      const discount = Number(formData.discount) || 0;
      return partsTotal + laborTotal - discount;
    };

    const totalAmount = calculateTotalAmount();

    if (editingJobCard) {
      // For updates, separate general updates from parts updates
      const generalUpdateData = {
        ...formData,
        labor_entries: laborEntries,
        discount: Number(formData.discount) || 0,
        total_amount: totalAmount,   // 👈 added here
      };

      // First, update general job card data (excluding parts)
      const generalResponse = await axios.put(`/api/jobcards/update/${editingJobCard.id}`, generalUpdateData);
      
      if (generalResponse.data.success) {
        // Check if parts have changed
        const originalParts = editingJobCard.parts_used || [];
        const currentParts = selectedParts;
        
        // Simple comparison - if lengths differ or any part is different, update parts
        const partsChanged = originalParts.length !== currentParts.length ||
          !originalParts.every((origPart, index) => {
            const currPart = currentParts[index];
            return currPart &&
                   (origPart.part_id === currPart.part_id || origPart.part_id === currPart._id) &&
                   origPart.quantity === currPart.quantity;
          });

        if (partsChanged) {
          console.log('Parts have changed, updating parts separately...');
          // Update parts separately using the new endpoint with 'edit' mode
          const partsData = {
            parts_used: selectedParts.map(part => ({
              part_id: part.part_id || part._id,
              part_name: part.part_name,
              part_number: part.part_number,
              quantity: part.quantity,
              unit_price: part.unit_price,
              total_price: part.total_price
            })),
            update_mode: 'edit' // Use edit mode to only subtract new/increased parts from inventory
          };

          const partsResponse = await axios.put(`/api/jobcards/update-parts/${editingJobCard.id}`, partsData);
          if (partsResponse.data.success) {
            setSnackbar({ open: true, message: 'Job card and parts updated successfully!', severity: 'success' });
          }
        } else {
          setSnackbar({ open: true, message: 'Job card updated successfully!', severity: 'success' });
        }
      }
    } else {
      // For creation, send everything together as before
      const submitData = {
        ...formData,
        labor_entries: laborEntries,
        discount: Number(formData.discount) || 0,
        parts_used: selectedParts.map(part => ({
          part_id: part.part_id || part._id,
          quantity: part.quantity
        })),
        total_amount: totalAmount,   // 👈 added here
      };

      const response = await axios.post('/api/jobcards/create', submitData);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Job card created successfully!', severity: 'success' });
      }
    }
    
    handleCloseDialog();
    fetchJobCards();
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
    if (window.confirm('Are you sure you want to delete this job card?')) {
      try {
        const response = await axios.delete(`/api/jobcards/delete/${id}`);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Job card deleted successfully!', severity: 'success' });
          fetchJobCards();
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

  const generateBill = async (jobCard) => {
    try {
      // First try to generate bill from job card
      const response = await axios.post(`/api/billing/from-jobcard/${jobCard.id}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Bill generated successfully! Job card has been removed. Navigating to billing page...',
          severity: 'success'
        });
        
        // Refresh job cards list since the job card was deleted
        fetchJobCards();
        
        // Navigate to billing page with job card data
        navigate('/billing', {
          state: {
            jobCard: jobCard,
            fromJobCard: true
          }
        });
      }
    } catch (error) {
      console.error('Generate bill error:', error);
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        setSnackbar({
          open: true,
          message: 'Bill already exists. Job card has been removed. Navigating to billing page...',
          severity: 'warning'
        });
        
        // Refresh job cards list since the job card was deleted
        fetchJobCards();
        
        // Navigate to billing page even if bill exists
        navigate('/billing', {
          state: {
            jobCard: jobCard,
            fromJobCard: true
          }
        });
      } else {
        // If there's an error, still navigate to billing page to create manually
        setSnackbar({
          open: true,
          message: 'Navigating to billing page to create bill manually...',
          severity: 'info'
        });
        navigate('/billing', {
          state: {
            jobCard: jobCard,
            fromJobCard: true
          }
        });
      }
    }
  };

  const addPartToJobCard = () => {
    if (!newPart.part_id || newPart.quantity <= 0) {
      setSnackbar({
        open: true,
        message: 'Please select a part and enter valid quantity',
        severity: 'error'
      });
      return;
    }

    const selectedPartData = parts.find(p => p._id === newPart.part_id);
    if (!selectedPartData) return;

    const partToAdd = {
      part_id: selectedPartData._id,
      part_name: selectedPartData.name,
      part_number: selectedPartData.part_number,
      quantity: newPart.quantity,
      unit_price: selectedPartData.selling_price,
      total_price: selectedPartData.selling_price * newPart.quantity
    };

    setSelectedParts([...selectedParts, partToAdd]);
    setNewPart({ part_id: '', quantity: 1 });
  };

  const removePartFromJobCard = (index) => {
    const updatedParts = selectedParts.filter((_, i) => i !== index);
    setSelectedParts(updatedParts);
  };

  const addLaborEntry = () => {
    if (!newLabor.labor_type || !newLabor.total_amount || newLabor.total_amount <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter labor type and valid total amount',
        severity: 'error'
      });
      return;
    }

    const laborToAdd = {
      labor_type: newLabor.labor_type,
      total_amount: Number(newLabor.total_amount)
    };

    setLaborEntries([...laborEntries, laborToAdd]);
    setNewLabor({ labor_type: '', total_amount: '' });
  };

  const removeLaborEntry = (index) => {
    const updatedLabor = laborEntries.filter((_, i) => i !== index);
    setLaborEntries(updatedLabor);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'primary';
      case 'In Progress': return 'warning';
      case 'Completed': return 'success';
      case 'Delivered': return 'info';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      case 'Urgent': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    { field: 'job_card_number', headerName: 'Job Card #', width: 130 },
    { field: 'customer_name', headerName: 'Customer', width: 150 },
    { field: 'customer_phone', headerName: 'Phone', width: 130 },
    { field: 'vehicle_info', headerName: 'Vehicle', width: 150 },
    { field: 'service_type', headerName: 'Service Type', width: 130 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      width: 120,
      valueFormatter: (params) => {
        if (params.value != null && !isNaN(params.value)) {
          return `₹${Number(params.value).toFixed(2)}`;
        }
        return '₹0.00';
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            onClick={() => handleOpenDialog(params.row)}
            color="primary"
            title="Edit Job Card"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="success"
            onClick={() => generateBill(params.row)}
            title="Generate Bill"
          >
            <ReceiptIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDelete(params.row.id)}
            title="Delete Job Card"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Job Cards
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Job Card
        </Button>
      </Box>

      {/* Search Section */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <TextField
          label="Search Job Cards"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 400 }}
          placeholder="Search by job card #, customer, phone, vehicle, service type, status, priority, amount..."
        />
        <Typography variant="body2" color="textSecondary">
          Showing {filteredJobCards.length} of {jobCards.length} job cards
        </Typography>
      </Box>

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={filteredJobCards}
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

      {/* Create/Edit Job Card Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingJobCard ? 'Edit Job Card' : 'Create New Job Card'}
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              {/* Customer Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    label="Customer"
                    required
                      disabled={!!editingJobCard}
                  >
                    {customers.map((customer) => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.first_name} {customer.last_name} - {customer.phone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Service Type */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Service Type</InputLabel>
                  <Select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                    label="Service Type"
                    required
                  >
                    <MenuItem value="General Service">General Service</MenuItem>
                    <MenuItem value="Oil Change">Oil Change</MenuItem>
                    <MenuItem value="Brake Service">Brake Service</MenuItem>
                    <MenuItem value="Engine Repair">Engine Repair</MenuItem>
                    <MenuItem value="AC Service">AC Service</MenuItem>
                    <MenuItem value="Tire Service">Tire Service</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Complaint */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Customer Complaint"
                  multiline
                  rows={2}
                  value={formData.complaint}
                  onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                  required
                />
              </Grid>


              {/* Labor Entries Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Labor Entries
                </Typography>
                
                {/* Add Labor Entry */}
                <Box display="flex" gap={2} alignItems="center" mb={2}>
                  <TextField
                    label="Labor Type"
                    value={newLabor.labor_type}
                    onChange={(e) => setNewLabor({ ...newLabor, labor_type: e.target.value })}
                    sx={{ minWidth: 200 }}
                    placeholder="e.g., Engine Repair, Oil Change"
                  />
                  
                  <TextField
                    label="Total Amount (₹)"
                    type="number"
                    value={newLabor.total_amount}
                    onChange={(e) => setNewLabor({ ...newLabor, total_amount: e.target.value })}
                    sx={{ width: 150 }}
                    inputProps={{ min: 0 }}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddCircleIcon />}
                    onClick={addLaborEntry}
                  >
                    Add Labor
                  </Button>
                </Box>

                {/* Labor Entries Table */}
                {laborEntries.length > 0 && (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Labor Type</TableCell>
                          <TableCell align="right">Total Amount</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {laborEntries.map((labor, index) => (
                          <TableRow key={index}>
                            <TableCell>{labor.labor_type}</TableCell>
                            <TableCell align="right">₹{labor.total_amount}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removeLaborEntry(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell><strong>Total Labor Cost</strong></TableCell>
                          <TableCell align="right">
                            <strong>₹{laborEntries.reduce((total, labor) => total + labor.total_amount, 0)}</strong>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>

              {/* Priority and Mechanic */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    label="Priority"
                  >
                    <MenuItem value="Low">Low</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mechanic Assigned"
                  value={formData.mechanic_assigned}
                  onChange={(e) => setFormData({ ...formData, mechanic_assigned: e.target.value })}
                />
              </Grid>

              {/* Estimated Completion */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estimated Completion"
                  type="date"
                  value={formData.estimated_completion}
                  onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Discount */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Discount (₹)"
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                />
              </Grid>

              {/* Notes */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>

              {/* Parts Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Parts Used
                </Typography>
                
                {/* Add Parts */}
                <Box display="flex" gap={2} alignItems="center" mb={2}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Select Part</InputLabel>
                    <Select
                      value={newPart.part_id}
                      onChange={(e) => setNewPart({ ...newPart, part_id: e.target.value })}
                      label="Select Part"
                    >
                      {parts.map((part) => (
                        <MenuItem key={part._id} value={part._id}>
                          {part.name} - {part.part_number} (Stock: {part.stock_quantity})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Quantity"
                    type="number"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart({ ...newPart, quantity: Number(e.target.value) })}
                    sx={{ width: 100 }}
                    inputProps={{ min: 1 }}
                  />
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddCircleIcon />}
                    onClick={addPartToJobCard}
                  >
                    Add Part
                  </Button>
                </Box>

                {/* Selected Parts Table */}
                {selectedParts.length > 0 && (
                  <TableContainer component={Paper} sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Part Name</TableCell>
                          <TableCell>Part Number</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedParts.map((part, index) => (
                          <TableRow key={index}>
                            <TableCell>{part.part_name}</TableCell>
                            <TableCell>{part.part_number}</TableCell>
                            <TableCell align="right">{part.quantity}</TableCell>
                            <TableCell align="right">₹{part.unit_price}</TableCell>
                            <TableCell align="right">₹{part.total_price}</TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => removePartFromJobCard(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingJobCard ? 'Update' : 'Create'}
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

export default JobCards;