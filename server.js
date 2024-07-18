const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const adminRoutes = require('./app/routes/adminRoutes');
const fileRoutes = require('./app/routes/fileRoutes');
const scanRoutes = require('./app/routes/scanRoutes');

const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use('/admin', adminRoutes);
app.use('/file', fileRoutes);
app.use('/scan', scanRoutes);

const IP_ADDRESS = '192.168.100.33';
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});
