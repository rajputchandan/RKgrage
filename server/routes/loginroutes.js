const express = require('express');
const router = express.Router();
const authController = require('./../controller/logincontroller');

router.post('/admin/login', authController.adminLogin);
router.get('/profile', authController.verifyToken, authController.getProfile);

module.exports = router;
