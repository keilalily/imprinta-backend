const express = require('express');
const router = express.Router();
const { getCoinStatus } = require('../controllers/arduinoController');

router.get('/coin-status', getCoinStatus);

module.exports = router;
