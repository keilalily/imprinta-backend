const printService = require('../services/printService');

const printDocument = async (req, res) => {
  try {
    const { pdfPath, paperSizeIndex, colorIndex, pagesIndex, selectedPages, copies } = req.body;
    await printService.processAndPrint(pdfPath, paperSizeIndex, colorIndex, pagesIndex, selectedPages, copies);
    res.json({ message: 'Printing successful' });
  } catch (error) {
    console.error('Error printing file:', error);
    res.status(500).json({ error: 'Error printing file' });
  }
};

module.exports = {
  printDocument,
};
