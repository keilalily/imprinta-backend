const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

app.use(bodyParser.json());

const users = [
  { id: 1, username: 'Admin', email: '', password: bcrypt.hashSync('88888888', 8) }
];

// Endpoint for admin login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }
  const passwordIsValid = bcrypt.compareSync(password, user.password);
  if (!passwordIsValid) {
    return res.status(401).json({ message: 'Invalid password' });
  }
  const token = jwt.sign({ id: user.id }, 'secret-key', { expiresIn: 86400 });
  res.status(200).json({ auth: true, token });
});

// Endpoint to fetch current admin details
app.get('/getAdminDetails', (req, res) => {
  const admin = users.find(user => user.username === 'Admin');
  if (admin) {
    res.json({ email: admin.email, username: admin.username });
  } else {
    res.status(404).json({ message: 'Admin not found' });
  }
});

// Endpoint to update admin details
app.post('/updateAdminDetails', (req, res) => {
  const { email, username, newPassword, currentPassword } = req.body;
  const admin = users.find(user => user.username === 'Admin');
  if (admin && bcrypt.compareSync(currentPassword, admin.password)) {
    if (email) admin.email = email;
    if (username) admin.username = username;
    if (newPassword) admin.password = bcrypt.hashSync(newPassword, 8);
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Incorrect current password' });
  }
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { originalname, path: tempFilePath } = req.file;
    let pdfPath = tempFilePath;

    if (originalname.endsWith('.docx') || originalname.endsWith('.pptx')) {
      pdfPath = path.join('uploads', originalname.replace(path.extname(originalname), '.pdf'));
      const fileBuffer = await fs.readFile(tempFilePath);
      const pdfBuffer = await new Promise((resolve, reject) => {
        libre.convert(fileBuffer, '.pdf', undefined, (err, done) => {
          if (err) return reject(err);
          resolve(done);
        });
      });
      await fs.writeFile(pdfPath, pdfBuffer);
    }

    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    await fs.unlink(tempFilePath);

    const responseData = { fileName: originalname, pageCount, pdfBytes: pdfBytes.toString('base64') };
    res.json(responseData);
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

// Store the directory path and scanned image data temporarily
let scanData = {
  directory: null,
  imageData: null,
};

// Endpoint to handle scanning
app.post('/scan', async (req, res) => {
  try {
    const { paperSizeIndex, colorIndex, resolutionIndex } = req.body;

    // Initialize JSPrintManager
    const jsPrintManager = new JSPrintManager();

    // Check if JSPrintManager is available
    if (jsPrintManager.isJSPrintManagerInstalled()) {
      // Get the list of available scanners
      const scanners = jsPrintManager.getPrintersList().filter((printer) => printer.deviceType === 'Scanner');

      // Select a scanner (You can modify this logic based on scan settings)
      const selectedScanner = scanners[0]; // Select the first scanner for demonstration purposes

      // Configure scanning options based on Flutter's scan settings
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
        // Add more options as needed based on your scanning library's capabilities
      });

      // Scan document
      const scanResult = await jsPrintManager.scanDocument(selectedScanner);

      // Handle the scanned document
      scanData.imageData = scanResult.imageData; // Store the scanned image data temporarily

      // Respond with the scanned image data
      res.json({ imageData: scanData.imageData });
    } else {
      res.status(500).json({ error: 'JSPrintManager is not installed' });
    }
  } catch (error) {
    console.error('Error scanning document:', error);
    res.status(500).json({ error: 'Error scanning document' });
  }
});

// Endpoint to set the directory for saving the scanned file
app.post('/setScanDirectory', (req, res) => {
  try {
    const { directory } = req.body;
    if (!directory) {
      return res.status(400).json({ error: 'No directory provided' });
    }
    scanData.directory = directory;
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting directory:', error);
    res.status(500).json({ error: 'Error setting directory' });
  }
});

// Endpoint to upload the scanned image to the selected directory
app.post('/uploadScan', async (req, res) => {
  try {
    if (!scanData.directory || !scanData.imageData) {
      return res.status(400).json({ error: 'No scan data or directory available' });
    }

    const savePath = path.join(scanData.directory, `scanned_image_${Date.now()}.png`);

    // Save the scanned image to the specified directory
    await fs.writeFile(savePath, scanData.imageData, 'base64');

    // Clear the stored scan data
    scanData.directory = null;
    scanData.imageData = null;

    res.json({ success: true, filePath: savePath });
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
