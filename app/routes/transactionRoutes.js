const express = require('express'); 
const router = express.Router(); 
const transactionController = require('../controllers/transactionController'); 

router.post('/save', transactionController.saveTransaction);
router.get('/fetch', transactionController.fetchTransactions)

router.get('/sales', transactionController.getSalesData);

module.exports = router;