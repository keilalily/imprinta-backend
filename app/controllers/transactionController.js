const transactionService = require('../services/transactionService');

exports.saveTransaction = async (req, res) => { 
  const { date, amount, size, totalPages, type } = req.body; 

  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: 'numeric', 
    minute: 'numeric', 
    second: 'numeric', 
    hour12: true, 
    timeZoneName: 'short' 
  };

  const formattedDate = new Date(date).toLocaleString('en-US', options);

  const { success, error } = await transactionService.saveTransaction({ date: formattedDate, amount, size, totalPages, type });
  if (success) {
    return res.status(200).json({ message: 'Transaction saved successfully' });
  } else {
    return res.status(500).json({ error: 'Failed to save transaction', details: error });
  }
}; 

// // Function to save a scan 

// exports.saveScanTransaction = async (req, res) => { 

//   const { amount, size, type } = req.body; 

 

//   try { 

//     await firestore.collection('dailyReportSales').add({ 

//       date: admin.firestore.Timestamp.now(), 

//       amount, 

//       size, 

//       type 

//     }); 

//     return res.status(200).json({ message: 'Scan transaction saved successfully' }); 

//   } catch (error) { 

//     return res.status(500).json({ error: 'Failed to save transaction', details: error }); 

//   } 

// }; 

 

// // Function to save a photocopy 

// exports.saveCopyTransaction = async (req, res) => { 

//   const { amount, size, totalPages, type } = req.body; 

 

//   try { 

//     await firestore.collection('dailyReportSales').add({ 

//       date: admin.firestore.Timestamp.now(), 

//       amount, 

//       size, 

//       totalPages, 

//       type 

//     }); 

//     return res.status(200).json({ message: 'Copy transaction saved successfully' }); 

//   } catch (error) { 

//     return res.status(500).json({ error: 'Failed to save transaction', details: error }); 

//   } 

// };