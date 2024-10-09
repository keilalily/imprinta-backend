const { db } = require('../config/firebaseConfig'); // Firebase config
const { sendEmail } = require('../services/emailCodeService'); // Email service
const bcrypt = require('bcrypt');
const adminService = require('../services/adminService'); // Admin service

const adminRef = db.ref("/login"); // Reference to admin data
const resetCodeRef = db.ref("/passwordResets"); // Reference to store reset codes
const EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
}

// Function to encode email for Firebase compatibility
function encodeEmail(email) {
  return email.replace(/\./g, '_'); // Replace '.' with '_' or another character
}
// Send the reset code and store it in Firebase
exports.sendResetCode = async (email) => {
const snapshot = await adminRef.once('value');
const adminData = snapshot.val(); // Store fetched admin data in a variable
console.log("Fetched admin data:", adminData); // Log fetched admin data
const encodedEmail = encodeEmail(email); // Encode the email
// Check if the email exists
if (!adminData || adminData.email !== email) {
    throw new Error("Email not found"); // Throw an error if email does not exist
}
const verifyResetCode = generateResetCode();
const timestamp = Date.now(); // Get the current timestamp
// Store the reset code with the timestamp against the encoded email
await resetCodeRef.child(encodedEmail).set({ verifyResetCode, timestamp });
// Send email with the reset code
try {
    await sendEmail(email, `Your password reset code is: ${verifyResetCode}`);
} catch (error) {
    throw new Error("Failed to send email: " + error.message);
}
return verifyResetCode;
};


exports.verifyResetCode = async (email, enteredCode) => {
    try {
        const encodedEmail = encodeEmail(email); // Encode the email

        // Fetch the data associated with the encoded email
        const snapshot = await resetCodeRef.child(encodedEmail).once('value');
        
        // Check if data exists for the email
        if (!snapshot.exists()) {
            console.log(`No reset code found for email: ${encodedEmail}`);
            return false; // No reset code found for the email
        }

        const resetData = snapshot.val();
        console.log("Reset data from database:", resetData); // Log fetched data

        // Check if the code has expired
        const currentTime = Date.now();
        if (currentTime - resetData.timestamp > EXPIRATION_TIME) {
            console.log(`Reset code for email ${encodedEmail} has expired.`);
            return false; // Code has expired
        }

        // Ensure resetCode is in string format for comparison
        return resetData.verifyResetCode.toString() === enteredCode;
    } catch (error) {
        console.error("Error verifying reset code:", error);
        throw new Error("Could not verify reset code");
    }
};




exports.updatePassword = async (username, newPassword) => {
  console.log("Attempting to update password for username:", username);

  try {
    // Fetch admin details by username
    const adminDetails = await adminService.getAdminDetails(username);

    if (!adminDetails || !adminDetails.email) {
      throw new Error("Admin not found");
    }

    // Proceed to update the password
    const result = await adminService.updateAdminDetails(adminDetails.email, newPassword);

    if (result.success) {
      console.log(`Password updated successfully for username: ${username}`);
      return { success: true, message: 'Password updated successfully' };
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
};
