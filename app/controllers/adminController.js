const adminService = require('../services/adminService');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const result = await adminService.login(username, password);
  if (!result.success) {
    return res.status(result.status).json({ message: result.message });
  }
  res.status(200).json({ auth: true, token: result.token });
};

exports.getAdminDetails = (req, res) => {
  const admin = adminService.getAdminDetails();
  if (admin) {
    res.json({ email: admin.email, username: admin.username });
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
};

exports.updateAdminDetails = async (req, res) => {
  const { email, username, newPassword, currentPassword } = req.body;
  const result = await adminService.updateAdminDetails(email, username, newPassword, currentPassword);
  if (!result.success) {
    return res.status(result.status).json({ message: result.message });
  }
  res.json({ success: true });
};
