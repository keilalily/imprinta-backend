const express = require('express');
const app = express();
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const libre = require('libreoffice-convert');
const { PDFDocument } = require('pdf-lib');
const http = require('http');
const WebSocket = require('ws');

const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use('/uploads', express.static('uploads'));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { originalname, path: tempFilePath } = req.file;

    let pdfPath = tempFilePath;

    if (originalname.endsWith('.docx') || originalname.endsWith('.pptx')) {
      pdfPath = path.join('uploads', originalname.replace(path.extname(originalname), '.pdf'));
      
      const fileBuffer = await fs.readFile(tempFilePath);
      const pdfBuffer = await new Promise((resolve, reject) => {
        libre.convert(fileBuffer, '.pdf', undefined, (err, done) => {
          if (err) {
            return reject(err);
          }
          resolve(done);
        });
      });

      await fs.writeFile(pdfPath, pdfBuffer);
    }

    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();

    await fs.unlink(tempFilePath);

    const responseData = {
      fileName: originalname,
      pageCount: pageCount,
      pdfBytes: pdfBytes.toString('base64')
    };

    res.json(responseData);

    // Broadcast the update to all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(responseData));
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file' });
  }
});

const IP_ADDRESS = '192.168.100.33';
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});