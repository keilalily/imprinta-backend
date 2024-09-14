require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const { PDFDocument, rgb } = require('pdf-lib');
const { exec } = require('child_process'); 
const nodemailer = require('nodemailer');

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

exports.generatePDF = async (data, filePath) => {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const { width, height } = page.getSize();

  // Define table column widths
  const columnWidths = [100, 100, 150, 100, 100];
  const tableTop = height - 50;
  let yPosition = tableTop;

  // Draw headers
  const headers = ['Transaction ID', 'Date', 'Service', 'Total Pages', 'Payment'];
  let xPosition = 50;
  headers.forEach((header, index) => {
    page.drawText(header, { x: xPosition, y: yPosition, size: 12, color: rgb(0, 0, 0) });
    xPosition += columnWidths[index];
  });
  yPosition -= 20; // Move down for data rows

  // Draw data rows
  data.forEach(item => {
    xPosition = 50;
    const row = [
      item.transactionId,
      item.date,
      item.service,
      item.totalPages.toString(),
      item.payment
    ];
    row.forEach((text, index) => {
      page.drawText(text, { x: xPosition, y: yPosition, size: 12, color: rgb(0, 0, 0) });
      xPosition += columnWidths[index];
    });
    yPosition -= 20; // Move down for next row
  });

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, pdfBytes);
};

exports.sendEmail = (filePath, callback) => {

  let transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  let mailOptions = {
    from: `"Vendo Printing Machine" <${process.env.SMTP_USER}>`,
    to: 'recipient-email@gmail.com',
    subject: 'Exported Data PDF',
    text: 'Please find the attached PDF.',
    attachments: [{
      filename: 'exported_data.pdf',
      path: filePath
    }]
  };

  let info = transporter.sendMail(mailOptions, callback);

  return { success: true, messageId: info.messageId };
};
