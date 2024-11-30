const adminService = require('../services/adminService');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: 'Username and password are required',
    });
  }

  try {
    const result = await adminService.login(username, password);

    if (result.success) {
      // Login successful
      return res.status(200).json({ 
        success: true, 
        status: 200, 
        message: result.message 
      });
    } else {
      // Login failed (specific reason provided by the service)
      return res.status(result.status || 400).json({
        success: false,
        status: result.status,
        message: result.message,
      });
    }
  } catch (error) {
    // Internal server error
    console.error('Error in adminController login:', error.message);
    return res.status(500).json({
      success: false,
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
};


exports.getAdminDetails = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }
  try {
    const result = await adminService.getAdminDetails(username);
    console.log("Admin fetch result:", result); // Debug log

    if (result.success !== false) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error fetching admin details:", error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.updateAdminDetails = async (req, res) => {
  const { email, username, newPassword, currentPassword } = req.body;

  console.log('Received request to update admin details');
  console.log('Request body:', req.body);

  if (!currentPassword) {
    return res.status(400).json({ success: false, message: 'Current password is required' });
  }

  try {
    const result = await adminService.updateAdminDetails(email, username, newPassword, currentPassword);

    if (result.success) {
      res.status(200).json({ message: result.message, email: result.email, username: result.username });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

