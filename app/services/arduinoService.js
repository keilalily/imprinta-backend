// const { parser } = require('../config/serialConfig');
// const WebSocket = require('ws');

// let pulseCount = 0;
// let amountInserted = 0.0;

// const initSerialPort = (wss) => {
//   parser.on('data', (data) => handleSerialData(data, wss));
// };

// const handleSerialData = (data, wss) => {
//   console.log('Received data:', data);
//   // const matches = data.match(/Total Amount: (\d+)/);
//   // if (matches) {
//   //   pulseCount = parseInt(matches[1], 10);
//   //   amountInserted = pulseCount; // 1 pulse = 1 peso
//   //   console.log('Pulse Count:', pulseCount);
//   //   console.log('Amount Inserted:', amountInserted);
//   //   wss.clients.forEach(client => {
//   //     if (client.readyState === WebSocket.OPEN) {
//   //       client.send(JSON.stringify({ "amountInserted": amountInserted }));
//   //     }
//   //   });
//   // }
//   const message = data.toString().trim();

//   if (message.startsWith('Total Amount:')) {
//     const matches = message.match(/Total Amount: (\d+)/);
//     if (matches) {
//       pulseCount = parseInt(matches[1], 10);
//       amountInserted = pulseCount; // 1 pulse = 1 peso
//       console.log('Pulse Count:', pulseCount);
//       console.log('Amount Inserted:', amountInserted);
//       wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify({ amountInserted }));
//         }
//       });
//     }
//   } else if (message.startsWith('Reset Complete:')) {
//     const matches = message.match(/Reset Complete: (\d+)/);
//     if (matches) {
//       pulseCount = parseInt(matches[1], 10);
//       amountInserted = pulseCount; // Reset amount
//       console.log('Reset Pulse Count:', pulseCount);
//       console.log('Reset Amount Inserted:', amountInserted);
//       wss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//           client.send(JSON.stringify({ amountInserted }));
//         }
//       });
//     }
//   }
// };

// const getPulseCount = () => pulseCount;
// const getAmountInserted = () => amountInserted;

// module.exports = { initSerialPort, handleSerialData, getPulseCount, getAmountInserted };
