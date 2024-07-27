const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');

router.get('/prices', pricingController.getPricing);
router.post('/prices', pricingController.updatePricing);

module.exports = router;
