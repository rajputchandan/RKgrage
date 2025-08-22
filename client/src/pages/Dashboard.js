import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Chip,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Inventory,
  People,
  Receipt,
  TrendingUp,
  Today,
  DateRange,
  Email,
  Send
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalParts: 0,
    totalCustomers: 0,
    totalBills: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [reportTab, setReportTab] = useState(0);
  const [billingReports, setBillingReports] = useState({
    today: { totalBills: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0, paidBills: 0, pendingBills: 0 },
    thisWeek: { totalBills: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0, paidBills: 0, pendingBills: 0 }
  });
  const [partsReports, setPartsReports] = useState({
    today: { totalParts: 0, totalValue: 0, lowStockParts: 0, outOfStockParts: 0 },
    thisWeek: { totalParts: 0, totalValue: 0, lowStockParts: 0, outOfStockParts: 0 },
    inventory: { totalParts: 0, totalValue: 0, inStockParts: 0, lowStockParts: 0, outOfStockParts: 0 },
    lowStockDetails: [],
    outOfStockDetails: []
  });
  const [sendingReport, setSendingReport] = useState(false);
  const [reportStatus, setReportStatus] = useState({ open: false, message: '', severity: 'success' });

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch real data from API endpoints
      const [partsResponse, customersResponse, billingStatsResponse, billingReportsResponse, partsReportsResponse] = await Promise.all([
        axios.get('/api/parts/'),
        axios.get('/api/customers/'),
        axios.get('/api/billing/stats'),
        axios.get('/api/billing/dashboard-reports'),
        axios.get('/api/parts/dashboard-reports')
      ]);

      // Extract data from the new API structure
      const totalParts = partsResponse.data.success ? partsResponse.data.data.length : 0;
      const totalCustomers = customersResponse.data.success ? customersResponse.data.data.length : 0;
      
      // Get billing stats
      const billingStats = billingStatsResponse.data.success ? billingStatsResponse.data.data : {};
      const totalBills = billingStats.total_bills || 0;
      const monthlyRevenue = billingStats.total_revenue || 0;

      setStats({
        totalParts,
        totalCustomers,
        totalBills,
        monthlyRevenue
      });

      // Set billing reports data
      if (billingReportsResponse.data.success) {
        setBillingReports(billingReportsResponse.data.data);
      }

      // Set parts reports data
      if (partsReportsResponse.data.success) {
        setPartsReports(partsReportsResponse.data.data);
      }

      // Generate mock chart data for demonstration
      const mockChartData = [
        { month: 'Jan', revenue: 35000, bills: 18 },
        { month: 'Feb', revenue: 42000, bills: 22 },
        { month: 'Mar', revenue: 38000, bills: 20 },
        { month: 'Apr', revenue: 45000, bills: 25 },
        { month: 'May', revenue: 41000, bills: 23 },
        { month: 'Jun', revenue: 48000, bills: 28 }
      ];

      setChartData(mockChartData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data if API calls fail
      setStats({
        totalParts: 0,
        totalCustomers: 0,
        totalBills: 0,
        monthlyRevenue: 0
      });
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      // Get the token from localStorage (assuming it's stored there)
      const token = localStorage.getItem('token');
      
      const response = await axios.post('/api/reports/send-daily-report', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setReportStatus({
          open: true,
          message: 'Daily report sent successfully to admin email!',
          severity: 'success'
        });
      } else {
        throw new Error(response.data.message || 'Failed to send report');
      }
    } catch (error) {
      console.error('Error sending report:', error);
      setReportStatus({
        open: true,
        message: error.response?.data?.message || 'Failed to send report. Please try again.',
        severity: 'error'
      });
    } finally {
      setSendingReport(false);
    }
  };

  const handleCloseSnackbar = () => {
    setReportStatus({ ...reportStatus, open: false });
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: '50%',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Parts"
            value={stats.totalParts}
            icon={<Inventory sx={{ color: 'white' }} />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<People sx={{ color: 'white' }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bills"
            value={stats.totalBills}
            icon={<Receipt sx={{ color: 'white' }} />}
            color="warning.main"
          />
        </Grid>
        {/* <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`$${stats.monthlyRevenue.toLocaleString()}`}
            icon={<TrendingUp sx={{ color: 'white' }} />}
            color="info.main"
          />
        </Grid> */}
      </Grid>

      {/* <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Monthly Revenue & Bills
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
                <Bar yAxisId="right" dataKey="bills" fill="#82ca9d" name="Bills" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Database: Connected
              </Typography>
              <Typography variant="caption" color="textSecondary">
                All systems operational
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                API Endpoints: Active
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Ready for data operations
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Authentication: Secure
              </Typography>
              <Typography variant="caption" color="textSecondary">
                JWT tokens enabled
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid> */}

      {/* Reports Section */}
      <Box sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            Reports & Analytics
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={sendingReport ? <CircularProgress size={20} color="inherit" /> : <Send />}
            onClick={handleSendReport}
            disabled={sendingReport}
            sx={{
              minWidth: 180,
              height: 40
            }}
          >
            {sendingReport ? 'Sending...' : 'Send Daily Report'}
          </Button>
        </Box>
        
        <Paper sx={{ p: 3 }}>
          <Tabs value={reportTab} onChange={(e, newValue) => setReportTab(newValue)} sx={{ mb: 3 }}>
            <Tab label="Billing Reports" />
            <Tab label="Parts Reports" />
          </Tabs>

          {reportTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Billing Reports
                </Typography>
              </Grid>
              
              {/* Today's Billing */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Today sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Today's Billing</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="primary">
                            {billingReports.today.totalBills}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Bills
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="success.main">
                            ₹{billingReports.today.totalAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Amount
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="success.main">
                            ₹{billingReports.today.paidAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Paid Amount
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="warning.main">
                            ₹{billingReports.today.pendingAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Pending Amount
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* This Week's Billing */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <DateRange sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6">This Week's Billing</Typography>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="primary">
                            {billingReports.thisWeek.totalBills}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Bills
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h4" color="success.main">
                            ₹{billingReports.thisWeek.totalAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Total Amount
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="success.main">
                            ₹{billingReports.thisWeek.paidAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Paid Amount
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center">
                          <Typography variant="h5" color="warning.main">
                            ₹{billingReports.thisWeek.pendingAmount.toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            Pending Amount
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {reportTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Parts Reports
                </Typography>
              </Grid>
              
              {/* Today's Parts */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Today sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Today's Parts</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {partsReports.today.totalParts}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        New Parts Added
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        ₹{partsReports.today.totalValue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Value
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* This Week's Parts */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <DateRange sx={{ mr: 1, color: 'info.main' }} />
                      <Typography variant="h6">This Week's Parts</Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {partsReports.thisWeek.totalParts}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        New Parts Added
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        ₹{partsReports.thisWeek.totalValue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Total Value
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Inventory Overview */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Inventory sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="h6">Inventory Status</Typography>
                    </Box>
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">In Stock:</Typography>
                        <Chip label={partsReports.inventory.inStockParts} color="success" size="small" />
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Low Stock:</Typography>
                        <Chip label={partsReports.inventory.lowStockParts} color="warning" size="small" />
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Typography variant="body2">Out of Stock:</Typography>
                        <Chip label={partsReports.inventory.outOfStockParts} color="error" size="small" />
                      </Box>
                      <Typography variant="h6" color="success.main" textAlign="center">
                        ₹{partsReports.inventory.totalValue.toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" textAlign="center">
                        Total Inventory Value
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Low Stock Parts Details */}
              {partsReports.lowStockDetails && partsReports.lowStockDetails.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="warning.main">
                        ⚠️ Parts Running Low Today
                      </Typography>
                      <Box>
                        {partsReports.lowStockDetails.map((part, index) => (
                          <Box key={index} sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            mb: 1,
                            backgroundColor: 'warning.light',
                            borderRadius: 1,
                            color: 'warning.contrastText'
                          }}>
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                {part.name}
                              </Typography>
                              <Typography variant="body2">
                                Part #: {part.part_number} | Category: {part.category}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="body2">
                                Current: {part.current_stock}
                              </Typography>
                              <Typography variant="body2">
                                Min Required: {part.min_stock_level}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Out of Stock Parts Details */}
              {partsReports.outOfStockDetails && partsReports.outOfStockDetails.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="error.main">
                        🚨 Parts Out of Stock Today
                      </Typography>
                      <Box>
                        {partsReports.outOfStockDetails.map((part, index) => (
                          <Box key={index} sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            mb: 1,
                            backgroundColor: 'error.light',
                            borderRadius: 1,
                            color: 'error.contrastText'
                          }}>
                            <Box>
                              <Typography variant="body1" fontWeight="bold">
                                {part.name}
                              </Typography>
                              <Typography variant="body2">
                                Part #: {part.part_number} | Category: {part.category}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="body2">
                                Status: OUT OF STOCK
                              </Typography>
                              <Typography variant="body2">
                                Min Required: {part.min_stock_level}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </Paper>
      </Box>

      {/* Snackbar for report status */}
      <Snackbar
        open={reportStatus.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={reportStatus.severity}
          sx={{ width: '100%' }}
        >
          {reportStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
