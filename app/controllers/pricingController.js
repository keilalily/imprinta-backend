const pricingService = require('../services/pricingService');

const getPricing = (req, res) => {
  const pricingData = pricingService.getPricingData();
  res.json(pricingData);
};

const setPricing = (req, res) => {
  const newPricingData = req.body;
  pricingService.setPricingData(newPricingData);
  res.status(200).json({ message: 'Pricing data saved successfully' });
};

module.exports = {
  getPricing,
  setPricing,
};
