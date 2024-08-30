const scanService = require('../services/scanService');

exports.scan = async (req, res) => {
  try {
    const { paperSizeIndex, colorIndex, resolutionIndex } = req.body;
    const result = await scanService.scanDocument(paperSizeIndex, colorIndex, resolutionIndex);
    if (result.success) {
      // Return the modified pdfBytes along with a success message
      res.json({ pdfBytes: result.pdfBytes });
    } else {
      // Handle the case where modification failed
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error scanning document:', error);
    res.status(500).json({ error: 'Error scanning document' });
  }
};

exports.sendScannedFile = async (req, res) => {
  try {
    const { email, fileData } = req.body;
    const result = await scanService.sendScannedFile(email, fileData);
    res.json(result);
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Error sending email' });
  }
};
