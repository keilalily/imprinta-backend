const copyService = require('../services/copyService');

const handleCopyRequest = async (req, res) => {
  try {
    const { pdfBytes, paperSizeIndex, copies } = req.body;

    // if (!pdfBytes || !paperSizeIndex || !copies) {
    //   return res.status(400).json({ error: 'Missing imageData, copies, or paperSize' });
    // }
    
    const result = await copyService.processAndPrint(pdfBytes, paperSizeIndex, copies);
    if (result.success) {
      res.status(200).json({ message: 'Copy successful' });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error printing the document:', error);
    res.status(500).json({ error: 'Error printing the document' });
  }
};

module.exports = {
  handleCopyRequest,
};
