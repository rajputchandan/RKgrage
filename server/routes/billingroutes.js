const express = require('express');
const router = express.Router();
const billingController = require('../controller/billingcontroller');
const { verifyToken } = require('../controller/logincontroller');

// Apply JWT middleware to all routes
router.use(verifyToken);

// ✅ Create new bill
router.post('/', billingController.createBill);

// ✅ Create bill from jobcard
router.post('/from-jobcard/:jobcard_id', billingController.createBillFromJobCard);

// ✅ Get all bills (with optional filters)
router.get('/', billingController.getAllBills);

// ✅ Get billing statistics
router.get('/stats', billingController.getBillingStats);

// ✅ Get dashboard billing reports
router.get('/dashboard-reports', billingController.getDashboardBillingReports);

// ✅ Get bill by ID
router.get('/:id', billingController.getBillById);

// ✅ Update bill
router.put('/:id', billingController.updateBill);

// ✅ Generate receipt with GST option
router.get('/:id/receipt-gst', billingController.generateReceiptWithGST);

// ✅ Generate receipt/invoice
router.get('/:id/receipt', billingController.generateReceipt);

// ✅ Update payment status
router.put('/payment/:id', billingController.updatePaymentStatus);

// ✅ Send email notification manually
router.post('/:id/send-email', billingController.sendEmailNotification);

// ✅ Delete bill
router.delete('/:id', billingController.deleteBill);

module.exports = router;