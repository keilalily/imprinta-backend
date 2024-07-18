const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.post('/login', adminController.login);
router.get('/getAdminDetails', adminController.getAdminDetails);
router.post('/updateAdminDetails', adminController.updateAdminDetails);

module.exports = router;
