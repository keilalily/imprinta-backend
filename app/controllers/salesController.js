const salesService = require('../services/salesService');

// send and delete sales report
async function sendDailySalesReport(req, res) {
  try {
    const salesData = await salesService.fetchSalesData();

    await salesService.sendSalesEmail(salesData);

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
