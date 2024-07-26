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


// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const admin = require('firebase-admin');

// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   databaseURL: 'https://vpmm-9d033-default-rtdb.firebaseio.com/'
// });

// const db = admin.database();
// const ref = db.ref('/data/login');

// const generateToken = (id) => {
//   return jwt.sign({ id }, 'secret-key', { expiresIn: 86400 });
// };

// const verifyPassword = async (inputPassword, storedPassword) => {
//   return bcrypt.compare(inputPassword, storedPassword);
// };

// exports.login = async (username, password) => {
//   try {
//     const snapshot = await ref.once('value');
//     const user = snapshot.val();

//     if (!user || user.username !== username) {
//       return { success: false, status: 400, message: 'User not found' };
//     }

//     const passwordIsValid = await verifyPassword(password, user.password);
//     if (!passwordIsValid) {
//       return { success: false, status: 401, message: 'Invalid password' };
//     }

//     const token = generateToken(user.id);
//     return { success: true, token };
//   } catch (error) {
//     return { success: false, status: 500, message: 'Internal server error' };
//   }
// };

// exports.getAdminDetails = async () => {
//   try {
//     const snapshot = await ref.once('value');
//     const user = snapshot.val();

//     if (user) {
//       return { username: user.username, email: user.email };
//     }
//     return null;
//   } catch (error) {
//     return { success: false, status: 500, message: 'Internal server error' };
//   }
// };

// exports.updateAdminDetails = async (email, username, newPassword, currentPassword) => {
//   try {
//     const snapshot = await ref.once('value');
//     const user = snapshot.val();

//     if (user && await verifyPassword(currentPassword, user.password)) {
//       const updates = {};
//       if (email) updates.email = email;
//       if (username) updates.username = username;
//       if (newPassword) updates.password = await bcrypt.hash(newPassword, 8);

//       await ref.update(updates);
//       return { success: true };
//     }

//     return { success: false, status: 400, message: 'Incorrect current password' };
//   } catch (error) {
//     return { success: false, status: 500, message: 'Internal server error' };
//   }
// };

const bcrypt = require('bcryptjs');
const db = require('../../config'); // Import the initialized Firebase Admin instance
const ref = db.ref("/login");


// Helper function to verify password
const verifyPassword = async (inputPassword, storedPassword) => {
  return bcrypt.compare(inputPassword, storedPassword);
};

exports.login = async (username, password) => {
  try {
    const snapshot = await ref.once('value');
    const loginData = snapshot.val();

    if (String(loginData.username) !== String(username)) {
      return { success: false, status: 400, message: 'User not found' };
    } else {
      const passwordIsValid = await verifyPassword(String(password), String(loginData.password));
      if (!passwordIsValid) {
        return { success: false, status: 401, message: 'Invalid password' };
      } else {
        return { success: true, message: 'Login successful'};
      }
    }
  } catch (error) {
    throw new Error('Internal server error: ' + error.message);
  }
};

// Get admin details function
exports.getAdminDetails = async (username) => {
  try {
    const snapshot = await ref.once('value');
    const userData = snapshot.val();

    console.log(`DB Username: ${userData.username}, DB Password: ${userData.email}, DB Password: ${userData.password}`);

    if (userData.username === username) {
      return { username: userData.username, email: userData.email, password: userData.password };
    } else {
      return { success: false, message: 'User not found' };
    }
  } catch (error) {
    console.error('Error getting admin details:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Update admin details function
exports.updateAdminDetails = async (email, username, newPassword, currentPassword) => {
  try {
    const snapshot = await ref.once('value');
    const userData = snapshot.val();

    console.log('Fetched user data:', userData); // Logging fetched user data
    console.log('Entered current password:', currentPassword); // Logging entered current password (plain text)
    console.log('Stored hashed password:', userData.password); // Logging stored hashed password  

    const passwordIsValid = await verifyPassword(currentPassword, userData.password);
    if (!passwordIsValid) {
      console.log('Password comparison failed');
      return { success: false, message: 'Incorrect current password' };
    }

    const updates = {};
    if (email) updates.email = email;
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.password = hashedPassword;
    }
    if (username) updates.username = username;

    await ref.update(updates);
    return { 
      success: true, 
      message: 'Details updated successfully', 
      email: updates.email || userData.email, 
      username: updates.username || userData.username 
    };

  } catch (error) {
    console.error('Error updating admin details:', error);
    return { success: false, message: 'Internal server error' };
  }
};

