require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const pdfPrinter = require('pdf-to-printer');
const { completeTransaction } = require('../utils/transaction');

const printerLong = 'EPSON L3250 Series';
const printerShort = 'EPSON L3250 Series';

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

const applyPaperSize = (pdfDoc, paperSizeIndex) => {
  if (paperSizeIndex === 1) {
    const newWidth = 612; // Width for Legal size in points
    const newHeight = 1008; // Height for Legal size in points

    pdfDoc.getPages().forEach(page => {
      const { width, height } = page.getSize();

      // Set the new page size
      page.setSize(newWidth, newHeight);

      // Calculate the vertical offset to reposition the content to start at the top
      const offsetY = newHeight - height; // Moves content up to start at the top

      // Reposition the content
      page.translateContent(0, offsetY);
    });
  }
};

const convertToGrayscale = async (inputPdfPath, outputPdfPath) => {
  try {
    // Step 1: Use Ghostscript to convert PDF to grayscale
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
      const [copiedPage] = await pdfDoc.copyPages(pdfDoc, [i]);
      pdfDoc.addPage(copiedPage);
    }
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
      if (paperSizeIndex !== undefined) {
        applyPaperSize(pdfDoc, paperSizeIndex);
        console.log('Paper size applied');
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

      finalPdfBytes = await fs.readFile(finalPdfPath);
  
      return { success: true, pdfBytes: finalPdfBytes.toString('base64') };
    } catch (error) {
        console.error('Error processing PDF:', error);
        return { success: false, message: 'Processing failed!' };
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
}

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
    console.log('Received PDF bytes length:', pdfBytes.length);
    let pdfDoc = await loadPDF(pdfBytes);
    console.log('PDF loaded successfully');
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

    await printPDF(updatedPdfBytes, printerName);
    console.log('Printing started');

    completeTransaction();
    console.log('Transaction completed');
    console.log('Coin Count: ')

    return { success: true, message: 'Printing successful!' };
  } catch (error) {
      console.error('Error processing and printing PDF:', error);
      completeTransaction();
      return { success: false, message: 'Printing failed!' };
  }
}

// const processAndPrint = async (pdfBytes, paperSizeIndex, colorIndex, pagesIndex, selectedPages, copies) => {
//   let tempPdfPath;
//   let finalPdfPath;
//   try {
//     console.log('Received PDF bytes length:', pdfBytes.length);
//     let pdfDoc = await loadPDF(pdfBytes);
//     console.log('PDF loaded successfully');

//     console.log('pagesIndex:', pagesIndex);
//     console.log('selectedPages:', selectedPages);
//     console.log('paperSizeIndex:', paperSizeIndex);
//     console.log('colorIndex:', colorIndex);
//     console.log('copies:', copies);
  
//     if (pagesIndex === 1 && selectedPages.length > 0) {
//       console.log('Number of pages before selection:', pdfDoc.getPages().length);
//       pdfDoc = await selectPages(pdfDoc, selectedPages);
//       console.log('Selected pages processed');
//       console.log('Number of pages after selection:', pdfDoc.getPages().length);
//     }
//     if (!pdfDoc) {
//       throw new Error('pdfDoc is undefined after selecting pages');
//     }
//     if (paperSizeIndex !== undefined) {
//       applyPaperSize(pdfDoc, paperSizeIndex);
//       console.log('Paper size applied');
//     }
//     if (copies > 1) {
//       await duplicatePages(pdfDoc, copies);
//       console.log('Pages duplicated');
//     }

//     // Save the modified PDF to a temporary file
//     tempPdfPath = path.join(__dirname, 'temp', `temp_${Date.now()}.pdf`);
//     finalPdfPath = path.join(__dirname, 'temp', `final_${Date.now()}.pdf`);

//     const updatedPdfBytes = await pdfDoc.save();
//     await fs.writeFile(tempPdfPath, updatedPdfBytes);
//     console.log('Temporary PDF file saved:', tempPdfPath); 

//     if (colorIndex === 1) {
//       await convertToGrayscale(tempPdfPath, finalPdfPath);
//       console.log('Converted to grayscale:', finalPdfPath);
//     } else {
//       await fs.copyFile(tempPdfPath, finalPdfPath);
//       console.log('File copied to final path');
//     }
//     console.log('Final PDF file prepared:', finalPdfPath);

//     const printerName = paperSizeIndex === 1 ? printerLong : printerShort;
//     console.log('Number of pages before printing:', pdfDoc.getPages().length);

//     // await printPDF(await fs.readFile(finalPdfPath), printerName);
//     // console.log('Printing started');

//     completeTransaction();
//     console.log('Transaction completed');
//     console.log('Coin Count: ')

//     return { success: true, message: 'Printing successful!' };
//   } catch (error) {
//       console.error('Error processing and printing PDF:', error);
//       return { success: false, message: 'Printing failed!' };
//   } finally {
//       // Clean up temporary files
//       if (tempPdfPath) {
//         try {
//           await fs.unlink(tempPdfPath);
//           console.log('Temporary file deleted:', tempPdfPath);
//         } catch (err) {
//           console.error('Error deleting temporary file:', tempPdfPath, err);
//         }
//       }
//       if (finalPdfPath) {
//         try {
//           await fs.unlink(finalPdfPath);
//           console.log('Final file deleted:', finalPdfPath);
//         } catch (err) {
//           console.error('Error deleting final file:', finalPdfPath, err);
//         }
//       }
//   }
// };

module.exports = {
  modifyPdfPreview,
  processAndPrint
};