require('dotenv').config();
const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { completeTransaction } = require('../utils/transaction');
const JSPM = require('jsprintmanager');

let scanData = {
  imageData: null,
  email: null
};

exports.scanDocument = async (paperSizeIndex, colorIndex, resolutionIndex) => {
  try {
    await JSPM.JSPrintManager.start();

    // if (JSPM.JSPrintManager.isJSPrintManagerInstalled()) {
    if (JSPM.JSPrintManager.websocket_status === JSPM.WSStatus.Open) {
      console.log("JSPrintManager is running and connected.");
      const scanners = JSPM.JSPrintManager.getPrintersList().filter((printer) => printer.deviceType === 'Scanner');
      const selectedScanner = scanners[0];

      let paperSize = 'Letter';
      if (paperSizeIndex === 1) {
        paperSize = 'Legal';
      }

      let colorMode = 'Color';
      if (colorIndex === 1) {
        colorMode = 'Grayscale';
      }

      let resolution = 'High';
      switch (resolutionIndex) {
        case 1:
          resolution = 'Medium';
          break;
        case 2:
          resolution = 'Low';
          break;
        default:
          break;
      }

      JSPM.JSPrintManager.setScanOptions({
        paperSize: paperSize,
        colorMode: colorMode,
        resolution: resolution,
      });

      const scanResult = await JSPM.JSPrintManager.scanDocument(selectedScanner);
      scanData.imageData = scanResult.imageData;

      return { imageData: scanData.imageData };
    } else {
      throw new Error('JSPrintManager is not running.');
    }
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error('Failed to initialize JSPrintManager or scan document.');
  }
};

async function createPdfFromImage(imageData) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();

  const image = await pdfDoc.embedPng(imageData);
  const { width, height } = image.scale(1);

  page.drawImage(image, {
    x: 0,
    y: page.getHeight() - height,
    width,
    height,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

exports.sendScannedFile = async (email, imageData) => {
  if (!email || !imageData) {
    throw new Error('Email or image data not provided');
  }

  const pdfBytes = await createPdfFromImage(imageData);

  let transporter = nodemailer.createTransport({
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
    subject: 'Your Scanned Document',
    text: 'Please find the scanned document attached.',
    attachments: [
      {
        filename: `scanned_document_${Date.now()}.pdf`,
        content: pdfBytes,
        encoding: 'base64',
      },
    ],
  };

  let info = await transporter.sendMail(mailOptions);

  scanData.imageData = null;
  scanData.email = null;
  completeTransaction();
  return { success: true, messageId: info.messageId };
};
