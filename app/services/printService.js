require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const pdfPrinter = require('pdf-to-printer');
const sharp = require('sharp');
const { completeTransaction } = require('../utils/transaction');

const printerLong = 'Printer_A';
const printerShort = 'Brother DCP-T420W';

const loadPDF = async (pdfBytes) => {
  // return await PDFDocument.load(pdfBytes);
  try {
    // Ensure pdfBytes is a Uint8Array
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
};

const applyPaperSize = (pdfDoc, paperSizeIndex) => {
  if (paperSizeIndex === 1) {
    const pages = pdfDoc.getPages();
    pages.forEach(page => page.setSize(612, 1008)); // Legal size in points (8.5" x 14")
  }
};

const convertToGrayscale = async (inputPdfPath, outputPdfPath) => {
  try {
    // Step 1: Convert PDF to grayscale PNG
    const tempDir = path.dirname(inputPdfPath);
    const tempFilePrefix = path.basename(inputPdfPath, '.pdf') + '_temp';

    const commandToPng = `"${process.env.PDFTOCAIRO_PATH}" -png -gray "${inputPdfPath}" "${path.join(tempDir, tempFilePrefix)}"`;
    console.log('Executing command:', commandToPng);

    await new Promise((resolve, reject) => {
      exec(commandToPng, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing pdftocairo to PNG: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`pdftocairo stderr: ${stderr}`);
          return reject(new Error(stderr));
        }
        console.log(`PDF converted to grayscale images with prefix: ${tempFilePrefix}`);
        resolve(stdout);
      });
    });

    // Step 2: Find all generated PNG files
    const imagePaths = [];
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.startsWith(tempFilePrefix) && file.endsWith('.png')) {
          imagePaths.push(path.join(tempDir, file));
        }
      }
      if (imagePaths.length === 0) {
        throw new Error(`No image files found with prefix: ${tempFilePrefix}`);
      }
    } catch (err) {
      console.error(`Error finding image files: ${err.message}`);
      throw err;
    }

    // Step 3: Convert each PNG to a page in a new PDF
    const pdfDoc = await PDFDocument.create();
    for (const imagePath of imagePaths) {
      const imageBuffer = await fs.readFile(imagePath);
      const img = await pdfDoc.embedPng(imageBuffer);
      const { width, height } = img.scale(1);
      const page = pdfDoc.addPage([width, height]);
      page.drawImage(img, { x: 0, y: 0, width, height });
    }

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPdfPath, pdfBytes);
    console.log(`Grayscale images converted back to PDF: ${outputPdfPath}`);

    // Step 4: Clean up the temporary image files
    for (const imagePath of imagePaths) {
      await fs.unlink(imagePath);
      console.log(`Temporary image file deleted: ${imagePath}`);
    }

  } catch (error) {
    console.error('Error converting PDF to grayscale:', error);
    throw error;
  }
};

const selectPages = async (pdfDoc, selectedPages) => {
  const pages = pdfDoc.getPages();
  const selectedPageIndices = selectedPages.map(page => page - 1);
  const newPdfDoc = await PDFDocument.create();

  // Copy selected pages to the new PDF
  for (const index of selectedPageIndices) {
    if (index >= 0 && index < pages.length) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [index]);
      newPdfDoc.addPage(copiedPage);
    } else {
      console.warn(`Index ${index} is out of range. Skipping.`);
    }
  }

  // Return the new PDF document containing only selected pages
  return newPdfDoc;
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

const processAndPrint = async (pdfBytes, paperSizeIndex, colorIndex, pagesIndex, selectedPages, copies) => {
  let tempPdfPath;
  let finalPdfPath;
  try {
    console.log('Received PDF bytes length:', pdfBytes.length);
    let pdfDoc = await loadPDF(pdfBytes);
    console.log('PDF loaded successfully');

    console.log('pagesIndex:', pagesIndex);
    console.log('selectedPages:', selectedPages);
    console.log('paperSizeIndex:', paperSizeIndex);
    console.log('colorIndex:', colorIndex);
    console.log('copies:', copies);
  
    if (pagesIndex === 1 && selectedPages.length > 0) {
      console.log('Number of pages before selection:', pdfDoc.getPages().length);
      pdfDoc = await selectPages(pdfDoc, selectedPages);
      console.log('Selected pages processed');
      console.log('Number of pages after selection:', pdfDoc.getPages().length);
    }
    if (!pdfDoc) {
      throw new Error('pdfDoc is undefined after selecting pages');
    }
    if (paperSizeIndex !== undefined) {
      applyPaperSize(pdfDoc, paperSizeIndex);
      console.log('Paper size applied');
    }
    if (copies > 1) {
      await duplicatePages(pdfDoc, copies);
      console.log('Pages duplicated');
    }

    // Save the modified PDF to a temporary file
    tempPdfPath = path.join(__dirname, 'temp', `temp_${Date.now()}.pdf`);
    finalPdfPath = path.join(__dirname, 'temp', `final_${Date.now()}.pdf`);

    const updatedPdfBytes = await pdfDoc.save();
    await fs.writeFile(tempPdfPath, updatedPdfBytes);
    console.log('Temporary PDF file saved:', tempPdfPath); 

    if (colorIndex === 1) {
      await convertToGrayscale(tempPdfPath, finalPdfPath);
      console.log('Converted to grayscale:', finalPdfPath);
    } else {
      await fs.copyFile(tempPdfPath, finalPdfPath);
      console.log('File copied to final path');
    }
    console.log('Final PDF file prepared:', finalPdfPath);

    const printerName = paperSizeIndex === 1 ? printerLong : printerShort;
    console.log('Number of pages before printing:', pdfDoc.getPages().length);

    await printPDF(await fs.readFile(finalPdfPath), printerName);
    console.log('Printing started');

    completeTransaction();
    console.log('Transaction completed');

    return { success: true, message: 'Printing successful!' };
  } catch (error) {
      console.error('Error processing and printing PDF:', error);
      return { success: false, message: 'Printing failed!' };
  } finally {
      // Clean up temporary files
      if (tempPdfPath) {
        try {
          await fs.unlink(tempPdfPath);
          console.log('Temporary file deleted:', tempPdfPath);
        } catch (err) {
          console.error('Error deleting temporary file:', tempPdfPath, err);
        }
      }
      if (finalPdfPath) {
        try {
          await fs.unlink(finalPdfPath);
          console.log('Final file deleted:', finalPdfPath);
        } catch (err) {
          console.error('Error deleting final file:', finalPdfPath, err);
        }
      }
  }
};

module.exports = {
  processAndPrint,
};
