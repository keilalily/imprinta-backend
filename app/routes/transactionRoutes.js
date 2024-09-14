const express = require('express'); 
const router = express.Router(); 
const transactionController = require('../controllers/transactionController'); 

// Route to save print transaction 
router.post('/save', transactionController.saveTransaction); 

module.exports = router;


// // Route to save scan transaction 

// router.post('/scan', transactionController.saveScanTransaction); 

// // Route to save copy transaction 

// router.post('/copy', transactionController.saveCopyTransaction); 
