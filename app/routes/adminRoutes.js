const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
// const forgotPasswordController = require('../controllers/forgotPasswordController');

router.post('/login', adminController.login);
router.get('/getAdminDetails', adminController.getAdminDetails);
router.post('/updateAdminDetails', adminController.updateAdminDetails);

// router.post('/update-password', forgotPasswordController.updatePasswordController);

module.exports = router;
