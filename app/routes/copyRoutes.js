const express = require('express');
const router = express.Router();
const copyController = require('../controllers/copyController');

router.post('/copy', copyController.handleCopyRequest);

module.exports = router;
