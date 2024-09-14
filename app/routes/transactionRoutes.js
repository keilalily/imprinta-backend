const express = require('express'); 
const router = express.Router(); 
const transactionController = require('../controllers/transactionController'); 

// Route to save a transaction 
router.post('/save', transactionController.saveTransaction);
router.get('/fetch', transactionController.fetchTransactions)

// Route to fetch sales
router.get('/sales', transactionController.getSalesData);

module.exports = router;