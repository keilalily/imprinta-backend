const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Route to send the daily sales report
router.get('/send-daily-report', salesController.sendDailySalesReport);

module.exports = router;
