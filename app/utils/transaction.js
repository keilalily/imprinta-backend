const { port } = require('../config/serialConfig');

function completeTransaction() {
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
