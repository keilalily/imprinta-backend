// const { parser } = require('../config/serialConfig');

// let pulseCount = 0;
// let amountInserted = 0.0;

// const initSerialPort = (wss) => {
//   parser.on('data', (data) => handleSerialData(data, wss));
// };

// const handleSerialData = (data, wss) => {
//   console.log('Received data:', data);
//   const matches = data.match(/Total Amount: (\d+)/);
//   if (matches) {
//     pulseCount = parseInt(matches[1], 10);
//     amountInserted = pulseCount; // 1 pulse = 1 peso
//     console.log('Pulse Count:', pulseCount);
//     console.log('Amount Inserted:', amountInserted);
//     wss.clients.forEach(client => {
//       if (client.readyState === WebSocket.OPEN) {
//         client.send(JSON.stringify({ "amountInserted": amountInserted }));
//       }
//     });
//   }
// };

// const getPulseCount = () => pulseCount;
// const getAmountInserted = () => amountInserted;

// module.exports = { initSerialPort, handleSerialData, getPulseCount, getAmountInserted };

// arduinoService.js

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

let pulseCount = 0;
let amountInserted = 0.0;

const initSerialPort = (wss) => {
  const port = new SerialPort('COM3', {
    baudRate: 9600,
  });

  const parser = port.pipe(new Readline({ delimiter: '\n' }));

  parser.on('data', (data) => {
    const pulses = parseInt(data.trim(), 10);
    pulseCount += pulses;
    amountInserted += pulses * 1.0; // Assuming 1 pulse equals 1 peso

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ pulseCount, amountInserted }));
      }
    });
  });
};

const getPulseCount = () => pulseCount;

const getAmountInserted = () => amountInserted;

const resetCounts = () => {
  pulseCount = 0;
  amountInserted = 0.0;
};

module.exports = {
  initSerialPort,
  getPulseCount,
  getAmountInserted,
  resetCounts,
};
