const express = require('express'); //
const bodyParser = require('body-parser'); //
const bcrypt = require('bcryptjs'); //
const jwt = require('jsonwebtoken');//

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

app.use(bodyParser.json());

const users = [
 
  { id: 1, username: 'Admin', password: bcrypt.hashSync('88888888', 8) }
];

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

  const token = jwt.sign({ id: user.id }, 'secret-key', { expiresIn: 86400 }); // 24 hours
  res.status(200).json({ auth: true, token });
});

const IP_ADDRESS = '192.168.1.49';
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});





