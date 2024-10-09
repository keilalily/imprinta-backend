require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');
const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process');
const ExcelJS = require('exceljs');
const { db } = require('../config/firebaseConfig');
const emailRef = db.ref("/login");

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
    if (originalname.endsWith('.docx')) {
      console.log('Starting conversion...');
      await convertDocxToPdf(tempFilePath, uploadDir);
      console.log('Conversion completed successfully.');

      pdfPath = await renameGeneratedPdf(uploadDir, originalname);
      shouldDeleteTempFile = true;
    } else if (originalname.endsWith('.pdf')) {
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

exports.generateExcel = async (data, filePath) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sales Report');

  // Add title row (Merged across columns A1 to E1)
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'IMPRINTA';
  worksheet.getCell('A1').font = { size: 20, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Add subtitle row (Merged across columns A2 to E2)
  worksheet.mergeCells('A2:E2');
  worksheet.getCell('A2').value = 'Sales Report';
  worksheet.getCell('A2').font = { size: 14, bold: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 25;

  // Add date row (Merged across columns A3 to E3)
  worksheet.mergeCells('A3:E3');
  worksheet.getCell('A3').value = `Date: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A3').font = { size: 12, italic: true };
  worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(3).height = 20;

  // Add an empty row for spacing (row 4)
  worksheet.addRow([]);

  // Add column headers (row 5)
  worksheet.columns = [
    { key: 'transactionId', width: 40 },
    { key: 'date', width: 40 },
    { key: 'type', width: 20 },
    { key: 'totalPages', width: 15 },
    { key: 'amount', width: 15 },
  ];

  // Add header row explicitly
  const headerRow = worksheet.addRow(['Transaction ID', 'Date/Time', 'Service', 'Total Pages', 'Total Amount']);

  // Apply styling to the header row
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '16A085' },  // Green background for header
      bgColor: { argb: 'FFFFFF' }   // White text color
    };
    cell.font = { color: { argb: 'FFFFFF' }, bold: true };
    cell.alignment = { horizontal: 'center' };
  });

  // Add data rows (starting from row 6)
  data.forEach(item => {
    worksheet.addRow({
      transactionId: item.transactionId || 'N/A',
      date: item.date || 'N/A',
      type: item.type || 'N/A',
      totalPages: item.totalPages ? item.totalPages.toString() : '0',
      amount: item.amount ? item.amount.toString() : '0'
    });
  });

  // Center-align all rows
  worksheet.eachRow(row => {
    row.alignment = { horizontal: 'center' };
  });

  // Save the Excel file
  await workbook.xlsx.writeFile(filePath);

  return filePath;
};



exports.sendEmail = async (filePath, fileName) => {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const emailSnapshot = await emailRef.once('value');
    let userData = emailSnapshot.val();
    const email = userData ? userData.email : null;

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
      to: email,
      subject: 'Exported Data PDF',
      text: 'Please find the attached PDF.',
      attachments: [{
        filename: fileName,
        content: fileBuffer,
        encoding: 'base64'
      }]
    };

    let info = await transporter.sendMail(mailOptions);
    await fs.unlink(filePath);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    throw new Error('Error sending email: ' + error.message);
  }
};

