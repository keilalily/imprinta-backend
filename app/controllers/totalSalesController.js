// const { getTotalSales, updateTotalSales } = require('../services/salesService');

// exports.saveTransaction = async (req, res) => {
//   try {
//     const { date, amount, size, totalPages, type } = req.body;

//     // Fetch the current totalAmount from the database
//     const currentTotal = await getTotalSales();

//     // Compute the new totalAmount
//     const newTotal = currentTotal + amount;

//     // Update the totalAmount in the database
//     await updateTotalSales(newTotal);

//     // You can save the transaction data here if needed

//     res.status(200).send('Transaction saved and total amount updated');
//   } catch (error) {
//     res.status(500).send('Error saving transaction');
//   }
// };