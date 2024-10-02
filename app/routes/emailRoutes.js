const express = require('express');
const router = express.Router();
const { notifyBeforeDeletion } = require('../controllers/emailController');

router.post('/notify', notifyBeforeDeletion);

module.exports = router;
