const fs = require('fs').promises;
const path = require('path');
const print = require('pdf-to-printer');
const { completeTransaction } = require('../utils/transaction');

const PRINTER_LONG = 'Printer_A_Name'; // Replace with your long paper printer name
const PRINTER_SHORT = 'Printer_B_Name'; // Replace with your short paper printer name

const saveImageAsPDF = async (imageData, filePath) => {
  const pdfBuffer = Buffer.from(imageData, 'base64');
  await fs.writeFile(filePath, pdfBuffer);
};

const determinePrinter = (paperSize) => {
  switch (paperSize) {
    case 'Legal':
      return PRINTER_LONG;
    case 'Letter':
      return PRINTER_SHORT;
    default:
      throw new Error('Invalid paper size');
  }
};

const printPDF = async (pdfPath, printer, copies) => {
  await print(pdfPath, {
    printer,
    copies,
  });
};

const processAndPrint = async (imageData, copies, paperSize) => {
  const pdfPath = path.join(__dirname, 'scannedDocument.pdf');

  await saveImageAsPDF(imageData, pdfPath);
  const printer = determinePrinter(paperSize);
  await printPDF(pdfPath, printer, copies);
  completeTransaction();
  await fs.unlink(pdfPath); // Clean up the PDF file after printing
};

module.exports = {
  processAndPrint,
};
