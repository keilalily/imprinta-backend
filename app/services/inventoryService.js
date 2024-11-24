const { db } = require('../config/firebaseConfig');
const nodemailer = require('nodemailer');
const ref = db.ref("/Inventory");
const emailRef = db.ref("/login");

const lowInventoryThreshold = {
  longPaper: 50, 
  shortPaper: 50,
};

const sendLowInventoryEmail = (paperType, remaining, email) => {
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
    subject: 'Low Paper Inventory Alert',
    text: `The remaining ${paperType} is low. Only ${remaining} papers left. Please restock soon.`,
  };

  console.log(`Sending email for ${paperType} with remaining count ${remaining}`);
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error.message);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

const updateInventory = async (data) => {
  console.log('Updating inventory with data:', data); 
  await ref.set(data);
};

const getInventory = async () => {
  const snapshot = await ref.once('value');
  let data = snapshot.val();
  console.log(data);
  const emailSnapshot = await emailRef.once('value');
  let userData = emailSnapshot.val();
  const email = userData ? userData.email : null;
  console.log('Fetched inventory data:', snapshot.val()); 
  
  const remainingPapersLong = Number(data.remainingPapersLong);
  const remainingPapersShort = Number(data.remainingPapersShort);

  if (remainingPapersLong <= lowInventoryThreshold.longPaper) {
    console.log('Long Paper count is below the threshold.');
    if (!data.emailSentForLongPaper) {
      console.log('Sending email for Long Paper.');
      sendLowInventoryEmail('Long Papers', remainingPapersLong, email);
      data.emailSentForLongPaper = true; 
    } else {
      console.log('Email for Long Paper has already been sent.');
    }
  } else {
    console.log('Long Paper count is above the threshold.');
    data.emailSentForLongPaper = false; 
  }

  console.log(`Checking Short Paper - Count: ${remainingPapersShort}, Threshold: ${lowInventoryThreshold.shortPaper}`);
  if (remainingPapersShort <= lowInventoryThreshold.shortPaper) {
    console.log('Short Paper count is below the threshold.');
    if (!data.emailSentForShortPaper) {
      console.log('Sending email for Short Paper.');
      sendLowInventoryEmail('Short Papers', remainingPapersShort, email);
      data.emailSentForShortPaper = true; 
    } else {
      console.log('Email for Short Paper has already been sent.');
    }
  } else {
    console.log('Short Paper count is above the threshold.');
    data.emailSentForShortPaper = false; 
  }

  return snapshot.val();
};

module.exports = {
  updateInventory,
  getInventory,
};