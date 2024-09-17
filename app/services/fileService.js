require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const nodemailer = require('nodemailer');
const WebSocket = require('ws');
const { PDFDocument } = require('pdf-lib');
const { exec } = require('child_process');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');
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

exports.generatePDF = async (data, filePath) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.width;
  const centerX = pageWidth / 2;

  doc.setFontSize(20);
  doc.setFont('Times', 'bold');
  const title = 'Vendo Printing Machine';
  doc.text(title, centerX, 20, { align: 'center' }); 

  doc.setFontSize(14);
  doc.setFont('Times', 'normal');
  const subtitle = 'Sales Report';
  doc.text(subtitle, centerX, 30, { align: 'center' }); 
  const reportDate = `Date: ${new Date().toLocaleDateString()}`;
  doc.text(reportDate, centerX, 40, { align: 'center' }); 

  const columns = ['Transaction ID', 'Date/Time', 'Service', 'Total Pages', 'Total Amount'];
  const rows = data.map(item => [
    item.transactionId || 'N/A',
    item.date || 'N/A',
    item.type || 'N/A',
    item.totalPages ? item.totalPages.toString() : '0',
    item.amount ? item.amount.toString() : '0'
  ]);

  doc.autoTable({
    columns: columns.map(col => ({ header: col })),
    body: rows,
    startY: 50,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 10,
      cellPadding: 4,
      halign: 'center',
    },
    headStyles: {
      fillColor: [22, 160, 133],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    tableWidth: 'auto',
    theme: 'striped',
    didDrawPage: (data) => {
      doc.setFontSize(10);
      doc.setFont('Times', 'normal');
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
    },
  });

  doc.save(filePath);
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

