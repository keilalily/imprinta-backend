const salesService = require('../services/salesService');

// Controller to send the daily sales report and reset data
async function sendDailySalesReport(req, res) {
  try {
    // Fetch the sales data
    const salesData = await salesService.fetchSalesData();

    // Send the sales data via email
    await salesService.sendSalesEmail(salesData);

    // Reset the sales data to zero after sending the email
    await salesService.resetSalesData();

    res.status(200).json({ message: 'Daily Sales Report sent and sales data reset to zero.' });
  } catch (error) {
    console.error('Error sending report or resetting data:', error);
    res.status(500).json({ message: 'Error sending report or resetting data' });
  }
}

module.exports = {
  sendDailySalesReport,
};
