const express = require('express');
const router = express.Router();
const reportsController = require('../controller/reportsController');
const { verifyToken } = require('../controller/logincontroller');

// ✅ Send daily report manually (temporarily without auth for testing)
router.post('/send-daily-report', reportsController.sendDailyReportManual);

// Apply JWT middleware to other routes
router.use(verifyToken);

// ✅ Get report statistics
router.get('/stats', reportsController.getReportStats);

module.exports = router;