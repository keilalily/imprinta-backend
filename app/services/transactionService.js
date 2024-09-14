const { firestore } = require('../config/firebaseConfig');
 

exports.saveTransaction = async (date, amount, size, totalPages, type) => { 
  try { 

    await firestore.collection('dailyReportSales').add(date, amount, size, totalPages, type); 

    return { success: true, message: 'Transaction saved successfully' }; 

  } catch (error) { 

    throw new Error('Failed to save transaction'); 

  } 

};