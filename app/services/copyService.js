const fs = require('fs').promises;
const path = require('path');
const pdfPrinter = require('pdf-to-printer');
const { PDFDocument } = require('pdf-lib');
const { completeTransaction } = require('../utils/transaction');

const printerLong = 'Printer_A';
const printerShort = 'Brother DCP-T420W';

const loadPDF = async (pdfBytes) => {
  try {
    // Ensure pdfBytes is a Uint8Array
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
};

const duplicatePages = async (pdfDoc, copies) => {
  const originalPages = pdfDoc.getPages();
  for (let copy = 1; copy < copies; copy++) {
    for (let i = 0; i < originalPages.length; i++) {
      const copiedPage = await pdfDoc.copyPage(originalPages[i]);
      pdfDoc.addPage(copiedPage);
    }
  }
};

const printPDF = async (pdfBytes, printerName) => {
  const tempFilePath = path.join(__dirname, 'temp', `print_${Date.now()}.pdf`);
  try {
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, pdfBytes);
    await pdfPrinter.print(tempFilePath, { printer: printerName });
    await fs.unlink(tempFilePath);
  } catch (error) {
    console.error('Error printing PDF:', error);
    throw error;
  }
};

const processAndPrint = async (pdfBytes, paperSizeIndex, copies) => {
  try {
    let pdfDoc = await loadPDF(pdfBytes);

    if (copies > 1) {
      await duplicatePages(pdfDoc, copies);
      console.log('Pages duplicated');
    }
    const updatedPdfBytes = await pdfDoc.save();

    const printerName = paperSizeIndex === 1 ? printerLong : printerShort;
    await printPDF(updatedPdfBytes, printerName);
    console.log('Printing started');

    completeTransaction();
    return { success: true, message: 'Printing successful!' };
  } catch (error) {
    console.error('Error in printing:', error);
    return { success: false, message: `Printing failed: ${error.message}` };
  }
  
};

module.exports = {
  processAndPrint,
};
