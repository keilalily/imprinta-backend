const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const users = [
  { id: 1, username: 'Admin', email: '', password: bcrypt.hashSync('88888888', 8) }
];

exports.login = async (username, password) => {
  const user = users.find(u => u.username === username);
  if (!user) {
    return { success: false, status: 400, message: 'User not found' };
  }
  const passwordIsValid = bcrypt.compareSync(password, user.password);
  if (!passwordIsValid) {
    return { success: false, status: 401, message: 'Invalid password' };
  }
  const token = jwt.sign({ id: user.id }, 'secret-key', { expiresIn: 86400 });
  return { success: true, token };
};

exports.getAdminDetails = () => {
  return users.find(user => user.username === 'Admin');
};

exports.updateAdminDetails = async (email, username, newPassword, currentPassword) => {
  const admin = users.find(user => user.username === 'Admin');
  if (admin && bcrypt.compareSync(currentPassword, admin.password)) {
    if (email) admin.email = email;
    if (username) admin.username = username;
    if (newPassword) admin.password = bcrypt.hashSync(newPassword, 8);
    return { success: true };
  }
  return { success: false, status: 400, message: 'Incorrect current password' };
};
