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

// const fs = require('fs').promises;
// const path = require('path');
// const { execFile } = require('child_process');
// const { PDFDocument } = require('pdf-lib');
// const WebSocket = require('ws');

// const wss = new WebSocket.Server({ noServer: true });

// exports.processUpload = async (originalname, tempFilePath) => {
//   let pdfPath = tempFilePath;
//   let convertedPdfPath;

//   try {
//     if (originalname.endsWith('.docx') || originalname.endsWith('.pptx')) {
//       convertedPdfPath = path.join('uploads', originalname.replace(path.extname(originalname), '.pdf'));

//       await new Promise((resolve, reject) => {
//         const command = 'soffice';
//         const args = ['--headless', '--convert-to', 'pdf', '--outdir', path.dirname(convertedPdfPath), tempFilePath, { shell: true }];

//         execFile(command, args, (error, stdout, stderr) => {
//           if (error) {
//             console.error(`Error: ${stderr}`);
//             return reject(error);
//           }
//           console.log(`Converted: ${stdout}`);
//           resolve();
//         });
//       });

//       pdfPath = convertedPdfPath;
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

//     if (convertedPdfPath) {
//       try {
//         await fs.unlink(convertedPdfPath);
//         console.log(`Converted file ${convertedPdfPath} deleted successfully.`);
//       } catch (unlinkError) {
//         console.error(`Error deleting converted file ${convertedPdfPath}:`, unlinkError);
//       }
//     }
//   }
// };
