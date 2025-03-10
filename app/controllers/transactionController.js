const transactionService = require('../services/transactionService');

exports.fetchTransactions = async (req, res) => {
  try {
    const transactions = await transactionService.fetchTransactions();
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
}

exports.saveTransaction = async (req, res) => { 
  const { date, amount, size, totalPages, type } = req.body; 

  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric', 
    hour12: true, 
    // timeZoneName: 'short' // pag gusto may gmt
  };

  const formattedDate = new Date(date).toLocaleString('en-US', options);

  const { success, error } = await transactionService.saveTransaction({ date: formattedDate, amount, size, totalPages, type });
  if (success) {
    return res.status(200).json({ message: 'Transaction saved successfully' });
  } else {
    return res.status(500).json({ error: 'Failed to save transaction', details: error });
  }
}; 

// to get total sales data (print, scan, copy, total)
exports.getSalesData = async (req, res) => {
  try {
    const totalSales = await transactionService.getTotalSalesByType('totalAmount');
    const printSales = await transactionService.getTotalSalesByType('totalPrint');
    const scanSales = await transactionService.getTotalSalesByType('totalScan');
    const copySales = await transactionService.getTotalSalesByType('totalCopy');

    const responseData = {
      printSales: printSales.toString(),
      scanSales: scanSales.toString(),
      copySales: copySales.toString(),
      totalSales: totalSales.toString(),
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ error: 'Failed to fetch sales data', details: error.message });
  }
};
