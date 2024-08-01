const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const pdfPrinter = require('pdf-to-printer');

const printerLong = 'Printer_A';
const printerShort = 'Printer_B';

const loadPDF = async (pdfBytes) => {
  return await PDFDocument.load(pdfBytes);
};

const applyPaperSize = (pdfDoc, paperSizeIndex) => {
  if (paperSizeIndex === 1) {
    const pages = pdfDoc.getPages();
    pages.forEach(page => page.setSize(612, 1008)); // Legal size in points (8.5" x 14")
  }
};

const convertToGrayscale = async (pdfDoc) => {
  const pages = pdfDoc.getPages();
  const grayscaleFilter = await pdfDoc.embedPdfFunction(`
    /DeviceGray {
      dup length 1 sub 0 exch get 1 mul
      dup length 1 sub 0 exch get 2 mul
      dup length 1 sub 0 exch get 3 mul
      3 1 roll add add add 4 1 roll 0.2989 mul exch
      1 1 roll 0.5870 mul add exch 0.1140 mul add
    } bind
  `);
  pages.forEach(page => page.setColorSpaces({ '/DeviceGray': grayscaleFilter }));
};

const selectPages = (pdfDoc, selectedPages) => {
  const pagesToRemove = [];
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    if (!selectedPages.includes(i + 1)) {
      pagesToRemove.push(i);
    }
  }
  for (let i = pagesToRemove.length - 1; i >= 0; i--) {
    pdfDoc.removePage(pagesToRemove[i]);
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
  await pdfPrinter.print(pdfBytes, { printer: printerName });
};

const processAndPrint = async (pdfBytes, paperSizeIndex, colorIndex, pagesIndex, selectedPages, copies) => {
  try {
    const pdfDoc = await loadPDF(pdfBytes);
  
    if (paperSizeIndex !== undefined) applyPaperSize(pdfDoc, paperSizeIndex);
    if (colorIndex === 1) await convertToGrayscale(pdfDoc);
    if (pagesIndex === 1 && selectedPages.length > 0) selectPages(pdfDoc, selectedPages);
    if (copies > 1) await duplicatePages(pdfDoc, copies);

    const updatedPdfBytes = await pdfDoc.save();

    const printerName = paperSizeIndex === 1 ? printerLong : printerShort;
    await printPDF(updatedPdfBytes, printerName);

    return { success: true, message: 'Printing successful!' };
  } catch (error) {
    console.error('Error processing and printing PDF:', error);
    return { success: false, message: 'Printing failed!' };
  }
};

module.exports = {
  processAndPrint,
};
