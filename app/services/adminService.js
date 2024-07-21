// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const users = [
//   { id: 1, username: 'Admin', email: '', password: bcrypt.hashSync('88888888', 8) }
// ];

// exports.login = async (username, password) => {
//   const user = users.find(u => u.username === username);
//   if (!user) {
//     return { success: false, status: 400, message: 'User not found' };
//   }
//   const passwordIsValid = bcrypt.compareSync(password, user.password);
//   if (!passwordIsValid) {
//     return { success: false, status: 401, message: 'Invalid password' };
//   }
//   const token = jwt.sign({ id: user.id }, 'secret-key', { expiresIn: 86400 });
//   return { success: true, token };
// };

// exports.getAdminDetails = () => {
//   return users.find(user => user.username === 'Admin');
// };

// exports.updateAdminDetails = async (email, username, newPassword, currentPassword) => {
//   const admin = users.find(user => user.username === 'Admin');
//   if (admin && bcrypt.compareSync(currentPassword, admin.password)) {
//     if (email) admin.email = email;
//     if (username) admin.username = username;
//     if (newPassword) admin.password = bcrypt.hashSync(newPassword, 8);
//     return { success: true };
//   }
//   return { success: false, status: 400, message: 'Incorrect current password' };
// };


const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://vpmm-9d033-default-rtdb.firebaseio.com/'
});

const db = admin.database();
const ref = db.ref('/data/login');

const generateToken = (id) => {
  return jwt.sign({ id }, 'secret-key', { expiresIn: 86400 });
};

const verifyPassword = async (inputPassword, storedPassword) => {
  return bcrypt.compare(inputPassword, storedPassword);
};

exports.login = async (username, password) => {
  try {
    const snapshot = await ref.once('value');
    const user = snapshot.val();

    if (!user || user.username !== username) {
      return { success: false, status: 400, message: 'User not found' };
    }

    const passwordIsValid = await verifyPassword(password, user.password);
    if (!passwordIsValid) {
      return { success: false, status: 401, message: 'Invalid password' };
    }

    const token = generateToken(user.id);
    return { success: true, token };
  } catch (error) {
    return { success: false, status: 500, message: 'Internal server error' };
  }
};

exports.getAdminDetails = async () => {
  try {
    const snapshot = await ref.once('value');
    const user = snapshot.val();

    if (user) {
      return { username: user.username, email: user.email };
    }
    return null;
  } catch (error) {
    return { success: false, status: 500, message: 'Internal server error' };
  }
};

exports.updateAdminDetails = async (email, username, newPassword, currentPassword) => {
  try {
    const snapshot = await ref.once('value');
    const user = snapshot.val();

    if (user && await verifyPassword(currentPassword, user.password)) {
      const updates = {};
      if (email) updates.email = email;
      if (username) updates.username = username;
      if (newPassword) updates.password = await bcrypt.hash(newPassword, 8);

      await ref.update(updates);
      return { success: true };
    }

    return { success: false, status: 400, message: 'Incorrect current password' };
  } catch (error) {
    return { success: false, status: 500, message: 'Internal server error' };
  }
};