const transactionService = require('../services/transactionService');

exports.saveTransaction = async (req, res) => { 
  const { date, amount, size, totalPages, type } = req.body; 
  const { success, error } = await transactionService.saveTransaction({ date, amount, size, totalPages, type });
  if (success) {
    return res.status(200).json({ message: 'Transaction saved successfully' });
  } else {
    return res.status(500).json({ error: 'Failed to save transaction', details: error });
  }
}; 