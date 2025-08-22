const express = require('express');
const router = express.Router();
const jobCardController = require('../controller/jobcardcontroller');
const { verifyToken } = require('../controller/logincontroller');

// Apply JWT middleware to all routes
router.use(verifyToken);

// ✅ Create new job card
router.post('/create', jobCardController.createJobCard);

// ✅ Get all job cards (with optional filters)
router.get('/', jobCardController.getAllJobCards);

// ✅ Get job card statistics
router.get('/stats', jobCardController.getJobCardStats);

// ✅ Get job card by ID
router.get('/:id', jobCardController.getJobCardById);

// ✅ Update job card (general updates, excludes parts)
router.put('/update/:id', jobCardController.updateJobCard);

// ✅ Update job card parts (replaces entire parts list with inventory management)
router.put('/update-parts/:id', jobCardController.updateJobCardParts);

// ✅ Add parts to existing job card
router.put('/add-parts/:id', jobCardController.addPartsToJobCard);

// ✅ Update payment status
router.put('/payment/:id', jobCardController.updatePaymentStatus);

// ✅ Delete job card
router.delete('/delete/:id', jobCardController.deleteJobCard);

// ✅ Utility route to fix calculation issues
router.post('/recalculate-totals', jobCardController.recalculateJobCardTotals);

module.exports = router;