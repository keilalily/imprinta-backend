const { sendEmailNotification } = require('../services/emailService');

const notifyBeforeDeletion = async (req, res) => {
    try {
        await sendEmailNotification();
        res.status(200).send('Email notification sent successfully.');
    } catch (error) {
        console.error('Error sending email notification: ', error);
        res.status(500).send('Failed to send email notification.');
    }
};

module.exports = {
    notifyBeforeDeletion,
};
