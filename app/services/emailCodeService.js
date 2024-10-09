require('dotenv').config();
const nodemailer = require('nodemailer');

// Setup the transporter with environment variables for better security
const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Function to send email with the reset code
exports.sendEmail = async (email, resetCode) => {
    const mailOptions = {
        from: `"Vendo Printing Machine" <${process.env.SMTP_USER}>`, // Sender's email
        to: email, // Recipient's email
        subject: 'Password Reset Code',
        text: `Enter this code to reset your password: ${resetCode}`, // Include the reset code in the email body
    };

    try {
        await transporter.sendMail(mailOptions); // Send the email
        console.log(`Password reset code sent to ${email}`);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw new Error('Failed to send reset code. Please try again.');
    }
};
