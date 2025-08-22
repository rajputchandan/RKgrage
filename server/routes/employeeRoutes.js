const express = require('express');
const router = express.Router();
const employeeController = require('../controller/employeeController');
const { verifyToken } = require('../controller/logincontroller');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Employee CRUD routes
router.post('/add', employeeController.addEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/stats', employeeController.getEmployeeStats);
router.get('/upcoming-payments', employeeController.getUpcomingPayments);
router.get('/:id', employeeController.getEmployeeById);
router.put('/update/:id', employeeController.updateEmployee);
router.delete('/delete/:id', employeeController.deleteEmployee);
router.delete('/permanent-delete/:id', employeeController.permanentDeleteEmployee);

// Advance payment routes
router.post('/:id/advance-payment', employeeController.addAdvancePayment);

// Salary management routes
router.post('/:id/process-salary', employeeController.processMonthlySalary);
router.put('/:id/salary-payment/:paymentId', employeeController.updateSalaryPaymentStatus);

module.exports = router;