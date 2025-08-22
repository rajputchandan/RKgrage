const { sendDailyAdminReport } = require('../services/emailService');

// Manual trigger for daily admin report
exports.sendDailyReportManual = async (req, res) => {
  try {
    console.log('📧 Manual daily report requested by admin');
    
    const result = await sendDailyAdminReport();
    
    if (result.success) {
      console.log('✅ Manual daily report sent successfully');
      
      res.status(200).json({
        success: true,
        message: 'Daily report sent successfully to admin email!',
        data: {
          messageId: result.messageId,
          stats: result.stats,
          sentAt: new Date().toLocaleString('en-IN'),
          adminEmail: process.env.AdminEmail
        }
      });
    } else {
      console.error('❌ Manual daily report failed:', result.error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send daily report',
        error: result.error
      });
    }
    
  } catch (error) {
    console.error('❌ Manual daily report error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send daily report',
      error: error.message
    });
  }
};

// Get report statistics without sending email
exports.getReportStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    
    // Ensure database connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGOURL);
    }

    const Customer = require('../model/customer');
    const Part = require('../model/parts');
    const Billing = require('../model/billing');
    const InventoryPurchase = require('../model/inventoryPurchase');

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Get today's data
    const [
      newCustomersToday,
      newPartsToday,
      billsToday,
      allPendingBills,
      lowStockParts,
      inventoryPurchasesToday
    ] = await Promise.all([
      Customer.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Part.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Billing.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } }),
      Billing.find({ payment_status: { $in: ['pending', 'partial'] } }),
      Part.find({ $expr: { $lte: ['$stock_quantity', '$min_stock_level'] } }),
      InventoryPurchase.find({ createdAt: { $gte: startOfDay, $lt: endOfDay } })
    ]);

    // Calculate statistics
    const stats = {
      newCustomers: newCustomersToday.length,
      newParts: newPartsToday.length,
      billsToday: billsToday.length,
      paidBillsToday: billsToday.filter(bill => bill.payment_status === 'paid').length,
      pendingBillsToday: billsToday.filter(bill => bill.payment_status === 'pending').length,
      partialBillsToday: billsToday.filter(bill => bill.payment_status === 'partial').length,
      totalPendingBills: allPendingBills.length,
      todayRevenue: billsToday.filter(bill => bill.payment_status === 'paid').reduce((sum, bill) => sum + bill.total_amount, 0),
      pendingAmount: allPendingBills.reduce((sum, bill) => sum + (bill.total_amount - bill.amount_paid), 0),
      lowStockCount: lowStockParts.length,
      inventoryPurchases: inventoryPurchasesToday.length,
      date: today.toLocaleDateString('en-IN')
    };

    res.status(200).json({
      success: true,
      message: 'Report statistics retrieved successfully',
      data: stats
    });

  } catch (error) {
    console.error('❌ Error getting report stats:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get report statistics',
      error: error.message
    });
  }
};