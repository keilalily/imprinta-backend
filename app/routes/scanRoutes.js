const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');

// router.post('/scan', scanController.scan);
router.post('/sendScannedFile', scanController.sendScannedFile);

module.exports = router;
