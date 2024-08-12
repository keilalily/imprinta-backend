require('dotenv').config();
const nodemailer = require('nodemailer');
const { PDFDocument } = require('pdf-lib');
const { completeTransaction } = require('../utils/transaction');
const JSPM = require('jsprintmanager');

let scanData = {
  imageData: null,
  email: null
};

// exports.scanDocument = async (paperSizeIndex, colorIndex, resolutionIndex) => {
//   try {
//     await JSPM.JSPrintManager.start();

//     // if (JSPM.JSPrintManager.isJSPrintManagerInstalled()) {
//     if (JSPM.JSPrintManager.websocket_status === JSPM.WSStatus.Open) {
//       console.log("JSPrintManager is running and connected.");
//       const scanners = JSPM.JSPrintManager.getPrintersList().filter((printer) => printer.deviceType === 'Scanner');
//       const selectedScanner = scanners[0];

//       let paperSize = 'Letter';
//       if (paperSizeIndex === 1) {
//         paperSize = 'Legal';
//       }

//       let colorMode = 'Color';
//       if (colorIndex === 1) {
//         colorMode = 'Grayscale';
//       }

//       let resolution = 'High';
//       switch (resolutionIndex) {
//         case 1:
//           resolution = 'Medium';
//           break;
//         case 2:
//           resolution = 'Low';
//           break;
//         default:
//           break;
//       }

//       JSPM.JSPrintManager.setScanOptions({
//         paperSize: paperSize,
//         colorMode: colorMode,
//         resolution: resolution,
//       });

//       const scanResult = await JSPM.JSPrintManager.scanDocument(selectedScanner);
//       scanData.imageData = scanResult.imageData;

//       return { imageData: scanData.imageData };
//     } else {
//       throw new Error('JSPrintManager is not running.');
//     }
//   } catch (error) {
//     console.error("Error:", error.message);
//     throw new Error('Failed to initialize JSPrintManager or scan document.');
//   }
// };

async function createPdfFromImage(imageData, paperSizeIndex) {
  const pdfDoc = await PDFDocument.create();

  const paperSizes = [
    { width: 612, height: 792 }, // 8.5 x 11 inches
    { width: 612, height: 1008 }, // 8.5 x 14 inches
  ]

  const { width: pageWidth, height: pageHeight } = paperSizes[paperSizeIndex];

  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  const image = await pdfDoc.embedPng(imageData);
  const { width: imageWidth, height: imageHeight } = image.scale(1);

  // Calculate scaling to fit the image within the page dimensions
  const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;

  // Center the image on the page
  const x = (pageWidth - scaledWidth) / 2;
  const y = (pageHeight - scaledHeight) / 2;

  page.drawImage(image, {
    x,
    y,
    width: scaledWidth,
    height: scaledHeight,
  }); 

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

exports.sendScannedFile = async (email, imageData, paperSizeIndex) => {
  if (!email || !imageData) {
    throw new Error('Email or image data not provided');
  }

  const pdfBytes = await createPdfFromImage(imageData, paperSizeIndex);

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
