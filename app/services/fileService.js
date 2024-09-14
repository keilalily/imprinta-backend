require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process'); // Import child_process module

// const wss = new WebSocket.Server({ noServer: true });
let wss;

exports.setWebSocketServer = (webSocketServer) => {
  wss = webSocketServer;
};

const convertDocxToPdf = (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    const command = `"${process.env.SOFFICE_PATH}" --headless --invisible --norestore --nolockcheck --convert-to pdf --outdir "${outputDir}" "${inputPath}" --safe-mode`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error during conversion: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
};

const renameGeneratedPdf = async (uploadDir, originalname) => {
  const files = await fs.readdir(uploadDir);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));

  if (pdfFiles.length === 0) {
    throw new Error('No PDF file was generated during conversion.');
  }

  const generatedPdfPath = path.join(uploadDir, pdfFiles[0]);
  const newPdfPath = path.join(uploadDir, originalname.replace(path.extname(originalname), '.pdf'));

  await fs.rename(generatedPdfPath, newPdfPath);
  return newPdfPath;
};

exports.processUpload = async (originalname, tempFilePath) => {
  const uploadDir = 'uploads';
  let pdfPath;
  let shouldDeleteTempFile = false;

  try {
    // Check if the file is a DOCX file before attempting conversion
    if (originalname.endsWith('.docx')) {
      console.log('Starting conversion...');
      await convertDocxToPdf(tempFilePath, uploadDir);
      console.log('Conversion completed successfully.');

      // Rename the generated PDF file to match the original name
      pdfPath = await renameGeneratedPdf(uploadDir, originalname);
      shouldDeleteTempFile = true;
    } else if (originalname.endsWith('.pdf')) {
      // If the file is already a PDF, just move it to the upload directory
      pdfPath = path.join(uploadDir, originalname);
      await fs.rename(tempFilePath, pdfPath);
    } else {
      throw new Error('The provided file is not a PDF or DOCX file.');
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
    if (shouldDeleteTempFile && tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
        console.log(`Temporary file ${tempFilePath} deleted successfully.`);
      } catch (unlinkError) {
        console.error(`Error deleting temporary file ${tempFilePath}:`, unlinkError);
      }
    } else {
      console.log('No tempFilePath provided, skipping deletion.');
    }
    if (pdfPath) {
      try {
        await fs.unlink(pdfPath);
        console.log(`Converted file ${pdfPath} deleted successfully.`);
      } catch (unlinkError) {
        console.error(`Error deleting converted file ${pdfPath}:`, unlinkError);
      }
    }
  }
};
