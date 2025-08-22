const express = require('express');
const router = express.Router();
const customerController = require('../controller/customercontroller');
const { verifyToken } = require('../controller/logincontroller');

// Apply JWT middleware to all routes
router.use(verifyToken);

// ✅ Add new customer
router.post('/add', customerController.addCustomer);

// ✅ Get all customers
router.get('/', customerController.getAllCustomers);

// ✅ Search customers
router.get('/search', customerController.searchCustomers);

// ✅ Get customer by ID
router.get('/:id', customerController.getCustomerById);

// ✅ Update customer
router.put('/update/:id', customerController.updateCustomer);

// ✅ Update service count
router.put('/service/:id', customerController.updateServiceCount);

// ✅ Delete customer
router.delete('/delete/:id', customerController.deleteCustomer);

module.exports = router;