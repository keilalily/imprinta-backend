const bcrypt = require('bcryptjs');
const { db } = require('../config/firebaseConfig');
const ref = db.ref("/login");
const LOCK_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

function formatDate(timestamp) {
  const date = new Date(timestamp);
  
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true
  };

  return date.toLocaleString('en-US', options).replace(',', ' at');
}

const verifyPassword = async (inputPassword, storedPassword) => {
  return bcrypt.compare(inputPassword, storedPassword);
};

// exports.login = async (username, password) => {
//   try {
//     const snapshot = await ref.once('value');
//     const loginData = snapshot.val();

//     if (String(loginData.username) !== String(username)) {
//       return { success: false, status: 400, message: 'User not found' };
//     } else {
//       const passwordIsValid = await verifyPassword(String(password), String(loginData.password));
//       if (!passwordIsValid) {
//         return { success: false, status: 401, message: 'Invalid password' };
//       } else {
//         return { success: true, message: 'Login successful'};
//       }
//     }
//   } catch (error) {
//     throw new Error('Internal server error: ' + error.message);
//   }
// };

exports.login = async (username, password) => {
  try {
    const snapshot = await ref.once('value');
    const loginData = snapshot.val();

    // Log the fetched login data for debugging
    console.log('Fetched login data:', loginData);

    const now = Date.now();

    // Check if account is locked
    console.log(`Current lockUntil: ${loginData.lockUntil}, Current time: ${now}`);
    if (loginData.lockUntil > now) {
      const lockUntilFormatted = formatDate(loginData.lockUntil); // Call formatDate here
      console.log(`Account locked until: ${lockUntilFormatted}`);
      return { success: false, status: 403, message: `Locking account due to 3 failed attempts. 
Account is locked until: ${lockUntilFormatted}. Try again later.` };
    }

    // Initialize the failedAttempts variable
    let failedAttempts = loginData.failedAttempts || 0;

    // Check if username exists
    if (String(loginData.username) !== String(username)) {
      // Increment failed attempts if username is not found
      failedAttempts += 1;

      // Attempt to update failed attempts in the database
      try {
        // Lock account if failed attempts reach 3
        let lockUntil = 0;
        if (failedAttempts >= 3) {
          lockUntil = now + LOCK_DURATION; // Lock the account for 1 hour
        }

        await ref.update({
          failedAttempts: failedAttempts,
          lockUntil: lockUntil // Update lockUntil if it needs to be locked
        });
        
        console.log('Failed attempts and lockUntil updated in database.');
      } catch (error) {
        console.error('Failed to update failedAttempts:', error);
      }

      let remainingAttempts = 3 - failedAttempts;

      return { 
        success: false, 
        status: 400, 
        message: `User not found. You have ${remainingAttempts} remaining attempts left.`,
      };
    } 

    // Validate the password
    const passwordIsValid = await verifyPassword(String(password), String(loginData.password));
    if (!passwordIsValid) {
      // Increment failed attempts
      failedAttempts += 1;
      let lockUntil = 0;

      // Lock account if failed attempts reach 3
      if (failedAttempts >= 3) {
        lockUntil = now + LOCK_DURATION; // Lock the account for 1 hour
        console.log(`Locking account due to ${failedAttempts} failed attempts. Lock until: ${lockUntil}`);
      }

      // Log current and new failed attempts for debugging
      console.log(`Current failedAttempts: ${loginData.failedAttempts || 0}, New failedAttempts: ${failedAttempts}`);

      // Attempt to update failed attempts and lock time
      try {
        await ref.update({
          failedAttempts: failedAttempts,
          lockUntil: lockUntil // Update lockUntil if it needs to be locked
        });
        console.log('Failed attempts and lockUntil updated in database.');
      } catch (error) {
        console.error('Failed to update failedAttempts and lockUntil:', error);
      }

      let remainingAttempts = 3 - failedAttempts;

      return { 
        success: false, 
        status: 401, 
        message: `Invalid password. You have ${remainingAttempts} remaining attempts left.`,
      };
    } 

    // Reset failed attempts and lock until on successful login
    await ref.update({
      failedAttempts: 0,
      lockUntil: 0
    });
    console.log('Login successful. Resetting failed attempts and lockUntil.');

    return { success: true, message: 'Login successful' };
  } catch (error) {
    console.error('Error in login function:', error);
    throw new Error('Internal server error: ' + error.message);
  }
};


// - - - - -- - - -- 
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
