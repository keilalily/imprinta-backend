const forgotPasswordService = require('../services/forgotPasswordService');
const { db } = require('../config/firebaseConfig');
const adminRef = db.ref("/login");
const adminService = require('../services/adminService');

exports.sendResetCode = async (req, res) => {

  try {
    const result = await forgotPasswordService.sendResetCode();

    if (result.success) {
      return res.status(200).json({ message: 'Reset code sent to your email' });
    } else {
      return res.status(500).json({ error: error.message });
    }
    
  } catch (error) {
    console.error("Error sending reset code:", error);
    res.status(500).json({ error: error.message });
  }
};

// Controller to verify the reset code
exports.verifyCode = async (req, res) => {
  const { enteredCode } = req.body;

  try {
    const isValid = await forgotPasswordService.verifyResetCode(enteredCode);
    
    if (isValid) {
      return res.status(200).json({ message: 'Code is valid. You can proceed to reset your password.' });
    } else {
      return res.status(400).json({ error: 'Incorrect code. Try again.' });
    }
  } catch (error) {
    console.error("Error verifying reset code:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.updatePasswordController = async (req, res) => {
  const { newPassword } = req.body;

  console.log("Received request to update password");

  // Check if email and newPassword are provided
  if (!newPassword) {
    return res.status(400).json({ success: false, message: 'New password are required' });
  }

  try {
    // Call the service to update the password
    const result = await forgotPasswordService.updatePassword(newPassword);
    if (result.success) {
      return res.status(200).json({ message: result.message });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};



exports.getAdminEmailController = async (req, res) => {
  try {
    const adminEmail = await adminService.getAdminEmail(); // Ensure this function exists in adminService
    if (adminEmail) {
      res.status(200).json({ email: adminEmail });
    } else {
      res.status(404).json({ message: 'Admin email not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

