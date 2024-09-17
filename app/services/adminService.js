const bcrypt = require('bcryptjs');
const { db } = require('../config/firebaseConfig');
const ref = db.ref("/login");

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

exports.updateAdminDetails = async (email, username, newPassword, currentPassword) => {
  try {
    const snapshot = await ref.once('value');
    const userData = snapshot.val();

    console.log('Fetched user data:', userData); 
    console.log('Entered current password:', currentPassword); 
    console.log('Stored hashed password:', userData.password); 

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

