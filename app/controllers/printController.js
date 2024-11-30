const printService = require('../services/printService');

const modifyPdfPreview = async (req, res) => {
  try {
    const { printSettings, pdfBytes } = req.body;
    const { paperSizeIndex, colorIndex, pagesIndex, selectedPages } = printSettings;
    const result = await printService.modifyPdfPreview(
      pdfBytes, 
      paperSizeIndex, 
      colorIndex, 
      pagesIndex, 
      selectedPages
    );
    if (result.success) {
      res.json({ pdfBytes: result.pdfBytes });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error modifying file:', error);
    res.status(500).json({ error: 'Error modifying file' });
  }
}

const printDocument = async (req, res) => {
  try {
    const { pdfBytes, paperSizeIndex, copies } = req.body;
    const result = await printService.processAndPrint(
      pdfBytes, 
      paperSizeIndex,
      copies
    );

    if (result.success) {
      res.json({ message: 'Printing successful' });
    } else {
      res.json({ message: 'Printer is not connected or is offline.' });
    }

  } catch (error) {
    console.error('Error printing file:', error);
    res.status(500).json({ error: 'Error printing file' });
  }
}

module.exports = {
  modifyPdfPreview,
  printDocument
};