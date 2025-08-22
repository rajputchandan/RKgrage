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
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Autocomplete,
  Divider,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  Inventory as InventoryIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const InventoryPurchase = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSupplierDialog, setOpenSupplierDialog] = useState(false);
  const [openSupplierInvoicesDialog, setOpenSupplierInvoicesDialog] = useState(false);
  const [openPaymentUpdateDialog, setOpenPaymentUpdateDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedSupplierInvoices, setSelectedSupplierInvoices] = useState({ supplier: null, invoices: [] });
  const [selectedPurchaseForPayment, setSelectedPurchaseForPayment] = useState(null);
  const [paymentUpdateData, setPaymentUpdateData] = useState({
    paid_amount: 0,
    payment_method: 'Cash',
    payment_status_selection: 'Pending',
    payment_notes: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [purchaseSearchTerm, setPurchaseSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [supplierPurchaseCounts, setSupplierPurchaseCounts] = useState({});

  // Purchase form data
  const [purchaseData, setPurchaseData] = useState({
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    invoice_number: '',
    invoice_date: '',
    payment_method: 'Cash',
    paid_amount: 0,
    payment_status_selection: 'Pending',
    notes: '',
    items: []
  });

  // Supplier form data
  const [supplierData, setSupplierData] = useState({
    supplier_name: '',
    contact_person: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    payment_terms: 'Cash',
    credit_limit: 0,
    notes: ''
  });

  // Current item being added
  const [currentItem, setCurrentItem] = useState({
    part_id: '',
    part_name: '',
    part_number: '',
    category: '',
    cost_price: 0,
    selling_price: 0,
    rack_location: '',
    min_stock_level: 5,
    quantity: 1,
    unit_price: 0,
    gst_rate: 18,
    is_new_part: false
  });

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchParts();
    fetchSupplierPurchaseCounts();
  }, []);

  // Filter suppliers based on search
  useEffect(() => {
    let filtered = suppliers;
    if (searchTerm.trim()) {
      filtered = suppliers.filter(supplier =>
        supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.mobile.includes(searchTerm) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  // Filter purchases based on search
  useEffect(() => {
    let filtered = purchases;
    if (purchaseSearchTerm.trim()) {
      filtered = purchases.filter(purchase =>
        purchase.purchase_number?.toLowerCase().includes(purchaseSearchTerm.toLowerCase()) ||
        purchase.supplier_name?.toLowerCase().includes(purchaseSearchTerm.toLowerCase()) ||
        purchase.invoice_number?.toLowerCase().includes(purchaseSearchTerm.toLowerCase())
      );
    }
    setFilteredPurchases(filtered);
  }, [purchases, purchaseSearchTerm]);

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('/api/inventory-purchases/');
      if (response.data.success) {
        const purchasesWithId = response.data.data.map(purchase => ({
          ...purchase,
          id: purchase._id
        }));
        setPurchases(purchasesWithId);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch purchases',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await axios.get('/api/suppliers/');
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchParts = async () => {
    try {
      const response = await axios.get('/api/parts/');
      if (response.data.success) {
        setParts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  };

  const fetchSupplierPurchaseCounts = async () => {
    try {
      const response = await axios.get('/api/inventory-purchases/supplier-summary');
      if (response.data.success) {
        const counts = {};
        response.data.data.forEach(summary => {
          counts[summary._id] = {
            totalPurchases: summary.totalPurchases,
            totalAmount: summary.totalAmount,
            lastPurchaseDate: summary.lastPurchaseDate
          };
        });
        setSupplierPurchaseCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching supplier purchase counts:', error);
    }
  };

  const getSupplierInvoices = async (supplierId) => {
    try {
      const response = await axios.get(`/api/inventory-purchases/?supplier_id=${supplierId}`);
      if (response.data.success) {
        const invoices = response.data.data.map(purchase => ({
          purchase_number: purchase.purchase_number,
          invoice_number: purchase.invoice_number,
          purchase_date: purchase.purchase_date,
          total_amount: purchase.total_amount,
          payment_status: purchase.payment_status
        }));
        return invoices;
      }
    } catch (error) {
      console.error('Error fetching supplier invoices:', error);
    }
    return [];
  };

  const handleViewSupplierInvoices = async (supplier) => {
    const invoices = await getSupplierInvoices(supplier._id);
    
    if (invoices.length === 0) {
      setSnackbar({
        open: true,
        message: `No purchases found for ${supplier.supplier_name}`,
        severity: 'info'
      });
      return;
    }

    setSelectedSupplierInvoices({ supplier, invoices });
    setOpenSupplierInvoicesDialog(true);
  };

  const handleCloseSupplierInvoicesDialog = () => {
    setOpenSupplierInvoicesDialog(false);
    setSelectedSupplierInvoices({ supplier: null, invoices: [] });
  };

  const handleOpenPaymentUpdateDialog = (invoice) => {
    // Find the full purchase data
    const fullPurchase = purchases.find(p => p.purchase_number === invoice.purchase_number);
    if (fullPurchase) {
      setSelectedPurchaseForPayment(fullPurchase);
      setPaymentUpdateData({
        paid_amount: fullPurchase.paid_amount || 0,
        payment_method: fullPurchase.payment_method || 'Cash',
        payment_status_selection: fullPurchase.payment_status || 'Pending',
        payment_notes: ''
      });
      setOpenPaymentUpdateDialog(true);
    }
  };

  const handleClosePaymentUpdateDialog = () => {
    setOpenPaymentUpdateDialog(false);
    setSelectedPurchaseForPayment(null);
    setPaymentUpdateData({
      paid_amount: 0,
      payment_method: 'Cash',
      payment_status_selection: 'Pending',
      payment_notes: ''
    });
  };

  const handleUpdatePaymentStatus = async () => {
    try {
      if (!selectedPurchaseForPayment) return;

      const updateData = {
        paid_amount: paymentUpdateData.paid_amount,
        payment_method: paymentUpdateData.payment_method,
        notes: paymentUpdateData.payment_notes
      };

      const response = await axios.put(
        `/api/inventory-purchases/update/${selectedPurchaseForPayment.id}`,
        updateData
      );

      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Payment status updated successfully!',
          severity: 'success'
        });
        
        // Refresh data
        fetchPurchases();
        fetchSupplierPurchaseCounts();
        
        // Update the supplier invoices if dialog is open
        if (selectedSupplierInvoices.supplier) {
          const updatedInvoices = await getSupplierInvoices(selectedSupplierInvoices.supplier._id);
          setSelectedSupplierInvoices({
            ...selectedSupplierInvoices,
            invoices: updatedInvoices
          });
        }
        
        handleClosePaymentUpdateDialog();
      }
    } catch (error) {
      console.error('Payment update error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update payment status',
        severity: 'error'
      });
    }
  };

  // Handle payment status selection for new purchase
  const handlePaymentStatusChange = (status) => {
    const { total } = calculateTotals();
    let newPaidAmount = 0;
    
    switch (status) {
      case 'Paid':
        newPaidAmount = total;
        break;
      case 'Pending':
        newPaidAmount = 0;
        break;
      case 'Partial':
        // Keep current amount or set to 0 if not set
        newPaidAmount = purchaseData.paid_amount || 0;
        break;
      default:
        newPaidAmount = 0;
    }
    
    setPurchaseData({
      ...purchaseData,
      payment_status_selection: status,
      paid_amount: newPaidAmount
    });
  };

  // Handle payment status selection for payment update
  const handlePaymentUpdateStatusChange = (status) => {
    const totalAmount = selectedPurchaseForPayment?.total_amount || 0;
    let newPaidAmount = 0;
    
    switch (status) {
      case 'Paid':
        newPaidAmount = totalAmount;
        break;
      case 'Pending':
        newPaidAmount = 0;
        break;
      case 'Partial':
        // Keep current amount or set to 0 if not set
        newPaidAmount = paymentUpdateData.paid_amount || 0;
        break;
      default:
        newPaidAmount = 0;
    }
    
    setPaymentUpdateData({
      ...paymentUpdateData,
      payment_status_selection: status,
      paid_amount: newPaidAmount
    });
  };

  const handleOpenPurchaseDialog = (purchase = null) => {
    if (purchase) {
      setEditingPurchase(purchase);
      setPurchaseData({
        supplier_id: purchase.supplier_id._id || purchase.supplier_id,
        purchase_date: purchase.purchase_date.split('T')[0],
        invoice_number: purchase.invoice_number || '',
        invoice_date: purchase.invoice_date ? purchase.invoice_date.split('T')[0] : '',
        payment_method: purchase.payment_method,
        paid_amount: purchase.paid_amount,
        notes: purchase.notes || '',
        items: purchase.items || []
      });
    } else {
      setEditingPurchase(null);
      setPurchaseData({
        supplier_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        invoice_date: '',
        payment_method: 'Cash',
        paid_amount: 0,
        payment_status_selection: 'Pending',
        notes: '',
        items: []
      });
    }
    setOpenDialog(true);
  };

  const handleOpenSupplierDialog = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierData({
        supplier_name: supplier.supplier_name,
        contact_person: supplier.contact_person || '',
        mobile: supplier.mobile,
        email: supplier.email || '',
        address: supplier.address || '',
        city: supplier.city || '',
        state: supplier.state || '',
        pincode: supplier.pincode || '',
        gstin: supplier.gstin || '',
        payment_terms: supplier.payment_terms || 'Cash',
        credit_limit: supplier.credit_limit || 0,
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setSupplierData({
        supplier_name: '',
        contact_person: '',
        mobile: '',
        email: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        gstin: '',
        payment_terms: 'Cash',
        credit_limit: 0,
        notes: ''
      });
    }
    setOpenSupplierDialog(true);
  };

  const handleClosePurchaseDialog = () => {
    setOpenDialog(false);
    setEditingPurchase(null);
    setCurrentItem({
      part_id: '',
      part_name: '',
      part_number: '',
      category: '',
      cost_price: 0,
      selling_price: 0,
      rack_location: '',
      min_stock_level: 5,
      quantity: 1,
      unit_price: 0,
      gst_rate: 18,
      is_new_part: false
    });
  };

  const handleCloseSupplierDialog = () => {
    setOpenSupplierDialog(false);
    setEditingSupplier(null);
  };

  const handleAddItem = () => {
    // Validation for new parts
    if (currentItem.is_new_part) {
      if (!currentItem.part_name || !currentItem.part_number) {
        setSnackbar({
          open: true,
          message: 'Please enter part name and part number for new parts',
          severity: 'warning'
        });
        return;
      }
      
      if (currentItem.cost_price <= 0) {
        setSnackbar({
          open: true,
          message: 'Please enter a valid cost price for new parts',
          severity: 'warning'
        });
        return;
      }
    } else if (!currentItem.part_id) {
      setSnackbar({
        open: true,
        message: 'Please select a part or create a new one',
        severity: 'warning'
      });
      return;
    }

    if (currentItem.quantity <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid quantity',
        severity: 'warning'
      });
      return;
    }

    if (currentItem.unit_price <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid unit price',
        severity: 'warning'
      });
      return;
    }

    const total_price = currentItem.quantity * currentItem.unit_price;
    const gst_amount = (total_price * currentItem.gst_rate) / 100;
    const final_amount = total_price + gst_amount;

    let newItem;
    
    if (currentItem.is_new_part) {
      // New part - GST and supplier will be taken from common section below
      newItem = {
        part_id: 'new',
        part_name: currentItem.part_name,
        part_number: currentItem.part_number,
        category: currentItem.category,
        cost_price: parseFloat(currentItem.cost_price) || 0,
        selling_price: parseFloat(currentItem.selling_price) || 0,
        rack_location: currentItem.rack_location,
        min_stock_level: currentItem.min_stock_level,
        quantity: currentItem.quantity,
        unit_price: currentItem.unit_price,
        total_price: total_price,
        gst_rate: currentItem.gst_rate,
        gst_amount: gst_amount,
        final_amount: final_amount
      };
    } else {
      // Existing part
      const selectedPart = parts.find(p => p._id === currentItem.part_id);
      if (!selectedPart) return;

      newItem = {
        part_id: currentItem.part_id,
        part_name: selectedPart.name,
        part_number: selectedPart.part_number,
        quantity: currentItem.quantity,
        unit_price: currentItem.unit_price,
        total_price: total_price,
        gst_rate: currentItem.gst_rate,
        gst_amount: gst_amount,
        final_amount: final_amount
      };
    }

    setPurchaseData({
      ...purchaseData,
      items: [...purchaseData.items, newItem]
    });

    setCurrentItem({
      part_id: '',
      part_name: '',
      part_number: '',
      category: '',
      cost_price: 0,
      selling_price: 0,
      rack_location: '',
      min_stock_level: 5,
      quantity: 1,
      unit_price: 0,
      gst_rate: 18,
      is_new_part: false
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = purchaseData.items.filter((_, i) => i !== index);
    setPurchaseData({
      ...purchaseData,
      items: updatedItems
    });
  };

  const handleSubmitPurchase = async () => {
    try {
      if (!purchaseData.supplier_id || purchaseData.items.length === 0) {
        setSnackbar({
          open: true,
          message: 'Please select supplier and add at least one item',
          severity: 'warning'
        });
        return;
      }

      const submitData = {
        ...purchaseData,
        invoice_date: purchaseData.invoice_date || null
      };

      if (editingPurchase) {
        const response = await axios.put(`/api/inventory-purchases/update/${editingPurchase.id}`, submitData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Purchase updated successfully!', severity: 'success' });
        }
      } else {
        const response = await axios.post('/api/inventory-purchases/add', submitData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Purchase added successfully!', severity: 'success' });
        }
      }

      handleClosePurchaseDialog();
      fetchPurchases();
    } catch (error) {
      console.error('Submit error:', error);
      
      // Handle duplicate invoice number error
      if (error.response?.status === 409 && error.response?.data?.existingPurchase) {
        const existingPurchase = error.response.data.existingPurchase;
        const confirmEdit = window.confirm(
          `${error.response.data.message}\n\n` +
          `Existing Purchase Details:\n` +
          `Purchase Number: ${existingPurchase.purchase_number}\n` +
          `Date: ${new Date(existingPurchase.purchase_date).toLocaleDateString()}\n` +
          `Amount: ₹${existingPurchase.total_amount}\n\n` +
          `Do you want to edit the existing purchase instead?`
        );
        
        if (confirmEdit) {
          // Close current dialog and open existing purchase for editing
          handleClosePurchaseDialog();
          // Find and edit the existing purchase
          const existingPurchaseData = purchases.find(p => p._id === existingPurchase._id);
          if (existingPurchaseData) {
            handleOpenPurchaseDialog(existingPurchaseData);
          } else {
            // Fetch the purchase if not in current list
            try {
              const response = await axios.get(`/api/inventory-purchases/${existingPurchase._id}`);
              if (response.data.success) {
                handleOpenPurchaseDialog({ ...response.data.data, id: response.data.data._id });
              }
            } catch (fetchError) {
              setSnackbar({
                open: true,
                message: 'Failed to load existing purchase for editing',
                severity: 'error'
              });
            }
          }
        } else {
          setSnackbar({
            open: true,
            message: 'Please use a different invoice number to create a new purchase',
            severity: 'warning'
          });
        }
      } else {
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Operation failed',
          severity: 'error'
        });
      }
    }
  };

  const handleSubmitSupplier = async () => {
    try {
      let response;
      if (editingSupplier) {
        response = await axios.put(`/api/suppliers/update/${editingSupplier._id}`, supplierData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Supplier updated successfully!', severity: 'success' });
        }
      } else {
        response = await axios.post('/api/suppliers/add', supplierData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Supplier added successfully!', severity: 'success' });
        }
      }
      
      handleCloseSupplierDialog();
      fetchSuppliers();
    } catch (error) {
      console.error('Supplier submit error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save supplier',
        severity: 'error'
      });
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const response = await axios.delete(`/api/suppliers/delete/${id}`);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Supplier deleted successfully!', severity: 'success' });
          fetchSuppliers();
        }
      } catch (error) {
        console.error('Delete supplier error:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Delete failed',
          severity: 'error'
        });
      }
    }
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase?')) {
      try {
        const response = await axios.delete(`/api/inventory-purchases/delete/${id}`);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Purchase deleted successfully!', severity: 'success' });
          fetchPurchases();
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed': return 'primary';
      case 'Received': return 'success';
      case 'Draft': return 'default';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Partial': return 'warning';
      case 'Pending': return 'error';
      default: return 'default';
    }
  };

  const calculateTotals = () => {
    const subtotal = purchaseData.items.reduce((sum, item) => sum + item.total_price, 0);
    const totalGst = purchaseData.items.reduce((sum, item) => sum + item.gst_amount, 0);
    const total = subtotal + totalGst;
    return { subtotal, totalGst, total };
  };

  const columns = [
    { field: 'purchase_number', headerName: 'Purchase #', width: 130 },
    { field: 'supplier_name', headerName: 'Supplier', width: 180 },
    { 
      field: 'purchase_date', 
      headerName: 'Date', 
      width: 120,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      }
    },
    { field: 'invoice_number', headerName: 'Invoice #', width: 120 },
    { 
      field: 'total_amount', 
      headerName: 'Total Amount', 
      width: 130,
      valueFormatter: (params) => `₹${params.value?.toFixed(2) || '0.00'}`
    },
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
      field: 'payment_status',
      headerName: 'Payment',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getPaymentStatusColor(params.value)}
          size="small"
        />
      )
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
            onClick={() => handleOpenPurchaseDialog(params.row)}
            title="Edit"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeletePurchase(params.row.id)}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  // Supplier columns
  const supplierColumns = [
    { field: 'supplier_name', headerName: 'Supplier Name', width: 180 },
    { field: 'mobile', headerName: 'Mobile', width: 120 },
    { field: 'email', headerName: 'Email', width: 160 },
    { field: 'city', headerName: 'City', width: 100 },
    { field: 'gstin', headerName: 'GSTIN', width: 130 },
    { field: 'payment_terms', headerName: 'Payment Terms', width: 110 },
    {
      field: 'purchase_count',
      headerName: 'Total Bills',
      width: 100,
      renderCell: (params) => {
        const count = supplierPurchaseCounts[params.row._id]?.totalPurchases || 0;
        return (
          <Chip
            label={count}
            color={count > 0 ? 'primary' : 'default'}
            size="small"
            onClick={() => count > 0 && handleViewSupplierInvoices(params.row)}
            sx={{
              cursor: count > 0 ? 'pointer' : 'default',
              '&:hover': count > 0 ? {
                backgroundColor: 'primary.dark',
                color: 'white'
              } : {}
            }}
            title={count > 0 ? 'Click to view all invoice numbers' : 'No invoices'}
          />
        );
      }
    },
    {
      field: 'total_amount',
      headerName: 'Total Amount',
      width: 120,
      renderCell: (params) => {
        const amount = supplierPurchaseCounts[params.row._id]?.totalAmount || 0;
        return `₹${amount.toFixed(2)}`;
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Active' ? 'success' : 'default'}
          size="small"
        />
      )
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
            onClick={() => handleViewSupplierInvoices(params.row)}
            title="View Invoices"
            color="info"
          >
            <ViewIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleOpenSupplierDialog(params.row)}
            title="Edit"
          >
            <EditIcon />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteSupplier(params.row._id)}
            title="Delete"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const { subtotal, totalGst, total } = calculateTotals();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Inventory Purchase Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => handleOpenSupplierDialog()}
            sx={{ mr: 2 }}
          >
            Add Supplier
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenPurchaseDialog()}
          >
            New Purchase
          </Button>
        </Box>
      </Box>

      {/* Tabs for Purchases and Suppliers */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab
            icon={<InventoryIcon />}
            label="Purchases"
            iconPosition="start"
          />
          <Tab
            icon={<BusinessIcon />}
            label="Suppliers"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Box>
          {/* Search for purchases */}
          <Box display="flex" gap={2} mb={3} alignItems="center">
            <TextField
              label="Search Purchases"
              variant="outlined"
              value={purchaseSearchTerm}
              onChange={(e) => setPurchaseSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              placeholder="Search by purchase number, supplier name, or invoice number..."
            />
            <Typography variant="body2" color="textSecondary">
              Showing {filteredPurchases.length} of {purchases.length} purchases
            </Typography>
          </Box>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredPurchases}
              columns={columns}
              loading={loading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
            />
          </Box>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {/* Search for suppliers */}
          <Box display="flex" gap={2} mb={3} alignItems="center">
            <TextField
              label="Search Suppliers"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 300 }}
              placeholder="Search by name, mobile, or email..."
            />
            <Typography variant="body2" color="textSecondary">
              Showing {filteredSuppliers.length} of {suppliers.length} suppliers
            </Typography>
          </Box>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredSuppliers.map(supplier => ({ ...supplier, id: supplier._id }))}
              columns={supplierColumns}
              loading={loading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
            />
          </Box>
        </Box>
      )}

      {/* Purchase Dialog */}
      <Dialog open={openDialog} onClose={handleClosePurchaseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingPurchase ? 'Edit Purchase' : 'New Purchase'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={purchaseData.supplier_id}
                    onChange={(e) => setPurchaseData({ ...purchaseData, supplier_id: e.target.value })}
                    label="Supplier"
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        {supplier.supplier_name} - {supplier.mobile}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase Date"
                  type="date"
                  value={purchaseData.purchase_date}
                  onChange={(e) => setPurchaseData({ ...purchaseData, purchase_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Number"
                  value={purchaseData.invoice_number}
                  onChange={(e) => setPurchaseData({ ...purchaseData, invoice_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  type="date"
                  value={purchaseData.invoice_date}
                  onChange={(e) => setPurchaseData({ ...purchaseData, invoice_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>Add Items</Typography>
            
            {/* Toggle for new part creation */}
            <Box sx={{ mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={currentItem.is_new_part}
                    onChange={(e) => setCurrentItem({
                      ...currentItem,
                      is_new_part: e.target.checked,
                      part_id: '',
                      part_name: '',
                      part_number: '',
                      category: '',
                      cost_price: 0,
                      selling_price: 0,
                      rack_location: '',
                      min_stock_level: 5
                    })}
                  />
                }
                label="Create New Part"
              />
            </Box>

            {currentItem.is_new_part ? (
              // New Part Creation Form - Essential fields only
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Part Name"
                    value={currentItem.part_name}
                    onChange={(e) => setCurrentItem({ ...currentItem, part_name: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Part Number"
                    value={currentItem.part_number}
                    onChange={(e) => setCurrentItem({ ...currentItem, part_number: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      value={currentItem.category}
                      onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
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
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Rack Location"
                    value={currentItem.rack_location}
                    onChange={(e) => setCurrentItem({ ...currentItem, rack_location: e.target.value })}
                    required
                    placeholder="e.g., A1, B2, C3"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Min Stock Level"
                    type="number"
                    value={currentItem.min_stock_level}
                    onChange={(e) => setCurrentItem({ ...currentItem, min_stock_level: parseInt(e.target.value) || 5 })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cost Price (₹)"
                    type="number"
                    value={currentItem.cost_price}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setCurrentItem({
                        ...currentItem,
                        cost_price: value,
                        unit_price: value // Auto-set unit price to cost price for purchase
                      });
                    }}
                    required
                    helperText="Purchase/Cost price"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Selling Price (₹)"
                    type="number"
                    value={currentItem.selling_price}
                    onChange={(e) => setCurrentItem({ ...currentItem, selling_price: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </Grid>
              </Grid>
            ) : (
              // Existing Part Selection with details
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={parts}
                      getOptionLabel={(option) => `${option.name} (${option.part_number})`}
                      value={parts.find(p => p._id === currentItem.part_id) || null}
                      onChange={(event, newValue) => {
                        if (newValue) {
                          setCurrentItem({
                            ...currentItem,
                            part_id: newValue._id,
                            part_name: newValue.name,
                            part_number: newValue.part_number,
                            category: newValue.category,
                            cost_price: newValue.cost_price || 0,
                            selling_price: newValue.selling_price || 0,
                            rack_location: newValue.rack_location || '',
                            min_stock_level: newValue.min_stock_level || 5,
                            unit_price: newValue.selling_price || 0,
                            gst_rate: newValue.gst_rate || 18
                          });
                        } else {
                          setCurrentItem({
                            ...currentItem,
                            part_id: '',
                            part_name: '',
                            part_number: '',
                            category: '',
                            cost_price: 0,
                            selling_price: 0,
                            rack_location: '',
                            min_stock_level: 5,
                            unit_price: 0,
                            gst_rate: 18
                          });
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Select Existing Part" fullWidth />
                      )}
                    />
                  </Grid>
                </Grid>

                {/* Show part details when a part is selected */}
                {currentItem.part_id && (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Part Name"
                        value={currentItem.part_name}
                        onChange={(e) => setCurrentItem({ ...currentItem, part_name: e.target.value })}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Part Number"
                        value={currentItem.part_number}
                        onChange={(e) => setCurrentItem({ ...currentItem, part_number: e.target.value })}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Category"
                        value={currentItem.category}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Rack Location"
                        value={currentItem.rack_location}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Min Stock Level"
                        type="number"
                        value={currentItem.min_stock_level}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Cost Price (₹)"
                        type="number"
                        value={currentItem.cost_price}
                        disabled
                        helperText="Original cost price"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Selling Price (₹)"
                        type="number"
                        value={currentItem.selling_price}
                        disabled
                        helperText="Original selling price"
                      />
                    </Grid>
                  </Grid>
                )}
              </Box>
            )}

            {/* Common fields for both new and existing parts */}
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={currentItem.quantity}
                  onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={currentItem.unit_price}
                  onChange={(e) => setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="GST %"
                  type="number"
                  value={currentItem.gst_rate}
                  onChange={(e) => setCurrentItem({ ...currentItem, gst_rate: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Total: ₹{(currentItem.quantity * currentItem.unit_price * (1 + currentItem.gst_rate / 100)).toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  onClick={handleAddItem}
                  fullWidth
                  startIcon={<AddIcon />}
                >
                  {currentItem.is_new_part ? 'Create & Add' : 'Add Item'}
                </Button>
              </Grid>
            </Grid>

            {purchaseData.items.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Items</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Part</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>GST</TableCell>
                      <TableCell>Final Amount</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchaseData.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.part_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.unit_price}</TableCell>
                        <TableCell>₹{item.total_price.toFixed(2)}</TableCell>
                        <TableCell>₹{item.gst_amount.toFixed(2)}</TableCell>
                        <TableCell>₹{item.final_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3}><strong>Totals:</strong></TableCell>
                      <TableCell><strong>₹{subtotal.toFixed(2)}</strong></TableCell>
                      <TableCell><strong>₹{totalGst.toFixed(2)}</strong></TableCell>
                      <TableCell><strong>₹{total.toFixed(2)}</strong></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={purchaseData.payment_status_selection}
                    onChange={(e) => handlePaymentStatusChange(e.target.value)}
                    label="Payment Status"
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Partial">Partial</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={purchaseData.payment_method}
                    onChange={(e) => setPurchaseData({ ...purchaseData, payment_method: e.target.value })}
                    label="Payment Method"
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Credit">Credit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Paid Amount"
                  type="number"
                  value={purchaseData.paid_amount}
                  onChange={(e) => {
                    const newAmount = parseFloat(e.target.value) || 0;
                    const { total } = calculateTotals();
                    
                    // Auto-update payment status based on amount
                    let newStatus = 'Pending';
                    if (newAmount <= 0) {
                      newStatus = 'Pending';
                    } else if (newAmount >= total) {
                      newStatus = 'Paid';
                    } else {
                      newStatus = 'Partial';
                    }
                    
                    setPurchaseData({
                      ...purchaseData,
                      paid_amount: newAmount,
                      payment_status_selection: newStatus
                    });
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{
                  bgcolor: purchaseData.paid_amount <= 0 ? 'error.light' :
                           purchaseData.paid_amount >= total ? 'success.light' : 'warning.light',
                  color: purchaseData.paid_amount <= 0 ? 'error.contrastText' :
                         purchaseData.paid_amount >= total ? 'success.contrastText' : 'warning.contrastText'
                }}>
                  <CardContent sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight="medium">
                      Status: {
                        purchaseData.paid_amount <= 0 ? 'Pending' :
                        purchaseData.paid_amount >= total ? 'Paid' :
                        'Partial'
                      }
                    </Typography>
                    <Typography variant="caption">
                      Balance: ₹{(total - purchaseData.paid_amount).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={purchaseData.notes}
                  onChange={(e) => setPurchaseData({ ...purchaseData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePurchaseDialog}>Cancel</Button>
          <Button onClick={handleSubmitPurchase} variant="contained">
            {editingPurchase ? 'Update' : 'Save'} Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={openSupplierDialog} onClose={handleCloseSupplierDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Supplier Name"
                  value={supplierData.supplier_name}
                  onChange={(e) => setSupplierData({ ...supplierData, supplier_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={supplierData.contact_person}
                  onChange={(e) => setSupplierData({ ...supplierData, contact_person: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={supplierData.mobile}
                  onChange={(e) => setSupplierData({ ...supplierData, mobile: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={supplierData.email}
                  onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GSTIN"
                  value={supplierData.gstin}
                  onChange={(e) => setSupplierData({ ...supplierData, gstin: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Terms</InputLabel>
                  <Select
                    value={supplierData.payment_terms}
                    onChange={(e) => setSupplierData({ ...supplierData, payment_terms: e.target.value })}
                    label="Payment Terms"
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Credit">Credit</MenuItem>
                    <MenuItem value="Net 30">Net 30</MenuItem>
                    <MenuItem value="Net 60">Net 60</MenuItem>
                    <MenuItem value="Net 90">Net 90</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={supplierData.city}
                  onChange={(e) => setSupplierData({ ...supplierData, city: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  value={supplierData.state}
                  onChange={(e) => setSupplierData({ ...supplierData, state: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={supplierData.address}
                  onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSupplierDialog}>Cancel</Button>
          <Button onClick={handleSubmitSupplier} variant="contained">
            {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Supplier Invoices Dialog */}
      <Dialog
        open={openSupplierInvoicesDialog}
        onClose={handleCloseSupplierInvoicesDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <BusinessIcon color="primary" />
            <Box>
              <Typography variant="h6">
                {selectedSupplierInvoices.supplier?.supplier_name} - Purchase History
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Complete invoice and purchase details
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedSupplierInvoices.invoices.length > 0 && (
            <Box>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary">
                        {selectedSupplierInvoices.invoices.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Purchases
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="success.main">
                        ₹{selectedSupplierInvoices.invoices.reduce((sum, inv) => sum + inv.total_amount, 0).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Amount
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="success.main">
                        {selectedSupplierInvoices.invoices.filter(inv => inv.payment_status === 'Paid').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Paid Invoices
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="warning.main">
                        {selectedSupplierInvoices.invoices.filter(inv => inv.payment_status === 'Pending').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Pending Invoices
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Invoice Details Table */}
              <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Purchase #</strong></TableCell>
                      <TableCell><strong>Invoice #</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Amount</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedSupplierInvoices.invoices.map((invoice, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {invoice.purchase_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {invoice.invoice_number || 'No Invoice Number'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(invoice.purchase_date).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            ₹{invoice.total_amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={invoice.payment_status}
                            color={getPaymentStatusColor(invoice.payment_status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenPaymentUpdateDialog(invoice)}
                            title="Update Payment Status"
                          >
                            <PaymentIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSupplierInvoicesDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Update Dialog */}
      <Dialog
        open={openPaymentUpdateDialog}
        onClose={handleClosePaymentUpdateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <PaymentIcon color="primary" />
            <Box>
              <Typography variant="h6">
                Update Payment Status
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {selectedPurchaseForPayment?.purchase_number} - {selectedPurchaseForPayment?.supplier_name}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ mb: 2, bgcolor: 'grey.50' }}>
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Purchase Details
                    </Typography>
                    <Typography variant="body1">
                      <strong>Total Amount:</strong> ₹{selectedPurchaseForPayment?.total_amount?.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Current Paid:</strong> ₹{selectedPurchaseForPayment?.paid_amount?.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Balance:</strong> ₹{(selectedPurchaseForPayment?.total_amount - selectedPurchaseForPayment?.paid_amount)?.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentUpdateData.payment_status_selection}
                    onChange={(e) => handlePaymentUpdateStatusChange(e.target.value)}
                    label="Payment Status"
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Partial">Partial</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Paid Amount"
                  type="number"
                  value={paymentUpdateData.paid_amount}
                  onChange={(e) => {
                    const newAmount = parseFloat(e.target.value) || 0;
                    const totalAmount = selectedPurchaseForPayment?.total_amount || 0;
                    
                    // Auto-update payment status based on amount
                    let newStatus = 'Pending';
                    if (newAmount <= 0) {
                      newStatus = 'Pending';
                    } else if (newAmount >= totalAmount) {
                      newStatus = 'Paid';
                    } else {
                      newStatus = 'Partial';
                    }
                    
                    setPaymentUpdateData({
                      ...paymentUpdateData,
                      paid_amount: newAmount,
                      payment_status_selection: newStatus
                    });
                  }}
                  inputProps={{
                    min: 0,
                    max: selectedPurchaseForPayment?.total_amount || 0,
                    step: 0.01
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentUpdateData.payment_method}
                    onChange={(e) => setPaymentUpdateData({
                      ...paymentUpdateData,
                      payment_method: e.target.value
                    })}
                    label="Payment Method"
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                    <MenuItem value="Credit">Credit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Payment Notes"
                  multiline
                  rows={3}
                  value={paymentUpdateData.payment_notes}
                  onChange={(e) => setPaymentUpdateData({
                    ...paymentUpdateData,
                    payment_notes: e.target.value
                  })}
                  placeholder="Add any notes about this payment..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentUpdateDialog}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePaymentStatus}
            variant="contained"
            startIcon={<PaymentIcon />}
          >
            Update Payment
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

export default InventoryPurchase;