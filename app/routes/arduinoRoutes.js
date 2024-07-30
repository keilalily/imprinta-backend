// const express = require('express');
// const router = express.Router();
// const { getCoinStatus } = require('../controllers/arduinoController');

// router.get('/coin-status', getCoinStatus);

// module.exports = router;

// arduinoRoutes.js

const express = require('express');
const router = express.Router();
const arduinoController = require('../controllers/arduinoController');

router.get('/status', arduinoController.getStatus);
router.post('/reset', arduinoController.resetCounts);

module.exports = router;
