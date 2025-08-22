const express = require('express');
const router = express.Router();
const partsController = require('../controller/partsaddcontroller');
const { verifyToken } = require('../controller/logincontroller');

// Apply JWT middleware to all routes
router.use(verifyToken);

// ✅ Add new part
router.post('/add', partsController.addPart);

// ✅ Get all parts
router.get('/', partsController.getAllParts);

// ✅ Get dashboard parts reports
router.get('/dashboard-reports', partsController.getDashboardPartsReports);

// ✅ Get low stock alerts
router.get('/alerts/low-stock', partsController.getLowStockAlerts);

// ✅ Get inventory valuation report
router.get('/reports/valuation', partsController.getInventoryValuation);

// ✅ Migration function to update parts without cost_price
router.post('/migrate/cost-price', partsController.migrateCostPrice);

// ✅ Test endpoints for debugging cost price issue
router.post('/test/cost-price', partsController.testCostPrice);
router.get('/debug/all-parts', partsController.debugAllParts);

// ✅ Get part by ID
router.get('/:id', partsController.getPartById);

// ✅ Update part
router.put('/update/:id', partsController.updatePart);

// ✅ Delete part
router.delete('/delete/:id', partsController.deletePart);

module.exports = router;
