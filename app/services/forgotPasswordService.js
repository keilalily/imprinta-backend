const { db } = require('../config/firebaseConfig');
const { sendEmail } = require('../services/emailCodeService');
const bcrypt = require('bcryptjs');
const adminRef = db.ref("/login");
const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000);
}

exports.sendResetCode = async () => {
  const snapshot = await adminRef.once('value');
  const adminData = snapshot.val();
  console.log("Fetched admin data:", adminData);
  const email = adminData.email;

  const verifyResetCode = generateResetCode();
  const timestamp = Date.now();
  // await resetCodeRef.child(encodedEmail).set({ verifyResetCode, timestamp });

  const updates = {};
  updates.resetCode = verifyResetCode;
  updates.timeStamp = timestamp;

  await adminRef.update(updates);

  try {
    await sendEmail(email, verifyResetCode);
    return { success: true };
  } catch (error) {
    throw new Error("Failed to send email: " + error.message);
  }
  // return verifyResetCode;

  
};


exports.verifyResetCode = async (enteredCode) => {
    try {
      const snapshot = await adminRef.once('value');
      const adminData = snapshot.val();
      console.log("Fetched admin data:", adminData);
      // const snapshot = await resetCodeRef.child(encodedEmail).once('value');

      const currentTime = Date.now();
      if (currentTime - adminData.timestamp > EXPIRATION_TIME) {
        console.log(`Reset code has expired.`);
        return false; // Code has expired
      }

      return adminData.resetCode.toString() === enteredCode;
    } catch (error) {
        console.error("Error verifying reset code:", error);
        throw new Error("Could not verify reset code");
    }
};

exports.updatePassword = async (newPassword) => {
  try {
    const updates = {};
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.password = hashedPassword;
    }

    await adminRef.update(updates);
    return { 
      success: true, 
      message: 'Password updated successfully',
    };

  } catch (error) {
    console.error('Error updating admin password:', error);
    return { success: false, message: 'Internal server error' };
  }
};
