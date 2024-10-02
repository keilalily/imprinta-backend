
const express = require('express');
const router = express.Router();
const { deleteSales } = require('../controllers/salesController');

router.delete('/dailyReportSales', deleteSales);

module.exports = router;
