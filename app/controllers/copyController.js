const copyService = require('../services/copyService');

const handleCopyRequest = async (req, res) => {
  const { pdfBytes, paperSizeIndex, copies } = req.body;

  if (!pdfBytes || !paperSizeIndex || !copies) {
    return res.status(400).json({ error: 'Missing imageData, copies, or paperSize' });
  }

  try {
    await copyService.processAndPrint(pdfBytes, paperSizeIndex, copies);
    res.status(200).json({ message: 'Print request received and processed' });
  } catch (error) {
    console.error('Error printing the document:', error);
    res.status(500).json({ error: 'Error printing the document' });
  }
};

module.exports = {
  handleCopyRequest,
};
