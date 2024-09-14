const express = require('express'); 
const router = express.Router(); 
const transactionController = require('../controllers/transactionController'); 

// Route to save a transaction 
router.post('/save', transactionController.saveTransaction); 

module.exports = router;