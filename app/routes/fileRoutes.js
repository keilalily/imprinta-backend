const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fileController = require('../controllers/fileController');

router.post('/upload', upload.single('file'), fileController.upload);
router.post('/exportdata', fileController.exportData);

module.exports = router;
