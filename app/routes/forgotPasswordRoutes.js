const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../controllers/forgotPasswordController');

// Route to send the reset code
router.post('/send-code', forgotPasswordController.sendResetCode);

// Route to verify the reset code
router.post('/verify-code', forgotPasswordController.verifyCode);

// Route to update the password
router.post('/update-password', forgotPasswordController.updatePasswordController);

module.exports = router;
