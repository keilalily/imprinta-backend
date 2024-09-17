const pricingService = require('../services/pricingService');

exports.getPricing = async (req, res) => {
    try {
        const pricing = await pricingService.getPricing();
        res.status(200).json(pricing);
    } catch (error) {
        console.error('Error fetching pricing:', error);
        res.status(500).json({ message: error.message });
    }
};


exports.updatePricing = async (req, res) => {
  try {
      const pricing = req.body; // Assuming the whole object is sent
      console.log('Received POST request to update pricing with prices:', pricing);

      const updatedPricing = await pricingService.updatePricing(pricing);

      console.log('Updated pricing:', updatedPricing);
      res.status(200).json(updatedPricing);
  } catch (error) {
      console.error('Error updating pricing:', error);
      res.status(500).json({ message: error.message });
  }
};