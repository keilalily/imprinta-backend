const scanService = require('../services/scanService');

// exports.scan = async (req, res) => {
//   try {
//     const { paperSizeIndex, colorIndex, resolutionIndex } = req.body;
//     const result = await scanService.scanDocument(paperSizeIndex, colorIndex, resolutionIndex);
//     res.json(result);
//   } catch (error) {
//     console.error('Error scanning document:', error);
//     res.status(500).json({ error: 'Error scanning document' });
//   }
// };

exports.sendScannedFile = async (req, res) => {
  try {
    const { email, imageData, paperSizeIndex } = req.body;
    const result = await scanService.sendScannedFile(email, imageData, paperSizeIndex);
    res.json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Error sending email' });
  }
};
