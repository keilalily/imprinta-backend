require('dotenv').config();
const nodemailer = require('nodemailer');
const { completeTransaction } = require('../utils/transaction');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.scanDocument = async (paperSizeIndex, colorIndex, resolutionIndex) => {
  let pdfBytes;
  try {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    let paperSize = paperSizeIndex === 0 ? 'Letter' : 'Legal';
    let color = colorIndex === 0 ? 'Color' : 'Gray';
    let resolution = resolutionIndex === 0 ? '400' :
                      resolutionIndex === 1 ? '300' : '200';

    const outputFile = path.join(tempDir, `scanned_document_${Date.now()}.pdf`);
    console.log(`Output file path: ${outputFile}`);

    const naps2Path = process.env.NAPS2_PATH;
    // change yung name ng scanner, gamitin yung brother scanner ng dcp t70dw
    const scanCommand = `"${naps2Path}" --noprofile --output "${outputFile}" --driver "wia" --device "Brother Scanner c1" --dpi "${resolution}" --bitdepth "${color}" --pagesize "${paperSize}"`;

    console.log('Executing command:', scanCommand);
    await new Promise((resolve, reject) => {
      exec(scanCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          return reject(new Error('Failed to scan document.'));
        }
        if (stderr) {
          console.error(`Stderr: ${stderr}`);
          return reject(new Error('Error during scanning.'));
        }

        console.log('Scan completed successfully:', stdout);

        try {
          pdfBytes = fs.readFileSync(outputFile);
          console.log('PDF file successfully converted into bytes.');
          resolve();
        } catch (readError) {
          console.error('Failed to read scanned document:', readError.message);
          reject(new Error('Failed to read scanned document.'));
        }
      });
    });

    fs.unlink(outputFile, (err) => {
      if (err) {
        console.error('Failed to delete temporary file:', err.message);
      }
    });

    return { success: true, pdfBytes: pdfBytes.toString('base64') };
  } catch (error) {
    console.error("Error:", error.message);
    throw new Error('Failed to initialize scan document.');
  }
};

exports.sendScannedFile = async (email, fileData) => {
  if (!email || !fileData) {
    throw new Error('Email or image data not provided');
  }

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
    subject: 'Your Scanned Document',
    text: 'Please find the scanned document attached.',
    attachments: [
      {
        filename: `scanned_document_${Date.now()}.pdf`,
        content: Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData, 'base64'),
        encoding: 'base64',
      },
    ],
  };

  let info = await transporter.sendMail(mailOptions);

  // completeTransaction();
  return { success: true, messageId: info.messageId };
};
