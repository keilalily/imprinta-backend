const fs = require('fs').promises;
const path = require('path');
const libre = require('libreoffice-convert');
const { PDFDocument } = require('pdf-lib');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ noServer: true });

exports.processUpload = async (originalname, tempFilePath) => {
  let pdfPath = tempFilePath;
  let pdfBuffer;
  let convertedPdfPath;

  try {
    if (originalname.endsWith('.docx') || originalname.endsWith('.pptx')) {
      convertedPdfPath = path.join('uploads', originalname.replace(path.extname(originalname), '.pdf'));
      const fileBuffer = await fs.readFile(tempFilePath);
      pdfBuffer = await new Promise((resolve, reject) => {
        libre.convert(fileBuffer, '.pdf', undefined, (err, done) => {
          if (err) return reject(err);
          resolve(done);
        });
      });
      await fs.writeFile(convertedPdfPath, pdfBuffer);
      pdfPath = convertedPdfPath;
    }

    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    const responseData = { fileName: originalname, pageCount, pdfBytes: pdfBytes.toString('base64') };

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(responseData));
      }
    });

    return responseData;
  } catch (error) {
    console.error('Error processing upload:', error);
    throw error;
  } finally {
    try {
      await fs.unlink(tempFilePath);
      console.log(`Temporary file ${tempFilePath} deleted successfully.`);
    } catch (unlinkError) {
      console.error(`Error deleting temporary file ${tempFilePath}:`, unlinkError);
    }

    if (convertedPdfPath) {
      try {
        await fs.unlink(convertedPdfPath);
        console.log(`Converted file ${convertedPdfPath} deleted successfully.`);
      } catch (unlinkError) {
        console.error(`Error deleting converted file ${convertedPdfPath}:`, unlinkError);
      }
    }
  }
};

// require('dotenv').config();
// const fs = require('fs').promises;
// const path = require('path');
// const WebSocket = require('ws');
// const { PDFDocument } = require('pdf-lib');
// const { exec } = require('child_process'); // Import child_process module

// const wss = new WebSocket.Server({ noServer: true });

// const convertDocxToPdf = (inputPath, outputDir) => {
//   return new Promise((resolve, reject) => {
//     const command = `"${process.env.SOFFICE_PATH}" --headless --invisible --norestore --nolockcheck --convert-to pdf --outdir "${outputDir}" "${inputPath}" --safe-mode`;
    
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(`Error during conversion: ${error.message}`);
//         return;
//       }
//       if (stderr) {
//         reject(`stderr: ${stderr}`);
//         return;
//       }
//       resolve(stdout);
//     });
//   });
// };

// const renameGeneratedPdf = async (uploadDir, originalname) => {
//   const files = await fs.readdir(uploadDir);
//   const pdfFiles = files.filter(file => file.endsWith('.pdf'));

//   if (pdfFiles.length === 0) {
//     throw new Error('No PDF file was generated during conversion.');
//   }

//   const generatedPdfPath = path.join(uploadDir, pdfFiles[0]);
//   const newPdfPath = path.join(uploadDir, originalname.replace(path.extname(originalname), '.pdf'));

//   await fs.rename(generatedPdfPath, newPdfPath);
//   return newPdfPath;
// };

// exports.processUpload = async (originalname, tempFilePath) => {
//   const uploadDir = 'uploads';
//   let pdfPath;

//   try {
//     // Check if the file is a DOCX file before attempting conversion
//     if (originalname.endsWith('.docx')) {
//       console.log('Starting conversion...');
//       await convertDocxToPdf(tempFilePath, uploadDir);
//       console.log('Conversion completed successfully.');

//       // Rename the generated PDF file to match the original name
//       pdfPath = await renameGeneratedPdf(uploadDir, originalname);
//     } else {
//       throw new Error('The provided file is not a DOCX file.');
//     }

//     const pdfBytes = await fs.readFile(pdfPath);
//     const pdfDoc = await PDFDocument.load(pdfBytes);
//     const pageCount = pdfDoc.getPageCount();

//     const responseData = { fileName: originalname, pageCount, pdfBytes: pdfBytes.toString('base64') };

//     wss.clients.forEach(client => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify(responseData));
//       }
//     });

//     return responseData;
//   } catch (error) {
//     console.error('Error processing upload:', error);
//     throw error;
//   } finally {
//     try {
//       await fs.unlink(tempFilePath);
//       console.log(`Temporary file ${tempFilePath} deleted successfully.`);
//     } catch (unlinkError) {
//       console.error(`Error deleting temporary file ${tempFilePath}:`, unlinkError);
//     }

//     if (pdfPath) {
//       try {
//         await fs.unlink(pdfPath);
//         console.log(`Converted file ${pdfPath} deleted successfully.`);
//       } catch (unlinkError) {
//         console.error(`Error deleting converted file ${pdfPath}:`, unlinkError);
//       }
//     }
//   }
// };
