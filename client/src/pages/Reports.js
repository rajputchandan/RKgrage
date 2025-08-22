import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Card,
  CardContent
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState('month');

  const salesData = [
    { month: 'Jan', revenue: 12000, profit: 8000 },
    { month: 'Feb', revenue: 13500, profit: 9000 },
    { month: 'Mar', revenue: 14200, profit: 9500 },
    { month: 'Apr', revenue: 13800, profit: 9200 },
    { month: 'May', revenue: 15420, profit: 10200 },
    { month: 'Jun', revenue: 16200, profit: 10800 }
  ];

  const partsData = [
    { name: 'Brakes', value: 35, color: '#8884d8' },
    { name: 'Engine', value: 25, color: '#82ca9d' },
    { name: 'Exterior', value: 20, color: '#ffc658' },
    { name: 'Interior', value: 15, color: '#ff7300' },
    { name: 'Electrical', value: 5, color: '#00ff00' }
  ];

  const customerData = [
    { month: 'Jan', new: 12, returning: 8 },
    { month: 'Feb', new: 15, returning: 10 },
    { month: 'Mar', new: 18, returning: 12 },
    { month: 'Apr', new: 14, returning: 9 },
    { month: 'May', new: 20, returning: 15 },
    { month: 'Jun', new: 22, returning: 18 }
  ];

  const renderSalesReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Monthly Revenue & Profit
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="profit" fill="#82ca9d" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Total Revenue (6 months)
            </Typography>
            <Typography variant="h4" color="primary">
              ${salesData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Total Profit (6 months)
            </Typography>
            <Typography variant="h4" color="success.main">
              ${salesData.reduce((sum, item) => sum + item.profit, 0).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              Average Monthly Revenue
            </Typography>
            <Typography variant="h6">
              ${(salesData.reduce((sum, item) => sum + item.revenue, 0) / 6).toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderPartsReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Parts Sales by Category
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={partsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {partsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Top Selling Parts
          </Typography>
          <Box sx={{ mt: 2 }}>
            {partsData.map((part, index) => (
              <Box key={part.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body1">
                  {index + 1}. {part.name}
                </Typography>
                <Typography variant="body1" color="primary">
                  {part.value}%
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderCustomerReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Customer Growth
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={customerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="new" stroke="#8884d8" name="New Customers" />
              <Line type="monotone" dataKey="returning" stroke="#82ca9d" name="Returning Customers" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total New Customers
            </Typography>
            <Typography variant="h3" color="primary">
              {customerData.reduce((sum, item) => sum + item.new, 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Total Returning Customers
            </Typography>
            <Typography variant="h3" color="success.main">
              {customerData.reduce((sum, item) => sum + item.returning, 0)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Customer Retention Rate
            </Typography>
            <Typography variant="h3" color="info.main">
              {Math.round((customerData.reduce((sum, item) => sum + item.returning, 0) / 
                (customerData.reduce((sum, item) => sum + item.new, 0) + 
                 customerData.reduce((sum, item) => sum + item.returning, 0))) * 100)}%
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderInventoryReport = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Inventory Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    In Stock
                  </Typography>
                  <Typography variant="h4">142</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Items available
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    Low Stock
                  </Typography>
                  <Typography variant="h4">8</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Items below threshold
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    Out of Stock
                  </Typography>
                  <Typography variant="h4">3</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Items unavailable
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    Total Value
                  </Typography>
                  <Typography variant="h4">$12,450</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Inventory worth
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderReport = () => {
    switch (selectedReport) {
      case 'sales':
        return renderSalesReport();
      case 'parts':
        return renderPartsReport();
      case 'customers':
        return renderCustomerReport();
      case 'inventory':
        return renderInventoryReport();
      default:
        return renderSalesReport();
    }
  };

  const handleExport = () => {
    // In a real app, this would generate and download the report
    alert('Report export functionality would be implemented here');
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Reports & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
        >
          Export Report
        </Button>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              label="Report Type"
            >
              <MenuItem value="sales">Sales Report</MenuItem>
              <MenuItem value="parts">Parts Report</MenuItem>
              <MenuItem value="customers">Customer Report</MenuItem>
              <MenuItem value="inventory">Inventory Report</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              label="Date Range"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {renderReport()}
    </Box>
  );
};

export default Reports;
