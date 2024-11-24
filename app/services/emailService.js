require('dotenv').config();
const nodemailer = require('nodemailer');
const { db } = require('../config/firebaseConfig');

const emailRef = db.ref("/login");

const sendEmailNotification = async () => {
    try {
        const emailSnapshot = await emailRef.once('value');
        const userData = emailSnapshot.val();
        const email = userData ? userData.email : null;

        if (!email) {
            console.error('No email found in database.');
            return;
        }

        const transporter = nodemailer.createTransport({
            service: process.env.SMTP_SERVICE,
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: `"IMPRINTA" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reminder: Sales Documents Deletion',
            text: `All sales records will be deleted in one hour. Please make sure to save any necessary information before then.`,
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    sendEmailNotification,
};