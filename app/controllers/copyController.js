const copyService = require('../services/copyService');

const handleCopyRequest = async (req, res) => {
  const { imageData, copies, paperSize } = req.body;

  if (!imageData || !copies || !paperSize) {
    return res.status(400).json({ error: 'Missing imageData, copies, or paperSize' });
  }

  try {
    await copyService.processAndPrint(imageData, copies, paperSize);
    res.status(200).json({ message: 'Print request received and processed' });
  } catch (error) {
    console.error('Error printing the document:', error);
    res.status(500).json({ error: 'Error printing the document' });
  }
};

module.exports = {
  handleCopyRequest,
};
