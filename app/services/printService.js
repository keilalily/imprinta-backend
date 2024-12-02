require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const tempDir = os.tmpdir();
const { exec } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const pdfPrinter = require('pdf-to-printer');
const { completeTransaction } = require('../utils/transaction');
// const { ActiveXObject } = require('winax');
const winax = require('winax');

const bPac = new winax.Object('bPac3.BrotherBpac');

const printerLong = 'Brother DCP-T720DW Printer'; // change this to name ng printer na long
const printerShort = 'Brother DCP-T420W';

// const checkPrinterStatus = (printerName) => {
//   return new Promise((resolve, reject) => {
//     // Use PowerShell to execute the command
//     exec(`powershell -Command "Get-Printer -Name '${printerName}' | Select-Object -ExpandProperty PrinterStatus"`, (error, stdout, stderr) => {
//       if (error || stderr) {
//         return reject(`Error fetching printer status: ${stderr || error.message}`);
//       }
      
//       const status = stdout.trim();

//       if (!status) {
//         // If no status is returned, the printer is unavailable or not connected
//         resolve(false);
//       } else if (status === 'Offline' || status === 'NotAvailable') {
//         // Printer is offline or not available
//         resolve(false);
//       } else if (status === 'Normal') {
//         // Printer is online and ready for printing
//         resolve(true);
//       } else {
//         // Handle other statuses (like error, busy, etc.)
//         resolve(false);
//       }
//     });
//   });
// };
const checkPrinterStatus = (printerName) => {
  return new Promise((resolve, reject) => {
    try {
      // Create the b-PAC COM object
      const bPac = new winax.Object('bPac3.BrotherBpac'); // This might be the correct object for your installed version

      // Initialize b-PAC (optional based on version)
      const initResult = bPac.Initialize();
      if (!initResult) {
        return reject('Failed to initialize b-PAC SDK');
      }

      // Check printer status using b-PAC
      const status = bPac.GetPrinterStatus(printerName);

      switch (status) {
        case 0:
          resolve(true); // Printer is ready
          break;
        case 1:
        case 2:
          resolve(false); // Printer is offline or has an error (e.g., paper jam)
          break;
        case 3:
          resolve(false); // Printer has low ink
          break;
        default:
          resolve(false);
      }
    } catch (error) {
      console.error('Error checking printer status:', error);
      reject('Error checking printer status');
    }
  });
};

const loadPDF = async (pdfBytes) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc;
  } catch (error) {
    console.error('Error loading PDF:', error);
    throw error;
  }
};

const convertToGrayscale = async (inputPdfPath, outputPdfPath) => {
  try {
    const commandToGrayscale = `"${process.env.GHOSTSCRIPT_PATH}" -sDEVICE=pdfwrite -sColorConversionStrategy=Gray -dNOPAUSE -dBATCH -sOutputFile="${outputPdfPath}" "${inputPdfPath}"`;
    console.log('Executing command:', commandToGrayscale);

    await new Promise((resolve, reject) => {
      exec(commandToGrayscale, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing Ghostscript: ${error.message}`);
          return reject(error);
        }
        if (stderr) {
          console.error(`Ghostscript stderr: ${stderr}`);
          return reject(new Error(stderr));
        }
        console.log(`PDF converted to grayscale: ${outputPdfPath}`);
        resolve(stdout);
      });
    });

  } catch (error) {
    console.error('Error converting PDF to grayscale:', error);
    throw error;
  }
};

const selectPages = async (pdfDoc, selectedPages) => {
  const pages = pdfDoc.getPages();
  const selectedPageIndices = selectedPages.map(page => page - 1);
  const newPdfDoc = await PDFDocument.create();

  for (const index of selectedPageIndices) {
    if (index >= 0 && index < pages.length) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [index]);
      newPdfDoc.addPage(copiedPage);
    } else {
      console.warn(`Index ${index} is out of range. Skipping.`);
    }
  }

  return newPdfDoc;
};

const duplicatePages = async (pdfDoc, copies) => {
  const originalPages = pdfDoc.getPages();
  for (let copy = 1; copy < copies; copy++) {
    for (let i = 0; i < originalPages.length; i++) {
      const [copiedPage] = await pdfDoc.copyPages(pdfDoc, [i]);
      pdfDoc.addPage(copiedPage);
    }
  }
};

const PAPER_SIZES = {
  shortBond: { width: 612, height: 792 }, // Short bond (Letter size)
  longBond: { width: 612, height: 1008 }, // Long bond  (Legal size)
};

const resizePages = async (pdfDoc, targetSize) => {
  const pages = pdfDoc.getPages();

  for (let page of pages) {
    const { width, height } = page.getSize();

    const isLandscape = width > height;
    console.log(`Page is in ${isLandscape ? 'landscape' : 'portrait'} mode.`);

    const adjustedTargetSize = isLandscape
      ? { width: targetSize.height, height: targetSize.width }
      : targetSize;

    const scaleX = adjustedTargetSize.width / width;
    const scaleY = adjustedTargetSize.height / height;
    const scale = Math.min(scaleX, scaleY); 

    page.scale(scale, scale);

    page.setSize(adjustedTargetSize.width, adjustedTargetSize.height);
    const translateX = (adjustedTargetSize.width - width * scale) / 2;
    const translateY = (adjustedTargetSize.height - height * scale) / 2; 

    page.translateContent(translateX, translateY);
  }
};

const modifyPdfPreview = async (pdfBytes, paperSizeIndex, colorIndex, pagesIndex, selectedPages) => {
  let tempPdfPath;
  let finalPdfPath;
  let finalPdfBytes;
  try {
    console.log('Received PDF bytes length:', pdfBytes.length);
    let pdfDoc = await loadPDF(pdfBytes);
    console.log('PDF loaded successfully');
  
    console.log('pagesIndex:', pagesIndex);
    console.log('selectedPages:', selectedPages);
    console.log('paperSizeIndex:', paperSizeIndex);
    console.log('colorIndex:', colorIndex);
    
      if (pagesIndex === 1 && selectedPages.length > 0) {
        console.log('Number of pages before selection:', pdfDoc.getPages().length);
        pdfDoc = await selectPages(pdfDoc, selectedPages);
        console.log('Selected pages processed');
        console.log('Number of pages after selection:', pdfDoc.getPages().length);
      }
      if (!pdfDoc) {
        throw new Error('pdfDoc is undefined after selecting pages');
      }

      let targetSize;
      if (paperSizeIndex === 0) {
        targetSize = PAPER_SIZES.shortBond;
      } else {
        targetSize = PAPER_SIZES.longBond;
      }

      await resizePages(pdfDoc, targetSize);
      console.log('PDF pages resized to fit the paper size:', targetSize);
  
      // tempPdfPath = path.join(__dirname, 'temp', `temp_${Date.now()}.pdf`);
      // finalPdfPath = path.join(__dirname, 'temp', `final_${Date.now()}.pdf`);
      tempPdfPath = path.join(tempDir, `temp_${Date.now()}.pdf`);
      finalPdfPath = path.join(tempDir, `final_${Date.now()}.pdf`);
  
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

      finalPdfBytes = await fs.readFile(finalPdfPath);
  
      return { success: true, pdfBytes: finalPdfBytes.toString('base64') };
    } catch (error) {
        console.error('Error processing PDF:', error);
        return { success: false, message: 'Processing failed!' };
    } finally {
        if (tempPdfPath) {
          try {
            await fs.writeFile(tempPdfPath, '');
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
}

// const printPDF = async (pdfBytes, printerName) => {
//   const tempFilePath = path.join(__dirname, 'temp', `print_${Date.now()}.pdf`);
//   try {
//     await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
//     await fs.writeFile(tempFilePath, pdfBytes);
//     const isOnline = await checkPrinterStatus(printerName);
//     if (isOnline) {
//       await pdfPrinter.print(tempFilePath, { printer: printerName });
//       console.log('Printing initiated successfully.');
//       return true;
//     } else {
//       console.log('Printer is not connected or not functioning properly.');
//       return false;
//     }
//   } catch (error) {
//     console.error('Error printing PDF:', error);
//     await fs.unlink(tempFilePath);
//     throw error;
//   } finally {
//     try {
//       await fs.access(tempFilePath);
//       await fs.unlink(tempFilePath);
//     } catch (err) {
//       if (err.code === 'ENOENT') {
//         console.warn('Temp file already deleted or does not exist.');
//       } else {
//         console.error('Error deleting temp file:', err);
//       }
//     }
//   }
// };

const printPDF = async (pdfBytes, printerName) => {
  const tempFilePath = path.join(tempDir, `print_${Date.now()}.pdf`);
  try {
    // Write the PDF file to disk (temp file)
    await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
    await fs.writeFile(tempFilePath, pdfBytes);

    // Check printer status using b-PAC
    const isOnline = await checkPrinterStatus(printerName);
    if (isOnline) {
      // Create the b-PAC COM object
      const bPac = new winax.Object('bPac3.BrotherBpac');
      const printResult = bPac.Print(printerName, tempFilePath);

      if (printResult) {
        console.log('Printing initiated successfully.');
        return true;
      } else {
        console.log('Failed to print using b-PAC.');
        return false;
      }
    } else {
      console.log('Printer is not connected or not functioning properly.');
      return false;
    }
  } catch (error) {
    console.error('Error printing PDF:', error);
    await fs.unlink(tempFilePath); // Clean up temp file
    throw error;
  } finally {
    // Delete the temp file after printing
    try {
      await fs.unlink(tempFilePath);
    } catch (err) {
      console.error('Error deleting temp file:', err);
    }
  }
};

const processAndPrint = async (pdfBytes, paperSizeIndex, copies) => {
  try {
    console.log('Received PDF bytes length:', pdfBytes.length);
    let pdfDoc = await loadPDF(pdfBytes);
    console.log('copies:', copies);
  
    if (copies > 1) {
      console.log(pdfDoc, 'prev doc');
      const updateFile = await duplicatePages(pdfDoc, copies);
      console.log(updateFile, 'updated');
      console.log('Pages duplicated');
    }

    const updatedPdfBytes = await pdfDoc.save(); 

    const printerName = paperSizeIndex === 1 ? printerLong : printerShort;
    console.log('Number of pages before printing:', pdfDoc.getPages().length);

    const printSuccess = await printPDF(updatedPdfBytes, printerName);
    if (printSuccess) {
      completeTransaction();
      return { success: true, message: 'Printing successful!' };
    } else {
      throw new Error('Printing failed.');
    }

    
  } catch (error) {
      console.error('Error processing and printing PDF:', error);
      return { success: false, message: 'Printing failed!' };
  }
}

module.exports = {
  modifyPdfPreview,
  processAndPrint
};
