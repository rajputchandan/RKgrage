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
  Divider,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Menu,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalance as BankIcon,
  DeleteForever as PermanentDeleteIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAdvanceDialog, setOpenAdvanceDialog] = useState(false);
  const [openSalaryDialog, setOpenSalaryDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [openEmployeeDetailsDialog, setOpenEmployeeDetailsDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuEmployee, setMenuEmployee] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({});
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [showInactiveEmployees, setShowInactiveEmployees] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Active');

  // Employee form data
  const [employeeData, setEmployeeData] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    position: '',
    department: 'General',
    joining_date: new Date().toISOString().split('T')[0],
    monthly_salary: 0,
    salary_type: 'Monthly',
    bank_details: {
      account_number: '',
      bank_name: '',
      ifsc_code: '',
      account_holder_name: ''
    },
    emergency_contact: {
      name: '',
      mobile: '',
      relation: ''
    }
  });

  // Advance payment data
  const [advanceData, setAdvanceData] = useState({
    amount: 0,
    reason: ''
  });

  // Salary processing data
  const [salaryData, setSalaryData] = useState({
    month: new Date().toISOString().slice(0, 7), // YYYY-MM format
    other_deductions: 0,
    bonus: 0,
    overtime_amount: 0,
    payment_method: 'Cash',
    notes: ''
  });

  // Payment update data
  const [paymentData, setPaymentData] = useState({
    payment_status: 'Paid',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchEmployeeStats();
    fetchUpcomingPayments();
  }, []);

  // Refetch employees when status filter changes
  useEffect(() => {
    if (statusFilter) {
      fetchEmployees();
    }
  }, [statusFilter]);

  // Filter employees based on search and status
  useEffect(() => {
    let filtered = employees;
    
    // Filter by status first
    if (statusFilter && statusFilter !== 'All') {
      filtered = filtered.filter(employee => employee.status === statusFilter);
    }
    
    // Then filter by comprehensive search term across all columns
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchLower) ||
        employee.employee_id.toLowerCase().includes(searchLower) ||
        employee.mobile.includes(searchTerm) ||
        employee.position.toLowerCase().includes(searchLower) ||
        employee.department.toLowerCase().includes(searchLower) ||
        employee.email?.toLowerCase().includes(searchLower) ||
        employee.address?.toLowerCase().includes(searchLower) ||
        employee.monthly_salary.toString().includes(searchTerm) ||
        employee.status.toLowerCase().includes(searchLower) ||
        employee.salary_type?.toLowerCase().includes(searchLower) ||
        employee.pending_advance_amount?.toString().includes(searchTerm) ||
        employee.days_until_payment?.toString().includes(searchTerm) ||
        (employee.bank_details?.bank_name?.toLowerCase().includes(searchLower)) ||
        (employee.bank_details?.account_number?.includes(searchTerm)) ||
        (employee.emergency_contact?.name?.toLowerCase().includes(searchLower)) ||
        (employee.emergency_contact?.mobile?.includes(searchTerm))
      );
    }
    
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, statusFilter]);

  const fetchEmployees = async () => {
    try {
      // Build query parameters based on current filter
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All') {
        params.append('status', statusFilter);
      }
      
      const response = await axios.get(`/api/employees/?${params.toString()}`);
      if (response.data.success) {
        const employeesWithId = response.data.data.map(employee => ({
          ...employee,
          id: employee._id
        }));
        setEmployees(employeesWithId);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch employees',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeStats = async () => {
    try {
      const response = await axios.get('/api/employees/stats');
      if (response.data.success) {
        setEmployeeStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
    }
  };

  const fetchUpcomingPayments = async () => {
    try {
      const response = await axios.get('/api/employees/upcoming-payments?days=7');
      if (response.data.success) {
        setUpcomingPayments(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
    }
  };

  const handleOpenEmployeeDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setEmployeeData({
        name: employee.name,
        email: employee.email || '',
        mobile: employee.mobile,
        address: employee.address || '',
        position: employee.position,
        department: employee.department || 'General',
        joining_date: employee.joining_date.split('T')[0],
        monthly_salary: employee.monthly_salary,
        salary_type: employee.salary_type || 'Monthly',
        bank_details: employee.bank_details || {
          account_number: '',
          bank_name: '',
          ifsc_code: '',
          account_holder_name: ''
        },
        emergency_contact: employee.emergency_contact || {
          name: '',
          mobile: '',
          relation: ''
        }
      });
    } else {
      setEditingEmployee(null);
      setEmployeeData({
        name: '',
        email: '',
        mobile: '',
        address: '',
        position: '',
        department: 'General',
        joining_date: new Date().toISOString().split('T')[0],
        monthly_salary: 0,
        salary_type: 'Monthly',
        bank_details: {
          account_number: '',
          bank_name: '',
          ifsc_code: '',
          account_holder_name: ''
        },
        emergency_contact: {
          name: '',
          mobile: '',
          relation: ''
        }
      });
    }
    setOpenDialog(true);
  };

  const handleCloseEmployeeDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
  };

  const handleSubmitEmployee = async () => {
    try {
      let response;
      if (editingEmployee) {
        response = await axios.put(`/api/employees/update/${editingEmployee._id}`, employeeData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Employee updated successfully!', severity: 'success' });
        }
      } else {
        response = await axios.post('/api/employees/add', employeeData);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Employee added successfully!', severity: 'success' });
        }
      }
      
      handleCloseEmployeeDialog();
      fetchEmployees();
      fetchEmployeeStats();
    } catch (error) {
      console.error('Employee submit error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to save employee',
        severity: 'error'
      });
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this employee?')) {
      try {
        const response = await axios.delete(`/api/employees/delete/${id}`);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Employee deactivated successfully!', severity: 'success' });
          fetchEmployees();
          fetchEmployeeStats();
        }
      } catch (error) {
        console.error('Delete employee error:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Delete failed',
          severity: 'error'
        });
      }
    }
  };

  const handlePermanentDeleteEmployee = async (id) => {
    if (window.confirm('⚠️ PERMANENT DELETE WARNING ⚠️\n\nThis will COMPLETELY remove the employee and ALL associated records including:\n• Salary payment history\n• Advance payment records\n• All financial data\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to proceed?')) {
      try {
        const response = await axios.delete(`/api/employees/permanent-delete/${id}`);
        if (response.data.success) {
          setSnackbar({ open: true, message: 'Employee and all records permanently deleted successfully!', severity: 'success' });
          fetchEmployees();
          fetchEmployeeStats();
        }
      } catch (error) {
        console.error('Permanent delete employee error:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.message || 'Permanent delete failed',
          severity: 'error'
        });
      }
    }
  };

  const handleOpenMenu = (event, employee) => {
    setAnchorEl(event.currentTarget);
    setMenuEmployee(employee);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuEmployee(null);
  };

  const handleOpenEmployeeDetails = (employee) => {
    setSelectedEmployee(employee);
    setOpenEmployeeDetailsDialog(true);
    handleCloseMenu();
  };

  const handleOpenAdvanceDialog = (employee) => {
    setSelectedEmployee(employee);
    setAdvanceData({ amount: 0, reason: '' });
    setOpenAdvanceDialog(true);
  };

  const handleSubmitAdvance = async () => {
    // Validate advance amount
    const maxAdvance = selectedEmployee.monthly_salary * 0.5;
    const currentPendingAdvance = selectedEmployee.pending_advance_amount || 0;
    const totalAdvanceAfterNew = currentPendingAdvance + advanceData.amount;

    if (totalAdvanceAfterNew > maxAdvance) {
      setSnackbar({
        open: true,
        message: `Warning: Total advance amount (${formatCurrency(totalAdvanceAfterNew)}) exceeds 50% of monthly salary (${formatCurrency(maxAdvance)}). Maximum allowed advance is ${formatCurrency(maxAdvance - currentPendingAdvance)}.`,
        severity: 'warning'
      });
      return;
    }

    if (advanceData.amount <= 0) {
      setSnackbar({
        open: true,
        message: 'Please enter a valid advance amount',
        severity: 'error'
      });
      return;
    }

    try {
      const response = await axios.post(`/api/employees/${selectedEmployee._id}/advance-payment`, advanceData);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Advance payment added successfully!', severity: 'success' });
        setOpenAdvanceDialog(false);
        await fetchEmployees();
        await fetchEmployeeStats();
        // Refresh the selected employee data if details dialog is open
        if (openEmployeeDetailsDialog && selectedEmployee) {
          const updatedEmployee = response.data.data;
          setSelectedEmployee({
            ...updatedEmployee,
            id: updatedEmployee._id
          });
        }
      }
    } catch (error) {
      console.error('Advance payment error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to add advance payment',
        severity: 'error'
      });
    }
  };

  const handleOpenSalaryDialog = (employee) => {
    setSelectedEmployee(employee);
    setSalaryData({
      month: new Date().toISOString().slice(0, 7),
      other_deductions: 0,
      bonus: 0,
      overtime_amount: 0,
      payment_method: 'Cash',
      notes: ''
    });
    setOpenSalaryDialog(true);
  };

  const handleSubmitSalary = async () => {
    try {
      const response = await axios.post(`/api/employees/${selectedEmployee._id}/process-salary`, salaryData);
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Monthly salary processed successfully!', severity: 'success' });
        setOpenSalaryDialog(false);
        await fetchEmployees();
        await fetchEmployeeStats();
        // Refresh the selected employee data if details dialog is open
        if (openEmployeeDetailsDialog && selectedEmployee) {
          const updatedEmployee = response.data.data;
          setSelectedEmployee({
            ...updatedEmployee,
            id: updatedEmployee._id
          });
        }
      }
    } catch (error) {
      console.error('Salary processing error:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to process salary',
        severity: 'error'
      });
    }
  };

  const handleOpenPaymentDialog = (employee, salaryPayment) => {
    setSelectedEmployee({ ...employee, selectedPayment: salaryPayment });
    setPaymentData({
      payment_status: 'Paid',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: salaryPayment.payment_method || 'Cash',
      notes: ''
    });
    setOpenPaymentDialog(true);
  };

  const handleSubmitPayment = async () => {
    try {
      const response = await axios.put(
        `/api/employees/${selectedEmployee._id}/salary-payment/${selectedEmployee.selectedPayment._id}`,
        paymentData
      );
      if (response.data.success) {
        setSnackbar({ open: true, message: 'Payment status updated successfully!', severity: 'success' });
        setOpenPaymentDialog(false);
        await fetchEmployees();
        await fetchEmployeeStats();
        // Refresh the selected employee data if details dialog is open
        if (openEmployeeDetailsDialog && selectedEmployee) {
          const updatedEmployee = response.data.data;
          setSelectedEmployee({
            ...updatedEmployee,
            id: updatedEmployee._id
          });
        }
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Inactive': return 'default';
      case 'Terminated': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'Paid': return 'success';
      case 'Pending': return 'error';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => `₹${amount?.toFixed(2) || '0.00'}`;

  const columns = [
    { field: 'employee_id', headerName: 'Employee ID', width: 120 },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'position', headerName: 'Position', width: 130 },
    { field: 'department', headerName: 'Department', width: 120 },
    { field: 'mobile', headerName: 'Mobile', width: 120 },
    { 
      field: 'monthly_salary', 
      headerName: 'Salary', 
      width: 100,
      valueFormatter: (params) => formatCurrency(params.value)
    },
    {
      field: 'days_until_payment',
      headerName: 'Days to Pay',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value <= 3 ? 'error' : params.value <= 7 ? 'warning' : 'default'}
          size="small"
        />
      )
    },
    {
      field: 'pending_advance_amount',
      headerName: 'Pending Advance',
      width: 130,
      renderCell: (params) => (
        <Typography variant="body2" color={params.value > 0 ? 'error.main' : 'text.secondary'}>
          {formatCurrency(params.value)}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getStatusColor(params.value)}
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
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleOpenEmployeeDetails(params.row)}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleOpenEmployeeDialog(params.row)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Advance">
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenAdvanceDialog(params.row)}
            >
              <MoneyIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Process Salary">
            <IconButton
              size="small"
              color="success"
              onClick={() => handleOpenSalaryDialog(params.row)}
            >
              <PaymentIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="More Options">
            <IconButton
              size="small"
              onClick={(e) => handleOpenMenu(e, params.row)}
            >
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenEmployeeDialog()}
        >
          Add Employee
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {employeeStats.total || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="success.main">
                {employeeStats.active || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Active Employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {employeeStats.pendingPayments || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Payments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {formatCurrency(employeeStats.totalPendingAdvance)}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pending Advances
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Employees and Upcoming Payments */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab
            icon={<PersonIcon />}
            label="All Employees"
            iconPosition="start"
          />
          <Tab
            icon={<Badge badgeContent={upcomingPayments.length} color="error"><ScheduleIcon /></Badge>}
            label="Upcoming Payments"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Box>
          {/* Search and Filter for employees */}
          <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
            <TextField
              label="Search Employees"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 350 }}
              placeholder="Search by name, ID, mobile, position, department, email, salary, status..."
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="All">All Employees</MenuItem>
                <MenuItem value="Active">Active Only</MenuItem>
                <MenuItem value="Inactive">Inactive Only</MenuItem>
                <MenuItem value="Terminated">Terminated Only</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="textSecondary">
              Showing {filteredEmployees.length} of {employees.length} employees
              {statusFilter !== 'All' && ` (${statusFilter})`}
            </Typography>
          </Box>

          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={filteredEmployees}
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
          <Typography variant="h6" gutterBottom>
            Employees with payments due in next 7 days
          </Typography>
          <Paper sx={{ maxHeight: 600, overflow: 'auto' }}>
            <List>
              {upcomingPayments.map((employee, index) => (
                <ListItem key={index} divider>
                  <ListItemIcon>
                    <ScheduleIcon color={employee.days_until_payment <= 3 ? 'error' : 'warning'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${employee.name} (${employee.employee_id})`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          Position: {employee.position} | Salary: {formatCurrency(employee.monthly_salary)}
                        </Typography>
                        <Typography variant="body2" color={employee.days_until_payment <= 3 ? 'error.main' : 'warning.main'}>
                          Payment due in {employee.days_until_payment} days ({new Date(employee.payment_due_date).toLocaleDateString()})
                        </Typography>
                      </Box>
                    }
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleOpenSalaryDialog(employee)}
                    startIcon={<PaymentIcon />}
                  >
                    Process Payment
                  </Button>
                </ListItem>
              ))}
              {upcomingPayments.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary="No upcoming payments"
                    secondary="All employees are up to date with their payments"
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      )}

      {/* Employee Dialog */}
      <Dialog open={openDialog} onClose={handleCloseEmployeeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={employeeData.name}
                  onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={employeeData.mobile}
                  onChange={(e) => setEmployeeData({ ...employeeData, mobile: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={employeeData.email}
                  onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Position"
                  value={employeeData.position}
                  onChange={(e) => setEmployeeData({ ...employeeData, position: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={employeeData.department}
                    onChange={(e) => setEmployeeData({ ...employeeData, department: e.target.value })}
                    label="Department"
                  >
                    <MenuItem value="General">General</MenuItem>
                    <MenuItem value="Sales">Sales</MenuItem>
                    <MenuItem value="Service">Service</MenuItem>
                    <MenuItem value="Accounts">Accounts</MenuItem>
                    <MenuItem value="HR">HR</MenuItem>
                    <MenuItem value="IT">IT</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  type="date"
                  value={employeeData.joining_date}
                  onChange={(e) => setEmployeeData({ ...employeeData, joining_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Monthly Salary"
                  type="number"
                  value={employeeData.monthly_salary}
                  onChange={(e) => setEmployeeData({ ...employeeData, monthly_salary: parseFloat(e.target.value) || 0 })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Salary Type</InputLabel>
                  <Select
                    value={employeeData.salary_type}
                    onChange={(e) => setEmployeeData({ ...employeeData, salary_type: e.target.value })}
                    label="Salary Type"
                  >
                    <MenuItem value="Monthly">Monthly</MenuItem>
                    <MenuItem value="Daily">Daily</MenuItem>
                    <MenuItem value="Hourly">Hourly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  value={employeeData.address}
                  onChange={(e) => setEmployeeData({ ...employeeData, address: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEmployeeDialog}>Cancel</Button>
          <Button onClick={handleSubmitEmployee} variant="contained">
            {editingEmployee ? 'Update Employee' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Advance Payment Dialog */}
      <Dialog open={openAdvanceDialog} onClose={() => setOpenAdvanceDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Advance Payment</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Employee: {selectedEmployee?.name} ({selectedEmployee?.employee_id})
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Monthly Salary: {formatCurrency(selectedEmployee?.monthly_salary)}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Advance Amount"
                  type="number"
                  value={advanceData.amount}
                  onChange={(e) => setAdvanceData({ ...advanceData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
                {advanceData.amount > 0 && (
                  <Box sx={{ mt: 1 }}>
                    {(() => {
                      const maxAdvance = selectedEmployee?.monthly_salary * 0.5;
                      const currentPending = selectedEmployee?.pending_advance_amount || 0;
                      const totalAfterNew = currentPending + advanceData.amount;
                      const remainingAllowed = maxAdvance - currentPending;
                      
                      if (totalAfterNew > maxAdvance) {
                        return (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            Warning: Total advance ({formatCurrency(totalAfterNew)}) exceeds 50% limit ({formatCurrency(maxAdvance)}).
                            Maximum allowed: {formatCurrency(remainingAllowed)}
                          </Alert>
                        );
                      } else if (totalAfterNew > maxAdvance * 0.8) {
                        return (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            Caution: Total advance ({formatCurrency(totalAfterNew)}) is approaching 50% limit ({formatCurrency(maxAdvance)}).
                            Remaining: {formatCurrency(remainingAllowed)}
                          </Alert>
                        );
                      } else {
                        return (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            Total advance after this payment: {formatCurrency(totalAfterNew)} / {formatCurrency(maxAdvance)} (50% limit)
                          </Alert>
                        );
                      }
                    })()}
                  </Box>
                )}
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  multiline
                  rows={3}
                  value={advanceData.reason}
                  onChange={(e) => setAdvanceData({ ...advanceData, reason: e.target.value })}
                  placeholder="Reason for advance payment..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdvanceDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitAdvance} variant="contained">
            Add Advance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Salary Processing Dialog */}
      <Dialog open={openSalaryDialog} onClose={() => setOpenSalaryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process Monthly Salary</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Employee: {selectedEmployee?.name} ({selectedEmployee?.employee_id})
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Basic Salary: {formatCurrency(selectedEmployee?.monthly_salary)}
            </Typography>
            <Typography variant="body2" color="error.main" gutterBottom>
              Pending Advance: {formatCurrency(selectedEmployee?.pending_advance_amount)}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Month"
                  type="month"
                  value={salaryData.month}
                  onChange={(e) => setSalaryData({ ...salaryData, month: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={salaryData.payment_method}
                    onChange={(e) => setSalaryData({ ...salaryData, payment_method: e.target.value })}
                    label="Payment Method"
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Bonus"
                  type="number"
                  value={salaryData.bonus}
                  onChange={(e) => setSalaryData({ ...salaryData, bonus: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Overtime Amount"
                  type="number"
                  value={salaryData.overtime_amount}
                  onChange={(e) => setSalaryData({ ...salaryData, overtime_amount: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Other Deductions"
                  type="number"
                  value={salaryData.other_deductions}
                  onChange={(e) => setSalaryData({ ...salaryData, other_deductions: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ bgcolor: 'info.light', p: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    Net Salary: {formatCurrency(
                      selectedEmployee?.monthly_salary + 
                      salaryData.bonus + 
                      salaryData.overtime_amount - 
                      Math.min(selectedEmployee?.pending_advance_amount || 0, selectedEmployee?.monthly_salary * 0.5) - 
                      salaryData.other_deductions
                    )}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={salaryData.notes}
                  onChange={(e) => setSalaryData({ ...salaryData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSalaryDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitSalary} variant="contained">
            Process Salary
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Status Update Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Payment Status</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Employee: {selectedEmployee?.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Month: {selectedEmployee?.selectedPayment?.month}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Net Salary: {formatCurrency(selectedEmployee?.selectedPayment?.net_salary)}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentData.payment_status}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_status: e.target.value })}
                    label="Payment Status"
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Paid">Paid</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment Date"
                  type="date"
                  value={paymentData.payment_date}
                  onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({ ...paymentData, payment_method: e.target.value })}
                    label="Payment Method"
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    <MenuItem value="Cheque">Cheque</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                  placeholder="Payment notes..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmitPayment} variant="contained">
            Update Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog open={openEmployeeDetailsDialog} onClose={() => setOpenEmployeeDetailsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Employee Details - {selectedEmployee?.name} ({selectedEmployee?.employee_id})
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Basic Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Name:</Typography>
                        <Typography variant="body1">{selectedEmployee?.name}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Employee ID:</Typography>
                        <Typography variant="body1">{selectedEmployee?.employee_id}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Position:</Typography>
                        <Typography variant="body1">{selectedEmployee?.position}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Department:</Typography>
                        <Typography variant="body1">{selectedEmployee?.department}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Mobile:</Typography>
                        <Typography variant="body1">{selectedEmployee?.mobile}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Email:</Typography>
                        <Typography variant="body1">{selectedEmployee?.email || 'N/A'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Joining Date:</Typography>
                        <Typography variant="body1">
                          {selectedEmployee?.joining_date ? new Date(selectedEmployee.joining_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Monthly Salary:</Typography>
                        <Typography variant="body1">{formatCurrency(selectedEmployee?.monthly_salary)}</Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Status:</Typography>
                        <Chip
                          label={selectedEmployee?.status}
                          color={getStatusColor(selectedEmployee?.status)}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Monthly Salary Due Information */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Salary Schedule
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Next Salary Due:</Typography>
                        <Typography variant="h6" color="warning.main">
                          {selectedEmployee?.current_month_completion ?
                            new Date(selectedEmployee.current_month_completion).toLocaleDateString() :
                            'Calculating...'
                          }
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Days Remaining:</Typography>
                        <Chip
                          label={`${selectedEmployee?.days_until_payment || 0} days`}
                          color={
                            (selectedEmployee?.days_until_payment || 0) <= 3 ? 'error' :
                            (selectedEmployee?.days_until_payment || 0) <= 7 ? 'warning' : 'success'
                          }
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Current Month Status:</Typography>
                        <Chip
                          label={selectedEmployee?.current_month_paid ? 'Paid' : 'Pending'}
                          color={selectedEmployee?.current_month_paid ? 'success' : 'error'}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary">Expected Net Salary:</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {formatCurrency(
                            (selectedEmployee?.monthly_salary || 0) -
                            Math.min(
                              selectedEmployee?.pending_advance_amount || 0,
                              (selectedEmployee?.monthly_salary || 0) * 0.5
                            )
                          )}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          (After advance deduction: {formatCurrency(
                            Math.min(
                              selectedEmployee?.pending_advance_amount || 0,
                              (selectedEmployee?.monthly_salary || 0) * 0.5
                            )
                          )})
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Advance Payments */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Advance Payments
                    </Typography>
                    <Typography variant="body2" color="error.main" gutterBottom>
                      Total Pending: {formatCurrency(selectedEmployee?.pending_advance_amount)}
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                      {selectedEmployee?.advance_payments?.length > 0 ? (
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Amount</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Deduction Month</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedEmployee.advance_payments.map((advance, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(advance.date).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(advance.createdAt || advance.date).toLocaleTimeString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>{formatCurrency(advance.amount)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={advance.deducted_from_salary ? 'Deducted' : 'Pending'}
                                    color={advance.deducted_from_salary ? 'success' : 'error'}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  {advance.deduction_month || 'Not yet deducted'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No advance payments recorded
                        </Typography>
                      )}
                    </Box>
                    {selectedEmployee?.advance_payments?.filter(a => !a.deducted_from_salary).length > 0 && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          Amount to be deducted on next salary: {formatCurrency(
                            Math.min(
                              selectedEmployee.advance_payments
                                .filter(a => !a.deducted_from_salary)
                                .reduce((sum, a) => sum + a.amount, 0),
                              selectedEmployee.monthly_salary * 0.5
                            )
                          )}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          (Maximum 50% of monthly salary can be deducted)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Salary History */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Salary Payment History
                    </Typography>
                    <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                      {selectedEmployee?.salary_payments?.length > 0 ? (
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Month</TableCell>
                              <TableCell>Basic Salary</TableCell>
                              <TableCell>Advance Deduction</TableCell>
                              <TableCell>Other Deductions</TableCell>
                              <TableCell>Bonus</TableCell>
                              <TableCell>Net Salary</TableCell>
                              <TableCell>Status</TableCell>
                              <TableCell>Entry Date</TableCell>
                              <TableCell>Payment Date</TableCell>
                              <TableCell>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedEmployee.salary_payments.map((salary, index) => (
                              <TableRow key={index}>
                                <TableCell>{salary.month}</TableCell>
                                <TableCell>{formatCurrency(salary.basic_salary)}</TableCell>
                                <TableCell>{formatCurrency(salary.advance_deductions)}</TableCell>
                                <TableCell>{formatCurrency(salary.other_deductions)}</TableCell>
                                <TableCell>{formatCurrency(salary.bonus)}</TableCell>
                                <TableCell fontWeight="medium">{formatCurrency(salary.net_salary)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={salary.payment_status}
                                    color={getPaymentStatusColor(salary.payment_status)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(salary.createdAt || salary.date).toLocaleDateString()}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(salary.createdAt || salary.date).toLocaleTimeString()}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {salary.payment_date ? new Date(salary.payment_date).toLocaleDateString() : 'Not paid'}
                                </TableCell>
                                <TableCell>
                                  {salary.payment_status === 'Pending' && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => handleOpenPaymentDialog(selectedEmployee, salary)}
                                    >
                                      Update
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          No salary payments recorded
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmployeeDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => { handleDeleteEmployee(menuEmployee?.id); handleCloseMenu(); }}>
          <DeleteIcon sx={{ mr: 1 }} />
          Deactivate Employee
        </MenuItem>
        <MenuItem
          onClick={() => { handlePermanentDeleteEmployee(menuEmployee?.id); handleCloseMenu(); }}
          sx={{ color: 'error.main' }}
        >
          <PermanentDeleteIcon sx={{ mr: 1 }} />
          Permanent Delete
        </MenuItem>
      </Menu>

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

export default EmployeeManagement;