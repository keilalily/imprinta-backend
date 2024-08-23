require('dotenv').config();
const nodemailer = require('nodemailer');
// const { PDFDocument } = require('pdf-lib');
const { completeTransaction } = require('../utils/transaction');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// let scanData = {
//   fileData: null,
//   email: null
// };

exports.scanDocument = async (paperSizeIndex, colorIndex, resolutionIndex) => {
  let pdfBytes;
  try {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    let paperSize = paperSizeIndex === 0 ? 'Letter' : 'Legal';
    let color = colorIndex === 0 ? 'Color' : 'Grayscale';
    let resolution = resolutionIndex === 0 ? '400' :
                      resolutionIndex === 1 ? '300' : '200';

    const outputFile = path.join(tempDir, `scanned_document_${Date.now()}.pdf`);
    console.log(`Output file path: ${outputFile}`);

    const naps2Path = process.env.NAPS2_PATH;

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

        // Read the PDF file into a buffer
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

    // Optionally, clean up the temporary file
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

// async function createPdfFromImage(imageData, paperSizeIndex) {
//   const pdfDoc = await PDFDocument.create();

//   const paperSizes = [
//     { width: 612, height: 792 }, // 8.5 x 11 inches
//     { width: 612, height: 1008 }, // 8.5 x 14 inches
//   ]

//   const { width: pageWidth, height: pageHeight } = paperSizes[paperSizeIndex];

//   const page = pdfDoc.addPage([pageWidth, pageHeight]);

//   const image = await pdfDoc.embedPng(imageData);
//   const { width: imageWidth, height: imageHeight } = image.scale(1);

//   // Calculate scaling to fit the image within the page dimensions
//   const scale = Math.min(pageWidth / imageWidth, pageHeight / imageHeight);
//   const scaledWidth = imageWidth * scale;
//   const scaledHeight = imageHeight * scale;

//   // Center the image on the page
//   const x = (pageWidth - scaledWidth) / 2;
//   const y = (pageHeight - scaledHeight) / 2;

//   page.drawImage(image, {
//     x,
//     y,
//     width: scaledWidth,
//     height: scaledHeight,
//   }); 

//   const pdfBytes = await pdfDoc.save();
//   return pdfBytes;
// }

// exports.sendScannedFile = async (email, imageData, paperSizeIndex) => {
//   if (!email || !imageData) {
//     throw new Error('Email or image data not provided');
//   }

//   const pdfBytes = await createPdfFromImage(imageData, paperSizeIndex);

//   let transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     secure: process.env.SMTP_SECURE === 'true',
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });

//   let mailOptions = {
//     from: `"Vendo Printing Machine" <${process.env.SMTP_USER}>`,
//     to: email,
//     subject: 'Your Scanned Document',
//     text: 'Please find the scanned document attached.',
//     attachments: [
//       {
//         filename: `scanned_document_${Date.now()}.pdf`,
//         content: pdfBytes,
//         encoding: 'base64',
//       },
//     ],
//   };

//   let info = await transporter.sendMail(mailOptions);

//   scanData.imageData = null;
//   scanData.email = null;
//   completeTransaction();
//   return { success: true, messageId: info.messageId };
// };

exports.sendScannedFile = async (email, imageData) => {
  if (!email || !imageData) {
    throw new Error('Email or image data not provided');
  }

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
        content: imageData,
        encoding: 'base64',
      },
    ],
  };

  let info = await transporter.sendMail(mailOptions);

  // scanData.imageData = null;
  // scanData.email = null;
  completeTransaction();
  return { success: true, messageId: info.messageId };
};
