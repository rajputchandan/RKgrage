const express = require('express');
const router = express.Router();
const inventoryPurchaseController = require('../controller/inventoryPurchaseController');
const { verifyToken } = require('../controller/logincontroller');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Inventory Purchase routes
router.post('/add', inventoryPurchaseController.addInventoryPurchase);
router.get('/', inventoryPurchaseController.getAllInventoryPurchases);
router.get('/stats', inventoryPurchaseController.getPurchaseStats);
router.get('/supplier-summary', inventoryPurchaseController.getSupplierPurchaseSummary);
router.get('/:id', inventoryPurchaseController.getInventoryPurchaseById);
router.put('/update/:id', inventoryPurchaseController.updateInventoryPurchase);
router.delete('/delete/:id', inventoryPurchaseController.deleteInventoryPurchase);

// Payment transaction routes
router.get('/:purchaseId/payments', inventoryPurchaseController.getPaymentHistory);
router.post('/:purchaseId/payments', inventoryPurchaseController.addPaymentTransaction);

module.exports = router;