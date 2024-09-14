// const { db } = require('../config/firebaseConfig');
// const ref = db.ref("/TotalSales");

// async function saveTotalPrintAmount(totalAmount) {
//   console.log(`Saving total amount ${totalAmount} to Realtime Database`); // Log total amount
//   try {
//     await ref.update({ totalPrint: totalAmount });
//     console.log('Total print amount saved to Realtime Database.');
//   } catch (error) {
//     console.error('Error saving total print amount:', error);
//     throw error;
//   }
// }

// module.exports = {
//   saveTotalPrintAmount
// };