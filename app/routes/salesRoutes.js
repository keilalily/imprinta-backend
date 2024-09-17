const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/send-daily-report', salesController.sendDailySalesReport);

module.exports = router;
