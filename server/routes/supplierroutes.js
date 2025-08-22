const express = require('express');
const router = express.Router();
const supplierController = require('../controller/suppliercontroller');
const { verifyToken } = require('../controller/logincontroller');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Supplier routes
router.post('/add', supplierController.addSupplier);
router.get('/', supplierController.getAllSuppliers);
router.get('/stats', supplierController.getSupplierStats);
router.get('/:id', supplierController.getSupplierById);
router.put('/update/:id', supplierController.updateSupplier);
router.delete('/delete/:id', supplierController.deleteSupplier);

module.exports = router;