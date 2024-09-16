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
const transactionRoutes = require('./app/routes/transactionRoutes');
const { setWebSocketServer } = require('./app/services/fileService');

const salesService = require('./app/services/salesService');
const salesRoutes = require('./app/routes/salesRoutes');

const cron = require('node-cron');

//const totalSalesRoutes = require('./app/routes/totalSalesRoutes');



// // Arduino Code
// const { initSerialPort, getPulseCount, getAmountInserted } = require('./app/services/arduinoService');
// const arduinoRoutes = require('./app/routes/arduinoRoutes');


const app = express();
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// app.use('/api', arduinoRoutes);

app.use('/api/sales', salesRoutes);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Initialize Arduino and File Service with the WebSocket server
// initSerialPort(wss);
setWebSocketServer(wss);

// wss.on('connection', (ws) => {
//   console.log('New client connected');
//   ws.send(JSON.stringify({ pulseCount: getPulseCount(), amountInserted: getAmountInserted() }));
// });

cron.schedule('5 23 * * *', async () => {
  console.log('Cron job running at 11:05 PM');
  try {
    const salesData = await salesService.fetchSalesData();
    console.log('Sales data fetched:', salesData);

    await salesService.sendSalesEmail(salesData);
    console.log('Email sent successfully');

    await salesService.resetSalesData();
    console.log('Daily sales report sent and sales data reset!');
  } catch (error) {
    console.error('Error sending daily sales report or resetting sales data:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Manila" // Adjust this to your desired timezone
});


app.use('/admin', adminRoutes);
app.use('/file', fileRoutes);
app.use('/print', printRoutes);
app.use('/scan', scanRoutes);
app.use('/copy', copyRoutes);
app.use('/pricing', pricingRoutes);
app.use('/data', inventoryRoutes);
app.use('/transaction', transactionRoutes);
app.use('/sales', salesRoutes);

const IP_ADDRESS = process.env.IP_ADDRESS || '127.0.0.1'; // Localhost Default
const PORT = process.env.PORT || 3000;

server.listen(PORT, IP_ADDRESS, () => {
  console.log(`Server is running on http://${IP_ADDRESS}:${PORT}`);
});
