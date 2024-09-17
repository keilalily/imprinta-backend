const { db } = require('../config/firebaseConfig');
const nodemailer = require('nodemailer');
const emailRef = db.ref("/login");

// Fetch sales data from Firebase
const fetchSalesData = async () => {
  const ref = db.ref("TotalSales");
  const snapshot = await ref.once("value");
  return snapshot.val();
}

// Generate HTML table from data
const generateTable = (data) => {
  return `
    <table border="1" cellpadding="5" cellspacing="0">
      <tr>
        <th>Total Amount</th>
        <th>Total Copy</th>
        <th>Total Print</th>
        <th>Total Scan</th>
      </tr>
      <tr>
        <td>${data.totalAmount}</td>
        <td>${data.totalCopy}</td>
        <td>${data.totalPrint}</td>
        <td>${data.totalScan}</td>
      </tr>
    </table>
  `;
}

// Send email with sales data
const sendSalesEmail = async (salesData) => {
  const htmlTable = generateTable(salesData);
  const emailSnapshot = await emailRef.once('value');
  let userData = emailSnapshot.val();
  const email = userData ? userData.email : null;

  let transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let mailOptions = {
    from: `"Vendo Printing Machine" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Daily Sales Report',
    html: `<h3>Sales Data</h3>${htmlTable}`,
  };

  await transporter.sendMail(mailOptions);
}

// Reset the sales data to zero in Firebase
const resetSalesData = async () => {
  const ref = db.ref("TotalSales");

  // Set all values to zero
  await ref.set({
    totalAmount: 0,
    totalCopy: 0,
    totalPrint: 0,
    totalScan: 0,
  });

  console.log('Sales data reset to zero.');
}

module.exports = {
  fetchSalesData,
  sendSalesEmail,
  resetSalesData,
};
