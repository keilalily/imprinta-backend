require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const adminRoutes = require('./app/routes/adminRoutes');
const fileRoutes = require('./app/routes/fileRoutes');
const printRoutes = require('./app/routes/printRoutes');
const scanRoutes = require('./app/routes/scanRoutes');
const copyRoutes = require('./app/routes/copyRoutes');
const pricingRoutes = require('./app/routes/pricingRoutes');
const inventoryRoutes = require('./app/routes/inventoryRoutes');

// // Arduino Code
// const { initSerialPort, getPulseCount, getAmountInserted } = require('./app/services/arduinoService');
// const arduinoRoutes = require('./app/routes/arduinoRoutes');

const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));
// app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// app.use('/api', arduinoRoutes);

const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });

// initSerialPort(wss);

// wss.on('connection', (ws) => {
//   console.log('New client connected');
//   ws.send(JSON.stringify({ pulseCount: getPulseCount(), amountInserted: getAmountInserted() }));
// });

app.use('/admin', adminRoutes);
app.use('/file', fileRoutes);
app.use('/print', printRoutes);
app.use('/scan', scanRoutes);
app.use('/copy', copyRoutes);
app.use('/pricing', pricingRoutes);
app.use('/data', inventoryRoutes);

const IP_ADDRESS = process.env.IP_ADDRESS || '127.0.0.1'; // Localhost Default
const PORT = process.env.PORT || 3000;

server.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});
