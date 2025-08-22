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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon, Email as EmailIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Billing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [emailDialog, setEmailDialog] = useState({ open: false, customerEmail: '', billNumber: '' });
  const [emailLoading, setEmailLoading] = useState(null); // Track which bill is sending email
  
  // Filter and search states
  const [dateFilter, setDateFilter] = useState('today'); // 'all' or 'today'
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get job card data from navigation state
  const jobCardData = location.state?.jobCard;
  const fromJobCard = location.state?.fromJobCard;

  const [formData, setFormData] = useState({
    customerId: '',
    billNumber: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    laborHours: 0,
    laborRate: 75,
    notes: '',
    paymentStatus: 'pending',
    amountPaid: 0,
    paymentMethod: '',
    partsTotal: 0,
    laborTotal: 0,
    gstEnabled: true,
    cgstRate: 9,
    sgstRate: 9,
    cgstAmount: 0,
    sgstAmount: 0,
    gstAmount: 0,
    totalAmount: 0
  });

  const [currentItem, setCurrentItem] = useState({
    partId: '',
    quantity: 1,
    selling_price: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search effect
  useEffect(() => {
    let filtered = bills;

    // Apply date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(bill => bill.date === today);
    }

    // Apply comprehensive search filter across all columns
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(bill =>
        bill.billNumber.toLowerCase().includes(searchLower) ||
        bill.customerName.toLowerCase().includes(searchLower) ||
        bill.vehicleNumber.toLowerCase().includes(searchLower) ||
        bill.kilometer.toString().includes(searchTerm) ||
        bill.jobCardNumber.toLowerCase().includes(searchLower) ||
        bill.serviceType.toLowerCase().includes(searchLower) ||
        bill.date.includes(searchTerm) ||
        bill.total.toString().includes(searchTerm) ||
        bill.status.toLowerCase().includes(searchLower) ||
        (bill.items && bill.items.some(item =>
          item.item_name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        ))
      );
    }

    setFilteredBills(filtered);
  }, [bills, dateFilter, searchTerm]);

  const fetchData = async () => {
    try {
      const [customersRes, partsRes] = await Promise.all([
        axios.get('/api/customers/'),
        axios.get('/api/parts/')
      ]);
      
      setCustomers(customersRes.data.success ? customersRes.data.data : []);
      setParts(partsRes.data.success ? partsRes.data.data : []);
      console.log(customersRes.data);
      console.log(partsRes.data);
      
      const billsRes = await axios.get('/api/billing/');
      // Map server invoices to grid rows structure expected by the UI
      if (billsRes.data.success && billsRes.data.data) {
        const mapped = billsRes.data.data.map((inv) => ({
          id: inv._id,
          billNumber: inv.invoice_number,
          customerName: `${inv.first_name || ''} ${inv.last_name || ''}`.trim(),
          vehicleNumber: inv.customer_id?.vehicle_number || 'N/A',
          kilometer: inv.customer_id?.kilometer || 0,
          jobCardNumber: inv.jobcard_id?.job_card_number || 'Manual',
          serviceType: inv.jobcard_id?.service_type || 'N/A',
          date: inv.date ? inv.date.slice(0,10) : inv.createdAt?.slice(0,10),
          total: Number(inv.total_amount || 0),
          status: inv.payment_status || "pending",
          partsTotal: inv.parts_total || 0,
          laborTotal: inv.labor_total || 0,
          gstAmount: inv.gst_amount || 0,
          items: inv.items || []
        }));
        setBills(mapped);
      } else {
        setBills([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setCustomers([
        { id: 1, name: 'John Smith' },
        { id: 2, name: 'Sarah Johnson' },
        { id: 3, name: 'Mike Davis' }
      ]);
      setParts([
        { id: 1, name: 'Brake Pads', selling_price: 25.99 },
        { id: 2, name: 'Oil Filter', selling_price: 8.99 },
        { id: 3, name: 'Air Filter', selling_price: 12.99 }
      ]);
      setBills([
        { 
          id: 1, 
          billNumber: 'INV-001', 
          customerName: 'John Smith',
          date: '2024-01-15',
          total_amount: 156.97,
          status: 'paid'
        },
        { 
          id: 2, 
          billNumber: 'INV-002', 
          customerName: 'Sarah Johnson',
          date: '2024-01-16',
          total_amount: 89.98,
          status: 'pending'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (bill = null) => {
    if (bill) {
      try {
        setEditingBill(bill);
        // Fetch full invoice for editing
        const { data: inv } = await axios.get(`/api/billing/${bill.id}`);
        console.log('Full bill data:', inv.data);
        
        const billData = inv.data;
        // eslint-disable-next-line no-unused-vars
        const laborItems = (billData.items || []).filter(i => i.item_type === 'service');
        // eslint-disable-next-line no-unused-vars
        const partItems = (billData.items || []).filter(i => i.item_type === 'part');
        
        // Map all items for display
        const allItems = (billData.items || []).map(i => ({
          id: i._id || Date.now() + Math.random(),
          itemId: i.item_id,
          itemName: i.item_name,
          itemType: i.item_type,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          totalPrice: i.total_price
        }));

        setFormData({
          customerId: billData.customer_id?._id || billData.customer_id || '',
          billNumber: billData.invoice_number || '',
          date: billData.date ? billData.date.slice(0,10) : new Date().toISOString().split('T')[0],
          items: allItems,
          laborHours: 0,
          laborRate: 75,
          notes: billData.notes || '',
          paymentStatus: billData.payment_status || 'pending',
          amountPaid: billData.amount_paid || 0,
          paymentMethod: billData.payment_method || '',
          partsTotal: billData.parts_total || 0,
          laborTotal: billData.labor_total || 0,
          gstEnabled: billData.gst_enabled !== undefined ? billData.gst_enabled : true,
          cgstRate: billData.cgst_rate || 9,
          sgstRate: billData.sgst_rate || 9,
          cgstAmount: billData.cgst_amount || 0,
          sgstAmount: billData.sgst_amount || 0,
          gstAmount: billData.gst_amount || 0,
          totalAmount: billData.total_amount || 0
        });
      } catch (e) {
        console.error('Error fetching bill details:', e);
        // Use the data we already have from the grid
        setFormData({
          customerId: '',
          billNumber: bill.billNumber || '',
          date: bill.date || new Date().toISOString().split('T')[0],
          items: bill.items || [],
          laborHours: 0,
          laborRate: 75,
          notes: '',
          paymentStatus: bill.status || 'pending',
          amountPaid: 0,
          paymentMethod: '',
          partsTotal: bill.partsTotal || 0,
          laborTotal: bill.laborTotal || 0,
          gstEnabled: true,
          cgstRate: 9,
          sgstRate: 9,
          cgstAmount: 0,
          sgstAmount: 0,
          gstAmount: bill.gstAmount || 0,
          totalAmount: bill.total || 0
        });
      }
    } else {
      setEditingBill(null);
      setFormData({
        customerId: '',
        billNumber: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        laborHours: 0,
        laborRate: 75,
        notes: '',
        paymentStatus: 'pending',
        amountPaid: 0,
        paymentMethod: '',
        partsTotal: 0,
        laborTotal: 0,
        gstEnabled: true,
        cgstRate: 9,
        sgstRate: 9,
        cgstAmount: 0,
        sgstAmount: 0,
        gstAmount: 0,
        totalAmount: 0
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBill(null);
    setFormData({
      customerId: '',
      billNumber: '',
      date: new Date().toISOString().split('T')[0],
      items: [],
      laborHours: 0,
      laborRate: 75,
      notes: '',
      paymentStatus: 'pending',
      amountPaid: 0,
      paymentMethod: '',
      partsTotal: 0,
      laborTotal: 0,
      gstEnabled: true,
      cgstRate: 9,
      sgstRate: 9,
      cgstAmount: 0,
      sgstAmount: 0,
      gstAmount: 0,
      totalAmount: 0
    });
    setCurrentItem({ partId: '', quantity: 1, selling_price: 0 });
  };

  const addItem = () => {
    if (currentItem.partId && currentItem.quantity > 0) {
      const part = parts.find(p => p._id === currentItem.partId);
      if (part) {
        const newItem = {
          id: Date.now(),
          partId: currentItem.partId,
          partName: part.name,
          quantity: currentItem.quantity,
          selling_price: part.selling_price || 0,
          total: (part.selling_price || 0) * currentItem.quantity
        };
        
        setFormData({
          ...formData,
          items: [...formData.items, newItem]
        });
        
        setCurrentItem({ partId: '', quantity: 1, selling_price: 0 });
      } else {
        console.warn('No part found for partId:', currentItem.partId);
      }
    }
  };

  const removeItem = (itemId) => {
    setFormData({
      ...formData,
      items: formData.items.filter(item => item.id !== itemId)
    });
  };

  const calculateTotal = () => {
    const partsTotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const laborTotal = (formData.laborHours || 0) * (formData.laborRate || 0);
    const subtotal = partsTotal + laborTotal;
    
    let gstAmount = 0;
    if (formData.gstEnabled) {
      const cgstAmount = Math.round((subtotal * (formData.cgstRate || 9)) / 100 * 100) / 100;
      const sgstAmount = Math.round((subtotal * (formData.sgstRate || 9)) / 100 * 100) / 100;
      gstAmount = cgstAmount + sgstAmount;
    }
    
    return subtotal + gstAmount;
  };

  const calculateGSTBreakdown = () => {
    const partsTotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
    const laborTotal = (formData.laborHours || 0) * (formData.laborRate || 0);
    const subtotal = partsTotal + laborTotal;
    
    if (formData.gstEnabled) {
      const cgstAmount = Math.round((subtotal * (formData.cgstRate || 9)) / 100 * 100) / 100;
      const sgstAmount = Math.round((subtotal * (formData.sgstRate || 9)) / 100 * 100) / 100;
      return {
        subtotal,
        cgstAmount,
        sgstAmount,
        totalGst: cgstAmount + sgstAmount,
        total: subtotal + cgstAmount + sgstAmount
      };
    } else {
      return {
        subtotal,
        cgstAmount: 0,
        sgstAmount: 0,
        totalGst: 0,
        total: subtotal
      };
    }
  };

  const handleSubmit = async () => {
    try {
      const billData = {
        payment_status: formData.paymentStatus,
        amount_paid: formData.amountPaid,
        payment_method: formData.paymentMethod,
        notes: formData.notes
      };

      if (editingBill) {
        // For editing, only send payment-related data to avoid CastError
        await axios.put(`/api/billing/${editingBill.id}`, billData);
        setSnackbar({ open: true, message: 'Payment status updated successfully!', severity: 'success' });
      } else {
        // For new bills, include all data
        billData.customer_id = formData.customerId;
        billData.gst_enabled = formData.gstEnabled;
        billData.cgst_rate = formData.cgstRate;
        billData.sgst_rate = formData.sgstRate;
        billData.items = [
          // Add parts
          ...formData.items.map(i => ({
            item_type: 'part',
            item_id: i.partId,
            item_name: i.partName,
            quantity: i.quantity,
            unit_price: i.selling_price
          })),
          // Add labor as service if labor hours > 0
          ...(formData.laborHours > 0 ? [{
            item_type: 'service',
            item_name: 'Labor Service',
            description: `${formData.laborHours} hours at ₹${formData.laborRate}/hr`,
            quantity: formData.laborHours,
            unit_price: formData.laborRate
          }] : [])
        ];
        
        await axios.post('/api/billing', billData);
        setSnackbar({ open: true, message: 'Bill created successfully!', severity: 'success' });
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Operation failed',
        severity: 'error'
      });
    }
  };

  // Handle payment status change
  const handlePaymentStatusChange = (newStatus) => {
    let newAmountPaid = formData.amountPaid;
    
    if (newStatus === 'paid') {
      // Auto-fill with total amount when "Paid" is selected
      newAmountPaid = formData.totalAmount;
    } else if (newStatus === 'pending') {
      // Reset to 0 when "Pending" is selected
      newAmountPaid = 0;
    }
    // For "partial", keep the current amount or allow user to enter custom amount
    
    setFormData({
      ...formData,
      paymentStatus: newStatus,
      amountPaid: newAmountPaid
    });
  };

  const columns = [
    { field: 'billNumber', headerName: 'Bill Number', width: 140 },
    { field: 'customerName', headerName: 'Customer', width: 150 },
    { field: 'vehicleNumber', headerName: 'Vehicle No.', width: 130 },
    { field: 'kilometer', headerName: 'Kilometer', width: 100 },
    { field: 'jobCardNumber', headerName: 'Job Card', width: 140 },
    { field: 'serviceType', headerName: 'Service Type', width: 130 },
    { field: 'date', headerName: 'Date', width: 100 },
    { field: 'total', headerName: 'Total (₹)', width: 120, type: 'number',
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}` },
    { field: 'status', headerName: 'Status', width: 100 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 550,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{
          display: 'flex',
          gap: 1,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-start',
          py: 1,
          width: '100%'
        }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleOpenDialog(params.row)}
            sx={{ minWidth: '60px', fontSize: '0.75rem' }}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="success"
            startIcon={emailLoading === params.row.id ? <CircularProgress size={14} color="inherit" /> : <EmailIcon sx={{ fontSize: 16 }} />}
            onClick={() => handleSendEmail(params.row.id)}
            disabled={emailLoading === params.row.id}
            sx={{ minWidth: '100px', fontSize: '0.75rem' }}
          >
            {emailLoading === params.row.id ? 'Sending...' : 'Email'}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="info"
            onClick={() => handleGenerateReceipt(params.row.id, true)}
            sx={{ minWidth: '80px', fontSize: '0.75rem' }}
          >
            GST Bill
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() => handleGenerateReceipt(params.row.id, false)}
            sx={{ minWidth: '90px', fontSize: '0.75rem' }}
          >
            Simple Bill
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() => handleViewDetails(params.row)}
            sx={{ minWidth: '70px', fontSize: '0.75rem' }}
          >
            Details
          </Button>
        </Box>
      )
    }
  ];


  const handleViewDetails = (bill) => {
    const detailsWindow = window.open('', '_blank', 'width=800,height=600');
    detailsWindow.document.write(`
      <html>
        <head>
          <title>Bill Details - ${bill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin: 20px 0; }
            .label { font-weight: bold; color: #333; }
            .items-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .totals { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Bill Details: ${bill.billNumber}</h2>
          </div>
          
          <div class="section">
            <div class="label">Customer:</div>
            <div>${bill.customerName}</div>
          </div>
          
          <div class="section">
            <div class="label">Vehicle Number:</div>
            <div>${bill.vehicleNumber}</div>
          </div>
          
          <div class="section">
            <div class="label">Kilometer:</div>
            <div>${bill.kilometer}</div>
          </div>
          
          <div class="section">
            <div class="label">Job Card:</div>
            <div>${bill.jobCardNumber}</div>
          </div>
          
          <div class="section">
            <div class="label">Service Type:</div>
            <div>${bill.serviceType}</div>
          </div>
          
          <div class="section">
            <div class="label">Date:</div>
            <div>${bill.date}</div>
          </div>
          
          <div class="section">
            <div class="label">Items:</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${bill.items.map(item => `
                  <tr>
                    <td>${item.item_name}</td>
                    <td>${item.item_type === 'part' ? 'Part' : 'Service'}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.unit_price}</td>
                    <td>₹${item.total_price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="totals">
            <div><strong>Parts Total: ₹${bill.partsTotal.toFixed(2)}</strong></div>
            <div><strong>Labor Total: ₹${bill.laborTotal.toFixed(2)}</strong></div>
            ${bill.gstEnabled !== false ? `
            <div><strong>CGST (${bill.cgstRate || 9}%): ₹${(bill.cgstAmount || 0).toFixed(2)}</strong></div>
            <div><strong>SGST (${bill.sgstRate || 9}%): ₹${(bill.sgstAmount || 0).toFixed(2)}</strong></div>
            <div><strong>Total GST: ₹${bill.gstAmount.toFixed(2)}</strong></div>
            ` : '<div><strong>GST: Not Applicable</strong></div>'}
            <div style="font-size: 18px; margin-top: 10px;"><strong>Total Amount: ₹${bill.total.toFixed(2)}</strong></div>
            <div><strong>Status: ${bill.status.toUpperCase()}</strong></div>
          </div>
          
          <button onclick="window.print()" style="margin-top: 20px; padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Details</button>
        </body>
      </html>
    `);
  };

  const handleGenerateReceipt = async (billId, withGST = true) => {
    try {
      // Use the new GST-aware endpoint
      const endpoint = `/api/billing/${billId}/receipt-gst?withGST=${withGST}`;
      const response = await axios.get(endpoint, {
        responseType: 'blob' // Important for handling HTML content
      });
      
      // Create a blob URL and open it in a new window
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the blob URL after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (error) {
      console.error('Error generating receipt:', error);
      setSnackbar({
        open: true,
        message: 'Failed to generate receipt. Please try again.',
        severity: 'error'
      });
    }
  };

  // Handle sending email notification
  const handleSendEmail = async (billId) => {
    try {
      // Set loading state for this specific bill
      setEmailLoading(billId);
      
      // Find the bill to get customer info
      const bill = bills.find(b => b.id === billId);
      
      const response = await axios.post(`/api/billing/${billId}/send-email`);
      
      if (response.data.success) {
        // Show success dialog
        setEmailDialog({
          open: true,
          customerEmail: response.data.data.email,
          billNumber: bill?.billNumber || 'N/A'
        });
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || 'Failed to send email',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to send email notification',
        severity: 'error'
      });
    } finally {
      // Clear loading state
      setEmailLoading(null);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          {fromJobCard && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/jobcards')}
            >
              Back to Job Cards
            </Button>
          )}
          <Typography variant="h4">
            Billing & Invoices
            {jobCardData && (
              <Typography variant="subtitle1" color="textSecondary">
                Job Card: {jobCardData.job_card_number} - {jobCardData.customer_name}
              </Typography>
            )}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Bill
        </Button>
      </Box>

      {/* Filter and Search Section */}
      <Box display="flex" gap={2} mb={3} alignItems="center">
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Filter</InputLabel>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            label="Filter"
          >
            <MenuItem value="all">All Bills</MenuItem>
            <MenuItem value="today">Today's Bills</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="Search Bills"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 300 }}
          placeholder="Search by bill number, customer, vehicle number, kilometer, job card, service type, date, amount, status..."
        />
        
        <Typography variant="body2" color="textSecondary">
          Showing {filteredBills.length} of {bills.length} bills
        </Typography>
      </Box>

      <Box sx={{ height: 700, width: '100%' }}>
        <DataGrid
          rows={filteredBills}
          columns={columns}
          loading={loading}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          disableSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0'
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f5f5',
              fontWeight: 'bold'
            },
            '& .MuiDataGrid-row': {
              minHeight: '60px !important'
            }
          }}
        />
      </Box>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingBill ? 'Edit Bill' : 'Create New Bill'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Customer</InputLabel>
                  <Select
                    name="customerId"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    label="Customer"
                    disabled={editingBill}
                  >
                    {customers.map(customer => (
                      <MenuItem key={customer._id} value={customer._id}>
                        {customer.name || `${customer.first_name} ${customer.last_name}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Bill Number"
                  name="billNumber"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  required
                  disabled={editingBill}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                  disabled={editingBill}
                />
              </Grid>

              
              {/* Payment Status Section */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={formData.paymentStatus}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    label="Payment Status"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="partial">Partial</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Amount Paid (₹)"
                  type="number"
                  value={formData.amountPaid}
                  onChange={(e) => setFormData({ ...formData, amountPaid: parseFloat(e.target.value) || 0 })}
                  inputProps={{ min: 0, max: formData.totalAmount }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  placeholder="Cash, Card, UPI, etc."
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  multiline
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>

            {/* Bill Summary Section */}
            {editingBill && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Bill Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Parts Total</Typography>
                    <Typography variant="h6">₹{formData.partsTotal.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Labor Total</Typography>
                    <Typography variant="h6">₹{formData.laborTotal.toFixed(2)}</Typography>
                  </Grid>
                  {formData.gstEnabled ? (
                    <>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">CGST ({formData.cgstRate}%)</Typography>
                        <Typography variant="h6">₹{formData.cgstAmount.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">SGST ({formData.sgstRate}%)</Typography>
                        <Typography variant="h6">₹{formData.sgstAmount.toFixed(2)}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2" color="textSecondary">Total GST</Typography>
                        <Typography variant="h6">₹{formData.gstAmount.toFixed(2)}</Typography>
                      </Grid>
                    </>
                  ) : (
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" color="textSecondary">GST</Typography>
                      <Typography variant="h6">Not Applicable</Typography>
                    </Grid>
                  )}
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Total Amount</Typography>
                    <Typography variant="h6" color="primary">₹{formData.totalAmount.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Amount Paid</Typography>
                    <Typography variant="h6" color="success.main">₹{formData.amountPaid.toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="textSecondary">Balance Due</Typography>
                    <Typography variant="h6" color="error.main">₹{(formData.totalAmount - formData.amountPaid).toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Items Used Section */}
            {editingBill && formData.items.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Items Used
                </Typography>
                
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Item Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.itemType === 'part' ? 'Part' : 'Service'}
                              color={item.itemType === 'part' ? 'primary' : 'secondary'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">₹{item.unitPrice?.toFixed(2)}</TableCell>
                          <TableCell align="right">₹{item.totalPrice?.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Add Items Section for New Bills */}
            {!editingBill && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Add Parts & Services
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Part</InputLabel>
                      <Select
                        value={currentItem.partId}
                        onChange={(e) => {
                          const part = parts.find(p => p._id === e.target.value);
                          setCurrentItem({
                            partId: e.target.value,
                            quantity: 1,
                            selling_price: part?.selling_price || 0
                          });
                        }}
                        label="Part"
                      >
                        {parts.map(part => (
                          <MenuItem key={part._id} value={part._id}>
                            {part.name} - ₹{part.selling_price || 0}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={currentItem.quantity}
                      onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      variant="contained"
                      onClick={addItem}
                      disabled={!currentItem.partId}
                      sx={{ mt: 1 }}
                    >
                      Add Item
                    </Button>
                  </Grid>
                </Grid>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Part</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formData.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.partName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{item.selling_price}</TableCell>
                          <TableCell>₹{(item.total || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeItem(item.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Bill Calculation
                  </Typography>
                  {(() => {
                    const breakdown = calculateGSTBreakdown();
                    return (
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">Subtotal</Typography>
                          <Typography variant="h6">₹{breakdown.subtotal.toFixed(2)}</Typography>
                        </Grid>
                        {formData.gstEnabled ? (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">CGST ({formData.cgstRate}%)</Typography>
                              <Typography variant="h6">₹{breakdown.cgstAmount.toFixed(2)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">SGST ({formData.sgstRate}%)</Typography>
                              <Typography variant="h6">₹{breakdown.sgstAmount.toFixed(2)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="body2" color="textSecondary">Total GST</Typography>
                              <Typography variant="h6">₹{breakdown.totalGst.toFixed(2)}</Typography>
                            </Grid>
                          </>
                        ) : (
                          <Grid item xs={6}>
                            <Typography variant="body2" color="textSecondary">GST</Typography>
                            <Typography variant="h6">Not Applicable</Typography>
                          </Grid>
                        )}
                        <Grid item xs={12}>
                          <Typography variant="h5" color="primary" sx={{ textAlign: 'right', mt: 1, pt: 1, borderTop: '2px solid #ddd' }}>
                            Total Amount: ₹{breakdown.total.toFixed(2)}
                          </Typography>
                        </Grid>
                      </Grid>
                    );
                  })()}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingBill ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Success Dialog */}
      <Dialog
        open={emailDialog.open}
        onClose={() => setEmailDialog({ open: false, customerEmail: '', billNumber: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: '#4caf50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <EmailIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
              Email Sent Successfully!
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2, fontSize: '16px' }}>
            The notification email has been sent successfully to the customer.
          </Typography>
          <Box sx={{ backgroundColor: '#f5f5f5', padding: 2, borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              <strong>Bill Number:</strong> {emailDialog.billNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              <strong>Customer Email:</strong> {emailDialog.customerEmail}
            </Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
            The customer will receive a thank you message with invoice number and vehicle details.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setEmailDialog({ open: false, customerEmail: '', billNumber: '' })}
            variant="contained"
            color="success"
            sx={{ px: 4, py: 1 }}
          >
            OK
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

export default Billing;