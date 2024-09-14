// transaction.js
const { port } = require('../config/serialConfig');

function completeTransaction() {
  // Send reset command to Arduino
  port.write('R', (err) => {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('Reset command sent');
  });
}

module.exports = {
  completeTransaction,
};
