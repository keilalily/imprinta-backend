const adminService = require('../services/adminService');

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required' });
  }

  try {
    const result = await adminService.login(username, password);

    if (result.success) {
      return res.status(200).json({ message: 'Login successful' });
    } else {
      return res.status(401).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

exports.getAdminDetails = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username is required' });
  }
  try {
    const result = await adminService.getAdminDetails(username);

    if (result.success !== false) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json({ message: result.message });
    }
  } catch (error) {
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