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
      // Return the modified pdfBytes along with a success message
      res.json({ pdfBytes: result.pdfBytes });
    } else {
      // Handle the case where modification failed
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

    res.json({ message: 'Printing successful' });

    // if (result.success) {
    //   res.json({ message: 'Printing successful' });
    // } else {
    //   res.status(500).json({ error: result.message });
    // }

  } catch (error) {
    console.error('Error printing file:', error);
    res.status(500).json({ error: 'Error printing file' });
  }
}

// const printDocument = async (req, res) => {
//   try {
//     const { printSettings, pdfBytes } = req.body;
//     const { paperSizeIndex, colorIndex, pagesIndex, selectedPages, copies } = printSettings;
//     await printService.processAndPrint(
//       pdfBytes, 
//       paperSizeIndex, 
//       colorIndex, 
//       pagesIndex, 
//       selectedPages, 
//       copies
//     );
//     res.json({ message: 'Printing successful' });
//   } catch (error) {
//     console.error('Error printing file:', error);
//     res.status(500).json({ error: 'Error printing file' });
//   }
// };

module.exports = {
  modifyPdfPreview,
  printDocument
};
