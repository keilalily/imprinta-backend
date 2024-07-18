const nodemailer = require('nodemailer');

let scanData = {
  imageData: null,
  email: null
};

exports.scanDocument = async (paperSizeIndex, colorIndex, resolutionIndex) => {
  const jsPrintManager = new JSPrintManager();

  if (jsPrintManager.isJSPrintManagerInstalled()) {
    const scanners = jsPrintManager.getPrintersList().filter((printer) => printer.deviceType === 'Scanner');
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

    jsPrintManager.setScanOptions({
      paperSize: paperSize,
      colorMode: colorMode,
      resolution: resolution,
    });

    const scanResult = await jsPrintManager.scanDocument(selectedScanner);
    scanData.imageData = scanResult.imageData;

    return { imageData: scanData.imageData };
  }
  throw new Error('JSPrintManager is not installed');
};

exports.sendScannedFile = async (email, imageData) => {
  if (!email || !imageData) {
    throw new Error('Email or image data not provided');
  }

  let transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: 'your_email@example.com',
      pass: 'your_email_password',
    },
  });

  let mailOptions = {
    from: '"Vendo Printing Machine" <your_email@example.com>',
    to: email,
    subject: 'Your Scanned Document',
    text: 'Please find the scanned document attached.',
    attachments: [
      {
        filename: `scanned_image_${Date.now()}.png`,
        content: Buffer.from(imageData, 'base64'),
        encoding: 'base64',
      },
    ],
  };

  let info = await transporter.sendMail(mailOptions);

  scanData.imageData = null;
  scanData.email = null;

  return { success: true, messageId: info.messageId };
};
