const { pulseCount, amountInserted } = require('../services/arduinoService');

const getCoinStatus = (req, res) => {
  res.json({ pulseCount, amountInserted });
};

module.exports = { getCoinStatus };
